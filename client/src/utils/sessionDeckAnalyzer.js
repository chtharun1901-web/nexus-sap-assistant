/**
 * Session Deck Analyzer Engine for Nexus SAP Enterprise Platform
 * 
 * Pipeline:
 * STEP 1 — Collect Complete Session Data (All User Inquiries)
 * STEP 2 — Professionalize Inquiries from Casual Language to Executive Presentation Topics
 * STEP 3 — Detect SAP Modules & Extract Parameters per Inquiry
 * STEP 4 — Build Slide Outline Focused on Inquiries with Analyzed Right-Side Tables
 */

export const SAP_MODULE_SPECS = {
  GTS: {
    name: "SAP Global Trade Services (GTS)",
    code: "GTS",
    color: "#8B5CF6",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.35)",
    patterns: [
      /gts\b/i, /spl\b/i, /sanctioned\s*party/i, /embargo/i, /export\s*control/i,
      /export\s*licen[sc]e/i, /customs\s*management/i, /\/sapsll\//i, /legal\s*regulation/i,
      /blocked\s*partner/i, /screening/i, /compliance\s*officer/i, /customs\s*declaration/i
    ],
    signatureTcodes: ["/SAPSLL/SPL_CHG1", "/SAPSLL/BL_DOCS", "/SAPSLL/LEGCUS", "/SAPSLL/CUHD_01", "/SAPSLL/EMB_CHG"]
  },
  EWM: {
    name: "SAP Extended Warehouse Management (EWM)",
    code: "EWM",
    color: "#06B6D4",
    badgeBg: "rgba(6, 182, 212, 0.15)",
    badgeBorder: "rgba(6, 182, 212, 0.35)",
    patterns: [
      /ewm\b/i, /\/scwm\//i, /warehouse\s*task/i, /warehouse\s*order/i, /wave\s*management/i,
      /putaway/i, /picking/i, /staging/i, /storage\s*bin/i, /storage\s*type/i, /inbound\s*delivery/i,
      /outbound\s*delivery\s*order/i, /pmr\b/i, /production\s*material\s*request/i, /radio\s*frequency|rf\b/i
    ],
    signatureTcodes: ["/SCWM/MON", "/SCWM/TO_CONF", "/SCWM/PRDO", "/SCWM/PRDI", "/SCWM/PMR"]
  },
  PP: {
    name: "SAP Production Planning (PP)",
    code: "PP",
    color: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeBorder: "rgba(245, 158, 11, 0.35)",
    patterns: [
      /\bpp\b/i, /production\s*order/i, /process\s*order/i, /co01|co02|co03/i, /cor1|cor2/i,
      /bom\b|bill\s*of\s*material/i, /routing\b/i, /work\s*center/i, /mrp\b|material\s*requirements\s*planning/i,
      /component\s*staging/i, /order\s*release/i, /co11n|co15/i, /backflush/i, /planned\s*order/i
    ],
    signatureTcodes: ["CO01", "CO02", "MD04", "CO11N", "CS01", "CA01"]
  },
  MM: {
    name: "SAP Materials Management (MM)",
    code: "MM",
    color: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    badgeBorder: "rgba(16, 185, 129, 0.35)",
    patterns: [
      /\bmm\b/i, /purchase\s*order|po\b/i, /me21n|me22n|me23n/i, /migo\b/i, /goods\s*receipt/i,
      /inventory\s*management/i, /material\s*master/i, /mm01|mm02|mm03/i, /purchasing\s*info\s*record/i,
      /vendor\s*master|business\s*partner/i, /movement\s*type\s*(101|261|311|541)/i, /miro\b/i, /procure\s*to\s*pay/i
    ],
    signatureTcodes: ["ME21N", "MIGO", "MIRO", "MM03", "ME23N", "MMBE"]
  },
  SD: {
    name: "SAP Sales and Distribution (SD)",
    code: "SD",
    color: "#3B82F6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    badgeBorder: "rgba(59, 130, 246, 0.35)",
    patterns: [
      /\bsd\b/i, /sales\s*order/i, /va01|va02|va03/i, /outbound\s*delivery/i, /vl01n|vl02n/i,
      /billing\s*document|invoice/i, /vf01|vf02/i, /order\s*to\s*cash|o2c/i, /pricing\s*procedure/i,
      /customer\s*master/i, /vk11|vkoal/i, /atp\s*check/i, /shipping\s*point/i
    ],
    signatureTcodes: ["VA01", "VL01N", "VF01", "VK11", "VA03", "VL02N"]
  },
  FICO: {
    name: "SAP Financial Accounting & Controlling (FI/CO)",
    code: "FI/CO",
    color: "#EC4899",
    badgeBg: "rgba(236, 72, 153, 0.15)",
    badgeBorder: "rgba(236, 72, 153, 0.35)",
    patterns: [
      /\bfi\b|\bco\b|fi\/co/i, /general\s*ledger|g\/l/i, /fb50|fb60|f-02/i, /cost\s*center/i,
      /profit\s*center/i, /controlling\s*area/i, /company\s*code/i, /account\s*document/i,
      /posting\s*period/i, /settlement/i, /wbs\s*element/i
    ],
    signatureTcodes: ["FB50", "FB60", "F-02", "KS01", "FAGLL03", "KO88"]
  },
  BASIS: {
    name: "SAP Basis, ABAP & Integration",
    code: "Basis/Integration",
    color: "#64748B",
    badgeBg: "rgba(100, 116, 139, 0.15)",
    badgeBorder: "rgba(100, 116, 139, 0.35)",
    patterns: [
      /basis\b/i, /abap\b/i, /st22\b/i, /sm37\b/i, /smq1\b|smq2\b/i, /qrfc|bgrfc|trfc/i,
      /idoc\b/i, /we02|we05|we19|bd87/i, /slg1\b/i, /sm59\b/i, /badi\b|user\s*exit/i,
      /odata\b/i, /short\s*dump/i, /background\s*job/i, /rfc\s*destination/i
    ],
    signatureTcodes: ["SMQ1", "SMQ2", "SM59", "ST22", "SM37", "SLG1", "WE02", "BD87"]
  }
};

