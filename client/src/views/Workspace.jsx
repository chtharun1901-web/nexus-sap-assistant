import ValueStreamMapModal from "../components/ValueStreamMapModal.jsx";
import { exportValueStreamMapExcel } from "../utils/valueStreamMapping.js";
import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { api } from "../api.js";
import OrganizationalDiagram from "../components/diagram/OrganizationalDiagram.jsx";
import MermaidDiagram, { ClaudeThinkingFlower } from "../components/MermaidDiagram.jsx";
import { DEFAULT_SAP_PP_ORG_STRUCTURE } from "../components/diagram/diagramData.js";
import SpecializationSelector from "../components/SpecializationSelector.jsx";
import ClassificationHUD from "../components/ClassificationHUD.jsx";

const PRESET_TOPICS = {
  smq1: {
    caseId: "NX-SMQ1-0914",
    title: "SAP S/4HANA Outbound qRFC (SMQ1) Queue Monitoring & Triage",
    summary: "Outbound queues in SMQ1 blocked or in status STOP/SYSFAIL during asynchronous transactional replication to external systems or decentralized warehouses.",
    overview: "Outbound queue monitoring in transaction SMQ1 covers asynchronous LUWs queued for transmission to RFC partner destinations. Blocked outbound queues halt downstream business documents and cause document desynchronization.",
    symptoms: [
      "Outbound queues (e.g. CF*, WM_*, DLV_*) enter STOP, RETRY, or SYSFAIL status in SMQ1",
      "LUW entries accumulate without auto-restarting",
      "Downstream system does not receive replicated business documents",
      "Network timeouts or RFC logon failures logged in SM21 on the sending system"
    ],
    safeguards: "Never execute queue deletion in SMQ1 without evaluating the business document impact. Deleting live outbound LUWs will permanently discard unposted transactional records.",
    procedure: [
      "Open transaction SMQ1 and filter by client and queue name prefix",
      "Identify the first blocked queue entry (FIFO order: first entry blocks all subsequent units)",
      "Double-click the queue name to inspect individual function module LUWs and error status",
      "Test RFC destination connectivity and credentials in transaction SM59",
      "Review sender system log in SM21 and developer trace in ST22 for short dumps",
      "If destination is healthy, use Queue -> Activate (F6) to resume transmission safely"
    ],
    tcodes: [
      { code: "SMQ1", desc: "Outbound qRFC Monitor" },
      { code: "SM59", desc: "RFC Destinations & Connection Test" },
      { code: "SM21", desc: "System Log Analysis" },
      { code: "ST22", desc: "ABAP Runtime Dump Analysis" },
      { code: "SMQS", desc: "Outbound qRFC Scheduler Registration" }
    ],
    citation: "SAP Help Portal: qRFC Outbound Queue Monitoring (SMQ1) · ABAP Platform Architecture"
  },
  smq2: {
    caseId: "NX-2025-0847",
    title: "SAP EWM qRFC Queue Jam — Stuck Transfer Orders & Inbound LUWs",
    summary: "4,218 qRFC entries stuck in READY or STOP state in queue SMQ2. Transfer orders in EWM not being confirmed back to S/4HANA due to RFC destination timeout.",
    overview: "Recurring qRFC inbound queue blockage in SAP S/4HANA Embedded EWM. Stuck entries accumulate in SMQ2 causing transfer orders to remain unconfirmed. Inbound qRFC scheduler max runtime thresholds exceeded under default SMQR parameters without dedicated destination group throttling.",
    symptoms: [
      "qRFC entries accumulate in READY / STOP state in SMQ2",
      "WM transfer orders not confirmed to EWM",
      "RFC destination timeout errors visible in SM21",
      "No movement types posting in MIGO"
    ],
    safeguards: "Read-Only Mode Active. No transactional execution. Never delete live production queues without business impact analysis to prevent orphaned LUWs.",
    procedure: [
      "Check SMQ2 for stuck qRFC entries — note queue names (WM_STG_*)",
      "Verify RFC destination in SM59 — test connection and authorization",
      "Review application log in SLG1 with object /SCWM/ for EWM errors",
      "Check system log in SM21 for RFC timeout / short dump entries",
      "Configure SMQR with parameter MAXTIME=10 per SAP Note 2871625"
    ],
    tcodes: [
      { code: "SMQ2", desc: "qRFC Inbound Queue Monitor" },
      { code: "SMQR", desc: "Inbound qRFC Scheduler (SMQR)" },
      { code: "SM59", desc: "RFC Destinations" },
      { code: "SLG1", desc: "Application Log" },
      { code: "SM21", desc: "System Log" }
    ],
    citation: "SAP Note 2871625: S/4HANA EWM qRFC Staging Queue Optimization & Scheduler Configuration"
  },
  smq3: {
    caseId: "NX-SMQ3-9055",
    title: "SAP S/4HANA: SMQ3 Historical qRFC Archive & Queue Footprint Analysis",
    summary: "Transaction SMQ3 contains historical qRFC payloads. Unmanaged table growth can bloat database tables. Analysis required for vanished LUWs and audit verification.",
    overview: "SMQ3 provides an audit history for asynchronous qRFC communications. If an interface payload vanished from SMQ2 and you need to verify whether it was processed successfully or deleted, SMQ3 is the official place to check the historical footprint.",
    symptoms: [
      "Interface payload disappeared from SMQ2 without business document posting",
      "Need to verify who deleted or re-executed a stuck qRFC queue entry",
      "Database tables ARFCSSTATE and ARFCSDATA experiencing high growth",
      "Periodic cleanup job RSTRFCCUP requires tuning"
    ],
    safeguards: "Do not execute mass purge reports in SMQ3 during active month-end close. Archive logs before running deletion jobs to maintain SOX audit trails.",
    procedure: [
      "Execute transaction SMQ3 and enter the target queue name or client",
      "Filter by time range corresponding to the suspected interface failure",
      "Examine payload headers to identify user ID and function module name",
      "Cross-reference status with SLG1 application logs and SM21 system logs",
      "Verify scheduling of standard reorganization report RSTRFCCUP via SM37"
    ],
    tcodes: [
      { code: "SMQ3", desc: "qRFC Historical Archive Monitor" },
      { code: "SMQ2", desc: "Inbound qRFC Monitor" },
      { code: "SMQ1", desc: "Outbound qRFC Monitor" },
      { code: "SM37", desc: "Background Job Overview (RSTRFCCUP)" },
      { code: "SLG1", desc: "Application Log Analysis" }
    ],
    citation: "SAP Help Portal: qRFC History and Administration (SMQ3) · ABAP Platform"
  },
  pmr: {
    caseId: "NX-PMR-0322",
    title: "Production Material Request (PMR) Staging & Execution in SAP EWM",
    summary: "Production Material Request (PMR) integration between S/4HANA Manufacturing (PP) and Extended Warehouse Management (EWM) for shop floor material supply.",
    overview: "In SAP S/4HANA Extended Warehouse Management with Advanced Production Integration, the PMR represents the warehouse view of the manufacturing order. Staging can be executed based on Pick Parts, Release Order Parts, or Crate Parts using transaction /SCWM/STAGE or /SCWM/PMR.",
    symptoms: [
      "Production order released in CO01/CO02 but PMR not created in EWM",
      "Staging proposal in /SCWM/STAGE fails with missing control cycle error",
      "Warehouse task generation fails due to bin determination or stock deficit in PSA"
    ],
    safeguards: "Ensure production order changes in PP (CO02) synchronize before triggering warehouse order re-creation to prevent duplicate staging tasks.",
    procedure: [
      "Verify manufacturing order status in CO03 (Status REL - Released is required)",
      "Open transaction /SCWM/PMR to confirm existence and line items of the PMR document",
      "Check EWM Control Cycle in /SCWM/PSA_CC linking Material, Plant, and PSA",
      "Execute staging via transaction /SCWM/STAGE and check staging method derivation",
      "Review application log in SLG1 (/SCWM/PRODUCTION) for staging failure details"
    ],
    tcodes: [
      { code: "/SCWM/PMR", desc: "Production Material Request" },
      { code: "/SCWM/STAGE", desc: "Production Staging Cockpit" },
      { code: "/SCWM/PSA_CC", desc: "EWM Control Cycle Maintenance" },
      { code: "CO03", desc: "Display Production Order" },
      { code: "SLG1", desc: "Application Log (/SCWM/)" }
    ],
    citation: "SAP Help Portal: Production Material Request (PMR) in SAP EWM · S/4HANA Advanced Production Integration"
  },
  bgrfc: {
    caseId: "NX-BGRFC-0105",
    title: "bgRFC vs qRFC Integration Architecture in SAP S/4HANA Embedded EWM",
    summary: "Architecture triage between classic qRFC (SMQ1/SMQ2) and modern background RFC (bgRFC) in S/4HANA Embedded EWM landscapes.",
    overview: "S/4HANA Embedded EWM transitions local warehouse replication from classic RFC LUWs to bgRFC units for improved transactional throughput and zero network overhead. Administrators must verify active supervisor destination in SBGRFPCUST before diagnosing queue stops.",
    symptoms: [
      "Confusion regarding whether transactions generate SMQ2 entries or bgRFC units",
      "bgRFC units in status SYSFAIL or LOCKED in transaction SBGRFCMON",
      "Supervisor destination BGRFC_SUPERVISOR missing or showing authorization failure"
    ],
    safeguards: "Do not execute SMQ2 queue purge routines in embedded topologies when bgRFC is the active communication layer.",
    procedure: [
      "Execute transaction SBGRFPCUST to verify Supervisor Destination BGRFC_SUPERVISOR",
      "Check transaction SBGRFCMON for inbound units with SYSFAIL status",
      "Inspect lock durations and scheduler configuration in SBGRFPCUST",
      "Review SAP Note 3012841 for architecture guidelines in S/4HANA Embedded EWM"
    ],
    tcodes: [
      { code: "SBGRFCMON", desc: "bgRFC Monitor" },
      { code: "SBGRFPCUST", desc: "bgRFC Customizing & Supervisor" },
      { code: "SMQ2", desc: "Classic qRFC Monitor" },
      { code: "SM59", desc: "RFC Destinations" }
    ],
    citation: "SAP Note 3012841: bgRFC vs qRFC Integration Architecture in S/4HANA Embedded EWM"
  },
  psa: {
    caseId: "NX-PSA-0419",
    title: "Production Supply Area (PSA) & EWM Control Cycles Configuration",
    summary: "PSA derivation, control cycle maintenance (/SCWM/PSA_CC), and work center staging bin validation for shop floor production execution.",
    overview: "The Production Supply Area (PSA) represents the physical staging bin near the work center. Staging derivation relies on the EWM Control Cycle linking Material, Plant, and PSA. In classic ERP WM, control cycles are maintained via transaction LPK1.",
    symptoms: [
      "Staging proposal fails with error 'No control cycle found for material/plant/PSA'",
      "Work center CR02 contains PSA that is not mapped to an EWM storage bin",
      "Staging indicator missing in BOM item or production version"
    ],
    safeguards: "Do not create ad-hoc storage bins directly in production without assigning the correct storage type with staging role.",
    procedure: [
      "Check work center in transaction CR02 -> Capacities/Costing -> verify assigned PSA",
      "Open transaction /SCWM/PSA_CC to verify control cycle for Material, Plant, and PSA",
      "Verify PSA mapping to warehouse bin in /SCWM/PSA_BIN",
      "Check BOM component staging indicator (Pick part, Release order part, Crate part)",
      "Re-trigger staging proposal in transaction /SCWM/STAGE"
    ],
    tcodes: [
      { code: "/SCWM/PSA_CC", desc: "EWM Control Cycle Maintenance" },
      { code: "/SCWM/PSA_BIN", desc: "Map PSA to Storage Bin" },
      { code: "CR02", desc: "Change Work Center" },
      { code: "/SCWM/STAGE", desc: "Production Staging Cockpit" },
      { code: "LPK1", desc: "ERP WM Control Cycle (Classic)" }
    ],
    citation: "SAP Help Portal: Production Supply Area (PSA) & Control Cycles · S/4HANA EWM"
  },
  note2871625: {
    caseId: "NX-NOTE-2871625",
    title: "SAP OSS Note 2871625: S/4HANA EWM qRFC Staging Queue Optimization",
    summary: "Correction and scheduler tuning for high volume inbound staging queues entering SYSFAIL/STOP status during parallel production staging runs.",
    overview: "Inbound qRFC scheduler max runtime thresholds exceeded under default SMQR parameters without dedicated destination group throttling. Register queue prefix WM_STG_* in SMQR with MAXTIME=10 and USER=*.",
    symptoms: [
      "Inbound queues (WM_STG_*) enter SYSFAIL or STOP status in SMQ2",
      "High volume parallel production runs exhaust dialog work processes",
      "qRFC scheduler thread starvation under standard RZ12 server group settings"
    ],
    safeguards: "Apply destination group throttling during off-peak windows or verify RFC user authorisations in SM59 before adjusting scheduler MAXTIME.",
    procedure: [
      "Open transaction SMQR in the target EWM client",
      "Select Register Queue -> Queue Name: WM_STG_*",
      "Assign RFC Destination Group EWM_RFC_PARALLEL configured in RZ12",
      "Set parameter MAXTIME=10 and USER=*",
      "Verify active status with green traffic light indicator"
    ],
    tcodes: [
      { code: "SMQR", desc: "qRFC Inbound Scheduler Registration" },
      { code: "SMQ2", desc: "qRFC Inbound Monitor" },
      { code: "RZ12", desc: "RFC Server Group Administration" },
      { code: "SM59", desc: "RFC Destinations" }
    ],
    citation: "SAP Note 2871625: S/4HANA EWM qRFC Staging Queue Optimization & Scheduler Configuration"
  },
  deliveryBased: {
    caseId: "NX-DLV-0248",
    title: "SAP PP/EWM: Delivery-Based Production Integration (Conceptual Overview)",
    summary: "Delivery-oriented staging and goods consumption architecture between SAP Manufacturing (PP) and Extended Warehouse Management (EWM).",
    overview: "Delivery-based production integration uses delivery documents (such as outbound deliveries generated in ERP/S4 and corresponding warehouse deliveries in EWM) as the integration object to initiate warehouse staging and consumption.",
    symptoms: [
      "Staging delivery document creation delay or synchronization block between ERP and EWM",
      "Interface queue delay or document status mismatch between production order and staging delivery",
      "Release- and deployment-dependent status synchronization discrepancies"
    ],
    safeguards: "Read-Only Diagnostics Active. Never execute queue deletions, delivery consistency repairs, or posting period adjustments (OB52) without verified architecture context, formal change governance, and business impact analysis.",
    procedure: [
      "Confirm landscape deployment: determine whether EWM is Embedded or Decentralized, and identify communication technology",
      "Perform read-only document flow verification: inspect manufacturing order and determine if staging delivery document was created",
      "Check application logs (e.g. SLG1) and system logs (e.g. SM21) for communication or document posting errors",
      "Verify queue status in read-only queue monitor without executing destructive purge routines",
      "Escalate findings with exact error messages and document numbers through formal change-management procedures"
    ],
    tcodes: [
      { code: "Architecture-dependent", desc: "Transactions vary by SAP release, deployment model (Embedded vs Decentralized), and communication technology." },
      { code: "SLG1", desc: "Application Log Analysis (Read-Only)" },
      { code: "SM21", desc: "System Log Analysis (Read-Only)" }
    ],
    citation: "General model knowledge — not verified against an official SAP source or target SAP system. (Evidence status: No directly matching official source was retrieved for delivery-based integration)."
  },
  prodOrderType: {
    caseId: "NX-PP-ORDTYPE-01",
    title: "SAP Production Order Type (OPJH / OPL8): Technical Configuration & Execution Architecture",
    summary: "Complete hierarchical and relational model showing how an SAP Production Order Type (e.g., PP01, PP02, YB01) is defined in Customizing and connects to Order Categories, Number Ranges, Plant Parameters (OPL8), Scheduling, Availability Checks, Costing, Confirmations, Settlement, and Shop-Floor/EWM Staging.",
    overview: `### SAP Production Order Type Architecture & Integration Tree

A **Production Order Type** in SAP S/4HANA (such as \`PP01\` Standard In-House, \`PP02\` External Processing, or \`YB01\` Make-to-Order) is the central configuration object that controls manufacturing order behavior from order creation (\`CO01\`) to final settlement (\`KO88\`).

\`\`\`mermaid
flowchart TD
  OrderType["🎯 Production Order Type (OPJH / OPL8)<br/>e.g. PP01, PP02, YB01"]

  subgraph CoreDefinition ["1. Core Definition & Numbering (OPJH)"]
    OrderType --> Cat["Order Category (Category 10: PP Order / 40: Process)"]
    OrderType --> NumRange["Number Range Assignment (Internal / External CO01)"]
    OrderType --> DocType["CO Document Type & Status Profile (BS02)"]
  end

  subgraph OPL8Params ["2. Order Type-Dependent Parameters (OPL8 per Plant)"]
    OrderType --> OPL8["Plant + Order Type Parameters (OPL8)"]
    OPL8 --> MasterDataSel["Master Data Selection: Routing Selection ID & BOM Application (PP01)"]
    OPL8 --> Costing["Costing Variant: Planned (PPP1) & Actual (PPP2) + Valuation Variant"]
    OPL8 --> Reduction["Reduction Strategies & Scheduling Margin Key"]
    OPL8 --> BatchMgmt["Batch Creation & Determination Profile"]
  end

  subgraph ControlParameters ["3. Execution & Operational Controls"]
    OrderType --> Sched["Scheduling Parameters (OPU3 / OPU5)<br/>Detailed, Rate-based, Rough-cut"]
    OrderType --> Avail["Material & Capacity Availability Check (OPJK)<br/>Checking Rule PP at Creation / Release"]
    OrderType --> Confirm["Confirmation Parameters (OPK4)<br/>Auto-GI 261, GR 101, Under/Overdelivery Tol."]
    OrderType --> Settle["Settlement Profile (OKO7)<br/>Default Cost Object: Material, Cost Center, WBS"]
  end

  subgraph ShopFloorIntegration ["4. Shop Floor & Logistics Integration"]
    OrderType --> DocFlow["Document Flow & Reservations (RESB, KBED)"]
    OrderType --> Staging["Warehouse Staging Trigger on REL Status"]
    Staging --> PMR["EWM: Production Material Request (/SCWM/PMR) via /SCWM/STAGE"]
    Staging --> ClassicWM["Classic WM: Control Cycle (LPK1) & PSA Bins"]
  end

  style OrderType fill:#6E1A2D,stroke:#EA580C,stroke-width:2px,color:#fff
  style OPL8 fill:#1E293B,stroke:#3B82F6,stroke-width:1.5px,color:#fff
  style Sched fill:#18181B,stroke:#F59E0B,stroke-width:1px,color:#fff
  style Avail fill:#18181B,stroke:#10B981,stroke-width:1px,color:#fff
  style Confirm fill:#18181B,stroke:#8B5CF6,stroke-width:1px,color:#fff
  style Settle fill:#18181B,stroke:#EC4899,stroke-width:1px,color:#fff
  style PMR fill:#0F172A,stroke:#06B6D4,stroke-width:1px,color:#fff
\`\`\`

### Detailed Functional Component Breakdown

1. **Core Order Type Definition (\`OPJH\`)**:
   * **Order Category (AUTYP)**: Category \`10\` represents Production Orders; Category \`40\` represents Process Orders; Category \`30\` represents Maintenance Orders.
   * **Number Range Interval**: Defines internal numbering upon \`CO01\` save and optional external numbering.
   * **Status Management**: Links system statuses (\`CRTD\`, \`PREL\`, \`REL\`, \`PCNF\`, \`CNF\`, \`DLV\`, \`TECO\`, \`CLSD\`) and user status profiles (\`BS02\`).

2. **Order-Type-Dependent Parameters (\`OPL8\` per Plant)**:
   * **Master Data Selection**: Controls automatic BOM explosion (BOM Application \`PP01\`) and Routing selection (Selection ID \`01\`).
   * **Costing Configuration**: Assigns Planned Costing Variant (\`PPP1\`) and Actual Costing Variant (\`PPP2\`) for WIP calculation and variance calculation (\`KKS2\`).
   * **Batch Determination**: Trigger point for automatic component batch search strategies.

3. **Operational Customizing**:
   * **Scheduling Parameters (\`OPU3\` / \`OPU5\`)**: Controls whether backwards/forwards scheduling is used, operation lead times, and reduction levels.
   * **Availability Check (\`OPJK\`)**: Controls whether material shortages block order release or order creation, using Checking Rule \`PP\` and ATP Checking Group in Material Master.
   * **Confirmation Parameters (\`OPK4\`)**: Controls backflushing of goods issue (\`Movement 261\`), automatic goods receipt (\`Movement 101\`), and discrepancy handling.
   * **Settlement Profile (\`OKO7\`)**: Defines allowable settlement receivers (Material, Cost Center, Sales Order, WBS) and allocation structures.

4. **EWM & Logistics Integration**:
   * **Order Release (\`REL\`)**: Automatically triggers reservations in table \`RESB\` and staging requirements in Extended Warehouse Management via **Production Material Request (PMR)** or delivery-based staging.`,
    symptoms: [
      "Inquiry for SAP Production Order Type technical configuration and connected customizing objects",
      "Analysis of OPL8, OPJH, OPU3, OPJK, OPK4, and OKO7 relationships",
      "Shop floor manufacturing integration between PP order types and EWM warehouse staging"
    ],
    safeguards: "Customizing changes to OPL8, OPJH, and OPJK affect all future production order creations in the plant. Always test order creation (CO01), release (CO02), and confirmation (CO11N) in a quality test client before transporting.",
    procedure: [
      "Define Production Order Type in transaction OPJH (Order Category 10)",
      "Maintain Order Type-Dependent Parameters per Plant in transaction OPL8",
      "Configure Scheduling Parameters for Plant and Order Type in transaction OPU3",
      "Configure Material Availability Checking Control in transaction OPJK",
      "Configure Confirmation Parameters in transaction OPK4",
      "Maintain Settlement Profile in transaction OKO7 and assign to Order Type in OPL8",
      "Verify production staging integration with EWM via /SCWM/STAGE or /SCWM/PMR"
    ],
    tcodes: [
      { code: "OPJH", desc: "Define Production Order Types (Category 10)" },
      { code: "OPL8", desc: "Order Type-Dependent Parameters (per Plant)" },
      { code: "OPU3", desc: "Production Order Scheduling Parameters" },
      { code: "OPJK", desc: "Material Availability Check at Creation / Release" },
      { code: "OPK4", desc: "Production Order Confirmation Parameters" },
      { code: "OKO7", desc: "Maintain Settlement Profiles (Cost Settlement)" },
      { code: "CO01 / CO02 / CO03", desc: "Create / Change / Display Production Order" },
      { code: "/SCWM/STAGE", desc: "Production Staging Cockpit (EWM)" }
    ],
    citation: "SAP S/4HANA Manufacturing Customizing Reference: SPRO -> Production -> Shop Floor Control -> Master Data -> Order"
  },
  ppOrgStructure: {
    caseId: "NX-PP-ORG-1000",
    title: "SAP PP & EWM: Enterprise Organizational Structure & Manufacturing Hierarchy",
    summary: "Complete hierarchical architecture connecting Enterprise Structure (Client, Company Code, Plant) to Production Planning (PP) execution objects and Extended Warehouse Management (EWM) staging integration.",
    overview: `### SAP PP Organizational Structure & Enterprise Hierarchy

Below is the verified structural relationship between enterprise organizational units, production planning execution objects, and Extended Warehouse Management (EWM) integration in SAP S/4HANA.

\`\`\`json:diagram
${JSON.stringify(DEFAULT_SAP_PP_ORG_STRUCTURE, null, 2)}
\`\`\`

### Architectural & Semantic Rules Breakdown

1. **Enterprise Hierarchy (Top-to-Bottom)**:
   * **Client (Mandant)**: Highest SAP organizational level.
   * **Company Code (Buchungskreis)**: Belongs below the Client; independent accounting entity.
   * **Plant (Werk)**: Belongs directly to the Company Code; operational unit for manufacturing and inventory valuation.

2. **SAP PP Organizational Units (Plant Branch)**:
   * **MRP Areas (Bedarfsplanung)**: Belongs to the Plant; plans material requirements independently across storage locations or subcontractors.
   * **Storage Locations (Lagerorte)**: Physical subdivisions of inventory balances within a Plant.
   * **Work Centers (Arbeitsplätze)**: Machines, production lines, or labour groups defined within the Plant.
   * **Production Supply Areas (PSA / PVB)**: Shop-floor physical staging points where components are consumed during production execution.
   * **Production Versions & Orders**: Master recipe/routing combination and shop floor production execution orders.

3. **SAP EWM Organizational Units (Warehouse Branch)**:
   * **Warehouse Number (Lagernummer)**: Organizational unit assigned to the Plant & Storage Location context (not a direct child of Client).
   * **Storage Types (Lagertypen)**: Physical subdivisions (High-rack, Bulk, Staging, Goods Receipt) below the Warehouse Number.
   * **Storage Bins (Lagerplätze)**: Lowest coordinate addresses below Storage Types.
   * **Staging Integration**: Production Supply Areas (PSA) bridge ERP shop-floor consumption with EWM warehouse staging tasks.

*Note: Exact organizational assignments and naming conventions depend on your target SAP system customizing (SPRO).*`,
    symptoms: [
      "Inquiry for SAP PP and EWM organizational hierarchy and structural mapping",
      "Clarification of relationship between Plant, Storage Location, PSA, and Warehouse Number",
      "Enterprise structure alignment for S/4HANA manufacturing and logistics"
    ],
    safeguards: "Standard Architectural Reference. Exact customizing maintained in SPRO Enterprise Structure.",
    procedure: [
      "Review Enterprise Structure in transaction SPRO: Enterprise Structure -> Definition / Assignment",
      "Verify Plant to Company Code assignment in table T001K / T001W",
      "Check Storage Location definitions under Plant in transaction OX09",
      "Verify Production Supply Area (PSA) assignment to Storage Location and Plant in transaction PK05 / /SCWM/PSA",
      "Verify EWM Warehouse Number assignment to Plant & Storage Location in SPRO customizing"
    ],
    tcodes: [
      { code: "OX09", desc: "Customize Storage Locations per Plant" },
      { code: "PK05", desc: "Production Supply Area Maintenance" },
      { code: "/SCWM/PSA", desc: "EWM Production Supply Area Assignment" },
      { code: "CR01 / CR03", desc: "Work Center Create / Display" },
      { code: "C223", desc: "Production Version Maintenance" },
      { code: "SPRO", desc: "Enterprise Structure Customizing" }
    ],
    citation: "SAP Help Portal: Enterprise Structure & Production Planning (PP) Architecture in SAP S/4HANA"
  }
};

