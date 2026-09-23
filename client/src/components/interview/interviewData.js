// Comprehensive Infosys & SAP Interview Master Data, Question Bank & Rubrics

export const INTERVIEW_CATEGORIES = [
  {
    id: "resume-project",
    name: "Resume & Project Experience",
    icon: "📄",
    description: "Deep dive into your project lifecycle, responsibilities, architecture design, and specific implementation contributions.",
    totalQuestions: 24,
    color: "#3B82F6",
    tags: ["Project", "Experience", "Architecture"]
  },
  {
    id: "sap-pp",
    name: "SAP PP (Production Planning)",
    icon: "⚙️",
    description: "BOMs, Routings, Work Centers, MRP, Production Orders, Capacity Planning, Shop Floor Control, and S/4HANA Manufacturing.",
    totalQuestions: 35,
    color: "#10B981",
    tags: ["PP", "MRP", "Shop Floor", "Manufacturing"]
  },
  {
    id: "sap-ewm",
    name: "SAP EWM (Extended Warehouse)",
    icon: "📦",
    description: "Warehouse Structure, Storage Types/Bins, PMR Staging, Putaway & Picking Strategies, POSC/LOSC, Wave Management, and Queues.",
    totalQuestions: 32,
    color: "#F97316",
    tags: ["EWM", "PMR", "Staging", "Warehouse"]
  },
  {
    id: "sap-mm-sd",
    name: "SAP MM & SD Integration",
    icon: "🔄",
    description: "Procure-to-Pay (P2P), Order-to-Cash (O2C), Material Master, Inventory Management, Movement Types, and Pricing/Billing.",
    totalQuestions: 26,
    color: "#8B5CF6",
    tags: ["MM", "SD", "P2P", "O2C"]
  },
  {
    id: "integration-arch",
    name: "Integration & Architecture",
    icon: "🔗",
    description: "qRFC (SMQ1/SMQ2), bgRFC (SBGRFCMON), IDocs, Web Services, S/4HANA Embedded vs Decentralized EWM, and CIF.",
    totalQuestions: 28,
    color: "#06B6D4",
    tags: ["qRFC", "bgRFC", "IDoc", "Architecture"]
  },
  {
    id: "abap-technical",
    name: "ABAP & Technical Development",
    icon: "💻",
    description: "BAdIs, User Exits, Enhancement Spots, CDS Views, AMDP, OData, Debugging, Dump Analysis (ST22), and Performance (SAT/ST05).",
    totalQuestions: 22,
    color: "#EC4899",
    tags: ["ABAP", "CDS", "BAdI", "Debugging"]
  },
  {
    id: "basis-troubleshoot",
    name: "Basis & Troubleshooting",
    icon: "🛠️",
    description: "System Logs (SM21), Job Management (SM37), Lock Entries (SM12), RFC Destinations (SM59), Application Logs (SLG1), and ST22.",
    totalQuestions: 20,
    color: "#6366F1",
    tags: ["Basis", "SM21", "ST22", "SM37"]
  },
  {
    id: "production-support",
    name: "Production Support & Incidents",
    icon: "🚨",
    description: "L2/L3 Incident triage, SLA governance, Root Cause Analysis (RCA), emergency fixes, queue restarts, and change governance.",
    totalQuestions: 30,
    color: "#EF4444",
    tags: ["Support", "L2/L3", "Incidents", "SLA", "RCA"]
  },
  {
    id: "scenario-based",
    name: "Scenario-Based Troubleshooting",
    icon: "🧩",
    description: "Real-world production situations: Stuck staging queues, missing PMRs, negative stock, scheduling blocks, and settlement failures.",
    totalQuestions: 25,
    color: "#F59E0B",
    tags: ["Scenario", "Production Issue", "Triage"]
  },
  {
    id: "behavioral-star",
    name: "Behavioral & STAR Method",
    icon: "⭐",
    description: "Situation, Task, Action, Result framework for handling pressure, conflict resolution, mistakes, teamwork, and client management.",
    totalQuestions: 25,
    color: "#EAB308",
    tags: ["STAR", "Behavioral", "Soft Skills"]
  },
  {
    id: "infosys-hr",
    name: "Infosys HR & Leadership",
    icon: "🏢",
    description: "Self-introduction, 'Why Infosys?', Strengths/Weaknesses, Career Goals, Client Relationship Management, and Culture fit.",
    totalQuestions: 20,
    color: "#14B8A6",
    tags: ["Infosys", "HR", "Introduction", "Culture"]
  },
  {
    id: "weak-areas",
    name: "Weak Areas & Revision",
    icon: "⚠️",
    description: "Targeted revision for questions marked for improvement or missed during mock interviews.",
    totalQuestions: 0,
    color: "#DC2626",
    tags: ["Revision", "Weak Spots", "Drills"]
  }
];

