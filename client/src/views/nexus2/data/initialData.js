// Nexus 2.0 SAP GTS Simulation Data Engine
// Real-world sample records for Trade Compliance & Customs Management

export const INITIAL_PARTNERS = [
  {
    id: "BP-100420",
    partnerNumber: "100420",
    role: "Sold-To Party (CRM000)",
    name: "AeroTech Components Ltd",
    matchedEntity: "AERO TECHNOLOGIES INTERNATIONAL",
    street: "24 Aviation Way, Farnborough",
    city: "Hampshire",
    country: "GB",
    postalCode: "GU14 6XP",
    screeningList: "US Bureau of Industry and Security (BIS) - Denied Persons",
    matchScore: 84,
    status: "BLOCKED", // BLOCKED, UNDER_REVIEW, RELEASED, CONFIRMED_BLOCK
    blockReason: "Fuzzy phonetic match (84%) on company name and aerospace industry category",
    validityStart: "2024-01-01",
    validityEnd: "9999-12-31",
    scenario: "Scenario 1: False-Positive SPL Match",
    scenarioDesc: "AeroTech Components Ltd has an 84% name similarity to a restricted entity. However, company registration numbers, tax IDs, and physical addresses prove it is a legitimate UK aviation supplier, not the denied overseas shell company.",
    recommendedAction: "RELEASE",
    evidence: [
      { field: "Tax Identification", customerValue: "GB-982341209", sanctionsValue: "None listed (Russian Fed)" },
      { field: "Registered Entity", customerValue: "UK Companies House #0881928", sanctionsValue: "UAE / Cyprus Shell" },
      { field: "Ownership Structure", customerValue: "100% UK Institutional", sanctionsValue: "Specially Designated National" }
    ],
    auditTrail: [
      {
        timestamp: "2026-09-24 08:30:12 UTC",
        user: "BATCH_RFC_S4H",
        action: "REPLICATION_CREATED",
        oldStatus: "NEW",
        newStatus: "BLOCKED",
        comment: "Initial screening check triggered by S/4HANA BP replication. Match score 84% exceeded threshold (75%).",
        sourceSystem: "SAP GTS /SAPSLL/SPL_CHCK"
      }
    ]
  },
  {
    id: "BP-100892",
    partnerNumber: "100892",
    role: "Ship-To Party (WE)",
    name: "Al-Sham Global Trading FZE",
    matchedEntity: "AL SHAM TRADING & LOGISTICS NETWORK",
    street: "Warehouse 14, Al-Quoz Industrial 3",
    city: "Dubai",
    country: "AE",
    postalCode: "P.O. Box 71822",
    screeningList: "OFAC Specially Designated Nationals (SDN) [SYRIA / IRAN-EO13846]",
    matchScore: 96,
    status: "BLOCKED",
    blockReason: "Direct exact match (96%) with known illicit transshipment facilitator",
    validityStart: "2023-06-15",
    validityEnd: "9999-12-31",
    scenario: "Scenario 2: Real Blocked Partner (Strict Sanctions)",
    scenarioDesc: "Entity appears on the OFAC SDN list as a secondary sanctions transshipment intermediary. Releasing this partner is a direct violation of international law. The block must be confirmed and documented.",
    recommendedAction: "CONFIRM_BLOCK",
    evidence: [
      { field: "Listed Entity Match", customerValue: "Al-Sham Global Trading", sanctionsValue: "Al Sham Trading & Logistics" },
      { field: "Known Aliases", customerValue: "Al Sham FZE", sanctionsValue: "Al Sham Express Cargo, ASTL FZE" },
      { field: "BIS Red Flag Indicator", customerValue: "High-risk transshipment port", sanctionsValue: "Identified in BIS Guidance Notice #2024-03" }
    ],
    auditTrail: [
      {
        timestamp: "2026-09-24 09:15:00 UTC",
        user: "BATCH_RFC_S4H",
        action: "REPLICATION_CREATED",
        oldStatus: "NEW",
        newStatus: "BLOCKED",
        comment: "Automated screening against OFAC SDN List 2026. Match score 96%. Immediate hard block applied.",
        sourceSystem: "SAP GTS /SAPSLL/SPL_CHCK"
      }
    ]
  }
];