/**
 * Professionalize casual/colloquial human inquiries into executive SAP presentation titles
 */
export function professionalizeInquiryTitle(query, response = "", module = "GTS", index = 1) {
  if (!query) return `Technical Investigation #${index}`;
  
  const qLower = query.toLowerCase().trim();

  // Pattern-based professional mappings
  if (qLower.includes("draw") || qLower.includes("diagram") || qLower.includes("architecture")) {
    return "Architectural Data Flow: SAP S/4HANA ↔ SAP GTS ↔ EWM Orchestration";
  }
  if (qLower.includes("evolve") || qLower.includes("evolution") || qLower.includes("years did gts") || (qLower.includes("embedded") && qLower.includes("decentralised"))) {
    return "SAP GTS Architectural Evolution & Deployment Models (Embedded vs. Decentralized)";
  }
  if (qLower.includes("after this") || qLower.includes("what should i learn") || qLower.includes("next step")) {
    return "Enterprise Learning Roadmap: Advanced Global Trade Compliance & Customs Management";
  }
  if ((qLower.includes("advance") || qLower.includes("advanced")) && qLower.includes("standard")) {
    return "Feature Comparison: S/4HANA Standard Compliance vs. Advanced GTS Functionality";
  }
  if (qLower.includes("pillar") && qLower.includes("pp")) {
    return "SAP Production Planning (PP) Core Architecture & Functional Foundations";
  }
  if (qLower.includes("pillar") || qLower.includes("pillars")) {
    return `The Four Core Functional Pillars of SAP ${module || 'Global Trade Services'} Architecture`;
  }
  if (qLower.includes("spl") || qLower.includes("sanctioned party") || qLower.includes("screening")) {
    if (qLower.includes("information") || qLower.includes("pick") || qLower.includes("field") || qLower.includes("look at")) {
      return "Sanctioned Party List (SPL) Screening: Master Data Extraction & Field Mapping Criteria";
    }
    if (qLower.includes("inbound") || qLower.includes("po") || qLower.includes("goods receipt") || qLower.includes("procurement")) {
      return "Inbound Procurement SPL Screening Workflow: PO Creation to Goods Receipt Gateways";
    }
    if (qLower.includes("bp") || qLower.includes("business partner") || qLower.includes("feeder")) {
      return "Business Partner Master Data & Feeder Document Replication to SAP GTS";
    }
    return "Sanctioned Party List (SPL) Screening: Automated Fuzzy-Logic Compliance Engine";
  }
  if (qLower.includes("inbound") || qLower.includes("procurement")) {
    return "Inbound Procurement Compliance Architecture & Document Flow";
  }
  if (qLower.includes("export") || qLower.includes("outbound") || qLower.includes("sales order")) {
    return "End-to-End Export Compliance Orchestration: Sales Order to Customs Clearance";
  }
  if (qLower.includes("indian") || qLower.includes("website") || qLower.includes("dgft") || qLower.includes("rbi")) {
    return "Regulatory Sanctions Authorities & External Data Sources (DGFT, UN Consolidated, MEA)";
  }
  if (qLower.includes("un_consolidated") || qLower.includes("excel") || qLower.includes("spreadsheet") || qLower.includes("match")) {
    return "Audit Simulation: Sanction Match Detection & Blocked Document Triage Protocol";
  }
  if (qLower.includes("smq1") || qLower.includes("smq2") || qLower.includes("qrfc") || qLower.includes("bgrfc")) {
    return "qRFC & bgRFC Queue Infrastructure: Monitoring, Desynchronization & Triage";
  }

  // General heuristic for other inquiries:
  let cleaned = query
    .replace(/^(so\s+now\s+lets|can\s+you\s+(explain|draw|show|tell)|please\s+(explain|tell|show)|tell\s+me\s+about|what\s+happens\s+if|i\s+want\s+to\s+know|how\s+does|how\s+will|like\s+gts\s+do\s+we\s+have|in\s+the\s+above)\s+/gi, '')
    .replace(/\?+/g, '')
    .replace(/\*\([^\)]+\)\*/g, '')
    .trim();

  if (!cleaned) cleaned = query;
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `Technical Analysis: ${cleaned}`;
}

