import React, { useState, useEffect } from "react";

// Preset enterprise SAP screen archetypes
const PRESET_SCENARIOS = {
  zinsp_gate: {
    id: "zinsp_gate",
    tcode: "ZINSP_GATE",
    title: "Inbound Delivery Quality Gate Inspection & Goods Receipt",
    module: "LE-SHP / QM / MM",
    standardTcode: "VL02N / MIGO / QA32",
    prompt: "Create a custom SAP GUI transaction screen for Inbound Delivery Gate Inspection with barcode scanning, batch determination, storage bin confirmation, defect recording, and posting Goods Receipt directly to MIGO.",
    thinking: {
      processLogic: "Autonomous orchestration of gate inspection preceding warehouse putaway. Replaces fragmented multi-step navigation (VL03N -> QA32 -> MIGO) with a consolidated, high-throughput Dynpro cockpit. Automatically triggers BAPI_GOODSMVT_CREATE upon zero-defect sign-off and synchronizes decentralized EWM queues.",
      ddicTables: [
        { table: "LIKP", desc: "SD Delivery Header (Delivery Number, Vendor, Delivery Date, Gross Wt)" },
        { table: "LIPS", desc: "SD Delivery Items (Material, Quantity, Plant, Storage Location, Batch)" },
        { table: "MARA", desc: "General Material Data (Base UoM, Material Type, Serial Number Profile)" },
        { table: "MCHA", desc: "Batches (Batch Number, Expiration Date, Valuation Type)" },
        { table: "QALS", desc: "Inspection Lot Record (Lot Number, Inspection Type, System Status)" },
        { table: "LAGP", desc: "Storage Bins (Warehouse Number, Storage Type, Storage Bin Coordinate)" }
      ],
      topology: "Dynpro 0100 with Subscreen 0110 (Delivery Header & Gate Parameters), Subscreen 0120 (ALV Grid for Delivery Items with Quality Status), and Tabstrip TAB_DETAILS (Batch Valuation, Storage Bins, Defect Catalog).",
      paiPbo: "PBO: MODULE status_0100 (Sets PF-Status 'ZINSP_0100' with custom buttons F5 Post GR, F6 Scan Barcode, F7 Hold Lot). PAI: FIELD z_deliv_no MODULE validate_delivery ON INPUT. USER_COMMAND_0100 evaluates sy-ucomm."
    },
    interviewQuestions: [
      {
        id: "topology",
        question: "1. Preferred Screen Topology & Architecture",
        options: [
          { id: "dynpro_tabstrip", label: "Dynpro 0100 with Header Subscreen & Tabstrip ALV Grid", desc: "Recommended for high-volume warehouse gate terminals" },
          { id: "split_dock", label: "Master-Detail Split Screen with Docking Container", desc: "Left tree view of deliveries, right detail container" },
          { id: "selection_1000", label: "Classic Selection Screen (1000) with Radio Blocks", desc: "Lightweight batch processor style" }
        ],
        selected: "dynpro_tabstrip"
      },
      {
        id: "commitMode",
        question: "2. Goods Receipt Posting & Commit Mode",
        options: [
          { id: "sync_bapi", label: "Synchronous BAPI Commit (BAPI_GOODSMVT_CREATE)", desc: "Immediate document posting with instant material document display" },
          { id: "two_step", label: "Two-Step Draft Parking with Supervisor Release", desc: "Requires Quality Lead authorization before accounting impact" },
          { id: "bg_rfc", label: "Asynchronous RFC Queue (SMQ1 / bgRFC)", desc: "High throughput decoupled posting for automated conveyor belts" }
        ],
        selected: "sync_bapi"
      },
      {
        id: "gridDensity",
        question: "3. ALV Grid Data Density & Status Signals",
        options: [
          { id: "traffic_lights", label: "Full ALV Grid with Traffic Light Status (🟢 🟡 🔴) & Cell Editing", desc: "Optimal for inspection discrepancy reviews" },
          { id: "compact_rf", label: "Touch / RF Barcode Optimized Large Input Buttons", desc: "For ruggedized forklift terminals and handheld scanners" }
        ],
        selected: "traffic_lights"
      },
      {
        id: "authChecks",
        question: "4. Authorization & Safeguard Checks",
        options: [
          { id: "strict_auth", label: "Strict Plant Authorization (M_MATE_WRK) & Delivery Lock (ENQUEUE)", desc: "Prevents concurrent editing and cross-facility postings" },
          { id: "audit_trail", label: "Open Simulation Mode with Read-Only Shadow Logging", desc: "For training scenarios and sandbox rehearsal" }
        ],
        selected: "strict_auth"
      }
    ],
    headerFields: [
      { id: "deliv_no", label: "Inbound Delivery", value: "80004123", required: true, hasF4: true, type: "input", ddic: "LIKP-VBELN" },
      { id: "plant", label: "Plant / Storage Loc", value: "1010 / 0001", required: true, hasF4: true, type: "input", ddic: "LIPS-WERKS" },
      { id: "vendor", label: "Vendor / Carrier", value: "100042 (Apex Logistics Corp)", required: false, hasF4: false, type: "readonly", ddic: "LIKP-LIFNR" },
      { id: "doc_date", label: "Delivery Date", value: "2026-11-06", required: false, hasF4: true, type: "date", ddic: "LIKP-BLDAT" },
      { id: "gate_status", label: "Gate Inspection State", value: "INSPECTION ACTIVE", required: false, hasF4: false, type: "badge", badgeColor: "#10B981" }
    ],
    tabs: [
      { id: "items", label: "Delivery Items (ALV Grid)", count: 4 },
      { id: "batch", label: "Batch & Quality Valuation", count: 2 },
      { id: "bins", label: "Storage Bins & Putaway", count: 3 },
      { id: "audit", label: "System Messages & Logs", count: 1 }
    ],
    gridColumns: [
      { id: "status", label: "Status", width: 60, align: "center" },
      { id: "posnr", label: "Item", width: 60, align: "right" },
      { id: "matnr", label: "Material Number", width: 130, align: "left" },
      { id: "maktx", label: "Description", width: 220, align: "left" },
      { id: "lfimg", label: "Deliv Qty", width: 90, align: "right" },
      { id: "insp_qty", label: "Insp Qty", width: 90, align: "right", editable: true },
      { id: "meins", label: "UoM", width: 60, align: "center" },
      { id: "charg", label: "Batch", width: 100, align: "left", hasF4: true },
      { id: "lgpla", label: "Target Bin", width: 100, align: "left", hasF4: true },
      { id: "lot", label: "Inspection Lot", width: 110, align: "center" }
    ],
    gridRows: [
      { status: "green", posnr: "000010", matnr: "MAT-HYD-5020", maktx: "Hydraulic Actuator Cyl 500bar", lfimg: "120.000", insp_qty: "120.000", meins: "PC", charg: "B-202611-A", lgpla: "BIN-04-12-A", lot: "0100004928" },
      { status: "green", posnr: "000020", matnr: "MAT-VALV-100", maktx: "Servo Pressure Relief Valve", lfimg: "50.000", insp_qty: "50.000", meins: "PC", charg: "B-202611-A", lgpla: "BIN-04-14-C", lot: "0100004929" },
      { status: "yellow", posnr: "000030", matnr: "MAT-SEAL-882", maktx: "FKM High-Temp O-Ring Set", lfimg: "300.000", insp_qty: "298.000", meins: "EA", charg: "B-202611-B", lgpla: "BIN-02-05-B", lot: "0100004930" },
      { status: "green", posnr: "000040", matnr: "MAT-FLUID-90", maktx: "Synthetic ISO VG 46 Fluid 200L", lfimg: "10.000", insp_qty: "10.000", meins: "DR", charg: "B-202611-C", lgpla: "BIN-CHEM-01", lot: "0100004931" }
    ],
    statusBar: {
      type: "S",
      text: "Delivery 80004123 verified successfully. All line items cleared for MIGO Goods Receipt.",
      system: "S4P(1)/100",
      program: "SAPMZINSP_GATE",
      dynpro: "0100"
    }
  },

  zatp_sim: {
    id: "zatp_sim",
    tcode: "ZATP_SIM",
    title: "S/4HANA aATP Real-Time Simulation & Schedule Line Override",
    module: "SD-BF-ATP / aATP",
    standardTcode: "VA02 / CO09 / PAC_SIM",
    prompt: "Design a custom S/4HANA ATP Simulation Cockpit allowing sales specialists to simulate Available-to-Promise confirmations against live stock, check TOR scope of check (OVZ9), view alternative plants, and perform manual schedule line overrides with reason codes.",
    thinking: {
      processLogic: "Advanced ATP (aATP) Product Availability Check cockpit. Enables deep visibility into ATP Category stock/requirements (VBBE/VBBS vs S/4HANA live CDS views). Allows simulation of PAC (Product Availability Check), Alternative-Based Confirmation (ABC), and Product Allocation (PAL) prior to sales order commitment.",
      ddicTables: [
        { table: "VBAK", desc: "Sales Document Header (Sales Org, Dist Channel, Division, Sold-To)" },
        { table: "VBAP", desc: "Sales Document Item (Material, Plant, Net Price, Target Qty)" },
        { table: "VBEP", desc: "Schedule Lines (Delivery Date, Confirmed Qty, Order Qty, Item)" },
        { table: "MARC", desc: "Plant Data for Material (Checking Group MTVFP, ABC Indicator, MRP Profile)" },
        { table: "T441V", desc: "ATP Checking Rules & Rule Controls (OVZ9 configuration mapping)" }
      ],
      topology: "Dynpro 0200 with Top Filter Bar (Material, Checking Rule, Plant List), Middle Stock-Requirement ALV Matrix, and Bottom Schedule Line Override & Reason Code Subscreen.",
      paiPbo: "PBO: MODULE init_atp_view. BAPI_MATERIAL_AVAILABILITY called in test mode without database commit. PAI: USER_COMMAND_0200 processes 'SIMULATE', 'CONFIRM_OVERRIDE', 'RELEASE_LOCK'."
    },
    interviewQuestions: [
      {
        id: "topology",
        question: "1. Preferred Screen Topology & Architecture",
        options: [
          { id: "dynpro_tabstrip", label: "Dynpro 0200 with Live Simulation Matrix & Override Subscreen", desc: "Recommended for sales operations teams" },
          { id: "split_dock", label: "Dual-Pane Split Screen (Tree of Sales Orders + Stock Matrix)", desc: "For order backlog triage" }
        ],
        selected: "dynpro_tabstrip"
      },
      {
        id: "commitMode",
        question: "2. Schedule Line Override Persistence",
        options: [
          { id: "sync_bapi", label: "BAPI_SALESORDER_CHANGE with Immediate Schedule Line Lock", desc: "Direct database update with change history" },
          { id: "two_step", label: "Pending Approval Queue with Margin Impact Score", desc: "Requires Sales Director sign-off if confirmed date slips" }
        ],
        selected: "sync_bapi"
      },
      {
        id: "gridDensity",
        question: "3. ATP Requirement Category Detail",
        options: [
          { id: "traffic_lights", label: "Detailed ALV with ATP Elements (Stock, POs, Prod Orders, Sales Orders)", desc: "Full CO09 standard alignment" },
          { id: "compact_rf", label: "Executive Summary Level (Available Qty by Plant only)", desc: "High-level summary view" }
        ],
        selected: "traffic_lights"
      },
      {
        id: "authChecks",
        question: "4. Authorization & Safeguard Checks",
        options: [
          { id: "strict_auth", label: "Check V_VBAK_VKO (Sales Area) & Authorization for Manual Confirmation", desc: "Standard SAP compliance" }
        ],
        selected: "strict_auth"
      }
    ],
    headerFields: [
      { id: "matnr", label: "Material Number", value: "MAT-DRIVE-750", required: true, hasF4: true, type: "input", ddic: "MARA-MATNR" },
      { id: "werks", label: "Base Plant", value: "1010 (Hamburg)", required: true, hasF4: true, type: "input", ddic: "MARC-WERKS" },
      { id: "rule", label: "Checking Rule", value: "A (SD Sales Order)", required: true, hasF4: true, type: "input", ddic: "T441V-PRREG" },
      { id: "req_qty", label: "Requested Qty", value: "250 PC", required: true, hasF4: false, type: "input", ddic: "VBAP-KWMENG" },
      { id: "atp_status", label: "Confirmation Status", value: "PARTIAL CONFIRMATION (180/250)", required: false, hasF4: false, type: "badge", badgeColor: "#D97706" }
    ],
    tabs: [
      { id: "pegging", label: "Stock / Requirement Pegging ALV", count: 5 },
      { id: "plants", label: "Alternative Plant Availability (ABC)", count: 3 },
      { id: "override", label: "Manual Override & Reason Codes", count: 1 }
    ],
    gridColumns: [
      { id: "status", label: "Status", width: 60, align: "center" },
      { id: "date", label: "Req Date", width: 100, align: "center" },
      { id: "cat", label: "ATP Cat", width: 90, align: "left" },
      { id: "doc", label: "Document Ref", width: 130, align: "left" },
      { id: "in_qty", label: "Receipt Qty", width: 100, align: "right" },
      { id: "out_qty", label: "Issue Qty", width: 100, align: "right" },
      { id: "conf_qty", label: "Confirmed Qty", width: 110, align: "right", editable: true },
      { id: "cum_atp", label: "Cumul. ATP", width: 110, align: "right" }
    ],
    gridRows: [
      { status: "green", date: "2026-11-06", cat: "Stock", doc: "Unrestricted", in_qty: "100.000", out_qty: "0.000", conf_qty: "100.000", cum_atp: "100.000" },
      { status: "green", date: "2026-11-08", cat: "PO-Item", doc: "PO 4500019280", in_qty: "80.000", out_qty: "0.000", conf_qty: "80.000", cum_atp: "180.000" },
      { status: "yellow", date: "2026-11-12", cat: "PrdOrd", doc: "PROD 10008492", in_qty: "150.000", out_qty: "0.000", conf_qty: "70.000", cum_atp: "250.000" },
      { status: "yellow", date: "2026-11-15", cat: "OrdRes", doc: "SO 12004", in_qty: "0.000", out_qty: "70.000", conf_qty: "0.000", cum_atp: "180.000" }
    ],
    statusBar: {
      type: "W",
      text: "ATP Warning: Requested 250 PC not immediately available. Alternative Plant 1020 has 120 PC available.",
      system: "S4P(1)/100",
      program: "SAPMZATP_SIM",
      dynpro: "0200"
    }
  },

  zmm_po_apprv: {
    id: "zmm_po_apprv",
    tcode: "ZMM_PO_APPRV",
    title: "Multi-Level Purchase Order Release & Governance Cockpit",
    module: "MM-PUR / Workflow",
    standardTcode: "ME28 / ME29N / SWI5",
    prompt: "Create an executive procurement approval screen for Purchase Orders exceeding $100k, with budget consumption gauges, vendor risk index, line item price variance flags, and dual-authorization digital signature.",
    thinking: {
      processLogic: "Centralized release strategy cockpit replacing standard ME28. Integrates MM Release Group/Codes with real-time FI-CO budget validation (FM / Cost Center availability check) and vendor compliance screening.",
      ddicTables: [
        { table: "EKKO", desc: "Purchasing Document Header (Doc Number, Vendor, Release Status, Net Value)" },
        { table: "EKPO", desc: "Purchasing Document Item (Material, Net Price, Account Assignment)" },
        { table: "EKKN", desc: "Account Assignment - Cost Center / WBS Element / GL Account" },
        { table: "FMFINVE", desc: "Funds Management Budget Commitment Records" }
      ],
      topology: "Dynpro 0300 with Header Approval Metrics (Budget, Risk, Total Value), Split Subscreen for Items and Release Matrix.",
      paiPbo: "PBO: MODULE setup_release_matrix. PAI: Calls BAPI_PO_RELEASE with digital signature cryptographic token."
    },
    interviewQuestions: [
      {
        id: "topology",
        question: "1. Preferred Screen Topology & Architecture",
        options: [
          { id: "dynpro_tabstrip", label: "Dynpro 0300 with Approval Cards & ALV Item Review", desc: "Standard executive workflow layout" }
        ],
        selected: "dynpro_tabstrip"
      },
      {
        id: "commitMode",
        question: "2. Signature & Approval Enforcement",
        options: [
          { id: "sync_bapi", label: "Instant BAPI_PO_RELEASE with Two-Factor Token Hash", desc: "Audited financial compliance" }
        ],
        selected: "sync_bapi"
      },
      {
        id: "gridDensity",
        question: "3. Line Item Breakdown",
        options: [
          { id: "traffic_lights", label: "Detailed ALV with Budget Consumption & Variance Flags", desc: "Recommended" }
        ],
        selected: "traffic_lights"
      },
      {
        id: "authChecks",
        question: "4. Authorization & Safeguard Checks",
        options: [
          { id: "strict_auth", label: "Enforce M_EINK_FRG (Release Code) & Cost Center Authorization", desc: "Strict SOX compliance" }
        ],
        selected: "strict_auth"
      }
    ],
    headerFields: [
      { id: "ebeln", label: "Purchase Order", value: "4500092811", required: true, hasF4: true, type: "input", ddic: "EKKO-EBELN" },
      { id: "vendor", label: "Supplier", value: "V-99210 (Siemens Industrial Solutions)", required: false, hasF4: false, type: "readonly", ddic: "EKKO-LIFNR" },
      { id: "val", label: "Total Net Value", value: "$184,500.00 USD", required: false, hasF4: false, type: "readonly", ddic: "EKKO-RLWRT" },
      { id: "rel_group", label: "Release Group / Code", value: "PO / L3 (VP Approval)", required: true, hasF4: true, type: "input", ddic: "EKKO-FRGGR" },
      { id: "budget_state", label: "Cost Center Budget", value: "WITHIN BUDGET (82% ALLOCATED)", required: false, hasF4: false, type: "badge", badgeColor: "#10B981" }
    ],
    tabs: [
      { id: "items", label: "PO Line Items & Cost Centers", count: 3 },
      { id: "matrix", label: "Approval Sign-off Matrix", count: 2 },
      { id: "history", label: "Audit & Price Variance History", count: 4 }
    ],
    gridColumns: [
      { id: "status", label: "Status", width: 60, align: "center" },
      { id: "ebelp", label: "Item", width: 60, align: "right" },
      { id: "txz01", label: "Short Text", width: 240, align: "left" },
      { id: "menge", label: "PO Qty", width: 90, align: "right" },
      { id: "netpr", label: "Net Price", width: 110, align: "right" },
      { id: "peinh", label: "Per", width: 60, align: "center" },
      { id: "kostl", label: "Cost Center", width: 110, align: "left" },
      { id: "variance", label: "Variance vs Last PO", width: 140, align: "center" }
    ],
    gridRows: [
      { status: "green", ebelp: "00010", txz01: "High-Performance Variable Speed Drive 150kW", menge: "2.000", netpr: "42,000.00", peinh: "1", kostl: "CC-PROD-01", variance: "0.0% (Matched Contract)" },
      { status: "green", ebelp: "00020", txz01: "Control Cabinet Retrofit Assembly", menge: "4.000", netpr: "18,500.00", peinh: "1", kostl: "CC-PROD-01", variance: "+1.2% (Indexed Raw Mat)" },
      { status: "yellow", ebelp: "00030", txz01: "Commissioning & Safety Compliance Engineering", menge: "80.000", netpr: "330.00", peinh: "1", kostl: "CC-ENG-04", variance: "+4.8% (Rate Card Review)" }
    ],
    statusBar: {
      type: "S",
      text: "PO 4500092811 ready for Level-3 Release. All budget checks and vendor certifications valid.",
      system: "S4P(1)/100",
      program: "SAPMZMM_PO_APPRV",
      dynpro: "0300"
    }
  }
};

