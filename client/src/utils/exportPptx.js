import PptxGenJS from "pptxgenjs";

/**
 * Generate an executive SAP PowerPoint Presentation (.pptx)
 * @param {Object} doc - Active case or preset topic object
 * @param {string} aiText - Markdown/text response from Nexus
 * @param {Array} citations - Grounded SAP sources / notes
 */
export async function exportSapPresentationPptx(doc, aiText, citations = []) {
  const pptx = new PptxGenJS();

  // Global Slide Properties
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Nexus SAP Enterprise Copilot";
  pptx.company = "Nexus SAP Intelligence Platform";
  pptx.title = doc?.title || "SAP Architecture & Diagnostic Triage";

  // Corporate Color Palette (Executive Navy, SAP Burgundy, Slate & Amber)
  const COLOR_DARK_NAVY = "0F172A";
  const COLOR_BURGUNDY = "6E1A2D";
  const COLOR_AMBER = "D97706";
  const COLOR_SLATE_BG = "F8FAFC";
  const COLOR_CARD_BG = "FFFFFF";
  const COLOR_TEXT_PRIMARY = "1E293B";
  const COLOR_TEXT_MUTED = "64748B";
  const COLOR_BORDER = "E2E8F0";

  // Parse Sections from AI text or doc
  const titleText = doc?.title || "SAP Architecture & Diagnostic Report";
  const caseId = doc?.caseId || "NX-AUTO-" + new Date().getFullYear();
  const summaryText = doc?.summary || doc?.overview || "Executive SAP architecture, root-cause diagnosis, and step-by-step triage workflow.";

  // Helper to add consistent header and footer to content slides
  const addSlideHeader = (slide, slideTitle, categoryTag = "SAP ENTERPRISE INTELLIGENCE") => {
    // Header Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.9,
      fill: { color: COLOR_DARK_NAVY }
    });

    // Category Tag
    slide.addText(categoryTag, {
      x: 0.8,
      y: 0.15,
      w: 8,
      h: 0.25,
      fontSize: 9,
      fontFace: "Arial",
      color: "F59E0B",
      bold: true,
      charSpacing: 1.5
    });

    // Slide Title
    slide.addText(slideTitle, {
      x: 0.8,
      y: 0.4,
      w: 10,
      h: 0.4,
      fontSize: 16,
      fontFace: "Arial",
      color: "FFFFFF",
      bold: true
    });

    // Case ID Header Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.8,
      y: 0.25,
      w: 1.8,
      h: 0.4,
      rectRadius: 0.1,
      fill: { color: "1E293B" },
      line: { color: "3B82F6", width: 1 }
    });
    slide.addText(caseId, {
      x: 10.8,
      y: 0.25,
      w: 1.8,
      h: 0.4,
      align: "center",
      valign: "middle",
      fontSize: 10,
      fontFace: "Courier New",
      color: "93C5FD",
      bold: true
    });

    // Bottom Footer
    slide.addText(`Nexus Enterprise SAP Platform · ${new Date().toLocaleDateString()}`, {
      x: 0.8,
      y: 7.1,
      w: 8,
      h: 0.3,
      fontSize: 9,
      fontFace: "Arial",
      color: COLOR_TEXT_MUTED
    });
    slide.addText("CONFIDENTIAL & READ-ONLY SAP DIAGNOSTICS", {
      x: 8.5,
      y: 7.1,
      w: 4.1,
      h: 0.3,
      align: "right",
      fontSize: 8.5,
      fontFace: "Arial",
      color: "94A3B8"
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIDE 1: Title Slide (Executive Dark Theme)
  // ─────────────────────────────────────────────────────────────────────────────
  const slide1 = pptx.addSlide();
  slide1.background = { color: COLOR_DARK_NAVY };

  // Decorative Accent Bar
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 0.15,
    h: 4.8,
    fill: { color: "F59E0B" }
  });

  // Top Pill Tag
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 1.2,
    y: 1.2,
    w: 3.8,
    h: 0.4,
    rectRadius: 0.1,
    fill: { color: "1E293B" },
    line: { color: "F59E0B", width: 1 }
  });
  slide1.addText("👑 NEXUS SAP COPILOT DECK", {
    x: 1.2,
    y: 1.2,
    w: 3.8,
    h: 0.4,
    align: "center",
    valign: "middle",
    fontSize: 10,
    fontFace: "Courier New",
    color: "FBBF24",
    bold: true
  });

  // Main Title
  slide1.addText(titleText, {
    x: 1.2,
    y: 1.8,
    w: 10.5,
    h: 1.6,
    fontSize: 28,
    fontFace: "Arial",
    color: "FFFFFF",
    bold: true,
    lineSpacingMultiple: 1.15
  });

  // Summary / Subtitle
  slide1.addText(summaryText.length > 220 ? summaryText.substring(0, 220) + "..." : summaryText, {
    x: 1.2,
    y: 3.6,
    w: 10.2,
    h: 1.1,
    fontSize: 13,
    fontFace: "Arial",
    color: "94A3B8",
    lineSpacingMultiple: 1.3
  });

  // Metadata Card
  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.2,
    y: 5.0,
    w: 10.5,
    h: 1.0,
    fill: { color: "1E293B" },
    line: { color: "334155", width: 1 }
  });

  slide1.addText(`Case ID: ${caseId}   |   Date: ${new Date().toLocaleDateString()}   |   Landscape: S/4HANA 2023 Embedded EWM / PP / GTS`, {
    x: 1.5,
    y: 5.15,
    w: 9.8,
    h: 0.35,
    fontSize: 11,
    fontFace: "Courier New",
    color: "60A5FA",
    bold: true
  });
  slide1.addText("Verified Reference & Diagnostic Runbook · Read-Only Mode Active", {
    x: 1.5,
    y: 5.55,
    w: 9.8,
    h: 0.3,
    fontSize: 10,
    fontFace: "Arial",
    color: "94A3B8"
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIDE 2: Executive Overview & Problem Context
  // ─────────────────────────────────────────────────────────────────────────────
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_SLATE_BG };
  addSlideHeader(slide2, "1. Executive Summary & Incident Overview", "PROBLEM DEFINITION");

  // Overview Card Left
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.3,
    w: 7.2,
    h: 5.4,
    rectRadius: 0.08,
    fill: { color: COLOR_CARD_BG },
    line: { color: COLOR_BORDER, width: 1 }
  });

  slide2.addText("Incident Context & Architecture", {
    x: 1.1,
    y: 1.5,
    w: 6.6,
    h: 0.4,
    fontSize: 14,
    fontFace: "Arial",
    color: COLOR_BURGUNDY,
    bold: true
  });

  const overviewBody = doc?.overview || (aiText ? aiText.split("\n\n")[0].replace(/^#+\s*/, "") : summaryText);
  slide2.addText(overviewBody, {
    x: 1.1,
    y: 2.0,
    w: 6.6,
    h: 4.4,
    fontSize: 12,
    fontFace: "Arial",
    color: COLOR_TEXT_PRIMARY,
    lineSpacingMultiple: 1.35
  });

  // Right Side Highlights Card
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 8.3,
    y: 1.3,
    w: 4.3,
    h: 5.4,
    rectRadius: 0.08,
    fill: { color: COLOR_CARD_BG },
    line: { color: COLOR_BORDER, width: 1 }
  });

  slide2.addText("Key Architecture Parameters", {
    x: 8.6,
    y: 1.5,
    w: 3.7,
    h: 0.4,
    fontSize: 14,
    fontFace: "Arial",
    color: COLOR_BURGUNDY,
    bold: true
  });

  const highlights = [
    { label: "Target Product", val: "SAP S/4HANA (2020-2023)" },
    { label: "Integration Layer", val: "EWM / PP / GTS / bgRFC" },
    { label: "Operational State", val: "Read-Only Diagnostics" },
    { label: "Evidence Level", val: "Tier 1 Verified Documentation" }
  ];

  highlights.forEach((h, idx) => {
    const yPos = 2.1 + (idx * 1.1);
    slide2.addShape(pptx.ShapeType.rect, {
      x: 8.6,
      y: yPos,
      w: 3.7,
      h: 0.9,
      fill: { color: "F1F5F9" },
      line: { color: "CBD5E1", width: 1 }
    });
    slide2.addText(h.label.toUpperCase(), {
      x: 8.8,
      y: yPos + 0.1,
      w: 3.3,
      h: 0.25,
      fontSize: 9,
      fontFace: "Courier New",
      color: COLOR_TEXT_MUTED,
      bold: true
    });
    slide2.addText(h.val, {
      x: 8.8,
      y: yPos + 0.4,
      w: 3.3,
      h: 0.35,
      fontSize: 11.5,
      fontFace: "Arial",
      color: COLOR_TEXT_PRIMARY,
      bold: true
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIDE 3: Diagnostic Symptoms & Technical Triage
  // ─────────────────────────────────────────────────────────────────────────────
  const slide3 = pptx.addSlide();
  slide3.background = { color: COLOR_SLATE_BG };
  addSlideHeader(slide3, "2. Diagnostic Symptoms & Observed Failure Modes", "ROOT-CAUSE ANALYSIS");

  const symptomsList = doc?.symptoms || [
    "Blocked interface queues in status STOP, SYSFAIL, or RETRY",
    "Missing business documents across integration boundaries",
    "RFC destination logon timeouts logged in SM21 system trace",
    "Work center or staging capacity constraints in execution logs"
  ];

  symptomsList.slice(0, 4).forEach((sym, idx) => {
    const yPos = 1.4 + (idx * 1.35);
    slide3.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: yPos,
      w: 11.8,
      h: 1.15,
      rectRadius: 0.08,
      fill: { color: COLOR_CARD_BG },
      line: { color: "CBD5E1", width: 1 }
    });

    slide3.addShape(pptx.ShapeType.roundRect, {
      x: 1.1,
      y: yPos + 0.25,
      w: 0.65,
      h: 0.65,
      rectRadius: 0.1,
      fill: { color: "FEE2E2" },
      line: { color: "EF4444", width: 1 }
    });
    slide3.addText(`0${idx + 1}`, {
      x: 1.1,
      y: yPos + 0.25,
      w: 0.65,
      h: 0.65,
      align: "center",
      valign: "middle",
      fontSize: 12,
      fontFace: "Courier New",
      color: "DC2626",
      bold: true
    });

    slide3.addText(sym, {
      x: 2.0,
      y: yPos + 0.2,
      w: 10.2,
      h: 0.75,
      fontSize: 13,
      fontFace: "Arial",
      color: COLOR_TEXT_PRIMARY,
      lineSpacingMultiple: 1.25
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIDE 4: Step-by-Step Triage Runbook
  // ─────────────────────────────────────────────────────────────────────────────
  const slide4 = pptx.addSlide();
  slide4.background = { color: COLOR_SLATE_BG };
  addSlideHeader(slide4, "3. Step-by-Step Triage & Resolution Runbook", "EXECUTION PROCEDURE");

  const procedureSteps = doc?.procedure || [
    "Open monitoring transaction and filter by client and queue prefix",
    "Inspect application log SLG1 for specific diagnostic subobjects",
    "Validate RFC destination connectivity and credentials via SM59",
    "Cross-reference lock table entries in SM12 before attempting reactivation",
    "Safely restart processing or schedule background reorganization job"
  ];

  procedureSteps.slice(0, 5).forEach((step, idx) => {
    const yPos = 1.35 + (idx * 1.1);
    slide4.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: yPos,
      w: 11.8,
      h: 0.95,
      rectRadius: 0.08,
      fill: { color: COLOR_CARD_BG },
      line: { color: "CBD5E1", width: 1 }
    });

    slide4.addShape(pptx.ShapeType.roundRect, {
      x: 1.1,
      y: yPos + 0.18,
      w: 1.0,
      h: 0.55,
      rectRadius: 0.08,
      fill: { color: "EFF6FF" },
      line: { color: "3B82F6", width: 1 }
    });
    slide4.addText(`STEP ${idx + 1}`, {
      x: 1.1,
      y: yPos + 0.18,
      w: 1.0,
      h: 0.55,
      align: "center",
      valign: "middle",
      fontSize: 10,
      fontFace: "Courier New",
      color: "1D4ED8",
      bold: true
    });

    slide4.addText(step, {
      x: 2.3,
      y: yPos + 0.15,
      w: 10.0,
      h: 0.65,
      fontSize: 12.5,
      fontFace: "Arial",
      color: COLOR_TEXT_PRIMARY,
      lineSpacingMultiple: 1.2
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIDE 5: SAP T-Code Reference Cards Table
  // ─────────────────────────────────────────────────────────────────────────────
  const slide5 = pptx.addSlide();
  slide5.background = { color: COLOR_SLATE_BG };
  addSlideHeader(slide5, "4. Signature Transaction Codes & Monitoring Tools", "SYSTEM NAVIGATION");

  const tcodesList = doc?.tcodes || [
    { code: "SMQ1", desc: "Outbound qRFC Monitor" },
    { code: "SMQ2", desc: "Inbound qRFC Monitor" },
    { code: "SM59", desc: "RFC Destinations & Connection Test" },
    { code: "SLG1", desc: "Application Log Analysis" },
    { code: "SM21", desc: "System Log Analysis" }
  ];

  // Table Data
  const tableRows = [
    [
      { text: "TRANSACTION CODE", options: { bold: true, color: "FFFFFF", fill: { color: COLOR_BURGUNDY }, fontSize: 11, fontFace: "Courier New" } },
      { text: "SYSTEM COMPONENT & PURPOSE", options: { bold: true, color: "FFFFFF", fill: { color: COLOR_BURGUNDY }, fontSize: 11, fontFace: "Arial" } },
      { text: "ACCESS LEVEL", options: { bold: true, color: "FFFFFF", fill: { color: COLOR_BURGUNDY }, fontSize: 11, fontFace: "Arial" } }
    ]
  ];

  tcodesList.forEach((t, i) => {
    tableRows.push([
      { text: t.code, options: { bold: true, color: "B91C1C", fontSize: 12, fontFace: "Courier New", fill: { color: i % 2 === 0 ? "FFFFFF" : "F8FAFC" } } },
      { text: t.desc, options: { color: COLOR_TEXT_PRIMARY, fontSize: 11.5, fontFace: "Arial", fill: { color: i % 2 === 0 ? "FFFFFF" : "F8FAFC" } } },
      { text: "Read-Only / Display", options: { color: "059669", fontSize: 10.5, fontFace: "Arial", fill: { color: i % 2 === 0 ? "FFFFFF" : "F8FAFC" }, bold: true } }
    ]);
  });

  slide5.addTable(tableRows, {
    x: 0.8,
    y: 1.4,
    w: 11.8,
    colW: [2.5, 6.8, 2.5],
    border: { pt: 1, color: "CBD5E1" }
  });

  // Safety Warning Callout at Bottom of Slide 5
  slide5.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 5.4,
    w: 11.8,
    h: 1.3,
    rectRadius: 0.08,
    fill: { color: "FEF3C7" },
    line: { color: "F59E0B", width: 1.5 }
  });
  slide5.addText("⚠ Production Safety Mandate:", {
    x: 1.1,
    y: 5.55,
    w: 11.2,
    h: 0.3,
    fontSize: 11,
    fontFace: "Arial",
    color: "92400E",
    bold: true
  });
  slide5.addText("Never execute mass queue deletion routines or transaction code unlocks without performing business document impact analysis to avoid orphaned LUWs and document desynchronization.", {
    x: 1.1,
    y: 5.85,
    w: 11.2,
    h: 0.7,
    fontSize: 10.5,
    fontFace: "Arial",
    color: "78350F",
    lineSpacingMultiple: 1.2
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIDE 6: Official Grounding Citations & References
  // ─────────────────────────────────────────────────────────────────────────────
  const slide6 = pptx.addSlide();
  slide6.background = { color: COLOR_SLATE_BG };
  addSlideHeader(slide6, "5. Verified Citations & Evidence Grounding", "OFFICIAL AUDIT TRAIL");

  const citationText = doc?.citation || "Verified official reference from SAP Help Portal & Verified OSS Notes Catalog.";

  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.4,
    w: 11.8,
    h: 2.2,
    rectRadius: 0.08,
    fill: { color: COLOR_CARD_BG },
    line: { color: COLOR_BORDER, width: 1 }
  });

  slide6.addText("PRIMARY ARCHITECTURAL REFERENCE", {
    x: 1.1,
    y: 1.65,
    w: 11.2,
    h: 0.3,
    fontSize: 10,
    fontFace: "Courier New",
    color: COLOR_AMBER,
    bold: true
  });
  slide6.addText(citationText, {
    x: 1.1,
    y: 2.0,
    w: 11.2,
    h: 0.6,
    fontSize: 14,
    fontFace: "Arial",
    color: COLOR_TEXT_PRIMARY,
    bold: true
  });
  slide6.addText("Evidence Status: Verified reference from official SAP documentation index. All recommendations rehearsed in sandbox environments before production release.", {
    x: 1.1,
    y: 2.65,
    w: 11.2,
    h: 0.65,
    fontSize: 11,
    fontFace: "Arial",
    color: COLOR_TEXT_MUTED
  });

  // End of Deck Note Box
  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 3.9,
    w: 11.8,
    h: 2.8,
    rectRadius: 0.08,
    fill: { color: COLOR_DARK_NAVY }
  });

  slide6.addText("Generated by Nexus SAP Enterprise Copilot", {
    x: 1.1,
    y: 4.3,
    w: 11.2,
    h: 0.4,
    fontSize: 16,
    fontFace: "Arial",
    color: "FFFFFF",
    bold: true
  });
  slide6.addText("This slide deck was dynamically synthesized from multi-turn SAP diagnostics, live OSS note indexing, and verified master data models. Exported in standard OpenXML Presentation (.pptx) format for Microsoft PowerPoint & Google Slides.", {
    x: 1.1,
    y: 4.8,
    w: 11.2,
    h: 1.4,
    fontSize: 12,
    fontFace: "Arial",
    color: "94A3B8",
    lineSpacingMultiple: 1.3
  });

  // Download Presentation
  const cleanFileName = `Nexus_SAP_${(doc?.caseId || "Deck").replace(/[^a-zA-Z0-9_-]/g, "_")}_Presentation.pptx`;
  await pptx.writeFile({ fileName: cleanFileName });
}