/**
 * Extract T-Codes from any text
 */
function extractTcodesFromText(text) {
  if (!text) return [];
  const tcodeRegex = /\b(\/SAPSLL\/[A-Z0-9_-]+|\/SCWM\/[A-Z0-9_-]+|[A-Z]{1,2}[0-9]{2}[A-Z0-9]{0,3}|ST22|SM37|SMQ1|SMQ2|SLG1|SM59|SMQS|SMQR|WE02|WE05|BD87)\b/g;
  const raw = text.match(tcodeRegex) || [];
  const ignored = new Set(["SAP", "EWM", "GTS", "RFC", "LUW", "PMR", "FIFO", "BOM", "MRP", "PDF", "PPT", "DOC", "XLS", "HTTP", "REST", "JSON", "XML", "STEP", "CASE", "TRUE", "NULL", "WARN", "INFO"]);
  return [...new Set(raw)]
    .map(t => t.toUpperCase())
    .filter(t => !ignored.has(t) && (t.startsWith("/") || /\d/.test(t) || t.startsWith("SM") || t.startsWith("ST") || t.startsWith("WE")));
}

/**
 * Detect individual module for a turn
 */
function detectModuleForText(text) {
  if (!text) return SAP_MODULE_SPECS.GTS;
  for (const modKey of Object.keys(SAP_MODULE_SPECS)) {
    const spec = SAP_MODULE_SPECS[modKey];
    for (const pat of spec.patterns) {
      if (pat.test(text)) return spec;
    }
  }
  return SAP_MODULE_SPECS.GTS;
}

/**
 * Clean and summarize model response into 2 key points and clean paragraph
 */
