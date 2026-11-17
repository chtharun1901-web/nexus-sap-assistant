/**
 * Nexus Data Visualizations - Metaphor Presets
 * Covers all 9 requested everyday & travel equipment metaphors:
 * 1. Containers / Storage Boxes (Crates & Glass Jars)
 * 2. Umbrellas (Overarching concepts & protection)
 * 3. Magnifying Glasses / Microscopes (Deep-dive zooming)
 * 4. Ladders (Stepping up & progression)
 * 5. Puzzle Pieces (Interlocking modules)
 * 6. Compass / Sextant (Strategic direction & core vision)
 * 7. Roads / Highways (Milestones, forks & roadmaps)
 * 8. Signposts (Directional choices & decision branches)
 * 9. Rockets & Balloons (Scaling, launching & high-level trajectories)
 */

export const METAPHOR_TYPES = {
  FLOW: "flow",
  CONTAINERS: "containers",
  UMBRELLA: "umbrella",
  MAGNIFYING: "magnifying",
  LADDER: "ladder",
  PUZZLE: "puzzle",
  COMPASS: "compass",
  ROADMAP: "roadmap",
  SIGNPOST: "signpost",
  ROCKET: "rocket"
};

export const METAPHOR_CATALOG = [
  {
    id: METAPHOR_TYPES.FLOW,
    name: "Flow & Pipeline Architecture",
    category: "Process & System Flows",
    icon: "🔀",
    tagline: "Sequential pipeline, decision forks & conduits (Opus 5.5 grade)",
    description: "Enterprise system pipeline with stage swimlanes, decision bifurcations, qRFC conduits, and step-by-step state verification."
  },
  {
    id: METAPHOR_TYPES.CONTAINERS,
    name: "Containers & Storage Crates",
    category: "Everyday Goods & Tools",
    icon: "📦",
    tagline: "Categorization, storage buckets & partitioned components",
    description: "Labeled wooden crates and clear glass jars organizing data batches, inventory types, or domain repositories."
  },
  {
    id: METAPHOR_TYPES.UMBRELLA,
    name: "Overarching Umbrella",
    category: "Everyday Goods & Tools",
    icon: "☂️",
    tagline: "Overarching concepts, governance & protective boundaries",
    description: "A wide canopy sheltering sub-elements, pillars, risk controls, or modular streams beneath a single vision."
  },
  {
    id: METAPHOR_TYPES.MAGNIFYING,
    name: "Magnifying Glass / Zoom",
    category: "Everyday Goods & Tools",
    icon: "🔍",
    tagline: "Zooming from high-level architecture into forensic detail",
    description: "Dual-zone display with panoramic system context on one side and an optical lens drill-down on the other."
  },
  {
    id: METAPHOR_TYPES.LADDER,
    name: "Progression Ladder",
    category: "Everyday Goods & Tools",
    icon: "🪜",
    tagline: "Stepping up, skill tiers, maturity levels & achievements",
    description: "Rung-by-rung vertical ascent from foundational setup to peak strategic mastery with milestone badges."
  },
  {
    id: METAPHOR_TYPES.PUZZLE,
    name: "Interlocking Puzzle",
    category: "Everyday Goods & Tools",
    icon: "🧩",
    tagline: "Interlocking components forming an integrated whole",
    description: "Interlocking jigsaw segments showing how departments, microservices, or functional units click together."
  },
  {
    id: METAPHOR_TYPES.COMPASS,
    name: "Strategic Compass",
    category: "Navigation & Travel",
    icon: "🧭",
    tagline: "Core direction, corporate pillars & guiding principles",
    description: "Marine brass compass rose with North, South, East, and West cardinal alignments guiding business values."
  },
  {
    id: METAPHOR_TYPES.ROADMAP,
    name: "Highway & Crossroads",
    category: "Navigation & Travel",
    icon: "🛣️",
    tagline: "Project highway, milestone rest-stops & crossroads",
    description: "An asphalt highway with mile markers, road signs, obstacle detours, and an aspirational horizon destination."
  },
  {
    id: METAPHOR_TYPES.SIGNPOST,
    name: "Directional Signpost",
    category: "Navigation & Travel",
    icon: "🪧",
    tagline: "Decision paths, alternative choices & trade-off forks",
    description: "Rustic wooden trail signposts pointing in multiple directions with distances, effort tiers, and strategic trade-offs."
  },
  {
    id: METAPHOR_TYPES.ROCKET,
    name: "Ascending Rocket & Balloon",
    category: "Navigation & Travel",
    icon: "🚀",
    tagline: "Scaling, booster stages & stratospheric flight paths",
    description: "Multi-stage rocket and high-altitude hot air balloon rising through atmosphere layers to target orbital scaling."
  }
];