function getMatchedDoc(term) {
  if (!term) return PRESET_TOPICS.smq1;
  const t = term.toLowerCase();
  if (t.includes("order type") || t.includes("production order type") || t.includes("opjh") || t.includes("opl8") || (t.includes("order") && (t.includes("connected") || t.includes("tree") || t.includes("diagram") || t.includes("type")))) {
    return PRESET_TOPICS.prodOrderType;
  }
  if (t.includes("org") || t.includes("structure") || t.includes("hierarchy") || (t.includes("pp") && (t.includes("plant") || t.includes("draw") || t.includes("show")))) {
    return PRESET_TOPICS.ppOrgStructure;
  }
  if (t.includes("smq1") || t.includes("outbound")) return PRESET_TOPICS.smq1;
  if (t.includes("smq2") || t.includes("inbound") || t.includes("jam")) return PRESET_TOPICS.smq2;
  if (t.includes("bgrfc") || t.includes("bg rfc")) return PRESET_TOPICS.bgrfc;
  if (t.includes("2871625") || t.includes("staging queue")) return PRESET_TOPICS.note2871625;
  if (t.includes("delivery") || t.includes("delivery-based")) return PRESET_TOPICS.deliveryBased;
  return generateDynamicTopic(term);
}

function generateDynamicTopic(term) {
  const t = term.trim().toUpperCase();
  const slug = t.replace(/[^A-Z0-9]/g, "").substring(0, 8) || "GEN";
  const num = Math.floor(1000 + Math.random() * 9000);
  const isDelivery = t.includes("DELIVERY");
  return {
    caseId: "NX-" + slug + "-" + num,
    title: "SAP S/4HANA: " + term.trim() + " Technical Investigation",
    summary: isDelivery 
      ? "Technical diagnostic and conceptual architecture for SAP topic: \"" + term.trim() + "\". General model knowledge — not verified against an official SAP source or target SAP system."
      : "Technical diagnostic and investigation for SAP topic: \"" + term.trim() + "\". General model knowledge — not verified against an official SAP source or target SAP system.",
    overview: "This investigation was dynamically generated for \"" + term.trim() + "\". It provides structured conceptual triage, candidate transaction codes, and read-only diagnostics.",
    symptoms: [
      "System or interface anomaly reported for " + term.trim(),
      "Transactional processing delay or queue stop in associated SAP component",
      "Verification required against target landscape customizing and authorisations"
    ],
    safeguards: "Read-Only Diagnostic Mode Active. Always review official SAP Notes and verify changes in non-production sandbox environments before applying configurations.",
    procedure: [
      "Review current operational status and error logs for " + term.trim(),
      "Identify primary transaction codes and monitoring tools associated with this component",
      "Inspect application logs (SLG1) and system logs (SM21) for corresponding error timestamps",
      "Consult grounded AI Reasoning for verified sources or general model knowledge caveats",
      "Formulate a sandbox reproduction test before production deployment"
    ],
    tcodes: [
      { code: "Release-dependent", desc: "Applicability uncertain — verify for target SAP landscape" },
      { code: "SLG1", desc: "Application Log Analysis (Read-Only)" },
      { code: "SM21", desc: "System Log Analysis (Read-Only)" }
    ],
    citation: "Evidence status: No directly matching official source was retrieved for this topic. General model knowledge."
  };
}

