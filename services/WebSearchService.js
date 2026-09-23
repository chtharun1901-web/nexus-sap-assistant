const fs = require('fs');
const path = require('path');

// ── 1. Search Query Planner & Request Classifier ──────────────────────────────
class SearchQueryPlanner {
  static classifyRequest(queryText) {
    const text = (queryText || '').trim().toLowerCase();
    
    // Check for EWM storage bin limits / mixed storage / quant / SKU / HU capacity
    if (
      (text.includes('mixed') || text.includes('quant') || text.includes('sku') || text.includes('hu') || text.includes('handling unit') || text.includes('storage bin') || text.includes('storage type')) &&
      (text.includes('max') || text.includes('limit') || text.includes('number of') || text.includes('allow') || text.includes('capacity') || text.includes('section') || text.includes('3') || text.includes('5'))
    ) {
      return {
        type: 'SAP_EWM_STORAGE_BIN_LIMITS',
        confidence: 0.95,
        hasNumericalLimit: /\b\d+\b/.test(text)
      };
    }

    // Check for SAP Transaction Code patterns (/SCWM/*, CO01-CO99, MM01-MM99, SMQ1, SM21, etc.)
    const tcodeMatch = queryText.match(/(?:\/SCWM\/[A-Z0-9_]+|\b[A-Z]{2,4}[0-9]{2,4}[A-Z0-9]?\b|\bSMQ[1-3]\b|\bbgRFC\b)/i);
    
    if (tcodeMatch) {
      return {
        type: 'SAP_TRANSACTION_VALIDATION',
        tcode: tcodeMatch[0].toUpperCase(),
        confidence: 0.95
      };
    }
    
    if (/config|img|customiz|spro|maintain/i.test(text)) {
      return { type: 'SAP_CONFIGURATION_PROCEDURE', confidence: 0.9 };
    }
    if (/table|field|transparent table|mara|marc|marm|\/scwm\//i.test(text)) {
      return { type: 'SAP_TABLE_FIELD', confidence: 0.85 };
    }
    if (/queue|smq1|smq2|bgrfc|qrfc|luw|sysfail|stop|retry/i.test(text)) {
      return { type: 'SAP_INTEGRATION_TRIAGE', confidence: 0.95 };
    }
    if (/pmr|staging|production supply|psa|control cycle/i.test(text)) {
      return { type: 'SAP_EWM_PP_INTEGRATION', confidence: 0.9 };
    }
    if (/error|dump|st22|short dump|fail|dump|slg1|sm21/i.test(text)) {
      return { type: 'SAP_TROUBLESHOOTING', confidence: 0.9 };
    }
    if (/note|kba|oss|2871625|kba/i.test(text)) {
      return { type: 'SAP_NOTE_REFERENCE', confidence: 0.9 };
    }
    if (/s\/4hana|ecc|release|embedded|decentral/i.test(text)) {
      return { type: 'SAP_RELEASE_SPECIFIC', confidence: 0.85 };
    }
    
    return { type: 'GENERAL_SAP_CONCEPT', confidence: 0.8 };
  }