export const INITIAL_DOCUMENTS = [
  {
    id: "DOC-80000452",
    docNumber: "80000452",
    docType: "Sales Order (TA)",
    feederSystem: "S4H_100",
    partner: "AeroTech Components Ltd (100420)",
    customerName: "AeroTech Components Ltd",
    country: "GB",
    salesOrg: "1010 (US East Sales)",
    distributionChannel: "10 (Direct)",
    division: "00 (Cross-Division)",
    netValue: "185,400.00",
    currency: "USD",
    priority: "HIGH",
    owner: "Unassigned",
    lastChanged: "Today, 08:35",
    status: "BLOCKED", // BLOCKED, UNDER_REVIEW, RELEASED, CONFIRMED_BLOCK
    blockReason: "SPL potential match & Missing Dual-Use Export License",
    scenario: "Scenario 3: Missing Dual-Use Export License",
    scenarioDesc: "The line item contains an optical inertial navigation unit (ECCN 7A103.b). S/4HANA replicated the sales order, but GTS identified that no valid export authorization or license exists for UK end-use without explicit BIS or NLR determination.",
    material: "MAT-7720 (Inertial Optical Gyroscope Unit)",
    eccn: "7A103.b",
    incoterms: "DAP (Farnborough Airport)",
    downstreamImpact: {
      s4Status: "Delivery Block 01 (GTS Legal Block) in VBAK/VBEP",
      ewmStatus: "Outbound Delivery creation prohibited. Warehouse picking cannot be scheduled.",
      actionToUnblock: "Assign active BIS License LIC-US-2026-094 and execute recheck."
    },
    complianceCards: {
      spl: {
        status: "BLOCKED",
        rule: "Rule SPL_US_DEFAULT (Fuzzy Threshold 75%)",
        input: "AeroTech Components Ltd, GB",
        result: "Match 84% on Denied Persons List",
        reason: "Phonetic similarity with Aero Technologies",
        nextAction: "Release partner in BP worklist or override with False-Positive rationale"
      },
      legalControl: {
        status: "BLOCKED",
        rule: "Export Administration Regulations (US_EAR) / Commerce Control List",
        input: "ECCN 7A103.b / Value $185,400 / Dest GB",
        result: "No valid license assigned",
        reason: "Item requires individual validated license or License Exception STA",
        nextAction: "Assign License in 'Manage Licenses' or apply License Exception"
      },
      embargo: {
        status: "PASSED",
        rule: "Global Embargo Check (OFAC / EU / UN)",
        input: "Destination Country: United Kingdom (GB)",
        result: "No active country embargo",
        reason: "United Kingdom is a recognized NATO ally, no embargo restrictions",
        nextAction: "None"
      },
      completeness: {
        status: "PASSED",
        rule: "Customs Document Completeness Check",
        input: "Line Items, End-User, Net Mass, Incoterms",
        result: "All mandatory customs header and item fields populated",
        reason: "Feeder replication completed without schema validation errors",
        nextAction: "None"
      }
    },
    documentFlow: [
      { step: "S/4HANA Sales Order Created", system: "S/4HANA", status: "COMPLETED", detail: "SO 80000452 created by Sales Rep John Miller" },
      { step: "Replication via qRFC (CIF)", system: "Integration Layer", status: "COMPLETED", detail: "Queue S4H_SO_80000452 dispatched to GTS" },
      { step: "GTS Legal & SPL Evaluation", system: "SAP GTS", status: "BLOCKED", detail: "GTS Customs Doc 20000981 created with Block status" },
      { step: "Compliance Officer Review", system: "SAP GTS", status: "PENDING", detail: "Awaiting Compliance Officer adjudication" },
      { step: "S/4HANA Feeder Block Status", system: "S/4HANA", status: "BLOCKED", detail: "VBAK-LIFSK set to '01' (Legal Control Block)" },
      { step: "EWM Warehouse Staging", system: "SAP EWM", status: "HELD", detail: "Outbound Delivery Order held in status 'Not Released'" }
    ],
    auditTrail: [
      {
        timestamp: "2026-09-24 08:35:04 UTC",
        user: "S4H_RFC_USER",
        action: "REPLICATION_BLOCKED",
        oldStatus: "NEW",
        newStatus: "BLOCKED",
        comment: "Document 80000452 replicated from S/4HANA. Both SPL screening and Legal Control evaluated as BLOCKED.",
        sourceSystem: "SAP GTS /SAPSLL/BL_DOCS"
      }
    ]
  },
  {
    id: "DOC-45000129",
    docNumber: "45000129",
    docType: "Purchase Order (NB)",
    feederSystem: "S4H_100",
    partner: "Global Parts Logistics (100311)",
    customerName: "Global Parts Logistics Inc",
    country: "US",
    salesOrg: "1010",
    distributionChannel: "20",
    division: "00",
    netValue: "64,200.00",
    currency: "USD",
    priority: "MEDIUM",
    owner: "Sarah Jenkins",
    lastChanged: "Today, 09:10",
    status: "UNDER_REVIEW",
    blockReason: "Import Control missing declaration permit",
    scenario: "Scenario 4: Import Certification Verification",
    scenarioDesc: "Specialty chemicals imported from US manufacturing facility require End-Use statement and chemical pre-notification registration.",
    material: "MAT-3310 (Fluorinated Polyimide Resin)",
    eccn: "1C008",
    incoterms: "FOB (Newark)",
    downstreamImpact: {
      s4Status: "PO Confirmation locked, GR blocked in MIGO",
      ewmStatus: "Inbound Delivery notification cannot generate Warehouse Task",
      actionToUnblock: "Verify Toxic Substances Control Act (TSCA) certificate and release"
    },
    complianceCards: {
      spl: { status: "PASSED", rule: "SPL Check", input: "Global Parts Logistics", result: "0% match", reason: "Cleared", nextAction: "None" },
      legalControl: { status: "UNDER_REVIEW", rule: "Import Legal Control", input: "MAT-3310 / US", result: "Permit Pending", reason: "TSCA cert attached", nextAction: "Verify cert" },
      embargo: { status: "PASSED", rule: "Embargo Check", input: "US", result: "Cleared", reason: "No embargo", nextAction: "None" },
      completeness: { status: "PASSED", rule: "Data Check", input: "PO lines", result: "Complete", reason: "All fields valid", nextAction: "None" }
    },
    documentFlow: [
      { step: "Purchase Order Created", system: "S/4HANA", status: "COMPLETED", detail: "PO 45000129 created in Plant 1010" },
      { step: "GTS Import Screening", system: "SAP GTS", status: "UNDER_REVIEW", detail: "Under active compliance review by Sarah Jenkins" }
    ],
    auditTrail: [
      {
        timestamp: "2026-09-24 09:10:22 UTC",
        user: "SJENKINS",
        action: "STATUS_CHANGE",
        oldStatus: "BLOCKED",
        newStatus: "UNDER_REVIEW",
        comment: "Officer assigned. Reviewing attached TSCA certificate.",
        sourceSystem: "SAP GTS /SAPSLL/BL_DOCS"
      }
    ]
  },
  {
    id: "DOC-80000461",
    docNumber: "80000461",
    docType: "Outbound Delivery (LF)",
    feederSystem: "S4H_100",
    partner: "Euro Parts Express (100552)",
    customerName: "Euro Parts Express GmbH",
    country: "DE",
    salesOrg: "1010",
    distributionChannel: "10",
    division: "00",
    netValue: "92,000.00",
    currency: "EUR",
    priority: "HIGH",
    owner: "Unassigned",
    lastChanged: "Yesterday, 16:45",
    status: "BLOCKED",
    blockReason: "Transshipment transit route embargo trigger",
    scenario: "Scenario 5: EWM Blocked by GTS (Embargo & Route Risk)",
    scenarioDesc: "Shipment intended for Germany was routed with a carrier connecting through an embargoed maritime transit corridor. Downstream EWM picking is totally halted until rerouted.",
    material: "MAT-9010 (Electronic Sensor Assemblies)",
    eccn: "EAR99",
    incoterms: "CIP (Frankfurt Airport)",
    downstreamImpact: {
      s4Status: "Delivery 80000461 Goods Issue Blocked (LIKP-SPE_LOEKZ = 'X')",
      ewmStatus: "EWM Warehouse Order 400192 on hold. Picking waves cancelled.",
      actionToUnblock: "Update Carrier route to direct transatlantic flight, re-trigger Embargo check"
    },
    complianceCards: {
      spl: { status: "PASSED", rule: "SPL Check", input: "Euro Parts Express", result: "Cleared", reason: "No matches", nextAction: "None" },
      legalControl: { status: "PASSED", rule: "EAR99 Export Check", input: "EAR99 to DE", result: "NLR (No License Required)", reason: "Commercial item", nextAction: "None" },
      embargo: { status: "BLOCKED", rule: "Transit Route Embargo Screening", input: "Port Transshipment Route", result: "Flagged Transit Hub", reason: "Carrier transit includes high-risk corridor", nextAction: "Reroute with approved freight forwarder" },
      completeness: { status: "PASSED", rule: "Data Check", input: "Delivery items", result: "Complete", reason: "Valid", nextAction: "None" }
    },
    documentFlow: [
      { step: "Delivery Created in S/4HANA", system: "S/4HANA", status: "COMPLETED", detail: "Delivery 80000461" },
      { step: "GTS Route Check", system: "SAP GTS", status: "BLOCKED", detail: "Flagged transit zone embargo" },
      { step: "EWM Picking Queue Blocked", system: "SAP EWM", status: "BLOCKED", detail: "Wave 104 picking cancelled due to GTS block" }
    ],
    auditTrail: [
      {
        timestamp: "2026-09-23 16:45:10 UTC",
        user: "SYSTEM_GTS",
        action: "EMBARGO_BLOCKED",
        oldStatus: "NEW",
        newStatus: "BLOCKED",
        comment: "Transit node triggers embargo screening rule US_OFAC_CRIMEA_TRANSIT.",
        sourceSystem: "SAP GTS /SAPSLL/EMBARGO"
      }
    ]
  }
];

