/**
 * SAP Domain Specializations Registry
 * Defines comprehensive domain metadata, business processes, common transactions,
 * database tables, CDS views, integration points, error messages, and interview prep
 * for first-class specialist packs (GTS, IS-Retail, SD) and extended SAP modules.
 */

const SAP_DOMAIN_SPECIALIZATIONS = {
  GTS: {
    id: "GTS",
    display_name: "SAP Global Trade Services",
    short_name: "GTS",
    icon: "🌐",
    priority: "high",
    tagline: "Compliance, Sanctioned Party Screening, Legal Control & Customs Management",
    color: "#6E1A2D",
    badge_bg: "rgba(110, 26, 45, 0.12)",
    badge_border: "rgba(110, 26, 45, 0.35)",
    answer_style: "compliance-focused, regulatory-grounded, and feeder-audit driven",
    areas: [
      "Sanctioned Party Screening (SPL)",
      "Legal Control (Export/Import Licenses)",
      "Embargo Checking",
      "Export Control & Embargo Determination",
      "Customs Management & Declarations",
      "Preference Management & Origin Determination",
      "Feeder-System Integration & Plug-Ins (/SAPSLL/*)",
      "Replication & Synchronization (Business Partners & Documents)",
      "GTS Master Data & Classification",
      "Customs Tariff & HS Code Classification",
      "Compliance Block Resolution & Audit Logging",
      "Electronic Customs Filing (AES, ATLAS, CHIEF/CDS)"
    ],
    business_processes: [
      "Order-to-Compliance: SD Sales Order Feeder Screening",
      "Delivery-to-Customs: Outbound Delivery Export Declaration",
      "Procurement-to-Screening: PO Inbound Legal Control & Vendor SPL",
      "Preference Determination: Long-Term Vendor Declarations (LTVD) & Preference Calculation",
      "Customs Inbound / Duty Management: Transit & Bonded Warehouse Procedures"
    ],
    common_transactions: [
      { code: "/SAPSLL/SPL_CHCK", desc: "Sanctioned Party Screening Check" },
      { code: "/SAPSLL/SPL_CHG1", desc: "SPL Screening Master Maintenance & Periodic Audit" },
      { code: "/SAPSLL/BL_DOCS", desc: "Display Blocked Documents (Compliance & Customs)" },
      { code: "/SAPSLL/DS_BD_01", desc: "Release Blocked Documents" },
      { code: "/SAPSLL/LEGCUS_01", desc: "Customs Declarations Processing" },
      { code: "/SAPSLL/PREF_CLC", desc: "Preference Calculation Run" },
      { code: "/SAPSLL/CL_PR_01", desc: "Classify Products with Tariff & Export List Numbers" },
      { code: "/SAPSLL/CON_CHK_01", desc: "Check Legal Control & Embargo" },
      { code: "/SAPSLL/BP_SCREEN", desc: "Manual Business Partner Screening" },
      { code: "/SAPSLL/CD_TR_01", desc: "Customs Document Tracking & SLG1 Audit Log" }
    ],
    common_fiori_apps: [
      { app: "Manage Blocked Documents (GTS)", id: "F3821" },
      { app: "Screen Business Partners (GTS)", id: "F3822" },
      { app: "Classify Products for Customs", id: "F3823" }
    ],
    master_data_objects: [
      "Customs Product Master (/SAPSLL/CORCTS)",
      "GTS Business Partner & SPL List (/SAPSLL/SPLBL)",
      "Legal Regulations (/SAPSLL/TLEGRG)",
      "Tariff Codes / HS Schedule B Numbers",
      "Export Control Classification Numbers (ECCN / AL)",
      "Preference Agreements & Rules of Origin"
    ],
    common_tables: [
      { table: "/SAPSLL/CORCTS", desc: "GTS Customs Product Master Extension" },
      { table: "/SAPSLL/CUHD", desc: "Customs Document Header" },
      { table: "/SAPSLL/CUID", desc: "Customs Document Item" },
      { table: "/SAPSLL/LCCHK", desc: "Legal Control Check Log" },
      { table: "/SAPSLL/SPLBL", desc: "Sanctioned Party List Master Records" },
      { table: "/SAPSLL/PNTBP", desc: "GTS Partner / Business Partner Mapping" },
      { table: "/SAPSLL/CTSNUM", desc: "Tariff & Commodity Code Definitions" }
    ],
    common_cds_views: [
      "C_GTSBlockedDocumentQuery",
      "C_GTSCustomsDeclarationItem",
      "I_GTSComplianceDocument"
    ],
    integration_points: [
      "SD (Feeder): Sales Order (VA01) → Real-time RFC SPL & Legal Check",
      "SD (Feeder): Outbound Delivery (VL01N) → GTS Customs Document Creation",
      "MM (Feeder): Purchase Order (ME21N) → Inbound Legal Control Check",
      "EWM: Customs Status Sync for Bonded Warehouse Management",
      "TM: Freight Order Compliance Check & Customs Transit Document Flow",
      "Feeder Replication: Initial & Delta Load (BAPI / IDoc / RFC via /SAPSLL/*)"
    ],
    common_errors: [
      "Document blocked in feeder system: 'GTS Compliance block active for Partner/Country'",
      "Screening error: 'No legal regulation active for Country Group'",
      "Replication failure: 'RFC destination to GTS system unreachable or timeout'",
      "Tariff classification missing: 'No valid Commodity Code found for product in schema'"
    ],
    monitoring_tools: [
      "Transaction /SAPSLL/BL_DOCS (Blocked Document Monitor)",
      "Transaction /SAPSLL/CD_TR_01 (Document Tracking)",
      "SLG1 with Object /SAPSLL/* (GTS Application Log)",
      "SM58 / SMQ1 / SMQ2 (Feeder RFC & Queue Monitors)"
    ],
    evidence_requirements: "GTS compliance claims require explicit citation of Legal Regulations, determination rules, and feeder RFC integration steps. Never assume universal customs laws without verifying target country group."
  },

  IS_RETAIL: {
    id: "IS_RETAIL",
    display_name: "SAP IS-Retail",
    short_name: "IS-Retail",
    icon: "🛍️",
    priority: "high",
    tagline: "Merchandise Hierarchy, Article Master, Listing, Assortment & POS Integration",
    color: "#831843",
    badge_bg: "rgba(131, 24, 67, 0.12)",
    badge_border: "rgba(131, 24, 67, 0.35)",
    answer_style: "retail-process, article-oriented, and master-data architectural focus",
    areas: [
      "Article Master (Single, Generic, Variants, Sales Sets, Displays, Pre-packs)",
      "Site Master (Distribution Centers, Stores, Franchise Sites)",
      "Merchandise Category & Hierarchy Management",
      "Assortment Management & Assortment Modules",
      "Listing & Listing Conditions (WSLA, WSL10, WSL11)",
      "Allocation Tables & Allocation Rules (WA01, WA02)",
      "Store & DC Replenishment (WRP1, FPR1)",
      "Retail Sales Pricing & Two-Step Pricing (VKP5)",
      "Promotions & Markdown Management (WAK1)",
      "POS Inbound & Outbound Integration (WPMA, WPER, POS DM / CAR)",
      "Merchandise Distribution (Cross-docking, Flow-through)",
      "Season Management & Retail Inventory"
    ],
    business_processes: [
      "Merchandise Lifecycle: Creation -> Hierarchy Assignment -> Listing -> Assortment",
      "Store Replenishment: Requirement Calculation -> Store STO -> DC Picking -> POS Sale",
      "Push Allocation: Purchase Order -> Allocation Table (WA01) -> Split into Store Deliveries",
      "Promotional Rollout: Promotion Creation (WAK1) -> Special Pricing -> Store Listing -> POS Download",
      "Merchandise Distribution: Cross-Docking & Flow-Through at Retail DC"
    ],
    common_transactions: [
      { code: "MM41 / MM42 / MM43", desc: "Create / Change / Display Retail Article Master" },
      { code: "WB01 / WB02 / WB03", desc: "Create / Change / Display Site Master (Store / DC)" },
      { code: "WG21 / WG22", desc: "Maintain Merchandise Categories & Hierarchy" },
      { code: "WSOA1 / WSOA2", desc: "Assortment Definition & Store Assignment" },
      { code: "WSL10 / WSL11", desc: "Execute Article Listing & Assortment Maintenance" },
      { code: "WA01 / WA02", desc: "Create / Change Allocation Table (Push Distribution)" },
      { code: "WRP1", desc: "Execute Store & DC Replenishment Planning" },
      { code: "VKP5", desc: "Retail Sales Price Calculation & Condition Maintenance" },
      { code: "WAK1 / WAK2", desc: "Create / Change Retail Promotion" },
      { code: "WPMA", desc: "POS Outbound Interface (Download Master Data to POS)" },
      { code: "WPER", desc: "POS Inbound Monitor & Sales Transaction Idoc Processing" }
    ],
    common_fiori_apps: [
      { app: "Manage Retail Articles", id: "F2341" },
      { app: "Manage Retail Promotions", id: "F2342" },
      { app: "Monitor Store Replenishment", id: "F2343" }
    ],
    master_data_objects: [
      "Article Master (MARA with ATTYP: 00 Single, 01 Generic, 02 Variant, 10 Set, 11 Display, 12 Prepack)",
      "Site Master (T001W, WRF1 - Store vs DC category)",
      "Merchandise Category (KSSK, KLAH, T023)",
      "Assortment (WRS1) & Listing Conditions (WLK1, WLK2)",
      "Sales Price Conditions (A071, A073, KONP)"
    ],
    common_tables: [
      { table: "MARA", desc: "General Article Data (Retail Extension: ATTYP, SATNR)" },
      { table: "MAW1", desc: "Article Master Retail-Specific Fields" },
      { table: "WRF1", desc: "Retail Site Additional Data" },
      { table: "WLK1", desc: "Article Listing Conditions per Assortment/Site" },
      { table: "WLK2", desc: "Assortment Assignment to Article/Site" },
      { table: "WRS1", desc: "Assortment Master Header" },
      { table: "WAKR", desc: "Promotion Master Records" },
      { table: "WPUBON", desc: "POS Inbound Receipt Data" }
    ],
    common_cds_views: [
      "C_RetailArticleMasterQuery",
      "C_AssortmentListingItem",
      "I_RetailSiteMaster"
    ],
    integration_points: [
      "SAP CAR (Customer Activity Repository) & POS DM: Inbound POS receipt analytics",
      "EWM / Classic WM: Retail DC picking, flow-through, and store cross-docking",
      "SD: Store replenishment delivery via Stock Transport Order (STO - UB)",
      "MM: Retail Purchase Orders with seasonal & variant split",
      "FI: Retail Inventory Valuation Method (RIVM / Cost-to-Retail Ratio)"
    ],
    common_errors: [
      "Article not listed: 'Article X is not listed in store/site Y for sales date Z'",
      "Generic/Variant discrepancy: 'Cannot post movements to Generic Article without Variant selection'",
      "Replenishment error: 'No valid replenishment parameter found in table WRF1/MARC'",
      "POS Download stop: 'Change pointers not generated for message type WP_PLU'"
    ],
    monitoring_tools: [
      "Transaction WPER (POS Inbound Monitor)",
      "Transaction WSL11 (Listing Log & Verification)",
      "Transaction BD87 (Retail POS IDoc Processing: WP_PLU, WPUUMS, WPUBON)",
      "SLG1 with Object W_RETAIL"
    ],
    evidence_requirements: "IS-Retail answers must clearly differentiate Article semantics (Generic/Variant/Single) from standard SAP Material master (MM01). Never describe Retail listing as basic plant extension."
  },

  SD: {
    id: "SD",
    display_name: "SAP Sales and Distribution",
    short_name: "SD",
    icon: "📦",
    priority: "high",
    tagline: "Order-to-Cash, Pricing Condition Technique, ATP, Delivery & Billing Integration",
    color: "#1E3A8A",
    badge_bg: "rgba(30, 58, 138, 0.12)",
    badge_border: "rgba(30, 58, 138, 0.35)",
    answer_style: "complete document-flow, pricing technique, and cross-module integration driven",
    areas: [
      "Sales Order Processing & Inquiries/Quotations (VA01, VA11, VA21)",
      "Document Flow (Inquiry -> Quote -> Order -> Delivery -> GI -> Billing -> FI)",
      "Sales Organization, Distribution Channel & Division (Sales Area)",
      "Customer Master & Business Partner Roles (SP, SH, BP, PY)",
      "Pricing Procedure & Condition Technique (16-Step Schema, Access Sequence, V/06, V/08)",
      "Availability Check (ATP) & Transfer of Requirements (TOR, OVZ9, OPJK)",
      "Delivery & Shipping Point Determination (OVL2, VL01N, VL02N)",
      "Picking, Packing & Goods Issue (Movement Type 601)",
      "Billing, Invoicing & Intercompany Billing (VF01, VF04, IV)",
      "Copy Control (VTAA, VTLA, VTFL) & Status Profiles",
      "Credit Management (FSCM / Classic VKM1, VKM3)",
      "Output Determination (NAST / BRF+ / S/4HANA Output Management)",
      "Partner Determination & Text Determination (VOPAR, VOTXN)",
      "Route Determination & Transit Lead Time",
      "Account Determination (VKOA -> Revenue Account GL)"
    ],
    business_processes: [
      "Order-to-Cash (O2C): VA01 -> VL01N -> VL02N (PGI 601) -> VF01 -> BKPF",
      "Third-Party Sales (TAS): VA01 -> Automatic PR -> PO (ME21N) -> Vendor Direct Ship -> VF01",
      "Intercompany Sales: Sales Org A sells from Plant B -> Intercompany Billing (IV)",
      "Returns & Credit Memo: Return Order (RE) -> Return Delivery (LR) -> PGR (651) -> Credit Memo (RE)",
      "Make-to-Order (MTO): Sales Order Item Cat. TAK -> Trigger PP Order (CO01) with Sales Order Stock (E)"
    ],
    common_transactions: [
      { code: "VA01 / VA02 / VA03", desc: "Create / Change / Display Sales Order" },
      { code: "VL01N / VL02N / VL03N", desc: "Create / Change / Display Outbound Delivery" },
      { code: "VF01 / VF02 / VF03", desc: "Create / Change / Display Billing Document" },
      { code: "VK11 / VK12 / VK13", desc: "Create / Change / Display Pricing Condition Record (e.g. PR00, K004)" },
      { code: "V/08", desc: "Maintain Pricing Procedure Schema" },
      { code: "V/06", desc: "Maintain Condition Types" },
      { code: "OVL2", desc: "Maintain Shipping Point Determination" },
      { code: "VKOA", desc: "Maintain Account Determination (Account Key -> GL Account)" },
      { code: "VKM1 / VKM3", desc: "Credit Management Block Monitor" },
      { code: "VTFL", desc: "Copy Control: Delivery to Billing Document" },
      { code: "VTAA", desc: "Copy Control: Sales Order to Sales Order" }
    ],
    common_fiori_apps: [
      { app: "Manage Sales Orders", id: "F1814" },
      { app: "Manage Outbound Deliveries", id: "F2336" },
      { app: "Create Billing Documents", id: "F0798" }
    ],
    master_data_objects: [
      "Customer Master / Business Partner (KNVV, KNA1, BUT000)",
      "Pricing Condition Records (KONV, PRCD_ELEMENTS, A004/A005)",
      "Customer-Material Info Record (KNMT)",
      "Output Condition Records (NAST, BRF+ decision tables)",
      "Credit Account Data (UKMBP_CMS / KNKK)"
    ],
    common_tables: [
      { table: "VBAK", desc: "Sales Document Header" },
      { table: "VBAP", desc: "Sales Document Item" },
      { table: "LIKP", desc: "SD Outbound Delivery Header" },
      { table: "LIPS", desc: "SD Outbound Delivery Item" },
      { table: "VBRK", desc: "Billing Document Header" },
      { table: "VBRP", desc: "Billing Document Item" },
      { table: "VBFA", desc: "SD Complete Document Flow Table" },
      { table: "KONV / PRCD_ELEMENTS", desc: "Pricing Document Conditions Table" },
      { table: "VBUK / VBUP", desc: "Document Header/Item Status (ECC & Compatibility Views)" }
    ],
    common_cds_views: [
      "C_SalesOrderManageQuery",
      "I_OutboundDeliveryItem",
      "I_BillingDocumentItem",
      "C_SalesDocumentFlow"
    ],
    integration_points: [
      "MM / Inventory: Availability Check (ATP) & Goods Issue Movement 601",
      "FI / CO: Billing posting to Accounting (VF01 -> BKPF/BSEG) via VKOA revenue account determination",
      "GTS: Order & Delivery screening for Legal Control, Embargo, and Export Declarations",
      "EWM: Outbound Delivery replication (VL01N -> /SCWM/PRDO warehouse request)",
      "TM: Delivery split & Freight Unit / Freight Order building",
      "PP: Make-to-Order (MTO) schedule line triggering assembly orders"
    ],
    common_errors: [
      "Pricing error: 'Mandatory condition PR00 missing in pricing procedure'",
      "Shipping point error: 'No shipping point determined for plant X and shipping condition Y'",
      "Billing block error: 'Document blocked for billing due to credit limit or pricing inconsistency'",
      "Account determination error: 'Error in account determination: Table VKOA Account key ERL missing GL'"
    ],
    monitoring_tools: [
      "Transaction VA05 / VA05N (List of Sales Orders)",
      "Transaction VL06O (Outbound Delivery Monitor)",
      "Transaction VF04 (Billing Due List)",
      "Transaction V.02 / V.14 (Incomplete Sales Documents)"
    ],
    evidence_requirements: "SD answers must always position the issue within the 9-stage O2C Document Flow: Inquiry -> Quotation -> Sales Order -> Delivery -> Picking -> Packing -> Goods Issue -> Billing -> Accounting. Specify relevant copy control, determination rules, and table status fields."
  },

  EWM: {
    id: "EWM",
    display_name: "SAP Extended Warehouse Management",
    short_name: "EWM",
    icon: "🏭",
    priority: "standard",
    tagline: "Warehouse Tasks, Waves, Inbound/Outbound Execution, Staging & PSA Bins",
    color: "#059669",
    badge_bg: "rgba(5, 150, 105, 0.12)",
    badge_border: "rgba(5, 150, 105, 0.35)",
    areas: ["Inbound Logistics", "Outbound Logistics", "Production Staging (PMR/PSA)", "Warehouse Monitor", "Wave Management", "RF Framework"],
    common_transactions: [
      { code: "/SCWM/PRDO", desc: "Outbound Delivery Orders" },
      { code: "/SCWM/STAGE", desc: "Production Staging Cockpit" },
      { code: "/SCWM/MON", desc: "Warehouse Management Monitor" }
    ],
    common_tables: [{ table: "/SCDL/DB_PROCH_O", desc: "Outbound Delivery Header" }, { table: "/SCWM/AQUA", desc: "Available Stock" }]
  },

  PP: {
    id: "PP",
    display_name: "SAP Production Planning",
    short_name: "PP",
    icon: "⚙️",
    priority: "standard",
    tagline: "BOM Explosion, Routings, MRP, Production Orders & Shop Floor Control",
    color: "#D97706",
    badge_bg: "rgba(217, 119, 6, 0.12)",
    badge_border: "rgba(217, 119, 6, 0.35)",
    areas: ["MRP & Demand Management", "Production Orders (CO01/CO02)", "BOM & Routing", "Confirmations (CO11N)", "COGI Error Handling"],
    common_transactions: [
      { code: "CO01 / CO02 / CO03", desc: "Production Order Maintenance" },
      { code: "COGI", desc: "Postprocessing of Failed Goods Movements" },
      { code: "MD04", desc: "Stock/Requirements List" }
    ],
    common_tables: [{ table: "AFKO", desc: "Production Order Header" }, { table: "RESB", desc: "Reservations / Dependent Requirements" }]
  },

  MM: {
    id: "MM",
    display_name: "SAP Materials Management",
    short_name: "MM",
    icon: "🛒",
    priority: "standard",
    tagline: "Purchasing, Inventory Management, Goods Movements & Account Determination",
    color: "#2563EB",
    badge_bg: "rgba(37, 99, 235, 0.12)",
    badge_border: "rgba(37, 99, 235, 0.35)",
    areas: ["Purchasing (ME21N)", "Inventory Management (MIGO)", "Movement Types", "Invoice Verification (MIRO)", "Account Determination (OMWB)"],
    common_transactions: [
      { code: "ME21N / ME22N", desc: "Create / Change Purchase Order" },
      { code: "MIGO", desc: "Goods Movements (GR, GI, Transfer)" },
      { code: "MIRO", desc: "Enter Inbound Invoice" }
    ],
    common_tables: [{ table: "EKKO", desc: "Purchasing Document Header" }, { table: "EKPO", desc: "Purchasing Document Item" }]
  },

  FICO: {
    id: "FICO",
    display_name: "SAP Financial Accounting & Controlling",
    short_name: "FI/CO",
    icon: "💰",
    priority: "standard",
    tagline: "General Ledger, Accounts Payable/Receivable, Cost Center & Profit Center Accounting",
    color: "#7C3AED",
    badge_bg: "rgba(124, 58, 237, 0.12)",
    badge_border: "rgba(124, 58, 237, 0.35)",
    areas: ["General Ledger (FS00, FB50)", "Accounts Payable/Receivable", "Asset Accounting", "Cost Center Accounting", "Period-End Closing (OB52)"],
    common_transactions: [
      { code: "FB50", desc: "Enter G/L Account Document" },
      { code: "FBL3N", desc: "G/L Account Line Item Display" },
      { code: "OB52", desc: "Posting Period Variant Maintenance" }
    ],
    common_tables: [{ table: "BKPF", desc: "Accounting Document Header" }, { table: "BSEG / ACDOCA", desc: "Accounting Line Items / Universal Journal" }]
  },

  QM: {
    id: "QM",
    display_name: "SAP Quality Management",
    short_name: "QM",
    icon: "🔬",
    priority: "standard",
    tagline: "Inspection Lots, Results Recording, Usage Decisions & Quality Notifications",
    color: "#0891B2",
    badge_bg: "rgba(8, 145, 178, 0.12)",
    badge_border: "rgba(8, 145, 178, 0.35)",
    areas: ["Inspection Lot Processing", "Results Recording", "Usage Decision", "Quality Notifications", "Quality Certificates"],
    common_transactions: [{ code: "QA01 / QA02 / QA03", desc: "Inspection Lot Processing" }, { code: "QE51N", desc: "Results Recording Worklist" }]
  },

  PM: {
    id: "PM",
    display_name: "SAP Plant Maintenance",
    short_name: "PM",
    icon: "🔧",
    priority: "standard",
    tagline: "Maintenance Orders, Technical Objects, Preventive Schedules & Breakdown Triage",
    color: "#C2410C",
    badge_bg: "rgba(194, 65, 12, 0.12)",
    badge_border: "rgba(194, 65, 12, 0.35)",
    areas: ["Functional Locations & Equipment", "Maintenance Notifications", "Maintenance Orders", "Preventive Maintenance"],
    common_transactions: [{ code: "IW21 / IW22", desc: "Create Maintenance Notification" }, { code: "IW31 / IW32", desc: "Create Maintenance Order" }]
  },

  TM: {
    id: "TM",
    display_name: "SAP Transportation Management",
    short_name: "TM",
    icon: "🚚",
    priority: "standard",
    tagline: "Freight Units, Freight Orders, Carrier Selection, Tendency & Freight Settlement",
    color: "#4B5563",
    badge_bg: "rgba(75, 85, 99, 0.12)",
    badge_border: "rgba(75, 85, 99, 0.35)",
    areas: ["Freight Unit Building", "Freight Order Planning", "Carrier Selection & Tendering", "Freight Settlement"],
    common_transactions: [{ code: "/SCMTMS/PLN", desc: "Transportation Cockpit" }, { code: "/SCMTMS/TOR", desc: "Freight Order Display" }]
  },

  BASIS: {
    id: "BASIS",
    display_name: "SAP Basis & System Architecture",
    short_name: "Basis",
    icon: "💻",
    priority: "standard",
    tagline: "RFC Architecture, Queue Triage (SMQ1/SMQ2/bgRFC), Dumps (ST22), Logs (SM21, SLG1)",
    color: "#374151",
    badge_bg: "rgba(55, 65, 81, 0.12)",
    badge_border: "rgba(55, 65, 81, 0.35)",
    areas: ["RFC Destinations (SM59)", "Queue Monitors (SMQ1, SMQ2, SBGRFCMON)", "System Logs (SM21, SLG1)", "Short Dump Analysis (ST22)"],
    common_transactions: [{ code: "SM59", desc: "RFC Destination Setup" }, { code: "SMQ2", desc: "Inbound qRFC Monitor" }, { code: "ST22", desc: "ABAP Dump Analysis" }]
  },

  ABAP: {
    id: "ABAP",
    display_name: "SAP ABAP & Extensibility",
    short_name: "ABAP",
    icon: "📜",
    priority: "standard",
    tagline: "BAdIs, User Exits, Enhancement Points, CDS Views, RAP, OData & IDocs",
    color: "#0F766E",
    badge_bg: "rgba(15, 118, 110, 0.12)",
    badge_border: "rgba(15, 118, 110, 0.35)",
    areas: ["Custom Code & Enhancements (CMOD/SMOD/BAdI)", "Core Data Services (CDS Views)", "RESTful Application Programming (RAP)", "IDocs & ALE (WE02, WE20)"],
    common_transactions: [{ code: "SE80 / SE24", desc: "ABAP Workbench & Class Builder" }, { code: "SE11", desc: "ABAP Dictionary" }, { code: "WE02", desc: "IDoc List Display" }]
  },

  CROSS_MODULE: {
    id: "CROSS_MODULE",
    display_name: "Cross-Module SAP Integration",
    short_name: "Cross-Module",
    icon: "🔗",
    priority: "high",
    tagline: "End-to-End Enterprise Process Flows, System Handshakes & Integration Bridges",
    color: "#4338CA",
    badge_bg: "rgba(67, 56, 202, 0.12)",
    badge_border: "rgba(67, 56, 202, 0.35)",
    areas: ["SD -> GTS -> EWM -> FI Integration", "PP -> EWM Production Staging", "MM -> GTS -> FI Inbound Logistics", "Retail DC -> POS -> CAR Analytics"],
    common_transactions: [{ code: "VBFA", desc: "Complete Document Flow" }, { code: "SMQ2", desc: "Integration Queue Monitors" }]
  }
};