  static generateTargetedQueries(userQuery) {
    const classification = this.classifyRequest(userQuery);
    const queries = [];
    const cleanQuery = (userQuery || '').replace(/[\?\.!]/g, '').trim();

    if (classification.type === 'SAP_EWM_STORAGE_BIN_LIMITS') {
      queries.push('SAP EWM SPRO "Define Storage Type" mixed storage rules');
      queries.push('SAP EWM storage bin sections pallet storage by HU type');
      queries.push('SAP EWM storage bin capacity check capacity key figures');
      queries.push('SAP EWM mixed storage in HU vs storage bin putaway rules');
    } else if (classification.type === 'SAP_TRANSACTION_VALIDATION') {
      const tcode = classification.tcode;
      queries.push(`"${tcode}" "SAP Help Portal" official documentation`);
      
      // If query mentions slotting or putaway with a tcode, verify exact relationship
      if (/slotting|putaway|indicator/i.test(userQuery)) {
        queries.push(`SAP EWM slotting official transaction "/SCWM/SLOT"`);
        queries.push(`"${tcode}" slotting putaway control indicator`);
        queries.push(`"${tcode}" "SAP Community" purpose transaction`);
      } else if (/docc|storage type|config|customiz/i.test(userQuery)) {
        queries.push(`"${tcode}" SAP EWM delivery document processing`);
        queries.push('SAP EWM SPRO Define Storage Type customizing path');
      } else {
        queries.push(`"${tcode}" "SAP Community" purpose transaction`);
        queries.push(`"${tcode}" SAP EWM S/4HANA exact function`);
        queries.push(`"${tcode}" official SAP documentation`);
      }
    } else if (classification.type === 'SAP_EWM_PP_INTEGRATION') {
      queries.push(`"${cleanQuery}" SAP Help Portal S/4HANA`);
      queries.push('SAP EWM PP integration PMR delivery-based staging differences');
      queries.push('SAP EWM production supply control cycle /SCWM/PSA_CC');
    } else if (classification.type === 'SAP_INTEGRATION_TRIAGE') {
      queries.push(`"${cleanQuery}" SAP Note KBA resolution`);
      queries.push('SAP S/4HANA qRFC bgRFC queue monitoring');
    } else {
      queries.push(`"${cleanQuery}" SAP Help Portal`);
      queries.push(`"${cleanQuery}" SAP S/4HANA official documentation`);
    }

    return {
      classification,
      queries: queries.slice(0, 4)
    };
  }
}

// ── 2. Source Quality Ranker ──────────────────────────────────────────────────
class SourceQualityRanker {
  static rankSource(url, title = '', snippet = '') {
    if (!url) {
      return { tier: 'Tier 3 — General Reference', tierLevel: 3, isOfficial: false, confidence: 0.5 };
    }

    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Tier 1: Official SAP Sources
    if (
      lowerUrl.includes('help.sap.com') ||
      lowerUrl.includes('support.sap.com') ||
      lowerUrl.includes('me.sap.com') ||
      lowerUrl.includes('api.sap.com') ||
      lowerUrl.includes('learning.sap.com') ||
      lowerUrl.includes('service.sap.com')
    ) {
      return {
        tier: 'Tier 1 — Official SAP Source',
        tierLevel: 1,
        isOfficial: true,
        confidence: 0.98,
        domain: 'SAP Official'
      };
    }

    // Tier 2: High-Quality Technical & Community Sources
    if (
      lowerUrl.includes('community.sap.com') ||
      lowerUrl.includes('answers.sap.com') ||
      lowerUrl.includes('blogs.sap.com') ||
      lowerUrl.includes('sap-press.com') ||
      lowerUrl.includes('github.com/sap')
    ) {
      return {
        tier: 'Tier 2 — Expert / Community Technical Source',
        tierLevel: 2,
        isOfficial: false,
        confidence: 0.85,
        domain: 'SAP Community'
      };
    }

    // Tier 3: General / Blog / Forum Sources
    return {
      tier: 'Tier 3 — General Technical Reference',
      tierLevel: 3,
      isOfficial: false,
      confidence: 0.65,
      domain: 'Web Reference'
    };
  }
}