export const INITIAL_LICENSES = [
  {
    id: "LIC-US-2026-094",
    licenseNumber: "D198421",
    type: "BIS Validated Export License",
    legalRegulation: "US_EAR",
    description: "Export authorization for inertial navigation sensors to UK aerospace sector",
    issuingAuthority: "US Department of Commerce / BIS",
    validFrom: "2026-01-01",
    validTo: "2028-12-31",
    allocatedValue: "1,200,000.00",
    depletedValue: "432,000.00",
    remainingValue: "768,000.00",
    currency: "USD",
    status: "ACTIVE",
    eligibleCountries: ["GB", "CA", "AU", "NZ"],
    eligibleEccn: ["7A103.a", "7A103.b", "7D001"],
    assignedDocuments: ["DOC-80000390", "DOC-80000412"]
  },
  {
    id: "LIC-EU-2026-018",
    licenseNumber: "EU-GEN-001",
    type: "Union General Export Authorisation (UGEA 001)",
    legalRegulation: "EU_DUAL_USE",
    description: "General authorization for Annex II dual-use transfers to specific destinations",
    issuingAuthority: "BAFA (Germany) / European Commission",
    validFrom: "2025-01-01",
    validTo: "2027-12-31",
    allocatedValue: "5,000,000.00",
    depletedValue: "4,910,000.00",
    remainingValue: "90,000.00",
    currency: "EUR",
    status: "EXPIRING_QUOTA",
    eligibleCountries: ["US", "JP", "CH", "NO"],
    eligibleEccn: ["1C008", "5A002"],
    assignedDocuments: ["DOC-70001928", "DOC-70002100"]
  }
];