export const PRESET_INTERVIEW_QUESTIONS = [
  // SAP PP
  {
    id: "q-pp-1",
    categoryId: "sap-pp",
    question: "Explain the complete SAP PP manufacturing order lifecycle from planning to settlement.",
    difficulty: "Intermediate",
    tcodes: ["MD01N", "CO40", "CO01", "CO02", "CO11N", "MIGO", "KO88"],
    shortAnswer: "The SAP PP manufacturing order lifecycle begins with MRP creating Planned Orders (MD01N), which are converted to Production Orders (CO01/CO40). The order is released (REL), triggering component staging and shop-floor document printing. Operations are confirmed via CO11N/CO15, followed by Goods Receipt of the finished product (MIGO/101). Finally, Technical Completion (TECO) occurs and variances are settled to Costing via KO88.",
    keyPoints: [
      "MRP generation of Planned Orders and conversion to Production Orders",
      "Order status progression: CRTD -> REL -> PCNF/CNF -> DLV -> TECO -> CLSD",
      "Staging of components (Pick Parts, Crate Parts, Release Order Parts)",
      "Order confirmation for labor/machine capacity posting and auto goods issue (Backflush)",
      "Goods receipt into inventory and financial settlement to CO-PA"
    ],
    sapContext: "Production Planning & Detailed Scheduling (PP/DS) or classic MRP. Links PP Work Centers to CO Cost Centers for activity type rates and FI for inventory valuation.",
    example: "In a high-tech assembly line, releasing an order for 500 server racks triggers PMR creation in EWM for component staging. Assembly confirmation in CO11N issues screws and brackets via backflush, while MIGO posts the finished rack to 101 storage location.",
    followUps: [
      { q: "What is the difference between TECO and CLSD?", a: "TECO (Technically Complete) allows financial variance settlement but stops further logistical goods movements; CLSD (Closed) prevents any further financial or inventory postings permanently." },
      { q: "How does backflushing work and where is it configured?", a: "Backflush automatically posts goods issue (261) during operation confirmation. It is configured in the Material Master (MRP 2 view), Work Center, or BOM component." }
    ],
    commonMistakes: [
      "Confusing Planned Orders with Production Orders.",
      "Forgetting that cost settlement (KO88) cannot execute without TECO or DLV status."
    ],
    confidenceTip: "Emphasize both logistical document progression and financial CO settlement."
  },
  {
    id: "q-pp-2",
    categoryId: "sap-pp",
    question: "What is a Production Version (C223) and why is it mandatory in SAP S/4HANA PP?",
    difficulty: "Advanced",
    tcodes: ["C223", "CS01", "CA01", "MM02"],
    shortAnswer: "A Production Version defines the precise combination of a Bill of Materials (BOM) alternative and a Routing/Master Recipe alternative valid for a specific lot-size range and date interval. In S/4HANA, Production Versions are mandatory because MRP Live (MD01N) and S/4HANA manufacturing exclusively select master data through production versions for deterministic sourcing.",
    keyPoints: [
      "Binds BOM alternative + Routing group/counter + validity dates + lot sizes",
      "Mandatory in S/4HANA for MRP Live (MD01N) and Discrete/Process manufacturing order creation",
      "Created/Maintained via transaction C223 or mass created via CS_BOM_PRODVER_MIGRATION",
      "Eliminates ambiguity in BOM/Routing explosion during automated planning"
    ],
    sapContext: "Table MKAL stores production versions. Checked during order creation (CO01) and MRP explosion.",
    example: "If Plant 1000 produces Product X with BOM Alt 1 (standard components) for batches 1-500, but BOM Alt 2 (substitute components) for batches 501-5000, two separate Production Versions PV01 and PV02 govern the sourcing automatically.",
    followUps: [
      { q: "What happens in S/4HANA if a material has BOM and Routing but no Production Version?", a: "MRP Live generates an exception and will fail to create planned orders; order creation (CO01) will raise a blocking error stating 'No production version found'." }
    ],
    commonMistakes: [
      "Saying Production Versions were always mandatory in ECC 6.0 (they were optional in ECC discrete manufacturing, but became mandatory in S/4HANA)."
    ],
    confidenceTip: "Highlight the S/4HANA MRP Live performance rationale."
  },

  // SAP EWM
  {
    id: "q-ewm-1",
    categoryId: "sap-ewm",
    question: "Explain the difference between Delivery-Based Production Staging and PMR-Based Advanced Production Integration in SAP EWM.",
    difficulty: "Advanced",
    tcodes: ["/SCWM/PMR", "/SCWM/STAGE", "CO02", "/SCWM/MON"],
    shortAnswer: "Delivery-Based staging uses ERP Outbound Deliveries (movement type 311/261) replicated to EWM as Warehouse Requests to trigger staging warehouse tasks. In contrast, PMR (Production Material Request) represents the direct warehouse view of the manufacturing order without generating individual delivery documents, enabling item-level staging, single-component staging proposals, and shop-floor consumption right from the Production Supply Area (PSA).",
    keyPoints: [
      "Delivery-based: Uses ERP delivery documents; heavy RFC overhead; rigid document flow",
      "PMR-based: Direct manufacturing order integration (Advanced Production Integration); no intermediate deliveries",
      "PMR supports flexible staging methods: Pick Parts, Release Order Parts, Crate Parts",
      "Consumption posting in PMR directly issues goods to the order via transaction /SCWM/PMR or RF gun"
    ],
    sapContext: "Introduced in S/4HANA EWM and EWM 9.2+. Highly relevant for shop-floor manufacturing integration.",
    example: "In automotive component assembly, releasing Order 100492 creates a PMR in EWM. The warehouse manager executes /SCWM/STAGE to create warehouse tasks to move 200 brake pads from High-Rack storage (0010) to PSA bin PSA-LINE-01 without creating any ERP delivery documents.",
    followUps: [
      { q: "How is a PMR created in EWM?", a: "When a manufacturing order is saved or released in PP (CO01/CO02), S/4HANA automatically triggers the PMR creation in EWM via internal queues or bgRFC based on the control cycle." }
    ],
    commonMistakes: [
      "Stating that PMR generates outbound deliveries. PMR replaces outbound deliveries for staging."
    ],
    confidenceTip: "Clearly differentiate the document flow between classic and advanced integration."
  },

  // Integration & Queues
  {
    id: "q-arch-1",
    categoryId: "integration-arch",
    question: "How do you monitor, diagnose, and resolve stuck queues in SMQ1, SMQ2, and bgRFC in an S/4HANA EWM landscape?",
    difficulty: "Advanced",
    tcodes: ["SMQ1", "SMQ2", "SBGRFCMON", "SM59", "SLG1", "SM21", "ST22"],
    shortAnswer: "For outbound queues in SMQ1 and inbound queues in SMQ2, I inspect queue statuses (SYSFAIL, STOP, RETRY). Because queues are processed in FIFO order, the first failed LUW blocks all subsequent entries. I double-click to view the error text, inspect SLG1 application logs with object /SCWM/, and check ST22 for short dumps. For S/4HANA Embedded EWM bgRFC units, I use transaction SBGRFCMON and verify supervisor destinations in SBGRFPCUST. In production, I never delete queues; I fix the root cause and unlock/re-execute safely.",
    keyPoints: [
      "FIFO blockage mechanism: First blocked LUW stops the entire queue",
      "SMQ1 = Outbound sender monitor; SMQ2 = Inbound receiver monitor",
      "bgRFC = Modern transactional background unit monitored in SBGRFCMON",
      "Triage sequence: Status check -> SLG1/SM21 error inspection -> RFC destination test (SM59) -> Safe re-execution (F6)",
      "Strict production safeguard: Never delete live production queues to avoid orphaned business documents"
    ],
    sapContext: "Underpins all asynchronous cross-module and cross-system transactional data replication in SAP.",
    example: "A queue prefix WM_STG_2025 in SMQ2 entered STOP status due to a locked batch master record during parallel staging. Reviewing SLG1 revealed the lock conflict. Once the batch lock was released, activating the queue in SMQ2 processed all 350 pending transfer orders successfully.",
    followUps: [
      { q: "Why is bgRFC preferred over classic qRFC in S/4HANA Embedded EWM?", a: "bgRFC has significantly lower CPU overhead, supports fine-grained parallel processing, and avoids unnecessary network serialization when running inside the same S/4HANA database instance." }
    ],
    commonMistakes: [
      "Suggesting queue deletion as a standard troubleshooting step. Interviewers will fail a candidate for deleting production queues."
    ],
    confidenceTip: "Highlight read-only safety, FIFO queue mechanics, and audit compliance."
  },

  // Behavioral & STAR
  {
    id: "q-star-1",
    categoryId: "behavioral-star",
    question: "Describe a critical production-support P1 issue you resolved under tight SLA deadlines.",
    difficulty: "Intermediate",
    tcodes: ["SMQ2", "SLG1", "CO02", "/SCWM/STAGE"],
    shortAnswer: "Use the STAR method: Situation (Month-end manufacturing plant shut down due to stuck qRFC staging queues), Task (Restore material staging within a 30-minute P1 SLA), Action (Led diagnostic triage, identified RFC user authorization expiration in SM59, coordinated emergency role assignment with Basis), Result (Processed 4,000 backlogged queues in 12 minutes with zero data loss).",
    keyPoints: [
      "Situation: Set clear stakes (e.g. 24/7 manufacturing line halt, month-end close)",
      "Task: State your exact ownership and SLA urgency",
      "Action: Systematic diagnostic steps, cross-functional collaboration (Basis, ABAP, Business)",
      "Result: Quantitative outcome (downtime avoided, SLA met, RCA document submitted)"
    ],
    sapContext: "Standard STAR behavioral framework expected by Infosys technical managers.",
    example: "Situation: At 2 AM during month-end dispatch, 3,000 transfer orders in EWM failed to post back to S/4HANA, halting outbound trucks. Task: As the on-call L3 Lead, I had a 45-minute SLA to resolve the interface deadlock. Action: Checked SMQ2 and SLG1, discovered a custom BAdI in packing was throwing an unhandled exception for zero-weight cartons. Coordinated an emergency hotfix with the ABAP lead. Result: Queue cleared in 15 minutes, shipments dispatched on time, and permanent exception handling was deployed.",
    followUps: [
      { q: "What preventive measures did you put in place after resolving the incident?", a: "I conducted a formal Root Cause Analysis (RCA), created an automated alert in SAP Solution Manager for queue thresholds, and updated the team runbook." }
    ],
    commonMistakes: [
      "Saying 'we fixed it' instead of explaining your personal contribution.",
      "Lacking quantifiable metrics in the Result section."
    ],
    confidenceTip: "Speak with calm authority and structure your answer strictly into Situation, Task, Action, and Result."
  },

  // Infosys HR
  {
    id: "q-info-1",
    categoryId: "infosys-hr",
    question: "Why do you want to join Infosys as an SAP Consultant?",
    difficulty: "Intermediate",
    tcodes: [],
    shortAnswer: "I want to join Infosys because of its global leadership in digital transformation and large-scale SAP S/4HANA enterprise implementations. Infosys provides exposure to complex multi-country SAP landscapes, cutting-edge solutions like Infosys Cobalt and AI-driven operations, and a strong culture of continuous upskilling. With my background in SAP PP, EWM, and integration troubleshooting, I can deliver immediate value to Infosys clients while growing with top industry leaders.",
    keyPoints: [
      "Knowledge of Infosys enterprise scale, S/4HANA transformation projects, and client base",
      "Alignment of your SAP domain expertise (PP/EWM/Integration) with Infosys consulting delivery",
      "Appreciation for Infosys training, continuous learning culture, and innovation platforms",
      "Long-term career vision as a trusted enterprise solutions specialist"
    ],
    sapContext: "Infosys SAP Practice Delivery.",
    example: "Throughout my career in SAP consulting and production support, I have admired Infosys execution in complex manufacturing transformations. I look forward to contributing my hands-on problem-solving skills to Infosys global delivery centers.",
    followUps: [
      { q: "Where do you see yourself in 3 to 5 years at Infosys?", a: "In 3 to 5 years, I envision myself growing into a Lead SAP Solutions Architect at Infosys, leading end-to-end S/4HANA greenfield and migration implementations while mentoring junior consultants." }
    ],
    commonMistakes: [
      "Giving generic answers that could apply to any IT services company without mentioning Infosys specifically.",
      "Focusing only on compensation rather than project scope, technology leadership, and learning."
    ],
    confidenceTip: "Maintain enthusiastic, professional eye contact and clearly articulate your value proposition."
  }
];