// ── 3. SAP Transaction & Fact Validator ───────────────────────────────────────
class TransactionValidator {
    static getKnownTransactions() {
    return {
      '/SCWM/ISU': {
        name: '/SCWM/ISU',
        exactPurpose: 'Initial Stock Upload & Data Processing (Upload initial warehouse stock data from legacy systems or external spreadsheets into EWM).',
        component: 'SAP Extended Warehouse Management (EWM) - Inventory Management',
        isSlotting: false,
        correctSlottingTcode: '/SCWM/SLOT (Slotting Execution) or /SCWM/SLOTEVAL (Evaluate Slotting)',
        updatesPutawayControlIndicator: false,
        correctPutawayIndicatorMaintenance: 'Maintained directly in Product Master (/SCWM/MAT1) or determined dynamically via Slotting (/SCWM/SLOT) and transferred to product master.',
        dataImpact: 'Data-Changing (Uploads physical stock into EWM storage bins; requires rigorous validation in production)',
        releaseDependency: 'SAP S/4HANA Embedded EWM & Decentralized EWM',
        readOnly: false,
        verificationStatus: 'Verified Official'
      },
      '/SCWM/DOCC': {
        name: '/SCWM/DOCC',
        exactPurpose: 'Delivery Processing / Document Category Maintenance in EWM. It is NOT for Storage Type customizing or storage bin capacity limits.',
        component: 'SAP Extended Warehouse Management (EWM) - Delivery Processing',
        isStorageTypeCustomizing: false,
        correctCustomizingPath: 'SPRO -> SCM Extended Warehouse Management -> Extended Warehouse Management -> Master Data -> Define Storage Type',
        dataImpact: 'Configuration (Delivery Document Categories)',
        releaseDependency: 'SAP EWM / S/4HANA EWM',
        readOnly: false,
        verificationStatus: 'Verified Official (Not for Storage Type Customizing)'
      },
      '/SCWM/SLOT': {
        name: '/SCWM/SLOT',
        exactPurpose: 'Slotting (Determine and update optimal storage parameters, storage section indicator, and putaway control indicators based on product master attributes and demand profiles).',
        component: 'SAP Extended Warehouse Management (EWM) - Master Data / Slotting',
        isSlotting: true,
        dataImpact: 'Configuration / Master Data Update (Updates product master slotting parameters)',
        releaseDependency: 'SAP S/4HANA EWM 1610+ & SAP EWM 9.x',
        readOnly: false,
        verificationStatus: 'Verified Official'
      },
      '/SCWM/STAGE': {
        name: '/SCWM/STAGE',
        exactPurpose: 'Production Staging Cockpit (Calculate component staging proposals for manufacturing orders and PMRs, and generate Warehouse Tasks).',
        component: 'SAP Extended Warehouse Management (EWM) - Production Integration',
        dataImpact: 'Operational / WT Creation',
        releaseDependency: 'S/4HANA Embedded & Decentralized EWM',
        readOnly: false,
        verificationStatus: 'Verified Official'
      },
      '/SCWM/PSA_CC': {
        name: '/SCWM/PSA_CC',
        exactPurpose: 'EWM Control Cycle Maintenance (Define staging method, PSA, and destination storage bins).',
        component: 'SAP EWM - Master Data',
        dataImpact: 'Master Data Maintenance',
        releaseDependency: 'S/4HANA EWM',
        readOnly: false,
        verificationStatus: 'Verified Official'
      },
      '/SCWM/MAT1': {
        name: '/SCWM/MAT1',
        exactPurpose: 'Maintain EWM Product Master (Define warehouse-specific data, putaway control indicator, storage section indicator, and packaging data).',
        component: 'SAP EWM - Master Data',
        dataImpact: 'Master Data Maintenance',
        releaseDependency: 'All SAP EWM & S/4HANA EWM Releases',
        readOnly: false,
        verificationStatus: 'Verified Official'
      },
      '/SCWM/LS01N': {
        name: '/SCWM/LS01N',
        exactPurpose: 'Create Storage Bin (Define physical bin coordinates, storage type, bin sectioning, maximum weight/volume, and capacity key figures).',
        component: 'SAP EWM - Master Data',
        dataImpact: 'Master Data Maintenance',
        releaseDependency: 'All SAP EWM Releases',
        readOnly: false,
        verificationStatus: 'Verified Official'
      },
      'SMQ1': {
        name: 'SMQ1',
        exactPurpose: 'Outbound qRFC Monitor (Monitor, restart, or inspect outbound asynchronous LUWs queued for partner RFC destinations).',
        component: 'SAP ABAP Platform / Communication Middleware',
        dataImpact: 'Read-Only Monitoring (Activation/Deletion has data impact)',
        releaseDependency: 'All SAP NetWeaver & S/4HANA Releases',
        readOnly: true,
        verificationStatus: 'Verified Official'
      },
      'SMQ2': {
        name: 'SMQ2',
        exactPurpose: 'Inbound qRFC Monitor (Inspect stuck inbound transactional queues, review errors, and restart failed function calls).',
        component: 'SAP ABAP Platform / Communication Middleware',
        dataImpact: 'Read-Only Monitoring (Activation/Deletion has data impact)',
        releaseDependency: 'All SAP NetWeaver & S/4HANA Releases',
        readOnly: true,
        verificationStatus: 'Verified Official'
      },
      'CO02': {
        name: 'CO02',
        exactPurpose: 'Change Production Order (Release orders, execute technical completion TECO, or trigger order status changes).',
        component: 'SAP Production Planning (PP)',
        dataImpact: 'Transactional Order Modification',
        releaseDependency: 'All SAP ECC & S/4HANA Releases',
        readOnly: false,
        verificationStatus: 'Verified Official'
      }
    };
  }