// Splits markdown text into markdown blocks, interactive diagram blocks, and code blocks
function parseContentBlocks(text) {
  if (!text) return [];
  const blocks = [];

  // Match code fences: ```(lang)?\n([\s\S]*?)```
  const fenceRegex = /```([a-zA-Z0-9_:-]*)\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = fenceRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      pushMarkdownWithUnfencedDiagram(blocks, textBefore);
    }

    const lang = (match[1] || "").toLowerCase().trim();
    const code = match[2].trim();

    // Check if it's a structured diagram block
    const isExplicitDiagram = lang === "json:diagram" || lang === "diagram" || lang === "json-diagram";
    let parsedDiagramData = null;

    if (isExplicitDiagram || lang === "json") {
      try {
        const parsed = JSON.parse(code);
        if (parsed && (parsed.nodes || parsed.enterprise || parsed.rootId || parsed.title?.toLowerCase().includes("organizational") || parsed.title?.toLowerCase().includes("pp") || isExplicitDiagram)) {
          parsedDiagramData = parsed;
        }
      } catch (e) {
        if (isExplicitDiagram) {
          parsedDiagramData = DEFAULT_SAP_PP_ORG_STRUCTURE;
        }
      }
    }

    // Check if it's a legacy mermaid or flowchart diagram
    const isMermaid = lang === "mermaid" || 
      /^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram)\b/i.test(code) ||
      (code.includes("-->") && /^(?:flowchart|graph)/im.test(code));

    if (isMermaid || lang === "mermaid" || isExplicitDiagram) {
      blocks.push({ type: "mermaid", content: code });
    } else if (parsedDiagramData) {
      blocks.push({ type: "mermaid", content: typeof parsedDiagramData === "string" ? parsedDiagramData : JSON.stringify(parsedDiagramData) });
    } else {
      blocks.push({ type: "code", language: lang || "text", content: code });
    }

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    pushMarkdownWithUnfencedDiagram(blocks, remaining);
  }

  return blocks;
}

function pushMarkdownWithUnfencedDiagram(blocks, text) {
  // Check if un-fenced flowchart or ASCII tree or Enterprise Structure label exists in text
  const flowMatch = text.search(/(?:^|\n)(?:flowchart|graph)\s+(?:TD|TB|BT|RL|LR)\b/i);
  const asciiTreeMatch = text.search(/(?:^|\n)\[Enterprise Structure:/i);

  if (flowMatch !== -1) {
    const before = text.slice(0, flowMatch).trim();
    if (before) blocks.push({ type: "markdown", content: before });

    const chartPortion = text.slice(flowMatch).trim();
    // Check if there is trailing markdown after class definitions
    const classDefEnd = chartPortion.search(/\n\n(?=[#*-A-Z1-9])/);
    if (classDefEnd !== -1 && (chartPortion.includes("classDef") || chartPortion.includes("class "))) {
      const chartCode = chartPortion.slice(0, classDefEnd).trim();
      blocks.push({ type: "mermaid", content: chartCode || chartPortion });
      const after = chartPortion.slice(classDefEnd).trim();
      if (after) blocks.push({ type: "markdown", content: after });
    } else {
      blocks.push({ type: "mermaid", content: chartPortion });
    }
  } else if (asciiTreeMatch !== -1) {
    const before = text.slice(0, asciiTreeMatch).trim();
    if (before) blocks.push({ type: "markdown", content: before });
    blocks.push({ type: "mermaid", content: `flowchart TD
  Client["🏛️ Client (Mandant)"] --> CC["🏢 Company Code"]
  CC --> Plant["🏭 Plant (Werk)"]
  Plant --> PP["Production Planning (PP)"]
  Plant --> EWM["Extended Warehouse Management (EWM)"]` });
    const treePortion = text.slice(asciiTreeMatch);
    const endMatch = treePortion.search(/\n\n(?=[#*A-Z1-9])/);
    if (endMatch !== -1) {
      const after = treePortion.slice(endMatch).trim();
      if (after) blocks.push({ type: "markdown", content: after });
    }
  } else {
    blocks.push({ type: "markdown", content: text });
  }
}

function renderMarkdownBlock(content, blockKey) {
  const rawLines = content.split("\n");
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Table parsing
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith("|") && rawLines[i].trim().endsWith("|")) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCols = tableLines[0].slice(1, -1).split("|").map(c => c.trim());
        const rowStartIndex = tableLines[1].includes("---") ? 2 : 1;
        const rows = tableLines.slice(rowStartIndex).map(r => r.slice(1, -1).split("|").map(c => c.trim()));
        elements.push(
          <div key={`${blockKey}-tbl-${i}`} style={{ overflowX: "auto", margin: "14px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid var(--border-subtle)", borderRadius: 6 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "2px solid var(--border-subtle)" }}>
                  {headerCols.map((col, cIdx) => (
                    <th key={cIdx} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-primary)", borderRight: "1px solid var(--border-subtle)" }}>{renderInline(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-subtle)", background: rIdx % 2 === 0 ? "transparent" : "var(--bg-surface)" }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: "8px 12px", borderRight: "1px solid var(--border-subtle)", color: "var(--text-body)" }}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    if (trimmed.startsWith("> ")) {
      const quoteContent = trimmed.slice(2);
      const isWarning = quoteContent.includes("⚠️") || quoteContent.includes("Correction") || quoteContent.includes("Verification Notice");
      elements.push(
        <div
          key={`${blockKey}-${i}`}
          style={{
            background: isWarning ? "rgba(245, 158, 11, 0.08)" : "var(--bg-surface)",
            borderLeft: isWarning ? "3px solid var(--orange)" : "3px solid var(--border-strong)",
            padding: "10px 14px",
            borderRadius: "0 6px 6px 0",
            margin: "12px 0",
            color: isWarning ? "var(--text-primary)" : "var(--text-body)",
            fontSize: 13.5
          }}
        >
          {renderInline(quoteContent)}
        </div>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(<h3 key={`${blockKey}-${i}`} style={{ fontSize: 16, fontWeight: 700, color: "var(--burgundy-dark, #4A0E1A)", marginTop: 16, marginBottom: 6 }}>{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={`${blockKey}-${i}`} style={{ fontSize: 18, fontWeight: 800, color: "var(--burgundy-rich, #6E1A2D)", marginTop: 20, marginBottom: 8, borderBottom: "1.5px solid var(--burgundy-border, rgba(110,26,45,0.18))", paddingBottom: 5, letterSpacing: "-0.01em" }}>{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={`${blockKey}-${i}`} style={{ fontSize: 22, fontWeight: 800, color: "var(--burgundy-dark, #4A0E1A)", marginTop: 22, marginBottom: 10, letterSpacing: "-0.02em" }}>{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const bulletContent = trimmed.slice(2);
      elements.push(
        <div key={`${blockKey}-${i}`} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 8 }}>
          <span style={{ color: "var(--burgundy-rich, #6E1A2D)", fontWeight: 700 }}>•</span>
          <div>{renderInline(bulletContent)}</div>
        </div>
      );
    } else if (trimmed.startsWith("***") || trimmed.startsWith("---")) {
      elements.push(<hr key={`${blockKey}-${i}`} style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "14px 0" }} />);
    } else if (!trimmed) {
      elements.push(<div key={`${blockKey}-${i}`} style={{ height: 8 }} />);
    } else {
      elements.push(<p key={`${blockKey}-${i}`} style={{ marginBottom: 6 }}>{renderInline(line)}</p>);
    }
    i++;
  }

  return elements;
}

export function FormattedText({ text }) {
  if (!text) return null;
  const blocks = parseContentBlocks(text);

  return (
    <div style={{ lineHeight: 1.7, fontSize: 14, color: "var(--text-body)" }}>
      {blocks.map((block, idx) => {
        if (block.type === "mermaid" || block.type === "diagram") {
          return <MermaidDiagram key={`mermaid-${idx}`} chart={block.content || (typeof block.data === 'string' ? block.data : '')} />;
        }
        if (block.type === "code") {
          return (
            <pre key={`code-${idx}`} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 14px", overflowX: "auto", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#EDEDED", margin: "12px 0" }}>
              <code>{block.content}</code>
            </pre>
          );
        }
        return <React.Fragment key={`md-${idx}`}>{renderMarkdownBlock(block.content, idx)}</React.Fragment>;
      })}
    </div>
  );
}

function renderInline(str) {
  if (!str) return "";

  // 1. Clean math and LaTeX artifacts (arrows, numbers wrapped in dollars like $9010$, $\rightarrow$)
  let cleaned = str
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
    .replace(/\$\s*([A-Za-z0-9_\-\/.\+]+)\s*\$/g, "$1"); // strip $9010$ -> 9010, ($9010$) -> (9010)

  // 2. Parse bold **bold**, code `code`, evidence badges, and arrows
  const parts = cleaned.split(/(\b|\*\*.*?\*\*|\`.*?\`|\[Verified Official\]|\[Verified\]|\[System-Dependent\]|\[Unverified\]|\[Requires SAP release confirmation\]|→|←|↔|⇒|⇐)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ background: "var(--burgundy-light, #FDF2F4)", border: "1px solid var(--burgundy-border, #F3CBD2)", padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--burgundy-rich, #6E1A2D)", fontWeight: 600 }}>{part.slice(1, -1)}</code>;
    }
    if (part === "[Verified Official]" || part === "[Verified]") {
      return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#065F46", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 3px", fontFamily: "var(--font-mono)" }}>✓ {part.slice(1, -1)}</span>;
    }
    if (part === "[System-Dependent]" || part === "[Requires SAP release confirmation]") {
      return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#92400E", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 3px", fontFamily: "var(--font-mono)" }}>⚡ {part.slice(1, -1)}</span>;
    }
    if (part === "[Unverified]") {
      return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#991B1B", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 3px", fontFamily: "var(--font-mono)" }}>⚠ {part.slice(1, -1)}</span>;
    }
    if (part === "→" || part === "←" || part === "↔" || part === "⇒" || part === "⇐") {
      return <span key={i} style={{ color: "var(--burgundy-rich, #6E1A2D)", fontWeight: 700, margin: "0 4px", fontSize: 14, display: "inline-block" }}>{part}</span>;
    }
    return part;
  });
}

function convertMarkdownToHtml(md) {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#0F172A;font-size:12.5pt;margin-top:16px;margin-bottom:6px;border-bottom:1px solid #E2E8F0;padding-bottom:3px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#6E1A2D;font-size:14pt;margin-top:20px;margin-bottom:8px;border-bottom:2px solid #6E1A2D;padding-bottom:4px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#0F172A;font-size:17pt;margin-top:24px;margin-bottom:10px;">$1</h1>');

  // Bold & inline code
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#0F172A;">$1</strong>');
  html = html.replace(/`(.*?)`/gim, '<code style="background:#F1F5F9;color:#6E1A2D;padding:2px 5px;border-radius:3px;font-family:Consolas,monospace;font-size:9.5pt;">$1</code>');

  // Bullet points
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-bottom:4px;color:#334155;">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li style="margin-bottom:4px;color:#334155;">$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/gim, '<br/><br/>');
  return html;
}

function handleExportWord(doc, aiText, aiCitations) {
  const caseId = doc?.caseId || "NEXUS-SAP-INVESTIGATION";
  const title = doc?.title || "SAP Technical Investigation Report";
  const summary = doc?.summary || "Evidence-aware SAP diagnostic and technical investigation summary.";
  const dateStr = new Date().toLocaleString();

  const formattedAi = convertMarkdownToHtml(aiText);

  let tcodeRows = "";
  if (doc?.tcodes?.length) {
    tcodeRows = doc.tcodes.map((t, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding:8px 12px;border:1px solid #CBD5E1;font-family:Consolas,monospace;font-weight:bold;color:#6E1A2D;width:160px;">${t.code}</td>
        <td style="padding:8px 12px;border:1px solid #CBD5E1;color:#334155;">${t.desc}</td>
      </tr>
    `).join("");
  }

  let procedureItems = "";
  if (doc?.procedure?.length) {
    procedureItems = doc.procedure.map((step, idx) => `
      <li style="margin-bottom:6px;color:#334155;"><strong>Step ${idx + 1}:</strong> ${step}</li>
    `).join("");
  }

  let citationBadges = "";
  if (aiCitations?.length && !(doc?.caseId === "NX-DLV-0248" || doc?.title?.toLowerCase().includes("delivery"))) {
    citationBadges = aiCitations.map(c => `
      <span style="display:inline-block;background:#EFF6FF;border:1px solid #BFDBFE;color:#1D4ED8;padding:4px 10px;border-radius:4px;font-size:9pt;margin-right:6px;margin-bottom:6px;">
        <strong>[${c.citationId || 'Ref'}]</strong> ${c.title || ''}
      </span>
    `).join("");
  }

  const wordContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <title>${title}</title>
  <style>
    @page { margin: 1in; size: portrait; }
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #1E293B; line-height: 1.6; font-size: 11pt; }
    .header-banner { background: #0F172A; color: #FFFFFF; padding: 22px 26px; border-radius: 6px; border-left: 6px solid #6E1A2D; margin-bottom: 24px; }
    .badge { background: #6E1A2D; color: #FFFFFF; font-size: 8.5pt; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: inline-block; text-transform: uppercase; }
    .meta-table { width: 100%; margin-top: 14px; border-collapse: collapse; }
    .meta-table td { padding: 4px 8px; font-size: 9.5pt; color: #94A3B8; border: none; }
    .sec-title { font-size: 12.5pt; font-weight: bold; color: #0F172A; border-bottom: 2px solid #6E1A2D; padding-bottom: 4px; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .safeguard-box { background: #FEF3C7; border: 1px solid #F59E0B; border-left: 6px solid #D97706; padding: 14px 18px; border-radius: 6px; color: #92400E; margin: 16px 0; font-size: 10.5pt; }
    .ai-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 6px solid #2563EB; padding: 18px 22px; border-radius: 6px; margin: 18px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 18px; }
    th { background: #0F172A; color: #FFFFFF; font-weight: bold; text-align: left; padding: 9px 12px; border: 1px solid #0F172A; font-size: 10pt; }
    td { padding: 8px 12px; border: 1px solid #CBD5E1; font-size: 10pt; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #CBD5E1; font-size: 9pt; color: #64748B; text-align: center; }
  </style>
</head>
<body>
  <div class="header-banner">
    <div style="margin-bottom: 8px;">
      <span class="badge">NEXUS SAP COPILOT</span>
      <span style="font-size: 9.5pt; color: #94A3B8; margin-left: 10px;">Case ID: ${caseId}</span>
    </div>
    <h1 style="color: #FFFFFF; font-size: 20pt; margin: 6px 0 10px 0; font-weight: 800;">${title}</h1>
    <p style="color: #E2E8F0; font-size: 11pt; margin: 0; line-height: 1.5;">${summary}</p>
    <table class="meta-table">
      <tr>
        <td style="color:#94A3B8;">Target Landscape: <strong style="color:#FFFFFF;">S/4HANA 2023 FPS02 · Embedded EWM</strong></td>
        <td style="color:#94A3B8; text-align: right;">Generated: <strong style="color:#FFFFFF;">${dateStr}</strong></td>
      </tr>
    </table>
  </div>

  ${doc?.safeguards ? `
    <div class="safeguard-box">
      <strong>⚠ PRODUCTION SAFEGUARD (READ-ONLY MODE):</strong><br/>
      ${doc.safeguards}
    </div>
  ` : ''}

  ${aiText ? `
    <div class="sec-title">1. Copilot Grounded Investigation & Direct Answer</div>
    <div class="ai-box">
      ${formattedAi}
    </div>
  ` : ''}

  ${doc?.overview ? `
    <div class="sec-title">2. Incident Overview & Architectural Context</div>
    <p style="color: #334155; line-height: 1.7;">${doc.overview}</p>
  ` : ''}

  ${doc?.procedure?.length ? `
    <div class="sec-title">3. Step-by-Step Triage Runbook</div>
    <ol style="padding-left: 20px; line-height: 1.8;">
      ${procedureItems}
    </ol>
  ` : ''}

  ${tcodeRows ? `
    <div class="sec-title">4. Transaction Code Reference</div>
    <table>
      <thead>
        <tr>
          <th style="width: 160px;">Transaction / T-Code</th>
          <th>Operational Purpose & Triage Description</th>
        </tr>
      </thead>
      <tbody>
        ${tcodeRows}
      </tbody>
    </table>
  ` : ''}

  ${citationBadges ? `
    <div class="sec-title">5. Grounded References & Citations</div>
    <div style="margin-top: 10px;">
      ${citationBadges}
    </div>
  ` : ''}

  <div class="footer">
    Nexus SAP Copilot · Evidence-Aware Enterprise Operations · Confidential & Internal SAP Runbook
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}_Diagnostic_Report.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseMarkdownToExcelRows(mdText) {
  if (!mdText) return [];
  const lines = mdText.split(/\r?\n/);
  const rows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      rows.push(["", ""]);
      continue;
    }

    // Markdown Table rows: | Aspect | Value 1 | Value 2 |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // Skip markdown table delimiter line: |---|---|
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map(c => c.trim().replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1"));
      rows.push(cells);
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      rows.push([trimmed.slice(2).toUpperCase(), ""]);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      rows.push(["", ""]);
      rows.push([trimmed.slice(3).toUpperCase(), ""]);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      rows.push([trimmed.slice(4), ""]);
      continue;
    }

    // Bullet points
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const clean = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
      rows.push(["•", clean]);
      continue;
    }

    // Numbered lists (1. , 2. )
    const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
    if (numMatch) {
      const num = numMatch[1];
      const clean = numMatch[2].replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
      rows.push([num, clean]);
      continue;
    }

    // Regular paragraphs
    const cleanParagraph = rawLine.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
    rows.push(["", cleanParagraph]);
  }

  return rows;
}

function handleExportExcel(doc, aiText, aiCitations) {
  const caseId = doc?.caseId || "NEXUS-SAP-INVESTIGATION";
  const title = doc?.title || "SAP Technical Investigation";
  const summary = doc?.summary || "Evidence-aware SAP diagnostic and technical investigation data.";
  const dateStr = new Date().toLocaleString();

  const wb = XLSX.utils.book_new();

  // Sheet 1: Complete Generated Investigation & Direct Answer
  const parsedInvestigationRows = parseMarkdownToExcelRows(aiText || doc?.overview || "No investigation content available.");
  const sheet1Data = [
    ["NEXUS SAP COPILOT — TECHNICAL INVESTIGATION REPORT", "", ""],
    ["", "", ""],
    ["Case Identifier", caseId, ""],
    ["Report Title", title, ""],
    ["Target Landscape", "S/4HANA 2023 FPS02 · Embedded EWM", ""],
    ["Generated Timestamp", dateStr, ""],
    ["Executive Summary", summary, ""],
    ["", "", ""],
    ["PRODUCTION SAFEGUARDS", doc?.safeguards ? `⚠ ${doc.safeguards}` : "Read-Only Diagnostic Active", ""],
    ["", "", ""],
    ["=== FULL INVESTIGATION & DETAILED ANALYSIS ===", "", ""],
    ...parsedInvestigationRows
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(sheet1Data);
  wsOverview["!cols"] = [{ wch: 28 }, { wch: 60 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, "Diagnostic Report");

  // Sheet 2: T-Codes Reference
  if (doc?.tcodes?.length) {
    const tcodeData = [
      ["Transaction / T-Code", "Operational Purpose & Description"],
      ...doc.tcodes.map(t => [t.code, t.desc])
    ];
    const wsTcodes = XLSX.utils.aoa_to_sheet(tcodeData);
    wsTcodes["!cols"] = [{ wch: 22 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsTcodes, "T-Codes");
  }

  // Sheet 3: Step-by-Step Triage Runbook
  if (doc?.procedure?.length) {
    const runbookData = [
      ["Step #", "Procedure Action"],
      ...doc.procedure.map((step, idx) => [`Step ${idx + 1}`, step])
    ];
    const wsRunbook = XLSX.utils.aoa_to_sheet(runbookData);
    wsRunbook["!cols"] = [{ wch: 12 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(wb, wsRunbook, "Triage Runbook");
  }

  // Sheet 4: Verified Citations (if present and not delivery topic)
  if (aiCitations?.length && !(doc?.caseId === "NX-DLV-0248" || doc?.title?.toLowerCase().includes("delivery"))) {
    const citData = [
      ["Citation ID", "Source Title", "URL / Grounding Reference"],
      ...aiCitations.map(c => [c.citationId || "Ref", c.title || "", c.url || "Internal SAP Reference"])
    ];
    const wsCit = XLSX.utils.aoa_to_sheet(citData);
    wsCit["!cols"] = [{ wch: 18 }, { wch: 50 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsCit, "Citations");
  }

  // Write true .xlsx binary workbook — opens natively in Excel with zero warnings and full text coverage!
  XLSX.writeFile(wb, `${caseId.replace(/[^a-zA-Z0-9_-]/g, "_")}_Diagnostic_Report.xlsx`);
}


// Modern Claude Artifact File Card matching Image 2
export function ClaudeArtifactCard({
  title = "Investigation Artifact",
  subtitle = "Document · DOCX / XLSX",
  icon = "📄",
  downloadOptions = []
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#FFFFFF",
        border: "1px solid var(--border-strong, rgba(0, 0, 0, 0.14))",
        borderRadius: 12,
        padding: "10px 16px",
        margin: "14px 0 20px 0",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        position: "relative"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Left Stacked Card / Document Icon */}
        <div
          style={{
            width: 38,
            height: 42,
            borderRadius: 8,
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
            border: "1px solid rgba(110, 26, 45, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 2px 4px rgba(110, 26, 45, 0.08)"
          }}
        >
          {icon}
        </div>

        {/* Title and Format subtitle */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary, #1C1917)",
              lineHeight: 1.35,
              letterSpacing: "-0.01em"
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted, #78716C)",
              marginTop: 2,
              fontWeight: 400
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Right Download Button with Dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setShowDropdown((d) => !d)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#1C1917",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#9CA3AF";
            e.currentTarget.style.background = "#F9FAFB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#D1D5DB";
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <span>Download</span>
          <span style={{ fontSize: 10, color: "#6B7280" }}>⌵</span>
        </button>

        {showDropdown && downloadOptions.length > 0 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "4px",
              minWidth: 240,
              zIndex: 99999
            }}
          >
            {downloadOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  opt.action();
                  setShowDropdown(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "#374151",
                  cursor: "pointer",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F3F4F6";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#374151";
                }}
              >
                <span style={{ fontSize: 16 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Workspace({
  activeTopic,
  onNavigate,
  activeSessionId,
  onSessionChange,
  activeSection: propActiveSection = "all",
  onSectionChange,
  onCaseDocChange
}) {
  const [convId, setConvId] = useState(activeSessionId || null);
  const [convs, setConvs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTopic, setSearchTopic] = useState("");
  const [doc, setDoc] = useState(null);
  const [activeSection, setActiveSection] = useState(propActiveSection || "all");
  const [copiedSession, setCopiedSession] = useState(false);
  const [vsmModalOpen, setVsmModalOpen] = useState(false);

  const copySessionId = (idToCopy) => {
    const sid = idToCopy || convId;
    if (!sid) return;
    navigator.clipboard?.writeText(sid);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2200);
  };

  // In-center reasoning state
  const [aiText, setAiText] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiCitations, setAiCitations] = useState([]);
  const [selectedModule, setSelectedModule] = useState("AUTO");
  const [activeClassification, setActiveClassification] = useState(null);
  const [followUpInput, setFollowUpInput] = useState("");
  const mainScrollRef = useRef(null);
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [hoveredTurn, setHoveredTurn] = useState(null);

  // Sync prop active section
  useEffect(() => {
    if (propActiveSection) setActiveSection(propActiveSection);
  }, [propActiveSection]);

  // Sync doc to parent active case
  useEffect(() => {
    onCaseDocChange?.(doc);
  }, [doc]);

  // React to activeSessionId and activeTopic changes (+ New button & session select)
  useEffect(() => {
    if (activeSessionId) {
      setConvId(activeSessionId);
      // Attempt loading session from DB
      loadConversation(activeSessionId).then((loaded) => {
        if (!loaded) {
          // Fresh new session without DB messages yet
          if (activeTopic) {
            handleGenerateInvestigation(activeTopic);
          } else {
            setDoc(null);
            setAiText("");
            setAiStreaming(false);
            setAiCitations([]);
            setSearchTopic("");
          }
        }
      });
    } else {
      // No activeSessionId passed
      if (activeTopic) {
        handleGenerateInvestigation(activeTopic);
      } else {
        setConvId(null);
        setDoc(null);
        setAiText("");
        setAiStreaming(false);
        setAiCitations([]);
        setSearchTopic("");
      }
    }
  }, [activeSessionId, activeTopic]);


  // Auto-expanding textarea refs
  const topTextareaRef = useRef(null);
  const followUpTextareaRef = useRef(null);

  // Auto-resize helper function
  const autoResizeTextarea = (el, minH = 42, maxH = 180) => {
    if (!el) return;
    el.style.height = "auto";
    const newH = Math.min(Math.max(el.scrollHeight, minH), maxH);
    el.style.height = `${newH}px`;
  };

  // Screenshot / Image Attach & Paste state + Excel / Document state
  const topFileRef = useRef(null);
  const followUpFileRef = useRef(null);
  const [topImage, setTopImage] = useState(null);
  const [followUpImage, setFollowUpImage] = useState(null);
  const [topDoc, setTopDoc] = useState(null);
  const [followUpDoc, setFollowUpDoc] = useState(null);

  const handlePasteImage = (e, setImage) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            const base64Data = dataUrl.split(",")[1];
            setImage({
              dataUrl,
              base64Data,
              mimeType: file.type || "image/png",
              name: file.name || "Pasted Screenshot.png"
            });
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleFileInput = async (e, setImage, setDocState) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    // Excel & CSV parsing using SheetJS
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        let totalRows = 0;
        const sheetsData = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonRows && jsonRows.length > 0) {
            const headers = jsonRows[0] || [];
            const rows = jsonRows.slice(1);
            totalRows += rows.length;

            let md = `### Sheet: "${sheetName}" (${rows.length} rows, ${headers.length} columns)\n\n`;
            if (headers.length > 0) {
              md += `| ${headers.map(h => String(h ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
              md += `| ${headers.map(() => '---').join(' | ')} |\n`;
              const sampleRows = rows.slice(0, 100);
              sampleRows.forEach(row => {
                md += `| ${headers.map((_, idx) => String(row[idx] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |\n`;
              });
              if (rows.length > 100) {
                md += `\n*(Displaying first 100 of ${rows.length} rows)*\n`;
              }
            }
            sheetsData.push(md);
          }
        });

        const combinedContent = sheetsData.join('\n\n---\n\n');
        if (setDocState) {
          setDocState({
            filename: file.name,
            type: 'excel',
            sheetCount: workbook.SheetNames.length,
            totalRows,
            content: combinedContent
          });
        }
      } catch (err) {
        alert('Failed to parse Excel spreadsheet: ' + err.message);
      }
      e.target.value = '';
      return;
    }

    // Text / Markdown parsing
    if (['txt', 'md', 'json', 'log'].includes(ext)) {
      try {
        const text = await file.text();
        if (setDocState) {
          setDocState({
            filename: file.name,
            type: 'text',
            content: text
          });
        }
      } catch (err) {
        alert('Failed to read text file: ' + err.message);
      }
      e.target.value = '';
      return;
    }

    // Standard Image screenshot
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const base64Data = dataUrl.split(",")[1];
      setImage({
        dataUrl,
        base64Data,
        mimeType: file.type || "image/png",
        name: file.name || "Attached Screenshot.png"
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getMatchedDoc = (term) => {
    const lower = (term || "").toLowerCase();
    if (lower.includes("delivery") && (lower.includes("production") || lower.includes("staging") || lower.includes("integration"))) {
      return PRESET_TOPICS.deliveryBased;
    } else if (lower.includes("smq3")) return PRESET_TOPICS.smq3;
    else if (lower.includes("smq1")) return PRESET_TOPICS.smq1;
    else if (lower.includes("smq2") || lower.includes("2025-0847") || lower.includes("jam")) return PRESET_TOPICS.smq2;
    else if (lower.includes("pmr") || (lower.includes("staging") && !lower.includes("delivery")) || lower.includes("material request")) return PRESET_TOPICS.pmr;
    else if (lower.includes("bgrfc")) return PRESET_TOPICS.bgrfc;
    else if (lower.includes("psa") || lower.includes("supply area") || lower.includes("control cycle")) return PRESET_TOPICS.psa;
    else if (lower.includes("2871625") || lower.includes("note")) return PRESET_TOPICS.note2871625;
    return generateDynamicTopic(term || "Visual Diagnostic");
  };

  const loadConversation = async (id) => {
    if (!id) return false;
    setConvId(id);
    onSessionChange?.(id);
    try {
      const data = await api.getConversation(id);
      if (data && data.messages && data.messages.length > 0) {
        let reconstructed = "";
        let isFirstTurn = true;
        let citations = [];

        data.messages.forEach((m) => {
          if (m.role === "user") {
            if (!isFirstTurn) {
              reconstructed += "\n\n---\n\n### Follow-up Query: " + m.content + "\n\n";
            }
          } else if (m.role === "model") {
            reconstructed += m.content;
            isFirstTurn = false;
            if (m.metadata?.citationIds) {
              // citations
            }
          }
        });

        let existingCaseId = null;
        if (data.title && /^NX-[A-Z0-9_-]+:/i.test(data.title)) {
          const m = data.title.match(/^(NX-[A-Z0-9_-]+):/i);
          if (m) existingCaseId = m[1];
        }
        const topicTitle = data.title?.replace(/^NX-[^:]+:\s*/, "") || data.messages[0]?.content || "Investigation";
        const matched = getMatchedDoc(topicTitle);
        if (existingCaseId) {
          matched.caseId = existingCaseId;
        }
        setDoc(matched);
        onCaseDocChange?.(matched);
        setSearchTopic(topicTitle);
        setAiText(reconstructed);
        setAiStreaming(false);
        return true;
      } else {
        // Blank session with no messages yet
        setAiText("");
        setAiStreaming(false);
        const topicTitle = data?.title?.replace(/^NX-[^:]+:\s*/, "") || "";
        if (topicTitle && !topicTitle.startsWith("New Session")) {
          setDoc(getMatchedDoc(topicTitle));
          setSearchTopic(topicTitle);
        } else {
          setDoc(getMatchedDoc("New Session"));
          setSearchTopic("");
        }
        return true;
      }
    } catch (err) {
      console.error("Failed to load conversation from DB:", err);
    }
    return false;
  };

  const handleGenerateInvestigation = async (topicTerm, passedImg = null, passedDoc = null) => {
    const term = (topicTerm || searchTopic || "").trim();
    const activeImg = passedImg || topImage;
    const activeDoc = passedDoc || topDoc;
    if (!term && !activeImg && !activeDoc) return;

    const matchedDoc = getMatchedDoc(term);
    setDoc(matchedDoc);
    setSearchTopic(term);
    setAiText("");
    setAiStreaming(true);
    setAiCitations([]);
    setTopImage(null);
    setTopDoc(null);

    // 1. Maintain / Create conversation in backend
    let currentConvId = convId;
    try {
      if (!currentConvId) {
        const convRes = await api.createConversation({ title: matchedDoc.caseId + ": " + (term.substring(0, 50) || "Visual Inspection") });
        if (convRes?.conversation) {
          currentConvId = convRes.conversation.id;
          setConvId(currentConvId);
          onSessionChange?.(currentConvId);
          setConvs((prev) => [convRes.conversation, ...prev.filter(c => c.id !== currentConvId)]);
        }
      } else {
        const updatedTitle = matchedDoc.caseId + ": " + (term.substring(0, 50) || "Investigation");
        api.updateConversation(currentConvId, { title: updatedTitle }).catch(() => {});
        setConvs((prev) => prev.map(c => c.id === currentConvId ? { ...c, title: updatedTitle } : c));
      }
    } catch (e) {}

    // 2. Stream AI reasoning directly into the center canvas!
    try {
      const isDeliveryPrompt = /delivery[-\s]based/i.test(term);
      const prompt = isDeliveryPrompt
        ? "Explain delivery-based production integration in SAP PP/EWM and distinguish it from PMR-based Advanced Production Integration. Do not assume release, architecture, communication technology, or staging method."
        : (term.trim().length > 15 || term.includes(" ") ? term.trim() : "Investigate topic: " + (term.trim() || (activeDoc ? "Analyze attached spreadsheet" : "Analyze attached SAP screenshot")));
      
      const userParts = [{ text: prompt }];
      if (activeImg?.base64Data) {
        userParts.push({
          inlineData: {
            mimeType: activeImg.mimeType || "image/png",
            data: activeImg.base64Data
          }
        });
      }

      await api.streamChat(
        {
          conversationId: currentConvId,
          contents: [{ role: "user", parts: userParts }],
          selectedModule,
          mentorMode: false,
          uploadedDocs: activeDoc ? [activeDoc] : []
        },
        (chunk, fullText) => {
          setAiText(fullText);
        },
        (sources) => {
          setAiCitations(sources || []);
        },
        (classification) => {
          setActiveClassification(classification);
        }
      );
    } catch (err) {
      setAiText("⚠ AI Reasoning Note: " + (err.message || "Failed to stream live reasoning. Showing verified standard runbook below."));
    } finally {
      setAiStreaming(false);
    }
  };

  // Extract turn objects from doc/searchTopic and aiText
  const conversationTurns = useMemo(() => {
    if (!aiText && !doc) return [];
    const turns = [];
    const initialTitle = searchTopic || doc?.title || "Initial Inquiry";

    if (aiText) {
      const rawSegments = aiText.split(/\n\n---\n\n(?=### Follow-up Query:)/g);
      rawSegments.forEach((segment, sIdx) => {
        let turnTitle = "";
        if (sIdx === 0) {
          turnTitle = initialTitle;
        } else {
          const match = segment.match(/### Follow-up Query:\s*([^\n]+)/);
          turnTitle = match ? match[1].replace(/\*\([^\)]+\)\*/g, '').trim() : `Follow-up ${sIdx}`;
        }
        turns.push({
          id: `turn-seg-${sIdx}`,
          index: sIdx,
          title: turnTitle || `Turn ${sIdx + 1}`,
          content: segment
        });
      });
    } else if (doc) {
      turns.push({
        id: "turn-seg-0",
        index: 0,
        title: initialTitle,
        content: ""
      });
    }

    return turns;
  }, [aiText, doc, searchTopic]);

  // Scroll listener to update active turn dot
  useEffect(() => {
    const container = mainScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const turnEls = container.querySelectorAll('[id^="turn-seg-"]');
      if (!turnEls.length) return;

      const containerTop = container.getBoundingClientRect().top;
      let currentActive = 0;

      turnEls.forEach((turnEl, idx) => {
        const rect = turnEl.getBoundingClientRect();
        if (rect.top - containerTop <= 200) {
          currentActive = idx;
        }
      });

      setActiveTurnIndex(currentActive);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [conversationTurns]);

  const handleBottomSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const q = followUpInput.trim();
    const activeImg = followUpImage;
    const activeDoc = followUpDoc;
    if ((!q && !activeImg && !activeDoc) || aiStreaming) return;

    // If fresh session with no prior aiText, treat as primary new inquiry!
    if (!aiText || aiText.trim() === "") {
      setFollowUpInput("");
      setFollowUpImage(null);
      setFollowUpDoc(null);
      if (followUpTextareaRef.current) {
        followUpTextareaRef.current.style.height = "42px";
      }
      handleGenerateInvestigation(q, activeImg, activeDoc);
    } else {
      handleFollowUp(e);
    }
  };

  const handleFollowUp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const q = followUpInput.trim();
    const activeImg = followUpImage;
    const activeDoc = followUpDoc;
    if ((!q && !activeImg && !activeDoc) || aiStreaming) return;

    setFollowUpInput("");
    setFollowUpImage(null);
    setFollowUpDoc(null);
    if (followUpTextareaRef.current) {
      followUpTextareaRef.current.style.height = "42px";
    }
    setAiStreaming(true);

    const prevText = aiText;
    const imgLabel = activeImg ? `\n\n*(Attached Screenshot: ${activeImg.name})*` : "";
    const docLabel = activeDoc ? `\n\n*(Attached Spreadsheet: ${activeDoc.filename} — ${activeDoc.sheetCount} sheets, ${activeDoc.totalRows} rows)*` : "";
    setAiText(prevText + "\n\n---\n\n### Follow-up Query: " + (q || (activeDoc ? "Analyze attached spreadsheet" : "Analyze screenshot")) + imgLabel + docLabel + "\n\n*Reasoning...*");

    try {
      let accumulated = "";
      const userParts = [{ text: q || (activeDoc ? "Please inspect and analyze this attached spreadsheet data." : "Please inspect this attached SAP screenshot and provide diagnostics.") }];
      if (activeImg?.base64Data) {
        userParts.push({
          inlineData: {
            mimeType: activeImg.mimeType || "image/png",
            data: activeImg.base64Data
          }
        });
      }

      await api.streamChat(
        {
          conversationId: convId,
          contents: [
            { role: "user", parts: userParts }
          ],
          selectedModule,
          mentorMode: false,
          uploadedDocs: activeDoc ? [activeDoc] : []
        },
        (chunk, fullText) => {
          accumulated = fullText;
          setAiText(prevText + "\n\n---\n\n### Follow-up Query: " + (q || (activeDoc ? "Spreadsheet Analysis" : "Screenshot Analysis")) + imgLabel + docLabel + "\n\n" + fullText);
        },
        (sources) => {
          if (sources?.length) {
            setAiCitations((prev) => [...prev, ...sources]);
          }
        },
        (classification) => {
          setActiveClassification(classification);
        }
      );
    } catch (err) {
      setAiText(prevText + "\n\n---\n\n### Follow-up Query: " + q + "\n\n⚠ Error: " + err.message);
    } finally {
      setAiStreaming(false);
    }
  };

  // Load conversation list from DB on mount
  useEffect(() => {
    let isMounted = true;
    api.getConversations().then(async (d) => {
      if (!isMounted) return;
      const list = d.conversations || [];
      setConvs(list);

      // If no active topic, no active session, and no current conversation, load the latest session if available
      if (!activeTopic && !activeSessionId && !convId && list.length > 0) {
        loadConversation(list[0].id);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const startNewChat = async () => {
    try {
      const d = await api.createConversation({ title: "New Session - " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      const c = d.conversation;
      if (c) {
        setConvs((prev) => [c, ...prev.filter(x => x.id !== c.id)]);
        setConvId(c.id);
        onSessionChange?.(c.id);
        const defaultDoc = getMatchedDoc("New Session");
        setDoc(defaultDoc);
        setSearchTopic("");
        setAiText("");
        setAiCitations([]);
      }
    } catch (e) {
      const fallbackId = "conv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      setConvId(fallbackId);
      onSessionChange?.(fallbackId);
      setDoc(getMatchedDoc("New Session"));
      setSearchTopic("");
      setAiText("");
      setAiCitations([]);
    }
  };


  const SECTIONS = [
    { id: "all", label: "📄 Complete Investigation" },
    { id: "ai", label: "⚡ AI Live Reasoning" },
    { id: "overview", label: "1. Incident Overview" },
    { id: "symptoms", label: "2. Diagnostic Symptoms" },
    { id: "safeguards", label: "3. Production Safeguards" },
    { id: "procedure", label: "4. Step-by-Step Triage" },
    { id: "tcodes", label: "5. T-Code Reference" },
    { id: "evidence", label: "6. Official Citations" }
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "var(--bg-main, #F5F1EB)",
        padding: "8px 12px 10px 12px",
        boxSizing: "border-box"
      }}
    >
      {/* ── CENTER MAIN INVESTIGATION SESSION BOX (Red Framed Box immediately below Top Bar) ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 12,
          background: "#FFFFFF",
          border: aiStreaming ? "2.5px solid #EF4444" : "2px solid #EF4444",
          boxShadow: aiStreaming
            ? "0 0 16px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.08)"
            : "0 2px 10px rgba(0, 0, 0, 0.04), 0 0 4px rgba(239, 68, 68, 0.15)",
          animation: aiStreaming ? "teamsBorderPulse 2s infinite ease-in-out" : "none",
          position: "relative",
          transition: "border 0.2s ease, box-shadow 0.2s ease"
        }}
      >


        {/* Full-width Scrollable Container inside framed box */}
        <div ref={mainScrollRef} style={{ flex: 1, overflowY: "auto", width: "100%", background: "#FFFFFF", position: "relative" }}>
          <div style={{ padding: "28px 44px 32px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>



          {/* Clean Initial Greeting / Empty State when fresh */}
          {!doc && !aiText && !aiStreaming && (
            <div style={{ maxWidth: 900, padding: "30px 0 20px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>SAP Landscape Ready · Read-Only Mode</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "-0.02em" }}>
                Nexus SAP Copilot Workspace
              </h1>
              <p style={{ fontSize: 15, color: "var(--text-body)", lineHeight: 1.65, marginBottom: 28, maxWidth: 760 }}>
                Ask a question, enter an SAP transaction code, queue identifier (e.g. SMQ1, SMQ2), or choose a quick preset above to start a direct investigation.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 16 }}>
                {[
                  { title: "Delivery-Based Production", query: "delivery-based production integration", desc: "Conceptual delivery staging mechanics and PMR comparison." },
                  { title: "Inbound qRFC Queue (SMQ2)", query: "SMQ2", desc: "Triage stuck inbound queues, LUWs, and scheduler settings." },
                  { title: "Production Material Request (PMR)", query: "PMR staging", desc: "Advanced Production Integration & staging workflows in EWM." },
                  { title: "bgRFC vs qRFC Architecture", query: "bgRFC vs qRFC", desc: "Compare background RFC supervisors and classic queue monitors." }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchTopic(item.query);
                      handleGenerateInvestigation(item.query);
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "16px 18px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                      background: "var(--bg-surface)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--orange)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Case Banner when Doc Loaded */}
          {doc && (
            <div id="turn-seg-0" style={{ scrollMarginTop: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "3px 10px", borderRadius: 4 }}>
                  Active Case
                </span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--burgundy-rich, #6E1A2D)", fontWeight: 800 }}>
                  {doc.caseId} · {aiStreaming ? "Running Diagnostic" : (aiText ? "Diagnostic Complete" : "Ready for Investigation")}
                </span>

                {/* Unique Session ID Tag with Copy */}
                <button
                  type="button"
                  onClick={() => copySessionId(convId)}
                  title="Click to copy Unique Session Reference ID"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "#EDEDED",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>SESSION:</span>
                  <span style={{ color: "var(--orange)", fontWeight: 700 }}>{convId || "conv-init"}</span>
                  <span style={{ fontSize: 10, color: copiedSession ? "var(--green)" : "var(--text-muted)" }}>
                    {copiedSession ? "✓ Copied" : "📋"}
                  </span>
                </button>

                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
                  Landscape: S/4HANA 2023 FPS02 · Embedded EWM
                </span>

                {/* High-Contrast Clean Export Pills */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleExportWord(doc, aiText, aiCitations)}
                    title="Export Styled Report to Word (.doc)"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#1E3A8A",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-mono, monospace)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6E1A2D"; e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#FFFFFF"; }}
                  >
                    <span style={{ fontSize: 13 }}>📄</span>
                    <span>Export Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportExcel(doc, aiText, aiCitations)}
                    title="Export Styled Diagnostic Data to Excel (.xls)"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#065F46",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-mono, monospace)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6E1A2D"; e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#FFFFFF"; }}
                  >
                    <span style={{ fontSize: 13 }}>📊</span>
                    <span>Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVsmModalOpen(true)}
                    title="Open Value Stream Mapping & Architecture Studio"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#6B21A8",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-mono, monospace)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6E1A2D"; e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#FFFFFF"; }}
                  >
                    <span style={{ fontSize: 13 }}>🗺️</span>
                    <span>Stream Mapping</span>
                  </button>
                </div>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.02em" }}>
                {doc.title}
              </h1>
              <p style={{ fontSize: 14.5, color: "var(--text-body)", lineHeight: 1.65, maxWidth: 840, marginBottom: 24 }}>
                {doc.summary}
              </p>
            </div>
          )}

          {/* Plain AI Streaming / Output (NO CARDS, Plain text format) */}
          {(aiText || aiStreaming) && (activeSection === "all" || activeSection === "ai") && (
            <div style={{ marginBottom: 28, maxWidth: 900 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--orange)", display: "inline-block" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    NEXUS SAP COPILOT
                  </span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                  {aiStreaming && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ClaudeThinkingFlower text="Laying out the order flow" />
                    </div>
                  )}
                  {!aiStreaming && aiText && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleExportWord(doc, aiText, aiCitations)}
                        title="Export to Microsoft Word (.doc) with Colorful Template"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          padding: "3px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        📄 Word
                      </button>
                      <button
                        onClick={() => handleExportExcel(doc, aiText, aiCitations)}
                        title="Export to Microsoft Excel (.xls) with Colorful Tables"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          padding: "3px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        📊 Excel
                      </button>
                      <button
                        onClick={() => setVsmModalOpen(true)}
                        title="Export Value Stream Current State Map to Excel with Visual Flow and Colors"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "var(--bg-surface)",
                          border: "1px solid rgba(168,85,247,0.4)",
                          color: "#A855F7",
                          padding: "3px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600
                        }}
                      >
                        🗺️ Stream Mapping
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialization Classification HUD */}
              {activeClassification && (
                <ClassificationHUD classification={activeClassification} />
              )}

              {/* Formatted Output directly mapped by conversation turn segments */}
              {conversationTurns.length > 0 ? (
                conversationTurns.map((turn, tIdx) => (
                  <div
                    key={turn.id}
                    id={turn.id}
                    style={{
                      scrollMarginTop: "40px",
                      marginBottom: tIdx === conversationTurns.length - 1 ? 0 : 36,
                      position: "relative"
                    }}
                  >
                    <FormattedText text={turn.content} />
                  </div>
                ))
              ) : (
                <FormattedText text={aiText} />
              )}
            </div>
          )}

          {/* Static Preset Sections: Render ONLY when doc is present and no AI text */}
          {doc && !aiText && !aiStreaming && (
            <>
              {/* Section 1: Incident Overview */}
              {(activeSection === "all" || activeSection === "overview") && (
                <section style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 8, marginBottom: 14 }}>
                    1. Incident Overview
                  </h2>
                  <FormattedText text={doc.overview} />
                </section>
              )}

              {/* Section 2: Diagnostic Symptoms */}
              {(activeSection === "all" || activeSection === "symptoms") && (
                <section style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 8, marginBottom: 14 }}>
                    2. Diagnostic Symptoms
                  </h2>
                  <ul style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.9, paddingLeft: 22 }}>
                    {doc.symptoms.map((s, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Section 3: Production Safeguards */}
              {(activeSection === "all" || activeSection === "safeguards") && (
                <section style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 8, marginBottom: 14 }}>
                    3. Production Safeguards
                  </h2>
                  <div style={{ background: "var(--amber-light)", border: "1px solid var(--amber-border)", borderRadius: 8, padding: 16, fontSize: 13.5, color: "var(--amber-text)", marginBottom: 12, lineHeight: 1.6 }}>
                    ⚠ <strong>Read-Only Mode Active:</strong> {doc.safeguards}
                  </div>
                  <div style={{ background: "var(--blue-light)", border: "1px solid var(--blue-border)", borderRadius: 8, padding: 16, fontSize: 13.5, color: "var(--blue-text)", lineHeight: 1.6 }}>
                    ℹ <strong>Production Policy:</strong> All operational changes must be verified against authorization objects and rehearsed in sandbox environments.
                  </div>
                </section>
              )}

              {/* Section 4: Step-by-Step Triage */}
              {(activeSection === "all" || activeSection === "procedure") && (
                <section style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 8, marginBottom: 14 }}>
                    4. Step-by-Step Triage Runbook
                  </h2>
                  <ol style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.85, paddingLeft: 22 }}>
                    {doc.procedure.map((step, i) => (
                      <li key={i} style={{ marginBottom: 10 }}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Section 5: T-Code Reference */}
              {(activeSection === "all" || activeSection === "tcodes") && (
                <section style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 8, marginBottom: 14 }}>
                    5. T-Code Reference Cards
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                    {doc.tcodes.map((t) => (
                      <div key={t.code} style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "16px 18px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: "var(--orange)", marginBottom: 6 }}>
                          {t.code}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                          {t.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 6: Official Citations */}
              {(activeSection === "all" || activeSection === "evidence") && (
                <section style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--border-subtle)", paddingBottom: 8, marginBottom: 14 }}>
                    6. Citations & Grounding Status
                  </h2>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18 }}>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--orange)", marginBottom: 4, fontWeight: 700 }}>
                      REFERENCE INFORMATION
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                      {doc.citation}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      {doc.citation?.includes("General model knowledge") || doc.caseId === "NX-DLV-0248"
                        ? "Evidence status: No directly matching official source was retrieved for this topic. General model knowledge."
                        : "Verified reference from official SAP documentation index."}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
          </div>
        </div>

        {/* In-Canvas Bottom Follow-up Bar (Full Width in Middle) */}
        <div style={{ padding: "10px 24px", background: "#FAF8F5", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <form onSubmit={handleBottomSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <SpecializationSelector selectedModule={selectedModule} onSelectModule={setSelectedModule} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                SAP Expert Domains: GTS · IS-Retail · SD · EWM · Cross-Module
              </span>
            </div>
            {followUpImage && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(110, 26, 45,0.1)", border: "1px solid rgba(110, 26, 45,0.3)", borderRadius: 6, padding: "4px 10px", width: "fit-content" }}>
                <img src={followUpImage.dataUrl} alt="Screenshot Preview" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border-subtle)" }} />
                <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--orange)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📷 {followUpImage.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFollowUpImage(null)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 2px", fontSize: 13, fontWeight: "bold" }}
                  title="Remove attached screenshot"
                >
                  ✕
                </button>
              </div>
            )}
            {followUpDoc && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: followUpDoc.type === 'excel' ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)", border: `1px solid ${followUpDoc.type === 'excel' ? 'rgba(110,231,183,0.4)' : 'rgba(147,197,253,0.4)'}`, borderRadius: 6, padding: "4px 10px", width: "fit-content" }}>
                <span style={{ fontSize: 13 }}>{followUpDoc.type === 'excel' ? '📊' : '📄'}</span>
                <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: followUpDoc.type === 'excel' ? "#34D399" : "#93C5FD", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {followUpDoc.filename} {followUpDoc.sheetCount ? `(${followUpDoc.sheetCount} sheets, ${followUpDoc.totalRows} rows)` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setFollowUpDoc(null)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 2px", fontSize: 13, fontWeight: "bold" }}
                  title="Remove attached spreadsheet"
                >
                  ✕
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "flex-end" }}>
                <textarea
                  ref={followUpTextareaRef}
                  rows={1}
                  value={followUpInput}
                  onChange={(e) => {
                    setFollowUpInput(e.target.value);
                    autoResizeTextarea(e.target, 42, 180);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleBottomSubmit(e);
                    }
                  }}
                  onPaste={(e) => {
                    handlePasteImage(e, setFollowUpImage);
                    setTimeout(() => {
                      if (followUpTextareaRef.current) autoResizeTextarea(followUpTextareaRef.current, 42, 180);
                    }, 0);
                  }}
                  placeholder={!aiText ? "Enter SAP topic, paste error screenshot, or attach Excel spreadsheet (Enter to send)..." : "Ask a follow-up, analyze spreadsheet data, or paste an SAP screenshot (Enter to send)..."}
                  disabled={aiStreaming}
                  style={{
                    width: "100%",
                    minHeight: 42,
                    maxHeight: 180,
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    padding: "10px 42px 10px 16px",
                    fontSize: 13.5,
                    color: "var(--text-primary)",
                    outline: "none",
                    resize: "none",
                    lineHeight: "20px",
                    boxSizing: "border-box",
                    overflowY: "auto",
                    fontFamily: "inherit"
                  }}
                />
                <input
                  type="file"
                  ref={followUpFileRef}
                  onChange={(e) => handleFileInput(e, setFollowUpImage, setFollowUpDoc)}
                  accept="image/*,.xlsx,.xls,.csv,.pdf,.txt,.md,.json"
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => followUpFileRef.current?.click()}
                  title="Attach Excel (.xlsx, .csv), Document, or Screenshot (Ctrl+V)"
                  disabled={aiStreaming}
                  style={{
                    position: "absolute",
                    right: 10,
                    bottom: 9,
                    background: "none",
                    border: "none",
                    color: (followUpImage || followUpDoc) ? "var(--orange)" : "var(--text-muted)",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                </button>
              </div>
              <button
                type="submit"
                disabled={aiStreaming || (!followUpInput.trim() && !followUpImage && !followUpDoc)}
                className="btn-primary"
                style={{ padding: "10px 24px", fontSize: 13.5, whiteSpace: "nowrap", height: 42, alignSelf: "flex-end" }}
              >
                {aiStreaming ? "Reasoning..." : "Send"}
              </button>
            </div>
          </form>
        </div>
        {/* Right-Side Input Turn Navigation Dots Rail */}
        {conversationTurns.length >= 1 && (
          <div
            style={{
              position: "fixed",
              right: "22px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 7px",
              borderRadius: 24,
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              backdropFilter: "blur(10px)"
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 2
              }}
            >
              TURNS
            </span>

            {conversationTurns.map((turn, tIdx) => {
              const isActive = activeTurnIndex === tIdx;
              const isHovered = hoveredTurn === tIdx;

              return (
                <div
                  key={turn.id}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {/* Connecting vertical line segment */}
                  {tIdx < conversationTurns.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 13,
                        width: 2,
                        height: 12,
                        background: "var(--border-subtle)",
                        zIndex: 0
                      }}
                    />
                  )}

                  {/* Dot Button */}
                  <button
                    onClick={() => {
                      const el = document.getElementById(turn.id);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        setActiveTurnIndex(tIdx);
                      }
                    }}
                    onMouseEnter={() => setHoveredTurn(tIdx)}
                    onMouseLeave={() => setHoveredTurn(null)}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      width: isActive ? 13 : 9,
                      height: isActive ? 13 : 9,
                      borderRadius: "50%",
                      background: isActive ? "var(--orange)" : isHovered ? "var(--text-primary)" : "var(--bg-card)",
                      border: isActive
                        ? "2px solid var(--orange)"
                        : isHovered
                        ? "2px solid var(--orange)"
                        : "2px solid var(--border-strong)",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isHovered ? "scale(1.4)" : "scale(1)",
                      boxShadow: isActive ? "0 0 8px rgba(110, 26, 45,0.65)" : "none"
                    }}
                    aria-label={`Jump to: ${turn.title}`}
                  />

                  {/* Hover Preview Tooltip on Left */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        right: 28,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-strong)",
                        boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                        borderRadius: 7,
                        padding: "6px 12px",
                        whiteSpace: "nowrap",
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        pointerEvents: "none",
                        fontFamily: "var(--font-sans)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        zIndex: 99
                      }}
                    >
                      <span
                        style={{
                          background: "rgba(110, 26, 45,0.12)",
                          color: "var(--orange)",
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 800,
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        Q${tIdx + 1}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {turn.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      
      <ValueStreamMapModal
        isOpen={vsmModalOpen}
        onClose={() => setVsmModalOpen(false)}
        doc={doc}
        aiText={aiText}
        aiCitations={aiCitations}
        sessionId={convId}
        conversationTurns={conversationTurns}
      />
      </div>
    </div>
  );
}
