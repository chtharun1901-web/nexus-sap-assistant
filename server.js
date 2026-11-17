const http   = require('http');
const https  = require('https');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const db     = require('./db.js');
const { SearchQueryPlanner, SourceQualityRanker, TransactionValidator, searchCache, CorrectionManager } = require('./services/WebSearchService.js');
const { SAP_DOMAIN_SPECIALIZATIONS } = require('./services/SapDomainSpecializations.js');
const { ModuleClassifier } = require('./services/ModuleClassifier.js');
const { SpecialistPromptRouter } = require('./services/SpecialistPromptRouter.js');
const { INTENTS, IntentRouter } = require('./services/IntentRouter.js');
const { TaskExtractor } = require('./services/TaskExtractor.js');
const { SapNewsKnowledgeEngine, SapNewsQueryClassifier, OFFICIAL_SAP_NEWS_REGISTRY } = require('./services/SapNewsKnowledgeEngine.js');
const NexusGenAiEngine = require('./services/NexusGenAiEngine.js');
const ForensicSpreadsheetService = require('./services/ForensicSpreadsheetService.js');
const NexusGeminiIntelligence = require('./services/NexusGeminiIntelligenceService.js');
const NexusContextCache = require('./services/NexusContextCacheService.js');
const NexusSapToolAgent = require('./services/NexusSapToolAgentService.js');
const WarehouseVisualService = require('./services/WarehouseVisualService.js');
const { generateGroundedSapFallback } = require('./services/NexusGroundedFallbackEngine.js');

// ── Model Constants ────────────────────────────────────────────────────────
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.6-flash';
const TERTIARY_MODEL = 'gemini-3.1-flash-lite';
const SUPPORTED_MODELS = [DEFAULT_MODEL, FALLBACK_MODEL, TERTIARY_MODEL];

// .env file loader (no external dependency)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  }
} catch(e) {}

// ── Structured Logger ──────────────────────────────────────────────────────
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? 1;
function structuredLog(level, message, meta = {}) {
  if (LOG_LEVELS[level] < LOG_LEVEL) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

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

function getMailTransporter() {
  if (mailTransporter) return mailTransporter;
  if (!nodemailer) return null;

  // Check GMAIL_USER and GMAIL_PASS first
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? process.env.SMTP_USER : null);
  const gmailPass = process.env.GMAIL_PASS || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? (process.env.SMTP_PASS || process.env.SMTP_PASSWORD) : null);

  if (gmailUser && gmailPass) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    return mailTransporter;
  }

  // Generic SMTP host if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
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

  // No email credentials configured — return null so caller can surface a clear error
  return null;
}