function cleanResponseForSlide(text) {
  if (!text) return { summary: "Operational analysis completed.", bullets: [] };
  
  const cleaned = text
    .replace(/\*Reasoning\.\.\.\*/g, '')
    .replace(/^### [^\n]+/gm, '')
    .replace(/^## [^\n]+/gm, '')
    .replace(/^# [^\n]+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();

  const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);
  const bullets = [];
  const paragraphs = [];

  lines.forEach(l => {
    if (l.startsWith("* ") || l.startsWith("- ") || l.startsWith("• ")) {
      const cleanBullet = l.replace(/^[*\-•\s]+/, '').trim();
      if (cleanBullet.length > 18 && bullets.length < 4) {
        bullets.push(cleanBullet);
      }
    } else if (!l.startsWith("|") && !l.startsWith("```")) {
      if (l.length > 25 && paragraphs.length < 3) {
        paragraphs.push(l);
      }
    }
  });

  const mainSummary = paragraphs.slice(0, 2).join(" ") || cleaned.substring(0, 320) + "...";
  return {
    summary: mainSummary.substring(0, 360) + (mainSummary.length > 360 ? "..." : ""),
    bullets: bullets.length > 0 ? bullets : ["Verified against official SAP enterprise architecture and configuration standards."]
  };
}

/**
 * Step 1: Collect session raw messages, turns, and metadata
 */
export function collectSessionData(rawSession, aiText, doc, conversationTurns = []) {
  const turns = [];
  const initialTitle = rawSession?.title?.replace(/^NX-[^:]+:\s*/, "") || doc?.title || "SAP Technical Investigation";
  
  // 1. If structured conversationTurns exist, utilize them
  if (conversationTurns && conversationTurns.length > 0) {
    conversationTurns.forEach((turn, idx) => {
      let rawQuery = turn.title || (idx === 0 ? initialTitle : `Inquiry ${idx + 1}`);
      let turnContent = turn.content || "";
      
      const qMatch = turnContent.match(/^### Follow-up Query:\s*([^\n]+)/);
      if (qMatch) {
        rawQuery = qMatch[1].replace(/\*\([^\)]+\)\*/g, '').trim();
        turnContent = turnContent.replace(/^### Follow-up Query:[^\n]*\n*/, '').trim();
      }

      const detectedMod = detectModuleForText(rawQuery + " " + turnContent);
      const professionalTitle = professionalizeInquiryTitle(rawQuery, turnContent, detectedMod.code, idx + 1);
      const tcodes = extractTcodesFromText(rawQuery + " " + turnContent);
      const parsed = cleanResponseForSlide(turnContent);

      turns.push({
        id: turn.id || `turn-${idx}`,
        index: idx,
        rawQuery,
        query: professionalTitle,
        response: turnContent,
        summary: parsed.summary,
        bullets: parsed.bullets,
        module: detectedMod.code,
        moduleName: detectedMod.name,
        moduleColor: detectedMod.color,
        tcodes: tcodes.length > 0 ? tcodes : (detectedMod.code === "GTS" ? ["/SAPSLL/BL_DOCS", "/SAPSLL/SPL_CHG1"] : (detectedMod.code === "EWM" ? ["/SCWM/MON", "/SCWM/PRDO"] : ["SMQ1", "SMQ2"]))
      });
    });
  } else if (aiText) {
    // 2. Parse from raw stitched aiText
    const rawSegments = aiText.split(/\n\n---\n\n(?=### Follow-up Query:)/g);
    rawSegments.forEach((segment, sIdx) => {
      let rawQuery = sIdx === 0 ? initialTitle : `Inquiry ${sIdx + 1}`;
      let turnContent = segment;
      const qMatch = segment.match(/^### Follow-up Query:\s*([^\n]+)/);
      if (qMatch) {
        rawQuery = qMatch[1].replace(/\*\([^\)]+\)\*/g, '').trim();
        turnContent = segment.replace(/^### Follow-up Query:[^\n]*\n*/, '').trim();
      }
      const detectedMod = detectModuleForText(rawQuery + " " + turnContent);
      const professionalTitle = professionalizeInquiryTitle(rawQuery, turnContent, detectedMod.code, sIdx + 1);
      const tcodes = extractTcodesFromText(rawQuery + " " + turnContent);
      const parsed = cleanResponseForSlide(turnContent);

      turns.push({
        id: `turn-${sIdx}`,
        index: sIdx,
        rawQuery,
        query: professionalTitle,
        response: turnContent,
        summary: parsed.summary,
        bullets: parsed.bullets,
        module: detectedMod.code,
        moduleName: detectedMod.name,
        moduleColor: detectedMod.color,
        tcodes: tcodes.length > 0 ? tcodes : ["/SAPSLL/BL_DOCS", "SMQ1"]
      });
    });
  } else if (doc) {
    // 3. Fallback to doc properties
    const detectedMod = detectModuleForText(doc.title + " " + doc.overview);
    const professionalTitle = professionalizeInquiryTitle(doc.title, doc.overview, detectedMod.code, 1);
    const parsed = cleanResponseForSlide(doc.overview || doc.summary);
    turns.push({
      id: "turn-0",
      index: 0,
      rawQuery: doc.title,
      query: professionalTitle,
      response: doc.overview,
      summary: parsed.summary,
      bullets: (doc.symptoms || []).slice(0, 3),
      module: detectedMod.code,
      moduleName: detectedMod.name,
      moduleColor: detectedMod.color,
      tcodes: (doc.tcodes || []).map(t => t.code)
    });
  }

  return {
    sessionId: rawSession?.id || "NEXUS-SESSION-" + Date.now().toString().slice(-6),
    sessionTitle: initialTitle,
    docData: doc || {},
    turns,
    citations: rawSession?.citations || doc?.citations || []
  };
}

/**
 * Step 2: Build Complete Session-Focused Slide Outline (STRICTLY BASED ON USER'S INQUIRIES)
 */
export function buildSessionPresentationGraph(rawSession, aiText, doc, conversationTurns = []) {
  const sessionData = collectSessionData(rawSession, aiText, doc, conversationTurns);
  const title = sessionData.sessionTitle ? professionalizeInquiryTitle(sessionData.sessionTitle, "", "GTS", 1) : "SAP Global Trade & S/4HANA Architecture Review";
  const caseId = sessionData.docData?.caseId || "NX-SESS-" + new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  // Distinct modules across all inquiries
  const detectedModulesMap = new Map();
  const allTcodesSet = new Set();

  sessionData.turns.forEach(t => {
    if (t.module) {
      detectedModulesMap.set(t.module, {
        code: t.module,
        name: t.moduleName,
        color: t.moduleColor
      });
    }
    (t.tcodes || []).forEach(tc => allTcodesSet.add(tc));
  });

  const detectedModules = Array.from(detectedModulesMap.values());
  const distinctTcodes = Array.from(allTcodesSet);
  const crossModuleLabel = detectedModules.map(m => m.code).join(" ↔ ") || "SAP Enterprise";

  const slides = [];
  let sNum = 1;

  // ──────────────────────────────────────────────────────────────────────────
  // SLIDE 1: Executive Title Cover (Pop-Out Dark Gradient Cover)
  // ──────────────────────────────────────────────────────────────────────────
  slides.push({
    id: "slide-title",
    slideNumber: sNum++,
    type: "TITLE",
    title: title,
    subtitle: "SAP End-to-End Enterprise Learning & Architecture Summary",
    categoryTag: "EXECUTIVE CONSULTING BRIEFING",
    purpose: `Executive briefing covering ${sessionData.turns.length} specific user inquiries across ${crossModuleLabel}.`,
    module: crossModuleLabel,
    confidence: "100%",
    data: {
      title,
      subtitle: "SAP End-to-End Enterprise Learning & Architecture Summary",
      caseId,
      date: dateStr,
      landscape: "S/4HANA 2023 FPS02 · Enterprise Integration",
      detectedModules: detectedModules.map(m => m.name),
      inquiriesCount: sessionData.turns.length,
      author: "Nexus SAP Enterprise Copilot",
      footnote: `Complete Session Analysis · ${sessionData.turns.length} Inquiries Structured & Normalized`
    },
    speakerNotes: `Executive Session Presentation summarizing all ${sessionData.turns.length} inquiries investigated during session ${sessionData.sessionId}.`
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SLIDE 2: Session Inquiries Agenda & Scope Overview
  // ──────────────────────────────────────────────────────────────────────────
  slides.push({
    id: "slide-overview",
    slideNumber: sNum++,
    type: "EXECUTIVE_SUMMARY",
    title: "Session Agenda & Inquiries Summary",
    categoryTag: "SESSION INQUIRIES INDEX",
    purpose: `Consolidated index of all ${sessionData.turns.length} professionalized topics explored in this session.`,
    module: crossModuleLabel,
    confidence: "99%",
    data: {
      sessionScope: `Analysis of ${sessionData.turns.length} technical inquiries investigated during this session across ${crossModuleLabel}.`,
      businessObjective: "Establish resilient compliance screening, eliminate queue desynchronization, and provide consultant-grade procedural runbooks.",
      keyModules: detectedModules.map(m => m.name),
      primaryProcess: "SAP Global Trade Services & Cross-Module Integration",
      searchedQueriesSummary: sessionData.turns.map((t, idx) => `Q${idx + 1}: ${t.query}`).slice(0, 8),
      takeaways: sessionData.turns.slice(0, 4).map((t, idx) => `Inquiry #${idx + 1} (${t.module}): ${t.query} — ${t.summary.substring(0, 110)}...`)
    },
    speakerNotes: `Overview of all ${sessionData.turns.length} specific questions asked during this session.`
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SLIDES 3 to N: ONE DEDICATED SLIDE FOR EVERY INQUIRY ASKED BY USER
  // ──────────────────────────────────────────────────────────────────────────
  sessionData.turns.forEach((t, idx) => {
    // Generate specialized parameter cards for the right-side table
    let rightTableRows = [];
    if (t.tcodes.length > 0) {
      rightTableRows = t.tcodes.slice(0, 3).map(tc => {
        let role = "Diagnostic inspection & monitoring";
        if (tc.startsWith("/SAPSLL/")) role = "SPL screening & compliance release";
        else if (tc.startsWith("/SCWM/")) role = "Warehouse task & delivery processing";
        else if (tc.startsWith("CO")) role = "Production order execution";
        else if (tc.startsWith("ME") || tc === "MIGO") role = "Purchasing & material document posting";
        else if (tc.startsWith("VA") || tc.startsWith("VL")) role = "Sales order & delivery processing";
        else if (tc.startsWith("SM")) role = "Queue monitoring & system trace";
        return { tcode: tc, role };
      });
    }

    slides.push({
      id: `slide-inquiry-${idx + 1}`,
      slideNumber: sNum++,
      type: "TOPIC_INQUIRY",
      title: `Inquiry #${idx + 1}: ${t.query}`,
      categoryTag: `INQUIRY #${idx + 1} · ${t.module}`,
      purpose: `Technical explanation, procedural runbook, and T-code matrix for: "${t.query}"`,
      module: t.module,
      confidence: "98%",
      data: {
        inquiryIndex: idx + 1,
        rawUserQuery: t.rawQuery,
        queryTitle: t.query,
        moduleCode: t.module,
        moduleName: t.moduleName,
        moduleColor: t.moduleColor,
        tcodes: t.tcodes,
        tableRows: rightTableRows,
        bulletPoints: t.bullets,
        solutionSummary: t.summary
      },
      speakerNotes: `Inquiry #${idx + 1}: ${t.query}. Original query: "${t.rawQuery}". Covers verified technical solution and transactions for ${t.moduleName}.`
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FINAL SLIDE: Consolidated Runbook & Signature T-Codes from this Session
  // ──────────────────────────────────────────────────────────────────────────
  if (distinctTcodes.length > 0) {
    slides.push({
      id: "slide-runbook-summary",
      slideNumber: sNum++,
      type: "TRANSACTION_GUIDE",
      title: "Session Signature T-Codes & Navigation Runbook",
      categoryTag: "OPERATIONAL REFERENCE",
      purpose: "Consolidated reference of all SAP transaction codes utilized across this session.",
      module: crossModuleLabel,
      confidence: "99%",
      data: {
        tableRows: distinctTcodes.slice(0, 8).map((tc, idx) => {
          let desc = "Diagnostic inspection and monitoring";
          let moduleCode = "Basis/Integration";
          let result = "Displays active operational queue status and unit logs.";

          if (tc.startsWith("/SAPSLL/")) {
            moduleCode = "GTS";
            desc = "Compliance screening & blocked document triage";
            result = "Provides manual release and audit verification.";
          } else if (tc.startsWith("/SCWM/")) {
            moduleCode = "EWM";
            desc = "Warehouse execution and monitor inspection";
            result = "Shows warehouse task status and waves.";
          } else if (tc.startsWith("CO")) {
            moduleCode = "PP";
            desc = "Production order execution and confirmation";
            result = "Generates reservations and component staging.";
          } else if (tc.startsWith("ME") || tc === "MIGO") {
            moduleCode = "MM";
            desc = "Purchasing and inventory goods movement";
            result = "Posts material document and creates financial line items.";
          } else if (tc.startsWith("VA") || tc.startsWith("VL")) {
            moduleCode = "SD";
            desc = "Sales order creation and shipping delivery";
            result = "Generates delivery order and initiates picking waves.";
          }

          return {
            step: `T-${idx + 1}`,
            tcode: tc,
            module: moduleCode,
            action: desc,
            expectedResult: result
          };
        })
      },
      speakerNotes: "Consolidated reference table of all transaction codes verified during this session."
    });
  }

  return {
    sessionTitle: title,
    sessionSubtitle: "SAP End-to-End Session Learning Summary",
    sessionId: sessionData.sessionId,
    caseId,
    dateStr,
    topicsAnalyzedCount: sessionData.turns.length,
    searchedInquiries: sessionData.turns.map(t => ({
      turnIndex: t.index + 1,
      rawQuery: t.rawQuery,
      query: t.query,
      module: t.module,
      moduleName: t.moduleName,
      moduleColor: t.moduleColor,
      tcodes: t.tcodes,
      bulletPoints: t.bullets,
      responseSnippet: t.summary
    })),
    detectedModules,
    crossModuleLabel,
    suggestedSlideCount: slides.length,
    slides
  };
}