export const QUICK_PRACTICE_CARDS = [
  {
    title: "10 Core SAP PP Questions",
    desc: "BOM, Routings, Work Centers, MRP Live, and Order Confirmation drills",
    prompt: "Ask me 10 core SAP PP technical interview questions one by one and test my knowledge.",
    category: "sap-pp",
    icon: "⚙️"
  },
  {
    title: "SAP EWM Staging & PMR",
    desc: "Warehouse numbers, storage types, PSA mapping, and PMR staging methods",
    prompt: "Test my knowledge on SAP EWM production staging, PMR architecture, and storage bin determination.",
    category: "sap-ewm",
    icon: "📦"
  },
  {
    title: "qRFC & bgRFC Queue Triage",
    desc: "SMQ1, SMQ2, SBGRFCMON, and interface incident troubleshooting",
    prompt: "Give me a challenging technical scenario on stuck qRFC and bgRFC queues in S/4HANA EWM integration.",
    category: "integration-arch",
    icon: "🔗"
  },
  {
    title: "P1 Production Support Drill",
    desc: "Simulate a live P1 manufacturing line stoppage under a 30-minute SLA",
    prompt: "Challenge me with a realistic L3 Production Support P1 incident scenario and evaluate my step-by-step diagnostic triage.",
    category: "production-support",
    icon: "🚨"
  },
  {
    title: "STAR Behavioral Interview",
    desc: "Practice answering conflict, pressure, and mistake questions using STAR",
    prompt: "Ask me a challenging behavioral interview question and evaluate my answer strictly using the STAR methodology.",
    category: "behavioral-star",
    icon: "⭐"
  },
  {
    title: "Infosys HR & Self-Introduction",
    desc: "Perfect your 90-second pitch: 'Tell me about yourself' and 'Why Infosys?'",
    prompt: "Help me craft and practice a high-impact, professional self-introduction and 'Why Infosys?' answer tailored to my SAP experience.",
    category: "infosys-hr",
    icon: "🏢"
  }
];