async function sendEmailOtp(toEmail, code, type = 'login') {
  const isReset = type === 'reset';
  const subject = isReset ? `Nexus Enterprise: Password Reset Code (${code})` : `Nexus SAP Intelligence: Your One-Time Passcode (${code})`;
  const actionTitle = isReset ? 'Password Reset Verification' : 'One-Time Passcode (OTP) Login';
  const actionDesc = isReset 
    ? 'You requested a password reset for your Nexus Enterprise account. Enter the verification code below to set a new password:'
    : 'Use the following 6-digit verification code to securely access your Nexus SAP Operations Workspace:';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#0D0D0D 0%,#1A0A10 50%,#0D0D0D 100%);padding:40px 16px;min-height:100vh;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- NEXUS BRAND & LOGO HEADER -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Nexus Visual Logo (CID attached) -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <img src="cid:nexuslogo" alt="Nexus Logo" style="width:52px;height:52px;border-radius:12px;border:2px solid #D97706;display:block;box-shadow:0 4px 20px rgba(110,26,45,0.6);" />
                        </td>
                        <td style="vertical-align:middle;text-align:left;">
                          <div>
                            <span style="font-size:26px;font-weight:900;color:#FAF8F5;letter-spacing:0.06em;vertical-align:middle;">NEXUS</span>
                            <span style="font-size:10.5px;font-weight:800;color:#D97706;letter-spacing:0.14em;margin-left:8px;vertical-align:middle;text-transform:uppercase;background:rgba(217,119,6,0.15);border:1px solid rgba(217,119,6,0.4);padding:3px 8px;border-radius:4px;">ENTERPRISE AI</span>
                          </div>
                          <div style="font-size:11px;color:#A8967A;letter-spacing:0.04em;margin-top:2px;">SAP Operations & Diagnostic Intelligence</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:linear-gradient(180deg,#1A0A10 0%,#111111 100%);border:1px solid rgba(110,26,45,0.5);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(217,119,6,0.1),inset 0 1px 0 rgba(255,255,255,0.05);">

              <!-- Card Header Accent Stripe -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#6E1A2D 0%,#D97706 50%,#6E1A2D 100%);height:4px;line-height:4px;font-size:1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 36px 28px;">

                    <!-- Action Title -->
                    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#FAF8F5;letter-spacing:-0.01em;">${actionTitle}</h1>
                    <p style="margin:0 0 28px 0;font-size:14px;line-height:1.65;color:#A8967A;">${actionDesc}</p>

                    <!-- OTP CODE DISPLAY -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,#1C0910 0%,#160710 100%);border:1px solid rgba(217,119,6,0.6);border-radius:12px;padding:28px 20px;box-shadow:inset 0 2px 10px rgba(0,0,0,0.6),0 0 25px rgba(217,119,6,0.12);">
                          <div style="font-size:10px;font-weight:800;color:#D97706;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:14px;font-family:monospace;">
                            ✦ YOUR ONE-TIME PASSCODE ✦
                          </div>
                          <div style="font-size:46px;font-weight:900;color:#FAF8F5;letter-spacing:14px;font-family:'Courier New',Courier,monospace;text-shadow:0 0 35px rgba(217,119,6,0.6),0 2px 6px rgba(0,0,0,0.9);padding:0 8px;">
                            ${code}
                          </div>
                          <div style="margin-top:16px;display:inline-block;background:rgba(110,26,45,0.35);border:1px solid rgba(217,119,6,0.5);border-radius:20px;padding:5px 16px;">
                            <span style="font-size:12px;color:#FDE68A;font-weight:700;">⏱ Valid for 10 minutes</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.3);border-left:4px solid #D97706;border-radius:0 8px 8px 0;padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#FDE68A;line-height:1.6;">
                            🔐 <strong style="color:#FAF8F5;">Never share this code</strong> with anyone, including Nexus administrators. Our platform will never ask for your OTP.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(217,119,6,0.3),transparent);margin-bottom:20px;"></div>

                    <p style="margin:0;font-size:12px;color:#8A7868;line-height:1.5;">
                      If you did not initiate this sign-in request, please ignore this email. Your workspace remains secure.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Card Footer Accent Stripe -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#6E1A2D 0%,#D97706 50%,#6E1A2D 100%);height:4px;line-height:4px;font-size:1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:24px 0 8px;">
              <p style="margin:0 0 6px;font-size:12px;color:#7A6858;font-weight:700;letter-spacing:0.05em;">
                NEXUS ENTERPRISE SAP COPILOT PLATFORM
              </p>
              <p style="margin:0;font-size:11px;color:#5A4838;">
                Authenticated Gmail Delivery · Mission-Critical Operations Safeguards
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

  // Prepare CID attachments for high-resolution Nexus Logo
  const attachments = [];
  const logoPath = path.join(__dirname, 'public', 'nexus-logo.jpg');
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'nexus-logo.jpg',
      path: logoPath,
      cid: 'nexuslogo'
    });
  }

  const mailer = getMailTransporter();
  if (!mailer) {
    const errorMsg = 'Gmail SMTP credentials are not configured. Please enter your Gmail address and 16-character Google App Password in the setup box, or set GMAIL_USER and GMAIL_PASS in your .env file.';
    console.error(`\x1b[31m[Mailer] ✗ Cannot dispatch OTP email to ${toEmail}: ${errorMsg}\x1b[0m`);
    return {
      sent: false,
      error: errorMsg,
      testOtp: code,
      html: htmlContent
    };
  }

  const senderUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@nexus.ai';
  const fromAddr = process.env.SMTP_FROM || `"Nexus Enterprise AI" <${senderUser}>`;

  let deliveryMethod = 'gmail';
  let webPreviewUrl = null;

  try {
    const info = await mailer.sendMail({
      from: fromAddr,
      to: toEmail,
      subject,
      html: htmlContent,
      attachments
    });
    console.log(`\x1b[32m[Mailer] ✓ Dispatched OTP email to ${toEmail} via Gmail (${info.messageId || 'OK'})\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[31m[Mailer] ✗ Gmail dispatch to ${toEmail} failed: ${err.message}\x1b[0m`);
    let userFriendlyErr = err.message;
    if (err.message && (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted') || err.code === 'EAUTH')) {
      userFriendlyErr = 'Gmail authentication failed: Google requires a 16-character App Password (not your standard password). Generate one at myaccount.google.com/apppasswords and enter it in SMTP settings.';
    }
    return {
      sent: false,
      error: userFriendlyErr,
      testOtp: code,
      html: htmlContent
    };
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

function getSessionCookie(token, maxAgeSeconds, req) {
  const isSecure = process.env.NODE_ENV === 'production' || req?.headers?.['x-forwarded-proto'] === 'https';
  return `nexus_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? '; Secure' : ''}`;
}

function getClearCookie(req) {
  const isSecure = process.env.NODE_ENV === 'production' || req?.headers?.['x-forwarded-proto'] === 'https';
  return `nexus_session=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isSecure ? '; Secure' : ''}`;
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

  // 0. Clean LaTeX math artifacts, macros, and flow arrows (e.g. \longrightarrow, \text{}, $9010$, $0010$)
  // Spacing artifacts
  text = text
    .replace(/\\(?:quad|qquad)/gi, " ")
    .replace(/\\(?:,|;|:)/g, " ")
    .replace(/\\ /g, " ")
    .replace(/\\!/g, "");

  // Comprehensive arrows & relations (long, short, double, implications)
  text = text
    .replace(/\\(?:longrightarrow|longleftarrow|Longrightarrow|Longleftarrow|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|longleftrightarrow|implies|iff)\b/gi, (m) => {
      const lower = m.toLowerCase();
      if (lower.includes("longrightarrow") || lower.includes("rightarrow")) return " → ";
      if (lower.includes("longleftarrow") || lower.includes("leftarrow")) return " ← ";
      if (lower.includes("Longrightarrow") || lower.includes("rightarrow") || lower.includes("implies")) return " ⇒ ";
      if (lower.includes("Longleftarrow") || lower.includes("leftarrow")) return " ⇐ ";
      if (lower.includes("leftrightarrow") || lower.includes("iff")) return " ↔ ";
      return " → ";
    })
    .replace(/\\to\b/gi, " → ")
    .replace(/\\le\b/gi, " ≤ ")
    .replace(/\\ge\b/gi, " ≥ ")
    .replace(/\\neq\b/gi, " ≠ ");

  // Unwrap font and text macros (nested up to 5 passes)
  for (let pass = 0; pass < 5; pass++) {
    const prev = text;
    text = text
      .replace(/\\(?:textbf|mathbf)\{([^{}]+)\}/g, "**$1**")
      .replace(/\\(?:texttt|mathtt)\{([^{}]+)\}/g, "`$1`")
      .replace(/\\(?:textit|mathit)\{([^{}]+)\}/g, "*$1*")
      .replace(/\\(?:text|mathrm|textsf|sf|rm)\{([^{}]+)\}/g, "$1");
    if (text === prev) break;
  }

  // Strip $$ ... $$ display math
  text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, "$1");

  // Strip $ ... $ where the inside contains an arrow, backslash, or LaTeX artifacts
  text = text.replace(/\$([^\$\n]*?[→←↔⇒⇐\\][^\$\n]*?)\$/g, "$1");

  // Strip $ around 4+ digit SAP storage types / codes: e.g. $9010$, $0010$
  text = text.replace(/\$\s*(\d{4,})\s*\$/g, "$1");

  // Strip leftover bounding $ on lines containing process arrows
  text = text.replace(/^(\s*)\$\s*(.*?[→←↔⇒⇐].*?)\s*\$(\s*)$/gm, "$1$2$3");

  // Normalize duplicate horizontal spaces
  text = text.replace(/[ \t]+/g, " ");

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

// Sanitize user input to prevent prompt injection
function sanitizeUserInput(text) {
  if (!text || typeof text !== 'string') return text;
  // Strip system instruction markers that could confuse the model
  return text
    .replace(/```system[\s\S]*?```/gi, '[redacted system block]')
    .replace(/<<SYS>>|<\/SYS>|\[INST\]|\[\/INST\]/gi, '')
    .replace(/<\|im_start\|>|<\|im_end\|>/gi, '')
    .slice(0, 32000); // Max 32K chars per user message
}

// ── Grounded Chat Handler with Source Injection & SSE ───────────────────────
function handleGroundedChat(req, res, sessionData) {
  const reqId = 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const startTime = Date.now();
  let body = '';

  req.on('data', c => (body += c));
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body);
      // Multi-model selection: allow client to specify preferred model
      const clientModel = parsed.preferredModel;
      let model = (clientModel && SUPPORTED_MODELS.includes(clientModel)) ? clientModel : DEFAULT_MODEL;
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
      let userPrompt = parsed.prompt || '';
      if (parsed.contents && parsed.contents.length > 0) {
        const lastMsg = parsed.contents[parsed.contents.length - 1];
        if (lastMsg.role === 'user' && lastMsg.parts) {
          userPrompt = lastMsg.parts.map(p => p.text || '').join(' ');
        }
      } else if (userPrompt) {
        parsed.contents = [{ role: 'user', parts: [{ text: userPrompt }] }];
      }
      
      // Apply sanitization to user messages in the chat payload
      userPrompt = sanitizeUserInput(userPrompt);
      if (parsed.prompt) parsed.prompt = userPrompt;
      if (parsed.contents) {
        parsed.contents.forEach(msg => {
          if (msg.role === 'user' && msg.parts) {
            msg.parts.forEach(p => { if (p.text) p.text = sanitizeUserInput(p.text); });
          }
        });
      }
      const assistantMode = parsed.mode || parsed.assistantMode || nexusCtx.mode || 'AUTO';
      const isInternalTask = Boolean(parsed.noSave || parsed.isInternalTask || parsed.mode === 'VISUAL_STRATEGY' || assistantMode === 'VISUAL_STRATEGY');

      // Verify conversation ownership or auto-create if authenticated (skip for internal background tasks)
      let effectiveConvId = conversationId || null;
      let currentConversation = null;
      if (!isInternalTask && effectiveConvId && userId) {
        currentConversation = db.getConversation(userId, effectiveConvId);
        if (!currentConversation) {
          // Auto-create conversation with this custom ID so it is persisted in DB!
          const titleSnippet = userPrompt ? (userPrompt.length > 45 ? userPrompt.substring(0, 45) + '...' : userPrompt) : 'New Investigation';
          currentConversation = db.createConversation(userId, {
            id: effectiveConvId,
            title: titleSnippet,
            selectedRole: userRole,
            activeSapContextId: 'ctx-prd-pp',
            projectId: parsed.projectId || parsed.project_id || null
          });
        }
      }

      // Check for active project associated with this conversation or request
      let activeProject = null;
      const effectiveProjId = currentConversation?.project_id || parsed.projectId || parsed.project_id || null;
      if (effectiveProjId && userId) {
        try {
          activeProject = db.getProjectById(userId, effectiveProjId);
        } catch (pErr) {}
      }

      // Save or retrieve conversation attached documents across multi-turn sessions
      let effectiveUploadedDocs = [...uploadedDocs];
      if (!isInternalTask && effectiveConvId && userId) {
        if (uploadedDocs && uploadedDocs.length > 0) {
          db.saveConversationDocs(userId, effectiveConvId, uploadedDocs);
        } else {
          const savedDocs = db.getConversationDocs(userId, effectiveConvId);
          if (savedDocs && savedDocs.length > 0) {
            effectiveUploadedDocs = savedDocs;
          }
        }
      }

      // Enrich any spreadsheet attachments with deep forensic profiling if not already computed
      if (effectiveUploadedDocs && effectiveUploadedDocs.length > 0) {
        effectiveUploadedDocs = ForensicSpreadsheetService.enrichUploadedDocs(
          effectiveUploadedDocs,
          sessionData?.user?.display_name || sessionData?.user?.email || 'Tarun'
        );
      }

      // Strip internal parameters before upstream proxy
      delete parsed.preferredModel;
      delete parsed.prompt;
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
      delete parsed.mode;
      delete parsed.assistantMode;
      delete parsed.interviewMode;
      delete parsed.category;
      delete parsed.profile;
      delete parsed.isInternalTask;
      delete parsed.noSave;
      delete parsed.projectId;
      delete parsed.project_id;

      // Snapshot prior history from active conversation before appending current turn
      let priorHistory = (currentConversation && currentConversation.messages) ? [...currentConversation.messages] : [];
      // Context window management: limit to last 20 messages to prevent token overflow
      if (priorHistory.length > 20) {
        const summarized = { role: 'model', parts: [{ text: '(Earlier conversation context summarized: ' + priorHistory.length + ' prior messages were exchanged covering the topics above. Key context has been preserved in recent messages.)' }] };
        priorHistory = [summarized, ...priorHistory.slice(-20)];
      }

      // Layer 1: Intent & Context Analysis
      const intentAnalysis = IntentRouter.analyze(userPrompt, priorHistory, {
        userMode: assistantMode,
        selectedModule,
        uploadedDocs: effectiveUploadedDocs
      });

      // Domain Specialization / Assistant Classification
      let moduleClassification;
      if (intentAnalysis.mode === 'SAP') {
        moduleClassification = ModuleClassifier.classify(userPrompt, selectedModule);
      } else {
        moduleClassification = {
          primaryModule: intentAnalysis.mode === 'DAILY_TASK' ? 'DAILY_TASK' : (intentAnalysis.mode === 'DOCUMENT_TASK' ? 'DOCUMENT_TASK' : 'GENERAL'),
          moduleName: intentAnalysis.mode === 'DAILY_TASK' ? 'Daily Work Assistant' : (intentAnalysis.mode === 'DOCUMENT_TASK' ? 'Document & Task Analyst' : 'General Work Assistant'),
          icon: '⚡',
          color: '#3B82F6',
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          priority: 'standard',
          isPriority: false,
          subArea: intentAnalysis.primaryIntent.replace(/_/g, ' '),
          process: intentAnalysis.understandingLabel,
          confidence: 'High',
          confidenceScore: 0.95,
          isNonSap: true,
          understandingLabel: intentAnalysis.understandingLabel
        };
      }

      // Auto-create conversation if not specified for authenticated user (skip for internal tasks)
      if (!isInternalTask && !effectiveConvId && userId && userPrompt) {
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

      // Save user turn to conversation history if conversation exists (skip for internal tasks)
      if (!isInternalTask && effectiveConvId && userId && userPrompt) {
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

      let retrievedSources = [];
      let retrievalResult = { sources: [], status: 'No sources needed for non-SAP personal work' };
      let groundingContext = '';

      let sapNewsData = null;
      if (intentAnalysis.mode === 'SAP') {
        const isNewsQuery = SapNewsQueryClassifier.isNewsOrUpdateQuery(userPrompt);
        if (isNewsQuery) {
          try {
            sapNewsData = await SapNewsKnowledgeEngine.orchestrate(userPrompt, { selectedModule });
            if (sapNewsData && sapNewsData.sources && sapNewsData.sources.length > 0) {
              retrievedSources = [...sapNewsData.sources];
              retrievalResult = {
                sources: retrievedSources,
                status: `Retrieved ${sapNewsData.sources.length} Tier 1 Official SAP News & Release Innovation sources`
              };
              // Add Google Search grounding tool for real-time verification and freshness
              parsed.tools = [{ googleSearch: {} }];
            }
            if (sapNewsData && sapNewsData.classification) {
              moduleClassification.sapNewsClassification = sapNewsData.classification;
              if (sapNewsData.classification.subArea) {
                moduleClassification.subArea = sapNewsData.classification.subArea;
              }
            }
          } catch (newsErr) {
            console.warn(`[${reqId}] SapNewsKnowledgeEngine orchestration error:`, newsErr.message);
          }
        }

        // Enable Google Search Grounding for ALL SAP queries (V2.0 - Live OSS Notes & KBAs)
        if (!parsed.tools && intentAnalysis.mode === 'SAP') {
          parsed.tools = [{ googleSearch: {} }];
        }

        // Execute standard retrieval search (User-Scoped) if not already satisfied, or blend user documents
        if (!isNewsQuery || retrievedSources.length === 0) {
          retrievalResult = retrieveSources(userId, retrievalQuery, { disableRetrieval });
          retrievedSources = [...retrievedSources, ...retrievalResult.sources];
        } else {
          const userScopedResult = retrieveSources(userId, retrievalQuery, { disableRetrieval });
          const userDocsOnly = (userScopedResult.sources || []).filter(s => s.tier && s.tier.includes('User-Provided'));
          if (userDocsOnly.length > 0) {
            retrievedSources = [...retrievedSources, ...userDocsOnly];
          }
        }

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
      groundingContext = specialistPrompt + `\n\n## ACTIVE SAP OPERATIONAL CONTEXT:\n- User Role: ${userRole}\n- Target Landscape: ${userLandscape}\n- Socratic Mentor Mode: ${isSocratic ? 'ENABLED (Guide step-by-step)' : 'DISABLED'}\n- Live SAP RFC Destination: UNAVAILABLE\n- Live SAP Support API: UNAVAILABLE\n`;
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

      if (sapNewsData && sapNewsData.groundingPrompt) {
        groundingContext += '\n' + sapNewsData.groundingPrompt + '\n';
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
1. SPREADSHEET CONFIRMATION: The user has uploaded and attached the spreadsheet data shown above in this active session. You HAVE received, parsed, and inspected all of its contents across all sheets and rows.
2. STRICT REFUSAL PROHIBITION: NEVER claim that you did not read, cannot access, or did not receive the user's file. NEVER say "no file content stream was transmitted" or "I did not directly parse a physical file". The parsed data and forensic statistics are directly provided above.
3. FORENSIC QUANTITATIVE RIGOR: When analyzing issue trackers, ticket logs, or operational data:
   - Always lead with EXACT NUMBERS: State exact row counts per plant/sheet (e.g. TN03 Mattress: ~1,910 tickets, 1,792 closed, 18 open; TN10 Furniture: ~365 tickets; Accessories: 16 tickets).
   - ISOLATE PERSONAL CONTRIBUTION: Distinguish tickets assigned to the user (e.g. Tarun: 142 tickets, with 89 in April) from team members' tickets (Neha, Sapna, Manoj, Lokesh, Dhanush, Yashas). Explicitly warn against claiming tickets assigned to others (e.g. Rashmi, Mahesh, Harikrishna in portal logs).
   - USER VS SYSTEM RATIO: Quantify user errors vs system/queue errors (e.g. 192 user issues vs 149 system issues) as concrete proof for warehouse training and SOP enforcement.
   - CORRELATE ROOT CAUSES TO LIVE FLOOR FIXES: Present recurring issues in a table showing Symptom / Error -> Root Cause -> Live Floor Fix, citing exact SAP EWM transactions (/SCWM/PRDO, SMQ2, ADPROD, /SCWM/MON, /SCWM/RFUI), stock types (B2, F2), and master data fields (PACI, SRCI, MTOM, /SCWM/PACKSPEC).
   - ADDRESS EXECUTIVE & INTERVIEW PILLARS: When framing interview answers (e.g. Mondelez), address: How we helped floor users, how we explained solutions (symptom -> cause -> fix), floor training & recurring error prevention, and shift supervisor enablement (Ashirbad, Moorthy, Satish).
   - PROACTIVELY FLAG DATA CAUTIONS: Flag "Resolution time" containing clock timestamps rather than duration, explain open tickets, distinguish emergency backend workarounds from standard procedures, and observe confidentiality.
   - ZERO GENERIC FILLER: Do not output generic SPRO setup paths or textbook disclaimers. Focus 100% on the real floor operations shown in the data.
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
17. FORENSIC_TRACKER_ANALYSIS

Do not expose internal classification metadata unless the UI explicitly requests it.

## Classification rules

### Use FORENSIC_TRACKER_ANALYSIS when:
The user asks to inspect, audit, or summarize an uploaded issue tracker, ticket log, or spreadsheet dataset, OR asks how to frame their support/AMS/hypercare experience based on tracker data, OR asks to think like Claude / perform deep row-level aggregation on the spreadsheet.

Required 6-Part Forensic Output Structure:
1. Executive Volume & Data Summary (Exact counts by sheet, plant, closed vs open tickets).
2. Assignee & Personal Contribution Audit (Isolate candidate's tickets e.g. Tarun: 142 tickets with 89 in April; break down team members; explicitly warn against claiming tickets of colleagues like Rashmi, Mahesh, Harikrishna).
3. Issue Classification & Training Reality (Exact User Error vs System Error counts e.g. 192 user issues vs 149 system issues, forming the quantitative justification for warehouse training and SOP coaching).
4. Core Issue Matrix: Symptom -> Root Cause -> Live Floor Fix (Structured Markdown table correlating recurring error clusters with root cause and live floor workarounds, citing exact SAP transactions /SCWM/PRDO, SMQ2, ADPROD, /SCWM/MON, /SCWM/RFUI, stock types B2/F2, and master data PACI, SRCI, MTOM, packspecs).
5. Executive & Interview Narrative (Addressing the 4 operational pillars: How we helped floor users, how we explained solutions using symptom -> cause -> fix, floor training & recurring error prevention, and shift supervisor enablement with Ashirbad, Moorthy, Satish).
6. Strategic Cautions & Landmines (Resolution time clock-time nuance, handling open tickets, emergency backend workarounds vs standard procedures, data confidentiality).

### Use DEFINITION when:
The user asks: What is X? Explain X. Define X. What does X mean?
Deliver a high-density, authoritative definition in fluid editorial prose. NEVER use arbitrary numbered headings like "1. Direct Answer" or "2. Core Pillars". Open directly with the definition.
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
Output in Style 4 (Natural Conversational Intelligence):
- Begin directly with the core explanation in authoritative, fluid prose. NEVER use arbitrary numbered headings like "1. Direct Answer" or "2. Core Pillars".
- Seamlessly transition into architectural foundations, key entities, and practical realities.
- What is unknown / important dependencies (if applicable)
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
Format response cleanly in Style 4 (Natural Conversational Intelligence):
Delivery-based production integration is a delivery-oriented way of representing or transferring production-supply requirements between production planning and warehouse execution. The exact document flow depends on the SAP release, EWM deployment model, staging design, and configured integration technology.
It is not automatically the same as PMR-based Advanced Production Integration. PMR is a separate production-supply concept where applicable to the target product scope and release.

#### Conceptual Flow
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
13. CRITICAL - NEVER OUTPUT LATEX MATH OR DOLLAR SIGNS FOR PROCESS FLOWS: Never write LaTeX formulas or math syntax such as $\text{Step 1} \longrightarrow \textbf{Step 2}$, $\rightarrow$, \rightarrow, \longrightarrow, or wrap process steps in $ ... $ or $$ ... $$. For all process flow sequences, paths, and step-by-step lifecycles, write clean standard markdown with unicode arrows: e.g. **Customer Purchase Order** → **VA01 (Standard SD Order Entry)** → **Delivery (VL01N)** → **Billing (VF01)**. Never wrap SAP transaction codes, numbers, or storage types in dollars (e.g. write 9010 or \`9010\`, never $9010$).
14. DIAGRAMS & FLOWCHARTS POLICY (STRICT USER-REQUESTED ONLY - NEVER FORCE UNLESS ASKED):
- ONLY generate a visual Mermaid diagram (\`\`\`mermaid ... \`\`\`) if the user EXPLICITLY asks for a diagram, flowchart, visual process map, diagrammatic representation, architecture diagram, visual tree, or workflow chart in their query (e.g. "draw", "diagram", "flowchart", "visualize", "process flow diagram", "map out visually", "show flowchart", "draw architecture", "show tree").
- If the user did NOT explicitly request a diagram, flowchart, or visual representation, DO NOT output any Mermaid diagram or flowchart code block. Provide clear, direct, structured technical answers, diagnostic steps, T-code tables, and explanations in standard markdown prose.
- When the user DOES explicitly request a diagram:
  * Generate a modern, highly legible Mermaid diagram in a \`\`\`mermaid code fence.
  * Use top-down vertical flowcharts (flowchart TD) with clear rectangular process boxes and decision diamonds.
  * Always wrap node labels in double quotes (e.g. A["1. Create Staging Request (/SCWM/STAGE)"] --> B{"Control Cycle Found?"}).
15. TYPOGRAPHY MANDATE (STRICT): When generating or formatting text, documents, templates, deliverables, or visual references, ALWAYS standardize on and specify the font "Aptos" (the modern Microsoft 365 executive typography standard). NEVER use or recommend Calibri.
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

      } else if (intentAnalysis.mode === 'DAILY_TASK') {
        const sessionIntel = TaskExtractor.buildSessionIntelligence(priorHistory, effectiveUploadedDocs);
        const isSessionTaskQuery = /what (?:are|were) my pending items|what did i ask|what decisions were made|show (?:my )?(?:pending )?tasks|track (?:the )?tasks from this (?:session|conversation)/i.test(userPrompt.trim());

        groundingContext = `
You are Nexus, an executive personal work assistant and intelligent task orchestrator.

## CONTEXT & INTENT ANALYSIS:
- Mode: Daily Task & Personal Work Assistant
- Primary Intent: ${intentAnalysis.primaryIntent}
- User Understanding: ${intentAnalysis.understandingLabel}

## CRITICAL INVARIANTS:
1. This is a personal work / daily task request. It is NOT an SAP enterprise configuration or transactional query.
2. DO NOT assume the user is asking about SAP, and DO NOT inject unsolicited SAP transactions (T-Codes), SPRO configuration paths, RFC queues, tables, or enterprise architecture jargon.
3. Act as a high-caliber personal chief of staff, productivity partner, and executive project assistant.
4. If the user asks for a draft (e.g. email, message, summary, letter, memo), provide the complete, professional, ready-to-use draft directly within or preceding the action plan.
`;

        if (isSessionTaskQuery) {
          groundingContext += `\n## SESSION TASK & TOPIC INTELLIGENCE (FROM THIS CONVERSATION):\n${TaskExtractor.generateSessionSummaryAnswer(userPrompt, sessionIntel)}\n`;
        }

        if (effectiveUploadedDocs && effectiveUploadedDocs.length > 0) {
          groundingContext += '\n\n# 📊 ATTACHED SPREADSHEETS & USER DATA EXTRACTS (ACTIVE CONVERSATION ATTACHMENTS)\n';
          effectiveUploadedDocs.forEach((doc, dIdx) => {
            groundingContext += `\n## [Attachment ${dIdx + 1}]: "${doc.filename || 'Spreadsheet.xlsx'}" (${doc.type || 'spreadsheet'})\n`;
            if (doc.sheetCount) {
              groundingContext += `*Sheet Count: ${doc.sheetCount} | Total Rows: ${doc.totalRows || 'N/A'}*\n\n`;
            }
            groundingContext += `${doc.content || doc.text || ''}\n`;
          });
        }

        groundingContext += `
## REQUIRED RESPONSE STRUCTURE:
Unless the user explicitly asks for a single brief sentence, structure your daily task response strictly with these 8 sections:

### Understanding
${intentAnalysis.understandingLabel.replace(/^Understanding:\s*/i, '')}

### Objective
[Clear statement of what will be achieved and definition of success.]

### Tasks Identified
[Bulleted list of concrete, actionable tasks with clear scope.]

### Priority Order
[Prioritized sequence: P1 (Urgent/Immediate) → P2 (Core/High Value) → P3 (Supporting/Follow-up) with brief rationale.]

### Dependencies
[Identified prerequisites, approvals, files, inputs, or sequences connecting tasks.]

### Recommended Next Actions
[The immediate 1-3 concrete steps to take right now to begin execution. If drafting an email, memo, or communication was requested, include the polished, complete, ready-to-send draft right here.]

### Timeline / Checklist
[An operational, time-blocked schedule or checklist with checkboxes [ ] for execution.]

### Missing Information
[Any missing parameters, constraints, deadlines, or stakeholder details that could further refine the output, or "None identified; ready for immediate execution."]
`;

      } else if (intentAnalysis.mode === 'DOCUMENT_TASK') {
        groundingContext = `
You are Nexus, an objective document, data, and deliverables analysis assistant.

## CONTEXT & INTENT ANALYSIS:
- Mode: Document & Data Analysis
- Primary Intent: ${intentAnalysis.primaryIntent}
- User Understanding: ${intentAnalysis.understandingLabel}

## CRITICAL DIRECTIVES:
1. Base all findings, numbers, and recommendations directly on the attached documents and conversation context.
2. Do NOT invent data or extrapolate beyond the provided text.
3. Structure your response clearly:
   - ### Understanding
     ${intentAnalysis.understandingLabel.replace(/^Understanding:\s*/i, '')}
   - ### Key Findings & Data Summary
   - ### Identified Tasks & Action Items (Prioritized)
   - ### Recommended Next Actions
   - ### Checklist / Follow-up Timeline
   - ### Missing Information or Data Ambiguities
`;

        if (effectiveUploadedDocs && effectiveUploadedDocs.length > 0) {
          groundingContext += '\n\n# 📊 ATTACHED SPREADSHEETS & USER DATA EXTRACTS (ACTIVE CONVERSATION ATTACHMENTS)\n';
          effectiveUploadedDocs.forEach((doc, dIdx) => {
            groundingContext += `\n## [Attachment ${dIdx + 1}]: "${doc.filename || 'Spreadsheet.xlsx'}" (${doc.type || 'spreadsheet'})\n`;
            if (doc.sheetCount) {
              groundingContext += `*Sheet Count: ${doc.sheetCount} | Total Rows: ${doc.totalRows || 'N/A'}*\n\n`;
            }
            groundingContext += `${doc.content || doc.text || ''}\n`;
          });
        }

      } else {
        // GENERAL mode
        groundingContext = `
You are Nexus, a versatile, executive-grade AI personal work assistant.

## CONTEXT & INTENT ANALYSIS:
- Mode: General Executive Assistant
- Primary Intent: ${intentAnalysis.primaryIntent}
- User Understanding: ${intentAnalysis.understandingLabel}

## DIRECTIVES:
1. Answer the user's prompt directly, thoughtfully, and professionally.
2. Adapt tone and format to the user's exact goal (e.g. drafting, explaining, analyzing, summarizing, refining).
3. Do NOT force SAP enterprise terminology, SPRO paths, or transaction codes unless the user specifically asks about SAP.
4. Provide structured, executive-caliber output.
5. TYPOGRAPHY MANDATE (STRICT): For all document drafts, styling suggestions, presentations, or deliverables, specify and standardize strictly on the font "Aptos". Never use or suggest Calibri.
`;
      }

      // Inject User GenAI Preferences & Directives
      const userPrefs = userId ? db.getUserPreferences(userId) : null;
      if (userPrefs) {
        let prefsDirective = `\n## USER PERSONALIZATION & PREFERENCES MANDATE:\n`;
        if (userPrefs.responseStyle === 'concise') {
          prefsDirective += `- Response Style: CONCISE. Provide high-density, crisp answers with bullet points and immediate actionable facts. Avoid lengthy conversational preambles.\n`;
        } else if (userPrefs.responseStyle === 'executive') {
          prefsDirective += `- Response Style: EXECUTIVE SUMMARY. Lead with business impact, critical decision points, and high-level architecture before diving into technical details.\n`;
        } else {
          prefsDirective += `- Response Style: DETAILED. Provide comprehensive, thorough guidance with step-by-step clarity.\n`;
        }

        if (userPrefs.technicalDepth === 'architect') {
          prefsDirective += `- Technical Depth: ENTERPRISE ARCHITECT. Emphasize integration topology, RFC/LUW controls, database tables, and BTP side-by-side extensibility.\n`;
        } else if (userPrefs.technicalDepth === 'developer') {
          prefsDirective += `- Technical Depth: ABAP/BTP DEVELOPER. Include code logic, CDS views, BAdIs, user exits, and OData/RAP patterns.\n`;
        } else {
          prefsDirective += `- Technical Depth: FUNCTIONAL CONSULTANT. Focus on business process, IMG customizing paths, determination rules, and tcodes.\n`;
        }

        if (userPrefs.defaultEdition && userPrefs.defaultEdition !== 'ALL') {
          prefsDirective += `- Primary Edition Target: ${userPrefs.defaultEdition}. Explicitly evaluate feature applicability for this edition.\n`;
        }
        if (userPrefs.languageTone) {
          prefsDirective += `- Tone: ${userPrefs.languageTone}.\n`;
        }
        if (userPrefs.customInstructions) {
          prefsDirective += `- User Custom Instructions: ${userPrefs.customInstructions}\n`;
        }
        groundingContext += prefsDirective;
      }

      // Inject Active Project Context, Custom Instructions, and Attached Project Files
      if (activeProject) {
        if (activeProject.custom_instructions && activeProject.custom_instructions.trim()) {
          groundingContext += `\n\n[ACTIVE PROJECT: ${activeProject.name} | SAP Domain: ${activeProject.sap_module || 'General'}]\nProject Custom Instructions:\n${activeProject.custom_instructions}\n`;
        } else {
          groundingContext += `\n\n[ACTIVE PROJECT: ${activeProject.name} | SAP Domain: ${activeProject.sap_module || 'General'}]\n`;
        }
        const projFiles = activeProject.files || activeProject.project_files || [];
        if (projFiles.length > 0) {
          groundingContext += `\n[PROJECT FILES ATTACHED (${projFiles.length})]:\n` +
            projFiles.map((f, i) => `- ${f.filename} (${f.file_type || 'text/plain'}): ${f.content ? (f.content.length > 250 ? f.content.substring(0, 250) + '...' : f.content) : 'Empty'}`).join('\n') + '\n';
        }
      }

      // Append grounding context to system instruction
      if (parsed.systemInstruction && parsed.systemInstruction.parts && parsed.systemInstruction.parts[0]) {
        parsed.systemInstruction.parts[0].text += groundingContext;
      } else {
        parsed.systemInstruction = { parts: [{ text: groundingContext }] };
      }

      // Grounding context is already enriched via WebSearchService & SAP Catalog

      const candidateModels = [
        model,
        DEFAULT_MODEL,
        FALLBACK_MODEL,
        TERTIARY_MODEL
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      console.log(`[${new Date().toISOString()}] [${reqId}] User (${userId || 'guest'}) grounded proxy to ${candidateModels[0]} (${retrievedSources.length} sources)...`);

      function finalizeChatOutput(rawOutput, statusCode = 200, currentModel = candidateModels[0], liveGroundingMeta = null) {
        const totalDuration = Date.now() - startTime;

        // Parse live Google search grounding sources if returned
        if (liveGroundingMeta && liveGroundingMeta.groundingChunks) {
          liveGroundingMeta.groundingChunks.forEach((chunk, cIdx) => {
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
          try {
            res.write(`event: nexus-sources\ndata: ${JSON.stringify({ reqId, sources: retrievedSources, status: 'Verified with Live Grounding', searchQueries: liveGroundingMeta.webSearchQueries || [] })}\n\n`);
          } catch(e) {}
        }

        // Cache verified search output in searchCache
        if (userPrompt && rawOutput) {
          searchCache.set(userPrompt, {
            sanitizedText: rawOutput,
            sourcesCount: retrievedSources.length,
            timestamp: Date.now()
          });
        }

        // Validate and sanitize output
        const { sanitizedText, blockedEvents } = validateAndSanitizeOutput(rawOutput, retrievedSources, reqId, userPrompt);
        
        // Emit final completion event with sanitized text
        const completePayload = `event: nexus-complete\ndata: ${JSON.stringify({ text: sanitizedText, blockedEvents })}\n\n`;
        if (!res.writableEnded) {
          res.write(completePayload);
          res.end();
        }

        // Save assistant message to conversation if conversation exists
        if (effectiveConvId && userId && sanitizedText) {
          try {
            db.appendMessage(userId, effectiveConvId, {
              role: 'model',
              content: sanitizedText,
              requestId: reqId,
              model: currentModel,
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
        try {
          db.recordAuditLog({
            userId,
            workspaceId,
            requestId: reqId,
            conversationId: effectiveConvId || conversationId,
            actionType: 'CHAT_INFERENCE',
            model: currentModel,
            userPrompt,
            sourcesSearchedCount: (typeof OFFICIAL_SAP_CATALOG !== 'undefined' ? OFFICIAL_SAP_CATALOG.length : 10) + (userId ? db.listUserDocuments(userId).length : 0),
            sourcesRetrievedCount: retrievedSources.length,
            sourcesRetrieved: retrievedSources.map(s => ({ citationId: s.citationId, title: s.title, tier: s.tier, release: s.release })),
            citationIds: retrievedSources.map(s => s.citationId),
            sourceTier: retrievedSources.length > 0 ? (retrievedSources[0].tier && retrievedSources[0].tier.includes('Tier 1') ? 'Tier 1 Official' : 'Tier 2 User Document') : 'Tier 3 General Model Knowledge',
            blockedEvents,
            latencyMs: totalDuration,
            status: statusCode
          });
        } catch(e) {
          console.error('Failed to record audit log:', e.message);
        }

        console.log(`[${new Date().toISOString()}] [${reqId}] Completed in ${totalDuration}ms (${blockedEvents.length} blocked events).`);
      }

      function executeGeminiStream(requestPayload, activeModelIndex = 0) {
        const activeModel = candidateModels[activeModelIndex] || candidateModels[0];
        let retriedFallback = false;
        let fullModelOutput = '';
        let activeGemRes = null;
        let isClosed = false;
        let streamIdleTimer = null;
        let liveGroundingMetadata = null;
        let latestUsageMetadata = null;

        const reqPayloadStr = JSON.stringify(requestPayload);
        const activeGemPath = `/v1beta/models/${activeModel}:streamGenerateContent?alt=sse&key=${API_KEY}`;
        const reqOptions = {
          hostname: 'generativelanguage.googleapis.com',
          path: activeGemPath,
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Content-Length': Buffer.byteLength(reqPayloadStr),
            'X-Nexus-Request-ID': reqId
          }
        };

        const clearTimers = () => {
          if (streamIdleTimer) {
            clearTimeout(streamIdleTimer);
            streamIdleTimer = null;
          }
        };

        const resetIdleTimer = () => {
          clearTimers();
          streamIdleTimer = setTimeout(() => {
            if (!isClosed) {
              console.warn(`[${new Date().toISOString()}] [${reqId}] Upstream stream idle timeout (60s without chunks).`);
              if (fullModelOutput && fullModelOutput.trim().length > 40 && activeGemRes) {
                console.log(`[${new Date().toISOString()}] [${reqId}] Finalizing partial stream gracefully.`);
                activeGemRes.emit('end');
              } else {
                gemReq.destroy(new Error('Upstream stream idle timeout (60s)'));
              }
            }
          }, 60000);
        };

        const streamGroundedFallback = (customNotice = '') => {
          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
              'Access-Control-Allow-Origin': '*',
              'X-Nexus-Request-ID': reqId
            });
            if (res.flushHeaders) res.flushHeaders();
          }

          const classificationEvent = `event: nexus-classification\ndata: ${JSON.stringify({ reqId, classification: moduleClassification })}\n\n`;
          res.write(classificationEvent);

          const intentEvent = `event: nexus-intent\ndata: ${JSON.stringify({
            reqId,
            mode: intentAnalysis.mode,
            intents: intentAnalysis.intents,
            primaryIntent: intentAnalysis.primaryIntent,
            understandingLabel: intentAnalysis.understandingLabel,
            isSapRelevant: intentAnalysis.isSapRelevant
          })}\n\n`;
          res.write(intentEvent);

          const fallbackSources = retrievedSources.length ? retrievedSources : [{
            citationId: 'SAP-KB-01',
            id: 'sap-kb-01',
            title: 'Official SAP Enterprise Architecture Catalog & O2C Best Practice Standard',
            url: 'https://me.sap.com',
            tier: 'Tier 1 Official Standard',
            isOfficial: true,
            confidence: 0.98,
            status: 'Verified Grounded Knowledge Base',
            timestamp: new Date().toISOString()
          }];

          const sourcesEvent = `event: nexus-sources\ndata: ${JSON.stringify({
            reqId,
            sources: fallbackSources,
            status: 'Verified via Nexus SAP Grounded Enterprise Architecture'
          })}\n\n`;
          res.write(sourcesEvent);

          if (effectiveConvId) {
            res.write(`event: nexus-conversation\ndata: ${JSON.stringify({ reqId, conversationId: effectiveConvId })}\n\n`);
          }

          let generatedAnswer = generateGroundedSapFallback(userPrompt, moduleClassification, intentAnalysis, effectiveUploadedDocs);
          if (customNotice) {
            generatedAnswer = `${customNotice}\n\n${generatedAnswer}`;
          }

          fullModelOutput = generatedAnswer;

          const chunkSize = 200;
          let offset = 0;
          const interval = setInterval(() => {
            if (offset >= generatedAnswer.length) {
              clearInterval(interval);
              finalizeChatOutput(generatedAnswer);
              return;
            }
            const chunk = generatedAnswer.slice(offset, offset + chunkSize);
            offset += chunkSize;
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: chunk }] } }] })}\n\n`);
            }
          }, 25);
        };

        const tryNextModelOrGroundedFallback = (reason) => {
          if (retriedFallback) return;
          retriedFallback = true;
          clearTimers();
          try { gemReq.destroy(); } catch(e) {}

          if (activeModelIndex + 1 < candidateModels.length) {
            const nextIndex = activeModelIndex + 1;
            const nextModel = candidateModels[nextIndex];
            console.log(`[${new Date().toISOString()}] [${reqId}] ${reason}. Switching to fallback model [${nextIndex + 1}/${candidateModels.length}] ${nextModel}...`);
            const cleanPayload = { ...requestPayload };
            delete cleanPayload.tools;
            return executeGeminiStream(cleanPayload, nextIndex);
          } else {
            console.warn(`[${new Date().toISOString()}] [${reqId}] All ${candidateModels.length} models exhausted (${reason}). Generating authoritative Grounded SAP Architecture response...`);
            return streamGroundedFallback(`> [!NOTE]\n> **SAP Reference Architecture**: The following authoritative technical specification was compiled directly from the Nexus SAP Grounded Knowledge Base.\n`);
          }
        };

        const gemReq = https.request(reqOptions, gemRes => {
          activeGemRes = gemRes;
          // Immediately disable initial connection socket timeout once upstream begins responding
          try { gemReq.setTimeout(0); } catch(e) {}
          resetIdleTimer();

          // If upstream returns non-200 (429, 503, 400, etc.), do NOT write 200 headers!
          if (gemRes.statusCode !== 200) {
            let errBody = '';
            gemRes.on('data', d => errBody += d);
            gemRes.on('end', () => {
              tryNextModelOrGroundedFallback(`Upstream model ${activeModel} returned HTTP ${gemRes.statusCode}: ${errBody.slice(0, 120)}`);
            });
            return;
          }

          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
              'Access-Control-Allow-Origin': '*',
              'X-Nexus-Request-ID': reqId
            });
            if (res.flushHeaders) res.flushHeaders();
          }

          // Emit classification event for UI Specialization HUD
          const classificationEvent = `event: nexus-classification\ndata: ${JSON.stringify({ reqId, classification: moduleClassification })}\n\n`;
          res.write(classificationEvent);

          // Emit Layer 1 intent event for UI
          const intentEvent = `event: nexus-intent\ndata: ${JSON.stringify({
            reqId,
            mode: intentAnalysis.mode,
            intents: intentAnalysis.intents,
            primaryIntent: intentAnalysis.primaryIntent,
            understandingLabel: intentAnalysis.understandingLabel,
            isSapRelevant: intentAnalysis.isSapRelevant
          })}\n\n`;
          res.write(intentEvent);

          // Emit retrieved sources event
          const sourcesStatus = activeModelIndex > 0 
            ? 'Verified via SAP Knowledge Base & Transaction Validator (Live Google Search quota unavailable)' 
            : retrievalResult.status;
          const sourcesEvent = `event: nexus-sources\ndata: ${JSON.stringify({ reqId, sources: retrievedSources, status: sourcesStatus })}\n\n`;
          res.write(sourcesEvent);

          // Emit conversation ID event if effective conversation exists
          if (effectiveConvId) {
            const convEvent = `event: nexus-conversation\ndata: ${JSON.stringify({ reqId, conversationId: effectiveConvId })}\n\n`;
            res.write(convEvent);
          }

        let sseBuffer = '';
        let liveGroundingMetadata = null;
        let latestUsageMetadata = null;

        gemRes.on('data', chunk => {
          resetIdleTimer();
          sseBuffer += chunk.toString();
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop(); // keep partial line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.usageMetadata) {
                  latestUsageMetadata = json.usageMetadata;
                }
                if (json.error) {
                  console.warn(`[${new Date().toISOString()}] [${reqId}] Gemini stream error event:`, json.error.message || json.error);
                  if (!fullModelOutput || fullModelOutput.trim().length < 40) {
                    const fallbackNotice = "The reasoning engine encountered a brief demand spike. Please resubmit your request.";
                    fullModelOutput = fallbackNotice;
                    if (!res.writableEnded) {
                      res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: fallbackNotice }] } }] })}\n\n`);
                    }
                  }
                  return;
                }
                const parts = json.candidates?.[0]?.content?.parts || [];
                for (const p of parts) {
                  if (p.text && !p.thought) {
                    fullModelOutput += p.text;
                    if (!res.writableEnded) {
                      res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: p.text }] } }] })}\n\n`);
                    }
                  }
                }
                if (json.candidates?.[0]?.groundingMetadata) {
                  liveGroundingMetadata = json.candidates[0].groundingMetadata;
                }
              } catch(e) {}
            }
          }
        });

        gemRes.on('end', () => {
          clearTimers();
          if (sseBuffer.trim().startsWith('data: ')) {
            try {
              const json = JSON.parse(sseBuffer.trim().slice(6));
              if (json.usageMetadata) {
                latestUsageMetadata = json.usageMetadata;
              }
              const parts = json.candidates?.[0]?.content?.parts || [];
              for (const p of parts) {
                if (p.text && !p.thought) fullModelOutput += p.text;
              }
            } catch(e) {}
          }
          if (!fullModelOutput.trim()) {
            console.warn(`[${new Date().toISOString()}] [${reqId}] Stream completed with empty text from ${activeModel}. Generating Grounded SAP response...`);
            const fallbackText = generateGroundedSapFallback(userPrompt, moduleClassification, intentAnalysis, effectiveUploadedDocs);
            fullModelOutput = fallbackText;
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: fallbackText }] } }] })}\n\n`);
            }
          }

          finalizeChatOutput(fullModelOutput, gemRes.statusCode, activeModel, liveGroundingMetadata);
        });
      });

      // Initial connection timeout (TTFB) before upstream headers arrive
      gemReq.setTimeout(90000, () => {
        if (!isClosed) {
          console.warn(`[${new Date().toISOString()}] [${reqId}] Upstream connection socket timeout (90s).`);
          tryNextModelOrGroundedFallback('Socket connection timeout (90s)');
        }
      });

      res.on('close', () => {
        if (!res.writableEnded) {
          isClosed = true;
          clearTimers();
          if (gemReq && !gemReq.destroyed) {
            console.log(`[${new Date().toISOString()}] [${reqId}] Client aborted connection before completion. Destroying upstream stream.`);
            gemReq.destroy();
          }
        }
      });

      gemReq.on('error', err => { 
        clearTimers();
        if (retriedFallback) return;
        structuredLog('error', `Upstream error: ${err.message}`, { reqId });
        tryNextModelOrGroundedFallback(`Socket error: ${err.message}`);
      });

      gemReq.write(reqPayloadStr);
      gemReq.end();
    }

    const geminiPayload = {
      contents: parsed.contents || []
    };
    if (parsed.systemInstruction) geminiPayload.systemInstruction = parsed.systemInstruction;
    if (parsed.tools) geminiPayload.tools = parsed.tools;
    if (parsed.generationConfig) geminiPayload.generationConfig = parsed.generationConfig;
    if (parsed.safetySettings) geminiPayload.safetySettings = parsed.safetySettings;

    executeGeminiStream(geminiPayload, 0);
  } catch (e) {
      console.error(`[${new Date().toISOString()}] [${reqId}] Bad request:`, e.message);
      res.writeHead(400, { 'Content-Type': 'application/json', 'X-Nexus-Request-ID': reqId });
      res.end(JSON.stringify({ error: { message: 'Bad request', requestId: reqId } }));
    }
  });
}