export const INITIAL_CUSTOMS_DECLARATIONS = [
  {
    id: "DEC-2026-00419",
    declarationNumber: "EXP-US-89102",
    customsOffice: "US Customs & Border Protection (Port of Newark 4601)",
    exporter: "Nexus Aerospace Systems LLC",
    consignee: "British Defense Equipment Ltd",
    declarationType: "Electronic Export Information (EEI / AES)",
    status: "CLEARED", // SUBMITTED, CLEARED, EXIT_OVERDUE, REJECTED
    submissionDate: "2026-09-20",
    exitDeadline: "2026-09-27",
    mrn: "26US4601EXP99182",
    itnNumber: "X20260920491823",
    lines: 3,
    netMass: "1,420 KG",
    customsValue: "340,000.00 USD"
  },
  {
    id: "DEC-2026-00488",
    declarationNumber: "ATLAS-DE-10928",
    customsOffice: "Hauptzollamt Frankfurt am Main (DE005851)",
    exporter: "Nexus European Logistics GmbH",
    consignee: "Tokyo Precision Machining KK",
    declarationType: "ATLAS Ausfuhr (Standard Export)",
    status: "EXIT_OVERDUE",
    submissionDate: "2026-09-02",
    exitDeadline: "2026-09-16",
    daysOverdue: 8,
    mrn: "26DE585100918291M4",
    lines: 2,
    netMass: "840 KG",
    customsValue: "185,000.00 EUR",
    overdueWarning: "MRN confirmation of exit has NOT been received from the customs office of exit (Hamburg Port) within the statutory 14 days. Value Added Tax (VAT) exemption risk!"
  }
];