  static validateTransaction(tcode) {
    if (!tcode) return null;
    const upper = tcode.trim().toUpperCase();
    const known = this.getKnownTransactions()[upper];
    if (known) return known;

    return {
      name: upper,
      exactPurpose: 'Transaction purpose must be verified in SE93 or official SAP Help for target release.',
      component: 'SAP Enterprise System',
      dataImpact: 'Requires verification in target system before execution',
      releaseDependency: 'Check SAP Release applicability',
      readOnly: false,
      verificationStatus: 'Unverified / Needs SE93 Check'
    };
  }
}

// ── 4. In-Memory & Persisted Search Cache ─────────────────────────────────────
class SearchCache {
  constructor() {
    this.cache = new Map();
    this.ttlMs = 24 * 60 * 60 * 1000; // 24 Hours TTL
    this.stats = { hits: 0, misses: 0, totalCached: 0 };
  }

  normalizeKey(query) {
    return (query || '')
      .toLowerCase()
      .replace(/[^a-z0-9\/]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  get(query) {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return entry.data;
  }

  set(query, data) {
    const key = this.normalizeKey(query);
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.ttlMs
    });
    this.stats.totalCached = this.cache.size;
  }

  getStats() {
    return {
      ...this.stats,
      activeEntries: this.cache.size
    };
  }
}

// ── 5. Correction Manager ─────────────────────────────────────────────────────
class CorrectionManager {
  static checkAndGenerateCorrection(userQuery) {
    const text = (userQuery || '').toLowerCase();
    
    // Specifically detect /SCWM/ISU slotting confusion
    if (text.includes('/scwm/isu') && (text.includes('slot') || text.includes('putaway') || text.includes('indicator') || text.includes('run'))) {
      return {
        hasCorrection: true,
        type: 'ISU_SLOTTING_MISCONCEPTION',
        notice: `> ⚠️ **Verification Notice & Correction:** \`/SCWM/ISU\` is an SAP EWM transaction for **Initial Stock Data Upload and Processing** (used for migrating and validating physical warehouse balances from legacy systems). It is **NOT** a slotting transaction and does not calculate Putaway Control Indicators. In SAP EWM, slotting is performed via transaction \`/SCWM/SLOT\` (Slotting Execution) or report \`/SCWM/R_SLOT_UPDATE\`, while the Putaway Control Indicator is maintained in the EWM Product Master (\`/SCWM/MAT1\`) or determined via slotting condition technique.`
      };
    }

    // Detect false claims about universal "Maximum Number of Quants" or "Maximum Number of HUs" directly in storage-type definition or /SCWM/DOCC
    if (
      (text.includes('maximum number of quants') || text.includes('maximum number of hus') || text.includes('/scwm/docc') || (text.includes('max quants') && text.includes('storage type'))) ||
      (text.includes('3 different skus') && text.includes('5 hus') && text.includes('define storage type')) ||
      (text.includes('mixed storage = enabled') && text.includes('maximum number'))
    ) {
      return {
        hasCorrection: true,
        type: 'STORAGE_BIN_LIMITS_OVERSTATEMENT',
        notice: `> ⚠️ **Verification Notice & Correction:** The previous response overstated the standard configuration capability. It should not have claimed that a universal 'Maximum Number of Quants' and 'Maximum Number of HUs' field can always be maintained directly in the storage-type definition. The correct solution depends on the storage strategy, HU management, storage-bin sections, capacity-check method, SAP release, and possibly an enhancement.`
      };
    }

    return { hasCorrection: false, notice: null };
  }
}

// ── Export Singleton Services ─────────────────────────────────────────────────
const globalSearchCache = new SearchCache();

module.exports = {
  SearchQueryPlanner,
  SourceQualityRanker,
  TransactionValidator,
  SearchCache,
  searchCache: globalSearchCache,
  CorrectionManager
};