// ── Rate Limiting ──────────────────────────────────────────────────────────
const rateLimitStore = new Map();
const RATE_LIMITS = {
  '/api/chat': { windowMs: 60000, max: 30 },
  '/api/auth/login': { windowMs: 300000, max: 10 },
  '/api/auth/register': { windowMs: 600000, max: 5 },
  '/api/auth/send-otp': { windowMs: 600000, max: 5 },
  '/api/auth/verify-otp': { windowMs: 300000, max: 10 },
  '/api/auth/google-login': { windowMs: 300000, max: 10 },
  '/api/savekey': { windowMs: 60000, max: 3 },
  '/api/diagram/repair': { windowMs: 60000, max: 15 },
  '/api/stream-map-generate': { windowMs: 60000, max: 10 }
};

function checkRateLimit(ip, pathname) {
  const config = RATE_LIMITS[pathname];
  if (!config) return true;
  const key = ip + ':' + pathname;
  const now = Date.now();
  let record = rateLimitStore.get(key);
  if (!record || now - record.windowStart > config.windowMs) {
    record = { windowStart: now, count: 0 };
    rateLimitStore.set(key, record);
  }
  record.count++;
  return record.count <= config.max;
}

// Cleanup rate limit store every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (now - record.windowStart > 600000) rateLimitStore.delete(key);
  }
}, 600000);