export default function SapScreenDesigner({ onNavigate }) {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("zinsp_gate");
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("screen"); // "screen" | "logic" | "ddic" | "abap"
  const [guiTheme, setGuiTheme] = useState("claude_pure"); // "claude_pure" | "quartz_light" | "belize_blue"
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(4);
  const [thinkingCollapsed, setThinkingCollapsed] = useState(false);
  const [f4ModalOpen, setF4ModalOpen] = useState(null);
  const [searchHelpText, setSearchHelpText] = useState("");
  const [copiedNotification, setCopiedNotification] = useState(null);

  const scenario = PRESET_SCENARIOS[selectedScenarioKey] || PRESET_SCENARIOS.zinsp_gate;
  const [interviewState, setInterviewState] = useState(scenario.interviewQuestions);

  useEffect(() => {
    setInterviewState(scenario.interviewQuestions);
  }, [selectedScenarioKey]);

  const handleSelectScenario = (key) => {
    setSelectedScenarioKey(key);
    setIsThinking(true);
    setThinkingStep(1);
    setThinkingCollapsed(false);

    // Simulate animated thinking progression
    setTimeout(() => setThinkingStep(2), 400);
    setTimeout(() => setThinkingStep(3), 800);
    setTimeout(() => {
      setThinkingStep(4);
      setIsThinking(false);
    }, 1200);
  };

  const handleCustomPromptSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setIsThinking(true);
    setThinkingStep(1);
    setThinkingCollapsed(false);

    setTimeout(() => setThinkingStep(2), 500);
    setTimeout(() => setThinkingStep(3), 900);
    setTimeout(() => {
      setThinkingStep(4);
      setIsThinking(false);
      // If prompt matches keywords, switch to relevant scenario
      if (/atp|stock|schedule|vov6|tor/i.test(customPrompt)) {
        setSelectedScenarioKey("zatp_sim");
      } else if (/po|purchase|release|approval|migo/i.test(customPrompt)) {
        setSelectedScenarioKey("zmm_po_apprv");
      } else {
        setSelectedScenarioKey("zinsp_gate");
      }
    }, 1400);
  };

  const handleQuestionSelect = (qId, optionId) => {
    setInterviewState(prev => prev.map(q => q.id === qId ? { ...q, selected: optionId } : q));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2400);
  };

  // Color variables depending on GUI theme
  const isClaude = guiTheme === "claude_pure";
  const isQuartz = guiTheme === "quartz_light";

  const themeStyles = {
    windowBg: isClaude ? "#FAF9F5" : (isQuartz ? "#ECEFF4" : "#EBF0F5"),
    headerBarBg: isClaude
      ? "linear-gradient(90deg, #FAF9F5 0%, #F5F1EB 100%)"
      : (isQuartz ? "linear-gradient(90deg, #2D3A4B 0%, #3B4B61 100%)" : "linear-gradient(90deg, #0A6ED1 0%, #004085 100%)"),
    headerBarText: isClaude ? "#1C1917" : "#FFFFFF",
    headerBadgeBg: isClaude ? "rgba(212, 98, 43, 0.12)" : "rgba(255,255,255,0.2)",
    headerBadgeText: isClaude ? "#D4622B" : "#FFFFFF",
    menuBarBg: isClaude ? "#FAF9F5" : (isQuartz ? "#F4F6F9" : "#E2E8F0"),
    standardToolbarBg: "#FFFFFF",
    dynproBg: isClaude ? "#FAF9F5" : (isQuartz ? "#F8FAFC" : "#FFFFFF"),
    frameBorder: isClaude ? "#E5E5DF" : (isQuartz ? "#CBD5E1" : "#B0C4DE"),
    cardSurface: "#FFFFFF",
    inputBg: "#FFFFFF",
    inputBorder: isClaude ? "#E5E5DF" : (isQuartz ? "#CBD5E1" : "#A0AEC0"),
    textPrimary: isClaude ? "#1C1917" : "#1E293B",
    textMuted: isClaude ? "#78716C" : "#64748B",
    tableHeaderBg: isClaude ? "#F5F1EB" : (isQuartz ? "#E2E8F0" : "#E6F0FA"),
    tableRowEven: "#FFFFFF",
    tableRowOdd: isClaude ? "#FAF9F5" : (isQuartz ? "#F8FAFC" : "#F1F6FB"),
    tableRowHover: isClaude ? "rgba(212, 98, 43, 0.08)" : "rgba(10, 110, 209, 0.12)",
    statusBarBg: isClaude ? "#F5F1EB" : (isQuartz ? "#E2E8F0" : "#DDE6EE"),
    statusBarText: isClaude ? "#44403C" : "#334155"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", background: "var(--bg-main, #F5F1EB)", fontFamily: "var(--font-sans)" }}>
      {/* Top Studio Nav Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "var(--bg-card, #FFFFFF)",
          borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.1))",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("workspace")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              cursor: "pointer"
            }}
          >
            <span>&larr;</span>
            <span>Back to Workspace</span>
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🖥️</span>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Enterprise Screen & Form Designer Studio
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "rgba(212, 98, 43, 0.1)",
                  color: "#D4622B",
                  fontWeight: 700
                }}
              >
                {scenario.tcode}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-muted)" }}>
              Autonomous Dynpro Architecture, Interactive Requirement Interview & Enterprise Visualizer
            </p>
          </div>
        </div>

        {/* GUI Theme Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Screen Aesthetic:</span>
          {[
            { id: "claude_pure", label: "🌾 Claude 3.7 Clean Light", desc: "Pure White & Terracotta" },
            { id: "quartz_light", label: "☀️ Enterprise Quartz", desc: "Classic White/Grey" },
            { id: "belize_blue", label: "🏢 Enterprise Belize", desc: "Enterprise Standard" }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setGuiTheme(t.id)}
              style={{
                padding: "5px 10px",
                borderRadius: 5,
                border: guiTheme === t.id ? "1.5px solid #D4622B" : "1px solid var(--border-subtle)",
                background: guiTheme === t.id ? "rgba(212, 98, 43, 0.08)" : "var(--bg-surface)",
                color: guiTheme === t.id ? "#D4622B" : "var(--text-primary)",
                fontSize: 11.5,
                fontWeight: guiTheme === t.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Side: Prompt Engine, Thinking HUD & Clarifying Interview */}
        <div
          style={{
            width: 440,
            borderRight: "1px solid var(--border-subtle, rgba(0,0,0,0.1))",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-surface, #EDE8E0)",
            overflowY: "auto",
            flexShrink: 0
          }}
        >
          {/* Section A: Scenario Launcher & Prompt Box */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>1. Enterprise Process Prompt & Archetypes</span>
              <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Enterprise 2026</span>
            </div>

            {/* Quick 1-Click Scenario Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {Object.values(PRESET_SCENARIOS).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectScenario(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: selectedScenarioKey === p.id ? "1.5px solid #D4622B" : "1px solid var(--border-subtle)",
                    background: selectedScenarioKey === p.id ? "rgba(212, 98, 43, 0.08)" : "var(--bg-surface)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedScenarioKey === p.id ? "#D4622B" : "var(--text-primary)" }}>
                      {p.tcode}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "1px 5px", borderRadius: 3, background: "rgba(0,0,0,0.06)", color: "var(--text-muted)" }}>
                    {p.module}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Prompt Input */}
            <form onSubmit={handleCustomPromptSubmit}>
              <div style={{ position: "relative" }}>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Or describe custom enterprise transaction requirements (e.g. 'Scrap return cockpit with batch splitting & cost center assignment')..."
                  rows={2}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border-strong, rgba(0,0,0,0.18))",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-sans)",
                    resize: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={!customPrompt.trim() || isThinking}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "7px 12px",
                    background: "linear-gradient(135deg, #D4622B 0%, #B84D19 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: customPrompt.trim() ? "pointer" : "default",
                    opacity: customPrompt.trim() ? 1 : 0.6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <span>⚡</span>
                  <span>Enterprise Synthesize Screen</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Nexus Thinking HUD (Animated Reasoning Engine) */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
            <div
              onClick={() => setThinkingCollapsed(prev => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                marginBottom: 8
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                  2. Nexus Process Thinking
                </span>
                {isThinking && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.15)",
                      color: "#059669",
                      fontWeight: 700,
                      animation: "nexusPulse 1s infinite"
                    }}
                  >
                    REASONING...
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {thinkingCollapsed ? "Show +" : "Hide -"}
              </span>
            </div>

            {!thinkingCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5 }}>
                {/* Step 1: Process Logic */}
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: thinkingStep >= 1 ? "var(--bg-surface)" : "transparent",
                    borderLeft: `3px solid ${thinkingStep >= 1 ? "#10B981" : "var(--border-subtle)"}`
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                    ✓ 1. Process & Functional Architecture
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11, lineHeight: 1.45 }}>
                    {scenario.thinking.processLogic}
                  </div>
                </div>

                {/* Step 2: Data Dictionary Tables */}
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: thinkingStep >= 2 ? "var(--bg-surface)" : "transparent",
                    borderLeft: `3px solid ${thinkingStep >= 2 ? "#10B981" : "var(--border-subtle)"}`
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    ✓ 2. Data Dictionary (DDIC) Mapping
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {scenario.thinking.ddicTables.map(t => (
                      <span
                        key={t.table}
                        title={t.desc}
                        style={{
                          fontSize: 10,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: "rgba(212, 98, 43, 0.08)",
                          color: "#D4622B",
                          border: "1px solid var(--border-subtle)"
                        }}
                      >
                        {t.table}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step 3: Screen Topology */}
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: thinkingStep >= 3 ? "var(--bg-surface)" : "transparent",
                    borderLeft: `3px solid ${thinkingStep >= 3 ? "#10B981" : "var(--border-subtle)"}`
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                    ✓ 3. Dynpro Layout & Subscreens
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {scenario.thinking.topology}
                  </div>
                </div>

                {/* Step 4: PAI / PBO Modules */}
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: thinkingStep >= 4 ? "var(--bg-surface)" : "transparent",
                    borderLeft: `3px solid ${thinkingStep >= 4 ? "#10B981" : "var(--border-subtle)"}`
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                    ✓ 4. PAI/PBO Module Flow & OK-Code Logic
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    {scenario.thinking.paiPbo}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section C: Interactive Requirement Interview (Clarifying Questions) */}
          <div style={{ padding: "16px", flex: 1, background: "var(--bg-card)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              3. Interactive Requirement Interview
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {interviewState.map(q => (
                <div key={q.id}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    {q.question}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {q.options.map(opt => {
                      const isSelected = q.selected === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleQuestionSelect(q.id, opt.id)}
                          style={{
                            padding: "6px 9px",
                            borderRadius: 5,
                            border: isSelected ? "1.5px solid #D4622B" : "1px solid var(--border-subtle)",
                            background: isSelected ? "rgba(212, 98, 43, 0.08)" : "var(--bg-surface)",
                            cursor: "pointer",
                            transition: "all 0.12s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11.5, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#D4622B" : "var(--text-primary)" }}>
                              {opt.label}
                            </span>
                            {isSelected && (
                              <span style={{ fontSize: 11, color: "#D4622B", fontWeight: 800 }}>✓</span>
                            )}
                          </div>
                          {opt.desc && (
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                              {opt.desc}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: The Authentic SAP GUI Screen & Spec Documentation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: themeStyles.dynproBg }}>
          {/* Subheader: Screen Tabs (Visual Screen, Process Logic, DDIC Catalog, ABAP Code, Export) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 16px",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border-subtle)",
              flexShrink: 0
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[
                { id: "screen", label: "🖥️ Enterprise GUI Screen", badge: "Visual" },
                { id: "logic", label: "📄 Process Logic & Functional Spec", badge: "FS" },
                { id: "ddic", label: "📊 Data Dictionary Catalog", badge: "DDIC" },
                { id: "abap", label: "💻 Dynpro Flow Logic (PBO/PAI)", badge: "ABAP" }
              ].map(tb => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: activeTab === tb.id ? "1px solid #D4622B" : "1px solid transparent",
                    background: activeTab === tb.id ? "rgba(212, 98, 43, 0.08)" : "transparent",
                    color: activeTab === tb.id ? "#D4622B" : "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: activeTab === tb.id ? 700 : 500,
                    cursor: "pointer"
                  }}
                >
                  <span>{tb.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Export Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {copiedNotification && (
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginRight: 4 }}>
                  ✓ {copiedNotification} Copied!
                </span>
              )}
              <button
                type="button"
                onClick={() => copyToClipboard(
                  `# Enterprise Functional Specification: ${scenario.tcode}\n\nTitle: ${scenario.title}\nModule: ${scenario.module}\nTarget Release: Enterprise 2026\n\n## 1. Process Logic\n${scenario.thinking.processLogic}\n\n## 2. Screen Topology\n${scenario.thinking.topology}\n\n## 3. Data Dictionary Elements\n${scenario.thinking.ddicTables.map(t => `- **${t.table}**: ${t.desc}`).join('\n')}\n\n## 4. PBO / PAI Flow Logic\n${scenario.thinking.paiPbo}\n`,
                  "Functional Spec Markdown"
                )}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 9px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: "pointer"
                }}
              >
                <span>📋 Copy FS</span>
              </button>
            </div>
          </div>

          {/* View Tab 1: Enterprise High-Fidelity GUI Screen */}
          {activeTab === "screen" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", justifyContent: "center" }}>
              {/* Enterprise GUI Window Frame */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 960,
                  background: themeStyles.windowBg,
                  border: `1.5px solid ${themeStyles.frameBorder}`,
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
                }}
              >
                {/* 1. Window Titlebar */}
                <div
                  style={{
                    background: themeStyles.headerBarBg,
                    color: themeStyles.headerBarText || "#FFFFFF",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    userSelect: "none",
                    borderBottom: `1px solid ${themeStyles.frameBorder}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 6px", background: themeStyles.headerBadgeBg || "rgba(255,255,255,0.2)", color: themeStyles.headerBadgeText || "#FFFFFF", borderRadius: 4, letterSpacing: "0.04em" }}>
                      ENTERPRISE
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.02em" }}>
                      [{scenario.tcode}] - {scenario.title}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, opacity: 0.85, fontFamily: "var(--font-mono)" }}>
                      {scenario.statusBar.system}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4B5563", display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4B5563", display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                    </div>
                  </div>
                </div>

                {/* 2. SAP Menu Bar */}
                <div
                  style={{
                    background: themeStyles.menuBarBg,
                    borderBottom: `1px solid ${themeStyles.frameBorder}`,
                    padding: "3px 10px",
                    display: "flex",
                    gap: 16,
                    fontSize: 11.5,
                    color: themeStyles.textPrimary,
                    userSelect: "none"
                  }}
                >
                  {["Screen", "Edit", "Goto", "Extras", "Environment", "System", "Help"].map((m, idx) => (
                    <span key={idx} style={{ cursor: "pointer", padding: "1px 4px" }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}>
                      {m}
                    </span>
                  ))}
                </div>

                {/* 3. SAP Standard Toolbar (Command Field + Enter + Save + Back + Cancel) */}
                <div
                  style={{
                    background: themeStyles.standardToolbarBg,
                    borderBottom: `1px solid ${themeStyles.frameBorder}`,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    userSelect: "none"
                  }}
                >
                  {/* Command Input Field with Green Check OK-Code Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: themeStyles.inputBg,
                        border: `1px solid ${themeStyles.inputBorder}`,
                        borderRadius: 3,
                        padding: "1px 6px",
                        fontSize: 11.5,
                        fontFamily: "var(--font-mono)",
                        color: themeStyles.textPrimary,
                        width: 115
                      }}
                    >
                      <span>/n{scenario.tcode}</span>
                    </div>
                    <button
                      type="button"
                      title="Enter (OK-Code)"
                      style={{
                        background: "#10B981",
                        border: "none",
                        borderRadius: 3,
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 12
                      }}
                    >
                      ✓
                    </button>
                  </div>

                  <div style={{ width: 1, height: 18, background: themeStyles.frameBorder, margin: "0 2px" }} />

                  {/* Standard Function Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {[
                      { icon: "💾", title: "Save (Ctrl+S)" },
                      { icon: "⬅️", title: "Back (F3)" },
                      { icon: "⬆️", title: "Exit (Shift+F3)" },
                      { icon: "❌", title: "Cancel (F12)" },
                      { icon: "🖨️", title: "Print (Ctrl+P)" },
                      { icon: "🔍", title: "Find (Ctrl+F)" },
                      { icon: "📑", title: "Create Session" }
                    ].map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        title={btn.title}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: 13,
                          padding: "2px 5px",
                          cursor: "pointer",
                          borderRadius: 3
                        }}
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. SAP Application Toolbar (Custom Transaction Buttons) */}
                <div
                  style={{
                    background: themeStyles.standardToolbarBg,
                    borderBottom: `1px solid ${themeStyles.frameBorder}`,
                    padding: "5px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    userSelect: "none"
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: "linear-gradient(135deg, #D4622B 0%, #B84D19 100%)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <span>⚡ Execute (F8)</span>
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#059669",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    📦 Post GR (F5)
                  </button>
                  <button
                    type="button"
                    style={{
                      background: themeStyles.inputBg,
                      border: `1px solid ${themeStyles.inputBorder}`,
                      color: themeStyles.textPrimary,
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      cursor: "pointer"
                    }}
                  >
                    🏷️ Barcode Scan
                  </button>
                  <button
                    type="button"
                    style={{
                      background: themeStyles.inputBg,
                      border: `1px solid ${themeStyles.inputBorder}`,
                      color: themeStyles.textPrimary,
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      cursor: "pointer"
                    }}
                  >
                    🚦 Check ATP
                  </button>
                  <button
                    type="button"
                    style={{
                      background: themeStyles.inputBg,
                      border: `1px solid ${themeStyles.inputBorder}`,
                      color: themeStyles.textPrimary,
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      cursor: "pointer"
                    }}
                  >
                    📋 Defect Log
                  </button>
                </div>

                {/* 5. Dynpro Canvas Body */}
                <div style={{ padding: "14px 16px", background: themeStyles.dynproBg, flex: 1 }}>
                  {/* Header Selection Subscreen 0110 Frame */}
                  <div
                    style={{
                      border: `1px solid ${themeStyles.frameBorder}`,
                      borderRadius: 5,
                      padding: "12px 14px",
                      background: themeStyles.cardSurface,
                      marginBottom: 14
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: themeStyles.textPrimary, marginBottom: 10, letterSpacing: "0.02em" }}>
                      General Header & Target Selection (Subscreen 0110)
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                      {scenario.headerFields.map(f => (
                        <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <label style={{ width: 120, fontSize: 11, color: themeStyles.textMuted, textAlign: "right", flexShrink: 0 }}>
                            {f.required && <span style={{ color: "#EF4444", marginRight: 2 }}>*</span>}
                            {f.label}:
                          </label>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
                            {f.type === "badge" ? (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  fontFamily: "var(--font-mono)",
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  background: `${f.badgeColor}20`,
                                  color: f.badgeColor,
                                  border: `1px solid ${f.badgeColor}40`
                                }}
                              >
                                {f.value}
                              </span>
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  background: f.type === "readonly" ? (isDark ? "#202730" : "#F1F5F9") : themeStyles.inputBg,
                                  border: `1px solid ${themeStyles.inputBorder}`,
                                  borderRadius: 3,
                                  padding: "3px 8px",
                                  fontSize: 11.5,
                                  fontFamily: f.type === "readonly" ? "var(--font-sans)" : "var(--font-mono)",
                                  color: themeStyles.textPrimary,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between"
                                }}
                              >
                                <span>{f.value}</span>
                                {f.hasF4 && (
                                  <button
                                    type="button"
                                    onClick={() => setF4ModalOpen(f)}
                                    title={`F4 Search Help for ${f.ddic}`}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#D4622B",
                                      fontSize: 11,
                                      cursor: "pointer",
                                      padding: 0
                                    }}
                                  >
                                    🔍
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynpro Tabstrip Control */}
                  <div style={{ display: "flex", gap: 3, borderBottom: `1px solid ${themeStyles.frameBorder}`, marginBottom: -1 }}>
                    {scenario.tabs.map((tb, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div
                          key={tb.id}
                          style={{
                            padding: "6px 14px",
                            background: isFirst ? themeStyles.cardSurface : "transparent",
                            border: isFirst ? `1px solid ${themeStyles.frameBorder}` : "none",
                            borderBottom: isFirst ? `1px solid ${themeStyles.cardSurface}` : "none",
                            borderTopLeftRadius: 5,
                            borderTopRightRadius: 5,
                            fontSize: 11.5,
                            fontWeight: isFirst ? 700 : 500,
                            color: isFirst ? "#D4622B" : themeStyles.textMuted,
                            cursor: "pointer",
                            zIndex: isFirst ? 2 : 1
                          }}
                        >
                          {tb.label} ({tb.count})
                        </div>
                      );
                    })}
                  </div>

                  {/* ALV Grid / Table Control Subscreen 0120 */}
                  <div
                    style={{
                      border: `1px solid ${themeStyles.frameBorder}`,
                      background: themeStyles.cardSurface,
                      borderRadius: "0 5px 5px 5px",
                      overflow: "hidden"
                    }}
                  >
                    {/* ALV Grid Mini Toolbar */}
                    <div
                      style={{
                        padding: "4px 8px",
                        background: themeStyles.tableHeaderBg,
                        borderBottom: `1px solid ${themeStyles.frameBorder}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11,
                        color: themeStyles.textMuted
                      }}
                    >
                      <span>☑️ Select All</span>
                      <span>|</span>
                      <span>⬆️ Sort Asc</span>
                      <span>⬇️ Sort Desc</span>
                      <span>|</span>
                      <span>🔍 Filter</span>
                      <span>Σ Total</span>
                      <span>|</span>
                      <span>📊 Export to Excel</span>
                    </div>

                    {/* ALV Grid Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      <thead>
                        <tr style={{ background: themeStyles.tableHeaderBg, borderBottom: `1px solid ${themeStyles.frameBorder}` }}>
                          {scenario.gridColumns.map(col => (
                            <th
                              key={col.id}
                              style={{
                                padding: "6px 8px",
                                textAlign: col.align || "left",
                                color: themeStyles.textPrimary,
                                fontWeight: 700,
                                borderRight: `1px solid ${themeStyles.frameBorder}`,
                                width: col.width
                              }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scenario.gridRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            style={{
                              background: rIdx % 2 === 0 ? themeStyles.tableRowEven : themeStyles.tableRowOdd,
                              borderBottom: `1px solid ${themeStyles.frameBorder}`
                            }}
                          >
                            {scenario.gridColumns.map(col => {
                              const val = row[col.id];
                              if (col.id === "status") {
                                return (
                                  <td key={col.id} style={{ padding: "5px 8px", textAlign: "center" }}>
                                    <span
                                      style={{
                                        width: 9,
                                        height: 9,
                                        borderRadius: "50%",
                                        display: "inline-block",
                                        background: val === "green" ? "#10B981" : (val === "yellow" ? "#F59E0B" : "#EF4444"),
                                        boxShadow: `0 0 5px ${val === "green" ? "#10B981" : "#F59E0B"}`
                                      }}
                                    />
                                  </td>
                                );
                              }
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: "5px 8px",
                                    textAlign: col.align || "left",
                                    color: themeStyles.textPrimary,
                                    borderRight: `1px solid ${themeStyles.frameBorder}`
                                  }}
                                >
                                  {col.editable ? (
                                    <span style={{ background: isDark ? "#2C3542" : "#FEF3C7", padding: "1px 4px", borderRadius: 2 }}>
                                      {val}
                                    </span>
                                  ) : (
                                    val
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. Authentic SAP Status Bar */}
                <div
                  style={{
                    background: themeStyles.statusBarBg,
                    borderTop: `1px solid ${themeStyles.frameBorder}`,
                    padding: "4px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: themeStyles.statusBarText,
                    userSelect: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: scenario.statusBar.type === "S" ? "#10B981" : "#F59E0B",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 900
                      }}
                    >
                      {scenario.statusBar.type}
                    </span>
                    <span>{scenario.statusBar.text}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "var(--font-mono)", fontSize: 10 }}>
                    <span>{scenario.statusBar.system}</span>
                    <span>|</span>
                    <span>{scenario.statusBar.program}</span>
                    <span>|</span>
                    <span>Dynpro {scenario.statusBar.dynpro}</span>
                    <span>|</span>
                    <span>INS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Tab 2: Process Logic & Functional Specification */}
          {activeTab === "logic" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <div style={{ maxWidth: 840, margin: "0 auto", background: "var(--bg-card)", padding: "24px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <h2 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>
                  Functional Specification: {scenario.tcode}
                </h2>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                  Target Landscape: Enterprise Cloud Edition · Module: {scenario.module}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, color: "#D4622B", marginBottom: 6 }}>1. Business Context & Objective</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-body)" }}>
                    {scenario.thinking.processLogic}
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, color: "#D4622B", marginBottom: 6 }}>2. Dynpro Topology & Layout Architecture</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-body)" }}>
                    {scenario.thinking.topology}
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, color: "#D4622B", marginBottom: 6 }}>3. Selected Architecture Decisions (Interview Output)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {interviewState.map(q => {
                      const chosenOpt = q.options.find(o => o.id === q.selected);
                      return (
                        <div key={q.id} style={{ padding: "8px 12px", background: "var(--bg-surface)", borderRadius: 6, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{q.question}: </span>
                          <span style={{ color: "#D4622B", fontWeight: 600 }}>{chosenOpt?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Tab 3: Data Dictionary (DDIC) Catalog */}
          {activeTab === "ddic" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <div style={{ maxWidth: 840, margin: "0 auto", background: "var(--bg-card)", padding: "24px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <h2 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>
                  Data Dictionary (DDIC) Field Catalog
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                  Database tables, structure mappings, and search help assignments for {scenario.tcode}
                </p>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-strong)" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Table</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Field / Structure</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Technical Description</th>
                      <th style={{ padding: "8px 10px", textAlign: "center" }}>Search Help</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.headerFields.map((f, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "#D4622B" }}>
                          {f.ddic ? f.ddic.split('-')[0] : 'STRUCTURE'}
                        </td>
                        <td style={{ padding: "8px 10px" }}>{f.ddic || f.id}</td>
                        <td style={{ padding: "8px 10px", fontFamily: "var(--font-sans)" }}>{f.label}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          {f.hasF4 ? "🔍 VMVA" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Tab 4: ABAP Dynpro Flow Logic (PBO / PAI) */}
          {activeTab === "abap" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <div style={{ maxWidth: 840, margin: "0 auto", background: "var(--bg-card)", padding: "24px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 style={{ fontSize: 18, color: "var(--text-primary)", margin: 0 }}>
                    ABAP Dynpro Flow Logic: {scenario.statusBar.program}
                  </h2>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`PROCESS BEFORE OUTPUT.\n  MODULE status_0100.\n  MODULE init_alv_grid.\n\nPROCESS AFTER INPUT.\n  FIELD z_deliv_no MODULE validate_delivery ON INPUT.\n  MODULE user_command_0100.`, "ABAP Code")}
                    style={{
                      padding: "4px 10px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer"
                    }}
                  >
                    Copy ABAP
                  </button>
                </div>

                <pre
                  style={{
                    background: "#FAF9F5",
                    color: "#1C1917",
                    border: "1px solid #E5E5DF",
                    padding: "16px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.6,
                    overflowX: "auto"
                  }}
                >
{`*----------------------------------------------------------------------*
* Program: ${scenario.statusBar.program}
* Screen:  Dynpro ${scenario.statusBar.dynpro}
* Generated by Nexus Enterprise Autonomous Screen Designer
*----------------------------------------------------------------------*

PROCESS BEFORE OUTPUT.
  MODULE status_0100.
  MODULE init_alv_grid.
  MODULE set_header_defaults.

PROCESS AFTER INPUT.
  FIELD ${scenario.headerFields[0]?.ddic || 'z_deliv_no'} MODULE validate_header ON INPUT.
  MODULE user_command_0100.

*----------------------------------------------------------------------*
* Module: STATUS_0100 (PBO)
*----------------------------------------------------------------------*
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100' WITH '${scenario.title}'.
ENDMODULE.

*----------------------------------------------------------------------*
* Module: USER_COMMAND_0100 (PAI)
*----------------------------------------------------------------------*
MODULE user_command_0100 INPUT.
  save_ok = ok_code.
  CLEAR ok_code.

  CASE save_ok.
    WHEN 'EXECUTE' OR 'F8'.
      PERFORM execute_business_logic.
    WHEN 'POST_GR' OR 'F5'.
      PERFORM call_bapi_goodsmvt_create.
    WHEN 'BACK' OR 'F3' OR 'CANCEL' OR 'F12'.
      LEAVE TO SCREEN 0.
    WHEN 'EXIT'.
      LEAVE PROGRAM.
  ENDCASE.
ENDMODULE.`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* F4 Search Help Modal Simulation */}
      {f4ModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999
          }}
        >
          <div
            style={{
              width: 480,
              background: "var(--bg-card)",
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              border: "1px solid var(--border-strong)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "10px 14px", background: "linear-gradient(135deg, #D4622B 0%, #B84D19 100%)", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>🔍 Enterprise F4 Search Help: {f4ModalOpen.ddic}</span>
              <button onClick={() => setF4ModalOpen(null)} style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ padding: "14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8 }}>
                Select value for parameter <strong>{f4ModalOpen.label}</strong>:
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchHelpText}
                onChange={(e) => setSearchHelpText(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 4, border: "1px solid var(--border-subtle)", fontSize: 12, marginBottom: 10 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["80004123 - Outbound Shipping Hamburg", "80004124 - Inbound Supplier Fastener Pack", "80004125 - Raw Steel Coil Delivery"].map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    onClick={() => setF4ModalOpen(null)}
                    style={{ padding: "6px 8px", background: "var(--bg-surface)", borderRadius: 4, fontSize: 11.5, cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212, 98, 43, 0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