export const DEFAULT_7DAY_PLAN = [
  {
    day: 1,
    title: "Resume, Introduction & Enterprise Structure",
    topics: ["90-second Elevator Pitch", "Client -> Company Code -> Plant -> Storage Location", "EWM Warehouse Structure Mapping"],
    goal: "Master self-introduction, project narrative, and fundamental SAP organizational hierarchy.",
    completed: true
  },
  {
    day: 2,
    title: "SAP PP Master Data & MRP Planning",
    topics: ["BOM Alternatives & Item Categories", "Work Center Formulas & Cost Centers", "Routings vs Master Recipes", "Production Versions (C223)", "MRP Live (MD01N)"],
    goal: "Fluently explain manufacturing master data dependencies and S/4HANA MRP Live execution.",
    completed: false
  },
  {
    day: 3,
    title: "Shop Floor Control & Production Execution",
    topics: ["Order Status Lifecycle (CRTD to CLSD)", "Component Backflush & Availability Checks", "Operation Confirmation (CO11N)", "WIP & Settlement (KO88)"],
    goal: "Explain end-to-end execution, capacity scheduling, and financial variance integration.",
    completed: false
  },
  {
    day: 4,
    title: "SAP EWM Integration & Production Staging",
    topics: ["PMR Architecture (/SCWM/PMR)", "Production Supply Areas (PSA) & Control Cycles", "Staging Methods (Pick/Release/Crate)", "Consumption Postings"],
    goal: "Articulate the exact differences between Delivery-Based and PMR-based Advanced Production Integration.",
    completed: false
  },
  {
    day: 5,
    title: "Interface Architecture & Queue Troubleshooting",
    topics: ["qRFC (SMQ1/SMQ2) FIFO Mechanics", "bgRFC (SBGRFCMON) in S/4HANA", "SLG1 Application Logs & SM21 System Logs", "ST22 Dump Root Cause Analysis"],
    goal: "Confidently diagnose interface stoppages without suggesting risky queue deletions.",
    completed: false
  },
  {
    day: 6,
    title: "STAR Behavioral & Scenario Drills",
    topics: ["Difficult Production Incident (P1 SLA)", "Handling Client Conflict & Changing Requirements", "Mistake Remediation & RCA Submission"],
    goal: "Deliver crisp, confident 2-minute STAR stories with quantifiable results.",
    completed: false
  },
  {
    day: 7,
    title: "Infosys Culture, HR & Final Mock Interview",
    topics: ["'Why Infosys?' & Value Alignment", "5-Year Career Trajectory", "Salary & Relocation Flexibility", "Full 20-Question Mixed Mock Simulation"],
    goal: "Polish spoken confidence, finalize technical cheat-sheets, and eliminate hesitations.",
    completed: false
  }
];

export const EVALUATION_DIMENSIONS = [
  { key: "accuracy", label: "Technical Accuracy", max: 100, weight: 0.25 },
  { key: "completeness", label: "Completeness of Points", max: 100, weight: 0.20 },
  { key: "relevance", label: "Relevance & Directness", max: 100, weight: 0.15 },
  { key: "sapContext", label: "SAP Context & T-Codes", max: 100, weight: 0.15 },
  { key: "practicalExample", label: "Practical Example", max: 100, weight: 0.10 },
  { key: "communication", label: "Spoken Quality & Confidence", max: 100, weight: 0.15 }
];