export const INITIAL_INTEGRATION_QUEUES = [
  {
    queueName: "S4H_GTS_BP_100420",
    direction: "INBOUND",
    status: "STOPPED",
    retries: 3,
    lastError: "Lock conflict on table /SAPSLL/CORA while batch screening partner 100420",
    tcode: "SMQ2",
    docRef: "BP 100420"
  },
  {
    queueName: "S4H_SO_80000452",
    direction: "INBOUND",
    status: "PROCESSED",
    retries: 0,
    lastError: "None",
    tcode: "SMQ2",
    docRef: "Sales Order 80000452"
  },
  {
    queueName: "GTS_S4H_STATUS_UPDATE",
    direction: "OUTBOUND",
    status: "WAITING",
    retries: 0,
    lastError: "Pending compliance officer adjudication",
    tcode: "SMQ1",
    docRef: "GTS Block Feeder Sync"
  }
];

export const REASON_CODES = [
  { code: "RC01", label: "RC01 — False Positive: Identity disproved by Government Tax ID / Passport", requiresComment: true },
  { code: "RC02", label: "RC02 — Name Dissimilarity: Phonetic overlap cleared after structural review", requiresComment: true },
  { code: "RC03", label: "RC03 — Valid Export License: Government authorization assigned & verified", requiresComment: true },
  { code: "RC04", label: "RC04 — License Exception: Qualified under STA / TSR / GBS regulations", requiresComment: true },
  { code: "RC05", label: "RC05 — Feeder Data Corrected: Typo in destination or consignee fixed in S/4HANA", requiresComment: true },
  { code: "RC09", label: "RC09 — Legal Authority Escalation: Specific approval received from Legal Counsel", requiresComment: true }
];

export const ROLES = [
  {
    id: "COMPLIANCE_OFFICER",
    title: "Trade Compliance Officer",
    badge: "🛡️ Lead Officer",
    focus: "Review, block, release, reason codes, audit trail, 4-eyes principle",
    description: "Responsible for evaluating high-risk sanction matches, embargo triggers, and authorizing legal releases."
  },
  {
    id: "GTS_CONSULTANT",
    title: "SAP GTS Consultant",
    badge: "⚙️ Implementation Lead",
    focus: "Configuration, legal regulation determination, SPRO paths, interface troubleshooting",
    description: "Focuses on how SAP GTS is architected, how screening thresholds are tuned, and how qRFC queues integrate with S/4HANA."
  },
  {
    id: "EXPORT_CONTROL_SPECIALIST",
    title: "Export Control Specialist",
    badge: "📜 Licensing Authority",
    focus: "Licenses, quotas, legal regulations (EAR, ITAR), ECCN classification",
    description: "Maintains government licenses, allocates depreciation quotas, and resolves dual-use export authorization blocks."
  },
  {
    id: "CUSTOMS_SPECIALIST",
    title: "Customs Specialist",
    badge: "🚢 Customs Broker",
    focus: "Export declarations, AES/ATLAS transmission, exit confirmations, MRN tracking",
    description: "Monitors customs boundary clearances, overdue proof of exit, and prevents unexpected VAT liabilities."
  },
  {
    id: "EWM_INTEGRATION_CONSULTANT",
    title: "EWM Integration Consultant",
    badge: "📦 Logistics Lead",
    focus: "Warehouse order blocks, wave picking halts, delivery status sync",
    description: "Analyzes the downstream warehouse impact when GTS holds deliveries and ensures smooth picking upon compliance clearance."
  }
];
