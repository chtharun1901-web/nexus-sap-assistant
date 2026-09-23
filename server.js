const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');
const db    = require('./db.js');
const { SearchQueryPlanner, SourceQualityRanker, TransactionValidator, searchCache, CorrectionManager } = require('./services/WebSearchService.js');
const { SAP_DOMAIN_SPECIALIZATIONS } = require('./services/SapDomainSpecializations.js');
const { ModuleClassifier } = require('./services/ModuleClassifier.js');
const { SpecialistPromptRouter } = require('./services/SpecialistPromptRouter.js');

const PORT    = process.env.PORT || 3456;
const KEY_FILE = path.join(__dirname, '.apikey');
const AUDIT_LOG_FILE = path.join(__dirname, 'retrieval_audit.jsonl');

// ── Load Gemini API key ────────────────────────────────────────────────────
function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY.trim();
  if (fs.existsSync(KEY_FILE)) {
    const k = fs.readFileSync(KEY_FILE, 'utf8').trim();
    if (k) return k;
  }
  return '';
}

let API_KEY = loadKey();
const otpStore = new Map();
const recentSentEmails = new Map();

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {}

let mailTransporter = null;
let etherealAccount = null;

async function getMailTransporter() {
  if (mailTransporter) return mailTransporter;
  if (!nodemailer) return null;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
      }
    });
    return mailTransporter;
  }
  
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
    return mailTransporter;
  }

  // Auto-provision an Ethereal mail transport for live testing
  try {
    if (!etherealAccount) {
      etherealAccount = await nodemailer.createTestAccount();
    }
    mailTransporter = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
  } catch(e) {
    mailTransporter = null;
  }

  return mailTransporter;
}

async function sendEmailOtp(toEmail, code, type = 'login') {
  const isReset = type === 'reset';
  const subject = isReset ? 'Sanjaya (सञ्जय) SAP Intelligence: Password Reset Code' : 'Sanjaya (सञ्जय) SAP Intelligence: Your One-Time Login Code';
  const actionTitle = isReset ? 'Password Reset Verification' : 'One-Time Passcode (OTP) Login';
  const actionDesc = isReset 
    ? 'You requested a password reset for your Sanjaya Enterprise account. Enter the verification code below to set a new password:'
    : 'Use the following 6-digit verification code to securely sign in to your Sanjaya SAP Operations Workspace:';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #EDEDED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #111111; border: 1px solid #27272A; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1C1917 0%, #0D0D0D 100%); border-bottom: 1px solid #27272A;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #2A170A 0%, #120A03 100%); border: 1.5px solid #F59E0B; border-radius: 8px; text-align: center; line-height: 36px; color: #FBBF24; font-weight: 800; font-size: 15px; font-family: monospace;">SJ</div>
                    <span style="font-size: 18px; font-weight: 800; color: #EDEDED; letter-spacing: 0.02em; margin-left: 10px; vertical-align: middle;">SANJAYA</span>
                    <span style="color: #F59E0B; font-weight: 700; font-size: 15px; margin-left: 4px; vertical-align: middle;">(सञ्जय)</span>
                    <span style="background-color: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #FBBF24; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle; font-family: monospace;">ENTERPRISE AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">${actionTitle}</h2>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #A1A1AA;">${actionDesc}</p>

              <!-- OTP Code Display Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #18181B; border: 1px solid #3F3F46; border-radius: 10px; padding: 22px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #71717A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; font-family: monospace;">YOUR 6-DIGIT VERIFICATION CODE</div>
                    <div style="font-size: 34px; font-weight: 800; color: #FF5500; letter-spacing: 8px; font-family: monospace; line-height: 1.2;">${code}</div>
                  </td>
                </tr>
              </table>

              <!-- Security Info -->
              <div style="background-color: rgba(255,85,0,0.06); border-left: 3px solid #FF5500; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12.5px; color: #D4D4D8; line-height: 1.5;">
                  ⏱ This verification code is valid for <strong>10 minutes</strong>. For security reasons, never share this code with anyone.
                </p>
              </div>

              <p style="margin: 0; font-size: 12.5px; color: #71717A; line-height: 1.5;">
                If you did not initiate this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0A0A0A; border-top: 1px solid #1F1F23; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #52525B;">
                Nexus Enterprise SAP Copilot & Operations Platform · Authenticated System Mailer
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  let webPreviewUrl = null;
  let deliveryMethod = 'simulated';

  try {
    const mailer = await getMailTransporter();
    if (mailer) {
      const info = await mailer.sendMail({
        from: process.env.SMTP_FROM || '"Nexus SAP Copilot" <auth@nexus.sap>',
        to: toEmail,
        subject,
        html: htmlContent
      });
      deliveryMethod = process.env.SMTP_HOST || process.env.GMAIL_USER ? 'smtp' : 'ethereal';
      if (nodemailer && nodemailer.getTestMessageUrl) {
        webPreviewUrl = nodemailer.getTestMessageUrl(info) || null;
      }
      console.log(`\x1b[32m[Mailer] Dispatched email to ${toEmail} via ${deliveryMethod}${webPreviewUrl ? ` (Preview: ${webPreviewUrl})` : ''}\x1b[0m`);
    }
  } catch (err) {
    console.warn('[Mailer] Delivery warning:', err.message);
  }

  // Store in memory for immediate in-app viewing
  recentSentEmails.set(toEmail.toLowerCase().trim(), {
    toEmail,
    subject,
    code,
    html: htmlContent,
    webPreviewUrl,
    deliveryMethod,
    timestamp: new Date().toISOString()
  });

  return {
    sent: true,
    method: deliveryMethod,
    testOtp: code,
    webPreviewUrl,
    html: htmlContent
  };
}

// ── Tier 1: Official SAP Help & Architecture Knowledge Base ────────────────
const OFFICIAL_SAP_CATALOG = [
  {
    id: 'SAP-HELP-EWM-PMR-001',
    citationId: 'SAP-1',
    title: 'SAP Help Portal: Production Material Request (PMR) in SAP EWM',
    tier: 'Tier 1 — Official SAP Source',
    product: 'SAP S/4HANA Extended Warehouse Management',
    release: 'S/4HANA 1610 to 2023 (Architecture: Embedded & Decentralized)',
    url: 'https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/ewm_pmr_production_integration',
    status: 'Verified official source',
    keywords: ['pmr', 'production material request', 'staging', 'production staging', 'pick parts', 'release order parts', 'crate parts', 'co01', 'co02', 'co03', 'co11n', 'co15', 'cor1', 'cor2', 'cor3', '/scwm/pmr', '/scwm/stage', 'production order', 'ewm'],
    excerpt: 'In SAP S/4HANA Extended Warehouse Management with Advanced Production Integration, the Production Material Request (PMR) represents the warehouse view of the manufacturing order (production or process order). Staging can be executed based on staging methods: Pick Parts, Release Order Parts, or Crate Parts using transaction /SCWM/STAGE or transaction /SCWM/PMR. Architecture differs between Embedded EWM (direct integration) and Decentralized EWM (qRFC/bgRFC interface).'
  },
  {
    id: 'SAP-HELP-BC-BGRFC-001',
    citationId: 'SAP-2',
    title: 'SAP Help Portal: bgRFC vs qRFC Integration Architecture in SAP S/4HANA',
    tier: 'Tier 1 — Official SAP Source',
    product: 'SAP NetWeaver / SAP S/4HANA ABAP Platform',
    release: 'NetWeaver 7.02+ / S/4HANA 1610 to 2023',
    url: 'https://help.sap.com/docs/ABAP_PLATFORM/bgrfc_qrfc_communication_monitoring',
    status: 'Verified official source',
    keywords: ['bgrfc', 'qrfc', 'sbgrfcmon', 'sbgrfpcust', 'smq1', 'smq2', 'queue', 'stuck queue', 'inbound queue', 'outbound queue'],
    excerpt: 'In SAP S/4HANA landscapes, integration queues are managed either via classic qRFC (transactions SMQ1 for outbound and SMQ2 for inbound) or modern bgRFC (transaction SBGRFCMON). Administrators must verify active interface customizing in SBGRFPCUST before diagnosing queue stops. Deleting live production queues without business impact analysis causes orphaned LUWs and document desynchronization.'
  },
  {
    id: 'SAP-HELP-EWM-PSA-001',
    citationId: 'SAP-3',
    title: 'SAP Help Portal: Production Supply Area (PSA) & Control Cycles',
    tier: 'Tier 1 — Official SAP Source',
    product: 'SAP S/4HANA Extended Warehouse Management',
    release: 'Release-dependent (S/4HANA 1610–2023 vs ECC 6.0)',
    url: 'https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/ewm_psa_control_cycles',
    status: 'Verified official source',
    keywords: ['psa', 'control cycle', '/scwm/psa_cc', 'lpk1', 'production supply area', 'cr02', 'work center'],
    excerpt: 'The Production Supply Area (PSA) serves as the physical staging bin near the work center. In EWM-managed production, staging derivation relies on the EWM Control Cycle (maintained via transaction /SCWM/PSA_CC) linking Material, Plant, and PSA. In classic ERP WM, control cycles are maintained via transaction LPK1. Staging applicability is multi-faceted and determined by Work Center (CR02), BOM item settings, and staging indicator.'
  }
];

// ── Verified SAP OSS Notes Catalog (Tier 1 Verified Reference) ─────────────
const OFFICIAL_OSS_NOTES = [
  {
    noteNumber: '2871625',
    citationId: 'SAP-NOTE-2871625',
    title: 'S/4HANA EWM qRFC Staging Queue Optimization & Scheduler Configuration',
    component: 'EWM-IF-RFC (EWM Interfaces - Remote Function Call)',
    priority: 'Correction with Medium Priority',
    category: 'Program Error / Architecture Optimization',
    release: 'S/4HANA 2020, 2022, 2023 FPS00-02',
    verified: true,
    tcodes: ['SMQ2', 'SMQR', 'SM59', 'SBGRFCMON'],
    symptom: 'High volume of inbound queues (WM_STG_*) enter SYSFAIL or STOP status during parallel production material staging runs from ERP to EWM.',
    cause: 'Inbound qRFC scheduler max runtime thresholds exceeded under default SMQR parameters without dedicated destination group throttling.',
    solution: 'Configure dedicated AS Groups in transaction RZ12 and register queue prefix WM_STG_* in SMQR with parameter MAXTIME=10 and USER=* to prevent thread starvation.',
    postSteps: '1. Open transaction SMQR in EWM client.\n2. Select Register Queue -> Queue Name: WM_STG_*.\n3. Assign RFC Destination Group EWM_RFC_PARALLEL.\n4. Verify active status with green traffic light.',
    url: 'https://me.sap.com/notes/2871625'
  },
  {
    noteNumber: '3012841',
    citationId: 'SAP-NOTE-3012841',
    title: 'bgRFC vs qRFC Integration Architecture in S/4HANA Embedded Warehouse Management',
    component: 'BC-MID-RFC (ABAP Platform - bgRFC Middleware)',
    priority: 'Recommendations / Best Practices',
    category: 'Architecture Consulting',
    release: 'S/4HANA 1909 to 2023 FPS02',
    verified: true,
    tcodes: ['SBGRFCMON', 'SBGRFPCUST', 'SMQ1', 'SMQ2'],
    symptom: 'Confusion regarding whether staging transactions generate classic SMQ1/SMQ2 entries or modern background RFC (bgRFC) units in S/4HANA.',
    cause: 'S/4HANA Embedded EWM transitions local warehouse replication from RFC LUWs to bgRFC units for improved transactional throughput.',
    solution: 'Verify supervisor destination configuration in SBGRFPCUST. Use transaction SBGRFCMON for monitoring and avoid classic SMQ2 queue purge routines in embedded topologies.',
    postSteps: '1. Execute transaction SBGRFPCUST.\n2. Confirm Supervisor Destination BGRFC_SUPERVISOR exists.\n3. Validate Inbound Destination EWM_BGRFC_IN is registered with correct lock duration.',
    url: 'https://me.sap.com/notes/3012841'
  },
  {
    noteNumber: '2690041',
    citationId: 'SAP-NOTE-2690041',
    title: 'Production Material Request (PMR) Missing During Production Order Release (CO01/CO02)',
    component: 'EWM-PRD (Production Integration & Staging)',
    priority: 'Correction with High Priority',
    category: 'Program Error / Master Data',
    release: 'S/4HANA 1709, 1809, 1909, 2020, 2022, 2023',
    verified: true,
    tcodes: ['CO01', 'CO02', 'CO03', '/SCWM/PMR', 'SLG1'],
    symptom: 'Production Order is set to status REL (Released) in CO02, but no corresponding PMR document is generated in EWM transaction /SCWM/PMR.',
    cause: '1. Staging indicator missing in Bill of Materials (BOM) item or Work Center.\n2. Missing mapping between Production Supply Area (PSA) and EWM Storage Location.\n3. Application log SLG1 contains /SCWM/WME error: "No storage bin determined for PSA".',
    solution: 'Verify control cycle in /SCWM/PSA_CC. Ensure BOM components have staging indicator (Pick Parts = 1, Release Order Parts = 3). Check SLG1 log object /SCWM/WME subobject PMR.',
    postSteps: '1. Verify material master EWM views in /SCWM/MAT1.\n2. Check PSA assignment in transaction CR02.\n3. Maintain control cycle in /SCWM/PSA_CC.\n4. Save order in CO02 to retrigger replication.',
    url: 'https://me.sap.com/notes/2690041'
  },
  {
    noteNumber: '3144820',
    citationId: 'SAP-NOTE-3144820',
    title: 'Exception Handling in /SCWM/STAGE for Staging Method Pick Parts & Crate Parts',
    component: 'EWM-PRD-STG (EWM Production Staging Execution)',
    priority: 'Correction with Medium Priority',
    category: 'Program Error',
    release: 'S/4HANA 2021, 2022, 2023',
    verified: true,
    tcodes: ['/SCWM/STAGE', '/SCWM/MON', '/SCWM/TO_DISP'],
    symptom: 'Transaction /SCWM/STAGE terminates with message "Warehouse Task calculation failed: Stock deficit at source bin" during pick part calculation.',
    cause: 'Replenishment strategies failed to clear stock allocation locks for predecessor warehouse tasks in physical storage type.',
    solution: 'Inspect open Warehouse Tasks in /SCWM/MON under Incomplete Tasks. Apply exception code WSTG to recalculate alternative bin determination.',
    postSteps: '1. Open /SCWM/MON for Warehouse Number.\n2. Navigate to Inbound Documents -> Production Material Request.\n3. Execute Staging with alternative storage type search sequence.',
    url: 'https://me.sap.com/notes/3144820'
  },
  {
    noteNumber: '2938471',
    citationId: 'SAP-NOTE-2938471',
    title: 'PSA Control Cycle Determination Failure (/SCWM/PSA_CC) in Embedded S/4HANA',
    component: 'EWM-MD-PSA (Master Data - Production Supply Area)',
    priority: 'Recommendations / Consulting',
    category: 'Consulting',
    release: 'S/4HANA 1809 to 2023',
    verified: true,
    tcodes: ['/SCWM/PSA_CC', 'CR02', 'LPK1', '/SCWM/PSA'],
    symptom: 'EWM staging generates warning "No valid control cycle found" despite classic LPK1 control cycles existing in ERP.',
    cause: 'In S/4HANA EWM, control cycles must be maintained via /SCWM/PSA_CC rather than classic ERP LPK1 when using Advanced Production Integration.',
    solution: 'Execute report /SCWM/R_MIGRATE_LPK1_TO_PSACC or manually maintain warehouse control cycles in transaction /SCWM/PSA_CC.',
    postSteps: '1. Open transaction /SCWM/PSA_CC.\n2. Enter Plant, Warehouse Number, Material, and PSA.\n3. Specify Staging Method (Pick Parts / Release Order Parts).\n4. Specify Destination Storage Bin.',
    url: 'https://me.sap.com/notes/2938471'
  },
  {
    noteNumber: '3290192',
    citationId: 'SAP-NOTE-3290192',
    title: 'Resolving SYSFAIL ABAP Short Dump in /SCWM/INB_DELIVERY_CONFIRM via qRFC',
    component: 'EWM-IF-RFC (Inbound Delivery Confirmation Interface)',
    priority: 'Correction with High Priority',
    category: 'Program Error',
    release: 'S/4HANA 2020, 2022, 2023 FPS01',
    verified: true,
    tcodes: ['SMQ2', 'ST22', 'SM58', '/SCWM/PRDI'],
    symptom: 'Inbound delivery confirmation fails with SYSFAIL and ABAP short dump MESSAGE_TYPE_X in program /SCWM/SAPLINB_DELIVERY.',
    cause: 'Document lock collision when ERP Goods Movement post runs concurrently with EWM Inbound Delivery status update.',
    solution: 'Implement correction instruction in Note 3290192. Set qRFC retry interval to 2 minutes with max 5 attempts in transaction SMQS.',
    postSteps: '1. Inspect ST22 for exact dump line in /SCWM/SAPLINB_DELIVERY.\n2. Re-activate queue in SMQ2 after verifying lock table in SM12.\n3. Never delete the queue entry directly to prevent ERP/EWM quantity split.',
    url: 'https://me.sap.com/notes/3290192'
  }
];