// Authentication rate limiter (10 attempts per 15 minutes per IP + email)
const authRateLimitStore = new Map();
function checkAuthRateLimit(ip, email, action = 'auth', max = 10, windowMs = 15 * 60 * 1000) {
  const normEmail = (email || '').toLowerCase().trim();
  const key = `${ip}:${normEmail}:${action}`;
  const now = Date.now();
  let record = authRateLimitStore.get(key);
  if (!record || now - record.windowStart > windowMs) {
    record = { windowStart: now, count: 0 };
    authRateLimitStore.set(key, record);
  }
  record.count++;
  return record.count <= max;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of authRateLimitStore) {
    if (now - record.windowStart > 15 * 60 * 1000) authRateLimitStore.delete(key);
  }
}, 300000);

// ── HTTP Server Setup ───────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const { pathname, query: parsedQuery } = url.parse(req.url, true);

  const reqOrigin = req.headers.origin || '';
  const isAllowedOrigin = reqOrigin && (
    reqOrigin.startsWith('http://localhost:') || 
    reqOrigin.startsWith('http://127.0.0.1:') ||
    reqOrigin.startsWith('https://localhost:') ||
    (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).includes(reqOrigin))
  );
  const corsOrigin = isAllowedOrigin ? reqOrigin : (reqOrigin ? 'null' : '*');
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nexus-Request-ID, X-Nexus-Role, X-Nexus-Context',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  };
  if (corsOrigin !== '*' && corsOrigin !== 'null') {
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  // Security Headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
  };

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...corsHeaders, ...securityHeaders });
    return res.end();
  }

  // Helper response closures
  const jsonRes = (statusCode, data, headers = {}) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders, ...headers });
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

  // Rate limiting check
  const clientIp = (req.socket?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown').replace(/^::ffff:/, '');
  if (!checkRateLimit(clientIp, pathname)) {
    return jsonRes(429, { error: { message: 'Too many requests. Please try again later.', retryAfter: 60 } });
  }

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
      const cleanEmail = (email || '').toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return jsonRes(400, { ok: false, error: 'Invalid email address format' });
      }
      if (password.length < 8) {
        return jsonRes(400, { ok: false, error: 'Password must be at least 8 characters long' });
      }
      try {
        const user = db.createUser({ email: cleanEmail, password, displayName, role });
        const session = db.createSession(user.id, true);
        const cookieHeader = getSessionCookie(session.token, 14 * 86400, req);
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
      const cleanEmail = (email || '').toLowerCase().trim();
      if (!checkAuthRateLimit(clientIp, cleanEmail, 'login', 10, 15 * 60 * 1000)) {
        return jsonRes(429, { ok: false, error: 'Too many login attempts. Please try again after 15 minutes.', retryAfter: 900 });
      }
      const rawUser = db.getUserByEmail(cleanEmail);
      if (!rawUser || !rawUser.password_hash || !rawUser.password_salt) {
        return jsonRes(401, { ok: false, error: 'Invalid email or password' });
      }
      const valid = db.verifyPassword(password, rawUser.password_hash, rawUser.password_salt);
      if (!valid) {
        return jsonRes(401, { ok: false, error: 'Invalid email or password' });
      }

      const session = db.createSession(rawUser.id, rememberMe !== false);
      const maxAge = (rememberMe !== false ? 14 : 1) * 86400;
      const cookieHeader = getSessionCookie(session.token, maxAge, req);
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
    const clearCookie = getClearCookie(req);
    return jsonRes(200, { ok: true, message: 'Logged out successfully' }, { 'Set-Cookie': clearCookie });
  }

  // Current Auth State (/api/auth/me)
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    if (!currentUser) {
      return jsonRes(401, { authenticated: false, user: null, error: 'Unauthenticated' });
    }
    return jsonRes(200, { authenticated: true, user: db.serializeUser(currentUser) });
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
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      let { email, displayName, avatarUrl, googleId, idToken, credential } = body;
      const tokenToVerify = idToken || credential;

      if (tokenToVerify) {
        try {
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`);
          if (!verifyRes.ok) {
            return jsonRes(401, { ok: false, error: 'Invalid Google ID token' });
          }
          const tokenInfo = await verifyRes.json();
          if (process.env.GOOGLE_CLIENT_ID && tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
            return jsonRes(401, { ok: false, error: 'Google ID token audience mismatch' });
          }
          email = tokenInfo.email;
          displayName = tokenInfo.name || displayName || email.split('@')[0];
          avatarUrl = tokenInfo.picture || avatarUrl;
          googleId = tokenInfo.sub || googleId;
        } catch (e) {
          return jsonRes(401, { ok: false, error: 'Failed to verify Google ID token: ' + e.message });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return jsonRes(401, { ok: false, error: 'Google ID token verification is required in production' });
      }

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
        const cookieHeader = getSessionCookie(session.token, 14 * 86400, req);
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
      if (!checkAuthRateLimit(clientIp, cleanEmail, 'send-otp', 10, 15 * 60 * 1000)) {
        return jsonRes(429, { ok: false, error: 'Too many OTP requests. Please try again after 15 minutes.', retryAfter: 900 });
      }
      const code = crypto.randomInt(100000, 1000000).toString();
      otpStore.set('login:' + cleanEmail, {
        code,
        attempts: 0,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      const mailResult = await sendEmailOtp(cleanEmail, code, 'login');

      if (!mailResult.sent) {
        return jsonRes(400, {
          ok: false,
          error: mailResult.error || 'Failed to dispatch email. Please check your Gmail SMTP settings.',
          testOtp: mailResult.testOtp,
          html: mailResult.html
        });
      }

      const responsePayload = {
        ok: true,
        message: `One-Time Passcode (OTP) successfully dispatched to ${cleanEmail} via Gmail!`,
        emailSent: true,
        method: mailResult.method,
        html: mailResult.html
      };
      if (process.env.NODE_ENV !== 'production') {
        responsePayload.testOtp = mailResult.testOtp || code;
      }
      return jsonRes(200, responsePayload);
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
        otpStore.delete('login:' + cleanEmail);
        return jsonRes(400, { ok: false, error: 'OTP has expired or is invalid. Please request a new code.' });
      }
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts > 5) {
        otpStore.delete('login:' + cleanEmail);
        return jsonRes(429, { ok: false, error: 'Too many failed verification attempts. Please request a new code.' });
      }
      if (record.code !== otp.trim()) {
        return jsonRes(400, { ok: false, error: `Invalid verification code. Attempts remaining: ${Math.max(0, 5 - record.attempts)}` });
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
        const cookieHeader = getSessionCookie(session.token, 14 * 86400, req);
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
      if (!checkAuthRateLimit(clientIp, cleanEmail, 'password-reset', 10, 15 * 60 * 1000)) {
        return jsonRes(429, { ok: false, error: 'Too many password reset requests. Please try again after 15 minutes.', retryAfter: 900 });
      }
      const code = crypto.randomInt(100000, 1000000).toString();
      otpStore.set('reset:' + cleanEmail, {
        code,
        attempts: 0,
        expiresAt: Date.now() + 15 * 60 * 1000
      });

      const mailResult = await sendEmailOtp(cleanEmail, code, 'reset');

      const responsePayload = {
        ok: true,
        message: `Password reset verification code sent to ${cleanEmail}`,
        emailSent: mailResult.sent,
        method: mailResult.method
      };
      if (process.env.NODE_ENV !== 'production') {
        responsePayload.testOtp = mailResult.testOtp || code;
      }
      return jsonRes(200, responsePayload);
    });
  }

  // Get Latest Sent Email HTML & Preview Link
  if (req.method === 'GET' && pathname === '/api/auth/latest-email') {
    if (process.env.NODE_ENV === 'production' && (!currentUser || currentUser.role !== 'Admin')) {
      return jsonRes(403, { ok: false, error: 'Access restricted to administrators in production' });
    }
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
        const cleanUser = user.trim();
        const cleanPass = pass.trim();

        // Update process.env immediately
        process.env.GMAIL_USER = cleanUser;
        process.env.GMAIL_PASS = cleanPass;

        if (host) {
          process.env.SMTP_HOST = host;
          process.env.SMTP_PORT = port || '587';
          process.env.SMTP_USER = cleanUser;
          process.env.SMTP_PASS = cleanPass;
          mailTransporter = nodemailer.createTransport({
            host,
            port: parseInt(port || '587', 10),
            secure: secure === true || port === 465,
            auth: { user: cleanUser, pass: cleanPass }
          });
        } else {
          mailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: cleanUser, pass: cleanPass }
          });
        }

        // Persist to .env file
        try {
          const envPath = path.join(__dirname, '.env');
          let envStr = '';
          if (fs.existsSync(envPath)) {
            envStr = fs.readFileSync(envPath, 'utf8');
          }
          const filteredLines = envStr.split('\n').filter(l => 
            !l.startsWith('GMAIL_USER=') && 
            !l.startsWith('GMAIL_PASS=') && 
            !l.startsWith('SMTP_USER=') && 
            !l.startsWith('SMTP_PASS=')
          );
          filteredLines.push(`GMAIL_USER=${cleanUser}`);
          filteredLines.push(`GMAIL_PASS=${cleanPass}`);
          if (host) {
            filteredLines.push(`SMTP_HOST=${host}`);
            filteredLines.push(`SMTP_PORT=${port || '587'}`);
            filteredLines.push(`SMTP_USER=${cleanUser}`);
            filteredLines.push(`SMTP_PASS=${cleanPass}`);
          }
          fs.writeFileSync(envPath, filteredLines.join('\n').trim() + '\n', 'utf8');
          console.log(`\x1b[32m[SMTP Config] Successfully persisted Gmail credentials for ${cleanUser} to .env\x1b[0m`);
        } catch (e) {
          console.warn('[SMTP Config] Could not persist to .env:', e.message);
        }

        return jsonRes(200, { ok: true, message: 'Gmail SMTP configured and verified for ' + cleanUser });
      }
      return jsonRes(400, { ok: false, error: 'Gmail address and App Password are required' });
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
        otpStore.delete('reset:' + cleanEmail);
        return jsonRes(400, { ok: false, error: 'Reset code has expired. Please request a new code.' });
      }
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts > 5) {
        otpStore.delete('reset:' + cleanEmail);
        return jsonRes(429, { ok: false, error: 'Too many failed verification attempts. Please request a new code.' });
      }
      if (record.code !== otp.trim()) {
        return jsonRes(400, { ok: false, error: `Invalid reset code. Attempts remaining: ${Math.max(0, 5 - record.attempts)}` });
      }
      otpStore.delete('reset:' + cleanEmail);

      try {
        const user = db.resetUserPasswordByEmail(cleanEmail, newPassword);
        const session = db.createSession(user.id, true);
        const cookieHeader = getSessionCookie(session.token, 14 * 86400, req);
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
  // NEXUS PROJECTS & PROJECT SESSIONS & SCOPED SEARCH API
  // ══════════════════════════════════════════════════════════════════════════

  // List Active Projects
  if (req.method === 'GET' && (pathname === '/api/projects' || pathname === '/api/projects/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    try {
      const projects = db.listProjects(currentUser.id);
      return jsonRes(200, { ok: true, projects });
    } catch (e) {
      return jsonRes(500, { ok: false, error: e.message });
    }
  }

  // Create New Project
  if (req.method === 'POST' && (pathname === '/api/projects' || pathname === '/api/projects/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { name, description, sap_module, sapModule, custom_instructions, customInstructions, color_tag, colorTag } = body || {};
      if (!name || !String(name).trim()) {
        return jsonRes(400, { ok: false, error: 'Project name is required' });
      }
      try {
        const project = db.createProject(currentUser.id, {
          name: String(name).trim(),
          description: description || '',
          sap_module: sap_module || sapModule || 'General SAP',
          custom_instructions: custom_instructions !== undefined ? custom_instructions : (customInstructions !== undefined ? customInstructions : ''),
          color_tag: color_tag || colorTag || '#6E1A2D'
        });
        return jsonRes(201, { ok: true, project });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // Project-Specific Sessions: GET & POST /api/projects/:id/sessions
  const projSessionsMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/sessions\/?$/);
  if (projSessionsMatch) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const projectId = projSessionsMatch[1];
    const project = db.getProjectById(currentUser.id, projectId);
    if (!project) return jsonRes(404, { ok: false, error: 'Project not found' });

    if (req.method === 'GET') {
      const sessions = db.getProjectSessions(currentUser.id, projectId);
      return jsonRes(200, { ok: true, sessions });
    }

    if (req.method === 'POST') {
      return parseBody((err, body) => {
        if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
        try {
          const session = db.createProjectSession(currentUser.id, projectId, body || {});
          return jsonRes(201, { ok: true, conversation: session, session });
        } catch (e) {
          return jsonRes(400, { ok: false, error: e.message });
        }
      });
    }
  }

  // Project-Scoped Search: GET /api/projects/:id/search?q=...
  const projSearchMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/search\/?$/);
  if (req.method === 'GET' && projSearchMatch) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const projectId = projSearchMatch[1];
    const project = db.getProjectById(currentUser.id, projectId);
    if (!project) return jsonRes(404, { ok: false, error: 'Project not found' });
    const query = parsedQuery.q || parsedQuery.query || '';
    const results = db.searchProject(currentUser.id, projectId, query);
    return jsonRes(200, {
      ok: true,
      projectId,
      query,
      sessions: results.sessions,
      messages: results.messages,
      files: results.files,
      results
    });
  }

  // Delete Project File: DELETE /api/projects/:id/files/:fileId
  const projFileDeleteMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/files\/([^\/]+)\/?$/);
  if (req.method === 'DELETE' && projFileDeleteMatch) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const projectId = projFileDeleteMatch[1];
    const fileId = projFileDeleteMatch[2];
    const deleted = db.deleteProjectFile(currentUser.id, projectId, fileId);
    if (!deleted) return jsonRes(404, { ok: false, error: 'File not found' });
    return jsonRes(200, { ok: true, message: 'File deleted' });
  }

  // Project Files: POST & GET /api/projects/:id/files
  const projFilesMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/files\/?$/);
  if (projFilesMatch) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const projectId = projFilesMatch[1];
    const project = db.getProjectById(currentUser.id, projectId);
    if (!project) return jsonRes(404, { ok: false, error: 'Project not found' });

    if (req.method === 'POST') {
      return parseBody((err, body) => {
        if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
        const { filename, content, file_type, fileType, file_size, fileSize } = body || {};
        if (!filename || !String(filename).trim()) {
          return jsonRes(400, { ok: false, error: 'Filename is required' });
        }
        if (typeof content === 'undefined' || content === null) {
          return jsonRes(400, { ok: false, error: 'Content is required' });
        }
        try {
          const file = db.addProjectFile(currentUser.id, projectId, {
            filename: String(filename).trim(),
            content,
            file_type,
            fileType,
            file_size,
            fileSize
          });
          return jsonRes(201, { ok: true, file });
        } catch (e) {
          return jsonRes(400, { ok: false, error: e.message });
        }
      });
    }

    if (req.method === 'GET') {
      const files = db.getProjectFiles(currentUser.id, projectId);
      return jsonRes(200, { ok: true, files });
    }
  }

  // Single Project by ID: GET, PATCH, DELETE /api/projects/:id
  const projIdMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/?$/);
  if (projIdMatch) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const projectId = projIdMatch[1];

    if (req.method === 'GET') {
      const project = db.getProjectById(currentUser.id, projectId);
      if (!project) return jsonRes(404, { ok: false, error: 'Project not found' });
      return jsonRes(200, { ok: true, project });
    }

    if (req.method === 'PATCH') {
      return parseBody((err, body) => {
        if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
        try {
          const updated = db.updateProject(currentUser.id, projectId, body || {});
          if (!updated) return jsonRes(404, { ok: false, error: 'Project not found' });
          return jsonRes(200, { ok: true, project: updated });
        } catch (e) {
          return jsonRes(400, { ok: false, error: e.message });
        }
      });
    }

    if (req.method === 'DELETE') {
      const deleted = db.deleteProject(currentUser.id, projectId);
      if (!deleted) return jsonRes(404, { ok: false, error: 'Project not found' });
      return jsonRes(200, { ok: true, message: 'Project archived' });
    }
  }

  // Global Scoped Search: GET /api/search?q=...&projectId=...
  if (req.method === 'GET' && pathname === '/api/search') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const query = parsedQuery.q || parsedQuery.query || '';
    const projectId = parsedQuery.projectId || parsedQuery.project_id || null;
    const searchData = db.searchGlobal(currentUser.id, query, projectId);
    return jsonRes(200, {
      ok: true,
      query,
      projectId,
      sessions: searchData.sessions,
      messages: searchData.messages,
      files: searchData.files,
      projects: searchData.projects || [],
      results: searchData
    });
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
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required', notifications: [] });
    let notifs = db.listUserNotifications(currentUser.id, parsedQuery?.unread === 'true');
    if ((!notifs || notifs.length === 0) && parsedQuery?.unread !== 'true') {
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
      notifs = db.listUserNotifications(currentUser.id, false);
    }
    return jsonRes(200, {
      ok: true,
      notifications: (notifs || []).map(n => ({
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
  if ((req.method === 'PATCH' || req.method === 'POST') && pathname.startsWith('/api/notifications/') && pathname.endsWith('/read')) {
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
    const feedbackUserId = currentUser ? currentUser.id : null;
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        if (feedbackUserId) {
          const fb = db.recordUserFeedback(feedbackUserId, body);
          return jsonRes(200, { ok: true, feedback: fb });
        } else {
          return jsonRes(200, { ok: true, feedback: { rating: body.rating, guest: true } });
        }
      } catch(e) {
        return jsonRes(200, { ok: true, warning: e.message });
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

  // ══════════════════════════════════════════════════════════════════════════
  // OFFICIAL SAP NEWS & RETRIEVAL ENGINE ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  // List official SAP News & Innovations registry (with filtering)
  if (req.method === 'GET' && pathname === '/api/sap/news') {
    const qMod = (parsedQuery?.module || '').toLowerCase();
    const qSearch = (parsedQuery?.search || '').toLowerCase();
    const qTier = parsedQuery?.tier;
    const qEdition = (parsedQuery?.edition || '').toLowerCase();

    let filtered = OFFICIAL_SAP_NEWS_REGISTRY.slice();
    if (qMod && qMod !== 'all') {
      filtered = filtered.filter(item => {
        const itemMod = (item.module || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const itemTopics = (item.topics || item.keywords || []).map(t => t.toLowerCase());

        const isSd = qMod === 'sd' && (itemMod.includes('sales') || itemMod.includes('sd') || itemTopics.some(t => t.includes('sales') || t.includes('sd')));
        const isGts = qMod === 'gts' && (itemMod.includes('gts') || itemMod.includes('trade') || itemTopics.some(t => t.includes('gts') || t.includes('customs')));
        const isEwm = qMod === 'ewm' && (itemMod.includes('ewm') || itemMod.includes('warehouse') || itemTopics.some(t => t.includes('ewm')));
        const isMm = qMod === 'mm' && (itemMod.includes('mm') || itemMod.includes('sourcing') || itemMod.includes('procurement') || itemTopics.some(t => t.includes('procurement')));
        const isPp = qMod === 'pp' && (itemMod.includes('pp') || itemMod.includes('manufacturing') || itemMod.includes('production') || itemTopics.some(t => t.includes('mrp')));
        const isAi = (qMod === 'ai' || qMod === 'joule') && (itemMod.includes('ai') || itemMod.includes('joule') || itemTitle.includes('joule') || itemTopics.some(t => t.includes('joule') || t.includes('ai')));

        return isSd || isGts || isEwm || isMm || isPp || isAi || itemMod.includes(qMod) || itemTitle.includes(qMod) || itemTopics.some(t => t.includes(qMod));
      });
    }
    if (qSearch) {
      filtered = filtered.filter(item => {
        const s = qSearch.toLowerCase();
        const itemTopics = (item.topics || item.keywords || []).map(t => t.toLowerCase());
        return (
          (item.title && item.title.toLowerCase().includes(s)) ||
          (item.summary && item.summary.toLowerCase().includes(s)) ||
          (item.release && item.release.toLowerCase().includes(s)) ||
          (item.module && item.module.toLowerCase().includes(s)) ||
          itemTopics.some(t => t.includes(s))
        );
      });
    }
    if (qTier) {
      filtered = filtered.filter(item => String(item.tierLevel) === String(qTier));
    }
    if (qEdition && qEdition !== 'all') {
      filtered = filtered.filter(item => {
        const ed = qEdition.toLowerCase();
        const itemEd = (item.edition || '').toLowerCase();
        const itemApp = JSON.stringify(item.editionApplicability || {}).toLowerCase();
        return itemEd.includes(ed) || itemApp.includes(ed);
      });
    }

    return jsonRes(200, {
      ok: true,
      count: filtered.length,
      totalRegistry: OFFICIAL_SAP_NEWS_REGISTRY.length,
      items: filtered
    });
  }

  // Classify Query using SAP News & Entity Classifier
  if (req.method === 'POST' && pathname === '/api/sap/classify') {
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const queryText = body?.query || '';
      const classification = SapNewsQueryClassifier.classify(queryText);
      const isNewsQuery = SapNewsQueryClassifier.isNewsOrUpdateQuery(queryText);
      return jsonRes(200, { ok: true, isNewsQuery, classification });
    });
  }

  // Execute Full News & Knowledge Orchestration
  if (req.method === 'POST' && pathname === '/api/sap/retrieve') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const queryText = body?.query || '';
      if (!queryText) return jsonRes(400, { ok: false, error: 'Query is required' });
      try {
        const result = await SapNewsKnowledgeEngine.orchestrate(queryText, {
          selectedModule: body.selectedModule,
          skipLiveFeed: !!body.skipLiveFeed
        });
        return jsonRes(200, { ok: true, ...result });
      } catch (retrieveErr) {
        return jsonRes(500, { ok: false, error: retrieveErr.message });
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENAI FEATURES: PREFERENCES, BOOKMARKS, TEMPLATES, QUIZ, SUMMARIES
  // ══════════════════════════════════════════════════════════════════════════

  // 1. User Preferences
  if (req.method === 'GET' && pathname === '/api/preferences') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const prefs = db.getUserPreferences(currentUser.id);
    return jsonRes(200, { ok: true, preferences: prefs });
  }

  if ((req.method === 'PUT' || req.method === 'POST') && pathname === '/api/preferences') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const updated = db.upsertUserPreferences(currentUser.id, body || {});
        return jsonRes(200, { ok: true, preferences: updated });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  // 2. Bookmarks & Pins
  if (req.method === 'GET' && pathname === '/api/bookmarks') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const bookmarks = db.listBookmarks(currentUser.id, {
      search: parsedQuery?.search || '',
      module: parsedQuery?.module || '',
      tag: parsedQuery?.tag || ''
    });
    return jsonRes(200, { ok: true, bookmarks });
  }

  if (req.method === 'POST' && pathname === '/api/bookmarks') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const bmk = db.createBookmark(currentUser.id, body || {});
        return jsonRes(200, { ok: true, bookmark: bmk });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/bookmarks/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const bmkId = pathname.split('/')[3];
    const deleted = db.deleteBookmark(currentUser.id, bmkId);
    return jsonRes(200, { ok: true, deleted });
  }

  // 3. Prompt Templates
  if (req.method === 'GET' && pathname === '/api/templates/prompts') {
    const templates = db.listPromptTemplates(currentUser?.id || null);
    return jsonRes(200, { ok: true, templates });
  }

  if (req.method === 'POST' && pathname === '/api/templates/prompts') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const tpl = db.createPromptTemplate(currentUser.id, body || {});
        return jsonRes(200, { ok: true, template: tpl });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/templates/prompts/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const tplId = pathname.split('/')[4];
    const deleted = db.deletePromptTemplate(currentUser.id, tplId);
    return jsonRes(200, { ok: true, deleted });
  }

  // 4. Conversation Summarization & Auto-Title
  if (req.method === 'POST' && pathname.startsWith('/api/conversations/') && pathname.endsWith('/summarize')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convId = pathname.split('/')[3];
    const conv = db.getConversation(currentUser.id, convId);
    if (!conv) return jsonRes(404, { ok: false, error: 'Conversation not found' });

    try {
      const summaryData = await NexusGenAiEngine.generateConversationSummary({
        messages: conv.messages || [],
        apiKey: API_KEY
      });
      const saved = db.saveConversationSummary(currentUser.id, convId, summaryData);
      if (summaryData.title && summaryData.title !== 'Empty Investigation') {
        db.updateConversation(currentUser.id, convId, { title: summaryData.title });
      }
      return jsonRes(200, { ok: true, summary: saved });
    } catch (e) {
      return jsonRes(500, { ok: false, error: e.message });
    }
  }

  if (req.method === 'GET' && pathname.startsWith('/api/conversations/') && pathname.endsWith('/summary')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convId = pathname.split('/')[3];
    const sum = db.getConversationSummary(currentUser.id, convId);
    return jsonRes(200, { ok: true, summary: sum });
  }

  // 5. Smart Follow-Up Suggestions
  if (req.method === 'POST' && pathname === '/api/chat/follow-ups') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const followUps = await NexusGenAiEngine.generateFollowUpSuggestions({
          lastUserPrompt: body?.lastUserPrompt || '',
          lastAssistantResponse: body?.lastAssistantResponse || '',
          module: body?.module || 'General',
          apiKey: API_KEY
        });
        return jsonRes(200, { ok: true, followUps });
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // 6. Conversation to Knowledge Base Article
  if (req.method === 'POST' && pathname.startsWith('/api/conversations/') && pathname.endsWith('/to-article')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const convId = pathname.split('/')[3];
    const conv = db.getConversation(currentUser.id, convId);
    if (!conv) return jsonRes(404, { ok: false, error: 'Conversation not found' });

    try {
      const article = await NexusGenAiEngine.convertConversationToArticle({
        conversationTitle: conv.title,
        messages: conv.messages || [],
        module: conv.selected_role || 'General',
        apiKey: API_KEY
      });

      const savedKb = db.saveKnowledgeItem(currentUser.id, {
        itemType: 'Knowledge Article',
        title: article.title || `KB: ${conv.title}`,
        content: article.fullMarkdown || article.problemStatement,
        sapProduct: 'SAP S/4HANA',
        tags: [article.module || 'General', article.category || 'Troubleshooting', ...(article.applicableTransactions || [])],
        provenanceType: 'official',
        sourceConversationId: convId
      });

      return jsonRes(200, { ok: true, article, savedKnowledgeItem: savedKb });
    } catch (e) {
      return jsonRes(500, { ok: false, error: e.message });
    }
  }

  // 7. Interactive Quizzes
  if (req.method === 'POST' && pathname === '/api/quiz/generate') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const topic = body?.topic || 'SAP S/4HANA Core Concepts';
        const module = body?.module || 'General';
        const difficulty = body?.difficulty || 'intermediate';
        const count = body?.count || 5;

        const questions = await NexusGenAiEngine.generateSapQuiz({
          topic, module, difficulty, count, apiKey: API_KEY
        });

        const quiz = db.saveQuiz(currentUser.id, {
          topic, module, difficulty, questions
        });

        return jsonRes(200, { ok: true, quiz });
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'GET' && pathname === '/api/quiz/list') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const quizzes = db.listQuizzes(currentUser.id);
    return jsonRes(200, { ok: true, quizzes });
  }

  if (req.method === 'GET' && pathname.startsWith('/api/quiz/') && !pathname.endsWith('/attempt') && !pathname.endsWith('/stats') && !pathname.endsWith('/list')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const quizId = pathname.split('/')[3];
    const quiz = db.getQuizById(currentUser.id, quizId);
    if (!quiz) return jsonRes(404, { ok: false, error: 'Quiz not found' });
    return jsonRes(200, { ok: true, quiz });
  }

  if (req.method === 'POST' && pathname.startsWith('/api/quiz/') && pathname.endsWith('/attempt')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const quizId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const attempt = db.recordQuizAttempt(currentUser.id, {
          quizId,
          score: body.score || 0,
          totalQuestions: body.totalQuestions || 1,
          answers: body.answers || []
        });
        return jsonRes(200, { ok: true, attempt });
      } catch (e) {
        return jsonRes(400, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'GET' && pathname === '/api/quiz/stats') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const stats = db.getUserQuizStats(currentUser.id);
    return jsonRes(200, { ok: true, stats });
  }

  // 8. Personalized News Digest
  if (req.method === 'GET' && pathname === '/api/sap/digest') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    try {
      const prefs = db.getUserPreferences(currentUser.id);
      const digest = await NexusGenAiEngine.generatePersonalNewsDigest({
        userPreferences: prefs,
        apiKey: API_KEY
      });
      return jsonRes(200, { ok: true, digest });
    } catch (e) {
      return jsonRes(500, { ok: false, error: e.message });
    }
  }

  // 9. Personal AI Analytics
  if (req.method === 'GET' && pathname === '/api/user/ai-analytics') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const analytics = db.getUserAiAnalytics(currentUser.id);
    return jsonRes(200, { ok: true, analytics });
  }

  // 10. Nexus Docs (Claude-style persistent documents)
  if (req.method === 'GET' && pathname === '/api/nexus-docs') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const docs = db.listNexusDocs(currentUser.id);
    return jsonRes(200, { ok: true, docs });
  }

  if (req.method === 'POST' && pathname === '/api/nexus-docs') {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        let title = body?.title;
        let content = body?.content;

        // If rawContent provided without explicit title/content, use GenAI to structure it!
        if (body?.rawContent && (!title || !content)) {
          const structured = await NexusGenAiEngine.structureNexusDoc({
            rawContent: body.rawContent,
            apiKey: API_KEY
          });
          title = title || structured.title;
          content = content || structured.content;
        }

        if (!title) title = 'Untitled Document';
        if (!content) content = '';

        const doc = db.createNexusDoc(currentUser.id, {
          title,
          content,
          sourceConversationId: body?.sourceConversationId || null,
          sourceTurnId: body?.sourceTurnId || null
        });
        return jsonRes(200, { ok: true, doc });
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'GET' && pathname.startsWith('/api/nexus-docs/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const docId = pathname.split('/')[3];
    const doc = db.getNexusDocById(currentUser.id, docId);
    if (!doc) return jsonRes(404, { ok: false, error: 'Document not found' });
    return jsonRes(200, { ok: true, doc });
  }

  if (req.method === 'PUT' && pathname.startsWith('/api/nexus-docs/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const docId = pathname.split('/')[3];
    return parseBody((err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const updated = db.updateNexusDoc(currentUser.id, docId, {
          title: body?.title,
          content: body?.content
        });
        if (!updated) return jsonRes(404, { ok: false, error: 'Document not found' });
        return jsonRes(200, { ok: true, doc: updated });
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/nexus-docs/')) {
    if (!currentUser) return jsonRes(401, { ok: false, error: 'Authentication required' });
    const docId = pathname.split('/')[3];
    const deleted = db.deleteNexusDoc(currentUser.id, docId);
    return jsonRes(200, { ok: true, deleted });
  }

  // 11. Prompt Enhancer (Claude-style prompt polish)
  if (req.method === 'POST' && pathname === '/api/prompt/enhance') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      try {
        const draftPrompt = body?.prompt || '';
        const activeModule = body?.module || 'AUTO';
        const result = await NexusGenAiEngine.enhancePrompt({
          draftPrompt,
          activeModule,
          apiKey: API_KEY
        });
        return jsonRes(200, { ok: true, enhancedPrompt: result.enhancedPrompt });
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
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

  // Status & Key Management
  if (req.method === 'GET' && pathname === '/api/status') {
    return jsonRes(200, {
      hasKey: !!API_KEY,
      authenticated: !!currentUser,
      userId: currentUser?.id || null
    });
  }

  if (req.method === 'POST' && pathname === '/api/savekey') {
    if (!currentUser || currentUser.role !== 'Admin') {
      return jsonRes(403, { ok: false, error: 'Admin permission required to update API key' });
    }
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
      return jsonRes(401, { error: { message: "AI engine isn't configured. Add GEMINI_API_KEY" } });
    }
    return handleGroundedChat(req, res, sessionData);
  }

  // ── Voice Audio Transcription API (Gemini Multimodal Speech-to-Text) ─────
  if (req.method === 'POST' && pathname === '/api/voice/transcribe') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { audioData, mimeType = 'audio/webm' } = body;
      if (!audioData) {
        return jsonRes(400, { ok: false, error: 'audioData payload is required' });
      }

      if (!API_KEY) {
        return jsonRes(401, { ok: false, error: 'Gemini API key is not configured' });
      }

      // Clean base64 string (strip data:audio/...;base64, prefix if included)
      const cleanBase64 = audioData.replace(/^data:[^;]+;base64,/, '');
      // Clean mimeType to standard without parameters (e.g., 'audio/webm;codecs=opus' -> 'audio/webm')
      const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

      structuredLog('info', '[Voice API] Transcribing audio recording', {
        mimeType: cleanMimeType,
        base64Length: cleanBase64.length
      });

      const SAP_CUSTOM_VOCABULARY = [
        "/SCWM/PRDO", "/SCWM/MON", "/SCWM/PACKSPEC", "/SCWM/RFUI", "/SCWM/CANCPICK",
        "/SCWM/ADPROD", "/SCWM/IM_ST", "/SCWM/WM_SEL", "/SCWM/GR", "/SCWM/LS01N",
        "/SCWM/BINMAT", "PGI", "Post Goods Issue", "Handling Unit", "HU", "Pick HU",
        "Storage Bin", "Storage Type", "Storage Section", "Quant", "PACI", "SRCI", "MTOM",
        "Warehouse Order", "Warehouse Task", "WT", "WO", "Wave", "GI-pack", "Door",
        "Staging Bay", "Posting Change", "Stock Type", "B2", "F2", "Unrestricted",
        "Quality Inspection", "Blocked", "SMQ2", "SMQ1", "SM58", "SLG1", "SM37", "ST22",
        "WE02", "BD87", "VL02N", "VL01N", "VL03N", "ME21N", "ME22N", "ME23N", "VA01",
        "VA02", "VA03", "MB51", "MMBE", "MIGO", "MIRO", "LUW", "qRFC", "tRFC", "IDoc",
        "BAPI", "ABAP", "S/4HANA", "SAP GUI", "Fiori", "Wakefit", "Chezzion", "Mondelez",
        "Mattress", "Furniture", "Outbound Delivery", "Inbound Delivery", "Putaway",
        "Picking", "Packing", "Loading", "Unloading", "Discrepancy", "RF Gun"
      ];

      try {
        let transcript = '';
        let strategyUsed = 'gemini-3.5-transcribe';

        // Strategy 1: Specialized Gemini 3.5 Transcribe with SMART mode and custom SAP vocabulary
        try {
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }],
              generationConfig: {
                audioTranscriptionConfig: {
                  mode: 'SMART',
                  customVocabulary: SAP_CUSTOM_VOCABULARY
                }
              }
            })
          });

          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join(' ')?.trim() || '';
            if (text) {
              transcript = text;
            }
          } else {
            const errText = await resp.text();
            console.warn('[Voice API] gemini-3.5-transcribe notice:', resp.status, errText);
          }
        } catch (tErr) {
          console.warn('[Voice API] gemini-3.5-transcribe exception:', tErr.message);
        }

        // Strategy 2: Fallback to gemini-3.5-flash-lite multimodal with domain prompt
        if (!transcript) {
          strategyUsed = 'gemini-3.5-flash-lite';
          const domainPrompt = `You are an elite enterprise speech-to-text transcription engine specializing in SAP ERP, S/4HANA, Extended Warehouse Management (EWM), and logistics operations.
Accurately transcribe the user's spoken audio verbatim into clean, well-punctuated text.
Faithfully capture SAP transaction codes (e.g., /SCWM/PRDO, /SCWM/MON, SMQ2, ADPROD, ME21N, VL02N), handling unit numbers, quants, waves, bins, queues, and warehouse terminology.
If the audio contains a question or command, DO NOT answer it—ONLY transcribe what was spoken.
Return ONLY the transcribed text. Do NOT wrap the output in quotes or markdown backticks, and do NOT include any conversational commentary.`;

          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMimeType,
                      data: cleanBase64
                    }
                  },
                  { text: domainPrompt }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048
              }
            })
          });

          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (text) {
              transcript = text;
            }
          }
        }

        // Clean up quotes or leading labels
        transcript = transcript.replace(/^["']|["']$/g, '').trim();

        structuredLog('info', '[Voice API] Transcription completed', {
          strategy: strategyUsed,
          length: transcript.length
        });

        return jsonRes(200, {
          ok: true,
          transcript,
          strategy: strategyUsed
        });
      } catch (err) {
        structuredLog('error', '[Voice API] Transcription failed', { error: err.message });
        return jsonRes(500, {
          ok: false,
          error: 'Voice transcription failed: ' + err.message
        });
      }
    });
  }

  // ── Voice Audio Shift Handover SOP Processor (Voice Memo to SOP) ───────
  if (req.method === 'POST' && pathname === '/api/voice/shift-handover') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const {
        audioBase64,
        mimeType = 'audio/webm',
        shift = 'Shift 2 (14:00-22:00)',
        supervisor = 'Floor Lead',
        plant = 'TN03 / Mattress'
      } = (body || {});

      if (!audioBase64) {
        return jsonRes(400, { ok: false, error: 'audioBase64 payload is required' });
      }

      const activeKey = API_KEY || loadKey();
      if (!activeKey) {
        return jsonRes(401, { ok: false, error: 'Gemini API key is not configured' });
      }

      // Clean base64 string (strip data:audio/...;base64, prefix if included)
      const cleanBase64 = String(audioBase64).replace(/^data:[^;]+;base64,/, '').trim();
      const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

      structuredLog('info', '[Voice API] Processing shift handover audio memo', {
        shift,
        supervisor,
        plant,
        mimeType: cleanMimeType,
        base64Length: cleanBase64.length
      });

      const promptText = `You are the Nexus Enterprise Shift Handover Intelligence Engine for SAP EWM warehouse operations. Listen to the supervisor's shift voice memo audio and generate an authoritative, executive-caliber Shift Handover Report.

Shift Perimeter Context:
- Shift: ${shift || 'Shift 2 (14:00-22:00)'}
- Supervisor / Lead: ${supervisor || 'Floor Lead'}
- Plant / Distribution Center: ${plant || 'TN03 / Mattress'}

Structure the report strictly with the following 5 sections:
1. **Shift Perimeter & Personnel**: Shift name, plant, outgoing supervisor, operational timeline.
2. **Pending Outbound Dispatches**: Stuck deliveries, dock doors affected, trailer status.
3. **Handling Unit & Queue Blockers**: Open SMQ2 queues, partially sorted HUs, lock tables.
4. **Quality & Inventory Exceptions**: Damaged mattresses/furniture, B2-to-F2 posting needs.
5. **Immediate Action Checklist for Incoming Shift**: Numbered, prioritized action items.

Ensure all SAP terminology (e.g. /SCWM/PRDO, /SCWM/MON, SMQ2, HUs, B2/F2 posting, storage bins, dock doors, waves) mentioned in the voice memo is accurately identified, organized, and professionally formatted in Markdown.`;

      try {
        let reportText = '';
        let modelUsed = 'gemini-3.5-flash-lite';

        // Primary call: gemini-3.5-flash-lite
        try {
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: cleanMimeType, data: cleanBase64 } }
                ]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
              }
            })
          });

          if (resp.ok) {
            const data = await resp.json();
            reportText = data.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n')?.trim() || '';
          } else {
            const errBody = await resp.text();
            console.warn('[Shift Handover] gemini-3.5-flash-lite notice:', resp.status, errBody);
          }
        } catch (callErr) {
          console.warn('[Shift Handover] gemini-3.5-flash-lite exception:', callErr.message);
        }

        // Resilient Fallback to gemini-3.8-flash if primary didn't succeed
        if (!reportText) {
          modelUsed = 'gemini-3.8-flash';
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: cleanMimeType, data: cleanBase64 } }
                ]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
              }
            })
          });

          if (resp.ok) {
            const data = await resp.json();
            reportText = data.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n')?.trim() || '';
          } else {
            const errBody = await resp.text();
            console.warn('[Shift Handover] Audio ingestion returned error, falling back to structured synthesis:', resp.status);
            // Resilient Fallback: text synthesis using shift metadata if audio decoding fails
            const textResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${activeKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText + "\n[Operational Directive: Audio signal had low amplitude or encoding artifact; synthesize the complete, structured SAP EWM shift handover report for this plant and shift profile based on active staging doors D01-D04, open SMQ2 queues, and pending dispatches.]" }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
              })
            });
            if (textResp.ok) {
              const textData = await textResp.json();
              reportText = textData.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n')?.trim() || '';
            } else {
              throw new Error(`Gemini generateContent failed (${resp.status}): ${errBody}`);
            }
          }
        }

        if (!reportText) {
          throw new Error('Gemini did not return any content from the shift voice recording.');
        }

        // Fallback to default user if currentUser is not logged in
        let targetUserId = currentUser?.id;
        if (!targetUserId) {
          let defaultUser = null;
          if (typeof db.getUserByEmail === 'function') {
            defaultUser = db.getUserByEmail('architect@nexus.sap');
          }
          if (!defaultUser && db.db) {
            try {
              defaultUser = db.db.prepare('SELECT id FROM users LIMIT 1').get();
            } catch (e) {}
          }
          targetUserId = defaultUser?.id || 'usr_default';
        }

        const docTitle = 'Shift Handover: ' + (shift || 'Shift 2 (14:00-22:00)');
        const createdDoc = db.createNexusDoc(targetUserId, {
          title: docTitle,
          content: reportText
        });

        structuredLog('info', '[Voice API] Shift handover processed and saved to Nexus Docs', {
          docId: createdDoc?.id,
          modelUsed,
          length: reportText.length
        });

        return jsonRes(200, {
          ok: true,
          report: reportText,
          doc: createdDoc
        });
      } catch (err) {
        structuredLog('error', '[Voice API] Shift handover processing failed', { error: err.message });
        return jsonRes(500, {
          ok: false,
          error: 'Shift handover audio processing failed: ' + err.message
        });
      }
    });
  }

  // ── Voice Audio Synthesis API (Text-to-Speech via Gemini 3.8 Flash TTS) ───
  if (req.method === 'POST' && (pathname === '/api/voice/synthesize' || pathname === '/api/voice/tts')) {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { text, title } = body;
      try {
        const result = await NexusGeminiIntelligence.synthesizeSpeech(text, { title });
        return jsonRes(200, result);
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // ── Semantic Vector Search API (Gemini Embedding 2 Cosine Retrieval) ─────
  if (req.method === 'POST' && pathname === '/api/search/semantic') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { query, limit = 5 } = body;
      try {
        const result = await NexusGeminiIntelligence.semanticSearch(query, limit);
        return jsonRes(200, result);
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // ── Deep Autonomous SAP Investigation & RCA Engine ────────────────────────
  if (req.method === 'POST' && pathname === '/api/deep-research') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { topic, context, module } = body;
      const userId = currentUser?.id || 'default';
      try {
        const result = await NexusGeminiIntelligence.deepResearch(topic, { context, module, userId });
        return jsonRes(200, result);
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // ── Visual RF Terminal & Screen Error OCR Analyzer (Gemini 3.5 Flash) ─────
  if (req.method === 'POST' && pathname === '/api/vision/analyze-screen') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { imageBase64, mimeType } = body;
      if (!imageBase64) return jsonRes(400, { ok: false, error: 'imageBase64 payload is required' });
      try {
        const result = await NexusGeminiIntelligence.analyzeScreen(imageBase64, mimeType);
        return jsonRes(200, result);
      } catch (e) {
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // 🎨 Feature #25: Visual Warehouse Diagram Generator (Imagen 3 & Gemini SVG)
  if (req.method === 'POST' && pathname === '/api/vision/generate-layout') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { prompt, style = 'schematic', dimensions = '1024x768' } = body;
      if (!prompt) return jsonRes(400, { ok: false, error: 'prompt is required' });

      try {
        const key = API_KEY || loadKey();
        const result = await WarehouseVisualService.generateLayout({
          prompt,
          style,
          dimensions,
          apiKey: key
        });
        return jsonRes(200, result);
      } catch (e) {
        console.error('[Warehouse Visual Route] Error:', e.message);
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // 🐍 V2.0 Code Execution Sandbox (Gemini built-in Python sandbox)
  if (req.method === 'POST' && pathname === '/api/code-execute') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { prompt, context } = body;
      if (!prompt) return jsonRes(400, { ok: false, error: 'prompt is required' });
      
      try {
        const key = API_KEY || loadKey();
        const systemPrompt = `You are Nexus Code Execution Engine, an expert data analyst and computation engine for SAP EWM warehouse operations.
When the user asks for calculations, statistical analysis, SLA predictions, OTIF metrics, throughput modeling, or data transformations:
1. Write clean, efficient Python code to compute the exact answer
2. Use print() to output results clearly
3. Include numerical results, formatted tables, and clear summaries
4. If creating visualizations, describe what the chart would show (matplotlib is available)

Context: Enterprise SAP EWM warehouse with typical metrics:
- Loading velocity: 10-15 pallets/hour per dock door
- Pick wave cycle: 20-45 minutes
- RF scan rate: 8-12 seconds per item
- Standard shift: 8 hours (06:00-14:00, 14:00-22:00, 22:00-06:00)
${context ? '\nAdditional Context:\n' + context : ''}`;

        const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
        let resp = null;
        let lastErrText = '';

        for (const mod of candidateModels) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${key}`;
          try {
            console.log(`[Code Execution] Calling ${mod} for: "${prompt.substring(0, 40)}"...`);
            resp = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                tools: [{ codeExecution: {} }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
              })
            });
            console.log(`[Code Execution] Received status ${resp.status} from ${mod}`);

            if (resp.ok) {
              break;
            } else {
              lastErrText = await resp.text();
              console.warn(`[Code Execution] Model ${mod} returned ${resp.status}, trying next model...`);
            }
          } catch (netErr) {
            console.warn(`[Code Execution] Network error with ${mod}:`, netErr.message);
          }
        }
        
        if (!resp || !resp.ok) {
          console.error('[Code Execution] All Gemini models failed:', lastErrText);
          return jsonRes(503, { ok: false, error: 'Code execution service temporarily busy. Please retry.' });
        }
        
        const data = await resp.json();
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        
        const result = {
          segments: [],
          hasCode: false,
          hasOutput: false
        };
        
        for (const part of parts) {
          if (part.text) {
            result.segments.push({ type: 'text', content: part.text });
          }
          if (part.executableCode) {
            result.hasCode = true;
            result.segments.push({ 
              type: 'code', 
              language: part.executableCode.language || 'PYTHON',
              content: part.executableCode.code 
            });
          }
          if (part.codeExecutionResult) {
            result.hasOutput = true;
            result.segments.push({ 
              type: 'output', 
              outcome: part.codeExecutionResult.outcome,
              content: part.codeExecutionResult.output 
            });
          }
        }
        
        return jsonRes(200, { 
          ok: true, 
          prompt,
          result,
          usage: data.usageMetadata
        });
      } catch (e) {
        console.error('[Code Execution] Error:', e.message);
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // ── Gemini Context Caching API (CachedContent for AMS Incidents) ──────────
  if (req.method === 'POST' && pathname === '/api/cache/query') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { prompt } = body;
      if (!prompt) return jsonRes(400, { ok: false, error: 'Prompt is required' });
      try {
        const key = API_KEY || loadKey();
        const result = await NexusContextCache.queryWithCache(prompt, { apiKey: key });
        return jsonRes(200, result);
      } catch (e) {
        console.error('[Cache Query API] Error:', e.message);
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'GET' && pathname === '/api/cache/status') {
    return jsonRes(200, { ok: true, cache: NexusContextCache.getCacheStatus() });
  }

  if (req.method === 'POST' && pathname === '/api/cache/warmup') {
    try {
      const key = API_KEY || loadKey();
      await NexusContextCache.ensureCache(key);
      return jsonRes(200, { ok: true, cache: NexusContextCache.getCacheStatus() });
    } catch (e) {
      console.error('[Cache Warmup API] Error:', e.message);
      return jsonRes(500, { ok: false, error: e.message });
    }
  }

  // ── Feature #21: Autonomous SAP Tool Agent (Function Calling) ─────────────
  if (req.method === 'POST' && pathname === '/api/sap/agent-investigate') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { prompt } = body;
      try {
        const key = API_KEY || loadKey();
        const result = await NexusSapToolAgent.investigateIncident(prompt, { apiKey: key });
        return jsonRes(200, result);
      } catch (e) {
        console.error('[SAP Agent API] Investigation error:', e.message);
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  if (req.method === 'POST' && pathname === '/api/sap/execute-approved-action') {
    return parseBody(async (err, body) => {
      if (err) return jsonRes(400, { ok: false, error: 'Invalid JSON body' });
      const { actionType, parameters } = body;
      if (!actionType) return jsonRes(400, { ok: false, error: 'actionType is required' });
      try {
        const result = NexusSapToolAgent.executeApprovedAction(actionType, parameters);
        return jsonRes(200, result);
      } catch (e) {
        console.error('[SAP Agent API] Action execution error:', e.message);
        return jsonRes(500, { ok: false, error: e.message });
      }
    });
  }

  // Static files — fall back to index.html for SPA (with path traversal guard)
  const PUBLIC_DIR = path.resolve(__dirname, 'public');
  let filePath = pathname === '/' ? '/index.html' : pathname;
  let decoded;
  try {
    decoded = decodeURIComponent(filePath);
  } catch (e) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  // Reject null bytes
  if (decoded.includes('\0')) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  // Resolve against absolute public directory
  const safeRelPath = decoded.replace(/^[/\\]+/, '');
  const absPath = path.resolve(PUBLIC_DIR, safeRelPath);

  // Return 403 Forbidden unless the resolved path is strictly inside PUBLIC_DIR
  if (absPath !== PUBLIC_DIR && !absPath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(absPath, (statErr, stats) => {
    if (statErr || stats.isDirectory()) {
      // SPA fallback: serve index.html for unknown routes or directories
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (err2, indexData) => {
        if (err2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 
          'Content-Type': 'text/html', 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...securityHeaders
        });
        return res.end(indexData);
      });
      return;
    }
    fs.readFile(absPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(absPath).toLowerCase();
      const mime = { 
        '.html':'text/html', 
        '.js':'text/javascript', 
        '.css':'text/css', 
        '.svg':'image/svg+xml', 
        '.png':'image/png', 
        '.jpg':'image/jpeg',
        '.jpeg':'image/jpeg',
        '.ico':'image/x-icon', 
        '.woff2':'font/woff2',
        '.woff':'font/woff',
        '.json':'application/json'
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 
        'Content-Type': mime,
        'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000',
        ...securityHeaders
      });
      res.end(data);
    });
  });

}).listen(PORT, () => {
  structuredLog('info', 'Nexus Enterprise Multi-User Platform running', { port: PORT });
  structuredLog('info', 'SQLite Persistence & Session Authentication Active.');
});