export const PRESET_DIAGRAMS = {
  [METAPHOR_TYPES.CONTAINERS]: {
    title: "Enterprise Data Categorization & Storage Repository",
    subtitle: "Organized inventory of transactional, master, and telemetry records",
    metaphor: METAPHOR_TYPES.CONTAINERS,
    themeColor: "#8B4513",
    containers: [
      {
        id: "c-1",
        label: "Master Data Crate",
        type: "wooden_crate",
        capacity: "94% Allocated",
        items: [
          { name: "Business Partner (BP)", count: "148,200", status: "Verified" },
          { name: "Material Master (MARA/MARC)", count: "32,450", status: "Active" },
          { name: "Work Centers (CRHD)", count: "840", status: "Audited" }
        ],
        badge: "Tier 1 Storage"
      },
      {
        id: "c-2",
        label: "Transactional Queue Crate",
        type: "wooden_crate",
        capacity: "72% In-Flight",
        items: [
          { name: "Sales Orders (VBAK)", count: "12,980/day", status: "Processing" },
          { name: "Outbound Deliveries (LIKP)", count: "8,400/day", status: "Staged" },
          { name: "Transfer Orders (/SCWM/TO)", count: "24,110/day", status: "Queued" }
        ],
        badge: "High Throughput"
      },
      {
        id: "c-3",
        label: "Compliance & Security Jar",
        type: "glass_jar",
        capacity: "Translucent Audit Vault",
        items: [
          { name: "OFAC / UN Sanctions List", count: "18,400 Records", status: "Grounded" },
          { name: "Export Control Licenses", count: "412 Active", status: "Valid" },
          { name: "Immutable Audit Log", count: "1.2M Events", status: "Encrypted" }
        ],
        badge: "Zero-Trust Vault"
      },
      {
        id: "c-4",
        label: "Analytics & Telemetry Bin",
        type: "storage_bin",
        capacity: "Streaming Kafka Lake",
        items: [
          { name: "Real-time Queue Latency", count: "14ms Avg", status: "Healthy" },
          { name: "bgRFC Failure Alerts", count: "0 Unresolved", status: "Optimal" },
          { name: "Fiori UI Event Stream", count: "480k hits/hr", status: "Active" }
        ],
        badge: "Observability"
      }
    ]
  },

  [METAPHOR_TYPES.UMBRELLA]: {
    title: "Global Supply Chain Governance Umbrella",
    subtitle: "Overarching risk mitigation canopy shielding downstream operations",
    metaphor: METAPHOR_TYPES.UMBRELLA,
    themeColor: "#1E3A8A",
    canopyTitle: "Unified Enterprise Trade & Compliance Framework",
    canopySubtitle: "Global Governance & Continuous Regulatory Shield",
    ribs: [
      { id: "rib-1", label: "Trade Compliance", sublabel: "OFAC / BIS / SCOMET", status: "Covered", color: "#3B82F6" },
      { id: "rib-2", label: "Warehouse Integrity", sublabel: "SAP EWM / High-Bay FIFO", status: "Protected", color: "#10B981" },
      { id: "rib-3", label: "Financial Governance", sublabel: "SOX / Audit Trails / SLG1", status: "Hardened", color: "#F59E0B" },
      { id: "rib-4", label: "Data Protection", sublabel: "GDPR / ISO 27001 / Zero Trust", status: "Active", color: "#8B5CF6" }
    ],
    shelteredElements: [
      { id: "sh-1", title: "Order Execution", desc: "Automated blocked document release with secondary review checks." },
      { id: "sh-2", title: "Carrier Dispatch", desc: "Real-time customs clearance prior to yard departure gates." },
      { id: "sh-3", title: "Financial Settlement", desc: "Three-way invoice match with cryptographic transaction logs." },
      { id: "sh-4", title: "Partner Network", desc: "Daily sanctions screening against UN & OFAC consolidated gazettes." }
    ],
    rainHazards: [
      "Embargo Violations", "Unverified Business Partners", "Data Breaches", "Border Hold Delays", "Audit Penalties"
    ]
  },

  [METAPHOR_TYPES.MAGNIFYING]: {
    title: "System Landscape: Macro View & Forensic Drill-Down",
    subtitle: "Zooming from end-to-end architecture into critical qRFC pipeline bottleneck",
    metaphor: METAPHOR_TYPES.MAGNIFYING,
    themeColor: "#0D9488",
    macroView: {
      title: "End-to-End Enterprise Topology",
      nodes: [
        { id: "m-1", label: "S/4HANA Core ERP", type: "system", role: "Sales & Finance Origin" },
        { id: "m-2", label: "Integration Gateway", type: "gateway", role: "qRFC & CPI Layer (FOCUS AREA)" },
        { id: "m-3", label: "Decentralized EWM", type: "system", role: "Warehouse Yard Execution" },
        { id: "m-4", label: "Global Trade Services", type: "system", role: "Customs & Sanctions Screening" }
      ]
    },
    drillDown: {
      title: "Forensic Lens: qRFC Outbound Queue Pipeline (SMQ1)",
      magnification: "400x Deep Dive",
      inspectedComponent: "Queue Prefix: WM_DLV_STAGING_*",
      findings: [
        { metric: "Queue Depth", value: "1,420 LUWs", status: "Bottleneck", severity: "high" },
        { metric: "Root Cause", value: "Storage Bin Lock Collision in Bin 01-A-04", status: "Identified", severity: "critical" },
        { metric: "Error Code", value: "SYSFAIL / RFC_ERROR_SYSTEM_FAILURE", status: "Captured", severity: "high" },
        { metric: "Target Function", value: "/SCWM/EXECUTE_STAGING_DIRECT", status: "Frozen LUW", severity: "warning" },
        { metric: "Remediation", value: "Clear lock in SM12, trigger selective resubmit", status: "Verified", severity: "safe" }
      ]
    }
  },

  [METAPHOR_TYPES.LADDER]: {
    title: "Enterprise Transformation Maturity Ladder",
    subtitle: "Rung-by-rung ascent from legacy ECC to autonomous intelligent ERP",
    metaphor: METAPHOR_TYPES.LADDER,
    themeColor: "#D97706",
    rungs: [
      {
        step: 5,
        title: "Autonomous Enterprise Operations",
        level: "Rung 5 — Pinnacle",
        metric: "99.98% Automation",
        desc: "Self-healing qRFC queues, predictive inventory replenishment & proactive compliance triage.",
        badge: "★ Autonomous Future",
        isTarget: true
      },
      {
        step: 4,
        title: "Grounded AI Copilot & Real-Time Orchestration",
        level: "Rung 4 — Advanced",
        metric: "Sub-Second Decisioning",
        desc: "Nexus AI assistants diagnosing queue halts, instant runbook synthesis, interactive diagrams.",
        badge: "Current Milestone",
        isCurrent: true
      },
      {
        step: 3,
        title: "S/4HANA Embedded Architecture",
        level: "Rung 3 — Core Modernization",
        metric: "Unified Database",
        desc: "Migration from classic WM to embedded EWM, single-tenant master data, Fiori user experience.",
        badge: "Completed"
      },
      {
        step: 2,
        title: "Standardized Data & Process Harmonization",
        level: "Rung 2 — Intermediate",
        metric: "Global Governance",
        desc: "Global business partner consolidation, harmonized chart of accounts, centralized SPRO rules.",
        badge: "Completed"
      },
      {
        step: 1,
        title: "Legacy Monolith Foundation",
        level: "Rung 1 — Ground Baseline",
        metric: "Manual Silos",
        desc: "Decentralized classic ERP, batch CIF interfaces, manual nightly spreadsheet reconciliations.",
        badge: "Legacy Baseline"
      }
    ]
  },

  [METAPHOR_TYPES.PUZZLE]: {
    title: "Enterprise Digital Core: Interlocking Capabilities",
    subtitle: "Seamless jigsaw fit connecting logistics, finance, trade, and AI intelligence",
    metaphor: METAPHOR_TYPES.PUZZLE,
    themeColor: "#7C3AED",
    pieces: [
      {
        id: "pz-1",
        label: "Supply & Staging (EWM)",
        position: "Top-Left",
        color: "#3B82F6",
        features: ["Production Material Request (PMR)", "Wave Management", "High-Bay Yard Cockpit"],
        connectsWith: ["pz-2", "pz-3"]
      },
      {
        id: "pz-2",
        label: "Trade & Compliance (GTS)",
        position: "Top-Right",
        color: "#EF4444",
        features: ["Sanctioned Party Screening", "Customs Export Declarations", "License Determination"],
        connectsWith: ["pz-1", "pz-4"]
      },
      {
        id: "pz-3",
        label: "Order & Billing (SD / FI)",
        position: "Bottom-Left",
        color: "#10B981",
        features: ["Sales Order Copy Control", "Revenue Recognition", "Instant Customer Billing"],
        connectsWith: ["pz-1", "pz-4"]
      },
      {
        id: "pz-4",
        label: "Grounded AI Intelligence (Nexus)",
        position: "Bottom-Right",
        color: "#F59E0B",
        features: ["Zero-Hallucination Citations", "Queue Failure Self-Triage", "Visual Process Mapping"],
        connectsWith: ["pz-2", "pz-3"]
      }
    ],
    interlockCore: "Single Source of Truth (S/4HANA In-Memory CDS Core)"
  },

  [METAPHOR_TYPES.COMPASS]: {
    title: "Strategic Vision & Architecture Compass",
    subtitle: "Guiding principles aligning technology investments with business destiny",
    metaphor: METAPHOR_TYPES.COMPASS,
    themeColor: "#B45309",
    centerCore: "Customer Trust & Business Velocity",
    cardinals: {
      north: {
        code: "N",
        label: "North Star: Uncompromising Reliability",
        theme: "99.999% Service Availability",
        initiatives: [
          "Zero downtime rolling maintenance",
          "Automated failover across multi-region BTP clusters",
          "Hardened DR failover under 60 seconds"
        ]
      },
      south: {
        code: "S",
        label: "South Anchor: Zero-Trust Security & Compliance",
        theme: "Regulatory Grounding",
        initiatives: [
          "100% verified official source screening",
          "Continuous cryptographic audit trails",
          "Strict data sovereignty across international boundaries"
        ]
      },
      east: {
        code: "E",
        label: "East Horizon: Continuous AI Innovation",
        theme: "Next-Gen Capabilities",
        initiatives: [
          "Autonomous queue triage and self-healing",
          "Natural language visual modeling engines",
          "Predictive inventory and logistics intelligence"
        ]
      },
      west: {
        code: "W",
        label: "West Anchor: Operational Simplicity",
        theme: "Human-Centric UX",
        initiatives: [
          "Streamlined Fiori user interfaces",
          "One-click editable vector illustration exports",
          "Zero-friction onboarding for compliance officers"
        ]
      }
    }
  },

  [METAPHOR_TYPES.ROADMAP]: {
    title: "S/4HANA Cloud Transformation Highway",
    subtitle: "Asphalt roadmap with milestones, detour options, and destination horizon",
    metaphor: METAPHOR_TYPES.ROADMAP,
    themeColor: "#334155",
    horizonGoal: "Full Cloud-Native Intelligent Enterprise (2027)",
    highwayStops: [
      {
        mile: "Mile 0",
        phase: "Phase 1: Discovery & Code Clean-Up",
        status: "Passed",
        eta: "Q1 Completed",
        details: "Custom code sanitization (ABAP Test Cockpit), obsolete table retirement, HANA sizing.",
        roadSign: "ENTER HIGHWAY"
      },
      {
        mile: "Mile 25",
        phase: "Phase 2: Core Data Migration",
        status: "Passed",
        eta: "Q2 Completed",
        details: "Business Partner CVI synchronization, financial ledger reconciliation, mock cutover 1.",
        roadSign: "SPEED CHECK 100%"
      },
      {
        mile: "Mile 50",
        phase: "Phase 3: Integration Crossroad & Pilot Launch",
        status: "Active",
        eta: "Q3 Active Drive",
        details: "qRFC pipeline stress testing, embedded EWM pilot warehouse live, sanctions screening active.",
        roadSign: "JUNCTION AHEAD",
        isCurrent: true,
        forkOptions: [
          { route: "Route A (Direct S/4 Embedded)", rec: "Recommended for high-throughput speed" },
          { route: "Route B (Hybrid Decentralized)", rec: "Optional for isolated manufacturing facilities" }
        ]
      },
      {
        mile: "Mile 75",
        phase: "Phase 4: Global Rollout & Legacy Sunset",
        status: "Upcoming",
        eta: "Q4 Scheduled",
        details: "Multi-region wave rollouts across Europe and Asia-Pacific. Sunsetting old ECC 6.0 hardware.",
        roadSign: "EXPRESSWAY CLEAR"
      },
      {
        mile: "Mile 100",
        phase: "Phase 5: Autonomous Operations Horizon",
        status: "Destination",
        eta: "2027 Horizon",
        details: "Full AI copilot orchestration, continuous learning models, zero-manual queue triage.",
        roadSign: "DESTINATION REACHED"
      }
    ]
  },

  [METAPHOR_TYPES.SIGNPOST]: {
    title: "Strategic Architecture Decision Signpost",
    subtitle: "Evaluating trade-offs, deployment directions, and technical pathways",
    metaphor: METAPHOR_TYPES.SIGNPOST,
    themeColor: "#854D0E",
    postTitle: "Deployment Crossroad Junction",
    postLocation: "Architecture Review Board (ARB) Decision Point",
    signs: [
      {
        id: "sign-1",
        direction: "left",
        destination: "Embedded EWM in S/4HANA",
        distance: "Low Latency / Direct DB",
        woodTone: "#78350F",
        points: [
          "Zero CIF/RFC network overhead",
          "Unified master data without duplication",
          "Ideal for modern single-tenant landscapes"
        ],
        tradeoff: "Tied directly to ERP maintenance upgrade cycles"
      },
      {
        id: "sign-2",
        direction: "right",
        destination: "Decentralized EWM on NetWeaver",
        distance: "24/7 Warehouse Independence",
        woodTone: "#92400E",
        points: [
          "Operates independently during ERP downtime",
          "Isolated high-volume material handling pipelines",
          "Dedicated scaling for high-throughput hubs"
        ],
        tradeoff: "Requires continuous qRFC queue monitoring & CIF sync"
      },
      {
        id: "sign-3",
        direction: "forward",
        destination: "Cloud BTP Warehouse Microservices",
        distance: "Maximum Elasticity",
        woodTone: "#A16207",
        points: [
          "Serverless API-driven event handling",
          "Rapid iterative feature deployment",
          "Native integration with Nexus AI copilots"
        ],
        tradeoff: "Requires high-bandwidth cloud gateway connectivity"
      }
    ]
  },

  [METAPHOR_TYPES.ROCKET]: {
    title: "Enterprise Scaling & Launch Trajectory",
    subtitle: "Staged propulsion from launchpad to orbit with ascending vision balloons",
    metaphor: METAPHOR_TYPES.ROCKET,
    themeColor: "#BE123C",
    launchObjective: "Achieve 10x Operational Throughput & Global Scaling",
    stages: [
      {
        tier: "Stage 4 (Orbit)",
        title: "Orbital Payload: Global Autonomous Enterprise",
        altitude: "36,000 km Orbit",
        velocity: "11.2 km/s",
        desc: "Predictive trade routing, self-adjusting safety stock, multi-agent AI problem resolution.",
        badge: "Mission Objective"
      },
      {
        tier: "Stage 3 (Mesosphere)",
        title: "Stratospheric Cloud Acceleration",
        altitude: "85 km Altitude",
        velocity: "7.8 km/s",
        desc: "BTP integration suite active, all business partners screened against real-time global watchlists.",
        badge: "In Ascent"
      },
      {
        tier: "Stage 2 (Troposphere)",
        title: "Booster Ignition: Standardized Process Engines",
        altitude: "12 km Altitude",
        velocity: "3.2 km/s",
        desc: "Harmonized document flows, high-speed qRFC pipelines, unified UI across devices.",
        badge: "Separated & Active"
      },
      {
        tier: "Stage 1 (Launchpad)",
        title: "Base Ignition: Foundational Stability",
        altitude: "Ground Level (Sea Level)",
        velocity: "0 km/s Lift-off",
        desc: "Clean core governance, master data deduplication, robust security policies verified.",
        badge: "Ignition Confirmed"
      }
    ],
    balloons: [
      { id: "b-1", title: "Executive Strategy Balloon", altitude: "High Altitude Horizon View", color: "#EC4899" },
      { id: "b-2", title: "Operational Tactics Balloon", altitude: "Mid Altitude Regional Oversight", color: "#F97316" }
    ]
  },

  [METAPHOR_TYPES.FLOW]: {
    title: "SAP End-to-End Inbound Logistics & Trade Compliance Pipeline",
    subtitle: "Orchestrated asynchronous flow with decision forks, qRFC queue gateway & EWM staging (Opus 5.5 Flow)",
    metaphor: METAPHOR_TYPES.FLOW,
    themeColor: "#6366F1",
    stages: [
      { id: "st-1", name: "1. Order Ingestion", lane: "Origin Layer" },
      { id: "st-2", name: "2. Queue & Gateway", lane: "Integration Layer" },
      { id: "st-3", name: "3. Compliance & Rules", lane: "Decision Layer" },
      { id: "st-4", name: "4. Warehouse Staging", lane: "Execution Layer" }
    ],
    nodes: [
      {
        id: "fn-1",
        stageId: "st-1",
        title: "Purchase Order Ingestion",
        category: "ORIGIN",
        desc: "PO creation in S/4HANA Core with item-level material master validation.",
        tcode: "ME21N / EKKO",
        badge: "Trigger",
        status: "COMPLETED",
        icon: "📄"
      },
      {
        id: "fn-2",
        stageId: "st-1",
        title: "Inbound Delivery Notification",
        category: "EVENT",
        desc: "Advance Shipping Notice (ASN) creates inbound delivery document in ERP.",
        tcode: "VL31N / LIKP",
        badge: "Event Trigger",
        status: "COMPLETED",
        icon: "🚚"
      },
      {
        id: "fn-3",
        stageId: "st-2",
        title: "Asynchronous Queue Gateway",
        category: "QUEUE",
        desc: "Outbound qRFC serialization buffer guaranteeing FIFO delivery to EWM.",
        tcode: "SMQ1 / SMQ2",
        badge: "12ms Buffer",
        status: "ACTIVE",
        icon: "⚡"
      },
      {
        id: "fn-4",
        stageId: "st-3",
        title: "GTS Sanctions Screening Check",
        category: "DECISION",
        desc: "Sanctions list screening check against OFAC / EU watchlists in real-time.",
        tcode: "/SAPSLL/SPL_REC",
        badge: "Decision Fork",
        isDecision: true,
        status: "DECISION",
        icon: "⚖️"
      },
      {
        id: "fn-5",
        stageId: "st-4",
        title: "EWM Warehouse Task Generation",
        category: "EXECUTION",
        desc: "Automatic putaway task creation to high-bay storage with destination bin search.",
        tcode: "/SCWM/PRDI / /SCWM/TO",
        badge: "Automated",
        status: "SCHEDULED",
        icon: "📦"
      },
      {
        id: "fn-6",
        stageId: "st-4",
        title: "Goods Receipt & Inventory Post",
        category: "TERMINAL",
        desc: "Posting GR updates unrestricted stock in S/4HANA & clears EWM staging bay.",
        tcode: "MIGO / /SCWM/GR",
        badge: "Final PGI",
        status: "STANDBY",
        icon: "✅"
      }
    ],
    connections: [
      { from: "fn-1", to: "fn-2", label: "ASN Event", type: "default" },
      { from: "fn-2", to: "fn-3", label: "qRFC CIF", type: "default" },
      { from: "fn-3", to: "fn-4", label: "Validate", type: "default" },
      { from: "fn-4", to: "fn-5", label: "Clear / Approved", type: "success" },
      { from: "fn-5", to: "fn-6", label: "Putaway Complete", type: "success" }
    ]
  }
};