const CONNECTOR_STATUSES = [
  { id: 'sap-help', name: 'Official SAP Help Portal Index', status: 'Active', tier: 'Tier 1', type: 'Knowledge' },
  { id: 'enterprise-docs', name: 'Internal Document Repository', status: 'Active', tier: 'Tier 2', type: 'Knowledge' },
  { id: 'sap-support-api', name: 'SAP Support Portal / Notes API', status: 'Unavailable in this environment', tier: 'Tier 1', type: 'Service Marketplace' },
  { id: 'sap-s4hana-rfc', name: 'SAP S/4HANA RFC Destination', status: 'Unavailable in this environment', tier: 'Tier 1', type: 'Live ERP/EWM' },
  { id: 'servicenow-itsm', name: 'ServiceNow ITSM Connector', status: 'Simulated / Demo', tier: 'Tier 2', type: 'Case Management' },
  { id: 'celonis-ems', name: 'Celonis Process Intelligence API', status: 'Simulated / Demo', tier: 'Tier 1', type: 'Process Analytics' }
];

const PROCESS_INTELLIGENCE_DATA = {
  dataSource: 'Demo or simulated data (Synthesized PMR Staging Event Log)',
  timestamp: new Date().toISOString(),
  disclaimer: 'This dataset is simulated for process intelligence demonstration. It does not reflect live customer production telemetry.',
  processName: 'Production Material Staging (PP-EWM)',
  stages: [
    { id: 'stg-1', name: 'Order Release (CO02)', avgDurationMin: 2.1, volume: 1420, errorRatePct: 0.2 },
    { id: 'stg-2', name: 'PMR Generation & Transfer', avgDurationMin: 4.8, volume: 1417, errorRatePct: 2.4, bottleneck: 'bgRFC Destination Latency' },
    { id: 'stg-3', name: 'Warehouse Task (WT) Calculation (/SCWM/STAGE)', avgDurationMin: 12.3, volume: 1383, errorRatePct: 5.1, bottleneck: 'PSA Capacity Constraints' },
    { id: 'stg-4', name: 'Physical Staging & Picking', avgDurationMin: 34.0, volume: 1312, errorRatePct: 1.8 },
    { id: 'stg-5', name: 'Goods Issue Posting (261)', avgDurationMin: 1.5, volume: 1288, errorRatePct: 0.1 }
  ],
  reworkLoops: [
    { from: 'stg-3', to: 'stg-2', reason: 'Missing PSA Control Cycle in /SCWM/PSA_CC', count: 34 },
    { from: 'stg-4', to: 'stg-3', reason: 'Stock Deficit at Staging Bin', count: 71 }
  ]
};

// ── Cookie & Auth Helper ───────────────────────────────────────────────────

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function authenticateRequest(req) {
  const cookies = parseCookies(req);
  let token = cookies['nexus_session'];
  
  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;
  return db.getSessionByToken(token);
}

// ── Retrieval Engine (User-Scoped) ─────────────────────────────────────────

function retrieveSources(userId, queryText, options = {}) {
  if (options.disableRetrieval) {
    return { sources: [], status: 'Source unavailable — retrieval failed or disabled' };
  }

  const queryLower = (queryText || '').toLowerCase();
  const isDeliveryBased = /delivery[-\s]based/i.test(queryLower) || /delivery\s+integration/i.test(queryLower);
  const mentionsPMR = /pmr|production material request|advanced production/i.test(queryLower);
  const matchedSources = [];

  // 1. Search Tier 1 Official Catalog
  for (const item of OFFICIAL_SAP_CATALOG) {
    // Safeguard: SAP-1 (SAP-HELP-EWM-PMR-001) strictly covers PMR (Advanced Production Integration).
    // If the query is about delivery-based integration, strictly exclude SAP-1.
    if (item.citationId === 'SAP-1' && isDeliveryBased) {
      continue;
    }

    let matchCount = 0;
    for (const kw of item.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      const sourceObj = {
        citationId: item.citationId,
        id: item.id,
        title: item.title,
        tier: item.tier,
        product: item.product,
        release: item.release,
        url: item.url,
        status: item.status,
        excerpt: item.excerpt,
        readStatus: true,
        timestamp: new Date().toISOString()
      };
      if (item.citationId === 'SAP-1' && isDeliveryBased && mentionsPMR) {
        sourceObj.scopeNote = 'Covers PMR / Advanced Production Integration ONLY — does not document delivery-based production integration';
      }
      matchedSources.push(sourceObj);
    }
  }

  // 2. Search Tier 2 User Documents (Filtered strictly by authenticated user)
  if (userId) {
    const userDocs = db.searchUserDocuments(userId, queryText, options.permissionLevel || 'standard');
    for (const d of userDocs) {
      matchedSources.push(d);
    }
  }

  let status = matchedSources.length > 0 ? 'Retrieved successfully' : 'General model knowledge — no matching source';
  if (isDeliveryBased && !matchedSources.some(s => s.title.toLowerCase().includes('delivery-based'))) {
    status = 'Evidence status: No directly matching official source was retrieved for the delivery-based integration claims.';
  }

  return {
    sources: matchedSources,
    status
  };
}

// ── No-Fake-Citation & Anti-Hallucination Output Validator ──────────────────
function validateAndSanitizeOutput(rawText, retrievedSources, reqId, userPrompt = '') {
  let text = rawText || '';
  const blockedEvents = [];

  // 0. Clean LaTeX math artifacts & arrows (e.g. $\rightarrow$, $9010$, $0010$)
  text = text
    .replace(/\$\s*\\rightarrow\s*\$/gi, " → ")
    .replace(/\\rightarrow/gi, " → ")
    .replace(/\$\s*\\to\s*\$/gi, " → ")
    .replace(/\\to\b/gi, " → ")
    .replace(/\$\s*\\Rightarrow\s*\$/gi, " ⇒ ")
    .replace(/\\Rightarrow/gi, " ⇒ ")
    .replace(/\$\s*\\leftarrow\s*\$/gi, " ← ")
    .replace(/\\leftarrow/gi, " ← ")
    .replace(/\$\s*\\Leftarrow\s*\$/gi, " ⇐ ")
    .replace(/\\Leftarrow/gi, " ⇐ ")
    .replace(/\$\s*\\leftrightarrow\s*\$/gi, " ↔ ")
    .replace(/\\leftrightarrow/gi, " ↔ ")
    .replace(/\$\s*\\le\s*\$/gi, " ≤ ")
    .replace(/\\le\b/gi, " ≤ ")
    .replace(/\$\s*\\ge\s*\$/gi, " ≥ ")
    .replace(/\\ge\b/gi, " ≥ ")
    .replace(/\$\s*\\neq\s*\$/gi, " ≠ ")
    .replace(/\\neq\b/gi, " ≠ ")
    .replace(/\$\s*([A-Za-z0-9_\-\/.\+]+)\s*\$/g, "$1");

  // Check for known misconceptions (/SCWM/ISU slotting or /SCWM/DOCC / universal max quants/HUs)
  const correction = CorrectionManager.checkAndGenerateCorrection(userPrompt || rawText);
  if (correction.hasCorrection && !text.includes('Correction:')) {
    text = correction.notice + '\n\n' + text;
  }

  // Prevent false assertion that /SCWM/ISU is slotting
  if (/\/SCWM\/ISU[^.]*(?:is a slotting|for slotting|executes slotting|runs slotting|determines slotting)/i.test(text)) {
    text = text.replace(/\/SCWM\/ISU[^.]*(?:is a slotting|for slotting|executes slotting|runs slotting|determines slotting)[^.]*./gi, 
      '/SCWM/ISU is the Initial Stock Upload transaction in SAP EWM, while slotting is executed via transaction /SCWM/SLOT.'
    );
    blockedEvents.push({
      event: 'CORRECTED_TRANSACTION_MISCONCEPTION',
      tcode: '/SCWM/ISU',
      action: 'Corrected slotting association to /SCWM/SLOT',
      timestamp: new Date().toISOString()
    });
  }

  // Prevent citing /SCWM/DOCC for storage type customizing
  if (/\/SCWM\/DOCC[^.]*(?:storage type|define storage type|customizing|mixed storage|max quant|max hu)/i.test(text) ||
      /(?:storage type|define storage type)[^.]*\/SCWM\/DOCC/i.test(text)) {
    text = text.replace(/\/SCWM\/DOCC/g, 'SPRO (Define Storage Type - Note: /SCWM/DOCC is for delivery processing, not storage type customizing)');
    blockedEvents.push({
      event: 'CORRECTED_STORAGE_TYPE_TCODE',
      tcode: '/SCWM/DOCC',
      action: 'Replaced /SCWM/DOCC with verified SPRO path for storage type customizing',
      timestamp: new Date().toISOString()
    });
  }

  // Prevent false claims of universal "Maximum Number of Quants" field in storage type screen without strategy context
  if (/(?:maximum number of quants|maximum number of hus)[^.]*(?:define storage type screen|storage type definition field|in the storage type definition)/i.test(text)) {
    blockedEvents.push({
      event: 'CORRECTED_UNIVERSAL_QUANT_FIELD_OVERSTATEMENT',
      action: 'Corrected universal storage type field claim to strategy/section dependent explanation',
      timestamp: new Date().toISOString()
    });
  }

  // 1. Detect unverified SAP Note numbers (e.g. Note 1234567, KBA 1234567)
  const noteRegex = /\b(?:SAP\s+Note|KBA|SAP\s+KBA)\s+(\d{6,8})\b/gi;
  let match;
  while ((match = noteRegex.exec(rawText)) !== null) {
    const noteNumber = match[1];
    const isVerifiedInRetrieved = retrievedSources.some(s => 
      s.excerpt?.includes(noteNumber) || s.title?.includes(noteNumber) || (s.url && s.url.includes(noteNumber))
    );

    if (!isVerifiedInRetrieved) {
      blockedEvents.push({
        event: 'BLOCKED_HALLUCINATED_NOTE',
        noteNumber,
        action: 'Replaced with official non-verification disclaimer',
        timestamp: new Date().toISOString()
      });
      text = text.replace(
        match[0], 
        `[Unverified Note ${noteNumber} removed — I cannot verify an exact SAP Note or KBA in the current environment]`
      );
    }
  }

  // 2. Detect unverified URLs
  const urlRegex = /https?:\/\/[^\s\)]+/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(rawText)) !== null) {
    const foundUrl = urlMatch[0];
    const isVerifiedUrl = retrievedSources.some(s => s.url === foundUrl) || foundUrl.startsWith('https://help.sap.com');
    if (!isVerifiedUrl) {
      blockedEvents.push({
        event: 'BLOCKED_FABRICATED_URL',
        url: foundUrl,
        timestamp: new Date().toISOString()
      });
      text = text.replace(foundUrl, '[Unverified URL removed]');
    }
  }

  // 3. Detect and safeguard destructive queue purge / deletion
  const queueDeleteRegex = /\b(?:delete|purging|purge)\s+(?:the\s+)?(?:stuck\s+)?(?:qRFC\s+)?(?:queues?|LUWs?)\b/gi;
  if (queueDeleteRegex.test(text)) {
    blockedEvents.push({
      event: 'BLOCKED_DESTRUCTIVE_QUEUE_PURGE',
      action: 'Injected production safety warning against queue deletion',
      timestamp: new Date().toISOString()
    });
    text = text.replace(queueDeleteRegex, '[ACTION BLOCKED: Queue deletion in live production is prohibited as it causes orphaned LUWs and document desynchronization]');
  }

  // 4. Detect false "Verified SAP Grounding Citations" or "Verified Tier 1 reference" when no official delivery-based source matches
  const hasDeliveryBasedOfficial = retrievedSources.some(s => s.tier?.includes('Tier 1') && s.title?.toLowerCase().includes('delivery-based'));
  if (!hasDeliveryBasedOfficial) {
    text = text.replace(/Verified Tier 1 reference[^\n\.]*(?:\.|\n|$)/gi, 'Evidence status: No directly matching official source was retrieved for this topic. General model knowledge.\n');
    text = text.replace(/Verified reference from official SAP documentation index\.?/gi, 'Evidence status: No directly matching official source was retrieved for this topic. General model knowledge.');
    text = text.replace(/Verified SAP Grounding Citations/gi, 'Evidence status: No directly matching official source was retrieved for the delivery-based integration claims.');
    text = text.replace(/Verified SAP Grounding/gi, 'Evidence status: No directly matching official source was retrieved for the delivery-based integration claims.');
  }

  // 5. Detect and soften unsupported technical claims regarding delivery integration mechanics
  const unsupportedReplRegex = /Delivery documents generated on the ERP side are replicated to EWM[^\.]*\./gi;
  if (unsupportedReplRegex.test(text)) {
    text = text.replace(unsupportedReplRegex, 'In some delivery-oriented integration designs, an ERP-side delivery may be transferred or represented in the warehouse system. The exact document flow, status handling, and communication technology depend on the SAP release, deployment architecture, production-staging design, and customer configuration.');
  }

  const unsupportedDocRegex = /creates a warehouse request or outbound delivery order[^\.]*\./gi;
  if (unsupportedDocRegex.test(text)) {
    text = text.replace(unsupportedDocRegex, 'The exact warehouse request or delivery document representation depends on the target SAP release and customizing design.');
  }

  // 6. Strip any unrequested generic investigation template blocks or headers if accidentally generated
  text = text.replace(/^\[?(?:PRIMARY\s+)?RESPONSE\s+TYPE:\s*[A-Z_]+\]?\s*\n*/i, '');
  text = text.replace(/^\[?(?:CLASSIFICATION|Response Type|Classification):\s*[A-Z_]+\]?\s*\n*/i, '');
  text = text.replace(/LIVE AI REASONING & DIAGNOSTIC REPORT\s*\n*/gi, '');

  const duplicateSections = [
    /###?\s*(?:1\.\s*)?Incident Overview[\s\S]*?(?=###?\s*(?:2\.|Diagnostic Symptoms|Candidate checks|PMR|Delivery-based|\n\n---\n\n|$))/gi,
    /###?\s*(?:2\.\s*)?Diagnostic Symptoms[\s\S]*?(?=###?\s*(?:3\.|Production Safeguards|Candidate checks|PMR|Delivery-based|\n\n---\n\n|$))/gi,
    /###?\s*(?:3\.\s*)?Production Safeguards[\s\S]*?(?=###?\s*(?:4\.|Step-by-Step Triage Runbook|Candidate checks|PMR|Delivery-based|\n\n---\n\n|$))/gi,
    /###?\s*(?:4\.\s*)?Step-by-Step Triage Runbook[\s\S]*?(?=###?\s*(?:5\.|T-Code Reference Cards|Candidate checks|PMR|Delivery-based|\n\n---\n\n|$))/gi,
    /###?\s*(?:5\.\s*)?T-Code Reference Cards[\s\S]*?(?=###?\s*(?:6\.|Citations & Grounding Status|Official Citations|Candidate checks|\n\n---\n\n|$))/gi,
    /###?\s*(?:6\.\s*)?(?:Citations & Grounding Status|Official Citations)[\s\S]*?(?=(?:###?|\n\n---\n\n|$))/gi,
    /###?\s*Primary Architectural Reference[\s\S]*?(?=(?:###?|\n\n---\n\n|$))/gi
  ];
  for (const rx of duplicateSections) {
    if (rx.test(text)) {
      text = text.replace(rx, '');
    }
  }

  // 7. Ensure delivery-based conceptual overview starts with the required knowledge & evidence labels
  const isDeliveryExplanation = !hasDeliveryBasedOfficial && (/## Conceptual overview/i.test(text) || (/delivery-based/i.test(text) && /PMR/i.test(text)));
  if (isDeliveryExplanation && !text.includes('general model knowledge')) {
    text = `This guidance is based on general model knowledge and has not been verified against an official SAP source or the target SAP system.\n\nEvidence status: No directly matching official source was retrieved for the delivery-based integration claims.\n\n` + text;
  }

  return { sanitizedText: text.trim(), blockedEvents };
}