// Normalize and map aliases (e.g. SAP_GTS <-> GTS)
const ENRICHED_SPECIALIZATIONS = {};

for (const [key, spec] of Object.entries(SAP_DOMAIN_SPECIALIZATIONS)) {
  const norm = {
    ...spec,
    code: spec.short_name || spec.id,
    name: spec.display_name,
    isPriority: spec.priority === 'high',
    signatureTcodes: Array.from(new Set(
      (spec.common_transactions || []).flatMap(t => {
        if (t.code.startsWith('/')) return [t.code];
        return t.code.split(/\s*\/\s*/);
      })
    )),
    coreMasterData: spec.master_data_objects || [],
    subAreas: (spec.areas || []).map((a, i) => ({ id: `area-${i}`, name: a })),
    coreTables: (spec.database_tables || []).map(t => t.table || t)
  };

  ENRICHED_SPECIALIZATIONS[key] = norm;
  if (!key.startsWith('SAP_')) {
    ENRICHED_SPECIALIZATIONS[`SAP_${key}`] = norm;
  }
}

ENRICHED_SPECIALIZATIONS.SAP_GENERAL = {
  id: "SAP_GENERAL",
  code: "SAP",
  name: "SAP Enterprise Operations",
  display_name: "SAP Enterprise Operations",
  short_name: "SAP",
  icon: "⚙️",
  priority: "standard",
  isPriority: false,
  tagline: "Comprehensive SAP Architecture & Cross-Functional Operations",
  color: "#4B5563",
  signatureTcodes: ["SPRO", "SM59", "SLG1", "SM21", "ST22"],
  coreMasterData: ["Organizational Structure", "Business Partner"],
  subAreas: [{ id: "gen-1", name: "Core Architecture & Operations" }],
  coreTables: ["T001", "T001W", "BUT000"]
};

module.exports = {
  SAP_DOMAIN_SPECIALIZATIONS: ENRICHED_SPECIALIZATIONS
};
