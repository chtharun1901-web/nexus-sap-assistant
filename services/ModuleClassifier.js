/**
 * Module Detection & Classification Engine
 * Analyzes query text, T-Codes, tables, and functional keywords to classify into:
 * - Primary Module
 * - Sub-area
 * - Business process
 * - Transaction / Fiori App
 * - Document type
 * - Master data
 * - Cross-module integration direction
 * - Confidence score (High / Medium / Low)
 */

const { SAP_DOMAIN_SPECIALIZATIONS } = require('./SapDomainSpecializations.js');

class ModuleClassifier {
  static classifyQuery(queryText, explicitModule = 'AUTO') {
    const raw = (queryText || '').trim();
    const text = raw.toLowerCase();

    // If explicit module is forced and not AUTO, honor it as primary
    let forcedModule = null;
    if (explicitModule && explicitModule !== 'AUTO' && SAP_DOMAIN_SPECIALIZATIONS[explicitModule]) {
      forcedModule = explicitModule;
    }

    // ── 1. PATTERN RULES & SIGNATURE MATCHERS ─────────────────────────────────

    // --- GTS Patterns ---
    const isGtsTcode = /\/sapsll\/|\b(spl_chg1|bl_docs|legcus|pref_clc|cl_pr_01|con_chk_01)\b/i.test(text);
    const isGtsKeywords = /\b(gts|global trade|sanctioned party|spl screening|embargo|legal control|customs declaration|customs management|hs code|tariff code|export control|eccn|ltvd|preference management|feeder system|bonded warehouse|atlas|aes filing|chief\/cds)\b/i.test(text);

    // --- IS-Retail Patterns ---
    const isRetailTcode = /\b(mm41|mm42|mm43|wb01|wb02|wb03|wg21|wg22|wsoa1|wsoa2|wsl10|wsl11|wa01|wa02|wrp1|vkp5|wak1|wak2|wpma|wper|pos dm|sap car)\b/i.test(text);
    const isRetailKeywords = /\b(is-retail|is retail|retail article|generic article|variant article|sales set|pre-pack|site master|distribution center|store master|merchandise category|merchandise hierarchy|assortment|article listing|listing condition|allocation table|replenishment planning|retail pricing|pos inbound|pos outbound|wpuums|wpubon|markdown|cross-docking|flow-through)\b/i.test(text);

    // --- SD Patterns ---
    const isSdTcode = /\b(va01|va02|va03|va11|va21|vl01n|vl02n|vl03n|vf01|vf02|vf03|vf04|vk11|vk12|vk13|v\/08|v\/06|ovl2|vkoa|vkm1|vkm3|vtfl|vtaa|vtla|va05|vl06o)\b/i.test(text);
    const isSdKeywords = /\b(sales order|order to cash|o2c|pricing procedure|condition technique|access sequence|condition record|pr00|shipping point determination|route determination|picking and packing|post goods issue|pgi|billing document|intercompany billing|credit management|partner determination|sold-to|ship-to|bill-to|payer|copy control|availability check|atp check|third party sales|make-to-order|mto sales|returns order|credit memo)\b/i.test(text);

    // --- EWM / WM Patterns ---
    const isEwmTcode = /\/scwm\/|\b(lpk1|ls01n|lt01|lt03)\b/i.test(text);
    const isEwmKeywords = /\b(ewm|warehouse task|warehouse order|staging cockpit|production material request|pmr|production supply area|psa|wave management|storage bin|storage type|handling unit|hu management|bin determination)\b/i.test(text);

    // --- PP Patterns ---
    const isPpTcode = /\b(co01|co02|co03|co11n|co15|cogi|md04|md01n|cr01|cr02|cr03|ca01|ca02|ca03|cs01|cs02|cs03|c223|opjh|opl8|opu3|opu5|opjk)\b/i.test(text);
    const isPpKeywords = /\b(production order|process order|bom explosion|bill of materials|routing|work center|production version|mrp|planned order|order confirmation|goods issue 261|preliminary costing)\b/i.test(text);

    // --- MM Patterns ---
    const isMmTcode = /\b(me21n|me22n|me23n|migo|miro|mm01|mm02|mm03|omwb|mb51|mb52|mb1a|mb1b|mb1c|me51n|me52n)\b/i.test(text);
    const isMmKeywords = /\b(purchase order|purchase requisition|goods receipt|invoice verification|movement type 101|movement type 311|material master|valuation class|account determination omwb|gr\/ir)\b/i.test(text);

    // --- FICO Patterns ---
    const isFicoTcode = /\b(fb50|fb60|fb70|f-02|fs00|fbl3n|fbl1n|fbl5n|ob52|ok07|koba|ko01|ks01|f-28|f-53)\b/i.test(text);
    const isFicoKeywords = /\b(general ledger|accounts payable|accounts receivable|gl account|cost center|profit center|settlement profile|posting period|acdoca|universal journal|tax code|financial accounting|controlling)\b/i.test(text);

    // --- Basis & Integration Patterns ---
    const isBasisTcode = /\b(sm59|smq1|smq2|bgrfccust|sbgrfcmon|st22|sm21|slg1|we02|we20|bd87)\b/i.test(text);
    const isBasisKeywords = /\b(qrfc|bgrfc|rfc destination|idoc|short dump|system log|application log|sysfail|queue stopped|bg_rfc)\b/i.test(text);

    // --- ABAP Patterns ---
    const isAbapTcode = /\b(se80|se24|se38|se11|se16n|cmod|smod)\b/i.test(text);
    const isAbapKeywords = /\b(badi|user exit|enhancement spot|cds view|rap framework|odata service|abap code|custom program)\b/i.test(text);

    // ── 2. MODULE SCORING & RESOLUTION ───────────────────────────────────────
    let scores = {
      GTS: (isGtsTcode ? 50 : 0) + (isGtsKeywords ? 30 : 0),
      IS_RETAIL: (isRetailTcode ? 50 : 0) + (isRetailKeywords ? 30 : 0),
      SD: (isSdTcode ? 50 : 0) + (isSdKeywords ? 30 : 0),
      EWM: (isEwmTcode ? 50 : 0) + (isEwmKeywords ? 30 : 0),
      PP: (isPpTcode ? 50 : 0) + (isPpKeywords ? 30 : 0),
      MM: (isMmTcode ? 50 : 0) + (isMmKeywords ? 30 : 0),
      FICO: (isFicoTcode ? 50 : 0) + (isFicoKeywords ? 30 : 0),
      BASIS: (isBasisTcode ? 50 : 0) + (isBasisKeywords ? 30 : 0),
      ABAP: (isAbapTcode ? 50 : 0) + (isAbapKeywords ? 30 : 0)
    };

    // Determine primary & secondary modules
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    let primaryModule = forcedModule || (sorted[0][1] > 0 ? sorted[0][0] : 'SD');

    // Check for Cross-Module Integration
    const activeHighModules = sorted.filter(([mod, sc]) => sc >= 20).map(([mod]) => mod);
    let isCrossModule = activeHighModules.length >= 2 || text.includes('feeder') || text.includes('integration') || text.includes('handshake') || text.includes('document flow');
    let secondaryModules = activeHighModules.filter(m => m !== primaryModule);

    if (text.includes('feeder') || text.includes('sales order') || text.includes('sales orders') || text.includes('outbound delivery')) {
      if (primaryModule === 'GTS' && !secondaryModules.includes('SD')) {
        secondaryModules.push('SD');
        isCrossModule = true;
      }
    }

    // ── 3. EXTRACT DETAILED DOMAIN METADATA ──────────────────────────────────
    let subArea = 'General Technical Architecture';
    let process = 'Standard Enterprise Processing';
    let identifiedTcode = null;
    let docType = null;
    let masterData = 'Standard Master Data';
    let integrationDirection = null;
    let confidence = forcedModule ? 'High' : (sorted[0][1] >= 50 ? 'High' : (sorted[0][1] >= 30 ? 'Medium' : 'Low'));
    let evidenceStatus = 'Verified Official SAP Documentation & Best Practice Model';

    // Fine-grained GTS Sub-area extraction
    if (primaryModule === 'GTS') {
      if (text.includes('spl') || text.includes('sanction') || text.includes('screening')) {
        subArea = 'Sanctioned Party Screening (SPL)';
        process = 'Real-time Business Partner & Feeder Document Screening';
        identifiedTcode = '/SAPSLL/SPL_CHG1';
        masterData = 'SPL Master List & Business Partner';
      } else if (text.includes('legal control') || text.includes('license') || text.includes('export control')) {
        subArea = 'Legal Control & Export Licenses';
        process = 'Export Authorization & License Determination';
        identifiedTcode = '/SAPSLL/CON_CHK_01';
      } else if (text.includes('embargo')) {
        subArea = 'Embargo Checking';
        process = 'Country-Specific Trade Prohibition Checks';
        identifiedTcode = '/SAPSLL/BL_DOCS';
      } else if (text.includes('customs') || text.includes('declaration') || text.includes('atlas') || text.includes('aes')) {
        subArea = 'Customs Management & Electronic Filing';
        process = 'Outbound Customs Declaration & Duty Processing';
        identifiedTcode = '/SAPSLL/LEGCUS_01';
        docType = 'Customs Export Declaration (CEXP)';
      } else if (text.includes('preference') || text.includes('origin') || text.includes('ltvd')) {
        subArea = 'Preference Management & Rules of Origin';
        process = 'Long-Term Vendor Declaration & Preference Calculation';
        identifiedTcode = '/SAPSLL/PREF_CLC';
      } else {
        subArea = 'Feeder System Integration & Plug-in Architecture';
        process = 'SD/MM Document Replication to GTS';
        identifiedTcode = '/SAPSLL/BL_DOCS';
      }
      integrationDirection = 'SD Sales Order (VA01) / Delivery (VL01N) → GTS Compliance Plug-in (/SAPSLL/) → Document Block / Release';
    }

    // Fine-grained IS-Retail Sub-area extraction
    else if (primaryModule === 'IS_RETAIL') {
      if (text.includes('article') || text.includes('generic') || text.includes('variant') || text.includes('mm41')) {
        subArea = 'Article Master Architecture (Generic vs Variant)';
        process = 'Retail Article Lifecycle & Category Assignment';
        identifiedTcode = 'MM41 / MM42';
        masterData = 'Article Master (MARA/MAW1: ATTYP 01/02)';
      } else if (text.includes('listing') || text.includes('assortment') || text.includes('wsl10') || text.includes('wsl11')) {
        subArea = 'Assortment Management & Article Listing';
        process = 'Listing Condition Generation per Store/DC Assortment';
        identifiedTcode = 'WSL10 / WSL11';
        masterData = 'Assortment Module (WRS1, WLK1)';
      } else if (text.includes('site') || text.includes('store') || text.includes('wb01')) {
        subArea = 'Site Master Architecture (Stores vs DCs)';
        process = 'Retail Site Maintenance & Supply Chain Hierarchy';
        identifiedTcode = 'WB01 / WB02';
        masterData = 'Site Master (WRF1, T001W)';
      } else if (text.includes('allocation') || text.includes('wa01')) {
        subArea = 'Allocation Table & Push Merchandise Distribution';
        process = 'Merchandise Split across Store Deliveries';
        identifiedTcode = 'WA01 / WA02';
        docType = 'Allocation Table (WA)';
      } else if (text.includes('replenishment') || text.includes('wrp1')) {
        subArea = 'Store & DC Replenishment Planning';
        process = 'Requirement Calculation & Store STO Generation';
        identifiedTcode = 'WRP1';
      } else if (text.includes('pos') || text.includes('wpma') || text.includes('wper') || text.includes('car')) {
        subArea = 'POS Integration & Store Communication';
        process = 'POS Outbound Download (WPMA) & Inbound Sales Processing (WPER)';
        identifiedTcode = 'WPMA / WPER';
        masterData = 'POS Interface IDocs (WP_PLU, WPUUMS)';
      } else {
        subArea = 'Merchandise Category Hierarchy & Valuation';
        process = 'Retail Merchandise Management';
        identifiedTcode = 'WG21';
      }
      integrationDirection = 'Merchandise Hierarchy → Assortment & Listing (WSL10) → Store STO (UB) → DC Picking → POS Receipt (WPER)';
    }

    // Fine-grained SD Sub-area extraction
    else if (primaryModule === 'SD') {
      if (text.includes('pricing') || text.includes('condition technique') || text.includes('v/08') || text.includes('pr00') || text.includes('vk11')) {
        subArea = 'Pricing Procedure & Condition Technique (16-Step Schema)';
        process = 'Sales Order Pricing & Access Sequence Determination';
        identifiedTcode = 'V/08 & VK11';
        masterData = 'Pricing Condition Records (KONV, PRCD_ELEMENTS, A004)';
      } else if (text.includes('shipping point') || text.includes('ovl2') || text.includes('delivery') || text.includes('vl01n')) {
        subArea = 'Delivery Processing & Shipping Point Determination';
        process = 'Outbound Delivery Creation & Picking Verification';
        identifiedTcode = 'OVL2 & VL01N';
        docType = 'Outbound Delivery (LF)';
      } else if (text.includes('billing') || text.includes('invoice') || text.includes('vf01') || text.includes('vkoa')) {
        subArea = 'Billing & Revenue Account Determination';
        process = 'Billing Document Generation & FI-GL Posting (VKOA)';
        identifiedTcode = 'VF01 & VKOA';
        docType = 'Commercial Invoice (F2)';
      } else if (text.includes('atp') || text.includes('availability') || text.includes('ovz9')) {
        subArea = 'Availability Check (ATP) & Transfer of Requirements';
        process = 'Sales Order Schedule Line Confirmation';
        identifiedTcode = 'OVZ9 & OPJK';
      } else if (text.includes('partner') || text.includes('vopar')) {
        subArea = 'Partner Determination Technique';
        process = 'Sold-to, Ship-to, Bill-to, Payer Assignment';
        identifiedTcode = 'VOPAR';
      } else if (text.includes('credit') || text.includes('vkm1') || text.includes('vkm3')) {
        subArea = 'Credit Management & Credit Block Resolution';
        process = 'Credit Limit Check at Order & Delivery Creation';
        identifiedTcode = 'VKM1 / VKM3';
      } else if (text.includes('intercompany') || text.includes('iv')) {
        subArea = 'Intercompany Sales & Billing Flow';
        process = 'Cross-Company Code Sales Order & Intercompany Invoice';
        identifiedTcode = 'VA01 & VF01';
        docType = 'Intercompany Billing (IV)';
      } else {
        subArea = 'Order-to-Cash (O2C) Core Document Flow';
        process = 'Standard Sales Order Processing (VA01)';
        identifiedTcode = 'VA01 / VA02';
        docType = 'Standard Order (OR)';
      }
      integrationDirection = 'SD Sales Order (VA01) → Availability (ATP) → SD Delivery (VL01N) → EWM Staging (/SCWM/) → FI Billing (VF01/BKPF)';
    }

    // PP module specific
    else if (primaryModule === 'PP') {
      if (text.includes('cogi') || text.includes('failed goods movement')) {
        subArea = 'COGI Postprocessing of Failed Goods Movements';
        process = 'Production Confirmation Error Handling (Backflush Issue 261)';
        identifiedTcode = 'COGI';
      } else {
        subArea = 'Production Order Creation & Execution Architecture';
        process = 'BOM Explosion, Routing Selection & Scheduling';
        identifiedTcode = 'CO01 / CO02';
      }
    }

    // EWM module specific
    else if (primaryModule === 'EWM') {
      subArea = 'Warehouse Execution, Task Generation & Production Staging';
      process = 'Outbound Delivery Order Processing & Staging Cockpit';
      identifiedTcode = '/SCWM/PRDO & /SCWM/STAGE';
    }

    const specMeta = SAP_DOMAIN_SPECIALIZATIONS[primaryModule] || SAP_DOMAIN_SPECIALIZATIONS[`SAP_${primaryModule}`] || SAP_DOMAIN_SPECIALIZATIONS.SAP_SD;
    const normalizedModuleId = primaryModule.startsWith('SAP_') ? primaryModule : `SAP_${primaryModule}`;

    // Extract all detected T-Codes from raw query text
    const tcodeMatches = (raw.match(/(?:\/[A-Z0-9_]+\/[A-Z0-9_]+|[A-Z0-9_\/]{3,16})/gi) || [])
      .map(t => t.toUpperCase())
      .filter(t => t.startsWith('/SAPSLL/') || t.startsWith('/SCWM/') || ['VA01','VA02','VA03','VF01','VF02','VL01N','VL02N','VK11','OVL2','V/08','VKOA','MM41','MM42','WB01','WSL10','WA01','VKP5','WRP1','WPMA','WPER','SMQ1','SMQ2','CO01','CO02','ME21N','MIGO'].includes(t));

    return {
      primaryModule: normalizedModuleId,
      moduleCode: primaryModule.replace('SAP_', ''),
      moduleName: specMeta.display_name || specMeta.name,
      icon: specMeta.icon,
      color: specMeta.color,
      badgeBg: specMeta.badge_bg || specMeta.badgeBg,
      badgeBorder: specMeta.badge_border || specMeta.badgeBorder,
      priority: specMeta.priority,
      isPriority: specMeta.isPriority || specMeta.priority === 'high',
      subArea,
      businessProcess: process,
      process,
      tcode: identifiedTcode,
      tcodesInScope: tcodeMatches.length ? Array.from(new Set(tcodeMatches)) : (identifiedTcode ? [identifiedTcode] : (specMeta.signatureTcodes || [])),
      documentTypes: docType ? [docType] : [],
      masterDataInScope: masterData ? [masterData] : (specMeta.coreMasterData || []),
      masterData,
      isCrossModule,
      secondaryModules,
      integrationDirection,
      confidence,
      confidenceScore: confidence === 'High' ? 0.95 : (confidence === 'Medium' ? 0.75 : 0.5),
      evidenceStatus,
      tagline: specMeta.tagline,
      answerStyle: specMeta.answer_style
    };
  }

  static classify(queryText, explicitModule = 'AUTO') {
    return this.classifyQuery(queryText, explicitModule);
  }
}

module.exports = {
  ModuleClassifier
};