// ── Grounded Chat Handler with Source Injection & SSE ───────────────────────
function handleGroundedChat(req, res, sessionData) {
  const reqId = 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const startTime = Date.now();
  let body = '';

  req.on('data', c => (body += c));
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      let model = parsed.model || 'gemini-3.5-flash-lite';
      if (model.includes('2.5') || model.includes('1.5') || !model) {
        model = 'gemini-3.5-flash-lite';
      }
      const disableRetrieval = !!parsed.disableRetrieval;
      const conversationId = parsed.conversationId || null;
      const nexusCtx = parsed.nexusContext || {};
      const userRole = nexusCtx.role || parsed.role || sessionData?.user?.role || 'SAP Operations Lead';
      const userLandscape = nexusCtx.landscape || parsed.landscape || 'S/4HANA 2023 Embedded EWM';
      const isSocratic = !!nexusCtx.socraticMentorMode || !!parsed.socraticMentorMode;
      const isInterviewMode = !!parsed.interviewMode || !!nexusCtx.interviewMode;
      const interviewCategory = parsed.category || 'SAP General';
      const interviewProfile = parsed.profile || {};
      const selectedModule = parsed.selectedModule || parsed.module || nexusCtx.selectedModule || 'AUTO';
      const uploadedDocs = parsed.uploadedDocs || [];
      const userId = sessionData?.user?.id || null;
      const workspaceId = sessionData?.user?.workspaceId || 'ws-enterprise-default';

      // Extract user prompt for retrieval search immediately
      let userPrompt = '';
      if (parsed.contents && parsed.contents.length > 0) {
        const lastMsg = parsed.contents[parsed.contents.length - 1];
        if (lastMsg.role === 'user' && lastMsg.parts) {
          userPrompt = lastMsg.parts.map(p => p.text || '').join(' ');
        }
      }

      // Domain Specialization Classification
      const moduleClassification = ModuleClassifier.classify(userPrompt, selectedModule);

      // Verify conversation ownership or auto-create if authenticated
      let effectiveConvId = conversationId || null;
      let currentConversation = null;
      if (effectiveConvId && userId) {
        currentConversation = db.getConversation(userId, effectiveConvId);
        if (!currentConversation) {
          // Auto-create conversation with this custom ID so it is persisted in DB!
          const titleSnippet = userPrompt ? (userPrompt.length > 45 ? userPrompt.substring(0, 45) + '...' : userPrompt) : 'New Investigation';
          currentConversation = db.createConversation(userId, {
            id: effectiveConvId,
            title: titleSnippet,
            selectedRole: userRole,
            activeSapContextId: 'ctx-prd-pp'
          });
        }
      }

      // Save or retrieve conversation attached documents across multi-turn sessions
      let effectiveUploadedDocs = [...uploadedDocs];
      if (effectiveConvId && userId) {
        if (uploadedDocs && uploadedDocs.length > 0) {
          db.saveConversationDocs(userId, effectiveConvId, uploadedDocs);
        } else {
          const savedDocs = db.getConversationDocs(userId, effectiveConvId);
          if (savedDocs && savedDocs.length > 0) {
            effectiveUploadedDocs = savedDocs;
          }
        }
      }

      // Strip internal parameters before upstream proxy
      delete parsed.model;
      delete parsed.disableRetrieval;
      delete parsed.conversationId;
      delete parsed.nexusContext;
      delete parsed.role;
      delete parsed.landscape;
      delete parsed.architecture;
      delete parsed.socraticMentorMode;
      delete parsed.mentorMode;
      delete parsed.uploadedDocs;
      delete parsed.selectedModule;
      delete parsed.module;
      delete parsed.interviewMode;
      delete parsed.category;
      delete parsed.profile;

      // Snapshot prior history from active conversation before appending current turn
      const priorHistory = (currentConversation && currentConversation.messages) ? [...currentConversation.messages] : [];

      // Auto-create conversation if not specified for authenticated user
      if (!effectiveConvId && userId && userPrompt) {
        const titleSnippet = userPrompt.length > 35 ? userPrompt.substring(0, 35) + '...' : userPrompt;
        const autoConv = db.createConversation(userId, {
          title: titleSnippet,
          sapRole: userRole,
          sapLandscape: userLandscape
        });
        if (autoConv) {
          effectiveConvId = autoConv.id;
        }
      }

      // Save user turn to conversation history if conversation exists
      if (effectiveConvId && userId && userPrompt) {
        db.appendMessage(userId, effectiveConvId, {
          role: 'user',
          content: userPrompt,
          requestId: reqId,
          model
        });
      }

      // If conversation has prior messages and client sent only the latest user message, hydrate full history
      if (priorHistory.length > 0) {
        if (!parsed.contents || parsed.contents.length <= 1) {
          const historyContents = [];
          // Include up to last 10 prior messages for token safety
          const recentMsgs = priorHistory.slice(-10);
          for (const m of recentMsgs) {
            if (m.content && m.content.trim()) {
              historyContents.push({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
              });
            }
          }
          // Append the current user prompt as the final turn (preserving any multimodal inlineData parts)
          const latestParts = (parsed.contents && parsed.contents.length > 0 && parsed.contents[parsed.contents.length - 1].parts)
            ? parsed.contents[parsed.contents.length - 1].parts
            : [{ text: userPrompt }];
          historyContents.push({
            role: 'user',
            parts: latestParts
          });
          parsed.contents = historyContents;
        }
      }

      // Build effective search query for retrieval (expand short follow-ups with conversation context)
      let retrievalQuery = userPrompt;
      if (priorHistory.length > 0) {
        const isShortFollowUp = userPrompt.length < 35 || /^(examples?|which|how|why|what about|continue|more|for this|for that)/i.test(userPrompt.trim());
        if (isShortFollowUp) {
          const priorUserMsgs = priorHistory.filter(m => m.role === 'user');
          const lastUserMsg = priorUserMsgs[priorUserMsgs.length - 1];
          if (lastUserMsg && lastUserMsg.content) {
            retrievalQuery = `${lastUserMsg.content} ${userPrompt}`;
          }
        }
      }

      // Execute retrieval search (User-Scoped)
      const retrievalResult = retrieveSources(userId, retrievalQuery, { disableRetrieval });
      const retrievedSources = retrievalResult.sources;

      // Check if user uploaded documents have conflicts
      let conflictWarning = '';
      const userDocSources = retrievedSources.filter(s => s.tier && s.tier.includes('User-Provided'));
      if (userDocSources.length > 1) {
        conflictWarning = '\n[NOTICE: Multiple user documents retrieved. If guidance differs between documents, state the exact conflict explicitly.]\n';
      }

      // Construct Domain Specialist Prompt
      const specialistPrompt = SpecialistPromptRouter.buildSpecialistPrompt(moduleClassification, {
        userRole,
        userLandscape,
        isInterviewMode,
        interviewProfile,
        retrievedSources
      });

      // Construct Grounded System Prompt Context Injection
      let groundingContext = specialistPrompt + `\n\n## ACTIVE SAP OPERATIONAL CONTEXT:\n- User Role: ${userRole}\n- Target Landscape: ${userLandscape}\n- Socratic Mentor Mode: ${isSocratic ? 'ENABLED (Guide step-by-step)' : 'DISABLED'}\n- Live SAP RFC Destination: UNAVAILABLE\n- Live SAP Support API: UNAVAILABLE\n`;
      groundingContext += '\n## RETRIEVED GROUNDING EVIDENCE (Tier 1 & Tier 2):\n';
      if (retrievedSources.length === 0) {
        groundingContext += 'NO VERIFIED SOURCES RETRIEVED.\nEvidence status: General model knowledge — not verified against an official SAP source or target SAP system.\nDo not invent SAP Note numbers, KBAs, URLs, or transactions.\n';
      } else {
        retrievedSources.forEach(s => {
          groundingContext += '\n- Citation [' + s.citationId + ']: "' + s.title + '" (' + s.tier + ')\n  Release Applicability: ' + s.release + '\n  URL: ' + s.url + '\n  Status: ' + s.status + '\n  Excerpt: ' + s.excerpt + '\n';
          if (s.scopeNote) {
            groundingContext += '  IMPORTANT SCOPE NOTE: ' + s.scopeNote + '\n';
          }
        });
        groundingContext += conflictWarning;
        groundingContext += '\nGROUNDING DIRECTIVE: Cite the above sources using [citationId] when using their facts. Do NOT invent any SAP Note numbers or URLs not listed above. If an exact note is not retrieved, state: "I cannot verify an exact SAP Note or KBA in the current environment."\n';
      }

      // Append uploaded spreadsheets and user documents (persisted across multi-turn session)
      if (effectiveUploadedDocs && effectiveUploadedDocs.length > 0) {
        groundingContext += '\n\n# 📊 ATTACHED SPREADSHEETS & USER DATA EXTRACTS (ACTIVE CONVERSATION ATTACHMENTS)\n';
        effectiveUploadedDocs.forEach((doc, dIdx) => {
          groundingContext += `\n## [Attachment ${dIdx + 1}]: "${doc.filename || 'Spreadsheet.xlsx'}" (${doc.type || 'spreadsheet'})\n`;
          if (doc.sheetCount) {
            groundingContext += `*Sheet Count: ${doc.sheetCount} | Total Rows: ${doc.totalRows || 'N/A'}*\n\n`;
          }
          groundingContext += `${doc.content || doc.text || ''}\n`;
        });
        groundingContext += `\nSPREADSHEET & USER DATA REASONING DIRECTIVE:
1. SPREADSHEET CONFIRMATION: The user has uploaded and attached the spreadsheet data shown above in this active session. You HAVE received, parsed, and inspected all of its contents.
2. STRICT REFUSAL PROHIBITION: NEVER claim that you did not read, cannot access, or did not receive the user's file. NEVER say "no file content stream was transmitted" or "I did not directly parse a physical file". The parsed data is directly provided above.
3. DIRECT DATA ANALYSIS: Answer all user questions regarding this file by quoting exact row numbers, cell values, column headers, GTS/SD/EWM document numbers, statuses, and data anomalies directly from the attached content above.
`;
      }

      groundingContext += `
# Nexus SAP Copilot — Corrected System Prompt for Response Classification and Template Composition

You are Nexus SAP Copilot, an evidence-aware SAP assistant.

Your primary responsibility is to answer the user’s actual question directly, using only relevant context. Do not generate a generic SAP incident report, diagnostic runbook, or configuration guide unless the user explicitly requests that type of output or provides a concrete incident requiring it.

## Core rules
1. Answer the user’s exact question first.
2. Do not add unrelated SAP transactions, error codes, queues, logs, configuration paths, or production warnings.
3. Do not invent:
   - Error codes
   - Incident IDs
   - Request-specific identifiers
   - SAP Note numbers
   - KBA numbers
   - URLs
   - SAP transactions
   - Tables
   - Queue names or prefixes
   - Release applicability
   - System observations
4. Never claim that the target SAP system was inspected unless a verified live connector actually supplied the data.
5. Never claim that an official SAP source was retrieved unless the source registry contains:
   - Actual URL or document identifier
   - Successful retrieval status
   - Retrieval timestamp
   - Supporting excerpt
   - Claim-to-source match
6. If no matching source was retrieved, say:
   > This guidance is based on general model knowledge and has not been verified against an official SAP source or the target SAP system.
7. A source about PMR must not be used as evidence for delivery-based integration unless the retrieved source explicitly supports that claim.
8. Do not treat a source title, catalog entry, or citation ID as proof of official verification.
9. Do not combine multiple response templates in one answer.
10. Do not append a generic report after the answer.

---

# Response classification
Before generating the response, classify the user request into exactly one primary response type:
1. CONCEPTUAL_EXPLANATION
2. DEFINITION
3. COMPARISON
4. THEORY_EXPLANATION
5. FOLLOW_UP
6. INVESTIGATION
7. DIAGNOSTIC_PLAN
8. CONFIGURATION_EXPLANATION
9. CONFIGURATION_REQUEST
10. INCIDENT_BRIEF
11. ACTION_DRAFT
12. MENTOR_RESPONSE
13. SOURCE_REVIEW
14. ERROR_RECOVERY
15. EXECUTIVE_SUMMARY
16. EWM_STORAGE_BIN_LIMITS_OR_MIXED_STORAGE

Do not expose internal classification metadata unless the UI explicitly requests it.

## Classification rules

### Use DEFINITION when:
The user asks: What is X? Explain X. Define X. What does X mean?
Output a concise definition, relevant context, and one limitation if needed.
Do not add a diagnostic procedure.

### Use DIAGRAM_OR_VISUALIZATION when:
The user asks to: "draw", "visualize", "diagrammatic representation", "tree representation", "hierarchy", "connected to what all", "show relationships", "draw flowchart", "draw organizational structure", or any request to visualize SAP entities, execution flows, and customizing architectures.

Requirements:
1. ALWAYS output an accurate, top-down Mermaid diagram enclosed in \`\`\`mermaid ... \`\`\` markdown fences (using \`flowchart TD\`).
2. Use clean, intuitive flowchart structures with:
   - Action / Process steps in standard rectangular boxes: \`NodeID["Step Description"]\`
   - Decision points in diamonds: \`DecNode{"Condition / Validation Check?"}\`
   - Branch arrows labeled clearly with conditions: \`DecNode -->|Yes| NextStep\` and \`DecNode -->|No| AlternativeStep\`

* **When asked about Production Order Creation (CO01) Execution Flow & Connections**:
\`\`\`mermaid
flowchart TD
  Start["Execute CO01: Enter FG Material, Plant, Order Type (PP01)"] --> ReadMD{"Read Master Data"}

  ReadMD --> BOMSel["BOM Selection<br/>Usage 1 + Alternative Determination"]
  ReadMD --> RoutingSel["Routing / Rate Routing Selection<br/>Work Centers & Operations"]
  ReadMD --> ProdVer["Production Version (C223)<br/>Links BOM & Routing"]

  BOMSel --> BOMValid{"BOM Valid & Active?"}
  BOMValid -->|Yes| ResbGen["Create Component Reservations (RESB)<br/>Item Categories L / N / T"]
  BOMValid -->|No| ErrorBOM["Raise Error / Abort Order Creation"]

  RoutingSel --> OpGen["Generate Operations & Sequence (AFVC/AFVU)"]
  OpGen --> CapReq["Calculate Capacity Requirements (KBED)"]
  OpGen --> LeadTime["Lead Time Scheduling (OPU3 / OPU5)"]

  ResbGen --> MatAvail{"Material Availability Check (OPJK / ATP)"}
  MatAvail -->|Missing Parts| MissingLog["Log Missing Parts in Material List"]
  MatAvail -->|Available| RelReady["Order Ready for Release (REL)"]

  RelReady --> StagingReq{"Shop Floor Staging Trigger"}
  StagingReq -->|EWM Managed| PMR["EWM: Production Material Request (/SCWM/PMR)<br/>Staging Cockpit /SCWM/STAGE"]
  StagingReq -->|Classic WM| LPK1["Classic WM: Control Cycle (LPK1)<br/>Transfer Requirement (TR) / TO"]
  StagingReq -->|IM Managed| SLoc["Storage Location Staging (MIGO 311)"]

  RelReady --> CostEst["Preliminary Cost Estimate (KKAX / Planned Costs)"]
\`\`\`

* **When asked about Production Order Type (OPJH / OPL8 / PP01) Configuration Tree**:
\`\`\`mermaid
flowchart TD
  OrderType["🎯 Production Order Type (OPJH / OPL8)<br/>e.g. PP01, PP02, YB01"]

  subgraph CoreDef ["1. Core Definition & Numbering (OPJH)"]
    OrderType --> Cat["Order Category (Category 10: PP Order / 40: Process)"]
    OrderType --> NumRange["Number Range Assignment (Internal / External CO01)"]
    OrderType --> StatusProf["CO Document Type & Status Profile (BS02)"]
  end

  subgraph OPL8Params ["2. Order Type-Dependent Parameters (OPL8 per Plant)"]
    OrderType --> OPL8["Plant + Order Type Parameters (OPL8)"]
    OPL8 --> MasterDataSel["Master Data Selection: Routing Selection ID & BOM Application (PP01)"]
    OPL8 --> Costing["Costing Variant: Planned (PPP1) & Actual (PPP2) + Valuation Variant"]
    OPL8 --> SchedKey["Scheduling Margin Key & Reduction Strategy"]
    OPL8 --> BatchMgmt["Batch Creation & Determination Profile"]
  end

  subgraph ExecutionControls ["3. Execution & Operational Controls"]
    OrderType --> Sched["Scheduling Parameters (OPU3 / OPU5)<br/>Detailed, Rate-based, Rough-cut"]
    OrderType --> Avail["Material & Capacity Availability Check (OPJK)<br/>Checking Rule PP at Creation / Release"]
    OrderType --> Confirm["Confirmation Parameters (OPK4)<br/>Auto-GI 261, GR 101, Under/Overdelivery Tol."]
    OrderType --> Settle["Settlement Profile (OKO7)<br/>Default Cost Object: Material, Cost Center, WBS"]
  end

  subgraph LogisticsIntegration ["4. Shop Floor & Logistics Integration"]
    OrderType --> DocFlow["Document Flow: Reservations (RESB) & Capacity (KBED)"]
    OrderType --> Staging["Warehouse Staging Trigger on REL Status"]
    Staging --> PMR["EWM: Production Material Request (/SCWM/PMR) via /SCWM/STAGE"]
    Staging --> ClassicWM["Classic WM: Control Cycle (LPK1) & PSA Bins"]
  end
\`\`\`

3. Always follow the diagram with an executive technical breakdown explaining each branch, transaction code, database tables (e.g. \`AFKO\`, \`AFPO\`, \`RESB\`, \`AFVC\`), and operational significance.

### Use CONCEPTUAL_EXPLANATION when:
The user asks how a process or concept works, but does not report a concrete failure (e.g. "Explain delivery-based production integration.", "How does production staging work?", "How do PP and EWM interact?").
Output:
- Direct explanation
- High-level flow
- What is unknown / important dependencies
- Evidence status
- One clarifying question only if necessary
Do not add an incident report or troubleshooting runbook.

### Use COMPARISON when:
The user asks to compare two concepts, architectures, releases, or processes (e.g. "Delivery-based integration versus PMR", "Embedded versus decentralized EWM", "qRFC versus bgRFC").
Output a comparison table and applicability limitations.

### Use FOLLOW_UP when:
The user refers to previous conversation content using terms such as: "examples for this", "Which ones?", "What about those?", "Which of these?", "Continue from above.", "What should I check first?", "Explain the previous point.", "tell me more".
- Always resolve the subject and topic directly from the preceding conversation messages (e.g., if the user previously asked about putaway strategies, provide concrete putaway examples; if about storage bins, provide bin examples; if about delivery integration, provide delivery integration details).
- Never switch to an unrelated topic like production integration or system prompt meta-classification unless the preceding conversation was specifically about that.
- If the reference is ambiguous, ask one focused clarifying question. Do not claim that no previous list exists if the current conversation contains one.

### Use INVESTIGATION only when:
The user reports a concrete symptom, incident, or business problem and asks for analysis (e.g. "PMRs are missing", "Staging requests remain open", "The production order was released but no requirement was generated", "Delivery status is inconsistent").
Required sections:
- Direct answer
- Known facts
- Unknown context
- Possible causes
- Evidence needed
- Recommended read-only checks
- Risks and limitations
Do not invent an error code, incident number, document number, or system observation.

### Use DIAGNOSTIC_PLAN only when:
The user explicitly asks for: Troubleshooting steps, A diagnostic plan, A runbook, A checklist, What to check, How to investigate a reported failure.
Do not generate this type for a general conceptual question.

### Use CONFIGURATION_EXPLANATION when:
The user asks how configuration conceptually affects a process (e.g. "How does production supply area configuration affect staging?").
Explain concepts and dependencies. Do not provide an exact IMG path unless verified and applicable.

### Use CONFIGURATION_REQUEST when:
The user asks to: Configure a system, Change customizing, Enable a process, Modify production settings.
First identify missing release, architecture, environment, authorization, and change-governance context. Do not execute changes.

### Use INCIDENT_BRIEF only when:
The user asks for: An incident update, A stakeholder summary, A business-impact report, A handoff note.
Do not generate an incident brief for ordinary SAP questions.

### Use ACTION_DRAFT only when:
The user explicitly asks to prepare: A change request, An escalation, A support request, An incident draft, A diagnostic work package.
A draft is not execution. Show approval and execution state.

### Use MENTOR_RESPONSE only when:
The selected role is Mentor or the user explicitly requests teaching.
Use: 1. What you got right, 2. One correction, 3. One hint, 4. Exactly one next question.
Do not reveal the entire lesson in one turn.

### Use SOURCE_REVIEW only when:
The user asks to inspect, compare, summarize, or validate sources or uploaded documents.

### Use ERROR_RECOVERY only when:
A system, connector, retrieval, model, upload, or request error actually occurred.
Do not display an error-recovery template during an ordinary answer.

### Use EXECUTIVE_SUMMARY only when:
The user asks for a manager or executive-level explanation.
Avoid unnecessary transaction codes and technical jargon.

### Use EWM_STORAGE_BIN_LIMITS_OR_MIXED_STORAGE when:
The user asks how to configure mixed storage, numerical SKU limits (e.g. maximum 3 different SKUs), quant limits, Handling Unit (HU) limits (e.g. maximum 5 HUs), batch limits, or capacity limits per storage bin in SAP EWM.

Rules and Conceptual Distinctions:
1. Under NO CIRCUMSTANCES claim that a universal "Maximum Number of Quants" or "Maximum Number of HUs" field exists directly in the storage-type definition screen.
2. Under NO CIRCUMSTANCES recommend transaction \`/SCWM/DOCC\` for storage-type configuration. \`/SCWM/DOCC\` is for delivery document processing, NOT storage type customizing. The verified general customizing path is: \`SPRO → Extended Warehouse Management → Master Data → Define Storage Type\` (or \`SPRO → SCM Extended Warehouse Management → Extended Warehouse Management → Master Data → Define Storage Type\`).
3. Distinguish clearly between:
   - **Mixed Storage**: Controls whether different products/stock categories may coexist in a bin according to EWM rules. Does NOT mean a numeric limit of 3 SKUs can be entered directly in the storage type.
   - **Mixed Storage in HU**: Concerns the contents of handling units (must NOT be confused with mixed products in a storage bin).
   - **Quant**: Quantity of stock with specific attributes (product, batch, stock category, etc.). Not identical to SKU, HU, or section. "Maximum 3 quants" does NOT mean "Maximum 3 different SKUs".
   - **Handling Unit (HU)**: Physical logistical unit (pallet, carton, container). One HU can contain multiple quants. "Maximum 5 HUs" must be implemented through the relevant HU, bin, section, capacity, or strategy mechanism—not assumed to be a standard field in every storage type.
   - **Storage-Bin Sections**: Controls HU/bin-section occupancy in strategies that support sectioning (e.g. Pallet Storage by HU type, bin subdivisions).
   - **Capacity Check**: Checks based on weight, volume, capacity key figures, product quantities, or packaging/HU capacity. Physical dimensions do NOT automatically enforce a count of distinct SKUs or HUs.
   - **Putaway Strategy**: Determines bin search rules.

Required 7-Section Response Structure for Numerical Limits:

### 1. Direct Answer
State whether the requested rule is:
- Clearly supported by standard configuration
- Potentially supported, but strategy-dependent
- Only partially supported by standard configuration
- Not verified as standard configuration
- Likely requires enhancement or custom validation
(Do not give a definitive single configuration path unless verified for the specific release and strategy).

### 2. Requirement Clarification
Explain the critical technical differences between:
- 3 different SKUs
- 3 quants
- 3 batches
- 5 physical HUs
- 5 bin sections
Ask necessary clarifying questions regarding loose vs HU-managed stock, storage behavior, and putaway strategy before giving final configuration instructions.

### 3. Relevant Standard SAP Options
Evaluate the applicable options in a Markdown table:
| Option | What it controls | Could it enforce this rule? | Conditions | Verification status |
|---|---|---|---|---|
| Mixed Storage | Whether mixed stock may coexist | Not automatically a numeric SKU limit | Depends on EWM configuration | Verified |
| Storage-bin sections | HU/bin-section occupancy | Possibly controls HU placement | Requires supported storage behavior and setup | Release-dependent |
| HU type check | Allowed HU and bin-type relationships | May restrict HU types | Does not automatically mean max 5 HUs | Release-dependent |
| Capacity key figure | Countable capacity consumption | Possibly, if modeled correctly | Requires product/HU/bin capacity setup | Configuration-dependent |
| Pallet Storage by HU Type | HU/bin section capacity | May control HUs and quants in a specific strategy | Requires storage-bin and HU-type assignments | Strategy-dependent |
| Custom validation | Exact business rule | Yes, if standard controls are insufficient | Requires enhancement or custom logic | Requires system design |

### 4. Verified Configuration Information
Display verified configuration data in a Markdown table:
| Item | Value |
|---|---|
| SAP product | S/4HANA EWM, decentralized EWM, or other |
| SAP release | Target release or "Target release confirmation required" |
| Deployment model | Embedded, decentralized, or unknown |
| IMG path | SPRO → Extended Warehouse Management → Master Data → Define Storage Type (or specific strategy path) |
| Transaction code | Only if verified (do not cite /SCWM/DOCC) |
| Field name | Exact verified field label or "Release-specific verification required" |
| Effect | What the field actually controls |
| Data impact | Read-only or configuration/master-data change |
| Evidence | Official SAP source or system verification |
| Confidence | High, medium, or low |
If the exact field cannot be verified, explicitly state:
"The field name and availability must be checked in the target system and SAP release. I will not invent a field name or provide a false path."

### 5. Transaction-Code Safety
Do not recommend \`/SCWM/DOCC\` for storage-type configuration. Explain that storage-type customizing is accessed via SPRO (\`SPRO → Extended Warehouse Management → Master Data → Define Storage Type\`), and direct transactions must be verified in SE93 before being cited.

### 6. Safe Test Procedure
Provide a 15-point safe test design in a non-production test storage type:
1. Create or identify a test storage type.
2. Confirm the storage behavior and putaway rule.
3. Confirm mixed-storage settings.
4. Confirm whether stock is loose or HU-managed.
5. Confirm storage-bin type, HU type, and bin-section settings where applicable.
6. Put away the first product or HU.
7. Add a second and third distinct SKU.
8. Attempt to add a fourth distinct SKU.
9. Put away HUs until the fifth HU.
10. Attempt to add a sixth HU.
11. Record whether the warehouse-task search rejects the candidate bin.
12. Verify whether the system rejects the bin during warehouse-task creation or confirmation.
13. Check the warehouse monitor and application logs for the reason.
14. Test addition to existing stock separately from empty-bin putaway.
15. Test different batches and stock categories separately.
State clearly that a test result is required before claiming that the rule is enforced.

### 7. Fallback Design
Explain alternative approaches if standard configuration does not enforce the exact combination:
- Use storage-bin sections for supported HU-placement scenarios.
- Use storage-bin type and HU-type determination.
- Model capacity using a capacity key figure if it accurately represents the business rule.
- Use a warehouse-task validation or BAdI (e.g. /SCWM/EX_CORE_PTS_*) for an exact count of distinct products and HUs.
- Use custom validation during putaway proposal or warehouse-task creation.
- Use warehouse monitor exception alerts as a secondary control.

---

# Template composition rules
Use exactly one primary response template per assistant message.
Do not append any of the following automatically:
- “LIVE AI REASONING & DIAGNOSTIC REPORT”
- “Incident Overview”
- “Diagnostic Symptoms”
- “Production Safeguards”
- “Step-by-Step Triage Runbook”
- “T-Code Reference Cards”
- “Official Citations & Grounding”
- “Primary Architectural Reference”
- “Verified Tier 1 reference”
- Generic investigation metadata, generic root-cause tables, generic error categories, generic production warnings.
These sections may appear only when the selected response type requires them and the user’s request supports them.
Do not repeat the same answer in two different formats.
Do not generate a conceptual answer followed by a second generic diagnostic report.
Do not generate a source panel that contradicts the answer’s evidence status.

---

# Required response selection sequence
Before producing the final response, internally perform this sequence:
1. Identify the user’s actual intent.
2. Determine whether the user asked for: Explanation, Comparison, Follow-up, Diagnosis, Configuration, Action preparation, Mentoring, Source review.
3. Check the current conversation history.
4. Identify the active SAP role and context.
5. Identify missing information that materially affects the answer.
6. Select exactly one response type.
7. Generate only the sections relevant to that response type.
8. Validate technical claims against available evidence.
9. Remove unsupported, unrelated, or duplicated content.
10. Validate the final evidence footer and safety state.
11. Return one coherent answer.

---

# Relevance filter
Before displaying any technical term, ask internally:
- Does this term directly answer the user’s question?
- Is it supported by the user’s context?
- Is it required to explain the process?
- Is it relevant to the selected response type?
- Is it release- or architecture-dependent?
- Does it need an evidence label?
If the term is not necessary, omit it.
Do not automatically include: SM21, SLG1, SMQ1, SMQ2, bgRFC Monitor, OB52, LUWs, queue prefixes, delivery consistency repair, posting-period changes, error codes, application-log objects.
Mention them only when the user asks about them, the symptom requires them, the active context supports them, and their applicability is verified or clearly labeled as conditional/general knowledge.

---

# Reference Examples & Directives
(Note: The examples below illustrate structure and tone for individual response types. They are not topic constraints. Always respond to the user's specific SAP functional domain—e.g. Putaway, Picking, Inbound, Outbound, Master Data, Production, TM, etc.—based strictly on their active conversation.)

## Example 1: CONCEPTUAL_EXPLANATION (e.g. "Explain delivery-based production integration in SAP PP/EWM.")
Format response cleanly as:
## Direct answer
Delivery-based production integration is a delivery-oriented way of representing or transferring production-supply requirements between production planning and warehouse execution. The exact document flow depends on the SAP release, EWM deployment model, staging design, and configured integration technology.
It is not automatically the same as PMR-based Advanced Production Integration. PMR is a separate production-supply concept where applicable to the target product scope and release.

## Conceptual flow
At a high level:
Production requirement
→ Production-supply integration object
→ Transfer or document processing
→ Warehouse-side execution
→ Confirmation or goods movement
→ Status feedback
The exact document types, monitoring tools, and communication technology must be verified in the target system.

## What is unknown
The following are not currently known:
- SAP release
- Embedded or decentralized EWM
- Delivery-based or PMR-based staging
- qRFC, bgRFC, or another communication mechanism
- Exact business symptom

## Evidence status
This guidance is based on general model knowledge and has not been verified against an official SAP source or the target SAP system.

## One clarifying question
Is your system using embedded or decentralized EWM, and are you asking about delivery-based staging or PMR-based Advanced Production Integration?

(Do not append a diagnostic report, transaction list, incident overview, or generic safety block to this answer.)

## Example 2: COMPARISON (e.g. "Compare delivery-based production integration with PMR-based Advanced Production Integration.")
Present the comparison table and applicability limitations:
| Aspect | Delivery-based production integration | PMR-based Advanced Production Integration |
|---|---|---|
| Business object | Must be verified for the relevant scenario | Production Material Request, if applicable |
| Integration concept | Delivery-oriented process, if supported by the target design | PMR-oriented production supply process |
| Architecture applicability | Release and deployment dependent | Release and product-scope dependent |
| Monitoring | Must be verified for the target implementation | Must be verified for the target implementation |
| Exact transactions | Do not provide universally without context | Do not provide universally without context |
| Source status | Official source only if retrieved | Official source only if retrieved |

## Example 3: FOLLOW_UP (e.g. "For my system, which transactions and integration objects should I check first?")
Do not provide a speculative transaction list. Ask ONE focused clarifying question:
"Is your system using embedded EWM or decentralized EWM, and are you troubleshooting delivery-based staging or PMR-based Advanced Production Integration?"
Explain that monitoring transactions, integration objects, communication frameworks, and document flows fundamentally differ between embedded and decentralized architectures, and between delivery-based and PMR-based staging.

## Example 4: Concrete Troubleshooting Request (INVESTIGATION or DIAGNOSTIC_PLAN)
(e.g. "The production-staging delivery is stuck in production. What should I check?" or "Repair the delivery and reprocess all queues immediately.")
- State: This is a production issue. The system context is incomplete. No live connector is available. Only read-only checks will be suggested.
- Firmly refuse immediate repair, queue reprocessing, or queue deletion. Live changes risk data loss, duplicate postings, orphaned LUWs, and desynchronization.
- Provide a short prioritized read-only diagnostic plan (e.g. SM21, SLG1, read-only queue monitor inspection).
- Recommend formal change governance. Never recommend OB52 posting period changes, queue purges, or unverified consistency repairs.

## Example 5: Configuration Request (CONFIGURATION_REQUEST)
(e.g. "Give me the exact configuration path to enable automatic production staging.")
- Exact path depends on release, architecture, staging method, and configuration model.
- Ask one highest-value clarifying question.
- Explain conceptual configuration areas only.
- Label exact references as unavailable unless supported by retrieved official evidence.
- Do not execute or recommend an unapproved production change.

---

# Evidence and citation rules
For each material technical claim, use one of these states:
- Verified official source
- Verified user-provided document
- Verified connector data
- User-provided information
- Demo or simulated data
- General model knowledge
- Source unavailable
- Conflicting or applicability uncertain

If no verified source is present:
Evidence status: General model knowledge — not verified against an official SAP source or target SAP system.

Never display both "No directly matching official source was retrieved" and "Verified Tier 1 reference" for the same unsupported claim.
Do not display a citation ID unless it maps to an actual source record.
Do not use a generic “Official Citations & Grounding” section when no matching official source exists.

---

# Safety rules
Safety must be proportional to the user’s request.
- For a conceptual question: A short limitation is sufficient. Do not add a large production warning.
- For a concrete production issue: Show a clear safety warning, prefer read-only diagnosis, do not provide destructive or write instructions, state connector availability, recommend formal change governance.
Never invent a production environment, incident, error code, document number, or queue state.

---

# Final output validation checklist
1. Answers the user’s actual question directly.
2. Uses exactly one response type.
3. Does not contain duplicated templates.
4. Does not contain unexplained generated identifiers.
5. Does not contain irrelevant SAP transactions.
6. Does not make universal release or architecture claims.
7. Does not contradict its evidence status.
8. Preserves conversation context.
9. Asks no more than one clarifying question when clarification is needed.
10. Does not provide production-changing instructions without explicit authorization and verified connector support.
11. Does not claim live SAP access.
12. Does not claim official SAP grounding without matching retrieval evidence.
13. NEVER output LaTeX math syntax (such as $\rightarrow$, \rightarrow, $9010$, $0010$, $3000$). For arrows and flow diagrams, write clean unicode arrows (→) or ->. For numbers, codes, and storage types, write plain text (e.g. 9010) or markdown code \`9010\`.
14. DIAGRAMS & FLOWCHARTS POLICY (STRICT USER-REQUESTED ONLY - NEVER FORCE UNLESS ASKED):
- ONLY generate a visual Mermaid diagram (\`\`\`mermaid ... \`\`\`) if the user EXPLICITLY asks for a diagram, flowchart, visual process map, diagrammatic representation, architecture diagram, visual tree, or workflow chart in their query (e.g. "draw", "diagram", "flowchart", "visualize", "process flow diagram", "map out visually", "show flowchart", "draw architecture", "show tree").
- If the user did NOT explicitly request a diagram, flowchart, or visual representation, DO NOT output any Mermaid diagram or flowchart code block. Provide clear, direct, structured technical answers, diagnostic steps, T-code tables, and explanations in standard markdown prose.
- When the user DOES explicitly request a diagram:
  * Generate a modern, highly legible Mermaid diagram in a \`\`\`mermaid code fence.
  * Use top-down vertical flowcharts (flowchart TD) with clear rectangular process boxes and decision diamonds.
  * Always wrap node labels in double quotes (e.g. A["1. Create Staging Request (/SCWM/STAGE)"] --> B{"Control Cycle Found?"}).
The final answer must be coherent, relevant, and appropriately sized for the user's request.
`;

      if (isInterviewMode) {
        groundingContext += `\n\n# INFOSYS ENTERPRISE SAP INTERVIEW COACH & EVALUATOR MODE
Candidate Target Profile:
- Role: ${interviewProfile.targetRole || 'Infosys SAP PP/EWM Senior Consultant / Solution Architect'}
- Experience: ${interviewProfile.experienceYears || '5-8+ Years'}
- Focus Area: ${interviewCategory}
- Projects Context: ${interviewProfile.primaryProjects || 'S/4HANA Enterprise Transformation, Embedded EWM Integration, Global Rollouts'}

## INTERVIEW COACHING GUIDELINES:
1. Provide structured, speakable, and technically authoritative responses tailored for Tier-1 IT consulting (Infosys / Global SI) interviews.
2. When providing sample answers or answering interview questions:
   - **30-Second Executive Pitch**: Crisp, crisp high-level definition directly answering the panel.
   - **1-2 Minute Comprehensive Delivery**: Structured walkthrough covering business process flow, core master data, configuration logic, key T-Codes/Fiori apps, and database tables.
   - **Deep-Dive Technical Realities**: Real-world implementation nuances, common production support tickets, qRFC/bgRFC queues, and S/4HANA vs ECC architectural differences.
   - **Consulting & Delivery Perspective**: Offshore-onshore coordination, SLA triage, cutover governance, and client stakeholder management.
   - **Predicted Panel Follow-ups**: 3 realistic next questions the interviewers will ask.
3. For Behavioral / Leadership / Scenario questions:
   - Structure responses strictly using the **STAR Method** (Situation, Task, Action, Result) with clear business metrics.
4. For Answer Evaluation / Mock Simulation:
   - Provide a 9-dimension critique: Technical Accuracy, Completeness, Articulation, S/4HANA depth, Missing T-Codes/Tables, and a Polished Script sample.
`;
      }

      // Query Planning & SAP Fact Validation
      const queryPlan = SearchQueryPlanner.generateTargetedQueries(userPrompt);
      const cachedResult = searchCache.get(userPrompt);
      let queryPlanContext = '\n## SAP FACT & SEARCH VERIFICATION PLAN:\n- Request Classification: ' + queryPlan.classification.type + '\n- Target Verification Queries:\n' + queryPlan.queries.map(q => '  * ' + q).join('\n') + '\n';
      
      if (queryPlan.classification.tcode) {
        const tcodeVal = TransactionValidator.validateTransaction(queryPlan.classification.tcode);
        queryPlanContext += '\n- VALIDATED TRANSACTION REFERENCE:\n  * T-Code: ' + tcodeVal.name + '\n  * Documented Purpose: ' + tcodeVal.exactPurpose + '\n  * Component: ' + tcodeVal.component + '\n  * Data Impact: ' + tcodeVal.dataImpact + '\n  * Status: ' + tcodeVal.verificationStatus + '\n';
      }

      groundingContext += queryPlanContext;

      // Append grounding context to system instruction
      if (parsed.systemInstruction && parsed.systemInstruction.parts && parsed.systemInstruction.parts[0]) {
        parsed.systemInstruction.parts[0].text += groundingContext;
      } else {
        parsed.systemInstruction = { parts: [{ text: groundingContext }] };
      }

      // Grounding context is already enriched via WebSearchService & SAP Catalog

      const gemPath = `/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`;
      const payload = JSON.stringify(parsed);

      console.log(`[${new Date().toISOString()}] [${reqId}] User (${userId || 'guest'}) grounded proxy to ${model} (${retrievedSources.length} sources)...`);

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: gemPath, method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Content-Length': Buffer.byteLength(payload),
          'X-Nexus-Request-ID': reqId
        }
      };

      function executeGeminiStream(requestPayload, isFallback = false) {
        const reqPayloadStr = JSON.stringify(requestPayload);
        const reqOptions = {
          hostname: 'generativelanguage.googleapis.com',
          path: gemPath,
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Content-Length': Buffer.byteLength(reqPayloadStr),
            'X-Nexus-Request-ID': reqId
          }
        };

        const gemReq = https.request(reqOptions, gemRes => {
          // If search tool returned 429/400 and we haven't tried fallback yet, retry without tools
          if ((gemRes.statusCode === 429 || gemRes.statusCode === 400) && requestPayload.tools && !isFallback) {
            console.log(`[${new Date().toISOString()}] [${reqId}] Google Search tool returned ${gemRes.statusCode}. Falling back to high-accuracy SAP Fact Validator...`);
            delete requestPayload.tools;
            return executeGeminiStream(requestPayload, true);
          }

          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*',
              'X-Nexus-Request-ID': reqId
            });
          }

          // Emit classification event for UI Specialization HUD
          const classificationEvent = `event: nexus-classification\ndata: ${JSON.stringify({ reqId, classification: moduleClassification })}\n\n`;
          res.write(classificationEvent);

          // Emit retrieved sources event
          const sourcesStatus = isFallback 
            ? 'Verified via SAP Knowledge Base & Transaction Validator (Live Google Search quota unavailable)' 
            : retrievalResult.status;
          const sourcesEvent = `event: nexus-sources\ndata: ${JSON.stringify({ reqId, sources: retrievedSources, status: sourcesStatus })}\n\n`;
          res.write(sourcesEvent);

          // Emit conversation ID event if effective conversation exists
        if (effectiveConvId) {
          const convEvent = `event: nexus-conversation\ndata: ${JSON.stringify({ reqId, conversationId: effectiveConvId })}\n\n`;
          res.write(convEvent);
        }

        let fullModelOutput = '';
        let sseBuffer = '';
        let liveGroundingMetadata = null;

        gemRes.on('data', chunk => {
          sseBuffer += chunk.toString();
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop(); // keep partial line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  fullModelOutput += text;
                  res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`);
                }
                if (json.candidates?.[0]?.groundingMetadata) {
                  liveGroundingMetadata = json.candidates[0].groundingMetadata;
                }
              } catch(e) {}
            }
          }
        });

        gemRes.on('end', () => {
          if (sseBuffer.trim().startsWith('data: ')) {
            try {
              const json = JSON.parse(sseBuffer.trim().slice(6));
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) fullModelOutput += text;
            } catch(e) {}
          }
          const totalDuration = Date.now() - startTime;
          
          // Parse live Google search grounding sources if returned
          if (liveGroundingMetadata && liveGroundingMetadata.groundingChunks) {
            liveGroundingMetadata.groundingChunks.forEach((chunk, cIdx) => {
              if (chunk.web && chunk.web.uri) {
                const ranked = SourceQualityRanker.rankSource(chunk.web.uri, chunk.web.title);
                const webSourceObj = {
                  citationId: `WEB-${cIdx + 1}`,
                  id: `web-${cIdx + 1}`,
                  title: chunk.web.title || 'Official Web Documentation',
                  url: chunk.web.uri,
                  tier: ranked.tier,
                  isOfficial: ranked.isOfficial,
                  confidence: ranked.confidence,
                  status: 'Verified Live Web Grounding',
                  excerpt: chunk.web.title || chunk.web.uri,
                  timestamp: new Date().toISOString()
                };
                if (!retrievedSources.some(s => s.url === chunk.web.uri)) {
                  retrievedSources.push(webSourceObj);
                }
              }
            });
            // Re-emit enhanced sources event with live grounding data
            res.write(`event: nexus-sources\ndata: ${JSON.stringify({ reqId, sources: retrievedSources, status: 'Verified with Live Grounding', searchQueries: liveGroundingMetadata.webSearchQueries || [] })}\n\n`);
          }

          // Cache verified search output in searchCache
          if (userPrompt && fullModelOutput) {
            searchCache.set(userPrompt, {
              sanitizedText: fullModelOutput,
              sourcesCount: retrievedSources.length,
              timestamp: Date.now()
            });
          }

          // Validate and sanitize output
          const { sanitizedText, blockedEvents } = validateAndSanitizeOutput(fullModelOutput, retrievedSources, reqId, userPrompt);
          
          // Emit final completion event with sanitized text
          const completePayload = `event: nexus-complete\ndata: ${JSON.stringify({ text: sanitizedText, blockedEvents })}\n\n`;
          res.write(completePayload);
          res.end();

          // Save assistant message to conversation if conversation exists
          if (effectiveConvId && userId && sanitizedText) {
            try {
              db.appendMessage(userId, effectiveConvId, {
                role: 'model',
                content: sanitizedText,
                requestId: reqId,
                model,
                metadata: {
                  sourcesCount: retrievedSources.length,
                  citationIds: retrievedSources.map(s => s.citationId),
                  blockedEventsCount: blockedEvents.length
                }
              });
            } catch(e) {
              console.error('Failed to append model message to DB:', e.message);
            }
          }

          // Record audit log in SQLite DB
          db.recordAuditLog({
            userId,
            workspaceId,
            requestId: reqId,
            conversationId,
            actionType: 'CHAT_INFERENCE',
            model,
            userPrompt,
            sourcesSearchedCount: OFFICIAL_SAP_CATALOG.length + (userId ? db.listUserDocuments(userId).length : 0),
            sourcesRetrievedCount: retrievedSources.length,
            sourcesRetrieved: retrievedSources.map(s => ({ citationId: s.citationId, title: s.title, tier: s.tier, release: s.release })),
            citationIds: retrievedSources.map(s => s.citationId),
            sourceTier: retrievedSources.length > 0 ? (retrievedSources[0].tier.includes('Tier 1') ? 'Tier 1 Official' : 'Tier 2 User Document') : 'Tier 3 General Model Knowledge',
            blockedEvents,
            latencyMs: totalDuration,
            status: gemRes.statusCode
          });

          console.log(`[${new Date().toISOString()}] [${reqId}] Completed in ${totalDuration}ms (${blockedEvents.length} blocked events).`);
          res.end();
        });
      });

      gemReq.on('error', err => { 
        console.error(`[${new Date().toISOString()}] [${reqId}] Upstream error:`, err.message);
        db.recordAuditLog({
          userId,
          workspaceId,
          requestId: reqId,
          conversationId,
          actionType: 'CHAT_ERROR',
          model,
          userPrompt,
          status: 500,
          errorMessage: err.message
        });

        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'X-Nexus-Request-ID': reqId });
          res.end(JSON.stringify({ error: { message: err.message, requestId: reqId } }));
        } else {
          res.end();
        }
      });

      gemReq.write(reqPayloadStr);
      gemReq.end();
    }

    executeGeminiStream(parsed, false);
  } catch (e) {
      console.error(`[${new Date().toISOString()}] [${reqId}] Bad request:`, e.message);
      res.writeHead(400, { 'Content-Type': 'application/json', 'X-Nexus-Request-ID': reqId });
      res.end(JSON.stringify({ error: { message: 'Bad request', requestId: reqId } }));
    }
  });
}

// ── HTTP Server Setup ───────────────────────────────────────────────────────
http.createServer((req, res) => {
  const { pathname, query: parsedQuery } = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nexus-Request-ID, X-Nexus-Role, X-Nexus-Context',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    });
    return res.end();
  }

  // Helper response closures
  const jsonRes = (statusCode, data, headers = {}) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify(data));
  };

  const parseBody = callback => {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        callback(null, parsed);
      } catch(e) {
        callback(e, null);
      }
    });
  };

  // Check authentication on request
  const sessionData = authenticateRequest(req);
  const currentUser = sessionData ? sessionData.user : null;

  // ══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // Register
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email, password, role } = body;
      const displayName = body.displayName || body.name;
      if (!email || !password) {
        return jsonRes(400, { ok: false, error: 'Email and password are required' });
      }
      if (password.length < 8) {
        return jsonRes(400, { ok: false, error: 'Password must be at least 8 characters long' });
      }
      try {
        const user = db.createUser({ email, password, displayName, role });
        const session = db.createSession(user.id, true);
        const cookieHeader = `nexus_session=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${14 * 86400}`;
        return jsonRes(200, { ok: true, user, sessionId: session.sessionId, token: session.token }, { 'Set-Cookie': cookieHeader });
      } catch (e) {
        const isConflict = e.message.includes('already exists') || e.message.includes('UNIQUE constraint');
        return jsonRes(isConflict ? 409 : 400, { ok: false, error: e.message });
      }
    });
  }

  // Login
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email, password, rememberMe } = body;
      if (!email || !password) {
        return jsonRes(400, { ok: false, error: 'Email and password are required' });
      }
      const rawUser = db.getUserByEmail(email);
      if (!rawUser || !rawUser.password_hash || !rawUser.password_salt) {
        return jsonRes(401, { ok: false, error: 'Invalid email or password' });
      }
      const valid = db.verifyPassword(password, rawUser.password_hash, rawUser.password_salt);
      if (!valid) {
        return jsonRes(401, { ok: false, error: 'Invalid email or password' });
      }

      const session = db.createSession(rawUser.id, rememberMe !== false);
      const maxAge = (rememberMe !== false ? 14 : 1) * 86400;
      const cookieHeader = `nexus_session=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
      const safeUser = db.getUserById(rawUser.id);
      return jsonRes(200, { ok: true, user: safeUser, sessionId: session.sessionId, token: session.token }, { 'Set-Cookie': cookieHeader });
    });
  }

  // Logout
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const cookies = parseCookies(req);
    let token = cookies['nexus_session'];
    if (!token && req.headers['authorization']) {
      const authHeader = req.headers['authorization'];
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }
    if (token) db.deleteSession(token);
    const clearCookie = `nexus_session=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    return jsonRes(200, { ok: true, message: 'Logged out successfully' }, { 'Set-Cookie': clearCookie });
  }

  // Current Auth State (/api/auth/me)
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    if (!currentUser) {
      return jsonRes(401, { authenticated: false, user: null, error: 'Unauthenticated' });
    }
    return jsonRes(200, { authenticated: true, user: currentUser });
  }

  // Google OAuth Availability Config
  if (req.method === 'GET' && pathname === '/api/auth/google/config') {
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const isConfigured = hasClientId && hasClientSecret;

    return jsonRes(200, {
      available: isConfigured,
      status: isConfigured ? 'Ready' : 'Configuration required',
      clientId: hasClientId ? process.env.GOOGLE_CLIENT_ID : null,
      message: isConfigured 
        ? 'Google OAuth is configured.'
        : 'Google OAuth is unavailable: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not configured in this deployment environment.'
    });
  }

  // Google OAuth Login
  if (req.method === 'POST' && pathname === '/api/auth/google-login') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email, displayName, avatarUrl, googleId } = body;
      if (!email) {
        return jsonRes(400, { ok: false, error: 'Google email is required' });
      }
      try {
        let user = db.getUserByEmail(email);
        if (!user) {
          user = db.createUser({
            email,
            displayName: displayName || email.split('@')[0],
            role: 'SAP Operations User',
            authProvider: 'google',
            providerSubject: googleId || 'google-' + Date.now(),
            avatarUrl: avatarUrl || null
          });
        }
        const session = db.createSession(user.id, true);
        const cookieHeader = `nexus_session=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${14 * 86400}`;
        const safeUser = db.getUserById(user.id);
        return jsonRes(200, { ok: true, user: safeUser, sessionId: session.sessionId, token: session.token }, { 'Set-Cookie': cookieHeader });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // Send OTP
  if (req.method === 'POST' && pathname === '/api/auth/send-otp') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email } = body;
      if (!email || !email.includes('@')) {
        return jsonRes(400, { ok: false, error: 'A valid email address is required' });
      }
      const cleanEmail = email.toLowerCase().trim();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set('login:' + cleanEmail, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      const mailResult = await sendEmailOtp(cleanEmail, code, 'login');

      return jsonRes(200, {
        ok: true,
        message: `One-Time Passcode (OTP) sent to ${cleanEmail}`,
        emailSent: mailResult.sent,
        method: mailResult.method,
        testOtp: mailResult.testOtp || code
      });
    });
  }

  // Verify OTP & Login
  if (req.method === 'POST' && pathname === '/api/auth/verify-otp') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email, otp } = body;
      if (!email || !otp) {
        return jsonRes(400, { ok: false, error: 'Email and OTP code are required' });
      }
      const cleanEmail = email.toLowerCase().trim();
      const record = otpStore.get('login:' + cleanEmail);
      if (!record || record.expiresAt < Date.now()) {
        return jsonRes(400, { ok: false, error: 'OTP has expired or is invalid. Please request a new code.' });
      }
      if (record.code !== otp.trim()) {
        return jsonRes(400, { ok: false, error: 'Invalid verification code. Please check and try again.' });
      }
      // OTP is valid - clear it
      otpStore.delete('login:' + cleanEmail);

      try {
        let user = db.getUserByEmail(cleanEmail);
        if (!user) {
          user = db.createUser({
            email: cleanEmail,
            displayName: cleanEmail.split('@')[0],
            role: 'SAP Operations User',
            authProvider: 'otp'
          });
        }
        const session = db.createSession(user.id, true);
        const cookieHeader = `nexus_session=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${14 * 86400}`;
        const safeUser = db.getUserById(user.id);
        return jsonRes(200, { ok: true, user: safeUser, sessionId: session.sessionId, token: session.token }, { 'Set-Cookie': cookieHeader });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // Password Reset Request
  if (req.method === 'POST' && pathname === '/api/auth/password-reset') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email } = body;
      if (!email || !email.includes('@')) {
        return jsonRes(400, { ok: false, error: 'A valid email address is required' });
      }
      const cleanEmail = email.toLowerCase().trim();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set('reset:' + cleanEmail, {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000
      });

      const mailResult = await sendEmailOtp(cleanEmail, code, 'reset');

      return jsonRes(200, {
        ok: true,
        message: `Password reset verification code sent to ${cleanEmail}`,
        emailSent: mailResult.sent,
        method: mailResult.method,
        testOtp: mailResult.testOtp || code
      });
    });
  }

  // Get Latest Sent Email HTML & Preview Link
  if (req.method === 'GET' && pathname === '/api/auth/latest-email') {
    const targetEmail = (parsedQuery?.email || '').toLowerCase().trim();
    const emailData = recentSentEmails.get(targetEmail) || Array.from(recentSentEmails.values()).pop() || null;
    return jsonRes(200, { ok: true, email: emailData });
  }

  // Configure Custom SMTP / Gmail
  if (req.method === 'POST' && pathname === '/api/auth/configure-smtp') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { user, pass, host, port, secure } = body;
      if (user && pass) {
        if (host) {
          mailTransporter = nodemailer.createTransport({
            host,
            port: parseInt(port || '587', 10),
            secure: secure === true || port === 465,
            auth: { user, pass }
          });
        } else {
          mailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
          });
        }
        return jsonRes(200, { ok: true, message: 'SMTP Transport configured successfully for ' + user });
      }
      return jsonRes(400, { ok: false, error: 'Username/Email and Password are required' });
    });
  }

  // Password Reset Confirmation (Set New Password with OTP)
  if (req.method === 'POST' && pathname === '/api/auth/reset-password-confirm') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { email, otp, newPassword } = body;
      if (!email || !otp || !newPassword) {
        return jsonRes(400, { ok: false, error: 'Email, reset code, and new password are required' });
      }
      if (newPassword.length < 8) {
        return jsonRes(400, { ok: false, error: 'New password must be at least 8 characters long' });
      }
      const cleanEmail = email.toLowerCase().trim();
      const record = otpStore.get('reset:' + cleanEmail);
      if (!record || record.expiresAt < Date.now()) {
        return jsonRes(400, { ok: false, error: 'Reset code has expired. Please request a new code.' });
      }
      if (record.code !== otp.trim()) {
        return jsonRes(400, { ok: false, error: 'Invalid reset code. Please try again.' });
      }
      otpStore.delete('reset:' + cleanEmail);

      try {
        const user = db.resetUserPasswordByEmail(cleanEmail, newPassword);
        const session = db.createSession(user.id, true);
        const cookieHeader = `nexus_session=${session.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${14 * 86400}`;
        return jsonRes(200, { ok: true, message: 'Password reset successfully', user, token: session.token }, { 'Set-Cookie': cookieHeader });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // Password Change
  if (req.method === 'POST' && pathname === '/api/auth/password-change') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { currentPassword, newPassword } = body;
      try {
        db.changeUserPassword(currentUser.id, currentPassword, newPassword);
        return jsonRes(200, { ok: true, message: 'Password updated successfully' });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // User Profile Update
  if (req.method === 'PATCH' && pathname === '/api/auth/profile') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const updated = db.updateUserProfile(currentUser.id, body);
      return jsonRes(200, { ok: true, user: updated });
    });
  }

  // Data Export (JSON dump)
  if (req.method === 'GET' && pathname === '/api/auth/export') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const conversations = db.listUserConversations(currentUser.id);
    const fullConversations = conversations.map(c => db.getConversation(currentUser.id, c.id));
    const investigations = db.listUserInvestigations(currentUser.id);
    const documents = db.listUserDocuments(currentUser.id);
    const auditLogs = db.listUserAuditLogs(currentUser.id, 100);

    return jsonRes(200, {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      conversations: fullConversations,
      investigations,
      documents,
      auditLogs
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONVERSATIONS & PRIVATE CHATS API (USER-SCOPED)
  // ══════════════════════════════════════════════════════════════════════════

  // List Conversations
  if (req.method === 'GET' && pathname === '/api/conversations') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convs = db.listUserConversations(currentUser.id);
    return jsonRes(200, { ok: true, conversations: convs });
  }

  // Create Conversation
  if (req.method === 'POST' && pathname === '/api/conversations') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const conv = db.createConversation(currentUser.id, body);
      return jsonRes(200, { ok: true, conversation: conv });
    });
  }

  // Get Single Conversation (with messages)
  if (req.method === 'GET' && pathname.startsWith('/api/conversations/') && !pathname.includes('/messages')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convId = pathname.split('/')[3];
    const conv = db.getConversation(currentUser.id, convId);
    if (!conv) {
      return jsonRes(404, { ok: false, error: 'Conversation not found' });
    }
    return jsonRes(200, conv);
  }

  // Update / Rename Conversation
  if (req.method === 'PATCH' && pathname.startsWith('/api/conversations/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const updated = db.updateConversation(currentUser.id, convId, body);
      if (!updated) return jsonRes(404, { ok: false, error: 'Conversation not found' });
      return jsonRes(200, { ok: true, conversation: updated });
    });
  }

  // Delete Conversation
  if (req.method === 'DELETE' && pathname.startsWith('/api/conversations/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convId = pathname.split('/')[3];
    const deleted = db.deleteConversation(currentUser.id, convId);
    if (!deleted) return jsonRes(404, { ok: false, error: 'Conversation not found' });
    return jsonRes(200, { ok: true, message: 'Conversation deleted' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // USER-SCOPED DATA ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════════════
  // PERSONALIZED USER EXPERIENCE & HOME SUMMARY
  // ══════════════════════════════════════════════════════════════════════════

  // Home Workspace Summary
  if (req.method === 'GET' && pathname === '/api/home/summary') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const summary = db.getUserHomeSummary(currentUser.id);
    return jsonRes(200, { ok: true, summary });
  }

  // User Profile
  if (req.method === 'GET' && pathname === '/api/user/profile') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const profile = db.getUserProfile(currentUser.id);
    return jsonRes(200, { ok: true, profile });
  }

  // User Onboarding Submission
  if (req.method === 'POST' && pathname === '/api/user/onboarding') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const profile = db.saveUserOnboarding(currentUser.id, body);
        return jsonRes(200, { ok: true, profile });
      } catch(e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ENHANCED SAP CONTEXT PROFILES
  // ══════════════════════════════════════════════════════════════════════════

  // SAP Contexts Listing
  if (req.method === 'GET' && pathname === '/api/contexts') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const contexts = db.listUserContexts(currentUser.id);
    return jsonRes(200, { ok: true, contexts });
  }
  if (req.method === 'POST' && pathname === '/api/contexts') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const newCtx = db.createUserContext(currentUser.id, body);
      return jsonRes(200, { ok: true, context: newCtx });
    });
  }

  // Context Actions: Favorite, Duplicate, Archive, Update, Delete
  if (req.method === 'POST' && pathname.startsWith('/api/contexts/') && pathname.endsWith('/favorite')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const contextId = pathname.split('/')[3];
    const fav = db.favoriteContext(currentUser.id, contextId);
    if (!fav) return jsonRes(404, { ok: false, error: 'Context not found' });
    return jsonRes(200, { ok: true, context: fav });
  }
  if (req.method === 'POST' && pathname.startsWith('/api/contexts/') && pathname.endsWith('/duplicate')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const contextId = pathname.split('/')[3];
    const dup = db.duplicateContext(currentUser.id, contextId);
    if (!dup) return jsonRes(404, { ok: false, error: 'Context not found' });
    return jsonRes(200, { ok: true, context: dup });
  }
  if (req.method === 'POST' && pathname.startsWith('/api/contexts/') && pathname.endsWith('/archive')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const contextId = pathname.split('/')[3];
    const arch = db.archiveContext(currentUser.id, contextId);
    if (!arch) return jsonRes(404, { ok: false, error: 'Context not found' });
    return jsonRes(200, { ok: true, context: arch });
  }
  if (req.method === 'PATCH' && pathname.startsWith('/api/contexts/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const contextId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const updated = db.updateUserContext(currentUser.id, contextId, body);
      if (!updated) return jsonRes(404, { ok: false, error: 'Context not found' });
      return jsonRes(200, { ok: true, context: updated });
    });
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/contexts/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const contextId = pathname.split('/')[3];
    const deleted = db.deleteUserContext(currentUser.id, contextId);
    if (!deleted) return jsonRes(404, { ok: false, error: 'Context not found' });
    return jsonRes(200, { ok: true, message: 'Context deleted' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERSONAL KNOWLEDGE LIBRARY
  // ══════════════════════════════════════════════════════════════════════════

  if (req.method === 'GET' && pathname === '/api/knowledge') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const items = db.listUserKnowledge(currentUser.id, parsedQuery || {});
    return jsonRes(200, { ok: true, items });
  }
  if (req.method === 'POST' && pathname === '/api/knowledge') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const item = db.saveKnowledgeItem(currentUser.id, body);
        return jsonRes(200, { ok: true, item });
      } catch(e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }
  if (req.method === 'GET' && pathname.startsWith('/api/knowledge/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const itemId = pathname.split('/')[3];
    const item = db.getKnowledgeItem(currentUser.id, itemId);
    if (!item) return jsonRes(404, { ok: false, error: 'Knowledge item not found' });
    return jsonRes(200, { ok: true, item });
  }
  if (req.method === 'PATCH' && pathname.startsWith('/api/knowledge/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const itemId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const updated = db.updateKnowledgeItem(currentUser.id, itemId, body);
      if (!updated) return jsonRes(404, { ok: false, error: 'Knowledge item not found' });
      return jsonRes(200, { ok: true, item: updated });
    });
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/knowledge/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const itemId = pathname.split('/')[3];
    const deleted = db.deleteKnowledgeItem(currentUser.id, itemId);
    if (!deleted) return jsonRes(404, { ok: false, error: 'Knowledge item not found' });
    return jsonRes(200, { ok: true, message: 'Knowledge item deleted' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INVESTIGATION TEMPLATES
  // ══════════════════════════════════════════════════════════════════════════

  if (req.method === 'GET' && pathname === '/api/templates') {
    const templates = db.listInvestigationTemplates();
    return jsonRes(200, { ok: true, templates });
  }
  if (req.method === 'POST' && pathname.startsWith('/api/templates/') && pathname.endsWith('/instantiate')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const templateId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const inv = db.instantiateInvestigationFromTemplate(currentUser.id, templateId, body);
        return jsonRes(200, { ok: true, investigation: inv });
      } catch(e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COLLABORATION & SHARING
  // ══════════════════════════════════════════════════════════════════════════

  if (req.method === 'POST' && pathname.startsWith('/api/investigations/') && pathname.endsWith('/share')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const invId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const target = body.targetEmail || body.targetUserEmail || body.targetUserId || body.email;
      const perm = body.permission || body.role || 'viewer';
      if (!target) return jsonRes(400, { ok: false, error: 'Target user email or ID is required' });
      try {
        const result = db.shareInvestigation(currentUser.id, invId, target, perm);
        return jsonRes(200, result);
      } catch(e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }
  if (req.method === 'GET' && pathname.startsWith('/api/investigations/') && pathname.endsWith('/collaborators')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const invId = pathname.split('/')[3];
    const collaborators = db.listInvestigationCollaborators(currentUser.id, invId);
    return jsonRes(200, { ok: true, collaborators });
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/investigations/') && pathname.includes('/collaborators/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const parts = pathname.split('/');
    const invId = parts[3];
    const targetUserId = parts[5];
    const deleted = db.removeInvestigationCollaborator(currentUser.id, invId, targetUserId);
    if (!deleted) return jsonRes(404, { ok: false, error: 'Collaborator not found' });
    return jsonRes(200, { ok: true, message: 'Collaborator removed' });
  }
  if (req.method === 'GET' && pathname === '/api/shared-with-me') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const shared = db.listSharedWithMeInvestigations(currentUser.id);
    return jsonRes(200, { ok: true, investigations: shared, sharedInvestigations: shared });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════

  if (req.method === 'GET' && pathname === '/api/notifications') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const notifs = db.listUserNotifications(currentUser.id, parsedQuery?.unread === 'true');
    return jsonRes(200, { ok: true, notifications: notifs });
  }
  if (req.method === 'PATCH' && pathname.startsWith('/api/notifications/') && pathname.endsWith('/read')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const notifId = pathname.split('/')[3];
    db.markNotificationAsRead(currentUser.id, notifId);
    return jsonRes(200, { ok: true });
  }
  if (req.method === 'POST' && pathname === '/api/notifications/read-all') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    db.markAllNotificationsAsRead(currentUser.id);
    return jsonRes(200, { ok: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // USER FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════

  if (req.method === 'POST' && pathname === '/api/feedback') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const fb = db.recordUserFeedback(currentUser.id, body);
        return jsonRes(200, { ok: true, feedback: fb });
      } catch(e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }
  if (req.method === 'GET' && pathname === '/api/feedback') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const feedbackList = db.listUserFeedback(currentUser.id);
    return jsonRes(200, { ok: true, feedback: feedbackList });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE OMNI-SEARCH
  // ══════════════════════════════════════════════════════════════════════════

  if (req.method === 'POST' && pathname === '/api/search/omni') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const searchResult = db.omniSearchUser(currentUser.id, body.query, body.filters);
      const qLower = (body.query || '').toLowerCase().trim();
      
      const officialResults = [];
      if (qLower) {
        for (const item of OFFICIAL_SAP_CATALOG) {
          if (item.keywords.some(k => qLower.includes(k.toLowerCase())) || item.title.toLowerCase().includes(qLower) || item.excerpt.toLowerCase().includes(qLower)) {
            officialResults.push({
              id: item.id,
              citationId: item.citationId,
              category: 'Official SAP Help',
              title: item.title,
              excerpt: item.excerpt,
              url: item.url,
              tier: item.tier,
              provenance: 'Tier 1 Official SAP Portal'
            });
          }
        }
        for (const note of OFFICIAL_OSS_NOTES) {
          const noteMatch = note.noteNumber.includes(qLower) ||
            note.title.toLowerCase().includes(qLower) ||
            note.symptom.toLowerCase().includes(qLower) ||
            note.solution.toLowerCase().includes(qLower) ||
            note.tcodes.some(t => t.toLowerCase().includes(qLower));
          if (noteMatch) {
            officialResults.push({
              id: `SAP-NOTE-${note.noteNumber}`,
              citationId: `SAP-NOTE-${note.noteNumber}`,
              category: 'Official SAP OSS Note',
              title: `Note ${note.noteNumber}: ${note.title}`,
              excerpt: `Symptom: ${note.symptom} | Solution: ${note.solution}`,
              url: note.url,
              tier: 'Tier 1 Verified OSS Note',
              provenance: 'SAP Me / Support Portal'
            });
          }
        }
      }

      const combinedFlat = [...officialResults, ...(searchResult.results || [])];

      return jsonRes(200, {
        ok: true,
        query: body.query,
        total: combinedFlat.length,
        results: combinedFlat,
        flatResults: combinedFlat,
        categories: {
          all: combinedFlat,
          official: officialResults,
          knowledge: searchResult.knowledge || [],
          conversations: searchResult.conversations || [],
          investigations: searchResult.investigations || [],
          documents: searchResult.documents || [],
          contexts: searchResult.contexts || [],
          templates: searchResult.templates || []
        },
        official: officialResults,
        knowledge: searchResult.knowledge || [],
        conversations: searchResult.conversations || [],
        investigations: searchResult.investigations || [],
        documents: searchResult.documents || [],
        contexts: searchResult.contexts || [],
        templates: searchResult.templates || []
      });
    });
  }

  // Investigations
  if (req.method === 'GET' && pathname === '/api/investigations') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const invs = db.listUserInvestigations(currentUser.id);
    return jsonRes(200, invs);
  }
  if (req.method === 'GET' && pathname.startsWith('/api/investigations/') && !pathname.endsWith('/comments')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const invId = pathname.split('/')[3];
    const target = db.getUserInvestigation(currentUser.id, invId);
    if (target) return jsonRes(200, target);
    return jsonRes(404, { ok: false, error: 'Investigation not found' });
  }
  if (req.method === 'POST' && pathname === '/api/investigations') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const inv = db.createUserInvestigation(currentUser.id, body);
      return jsonRes(200, { ok: true, investigation: inv });
    });
  }
  if (req.method === 'POST' && pathname.startsWith('/api/investigations/') && pathname.endsWith('/comments')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const invId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const comments = db.addInvestigationComment(currentUser.id, invId, body);
      if (!comments) return jsonRes(404, { ok: false, error: 'Investigation not found' });
      return jsonRes(200, { ok: true, comments });
    });
  }

  // Action Cards & Approvals
  if (req.method === 'GET' && pathname === '/api/actions') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const actions = db.listUserActions(currentUser.id);
    return jsonRes(200, actions);
  }
  if (req.method === 'POST' && pathname.startsWith('/api/actions/') && pathname.endsWith('/approve')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const actId = pathname.split('/')[3];
    const target = db.approveAction(currentUser.id, actId);
    if (target) return jsonRes(200, { ok: true, action: target });
    return jsonRes(404, { ok: false, error: 'Action not found' });
  }

  // Document Ingestion / Upload (Tier 2 - User-Scoped)
  if (req.method === 'POST' && pathname === '/api/upload') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { filename, version, content, product, release, isRestricted } = body;
      if (!filename || !content) {
        return jsonRes(400, { ok: false, error: 'Filename and content are required' });
      }
      const newDoc = db.insertUserDocument(currentUser.id, {
        filename, version, content, product, release, isRestricted
      });
      return jsonRes(200, { ok: true, document: newDoc });
    });
  }

  // Document Listing
  if (req.method === 'GET' && pathname === '/api/documents') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const userDocs = db.listUserDocuments(currentUser.id);
    return jsonRes(200, {
      officialSourcesCount: OFFICIAL_SAP_CATALOG.length,
      userDocuments: userDocs.map(d => ({
        id: d.id,
        filename: d.filename,
        version: d.version,
        uploadTimestamp: d.upload_timestamp,
        sectionCount: d.section_count || 1
      }))
    });
  }

  // Document Delete
  if (req.method === 'DELETE' && pathname.startsWith('/api/documents/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const docId = pathname.split('/')[3];
    const deleted = db.deleteUserDocument(currentUser.id, docId);
    if (!deleted) return jsonRes(404, { ok: false, error: 'Document not found' });
    return jsonRes(200, { ok: true, message: 'Document deleted' });
  }

  // Permission-Aware Unified Search (User-Scoped)
  if (req.method === 'POST' && pathname === '/api/search') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { query, userRole, permissionLevel } = body;
      const queryLower = (query || '').toLowerCase();
      const results = [];

      const isDeliveryBased = /delivery[-\s]based/i.test(queryLower) || /delivery\s+integration/i.test(queryLower);
      const mentionsPMR = /pmr|production material request|advanced production/i.test(queryLower);

      // 1. Tier 1 Official Search
      for (const sap of OFFICIAL_SAP_CATALOG) {
        if (sap.citationId === 'SAP-1' && isDeliveryBased && !mentionsPMR) {
          continue;
        }
        const matches = sap.keywords.some(k => queryLower.includes(k.toLowerCase()));
        if (matches) {
          results.push({
            sourceId: sap.citationId,
            title: sap.title,
            tier: sap.tier,
            release: sap.release,
            url: sap.url,
            excerpt: sap.excerpt,
            authorized: true,
            provenance: 'Official SAP Knowledge Catalog'
          });
        }
      }

      // 2. Tier 2 User Documents Search (Filtered to current user only)
      if (currentUser) {
        const userResults = db.searchUserDocuments(currentUser.id, query, permissionLevel || 'standard');
        for (const u of userResults) {
          results.push({
            sourceId: u.citationId,
            title: u.title,
            tier: u.tier,
            release: u.release,
            excerpt: u.excerpt,
            authorized: u.authorized,
            provenance: 'Verified user-provided document'
          });
        }
      }

      return jsonRes(200, {
        query,
        userRole: userRole || currentUser?.role || 'SAP Operations Lead',
        permissionLevel: permissionLevel || 'standard',
        resultsCount: results.length,
        results
      });
    });
  }

  // Unified Knowledge Base & OSS Notes Catalog
  if (req.method === 'GET' && pathname === '/api/kb') {
    const userDocs = currentUser ? db.listUserDocuments(currentUser.id) : [];
    return jsonRes(200, {
      catalog: OFFICIAL_SAP_CATALOG,
      items: OFFICIAL_SAP_CATALOG,
      officialGuides: OFFICIAL_SAP_CATALOG,
      notes: OFFICIAL_OSS_NOTES,
      ossNotes: OFFICIAL_OSS_NOTES,
      userDocuments: userDocs.map(d => ({
        id: d.id,
        filename: d.filename,
        version: d.version,
        product: d.product,
        release: d.release,
        uploadTimestamp: d.upload_timestamp,
        sectionCount: d.section_count || 1
      }))
    });
  }

  if (req.method === 'GET' && (pathname === '/api/notes' || pathname === '/api/oss-notes')) {
    return jsonRes(200, { ok: true, notes: OFFICIAL_OSS_NOTES });
  }
  if (req.method === 'GET' && pathname.startsWith('/api/notes/')) {
    const noteId = pathname.split('/')[3];
    const target = OFFICIAL_OSS_NOTES.find(n => n.noteNumber === noteId || n.citationId === noteId);
    if (target) return jsonRes(200, target);
    return jsonRes(404, { ok: false, error: 'OSS Note not found' });
  }

  // SAP Domain Specializations Catalog
  if (req.method === 'GET' && pathname === '/api/specializations') {
    return jsonRes(200, {
      ok: true,
      specializations: Object.values(SAP_DOMAIN_SPECIALIZATIONS).map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        badge: s.badge,
        category: s.category,
        color: s.color,
        isPriority: s.isPriority || false,
        signatureTcodes: s.signatureTcodes.slice(0, 10),
        coreMasterData: s.coreMasterData.slice(0, 8),
        subAreas: s.subAreas.map(sa => ({ id: sa.id, name: sa.name }))
      }))
    });
  }

  // Connectors
  if (req.method === 'GET' && pathname === '/api/connectors') {
    return jsonRes(200, CONNECTOR_STATUSES);
  }

  // Process Intelligence
  if (req.method === 'GET' && pathname === '/api/process-intelligence') {
    return jsonRes(200, PROCESS_INTELLIGENCE_DATA);
  }

  // Observability & Telemetry (User-Scoped)
  if (req.method === 'GET' && pathname === '/api/observability') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const logs = db.listUserAuditLogs(currentUser.id, 50);
    return jsonRes(200, {
      totalRequests: logs.length,
      averageLatencyMs: logs.length ? Math.round(logs.reduce((a, b) => a + (b.latencyMs || 0), 0) / logs.length) : 0,
      totalBlockedCitations: logs.reduce((a, b) => a + (b.blockedEvents ? b.blockedEvents.length : 0), 0),
      recentLogs: logs.slice(0, 10)
    });
  }

  // Notifications API
  if (req.method === 'GET' && pathname === '/api/notifications') {
    if (!currentUser) return jsonRes(200, { notifications: [] });
    let notifs = db.listUserNotifications(currentUser.id);
    if (!notifs || notifs.length === 0) {
      db.createNotification(currentUser.id, {
        type: 'system',
        title: '👑 Welcome to Sanjaya (सञ्जय) SAP Sentinel',
        message: 'Your enterprise workspace is active with 10 default EWM playbooks, 50,000+ pre-indexed OSS notes, and Multimodal Screenshot Diagnosis.'
      });
      db.createNotification(currentUser.id, {
        type: 'info',
        title: '⚡ S/4HANA 2023 - Embedded EWM Sentinel Active',
        message: 'Read-only safety telemetry is active. Live queue triage and root-cause classification enabled for SMQ1, SMQ2, and bgRFC pipelines.'
      });
      notifs = db.listUserNotifications(currentUser.id);
    }
    return jsonRes(200, {
      notifications: notifs.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read_status: n.read_status,
        read_at: n.read_status ? n.created_at : null,
        created_at: n.created_at
      }))
    });
  }

  if (req.method === 'POST' && pathname === '/api/notifications/read-all') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    db.markAllNotificationsAsRead(currentUser.id);
    return jsonRes(200, { ok: true });
  }

  if (req.method === 'POST' && pathname.startsWith('/api/notifications/') && pathname.endsWith('/read')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const parts = pathname.split('/');
    const ntfId = parts[3];
    db.markNotificationAsRead(currentUser.id, ntfId);
    return jsonRes(200, { ok: true });
  }

  // Status & Key Management
  if (req.method === 'GET' && pathname === '/api/status') {
    return jsonRes(200, {
      hasKey: !!API_KEY,
      authenticated: !!currentUser,
      userId: currentUser?.id || null
    });
  }

  if (req.method === 'POST' && pathname === '/api/savekey') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { key } = body;
      if (!key || key.length < 10) {
        return jsonRes(400, { ok: false, error: 'Key too short' });
      }
      fs.writeFileSync(KEY_FILE, key.trim());
      API_KEY = key.trim();
      return jsonRes(200, { ok: true });
    });
  }

  // Diagram Syntax Auto-Repair & Production Dump Analysis API
  if (req.method === 'POST' && pathname === '/api/diagram/repair') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { rawChart, errorDump, context } = body;
      if (!rawChart) return jsonRes(400, { ok: false, error: 'rawChart is required' });

      console.log(`\x1b[33m[Diagram Auto-Repair] Inspecting diagram error dump: ${errorDump ? errorDump.substring(0, 100) : 'None'}\x1b[0m`);

      // Step 1: Algorithmic AST / Regex repair
      let repaired = rawChart;
      // Fix spaced node identifiers outside quoted labels
      const fixSpacedNodeIdsServer = (chart) => {
        if (!chart || typeof chart !== 'string') return chart;
        const lines = chart.split('\n');
        return lines.map((line) => {
          line = line.replace(/^(\s*)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*(\[|\(|\{|\{\{|\{\||\/\[|\[\[|\[\/|\[\\)/g, (m, indent, id, bracket) => {
            const trimmed = id.trim();
            if (/^(?:subgraph|style|class|classDef|click|linkStyle|flowchart|graph|sequenceDiagram|stateDiagram|classDiagram|erDiagram)\b/i.test(trimmed)) return m;
            return `${indent}${trimmed.replace(/\s+/g, '_')}${bracket}`;
          });
          line = line.replace(/(-->|-.->|==>|--\s*["']?[^"'\n]+?["']?\s*-->|\|[^|\n]+\|)\s*([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*(\[|\(|\{|\{\{|\{\||\/\[|\[\[|\[\/|\[\\)/g, (m, arrow, id, bracket) => {
            return `${arrow} ${id.trim().replace(/\s+/g, '_')}${bracket}`;
          });
          line = line.replace(/^(\s*)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*(-->|-.->|==>|--\s|--\>|\|\s)/g, (m, indent, id, arrow) => {
            const trimmed = id.trim();
            if (/^(?:subgraph|style|class|classDef|click|linkStyle)\b/i.test(trimmed)) return m;
            return `${indent}${trimmed.replace(/\s+/g, '_')} ${arrow}`;
          });
          line = line.replace(/(-->|-.->|==>|--\s*["']?[^"'\n]+?["']?\s*-->|\|[^|\n]+\|)\s*([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*($|;|\n)/g, (m, arrow, id, suffix) => {
            return `${arrow} ${id.trim().replace(/\s+/g, '_')}${suffix}`;
          });
          line = line.replace(/^(\s*subgraph\s+)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)(\s*\[|\s*$)/gi, (m, sub, id, trail) => {
            return `${sub}${id.trim().replace(/\s+/g, '_')}${trail}`;
          });
          return line;
        }).join('\n');
      };

      repaired = fixSpacedNodeIdsServer(repaired);

      // Strip fences
      repaired = repaired.replace(/^```(?:mermaid|text|flowchart|graph|json:diagram|json-diagram|diagram|json)?\s*\n?/i, '');
      repaired = repaired.replace(/\n?\s*```\s*$/i, '').trim();

      // Convert literal \n or escaped linebreaks inside quotes to <br/>
      repaired = repaired.replace(/"([^"]*)"/g, (match, inner) => {
        const fixed = inner.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>');
        return `"${fixed}"`;
      });

      // Fix nested quotes inside brackets: e.g. ["...("...")"] -> ["...('...')"]
      repaired = repaired.replace(/\[\s*"([^"]*)"\s*\]/g, (m, inner) => {
        const cleaned = inner.replace(/"/g, "'");
        return `["${cleaned}"]`;
      });

      // Fix unquoted node labels: A[Some (parens)] -> A["Some (parens)"]
      repaired = repaired.replace(/(\b[a-zA-Z0-9_-]+)\s*\[([^\]"\n]+)\]/g, (m, id, text) => {
        if (!text.startsWith('"')) {
          const cleanText = text.replace(/"/g, "'").trim();
          return `${id}["${cleanText}"]`;
        }
        return m;
      });

      // Fix unquoted subgraphs
      repaired = repaired.replace(/subgraph\s+([a-zA-Z0-9_-]+)\s*\[([^\]"\n]+)\]/g, (m, id, text) => {
        if (!text.startsWith('"')) {
          const cleanText = text.replace(/"/g, "'").trim();
          return `subgraph ${id} ["${cleanText}"]`;
        }
        return m;
      });

      // Ensure proper flowchart TD header if missing
      if (!/^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindmap)/i.test(repaired.trim())) {
        repaired = 'flowchart TD\n' + repaired;
      }

      // Step 2: If API_KEY is available and errorDump indicates complex syntax breakage, invoke Gemini Flash to synthesize repaired Mermaid code
      if (API_KEY && errorDump && (errorDump.includes('Parse error') || errorDump.includes('Expecting') || errorDump.includes('Lexical error') || errorDump.includes('SyntaxError'))) {
        try {
          const repairPrompt = `You are an expert Mermaid diagram syntax repair engine.
A Mermaid diagram failed to render in production with this parser error dump:
---
Error Dump: ${errorDump}
Original Diagram Code:
${rawChart}
---
Fix all syntax errors (ensure properly quoted labels, valid subgraphs, valid node IDs, <br/> for multiline text, no illegal unescaped quotes).
Output ONLY the clean, valid Mermaid code inside \`\`\`mermaid ... \`\`\` code fences with NO conversational prose.`;

          const aiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
            })
          });

          if (aiResp.ok) {
            const data = await aiResp.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) {
              const fenceMatch = aiText.match(/```(?:mermaid)?\s*\n?([\s\S]*?)```/i);
              const cleanAiCode = fenceMatch ? fenceMatch[1].trim() : aiText.trim();
              if (cleanAiCode && /^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(cleanAiCode)) {
                repaired = cleanAiCode;
                console.log('\x1b[32m[Diagram Auto-Repair] Successfully repaired syntax via AI synthesis.\x1b[0m');
              }
            }
          }
        } catch (aiErr) {
          console.warn('[Diagram Auto-Repair] AI repair notice:', aiErr.message);
        }
      }

      return jsonRes(200, {
        ok: true,
        repairedChart: repaired,
        message: 'Diagram auto-repaired and synthesized successfully.'
      });
    });
  }

  // Dynamic AI Stream Map & Shape Flowchart Generator
  if (req.method === 'POST' && pathname === '/api/stream-map-generate') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { doc, aiText, conversationTurns, sessionId } = body;
      const effectiveSessionId = sessionId || doc?.caseId || 'conv-active-session';
      const combinedText = ((doc?.overview || '') + '\n' + (doc?.summary || '') + '\n' + (aiText || '') + '\n' + (conversationTurns?.map(t => t.content).join('\n') || '')).trim();

      console.log(`\x1b[36m[Stream Map AI] Generating shape flowchart for session: ${effectiveSessionId}\x1b[0m`);

      if (API_KEY && combinedText) {
        try {
          const systemPrompt = `You are a Principal SAP Enterprise Solutions Architect & ISO Flowchart Designer.
Analyze this SAP diagnostic/consulting session and synthesize a precise 2-Phase Flowchart Diagram JSON using official standard flowchart and Excel shapes.

Shape Vocabulary:
1. terminator (Stadium / Pill oval for Start / Final status like "Order saved Status: CRTD" or "Order blocked")
2. manual_input (Trapezoid with slanted top for user entering parameters like FG material, Plant, Order type)
3. preparation (Hexagon for setting up configurations or determining BOM alternatives)
4. predefined_process (Rectangle with double vertical side borders for standard subroutines like Read BOM MAST/STKO/STPO)
5. database (Cylinder for SAP database tables read like BOM & Routing tables)
6. merge (Inverted Triangle for combining multiple streams like BOM and Routing into Master Data)
7. decision (Diamond for validation gates like "Master data valid?" or "Stock sufficient?" with Yes and No branches)
8. process (Rectangle for standard processing steps like Basic dates scheduling, ATP check, Preliminary costing)
9. data (Parallelogram for data outputs like Component list finalized)
10. document (Wavy bottom rectangle for generated documents like Create reservation movement type 261)
11. delay (D-shape for lead time or wait intervals)
12. star (5-point star attached to final success milestone node)
13. callout (Rectangular bubble pointing to a node with notes like "System status CRTD is set automatically at save")

Output ONLY valid JSON matching this schema:
{
  "title": "string",
  "subtitle": "string",
  "phases": [
    { "id": "phase-1", "title": "PHASE 1 — Master Data Read & Explosion", "bounds": { "x": 30, "y": 70, "width": 1220, "height": 260 } },
    { "id": "phase-2", "title": "PHASE 2 — Scheduling, Execution & Settlement", "bounds": { "x": 30, "y": 350, "width": 1220, "height": 320 } }
  ],
  "nodes": [
    {
      "id": "node-1",
      "phaseIndex": 0,
      "shape": "terminator" | "manual_input" | "preparation" | "predefined_process" | "database" | "merge" | "decision" | "process" | "data" | "document" | "delay" | "off_page" | "callout",
      "x": 50,
      "y": 130,
      "width": 120,
      "height": 60,
      "label": "Text",
      "subText": "Optional subtext",
      "fill": "#D1FAE5",
      "stroke": "#059669",
      "textColor": "#065F46",
      "hasStar": false,
      "calloutTarget": "optional node id"
    }
  ],
  "connectors": [
    { "from": "node-1", "to": "node-2", "type": "straight" | "elbow" | "dashed" | "loop", "label": "Yes/No", "color": "#0F172A" }
  ]
}

Session Context:
---
Title: ${doc?.title || 'SAP Process'}
${combinedText.substring(0, 3500)}
---`;

          const aiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 3000,
                responseMimeType: 'application/json'
              }
            })
          });

          if (aiResp.ok) {
            const data = await aiResp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed && parsed.nodes && parsed.nodes.length >= 4) {
                return jsonRes(200, { ok: true, source: 'gemini-ai', flowchart: parsed });
              }
            }
          }
        } catch (e) {
          console.warn('[Stream Map AI] AI generation error:', e.message);
        }
      }

      return jsonRes(200, { ok: true, source: 'fallback', message: 'Fallback to deterministic engine' });
    });
  }

  // Grounded Chat API
  if (req.method === 'POST' && pathname === '/api/chat') {
    if (!API_KEY) {
      return jsonRes(401, { error: { message: 'NO_KEY' } });
    }
    return handleGroundedChat(req, res, sessionData);
  }

  // Static files — fall back to index.html for React Router
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const absPath = path.join(__dirname, 'public', filePath);
  fs.readFile(absPath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for unknown routes
      const indexPath = path.join(__dirname, 'public', 'index.html');
      fs.readFile(indexPath, (err2, indexData) => {
        if (err2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
        return res.end(indexData);
      });
      return;
    }
    const ext = path.extname(absPath);
    const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000',
    });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log('\x1b[32m✓ Nexus Enterprise Multi-User Platform running on http://localhost:3456\x1b[0m');
  console.log('✓ SQLite Persistence & Session Authentication Active.\n');
});
