import ValueStreamMapModal from "../components/ValueStreamMapModal.jsx";
import SessionDeckBuilderModal from "../components/SessionDeckBuilderModal.jsx";
import PptxExportValidationModal from "../components/PptxExportValidationModal.jsx";
import TaskInfoPopover from "../components/TaskInfoPopover.jsx";
import { parseNexusSapAnswer } from "../services/sapAnswerPptxParser.js";
import { generateSapKnowledgeDeck } from "../services/sapKnowledgeDeckGenerator.js";
import { exportValueStreamMapExcel } from "../utils/valueStreamMapping.js";
import { exportSapPresentationPptx } from "../utils/exportPptx.js";
import { CHEZZ_BRAND } from "../utils/chezzTemplates.js";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Lenis from "lenis";
import * as XLSX from "xlsx";
import { api } from "../api.js";
import OrganizationalDiagram from "../components/diagram/OrganizationalDiagram.jsx";
import MermaidDiagram, { ClaudeThinkingFlower } from "../components/MermaidDiagram.jsx";
import { DEFAULT_SAP_PP_ORG_STRUCTURE } from "../components/diagram/diagramData.js";
import SpecializationSelector from "../components/SpecializationSelector.jsx";
import ClassificationHUD from "../components/ClassificationHUD.jsx";
import UniversalStrategyRenderer from "./visualizations/renderers/UniversalStrategyRenderer.jsx";
import { exportToEditablePowerPoint } from "./visualizations/engine/pptxExport.js";
import NexusDocCard from "../components/NexusDocCard.jsx";
import NexusDocPanel from "../components/NexusDocPanel.jsx";
import SlashCommandMenu from "../components/SlashCommandMenu.jsx";
import ExpandableThinking from "../components/ExpandableThinking.jsx";
import GroundingSourcesPanel from "../components/GroundingSourcesPanel.jsx";
import TCodeHoverCard, { isKnownTCode } from "../components/TCodeHoverCard.jsx";
import { SemanticIncidentMatcherModal, DeepResearchModal } from "../components/GeminiModals.jsx";
import ShiftHandoverModal from "../components/ShiftHandoverModal.jsx";
import SapActionTimelineCard from "../components/SapActionTimelineCard.jsx";
import WarehouseVisualRenderer from "../components/WarehouseVisualRenderer.jsx";
import EmailDraftCard from "../components/EmailDraftCard.jsx";
import ModernCodeBlock from "../components/ModernCodeBlock.jsx";
import ModernImageLoader from "../components/ModernImageLoader.jsx";
import ModernTableCard from "../components/ModernTableCard.jsx";
import { useAuth } from "../App.jsx";



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
    title: "SAP EWM qRFC Queue Jam — Stuck Transfer Orders & Inbound LUWs (Sample Demo Data · AI not connected)",
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

export function generateClaudeChatTitle(term) {
  if (!term || typeof term !== "string") return "New Chat";
  const clean = term.trim();
  if (!clean) return "New Chat";

  const upper = clean.toUpperCase();
  if (upper === "PSA" || upper.includes("PRODUCTION SUPPLY AREA")) {
    return "Production Supply Area (PSA) Setup";
  }
  if (upper === "PP" || upper.includes("PRODUCTION PLANNING")) {
    return "SAP Production Planning (PP) Architecture";
  }
  if (upper.includes("SMQ1") || upper.includes("SMQ2") || upper.includes("QRFC")) {
    return "qRFC Queue Diagnostics & Triage";
  }
  if (upper.includes("BGRFC")) {
    return "bgRFC vs qRFC Supervisor Setup";
  }
  if (upper.includes("BOM")) {
    return "Bill of Materials (BOM) Explosion";
  }
  if (upper.includes("COOKBOOK") || upper.includes("SPREADSHEET") || upper.includes("NESTLE")) {
    return "EWM Production Cookbook Analysis";
  }
  if (upper.includes("PMR") || upper.includes("DELIVERY")) {
    return "PMR vs Delivery-Based Staging";
  }
  if (upper.includes("RF") || upper.includes("RFUI") || upper.includes("BARCODE")) {
    return "SAP Mobile RF Terminal Configuration";
  }

  // Capitalize nicely up to 5 words
  const words = clean.split(/\s+/).slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return words.length > 36 ? words.substring(0, 33) + "..." : words;
}

function generateDynamicTopic(term) {
  const t = term.trim().toUpperCase();
  const slug = t.replace(/[^A-Z0-9]/g, "").substring(0, 8) || "GEN";
  const num = Math.floor(1000 + Math.random() * 9000);
  const isDelivery = t.includes("DELIVERY");
  const claudeTitle = generateClaudeChatTitle(term);
  return {
    caseId: "NX-" + slug + "-" + num,
    title: "SAP S/4HANA: " + claudeTitle,
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

function isVisualStrategyModel(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    Array.isArray(obj.nodes) && obj.nodes.length > 0 &&
    (obj.visualPattern || obj.visualType || obj.connectors || obj.lanes || obj.contentUnderstanding)
  );
}

// Splits markdown text into markdown blocks, interactive diagram blocks, visual strategy blocks, and code blocks
function parseContentBlocks(text) {
  if (!text) return [];
  const blocks = [];

  // Normalize malformed `csv\n or ``csv\n into standard ```csv\n code fences
  const cleanText = (text || "").replace(/(?:^|\n)`{1,2}(csv|tsv|abap|sql|json|sh|bash|text)\n/gi, '\n```$1\n');

  // Match code fences (including unclosed fences during active streaming)
  const fenceRegex = /```([a-zA-Z0-9_.:-]*)\s*\n?([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match;

  while ((match = fenceRegex.exec(cleanText)) !== null) {
    const textBefore = cleanText.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      pushMarkdownWithUnfencedDiagram(blocks, textBefore);
    }

    const lang = (match[1] || "").toLowerCase().trim();
    const code = match[2].trim();

    // Check if it's an architectural warehouse visual diagram (Feature #25)
    if (lang === "warehouse-visual" || lang === "warehouse_visual" || lang === "visual-layout") {
      try {
        const parsed = JSON.parse(code);
        blocks.push({ type: "warehouse_visual", data: parsed });
        lastIndex = match.index + match[0].length;
        continue;
      } catch (e) {}
    }

    // Check if it's a structured diagram block or visual strategy model
    const isExplicitDiagram = lang === "json:diagram" || lang === "diagram" || lang === "json-diagram";
    let parsedDiagramData = null;

    if (isExplicitDiagram || lang === "json") {
      try {
        const parsed = JSON.parse(code);
        if (isVisualStrategyModel(parsed)) {
          blocks.push({ type: "visual_strategy", data: parsed });
          lastIndex = match.index + match[0].length;
          continue;
        } else if (parsed && (parsed.nodes || parsed.enterprise || parsed.rootId || parsed.title?.toLowerCase().includes("organizational") || parsed.title?.toLowerCase().includes("pp") || isExplicitDiagram)) {
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

  const remaining = cleanText.slice(lastIndex);
  if (remaining.trim()) {
    pushMarkdownWithUnfencedDiagram(blocks, remaining);
  }

  return blocks;
}

function pushMarkdownWithUnfencedDiagram(blocks, text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isVisualStrategyModel(parsed)) {
        blocks.push({ type: "visual_strategy", data: parsed });
        return;
      }
    } catch (_) {}
  }

  // Look for JSON object embedded in text
  const jsonStart = text.indexOf('{"title"');
  if (jsonStart !== -1) {
    const jsonEnd = text.lastIndexOf("}");
    if (jsonEnd > jsonStart) {
      try {
        const potential = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        if (isVisualStrategyModel(potential)) {
          const before = text.slice(0, jsonStart).trim();
          if (before) blocks.push({ type: "markdown", content: before });
          blocks.push({ type: "visual_strategy", data: potential });
          const after = text.slice(jsonEnd + 1).trim();
          if (after) blocks.push({ type: "markdown", content: after });
          return;
        }
      } catch (_) {}
    }
  }

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

    // Table parsing (handles streaming table rows cleanly)
    if (trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith("|")) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCols = tableLines[0].replace(/^\||\|$/g, '').split("|").map(c => c.trim());
        const rowStartIndex = tableLines[1].includes("---") ? 2 : 1;
        const rows = tableLines.slice(rowStartIndex).map(r => r.replace(/^\||\|$/g, '').split("|").map(c => c.trim()));
        elements.push(
          <ModernTableCard
            key={`${blockKey}-tbl-${i}`}
            headers={headerCols}
            rows={rows}
            renderInline={renderInline}
          />
        );
        continue;
      }
    }

    // Unfenced Semicolon/CSV Data Detection:
    // Automatically transforms raw semicolon or comma records into an interactive ModernCodeBlock table card with 1-click downloads
    if (trimmed.includes(";") && (trimmed.match(/;/g) || []).length >= 2) {
      const csvLines = [];
      let lookahead = i;
      while (lookahead < rawLines.length) {
        const lTrim = rawLines[lookahead].trim();
        if (!lTrim) {
          if (lookahead + 1 < rawLines.length && rawLines[lookahead + 1].trim().includes(";") && (rawLines[lookahead + 1].trim().match(/;/g) || []).length >= 2) {
            lookahead++;
            continue;
          }
          break;
        }
        if (lTrim.includes(";") && (lTrim.match(/;/g) || []).length >= 2) {
          csvLines.push(lTrim);
          lookahead++;
        } else {
          break;
        }
      }

      if (csvLines.length >= 2) {
        elements.push(
          <ModernCodeBlock
            key={`${blockKey}-unfenced-csv-${i}`}
            code={csvLines.join("\n")}
            language="csv"
            title="Sanitized Data Template"
          />
        );
        i = lookahead;
        continue;
      }
    }

    // Contiguous Blockquote & Email Draft Parsing (handles multi-line and prevents split > fragments)
    if (trimmed.startsWith(">") || trimmed === ">") {
      const quoteLines = [];
      const quoteStartIndex = i;

      while (i < rawLines.length) {
        const curLine = rawLines[i];
        const curTrim = curLine.trim();

        if (curTrim.startsWith(">")) {
          // Remove leading '>' and optional space
          quoteLines.push(curTrim.replace(/^>\s?/, ""));
          i++;
        } else if (curTrim === "") {
          // Look ahead to check if quote continues after an empty line
          let lookahead = i + 1;
          while (lookahead < rawLines.length && rawLines[lookahead].trim() === "") {
            lookahead++;
          }
          if (lookahead < rawLines.length && rawLines[lookahead].trim().startsWith(">")) {
            quoteLines.push(""); // preserve empty line between paragraphs inside quote
            i++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Check if this contiguous quote block is an Email Draft
      const fullQuoteRaw = quoteLines.join("\n");
      const hasSubject = quoteLines.some(l => /^(?:\*\*|\*|#*\s*)?subject\s*:/i.test(l.trim()));
      const hasSalutation = quoteLines.some(l => /^(?:hi|dear|hello|greetings)\s+/i.test(l.trim()));
      const isEmail = hasSubject || (hasSalutation && (fullQuoteRaw.includes("@") || /regards|sincerely|best,/i.test(fullQuoteRaw)));

      if (isEmail) {
        let subject = "";
        let to = "";
        const bodyLines = [];

        for (const line of quoteLines) {
          const lTrim = line.trim();
          if (/^(?:\*\*|\*|#*\s*)?subject\s*:/i.test(lTrim) && !subject) {
            subject = lTrim;
          } else if (/^(?:\*\*|\*|#*\s*)?to\s*:/i.test(lTrim) && !to) {
            to = lTrim.replace(/^(?:\*\*|\*|#*\s*)?to\s*:?\s*(?:\*\*|\*)?\s*/i, "").trim();
          } else {
            bodyLines.push(line);
          }
        }

        // Group body lines into clean paragraphs
        const paragraphs = [];
        let currentPara = [];
        for (const line of bodyLines) {
          if (!line.trim()) {
            if (currentPara.length > 0) {
              paragraphs.push(currentPara.join(" "));
              currentPara = [];
            }
          } else {
            currentPara.push(line);
          }
        }
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(" "));
        }

        elements.push(
          <EmailDraftCard
            key={`${blockKey}-email-${quoteStartIndex}`}
            subject={subject}
            to={to}
            paragraphs={paragraphs}
            rawText={fullQuoteRaw}
            renderInline={renderInline}
          />
        );
        continue;
      }

      // Check for GitHub-style Alert Callouts: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
      const alertMatch = fullQuoteRaw.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      let alertConfig = null;
      if (alertMatch) {
        const alertType = alertMatch[1].toUpperCase();
        const alertMap = {
          NOTE: {
            title: "Note",
            icon: "ℹ️",
            bg: "rgba(37, 99, 235, 0.04)",
            border: "rgba(37, 99, 235, 0.3)",
            textColor: "var(--text-primary)",
            headerColor: "#2563EB"
          },
          TIP: {
            title: "Pro-Tip",
            icon: "💡",
            bg: "rgba(16, 185, 129, 0.06)",
            border: "#10B981",
            textColor: "var(--text-primary)",
            headerColor: "#059669"
          },
          IMPORTANT: {
            title: "Important Notice",
            icon: "📌",
            bg: "rgba(124, 58, 237, 0.06)",
            border: "#8B5CF6",
            textColor: "var(--text-primary)",
            headerColor: "#7C3AED"
          },
          WARNING: {
            title: "Warning",
            icon: "⚠️",
            bg: "rgba(245, 158, 11, 0.08)",
            border: "#F59E0B",
            textColor: "var(--text-primary)",
            headerColor: "#D97706"
          },
          CAUTION: {
            title: "Caution",
            icon: "🛑",
            bg: "rgba(239, 68, 68, 0.08)",
            border: "#EF4444",
            textColor: "var(--text-primary)",
            headerColor: "#DC2626"
          }
        };
        alertConfig = alertMap[alertType] || alertMap.NOTE;
      }

      // If not an email, render as a single unified callout blockquote
      const isWarning = !alertConfig && (fullQuoteRaw.includes("⚠️") || fullQuoteRaw.includes("Correction") || fullQuoteRaw.includes("Verification Notice"));
      const quoteParagraphs = [];
      let curPara = [];
      for (let lIdx = 0; lIdx < quoteLines.length; lIdx++) {
        let line = quoteLines[lIdx];
        if (alertMatch && lIdx === 0) {
          line = line.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, "").trim();
        }
        if (!line.trim()) {
          if (curPara.length > 0) {
            quoteParagraphs.push(curPara.join(" "));
            curPara = [];
          }
        } else {
          curPara.push(line);
        }
      }
      if (curPara.length > 0) {
        quoteParagraphs.push(curPara.join(" "));
      }

      elements.push(
        <div
          key={`${blockKey}-quote-${quoteStartIndex}`}
          style={{
            background: alertConfig ? alertConfig.bg : (isWarning ? "rgba(245, 158, 11, 0.08)" : "var(--bg-surface)"),
            borderLeft: alertConfig ? `4px solid ${alertConfig.border}` : (isWarning ? "3px solid var(--orange)" : "3px solid var(--border-strong)"),
            padding: alertConfig ? "14px 18px" : "12px 18px",
            borderRadius: "0 8px 8px 0",
            margin: "16px 0",
            color: alertConfig ? alertConfig.textColor : (isWarning ? "var(--text-primary)" : "var(--text-body)"),
            fontSize: alertConfig ? 14.5 : 15.5,
            lineHeight: 1.6,
            fontFamily: alertConfig ? "var(--font-sans, system-ui, sans-serif)" : "var(--font-serif)",
            boxShadow: alertConfig ? "0 1px 3px rgba(0,0,0,0.03)" : "none"
          }}
        >
          {alertConfig && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: alertConfig.headerColor, marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" }}>
              <span>{alertConfig.icon}</span>
              <span>{alertConfig.title}</span>
            </div>
          )}
          {quoteParagraphs.map((para, pIdx) => (
            <p key={pIdx} style={{ margin: pIdx === quoteParagraphs.length - 1 ? 0 : "0 0 10px 0" }}>
              {renderInline(para)}
            </p>
          ))}
        </div>
      );
      continue;
    }

    // Standalone unquoted Email Draft detection (e.g. **Subject:** ... followed by email body)
    if (/^(?:\*\*|\*|#*\s*)?subject\s*:\s*(.+)/i.test(trimmed)) {
      let lookahead = i + 1;
      const emailLines = [trimmed];
      while (lookahead < rawLines.length) {
        const nextTrim = rawLines[lookahead].trim();
        if (nextTrim.startsWith("#") || nextTrim.startsWith("---") || nextTrim.startsWith("***")) {
          break;
        }
        emailLines.push(nextTrim);
        lookahead++;
        if (/^(?:best regards|warm regards|sincerely|cheers|thanks|thank you),?\s*$/i.test(nextTrim)) {
          if (lookahead < rawLines.length && rawLines[lookahead].trim()) {
            emailLines.push(rawLines[lookahead].trim());
            lookahead++;
          }
          break;
        }
      }

      if (emailLines.some(l => /^(?:hi|dear|hello|greetings)\s+/i.test(l))) {
        let subject = trimmed;
        let to = "";
        const bodyLines = [];
        for (let idx = 1; idx < emailLines.length; idx++) {
          const l = emailLines[idx];
          if (/^(?:\*\*|\*|#*\s*)?to\s*:/i.test(l) && !to) {
            to = l.replace(/^(?:\*\*|\*|#*\s*)?to\s*:?\s*(?:\*\*|\*)?\s*/i, "").trim();
          } else {
            bodyLines.push(l);
          }
        }
        const paragraphs = [];
        let curPara = [];
        for (const l of bodyLines) {
          if (!l) {
            if (curPara.length > 0) {
              paragraphs.push(curPara.join(" "));
              curPara = [];
            }
          } else {
            curPara.push(l);
          }
        }
        if (curPara.length > 0) paragraphs.push(curPara.join(" "));

        elements.push(
          <EmailDraftCard
            key={`${blockKey}-unquoted-email-${i}`}
            subject={subject}
            to={to}
            paragraphs={paragraphs}
            rawText={emailLines.join("\n")}
            renderInline={renderInline}
          />
        );
        i = lookahead;
        continue;
      }
    } else if (trimmed.startsWith("###### ")) {
      elements.push(<h6 key={`${blockKey}-${i}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 12, marginBottom: 4, fontFamily: "var(--font-serif)" }}>{renderInline(trimmed.slice(7))}</h6>);
    } else if (trimmed.startsWith("##### ")) {
      elements.push(<h5 key={`${blockKey}-${i}`} style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginTop: 14, marginBottom: 4, fontFamily: "var(--font-serif)" }}>{renderInline(trimmed.slice(6))}</h5>);
    } else if (trimmed.startsWith("#### ")) {
      elements.push(<h4 key={`${blockKey}-${i}`} style={{ fontSize: "var(--claude-h4-size, 16px)", fontWeight: 600, color: "var(--text-primary)", marginTop: 14, marginBottom: 4, fontFamily: "var(--font-serif)", lineHeight: 1.4 }}>{renderInline(trimmed.slice(5))}</h4>);
    } else if (trimmed.startsWith("### ")) {
      elements.push(<h3 key={`${blockKey}-${i}`} style={{ fontSize: "var(--claude-h3-size, 17.5px)", fontWeight: 600, color: "var(--text-primary)", marginTop: 18, marginBottom: 6, fontFamily: "var(--font-serif)", lineHeight: 1.4 }}>{renderInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={`${blockKey}-${i}`} style={{ fontSize: "var(--claude-h2-size, 20px)", fontWeight: 600, color: "var(--text-primary)", marginTop: 22, marginBottom: 8, borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))", paddingBottom: 6, letterSpacing: "-0.015em", fontFamily: "var(--font-serif)", lineHeight: 1.35 }}>{renderInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={`${blockKey}-${i}`} style={{ fontSize: "var(--claude-h1-size, 24px)", fontWeight: 600, color: "var(--text-primary)", marginTop: 24, marginBottom: 10, letterSpacing: "-0.02em", fontFamily: "var(--font-serif)", lineHeight: 1.3 }}>{renderInline(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const bulletContent = trimmed.slice(2);
      elements.push(
        <div key={`${blockKey}-${i}`} style={{ display: "flex", gap: 10, marginBottom: 8, paddingLeft: 6, lineHeight: "var(--claude-message-line-height, 1.65)", fontSize: "var(--claude-message-size, 16px)" }}>
          <span style={{ color: "var(--burgundy-rich, #6E1A2D)", fontWeight: 700, fontSize: "16px", lineHeight: "1.65" }}>•</span>
          <div style={{ flex: 1 }}>{renderInline(bulletContent)}</div>
        </div>
      );
    } else if (/^!\[(.*?)\]\((.*?)\)$/.test(trimmed)) {
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      const alt = imgMatch[1] || "Visual Artifact";
      const src = imgMatch[2];
      elements.push(
        <ModernImageLoader
          key={`${blockKey}-img-${i}`}
          src={src}
          alt={alt}
          title={alt}
          enableLightbox={true}
        />
      );
    } else if (/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i.test(trimmed)) {
      const match = trimmed.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
      const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);
      const src = match ? match[1] : "";
      const alt = altMatch ? altMatch[1] : "Visual Artifact";
      if (src) {
        elements.push(
          <ModernImageLoader
            key={`${blockKey}-html-img-${i}`}
            src={src}
            alt={alt}
            title={alt}
            enableLightbox={true}
          />
        );
      }
    } else if (trimmed.startsWith("***") || trimmed.startsWith("---")) {
      elements.push(<hr key={`${blockKey}-${i}`} style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }} />);
    } else if (!trimmed) {
      elements.push(<div key={`${blockKey}-${i}`} style={{ height: 10 }} />);
    } else {
      const rendered = renderInline(line);
      const isFlowLine = line.includes("→") || line.includes("⇒") || line.includes("\\longrightarrow") || line.includes("\\rightarrow");
      if (isFlowLine) {
        elements.push(
          <div
            key={`${blockKey}-${i}`}
            className="nexus-process-flow-row"
            style={{
              background: "rgba(110, 26, 45, 0.03)",
              border: "1px solid rgba(110, 26, 45, 0.14)",
              borderLeft: "3.5px solid var(--burgundy-rich, #6E1A2D)",
              borderRadius: "0 8px 8px 0",
              padding: "10px 16px",
              margin: "12px 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {rendered}
          </div>
        );
      } else {
        elements.push(<p key={`${blockKey}-${i}`} style={{ marginBottom: "var(--claude-message-paragraph-gap, 16px)", lineHeight: "var(--claude-message-line-height, 1.65)", fontSize: "var(--claude-message-size, 16px)" }}>{rendered}</p>);
      }
    }
    i++;
  }

  return elements;
}

function VisualStrategyCard({ data, onNavigate }) {
  const [expanded, setExpanded] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const title = data.title || "Enterprise Visual Strategy";
  const subtitle = data.subtitle || "Reconstructed Business Architecture";
  const patternName = data.visualPattern || data.visualType || "Swimlane";
  const nodesCount = data.nodes?.length || 0;
  const connectorsCount = data.connectors?.length || 0;

  const handleOpenStudio = () => {
    try {
      const stored = localStorage.getItem("nexus_saved_visualizations");
      let list = stored ? JSON.parse(stored) : [];
      const itemWithId = {
        ...data,
        id: data.id || ("vis-" + Date.now().toString(36))
      };
      list = [itemWithId, ...list.filter(i => i.id !== itemWithId.id)];
      localStorage.setItem("nexus_saved_visualizations", JSON.stringify(list));
    } catch (_) {}
    if (onNavigate) {
      onNavigate("visualizations");
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportToEditablePowerPoint(data);
    } catch (e) {
      console.error("PPTX export error:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      margin: "18px 0",
      background: "var(--bg-card, #FFFFFF)",
      border: "1px solid var(--border-subtle, #CBD5E1)",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
    }}>
      {/* Top Banner */}
      <div style={{
        padding: "14px 18px",
        background: "var(--bg-surface, #F8FAFC)",
        borderBottom: "1px solid var(--border-subtle, #E2E8F0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎨</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{title}</span>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                background: "rgba(110,26,45,0.08)",
                color: "var(--orange, #6E1A2D)",
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: "var(--font-mono)"
              }}>
                {patternName.replace(/_/g, " ")}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {subtitle} • {nodesCount} entities • {connectorsCount} conduits
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-body)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-mono)"
            }}
          >
            {expanded ? "Collapse ▲" : "Expand ▼"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-mono)"
            }}
          >
            <span>{downloading ? "Exporting..." : "📽️ PPTX"}</span>
          </button>
          <button
            onClick={handleOpenStudio}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              background: "linear-gradient(135deg, #E8614D 0%, #C2410C 100%)",
              border: "none",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-mono)",
              boxShadow: "0 1px 3px rgba(232,97,77,0.3)"
            }}
          >
            <span>🎨 Open in Visual Studio</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      {expanded && (
        <div style={{
          padding: 16,
          overflowX: "auto",
          background: data.designFamily === "control_tower" ? "#0B1120" : "var(--bg-card, #FFFFFF)"
        }}>
          <UniversalStrategyRenderer data={data} />
        </div>
      )}

      {/* Companion Notes if present */}
      {expanded && data.speakerNotes && (
        <div style={{
          padding: "10px 18px",
          background: "var(--bg-surface, #F8FAFC)",
          borderTop: "1px solid var(--border-subtle, #E2E8F0)",
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          whiteSpace: "pre-line"
        }}>
          <strong>Executive Storytelling Brief:</strong>
          {"\n" + data.speakerNotes.replace(/^Executive [^\n]*\n*/i, "").trim()}
        </div>
      )}
    </div>
  );
}

export function FormattedText({ text, onNavigate }) {
  if (!text) return null;
  const blocks = parseContentBlocks(text);

  return (
    <div
      className="claude-response-prose"
      style={{
        fontFamily: "var(--font-claude-message, var(--font-serif))",
        fontSize: "var(--claude-message-size, 16px)",
        lineHeight: "var(--claude-message-line-height, 1.65)",
        color: "var(--text-body)",
        letterSpacing: "var(--claude-message-tracking, -0.003em)"
      }}
    >
      {blocks.map((block, idx) => {
        if (block.type === "visual_strategy") {
          return <VisualStrategyCard key={`strat-${idx}`} data={block.data} onNavigate={onNavigate} />;
        }
        if (block.type === "warehouse_visual") {
          return <WarehouseVisualRenderer key={`visual-wh-${idx}`} data={block.data} onNavigate={onNavigate} />;
        }
        if (block.type === "mermaid" || block.type === "diagram") {
          return <MermaidDiagram key={`mermaid-${idx}`} chart={block.content || (typeof block.data === 'string' ? block.data : '')} />;
        }
        if (block.type === "image") {
          return (
            <ModernImageLoader
              key={`img-block-${idx}`}
              src={block.src}
              alt={block.alt || "Visual Artifact"}
              title={block.title || block.alt}
              enableLightbox={true}
            />
          );
        }
        if (block.type === "code") {
          return (
            <ModernCodeBlock
              key={`code-${idx}`}
              code={block.content}
              language={block.language || "text"}
            />
          );
        }
        return <React.Fragment key={`md-${idx}`}>{renderMarkdownBlock(block.content, idx)}</React.Fragment>;
      })}
    </div>
  );
}

export function cleanLatexAndArrows(str) {
  if (!str) return "";
  let cleaned = str;

  // 1. Spacing artifacts
  cleaned = cleaned
    .replace(/\\(?:quad|qquad)/gi, " ")
    .replace(/\\(?:,|;|:)/g, " ")
    .replace(/\\ /g, " ")
    .replace(/\\!/g, "");

  // 2. Comprehensive arrows & relations (long, short, double, implications)
  cleaned = cleaned
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

  // 3. Unwrap font and text macros (nested up to 5 passes)
  for (let pass = 0; pass < 5; pass++) {
    const prev = cleaned;
    cleaned = cleaned
      .replace(/\\(?:textbf|mathbf)\{([^{}]+)\}/g, "**$1**")
      .replace(/\\(?:texttt|mathtt)\{([^{}]+)\}/g, "`$1`")
      .replace(/\\(?:textit|mathit)\{([^{}]+)\}/g, "*$1*")
      .replace(/\\(?:text|mathrm|textsf|sf|rm)\{([^{}]+)\}/g, "$1");
    if (cleaned === prev) break;
  }

  // 4. Strip $$ ... $$ display math
  cleaned = cleaned.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, "$1");

  // 5. Strip $ ... $ where the inside contains an arrow, backslash, or LaTeX artifacts
  cleaned = cleaned.replace(/\$([^\$\n]*?[→←↔⇒⇐\\][^\$\n]*?)\$/g, "$1");

  // 6. Strip $ around 4+ digit SAP storage types / codes: e.g. $9010$, $0010$
  cleaned = cleaned.replace(/\$\s*(\d{4,})\s*\$/g, "$1");

  // 7. Strip leftover bounding $ on lines containing process arrows
  cleaned = cleaned.replace(/^(\s*)\$\s*(.*?[→←↔⇒⇐].*?)\s*\$(\s*)$/gm, "$1$2$3");

  // 8. Normalize duplicate horizontal spaces
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  return cleaned.trim();
}

function renderInline(str) {
  if (!str) return "";

  // 1. Clean math and LaTeX artifacts (arrows, numbers wrapped in dollars like $9010$, $\rightarrow$, $\longrightarrow$)
  const cleaned = cleanLatexAndArrows(str);

  // 2. Parse bold **bold**, code `code`, evidence badges, and arrows
  const parts = cleaned.split(/(\*\*.*?\*\*|\`.*?\`|\[Verified Official\]|\[Verified\]|\[System-Dependent\]|\[Unverified\]|\[Requires SAP release confirmation\]|→|←|↔|⇒|⇐)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeVal = part.slice(1, -1).trim();
      if (typeof isKnownTCode === "function" && isKnownTCode(codeVal)) {
        return <TCodeHoverCard key={i} code={codeVal} />;
      }
      return (
        <code
          key={i}
          className="nexus-pill-badge"
          style={{
            display: "inline-block",
            backgroundColor: "#FDF2F4",
            background: "var(--burgundy-light, #FDF2F4)",
            border: "1px solid #E8614D",
            borderColor: "var(--burgundy-border, #E8614D)",
            padding: "2px 7px",
            borderRadius: 4,
            fontFamily: "var(--font-mono)",
            fontSize: "0.875em",
            color: "var(--orange, #6E1A2D)",
            fontWeight: 600,
            lineHeight: 1.35,
            margin: "1px 3px",
            verticalAlign: "baseline"
          }}
        >
          {codeVal}
        </code>
      );
    }
    if (part === "[Verified Official]" || part === "[Verified]") {
      return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(16,185,129,0.12)", backgroundColor: "#ECFDF5", border: "1px solid #10B981", color: "#065F46", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 3px", fontFamily: "Consolas, monospace" }}>✓ {part.slice(1, -1)}</span>;
    }
    if (part === "[System-Dependent]" || part === "[Requires SAP release confirmation]") {
      return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(245,158,11,0.12)", backgroundColor: "#FFFBEB", border: "1px solid #F59E0B", color: "#92400E", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 3px", fontFamily: "Consolas, monospace" }}>⚡ {part.slice(1, -1)}</span>;
    }
    if (part === "[Unverified]") {
      return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(239,68,68,0.1)", backgroundColor: "#FEF2F2", border: "1px solid #EF4444", color: "#991B1B", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 3px", fontFamily: "Consolas, monospace" }}>⚠ {part.slice(1, -1)}</span>;
    }
    if (part === "→" || part === "←" || part === "↔" || part === "⇒" || part === "⇐") {
      return (
        <span
          key={i}
          className="nexus-arrow-symbol"
          style={{
            color: "var(--burgundy-rich, #6E1A2D)",
            fontWeight: 800,
            margin: "0 6px",
            fontSize: 15,
            display: "inline-block",
            fontFamily: "Consolas, 'Segoe UI Symbol', sans-serif"
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function convertMarkdownToRichHtml(md) {
  if (!md) return "";
  const cleanedMd = cleanLatexAndArrows(md);
  let html = cleanedMd
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks with modern dark card styling in rich html
  html = html.replace(/```([a-zA-Z0-9_:-]*)\s*\n?([\s\S]*?)```/g, (m, lang, code) => {
    const l = (lang || "CODE").toUpperCase();
    return `<div style="margin:14px 0;border-radius:8px;background:#18181B;border:1px solid #27272A;overflow:hidden;"><div style="background:#222226;padding:6px 12px;font-family:Consolas,monospace;font-size:9pt;font-weight:700;color:#A1A1AA;border-bottom:1px solid #2E2E32;">${l}</div><pre style="margin:0;padding:12px 16px;font-family:Consolas,monospace;font-size:10pt;color:#EDEDED;line-height:1.55;overflow-x:auto;"><code>${code}</code></pre></div>`;
  });

  // Headers with corporate executive styling
  html = html.replace(/^##### (.*$)/gim, '<h5 style="color:#6E1A2D;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;font-size:11pt;font-weight:700;margin-top:12px;margin-bottom:4px;">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 style="color:#6E1A2D;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;font-size:11.5pt;font-weight:700;margin-top:14px;margin-bottom:5px;">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#6E1A2D;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;font-size:12.5pt;font-weight:700;margin-top:16px;margin-bottom:6px;border-bottom:1px solid #E2E8F0;padding-bottom:3px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#6E1A2D;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;font-size:14pt;font-weight:800;margin-top:20px;margin-bottom:8px;border-bottom:2px solid #E8614D;padding-bottom:4px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#0F172A;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;font-size:17pt;font-weight:800;margin-top:24px;margin-bottom:10px;">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#0F172A;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;font-weight:700;">$1</strong>');

  // Inline code / process steps -> EXACT rectangle box with burgundy border, pink fill, and monospace font
  html = html.replace(/`(.*?)`/gim, '<span style="display:inline-block;background-color:#FDF2F4;background:#FDF2F4;border:1px solid #E8614D;border-radius:4px;padding:2px 7px;margin:2px 3px;font-family:Consolas,\'SF Mono\',Monaco,\'Courier New\',monospace;font-size:10.5pt;font-weight:600;color:#6E1A2D;mso-border-alt:solid #E8614D 0.5pt;line-height:1.35;">$1</span>');

  // Process flow arrows
  html = html.replace(/→/g, '<span style="color:#6E1A2D;font-weight:bold;margin:0 5px;font-size:12pt;font-family:Consolas,\'Segoe UI Symbol\',sans-serif;"> → </span>');
  html = html.replace(/←/g, '<span style="color:#6E1A2D;font-weight:bold;margin:0 5px;font-size:12pt;"> ← </span>');
  html = html.replace(/⇒/g, '<span style="color:#6E1A2D;font-weight:bold;margin:0 5px;font-size:12pt;"> ⇒ </span>');

  // Evidence badges
  html = html.replace(/\[Verified Official\]|\[Verified\]/g, '<span style="display:inline-block;background-color:#ECFDF5;border:1px solid #10B981;color:#065F46;padding:1px 6px;border-radius:4px;font-size:9.5pt;font-weight:700;font-family:Consolas,monospace;">✓ Verified Official</span>');
  html = html.replace(/\[System-Dependent\]/g, '<span style="display:inline-block;background-color:#FFFBEB;border:1px solid #F59E0B;color:#92400E;padding:1px 6px;border-radius:4px;font-size:9.5pt;font-weight:700;font-family:Consolas,monospace;">⚡ System-Dependent</span>');
  html = html.replace(/\[Unverified\]/g, '<span style="display:inline-block;background-color:#FEF2F2;border:1px solid #EF4444;color:#991B1B;padding:1px 6px;border-radius:4px;font-size:9.5pt;font-weight:700;font-family:Consolas,monospace;">⚠ Unverified</span>');

  // Alert Callout rendering
  html = html.replace(/&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)(?=\n\n|$)/gi, (m, type, body) => {
    const t = type.toUpperCase();
    const colors = {
      NOTE: { border: 'rgba(37, 99, 235, 0.3)', bg: 'rgba(37, 99, 235, 0.04)', text: '#1E40AF', icon: 'ℹ️ NOTE' },
      TIP: { border: '#10B981', bg: '#ECFDF5', text: '#065F46', icon: '💡 TIP' },
      IMPORTANT: { border: '#8B5CF6', bg: '#F5F3FF', text: '#5B21B6', icon: '📌 IMPORTANT' },
      WARNING: { border: '#F59E0B', bg: '#FFFBEB', text: '#92400E', icon: '⚠️ WARNING' },
      CAUTION: { border: '#EF4444', bg: '#FEF2F2', text: '#991B1B', icon: '🛑 CAUTION' }
    }[t] || { border: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', icon: 'ℹ️ NOTE' };
    const cleanBody = body.replace(/&gt;\s*/g, '').trim();
    return `<div style="border-left:4px solid ${colors.border};background-color:${colors.bg};padding:10px 14px;border-radius:0 6px 6px 0;margin:12px 0;"><div style="font-weight:700;font-size:10pt;color:${colors.text};margin-bottom:4px;">${colors.icon}</div><div style="color:#1E293B;font-size:10.5pt;line-height:1.5;">${cleanBody}</div></div>`;
  });

  // Bullet points
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-bottom:5px;color:#334155;line-height:1.6;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li style="margin-bottom:5px;color:#334155;line-height:1.6;font-family:\'Aptos\',system-ui,-apple-system,sans-serif;">$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/gim, '<br/><br/>');
  return `<div style="font-family:'Aptos',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1F2937;">${html}</div>`;
}

export function convertMarkdownToHtml(md) {
  return convertMarkdownToRichHtml(md);
}

export async function copyFormattedTextToClipboard(text) {
  if (!text) return false;
  const richHtml = convertMarkdownToRichHtml(text);
  const plainText = text.replace(/`/g, '');
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([richHtml], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob
        })
      ]);
      return true;
    }
  } catch (err) {
    console.warn("ClipboardItem write failed, falling back to execCommand:", err);
  }

  // Fallback using DOM selection execCommand
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = richHtml;
  tempDiv.style.position = "fixed";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  document.body.appendChild(tempDiv);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(tempDiv);
  selection.removeAllRanges();
  selection.addRange(range);

  let success = false;
  try {
    success = document.execCommand("copy");
  } catch (_) {}

  selection.removeAllRanges();
  document.body.removeChild(tempDiv);
  return success;
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; color: #1E293B; line-height: 1.6; font-size: 11pt; }
    h1, h2, h3, p, li, td, th { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif; }
    .header-banner { background: #0F172A; color: #FFFFFF; padding: 22px 26px; border-radius: 6px; border-left: 6px solid #6E1A2D; margin-bottom: 24px; }
    .badge { background: #6E1A2D; color: #FFFFFF; font-size: 8.5pt; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: inline-block; text-transform: uppercase; }
    .meta-table { width: 100%; margin-top: 14px; border-collapse: collapse; }
    .meta-table td { padding: 4px 8px; font-size: 9.5pt; color: #94A3B8; border: none; }
    .sec-title { font-size: 12.5pt; font-weight: bold; color: #0F172A; border-bottom: 2px solid #6E1A2D; padding-bottom: 4px; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; }
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
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
      <tr>
        <td style="padding: 0; border: none;">
          <span class="badge">NEXUS SAP TRAINING &amp; INVESTIGATION</span>
          <span style="font-size: 9.5pt; color: #94A3B8; margin-left: 10px;">Case ID: ${caseId}</span>
        </td>
        <td style="padding: 0; border: none; text-align: right;">
        </td>
      </tr>
    </table>
    <h1 style="color: #FFFFFF; font-size: 20pt; margin: 6px 0 10px 0; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">${title}</h1>
    <p style="color: #E2E8F0; font-size: 11pt; margin: 0; line-height: 1.5;">${summary}</p>
    <div style="height: 3px; background: #6E1A2D; margin-top: 14px; border-radius: 2px;"></div>
    <table class="meta-table">
      <tr>
        <td style="color:#94A3B8;">Target Landscape: <strong style="color:#FFFFFF;">S/4HANA 2023 FPS02 · Embedded Architecture</strong></td>
        <td style="color:#94A3B8; text-align: right;">Template: <strong style="color:#FFFFFF;">Executive Word Template</strong> | Generated: <strong style="color:#FFFFFF;">${dateStr}</strong></td>
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
    Nexus SAP Enterprise Intelligence · Case ID: ${caseId} · Module: M1-${doc?.module || 'PP'} · Confidential &amp; Internal SAP Runbook · Page 1
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

async function handleExportPptx(doc, aiText, aiCitations) {
  try {
    await exportSapPresentationPptx(doc, aiText, aiCitations);
  } catch (err) {
    console.error("PPTX export failed:", err);
    alert("Failed to export PowerPoint presentation: " + (err.message || err));
  }
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
        background: "var(--bg-card, #FFFFFF)",
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
            background: "var(--bg-card, #FFFFFF)",
            border: "1px solid var(--border-strong, #D1D5DB)",
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
            e.currentTarget.style.borderColor = "var(--border-strong, #D1D5DB)";
            e.currentTarget.style.background = "var(--bg-card, #FFFFFF)";
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
              background: "var(--bg-card, #FFFFFF)",
              border: "1px solid var(--border-subtle, #E5E7EB)",
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
  const { user } = useAuth() || {};
  const [convId, setConvId] = useState(activeSessionId || null);
  const [convs, setConvs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTopic, setSearchTopic] = useState("");
  const [doc, setDoc] = useState(null);
  const [activeSection, setActiveSection] = useState(propActiveSection || "all");
  const [copiedSession, setCopiedSession] = useState(false);
  const [vsmModalOpen, setVsmModalOpen] = useState(false);
  const [sessionDeckModalOpen, setSessionDeckModalOpen] = useState(false);
  const [pptxValidationModalOpen, setPptxValidationModalOpen] = useState(false);
  const [pptxParsedModel, setPptxParsedModel] = useState(null);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const [downloadedPptxFile, setDownloadedPptxFile] = useState(null);
  const [taskInfoModalOpen, setTaskInfoModalOpen] = useState(false);
  const [currentTaskInfo, setCurrentTaskInfo] = useState(null);
  const [turnTaskInfoMap, setTurnTaskInfoMap] = useState({});

  const handleOpenTaskInfo = (info = null, turnId = null) => {
    let targetInfo = info || (turnId ? turnTaskInfoMap[turnId] : null) || currentTaskInfo;
    if (!targetInfo) {
      targetInfo = {
        creditsUsed: 288,
        tokens: { prompt: 760, completion: 2120, total: 2880 },
        timeWorkedMs: 14500,
        model: selectedModel || "gemini-3.5-flash-lite",
        conversationId: convId,
        subagents: [
          {
            id: "sub-1",
            name: `Research ${activeClassification?.primaryModule || "SAP EWM"} issues across standard catalogs`,
            status: "completed"
          },
          {
            id: "sub-2",
            name: "Verify production safeguards & RFC queue integrity",
            status: "completed"
          }
        ]
      };
    }
    setCurrentTaskInfo(targetInfo);
    window.dispatchEvent(new CustomEvent('nexus-task-info', { detail: targetInfo }));
    setTaskInfoModalOpen(true);
  };

  const handleOpenPptxValidation = (targetDoc = doc, targetAiText = aiText, targetCitations = aiCitations) => {
    try {
      const parsed = parseNexusSapAnswer(targetDoc, targetAiText, targetCitations);
      setPptxParsedModel(parsed);
      setDownloadedPptxFile(null);
      setPptxValidationModalOpen(true);
    } catch (err) {
      console.error("Failed to parse SAP answer for PPTX:", err);
      handleExportPptx(targetDoc, targetAiText, targetCitations);
    }
  };

  const handleConfirmPptxDownload = async () => {
    if (!pptxParsedModel) return;
    setIsGeneratingPptx(true);
    try {
      const result = await generateSapKnowledgeDeck(pptxParsedModel);
      setDownloadedPptxFile(result.fileName);
    } catch (err) {
      console.error("Deck generation error:", err);
      alert("Failed to generate PPTX deck: " + (err.message || err));
    } finally {
      setIsGeneratingPptx(false);
    }
  };

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
  const [searchEntryHtml, setSearchEntryHtml] = useState(null);
  const [turnCitationsMap, setTurnCitationsMap] = useState({});
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash-lite");
  const [selectedModule, setSelectedModule] = useState("AUTO");
  const [assistantMode, setAssistantMode] = useState("AUTO");
  const [activeIntent, setActiveIntent] = useState(null);
  const [activeClassification, setActiveClassification] = useState(null);
  const [followUpInput, setFollowUpInput] = useState("");
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const mainScrollRef = useRef(null);
  const mainContentRef = useRef(null);
  const lenisRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [hoveredTurn, setHoveredTurn] = useState(null);
  const [copiedAllFormatted, setCopiedAllFormatted] = useState(false);
  const [copiedTurnId, setCopiedTurnId] = useState(null);
  const [activeTurnMenuId, setActiveTurnMenuId] = useState(null);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isConvertingArticle, setIsConvertingArticle] = useState(false);
  const [summaryToast, setSummaryToast] = useState(null);
  const [activeNexusDoc, setActiveNexusDoc] = useState(null);
  const [nexusDocPanelOpen, setNexusDocPanelOpen] = useState(false);
  const [creatingDocTurnId, setCreatingDocTurnId] = useState(null);
  const [turnNexusDocs, setTurnNexusDocs] = useState({});
  const [turnSapAgentMap, setTurnSapAgentMap] = useState({});
  const [activeSapAgentResult, setActiveSapAgentResult] = useState(null);
  const [isDocDocked, setIsDocDocked] = useState(true);
  const [splitRatio, setSplitRatio] = useState(48);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const splitContainerRef = useRef(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [rawPromptDraft, setRawPromptDraft] = useState(null);
  const [showEnhanceSuccess, setShowEnhanceSuccess] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [playingAudioTurnId, setPlayingAudioTurnId] = useState(null);
  const [synthesizingTurnId, setSynthesizingTurnId] = useState(null);
  const activeAudioElementRef = useRef(null);
  const [isWalkAndTalkActive, setIsWalkAndTalkActive] = useState(false);
  const [semanticModalData, setSemanticModalData] = useState(null);
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false);
  const [deepResearchModalOpen, setDeepResearchModalOpen] = useState(false);
  const [deepResearchTopic, setDeepResearchTopic] = useState("");
  const [isGeneratingDeepResearch, setIsGeneratingDeepResearch] = useState(false);
  const [shiftHandoverModalOpen, setShiftHandoverModalOpen] = useState(false);
  const [isAnalyzingScreen, setIsAnalyzingScreen] = useState(false);
  const [screenAnalysisData, setScreenAnalysisData] = useState(null);

  // Live Token Speed Counter & Generation Metrics
  const [streamMetrics, setStreamMetrics] = useState({
    active: false,
    startTime: null,
    elapsedSec: 0,
    tokenCount: 0,
    speedTokPerSec: 0,
  });
  const [turnMetricsMap, setTurnMetricsMap] = useState({});
  const streamMetricsRef = useRef({ startTime: null, charCount: 0, timerId: null });

  const startStreamMetrics = () => {
    if (streamMetricsRef.current.timerId) {
      clearInterval(streamMetricsRef.current.timerId);
    }
    const startTime = performance.now();
    streamMetricsRef.current = {
      startTime,
      charCount: 0,
      timerId: null
    };
    setStreamMetrics({
      active: true,
      startTime,
      elapsedSec: 0,
      tokenCount: 0,
      speedTokPerSec: 0,
    });
    const timerId = setInterval(() => {
      if (!streamMetricsRef.current.startTime) return;
      const now = performance.now();
      const elapsedSec = Math.max(0.1, (now - streamMetricsRef.current.startTime) / 1000);
      const estTokens = Math.max(1, Math.round(streamMetricsRef.current.charCount / 3.8));
      const speed = Math.round(estTokens / elapsedSec);
      setStreamMetrics({
        active: true,
        startTime: streamMetricsRef.current.startTime,
        elapsedSec: Number(elapsedSec.toFixed(1)),
        tokenCount: estTokens,
        speedTokPerSec: speed
      });
    }, 120);
    streamMetricsRef.current.timerId = timerId;
  };

  const updateStreamMetricsChars = (charCount) => {
    streamMetricsRef.current.charCount = charCount;
  };

  const stopStreamMetrics = (turnKey) => {
    if (streamMetricsRef.current.timerId) {
      clearInterval(streamMetricsRef.current.timerId);
      streamMetricsRef.current.timerId = null;
    }
    const now = performance.now();
    const elapsedSec = streamMetricsRef.current.startTime
      ? Number(Math.max(0.2, (now - streamMetricsRef.current.startTime) / 1000).toFixed(1))
      : 1.0;
    const estTokens = Math.max(1, Math.round(streamMetricsRef.current.charCount / 3.8));
    const speed = Math.round(estTokens / elapsedSec);
    const finalMetrics = {
      elapsedSec,
      tokenCount: estTokens,
      speedTokPerSec: speed
    };
    setStreamMetrics({
      active: false,
      startTime: null,
      ...finalMetrics
    });
    if (turnKey) {
      setTurnMetricsMap(prev => ({ ...prev, [turnKey]: finalMetrics }));
    }
  };

  useEffect(() => {
    const onExportPpt = () => setSessionDeckModalOpen(true);
    const onExportWord = () => handleExportWord(doc, aiText, aiCitations);
    const onExportExcel = () => handleExportExcel(doc, aiText, aiCitations);
    const onExportPptxSlide = () => handleOpenPptxValidation(doc, aiText, aiCitations);
    const onExportVsm = () => setVsmModalOpen(true);
    const onAutoSummarize = async () => {
      if (!convId) {
        alert("Please start or select a conversation first.");
        return;
      }
      setIsSummarizing(true);
      try {
        const res = await api.summarizeConversation(convId);
        if (res?.summary) {
          setSummaryToast(res.summary);
        }
      } catch (err) {
        alert("Failed to summarize conversation: " + err.message);
      } finally {
        setIsSummarizing(false);
      }
    };
    const onSaveKb = async () => {
      if (!convId) {
        alert("Please start or select a conversation first.");
        return;
      }
      setIsConvertingArticle(true);
      try {
        const res = await api.convertConversationToArticle(convId);
        if (res?.article) {
          alert(`✓ Knowledge Article created: "${res.article.title}". Saved to your Personal Knowledge Library!`);
        }
      } catch (err) {
        alert("Failed to convert to article: " + err.message);
      } finally {
        setIsConvertingArticle(false);
      }
    };

    window.addEventListener('nexus-export-ppt', onExportPpt);
    window.addEventListener('nexus-export-word', onExportWord);
    window.addEventListener('nexus-export-excel', onExportExcel);
    window.addEventListener('nexus-export-pptx-slide', onExportPptxSlide);
    window.addEventListener('nexus-export-vsm', onExportVsm);
    window.addEventListener('nexus-auto-summarize', onAutoSummarize);
    window.addEventListener('nexus-save-kb', onSaveKb);

    return () => {
      window.removeEventListener('nexus-export-ppt', onExportPpt);
      window.removeEventListener('nexus-export-word', onExportWord);
      window.removeEventListener('nexus-export-excel', onExportExcel);
      window.removeEventListener('nexus-export-pptx-slide', onExportPptxSlide);
      window.removeEventListener('nexus-export-vsm', onExportVsm);
      window.removeEventListener('nexus-auto-summarize', onAutoSummarize);
      window.removeEventListener('nexus-save-kb', onSaveKb);
    };
  }, [doc, aiText, aiCitations, convId]);

  useEffect(() => {
    if (!toolsMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('#nexus-bottom-tools-container') && !e.target.closest('#nexus-hero-tools-container')) {
        setToolsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [toolsMenuOpen]);

  useEffect(() => {
    if (!activeTurnMenuId) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-turn-menu]')) {
        setActiveTurnMenuId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [activeTurnMenuId]);

  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  };

  useEffect(() => {
    if (!isDraggingDivider) return;
    const handleMouseMove = (e) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const newRatio = ((rect.right - e.clientX) / rect.width) * 100;
      setSplitRatio(Math.max(25, Math.min(75, Math.round(newRatio))));
    };
    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  useEffect(() => {
    const handleOpenDocEvent = (e) => {
      if (e.detail) {
        setActiveNexusDoc(e.detail);
        setNexusDocPanelOpen(true);
      }
    };
    window.addEventListener('nexus-open-doc', handleOpenDocEvent);
    return () => window.removeEventListener('nexus-open-doc', handleOpenDocEvent);
  }, []);

  useEffect(() => {
    if (!convId) return;
    api.listNexusDocs()
      .then(res => {
        if (res && res.docs) {
          const map = {};
          res.docs.forEach(d => {
            if (d.source_turn_id) {
              map[d.source_turn_id] = d;
            }
          });
          setTurnNexusDocs(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});
  }, [convId]);


  useEffect(() => {
    window.nexusInsertPrompt = (text) => {
      setFollowUpInput(text);
      const ta = document.querySelector('textarea[placeholder*="Ask"]');
      if (ta) ta.focus();
    };
    return () => {
      delete window.nexusInsertPrompt;
    };
  }, []);

  const handleForkConversation = (turnText) => {
    const branchId = 'conv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    onSessionChange?.(branchId);
    setConvId(branchId);
    if (turnText) {
      setAiText(turnText);
    }
  };

  const handleCopyRichText = async (text, id = "all") => {
    if (!text) return;
    const ok = await copyFormattedTextToClipboard(text);
    if (ok) {
      if (id === "all") {
        setCopiedAllFormatted(true);
        setTimeout(() => setCopiedAllFormatted(false), 2000);
      } else {
        setCopiedTurnId(id);
        setTimeout(() => setCopiedTurnId(null), 2000);
      }
    }
  };

  // Smart clipboard copy interception: ensures any manual mouse selection copied to clipboard
  // preserves exact rectangle boxes, borders, and monospace font in Word / Outlook / PPT / Docs!
  useEffect(() => {
    const handleNativeCopy = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const cloned = range.cloneContents();
      const wrapper = document.createElement("div");
      wrapper.appendChild(cloned);

      const codes = wrapper.querySelectorAll("code, .nexus-pill-badge");
      const arrows = wrapper.querySelectorAll(".nexus-arrow-symbol");
      const hasSpecial = codes.length > 0 || arrows.length > 0 || wrapper.querySelector("h1, h2, h3, strong, li, table");

      if (hasSpecial) {
        codes.forEach((code) => {
          code.style.display = "inline-block";
          code.style.backgroundColor = "#FDF2F4";
          code.style.background = "#FDF2F4";
          code.style.border = "1px solid #E8614D";
          code.style.borderRadius = "4px";
          code.style.padding = "2px 7px";
          code.style.margin = "1px 3px";
          code.style.fontFamily = "Consolas, 'SF Mono', Monaco, Menlo, 'Courier New', monospace";
          code.style.fontSize = "10.5pt";
          code.style.fontWeight = "600";
          code.style.color = "#6E1A2D";
          code.style.lineHeight = "1.35";
          code.setAttribute("style", code.style.cssText + "; mso-border-alt: solid #E8614D 0.5pt;");
        });

        wrapper.querySelectorAll("span").forEach((span) => {
          if (/^[→←↔⇒⇐]$/.test(span.textContent.trim())) {
            span.style.color = "#6E1A2D";
            span.style.fontWeight = "bold";
            span.style.fontSize = "12pt";
            span.style.margin = "0 5px";
            span.style.display = "inline-block";
            span.style.fontFamily = "Consolas, 'Segoe UI Symbol', sans-serif";
          }
        });

        wrapper.querySelectorAll("strong").forEach((st) => {
          st.style.color = "#0F172A";
          st.style.fontWeight = "700";
        });

        wrapper.querySelectorAll("h1, h2, h3").forEach((h) => {
          h.style.color = "#6E1A2D";
          h.style.fontFamily = "'Aptos', system-ui, -apple-system, sans-serif";
        });

        wrapper.style.fontFamily = "'Aptos', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
        wrapper.style.fontSize = "11pt";
        wrapper.style.lineHeight = "1.6";
        wrapper.style.color = "#1F2937";

        if (e.clipboardData) {
          e.clipboardData.setData("text/html", wrapper.innerHTML);
          e.clipboardData.setData("text/plain", selection.toString());
          e.preventDefault();
        }
      }
    };

    document.addEventListener("copy", handleNativeCopy);
    return () => document.removeEventListener("copy", handleNativeCopy);
  }, []);

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
            setSearchEntryHtml(null);
            setTurnCitationsMap({});
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
        setSearchEntryHtml(null);
        setTurnCitationsMap({});
        setSearchTopic("");
      }
    }
  }, [activeSessionId, activeTopic]);


  // Auto-expanding textarea refs
  const topTextareaRef = useRef(null);
  const followUpTextareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [turnVersionsMap, setTurnVersionsMap] = useState({});

  const handleSwitchTurnVersion = (turnId, newIndex) => {
    setTurnVersionsMap((prev) => {
      const entry = prev[turnId];
      if (!entry) return prev;
      return {
        ...prev,
        [turnId]: {
          ...entry,
          activeIndex: Math.max(0, Math.min(newIndex, entry.versions.length - 1))
        }
      };
    });
  };

  const handleRetryTurn = async (turn) => {
    if (aiStreaming) return;
    const query = turn.userQuery || turn.title || searchTopic || "Investigate topic";
    
    // Save current version if not already stored
    setTurnVersionsMap((prev) => {
      const entry = prev[turn.id] || { versions: [turn.content], activeIndex: 0 };
      const currentContent = turn.content;
      const updatedVersions = entry.versions.includes(currentContent) ? entry.versions : [...entry.versions, currentContent];
      return {
        ...prev,
        [turn.id]: {
          ...entry,
          versions: updatedVersions
        }
      };
    });

    handleGenerateInvestigation(query);
  };

  const handleStopStreaming = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (err) {}
      abortControllerRef.current = null;
    }
    setAiStreaming(false);
  };

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

  // Deep Forensic Spreadsheet Profiler & Aggregator
  const generateForensicSpreadsheetDigest = (workbook, fileName, currentUserName = '') => {
    let totalRowsGlobal = 0;
    const sheetReports = [];
    const sheetsMarkdown = [];

    workbook.SheetNames.forEach((sheetName) => {
      const ws = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!jsonRows || jsonRows.length === 0) return;

      const headers = (jsonRows[0] || []).map(h => (h != null ? String(h).trim() : ''));
      const rows = jsonRows.slice(1).filter(r => r && r.some(c => c != null && String(c).trim() !== ''));
      totalRowsGlobal += rows.length;

      // Detect semantic column indexes
      const findCol = (regex) => headers.findIndex(h => regex.test(h));
      const idIdx = findCol(/\b(?:issue|ticket|incident|sr\.?\s*no\.?)\b/i);
      const dateIdx = findCol(/\b(?:date|issuedate|created|logged)\b/i);
      const repIdx = findCol(/\b(?:reported\s*by|raised\s*by|requester|operator|user)\b/i);
      const descIdx = findCol(/\b(?:issue(?:\s*desc|\s*details)?|description|summary|problem|symptom|error)\b/i);
      const dlvIdx = findCol(/\b(?:delivery|obd|outbound)\b/i);
      const prodIdx = findCol(/\b(?:product|material|sku)\b/i);
      const batchIdx = findCol(/\b(?:batch|charge)\b/i);
      const asgIdx = findCol(/\b(?:ams\s*member|assignee|assigned\s*to|owner|consultant|engineer|solved\s*by)\b/i);
      const causeIdx = findCol(/\b(?:root\s*cause|cause|reason|why)\b/i);
      const resIdx = findCol(/\b(?:resolution|solution|action\s*taken|fix|workaround)\b/i);
      const typeIdx = findCol(/\b(?:issue\s*type|type|category|classification)\b/i);
      const statusIdx = findCol(/\b(?:status|state)\b/i);
      const resTimeIdx = findCol(/\b(?:resolution\s*time|turnaround|tat|duration)\b/i);

      // Aggregations across 100% of rows in the sheet
      const statusCounts = {};
      const assigneeCounts = {};
      const assigneeMonths = {};
      const reporterCounts = {};
      let userIssueCount = 0;
      let systemIssueCount = 0;
      let otherTypeCount = 0;

      // Key Operational Clusters
      const clusters = {
        pgiQueue: { name: 'PGI done but not in MB51 / Queue stuck in SMQ2', count: 0, causes: {}, fixes: {} },
        huSort: { name: 'HU partially sorted / Cannot load (GI-pack door link missing)', count: 0, userTickets: 0, causes: {}, fixes: {} },
        pickingPending: { name: 'Picking pending / Task not created (B2/F2 stock or aged batch)', count: 0, causes: {}, fixes: {} },
        wildcardMaster: { name: 'Storage type search wildcard / Missing master data (PACI/SRCI/MTOM/packspec)', count: 0, causes: {}, fixes: {} },
        openTaskDrop: { name: 'Open task on HU / Do drop / No warehouse order found', count: 0, causes: {}, fixes: {} },
        waveNoTask: { name: 'Wave created but no tasks (Wave unreleased)', count: 0, causes: {}, fixes: {} },
        damagedItem: { name: 'Damaged item / Mattress (Cancel pick for product & batch)', count: 0, causes: {}, fixes: {} },
        wrongBin: { name: 'Wrong bin putaway (ADPROD bin transfer)', count: 0, causes: {}, fixes: {} },
        waveNotCreated: { name: 'Wave not created / Delivery queue error (S/4 sync)', count: 0, causes: {}, fixes: {} }
      };

      let clockTimeValues = 0;
      let checkedTimeVals = 0;
      let backendWorkaroundCount = 0;
      const openRows = [];

      rows.forEach((r, rowIdx) => {
        // Status
        let st = (r[statusIdx] != null ? String(r[statusIdx]).trim() : '');
        const stLower = st.toLowerCase();
        if (stLower === 'closed' || stLower === 'clsoed') st = 'Closed';
        else if (stLower === 'open') st = 'Open';
        else if (!st) st = 'Unspecified';
        statusCounts[st] = (statusCounts[st] || 0) + 1;
        if (st === 'Open') openRows.push(rowIdx + 1);

        // Assignee
        const asgRaw = (r[asgIdx] != null ? String(r[asgIdx]).trim() : '') || 'Unassigned';
        assigneeCounts[asgRaw] = (assigneeCounts[asgRaw] || 0) + 1;

        // Month breakdown
        const dVal = r[dateIdx];
        let monthStr = '';
        if (typeof dVal === 'number' && dVal > 40000) {
          const dt = new Date(Math.round((dVal - 25569) * 86400 * 1000));
          monthStr = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        } else if (typeof dVal === 'string' && dVal.length >= 7) {
          monthStr = dVal.slice(0, 7);
        }
        if (monthStr) {
          if (!assigneeMonths[asgRaw]) assigneeMonths[asgRaw] = {};
          assigneeMonths[asgRaw][monthStr] = (assigneeMonths[asgRaw][monthStr] || 0) + 1;
        }

        // Reporter
        const rep = (r[repIdx] != null ? String(r[repIdx]).trim() : '') || 'Unknown';
        reporterCounts[rep] = (reporterCounts[rep] || 0) + 1;

        // Classification
        const typ = (r[typeIdx] != null ? String(r[typeIdx]).toLowerCase().trim() : '');
        if (typ.includes('user')) userIssueCount++;
        else if (typ.includes('system') || typ.includes('queue') || typ.includes('rfc')) systemIssueCount++;
        else if (typ) otherTypeCount++;

        // Issue text & clusters
        const issueText = ((r[0] != null ? String(r[0]) : '') + ' ' + (r[descIdx] != null ? String(r[descIdx]) : '')).toLowerCase();
        const causeText = (r[causeIdx] != null ? String(r[causeIdx]) : '').trim();
        const resText = (r[resIdx] != null ? String(r[resIdx]) : '').trim();
        const combo = (issueText + ' ' + causeText + ' ' + resText).toLowerCase();

        const recordCluster = (key) => {
          clusters[key].count++;
          if (asgRaw.toLowerCase().includes('tarun') || (currentUserName && asgRaw.toLowerCase().includes(currentUserName.toLowerCase()))) {
            if (clusters[key].userTickets !== undefined) clusters[key].userTickets++;
          }
          if (causeText && causeText.length > 5) {
            const shortCause = causeText.replace(/\r?\n/g, ' ').slice(0, 70);
            clusters[key].causes[shortCause] = (clusters[key].causes[shortCause] || 0) + 1;
          }
          if (resText && resText.length > 5) {
            const shortFix = resText.replace(/\r?\n/g, ' ').slice(0, 70);
            clusters[key].fixes[shortFix] = (clusters[key].fixes[shortFix] || 0) + 1;
          }
        };

        if (combo.includes('pgi') || combo.includes('mb51') || combo.includes('processing error')) recordCluster('pgiQueue');
        if (combo.includes('partial') || combo.includes('gi-pack') || (combo.includes('hu') && combo.includes('sort'))) recordCluster('huSort');
        if (combo.includes('b2') || combo.includes('task not create') || combo.includes('picking pending')) recordCluster('pickingPending');
        if (combo.includes('wildcard') || combo.includes('storage type search') || combo.includes('paci') || combo.includes('pack spec')) recordCluster('wildcardMaster');
        if (combo.includes('do drop') || combo.includes('open task') || combo.includes('no warehouse order')) recordCluster('openTaskDrop');
        if (combo.includes('wave') && (combo.includes('no task') || combo.includes('not release') || combo.includes('release wave'))) recordCluster('waveNoTask');
        if (combo.includes('damage')) recordCluster('damagedItem');
        if (combo.includes('wrong bin') || combo.includes('adprod')) recordCluster('wrongBin');
        if (combo.includes('wave not created') || (combo.includes('not distribute') && combo.includes('delivery'))) recordCluster('waveNotCreated');

        // Check resolution time format
        const rt = r[resTimeIdx];
        if (rt != null && String(rt).trim() !== '') {
          checkedTimeVals++;
          const srt = String(rt).trim();
          if (/^\d{1,2}[:;]\d{2}/.test(srt) || (typeof rt === 'number' && rt < 1 && rt > 0)) {
            clockTimeValues++;
          }
        }

        if (combo.includes('backend') || combo.includes('manual update')) {
          backendWorkaroundCount++;
        }
      });

      const isClockTime = checkedTimeVals > 0 && (clockTimeValues / checkedTimeVals) > 0.35;

      // Build Sheet Markdown
      let md = `### Sheet: "${sheetName}" (${rows.length} rows, ${headers.length} columns)\n\n`;

      // 1. Executive Statistical Digest
      md += `#### 📊 Forensic Statistical Summary (${sheetName})\n`;
      md += `- **Total Tickets Analyzed:** ${rows.length} rows across 100% of sheet\n`;
      md += `- **Status Distribution:** ${Object.entries(statusCounts).map(([st, cnt]) => `**${st}:** ${cnt}`).join(', ')}\n`;
      if (userIssueCount > 0 || systemIssueCount > 0) {
        const classifiedTotal = userIssueCount + systemIssueCount + otherTypeCount;
        const userPct = ((userIssueCount / classifiedTotal) * 100).toFixed(1);
        const sysPct = ((systemIssueCount / classifiedTotal) * 100).toFixed(1);
        md += `- **Issue Classification:** **${userIssueCount} User Issues (${userPct}%)** vs **${systemIssueCount} System/Interface Issues (${sysPct}%)**\n`;
      }

      // 2. Assignee Ownership Breakdown
      const sortedAssignees = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);
      md += `\n#### 👥 Assignee Ownership & Personal Contribution (${sheetName})\n`;
      md += `| Assignee / AMS Member | Ticket Count | % of Sheet | Monthly Activity Breakdown |\n`;
      md += `| --- | --- | --- | --- |\n`;
      sortedAssignees.slice(0, 12).forEach(([asg, cnt]) => {
        const pct = ((cnt / rows.length) * 100).toFixed(1);
        const months = assigneeMonths[asg] ? Object.entries(assigneeMonths[asg]).map(([m, c]) => `${m}: ${c}`).join(', ') : 'N/A';
        const isUser = asg.toLowerCase().includes('tarun') || (currentUserName && asg.toLowerCase().includes(currentUserName.toLowerCase()));
        md += `| ${isUser ? `⭐ **${asg} (Candidate)**` : `**${asg}**`} | **${cnt}** | ${pct}% | ${months} |\n`;
      });

      // 3. Key Floor Reporters & Shift Supervisors
      const sortedReporters = Object.entries(reporterCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      md += `\n#### 🏭 Top Warehouse Floor Reporters / Supervisors (${sheetName})\n`;
      md += `- ${sortedReporters.map(([rep, cnt]) => `**${rep}:** ${cnt} tickets`).join(' | ')}\n`;

      // 4. Recurring Operational Clusters Matrix
      md += `\n#### ⚡ Top Recurring Operational Clusters (${sheetName})\n`;
      md += `| Issue Cluster | Occurrences | Typical Root Cause Identified | Live Floor Workaround / Fix |\n`;
      md += `| --- | --- | --- | --- |\n`;
      Object.entries(clusters).forEach(([k, c]) => {
        if (c.count > 0) {
          const topCause = Object.entries(c.causes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'System status / queue lock';
          const topFix = Object.entries(c.fixes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Corrective posting / queue reactivation';
          const userNote = c.userTickets ? ` (${c.userTickets} personal)` : '';
          md += `| **${c.name}** | **${c.count}**${userNote} | ${topCause.replace(/\|/g, '\\|')} | ${topFix.replace(/\|/g, '\\|')} |\n`;
        }
      });

      // 5. Data Profiling & Cautions
      md += `\n#### ⚠️ Data Quality & Forensic Audit Notes (${sheetName})\n`;
      if (isClockTime) {
        md += `- ⏱️ **Timestamp Format Warning:** 'Resolution time' contains clock timestamps or fractional day timestamps, NOT elapsed SLA duration. Do NOT quote as turnaround SLA without explicit confirmation.\n`;
      }
      if (openRows.length > 0) {
        md += `- 📌 **Open / Pending Tickets:** ${openRows.length} tickets remain open/unresolved in this sheet (e.g. rows ${openRows.slice(0, 5).join(', ')}).\n`;
      }
      if (backendWorkaroundCount > 0) {
        md += `- 🔧 **Backend Workarounds:** ${backendWorkaroundCount} ticket(s) noted emergency backend or manual interventions (e.g. backend PGI). Must be explained as exceptional emergency one-offs.\n`;
      }

      // 6. High-Density Verbatim Row Table (Up to 450 priority rows per sheet)
      md += `\n#### 📋 High-Density Record Sample (${sheetName})\n`;
      if (headers.length > 0) {
        md += `| Row | ${headers.map(h => String(h ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
        md += `| --- | ${headers.map(() => '---').join(' | ')} |\n`;

        // Smart sample: prioritize open rows, candidate rows, and distinct clusters
        const priorityRows = [];
        const standardRows = [];
        rows.forEach((row, idx) => {
          const rowStr = JSON.stringify(row).toLowerCase();
          const isOpen = (row[statusIdx] || '').toString().toLowerCase().includes('open');
          const isCandidate = rowStr.includes('tarun') || (currentUserName && rowStr.includes(currentUserName.toLowerCase()));
          if (isOpen || isCandidate) {
            priorityRows.push({ row, idx: idx + 1 });
          } else {
            standardRows.push({ row, idx: idx + 1 });
          }
        });

        const selectedRows = [...priorityRows, ...standardRows].slice(0, 450);
        selectedRows.forEach(({ row, idx }) => {
          md += `| #${idx} | ${headers.map((_, colI) => String(row[colI] ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 80)).join(' | ')} |\n`;
        });
        if (rows.length > 450) {
          md += `\n*(Displaying 450 priority records of ${rows.length} total rows. Forensic statistics above computed across 100% of rows.)*\n`;
        }
      }

      sheetsMarkdown.push(md);
    });

    const globalHeader = `# 📊 WORKBOOK FORENSIC AUDIT & OPERATIONAL REASONING PACK\n**File:** "${fileName}" | **Sheets Analyzed:** ${workbook.SheetNames.length} | **Total Records Audited:** ${totalRowsGlobal} across 100% of rows\n\n---\n\n`;

    return {
      totalRows: totalRowsGlobal,
      content: globalHeader + sheetsMarkdown.join('\n\n---\n\n')
    };
  };

  const handleFileInput = async (e, setImage, setDocState) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    // Excel & CSV parsing using SheetJS with Deep Forensic Profiling
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const currentUserName = user?.display_name || user?.name || 'Tarun';
        const { totalRows, content } = generateForensicSpreadsheetDigest(workbook, file.name, currentUserName);

        if (setDocState) {
          setDocState({
            filename: file.name,
            type: 'excel',
            sheetCount: workbook.SheetNames.length,
            totalRows,
            content
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
        const loadedCitationsMap = {};
        let turnCounter = 0;
        const loadedTaskInfoMap = {};
        let lastTaskInfo = null;

        data.messages.forEach((m) => {
          if (m.role === "user") {
            if (!isFirstTurn) {
              reconstructed += "\n\n---\n\n### Follow-up Query: " + m.content + "\n\n";
            }
          } else if (m.role === "model") {
            reconstructed += m.content;
            if (m.metadata?.taskInfo) {
              loadedTaskInfoMap[`turn-seg-${turnCounter}`] = m.metadata.taskInfo;
              lastTaskInfo = m.metadata.taskInfo;
            }
            if (m.metadata?.sources && Array.isArray(m.metadata.sources) && m.metadata.sources.length > 0) {
              citations.push(...m.metadata.sources);
              loadedCitationsMap[`turn-seg-${turnCounter}`] = m.metadata.sources;
            }
            turnCounter++;
            isFirstTurn = false;
            if (m.metadata?.citationIds) {
              // citations
            }
          }
        });
        if (lastTaskInfo) setCurrentTaskInfo(lastTaskInfo);
        setTurnTaskInfoMap(loadedTaskInfoMap);
        setAiCitations(citations);
        setTurnCitationsMap(loadedCitationsMap);

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

        // Auto-derive classification for persistent HUD display on load / refresh
        const lowerTopic = (topicTitle + " " + reconstructed.substring(0, 400)).toLowerCase();
        if (lowerTopic.includes("gts") || lowerTopic.includes("spl") || lowerTopic.includes("sanctioned") || lowerTopic.includes("embargo")) {
          setActiveClassification({
            primaryModule: "SAP Global Trade Services (GTS)",
            code: "GTS",
            badge: "GTS",
            confidence: "98%",
            subArea: "Sanctioned Party List (SPL) & Compliance",
            crossModuleFlow: "SD ↔ GTS ↔ FI",
            signatureTcodes: ["/SAPSLL/SPL_CHG1", "/SAPSLL/BL_DOCS", "/SAPSLL/LEGCUS"]
          });
        } else if (lowerTopic.includes("retail") || lowerTopic.includes("article") || lowerTopic.includes("assortment") || lowerTopic.includes("allocation")) {
          setActiveClassification({
            primaryModule: "SAP IS-Retail",
            code: "IS-RETAIL",
            badge: "IS-Retail",
            confidence: "98%",
            subArea: "Article Master & Store Replenishment",
            crossModuleFlow: "Retail ↔ MM ↔ SD ↔ POS",
            signatureTcodes: ["MM41", "WB01", "WSL10", "WA01", "WRP1"]
          });
        } else if (lowerTopic.includes("pricing") || lowerTopic.includes("sales") || lowerTopic.includes("order") || lowerTopic.includes("o2c") || lowerTopic.includes("sd")) {
          setActiveClassification({
            primaryModule: "SAP Sales and Distribution (SD)",
            code: "SD",
            badge: "SD",
            confidence: "97%",
            subArea: "Order-to-Cash & Pricing Determination",
            crossModuleFlow: "SD ↔ MM ↔ EWM ↔ FI",
            signatureTcodes: ["VA01", "VL01N", "VF01", "V/08", "OVL2"]
          });
        } else if (lowerTopic.includes("ewm") || lowerTopic.includes("warehouse") || lowerTopic.includes("pmr") || lowerTopic.includes("storage")) {
          setActiveClassification({
            primaryModule: "SAP Extended Warehouse Management (EWM)",
            code: "EWM",
            badge: "EWM",
            confidence: "97%",
            subArea: "Warehouse Staging & Inventory Execution",
            crossModuleFlow: "PP ↔ EWM ↔ MM",
            signatureTcodes: ["/SCWM/MON", "/SCWM/PRDO", "/SCWM/STAGE"]
          });
        } else if (lowerTopic.includes("smq") || lowerTopic.includes("bgrfc") || lowerTopic.includes("queue") || lowerTopic.includes("basis")) {
          setActiveClassification({
            primaryModule: "SAP Basis & RFC Queues",
            code: "BASIS",
            badge: "Basis",
            confidence: "96%",
            subArea: "Asynchronous Queue Monitoring & Integration",
            crossModuleFlow: "ERP ↔ qRFC ↔ EWM / GTS",
            signatureTcodes: ["SMQ1", "SMQ2", "SBGRFCMON", "SM59", "SLG1"]
          });
        }
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
    if (term.length > 32000) return alert("Your input exceeds the 32,000 character limit. Please shorten your message or attach it as a document.");
    const activeImg = passedImg || topImage;
    const activeDoc = passedDoc || topDoc;
    if (!term && !activeImg && !activeDoc) return;

    const matchedDoc = getMatchedDoc(term);
    setDoc(matchedDoc);
    setSearchTopic(term);
    setAiText("");
    setAiStreaming(true);
    setAiCitations([]);
    setSearchEntryHtml(null);
    setTurnCitationsMap({});
    setTopImage(null);
    setTopDoc(null);
    userScrolledUpRef.current = false;
    setIsScrolledUp(false);

    // 1. Maintain / Create conversation in backend
    let currentConvId = convId;
    try {
      const claudeTitle = generateClaudeChatTitle(term);
      if (!currentConvId) {
        const convRes = await api.createConversation({ title: claudeTitle });
        if (convRes?.conversation) {
          currentConvId = convRes.conversation.id;
          setConvId(currentConvId);
          onSessionChange?.(currentConvId);
          setConvs((prev) => [convRes.conversation, ...prev.filter(c => c.id !== currentConvId)]);
          window.dispatchEvent(new CustomEvent('nexus-conversation-updated', { detail: convRes.conversation }));
        }
      } else {
        const updatedTitle = claudeTitle;
        api.updateConversation(currentConvId, { title: updatedTitle }).catch(() => {});
        setConvs((prev) => prev.map(c => c.id === currentConvId ? { ...c, title: updatedTitle } : c));
        window.dispatchEvent(new CustomEvent('nexus-conversation-updated', { detail: { id: currentConvId, title: updatedTitle, updated_at: new Date().toISOString() } }));
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

      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch(e) {}
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      startStreamMetrics();
      await api.streamChat(
        {
          conversationId: currentConvId,
          contents: [{ role: "user", parts: userParts }],
          selectedModule,
          mode: assistantMode,
          mentorMode: false,
          preferredModel: selectedModel,
          uploadedDocs: activeDoc ? [activeDoc] : []
        },
        (chunk, fullText) => {
          setAiText(fullText);
          updateStreamMetricsChars(fullText.length);
        },
        (sources) => {
          setAiCitations(sources || []);
          setTurnCitationsMap((prev) => ({ ...prev, "turn-seg-0": sources || [] }));
        },
        (classification) => {
          setActiveClassification(classification);
        },
        controller.signal,
        (intentData) => {
          setActiveIntent(intentData);
        },
        (taskInfo) => {
          if (taskInfo) {
            setCurrentTaskInfo(taskInfo);
            setTurnTaskInfoMap((prev) => ({ ...prev, "turn-seg-0": taskInfo }));
          }
        },
        (searchEntry) => {
          if (searchEntry) setSearchEntryHtml(searchEntry);
        }
      );

      // Trigger Smart Follow-Ups for initial query
      api.getFollowUpSuggestions({
        lastUserPrompt: term,
        lastAssistantResponse: aiText,
        module: selectedModule || "General"
      }).then((res) => {
        if (res.followUps && res.followUps.length) {
          setFollowUpSuggestions(res.followUps);
        }
      }).catch(() => {});
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }
      if (err.message?.toLowerCase().includes("too many requests") || err.message?.includes("429")) {
        alert("⏳ Rate Limit Exceeded: You're moving fast! Please wait a few seconds before sending another message.");
      }
      setLastFailedQuery(term);
      const isKeyErr = err.message?.includes('NO_KEY') || err.message?.includes('AI engine') || err.message?.includes('API key');
      setAiText(isKeyErr 
        ? "⚠ AI engine isn't configured. Add GEMINI_API_KEY" 
        : "⚠ AI Reasoning Note: " + (err.message || "Failed to stream live reasoning. Showing verified standard runbook below."));
    } finally {
      stopStreamMetrics("turn-seg-0");
      setAiStreaming(false);
      abortControllerRef.current = null;
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

  // 60FPS Butter Smooth Lenis Inertia Momentum Scroll Engine
  useEffect(() => {
    if (!mainScrollRef.current || !mainContentRef.current) return;

    const lenis = new Lenis({
      wrapper: mainScrollRef.current,
      content: mainContentRef.current,
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 60fps exponential momentum deceleration
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.6,
      infinite: false
    });

    lenisRef.current = lenis;

    let animationFrameId;
    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    // High performance 60fps scroll observer without layout thrashing
    lenis.on("scroll", (e) => {
      const scrollPos = e.scroll ?? mainScrollRef.current.scrollTop;
      const limit = e.limit ?? (mainScrollRef.current.scrollHeight - mainScrollRef.current.clientHeight);
      const distanceFromBottom = limit - scrollPos;

      if (distanceFromBottom > 100) {
        userScrolledUpRef.current = true;
        setIsScrolledUp(true);
      } else {
        userScrolledUpRef.current = false;
        setIsScrolledUp(false);
      }

      // Update active turn navigation rail indicator
      const container = mainScrollRef.current;
      if (!container) return;
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
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [conversationTurns]);

  // Smooth 60fps Auto-Follow generation down with Lenis
  useEffect(() => {
    if (!aiStreaming) return;
    if (userScrolledUpRef.current) return; // User manually scrolled up; allow them to freely browse

    if (lenisRef.current && mainScrollRef.current) {
      lenisRef.current.scrollTo(mainScrollRef.current.scrollHeight, {
        duration: 0.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        lock: false
      });
    } else if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: mainScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [aiText, aiStreaming]);

  const handleBottomSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const q = followUpInput.trim();
    const trimmed = q;
    const activeImg = followUpImage;
    const activeDoc = followUpDoc;
    if ((!q && !activeImg && !activeDoc) || aiStreaming) return;

    setRawPromptDraft(null);
    setShowEnhanceSuccess(false);

    // Command Interception: Python Code Execution Sandbox (Gemini codeExecution tool)
    if (trimmed.startsWith('/code')) {
      const codePrompt = trimmed.replace(/^\/code\s*/, '').trim() || 'Calculate standard warehouse throughput metrics and SLA projections';
      setFollowUpInput('');
      const userTurn = { id: `turn-${Date.now()}`, title: codePrompt, body: codePrompt, isUser: true };
      if (typeof setConversationTurns === 'function') {
        setConversationTurns(prev => [...prev, userTurn]);
      }
      
      try {
        setAiStreaming(true);
        const resp = await api.codeExecute({ prompt: codePrompt });
        if (resp.ok && resp.result) {
          let formatted = '## 🐍 Python Warehouse Computation Results\n\n';
          for (const seg of resp.result.segments) {
            if (seg.type === 'text') formatted += seg.content + '\n\n';
            if (seg.type === 'code') formatted += '```python\n' + seg.content + '\n```\n\n';
            if (seg.type === 'output') formatted += '**Console Output:**\n```\n' + seg.content + '\n```\n\n';
          }
          setAiText(formatted);
        }
      } catch(e) {
        setAiText(`Error: ${e.message}`);
      } finally {
        setAiStreaming(false);
      }
      return;
    }

    // Command Interception: Gemini Context Caching (/cache)
    if (trimmed.startsWith('/cache ') || trimmed === '/cache') {
      const cachePrompt = trimmed.replace(/^\/cache\s*/, '').trim() || 'Summarize top critical PGI failures in hypercare';
      setFollowUpInput('');
      const userTurn = { id: `turn-${Date.now()}`, title: cachePrompt, body: cachePrompt, isUser: true };
      if (typeof setConversationTurns === 'function') {
        setConversationTurns(prev => [...prev, userTurn]);
      }
      
      try {
        setAiStreaming(true);
        const resp = await api.cacheQuery({ prompt: cachePrompt });
        if (resp.ok && resp.text) {
          let formatted = `⚡ **[Gemini Context Cache Query]** *(Cached Knowledge Base)*\n\n${resp.text}`;
          if (resp.usage?.cachedTokens) {
            formatted += `\n\n---\n*⚡ Cached Tokens: ${resp.usage.cachedTokens.toLocaleString()} | Prompt: ${resp.usage.promptTokens} | Cost Savings: ~80%*`;
          }
          setAiText(formatted);
        } else {
          setAiText(resp.error || 'Failed to query context cache');
        }
      } catch(e) {
        setAiText(`Error: ${e.message}`);
      } finally {
        setAiStreaming(false);
      }
      return;
    }

    // Command Interception: Autonomous SAP Tool Agent (/agent)
    if (trimmed.startsWith('/agent ') || trimmed === '/agent') {
      const agentPrompt = trimmed.replace(/^\/agent\s*/, '').trim() || 'Diagnose and resolve PGI block on Outbound Delivery 800129 in warehouse TN03';
      setFollowUpInput('');
      const userTurnId = `turn-${Date.now()}`;
      const assistantTurnId = `turn-${Date.now() + 1}`;
      const userTurn = { id: userTurnId, title: agentPrompt, content: `### Follow-up Query: ${agentPrompt}`, body: agentPrompt, isUser: true };
      if (typeof setConversationTurns === 'function') {
        setConversationTurns(prev => [...prev, userTurn]);
      }
      
      try {
        setAiStreaming(true);
        const resp = await api.sapAgentInvestigate({ prompt: agentPrompt });
        if (resp && resp.ok) {
          setTurnSapAgentMap(prev => ({ ...prev, [assistantTurnId]: resp }));
          setActiveSapAgentResult(resp);
          const assistantTurn = {
            id: assistantTurnId,
            title: 'Autonomous SAP Diagnosis & RCA',
            content: resp.finalAnswer,
            sapAgentResult: resp
          };
          if (typeof setConversationTurns === 'function') {
            setConversationTurns(prev => [...prev, assistantTurn]);
          }
          setAiText(resp.finalAnswer);
        } else {
          setAiText(resp?.error || 'Autonomous SAP Agent investigation failed.');
        }
      } catch(e) {
        setAiText(`Autonomous SAP Agent Error: ${e.message}`);
      } finally {
        setAiStreaming(false);
      }
      return;
    }

    // Command Interception: Visual Warehouse Diagram Generator (/visual)
    if (trimmed.startsWith("/visual") || q.startsWith("/visual")) {
      const visualPrompt = (trimmed.startsWith("/visual") ? trimmed : q).replace(/^\/visual\s*/, '').trim() || 'Modern SAP EWM High-Bay Warehouse with Dock Doors D01-D04, Staging Lanes, Fast-Pick Area, and Quarantine Bin 0090';
      setFollowUpInput("");
      const userTurn = { id: `turn-${Date.now()}`, title: visualPrompt, body: visualPrompt, isUser: true };
      if (typeof setConversationTurns === 'function') {
        setConversationTurns(prev => [...prev, userTurn]);
      }

      try {
        setAiStreaming(true);
        const resp = await api.generateWarehouseVisual({ prompt: visualPrompt });
        if (resp && resp.ok) {
          const visualPayload = {
            type: resp.type,
            imageUrl: resp.imageUrl,
            svgContent: resp.svgContent,
            prompt: resp.prompt || visualPrompt,
            title: `Architectural Layout: ${visualPrompt}`,
            metadata: {
              generatedAt: new Date().toISOString(),
              engine: resp.engine || (resp.type === 'bitmap' ? 'Google Imagen 3 (imagen-3.0-generate-002)' : 'Gemini 3.5 Precision Vector Architecture'),
              dimensions: '1024x768',
              status: 'Live Topology'
            }
          };

          const formattedVisual = `## 🎨 SAP EWM Architectural Warehouse Schematic\n\n**Layout Prompt:** *${visualPrompt}*\n**Engine:** \`${visualPayload.metadata.engine}\` · **Generated:** ${new Date().toLocaleTimeString()}\n\n\`\`\`warehouse-visual\n${JSON.stringify(visualPayload)}\n\`\`\`\n\n*Interactive architectural warehouse schematic rendered above with zoom, pan, and vector SVG/PNG export controls.*`;

          if (aiText) {
            setAiText(prev => prev + '\n\n---\n\n### Follow-up Query: ' + visualPrompt + '\n\n' + formattedVisual);
          } else {
            setAiText(formattedVisual);
          }
        } else {
          const errMsg = resp?.error || 'Failed to generate visual warehouse layout';
          if (aiText) {
            setAiText(prev => prev + '\n\n---\n\n### Follow-up Query: ' + visualPrompt + '\n\n⚠ ' + errMsg);
          } else {
            setAiText('⚠ ' + errMsg);
          }
        }
      } catch (e) {
        const errMsg = `Visual generation error: ${e.message}`;
        if (aiText) {
          setAiText(prev => prev + '\n\n---\n\n### Follow-up Query: ' + visualPrompt + '\n\n⚠ ' + errMsg);
        } else {
          setAiText('⚠ ' + errMsg);
        }
      } finally {
        setAiStreaming(false);
      }
      return;
    }

    // Command Interception: Audio Shift Handover Processor (/handover)
    if (trimmed.startsWith("/handover") || q.startsWith("/handover")) {
      setFollowUpInput("");
      setShiftHandoverModalOpen(true);
      return;
    }

    // Command Interception: Deep Research
    if (q.startsWith("/deep-research")) {
      const topic = q.replace(/^\/deep-research\s*/, "").trim();
      setFollowUpInput("");
      handleRunDeepResearch(topic);
      return;
    }

    // Command Interception: Semantic Vector Incident Matcher
    if (q.startsWith("/semantic")) {
      const query = q.replace(/^\/semantic\s*/, "").trim();
      setFollowUpInput("");
      handleRunSemanticSearch(query);
      return;
    }

    // Command Interception: Audio TTS Speech Briefing
    if (q.startsWith("/tts")) {
      const textToRead = q.replace(/^\/tts\s*/, "").trim();
      setFollowUpInput("");
      handlePlayTurnSpeech(textToRead || aiText, "main-ai");
      return;
    }

    // Command Interception: Visual Screen OCR Analyzer
    if (q.startsWith("/ocr")) {
      setFollowUpInput("");
      handleAnalyzeAttachedScreen();
      return;
    }

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

  const handleEnhancePrompt = async () => {
    const raw = followUpInput.trim();
    if (!raw || isEnhancingPrompt || aiStreaming) return;
    setRawPromptDraft(followUpInput);
    setIsEnhancingPrompt(true);
    setShowEnhanceSuccess(false);

    try {
      const res = await api.enhancePrompt({
        prompt: raw,
        module: selectedModule
      });

      if (res?.ok && res.enhancedPrompt) {
        setFollowUpInput(res.enhancedPrompt);
        setShowEnhanceSuccess(true);
        if (followUpTextareaRef.current) {
          setTimeout(() => {
            autoResizeTextarea(followUpTextareaRef.current, 42, 180);
            followUpTextareaRef.current?.focus();
          }, 40);
        }
      }
    } catch (err) {
      console.warn("Failed to enhance prompt:", err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleRevertEnhancedPrompt = () => {
    if (rawPromptDraft !== null) {
      setFollowUpInput(rawPromptDraft);
      setRawPromptDraft(null);
      setShowEnhanceSuccess(false);
      if (followUpTextareaRef.current) {
        setTimeout(() => {
          autoResizeTextarea(followUpTextareaRef.current, 42, 180);
          followUpTextareaRef.current?.focus();
        }, 40);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatVoiceDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startAudioRecording = async () => {
    setAudioError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError("Microphone audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ];
      let selectedMimeType = '';
      for (const t of preferredTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMimeType = t;
          break;
        }
      }

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecordingAudio(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      };

      recorder.start(250);
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAudioError("Microphone access denied. Please allow microphone permissions in your browser.");
      } else {
        setAudioError("Microphone error: " + err.message);
      }
    }
  };

  const stopAudioRecordingAndTranscribe = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingAudio(false);

    recorder.onstop = async () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }

      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      if (audioBlob.size < 200) {
        return;
      }

      setIsTranscribingAudio(true);
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result;
            const b64 = typeof res === 'string' ? res.split(',')[1] : '';
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        if (!base64Data) throw new Error("Could not process audio data");

        const resp = await api.transcribeAudio({
          audioData: base64Data,
          mimeType: mimeType
        });

        if (resp?.ok && resp.transcript) {
          const cleanTranscript = resp.transcript.trim();
          setFollowUpInput(prev => (prev && prev.trim()) ? `${prev.trim()} ${cleanTranscript}` : cleanTranscript);
          setTimeout(() => {
            if (followUpTextareaRef.current) {
              autoResizeTextarea(followUpTextareaRef.current, 44, 200);
              followUpTextareaRef.current.focus();
            }
          }, 60);
        } else {
          setAudioError("No speech detected. Please speak clearly into the microphone.");
          setTimeout(() => setAudioError(null), 4000);
        }
      } catch (tErr) {
        console.error("Audio transcription error:", tErr);
        setAudioError("Audio transcription failed: " + (tErr.message || "Network error"));
        setTimeout(() => setAudioError(null), 5000);
      } finally {
        setIsTranscribingAudio(false);
      }
    };

    recorder.stop();
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const handlePlayTurnSpeech = async (text, turnId = 'main-ai') => {
    if (playingAudioTurnId === turnId) {
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
        activeAudioElementRef.current = null;
      }
      setPlayingAudioTurnId(null);
      return;
    }

    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }

    setSynthesizingTurnId(turnId);
    try {
      const res = await api.synthesizeSpeech({ text });
      if (res?.ok && res.audioData) {
        const audioSrc = `data:${res.mimeType || 'audio/wav'};base64,${res.audioData}`;
        const audio = new Audio(audioSrc);
        activeAudioElementRef.current = audio;
        setPlayingAudioTurnId(turnId);

        audio.onended = () => {
          setPlayingAudioTurnId(null);
          activeAudioElementRef.current = null;
        };
        audio.onerror = () => {
          setPlayingAudioTurnId(null);
          activeAudioElementRef.current = null;
        };
        await audio.play();
      } else {
        alert("Audio synthesis returned no audio.");
      }
    } catch (e) {
      console.error("Speech synthesis failed:", e);
      alert("Voice speech synthesis failed: " + e.message);
    } finally {
      setSynthesizingTurnId(null);
    }
  };

  const handleAnalyzeAttachedScreen = async () => {
    if (!followUpImage || isAnalyzingScreen) return;
    setIsAnalyzingScreen(true);
    setScreenAnalysisData(null);

    try {
      const res = await api.analyzeScreen({
        imageBase64: followUpImage.dataUrl,
        mimeType: "image/png"
      });

      if (res?.ok && res.analysis) {
        setScreenAnalysisData(res.analysis);
        const a = res.analysis;
        const autoPrompt = `Analyze this SAP screen error:\n- Transaction: ${a.tcode || 'Unknown'}\n- Message: ${a.messageClass || ''} ${a.messageNumber || ''} - ${a.errorMessage || ''}\n- Details: ${a.summary || ''}\nWhat is the exact resolution playbook in EWM/S4?`;
        setFollowUpInput(autoPrompt);
        if (followUpTextareaRef.current) {
          setTimeout(() => {
            autoResizeTextarea(followUpTextareaRef.current, 52, 220);
            followUpTextareaRef.current?.focus();
          }, 50);
        }
      }
    } catch (err) {
      console.error("Screen analysis error:", err);
      alert("Screen visual analysis failed: " + err.message);
    } finally {
      setIsAnalyzingScreen(false);
    }
  };

  const handleRunSemanticSearch = async (queryText) => {
    const q = queryText || followUpInput.trim() || "PGI queue error in SMQ2";
    setIsSearchingSemantic(true);
    setSemanticModalData({ query: q, matches: [] });

    try {
      const res = await api.semanticSearch({ query: q, limit: 5 });
      if (res?.ok && res.matches) {
        setSemanticModalData({ query: q, matches: res.matches });
      }
    } catch (err) {
      console.error("Semantic search failed:", err);
      alert("Semantic search failed: " + err.message);
    } finally {
      setIsSearchingSemantic(false);
    }
  };

  const handleRunDeepResearch = async (topic) => {
    const t = topic || deepResearchTopic || followUpInput.trim() || "PGI queue stuck at dock door in EWM";

    setIsGeneratingDeepResearch(true);
    try {
      const res = await api.deepResearch({
        topic: t,
        context: "High-volume mattress and furniture distribution center operations",
        module: selectedModule || "EWM"
      });

      if (res?.ok && res.doc) {
        setActiveNexusDoc(res.doc);
        setNexusDocPanelOpen(true);
        setIsDocDocked(true);
        setDeepResearchModalOpen(false);
      }
    } catch (err) {
      console.error("Deep research error:", err);
      alert("Deep research failed: " + err.message);
    } finally {
      setIsGeneratingDeepResearch(false);
    }
  };

  const handleFollowUp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const q = followUpInput.trim();
    if (q.length > 32000) return alert("Your input exceeds the 32,000 character limit. Please shorten your message or attach it as a file.");
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
    userScrolledUpRef.current = false;
    setIsScrolledUp(false);

    const prevText = aiText;
    const queryHeaderTitle = q || (activeDoc ? "Analyze attached spreadsheet" : (activeImg ? "Analyze screenshot" : "Follow-up Query"));
    const imgLabel = activeImg ? `\n\n*(Attached Screenshot: ${activeImg.name})*` : "";
    const docLabel = activeDoc ? `\n\n*(Attached Spreadsheet: ${activeDoc.filename} — ${activeDoc.sheetCount} sheets, ${activeDoc.totalRows} rows)*` : "";
    
    // Set initial follow-up placeholder
    setAiText(prevText + "\n\n---\n\n### Follow-up Query: " + queryHeaderTitle + imgLabel + docLabel + "\n\n");

    // Smoothly scroll down immediately to reveal active follow-up turn
    setTimeout(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
          top: mainScrollRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 40);

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch(e) {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

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

      startStreamMetrics();
      await api.streamChat(
        {
          conversationId: convId,
          contents: [
            { role: "user", parts: userParts }
          ],
          selectedModule,
          mode: assistantMode,
          mentorMode: false,
          preferredModel: selectedModel,
          uploadedDocs: activeDoc ? [activeDoc] : []
        },
        (chunk, fullText) => {
          accumulated = fullText;
          updateStreamMetricsChars(fullText.length);
          setAiText(prevText + "\n\n---\n\n### Follow-up Query: " + queryHeaderTitle + imgLabel + docLabel + "\n\n" + fullText);
        },
        (sources) => {
          if (sources?.length) {
            setAiCitations((prev) => [...prev, ...sources]);
            const followUpTurnId = `turn-seg-${conversationTurns.length || 1}`;
            setTurnCitationsMap((prev) => ({ ...prev, [followUpTurnId]: sources }));
          }
        },
        (classification) => {
          setActiveClassification(classification);
        },
        controller.signal,
        (intentData) => {
          setActiveIntent(intentData);
        },
        (taskInfo) => {
          if (taskInfo) {
            setCurrentTaskInfo(taskInfo);
            const followUpTurnId = `turn-seg-${conversationTurns.length || 1}`;
            setTurnTaskInfoMap((prev) => ({ ...prev, [followUpTurnId]: taskInfo }));
          }
        },
        (searchEntry) => {
          if (searchEntry) setSearchEntryHtml(searchEntry);
        }
      );

      // Trigger Smart Follow-Ups for follow-up turn
      if (accumulated) {
        api.getFollowUpSuggestions({
          lastUserPrompt: queryHeaderTitle,
          lastAssistantResponse: accumulated,
          module: selectedModule || "General"
        }).then((res) => {
          if (res.followUps && res.followUps.length) {
            setFollowUpSuggestions(res.followUps);
          }
        }).catch(() => {});
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }
      if (err.message?.toLowerCase().includes("too many requests") || err.message?.includes("429")) {
        alert("⏳ Rate Limit Exceeded: You're moving fast! Please wait a few seconds before sending another message.");
      }
      setLastFailedQuery(q || queryHeaderTitle);
      setAiText(prevText + "\n\n---\n\n### Follow-up Query: " + queryHeaderTitle + "\n\n⚠ Error: " + err.message);
    } finally {
      setAiStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Load conversation list from DB on mount (keep available in sidebar without auto-opening previous session)
  useEffect(() => {
    let isMounted = true;
    api.getConversations().then(async (d) => {
      if (!isMounted) return;
      const list = d.conversations || [];
      setConvs(list);
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
        setSearchEntryHtml(null);
        setTurnCitationsMap({});
      }
    } catch (e) {
      const fallbackId = "conv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      setConvId(fallbackId);
      onSessionChange?.(fallbackId);
      setDoc(getMatchedDoc("New Session"));
      setSearchTopic("");
      setAiText("");
      setAiCitations([]);
      setSearchEntryHtml(null);
      setTurnCitationsMap({});
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
        background: "#FFFFFF",
        padding: 0,
        boxSizing: "border-box"
      }}
    >
      {/* ── CENTER MAIN INVESTIGATION SESSION BOX (Edge-to-edge White Workspace) ── */}
      <div
        ref={splitContainerRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          borderRadius: 0,
          background: "#FFFFFF",
          border: "none",
          boxShadow: "none",
          position: "relative"
        }}
      >
        {/* Left Column: Chat Conversation Stream & In-Canvas Prompt Box */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
            overflow: "hidden"
          }}
        >
        {/* Full-width Scrollable Container inside framed box with 60fps Lenis Engine */}
        <div
          ref={mainScrollRef}
          className="smooth-scroll-container"
          style={{
            flex: 1,
            overflowY: "auto",
            width: "100%",
            background: "var(--bg-card, #FFFFFF)",
            position: "relative",
            transform: "translateZ(0)",
            willChange: "scroll-position",
            overscrollBehaviorY: "contain"
          }}
        >
          <div ref={mainContentRef} style={{ padding: "28px 44px 32px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>



          {/* Claude Clean Central Omnibox & Prompt Canvas */}
          {!doc && !aiText && !aiStreaming && (
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 12px 28px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              
              {/* Centered Brand Header (Clean Claude Aesthetic) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28, textAlign: "center" }}>
                <img 
                  src="/nexus-logo.jpg" 
                  alt="Nexus Logo" 
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    objectFit: "cover",
                    marginBottom: 12,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
                  }} 
                />
                <h1 style={{
                  fontSize: 26,
                  fontWeight: 650,
                  color: "var(--text-primary, #1C1917)",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}>
                  How can Nexus help you today?
                </h1>
              </div>

              {/* ── THE ELEVATED CENTRAL OMNIBOX CARD ── */}
              <div style={{
                width: "100%",
                background: "var(--bg-card, #FFFFFF)",
                border: "1.5px solid var(--border-subtle, #E5E5DF)",
                borderRadius: 16,
                padding: "16px 18px 12px 18px",
                boxShadow: "0 10px 32px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)",
                transition: "all 0.2s ease",
                position: "relative"
              }}>
                {/* Slash Command Palette Menu inside Omnibox */}
                <SlashCommandMenu
                  isOpen={followUpInput.startsWith('/') && !followUpInput.includes(' ')}
                  search={followUpInput.startsWith('/') ? followUpInput.slice(1) : ''}
                  onSelectCommand={(cmd) => {
                    if (cmd.id === 'shift-handover' || cmd.command === '/handover') {
                      setFollowUpInput("");
                      setShiftHandoverModalOpen(true);
                      return;
                    }
                    const newText = cmd.prefix || (cmd.command + " ");
                    setFollowUpInput(newText);
                    if (followUpTextareaRef.current) {
                      followUpTextareaRef.current.focus();
                      setTimeout(() => autoResizeTextarea(followUpTextareaRef.current, 52, 220), 0);
                    }
                  }}
                  onClose={() => {}}
                />

                {/* Attached screenshot preview pill */}
                {followUpImage && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(110, 26, 45, 0.1)", border: "1px solid rgba(110, 26, 45, 0.3)", borderRadius: 6, padding: "4px 10px", marginBottom: 10, flexWrap: "wrap" }}>
                    <img
                      src={followUpImage.dataUrl}
                      alt="Attached Preview"
                      onClick={() => window.dispatchEvent(new CustomEvent('nexus-open-lightbox', { detail: { src: followUpImage.dataUrl, alt: followUpImage.name, title: `Attached: ${followUpImage.name}` } }))}
                      title="Click to view full resolution in Lightbox"
                      style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, cursor: "zoom-in" }}
                    />
                    <span
                      onClick={() => window.dispatchEvent(new CustomEvent('nexus-open-lightbox', { detail: { src: followUpImage.dataUrl, alt: followUpImage.name, title: `Attached: ${followUpImage.name}` } }))}
                      style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--orange)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                      title="Click to expand"
                    >
                      📷 {followUpImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleAnalyzeAttachedScreen}
                      disabled={isAnalyzingScreen}
                      title="Analyze SAP GUI / RF Terminal screen with Gemini 3.5 Flash OCR"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "var(--orange, #6E1A2D)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {isAnalyzingScreen ? "🔍 Analyzing..." : "🔍 Deep Screen OCR"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFollowUpImage(null); setScreenAnalysisData(null); }}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Visual Screen OCR Diagnostic Badge */}
                {screenAnalysisData && (
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderLeft: "4px solid #6E1A2D",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 10,
                    fontSize: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#6E1A2D", fontFamily: "var(--font-mono)" }}>
                        🎯 Screen Diagnostic: {screenAnalysisData.tcode || 'SAP GUI'} {screenAnalysisData.messageClass ? `(${screenAnalysisData.messageClass} ${screenAnalysisData.messageNumber || ''})` : ''}
                      </span>
                      <button type="button" onClick={() => setScreenAnalysisData(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                    <div style={{ color: "#334155", marginBottom: 4 }}>{screenAnalysisData.summary || screenAnalysisData.errorMessage}</div>
                    {screenAnalysisData.immediateFixSteps && screenAnalysisData.immediateFixSteps.length > 0 && (
                      <div style={{ fontSize: 11.5, color: "#065F46", background: "#ECFDF5", padding: "4px 8px", borderRadius: 4 }}>
                        <strong>Quick Fix:</strong> {screenAnalysisData.immediateFixSteps[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Attached doc preview pill */}
                {followUpDoc && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: followUpDoc.type === 'excel' ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)", border: `1px solid ${followUpDoc.type === 'excel' ? 'rgba(110,231,183,0.4)' : 'rgba(147,197,253,0.4)'}`, borderRadius: 6, padding: "4px 10px", marginBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>{followUpDoc.type === 'excel' ? '📊' : '📄'}</span>
                    <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: followUpDoc.type === 'excel' ? "#34D399" : "#93C5FD", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {followUpDoc.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFollowUpDoc(null)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Audio Recording Error Toast */}
                {audioError && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 12, color: "#DC2626", fontWeight: 600, marginBottom: 8 }}>
                    <span>⚠️ {audioError}</span>
                    <button type="button" onClick={() => setAudioError(null)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕</button>
                  </div>
                )}

                {/* Enhanced Prompt Revert Toast */}
                {showEnhanceSuccess && rawPromptDraft !== null && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "rgba(110, 26, 45, 0.08)", border: "1px solid rgba(110, 26, 45, 0.25)", borderRadius: 6, fontSize: 11.5, color: "var(--orange)", fontWeight: 600, marginBottom: 8 }}>
                    <span>✨ Prompt Enhanced by AI</span>
                    <button
                      type="button"
                      onClick={handleRevertEnhancedPrompt}
                      style={{ background: "none", border: "none", color: "var(--orange)", textDecoration: "underline", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}
                    >
                      ↩ Revert
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEnhanceSuccess(false)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  ref={followUpTextareaRef}
                  rows={2}
                  value={followUpInput}
                  onChange={(e) => {
                    setFollowUpInput(e.target.value);
                    autoResizeTextarea(e.target, 52, 220);
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
                      if (followUpTextareaRef.current) autoResizeTextarea(followUpTextareaRef.current, 52, 220);
                    }, 0);
                  }}
                  placeholder="Ask anything about SAP EWM, PP, Basis queues, or type '/' for commands..."
                  style={{
                    width: "100%",
                    minHeight: 52,
                    maxHeight: 220,
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    fontSize: 15.5,
                    color: "var(--text-primary)",
                    outline: "none",
                    resize: "none",
                    lineHeight: "24px",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-sans)"
                  }}
                />

                {/* Omnibox Footer Action Row */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
                  flexWrap: "wrap",
                  gap: 8
                }}>
                  {isRecordingAudio ? (
                    /* Active Voice Recording Control Bar */
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 10,
                      padding: "6px 12px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#EF4444",
                          display: "inline-block",
                          animation: "nexusVoicePulse 1.2s infinite ease-in-out"
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", fontFamily: "var(--font-mono)" }}>
                          Listening {formatVoiceDuration(recordingSeconds)}
                        </span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, height: 16, marginLeft: 2 }}>
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar1 0.6s infinite ease-in-out" }} />
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar2 0.7s infinite ease-in-out" }} />
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar3 0.5s infinite ease-in-out" }} />
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar4 0.65s infinite ease-in-out" }} />
                        </div>
                        <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginLeft: 6 }}>
                          Speak SAP transaction codes, /SCWM/ commands, or queries...
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          onClick={cancelAudioRecording}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 8px",
                            borderRadius: 6
                          }}
                          title="Cancel voice recording"
                        >
                          Cancel ✕
                        </button>
                        <button
                          type="button"
                          onClick={stopAudioRecordingAndTranscribe}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "var(--orange, #6E1A2D)",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 8,
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(110, 26, 45, 0.25)"
                          }}
                          title="Finish and transcribe with Gemini"
                        >
                          <span>✓ Done</span>
                        </button>
                      </div>
                    </div>
                  ) : isTranscribingAudio ? (
                    /* Active Voice Transcription Loader */
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "7px 14px",
                      background: "rgba(110, 26, 45, 0.08)",
                      border: "1px solid rgba(110, 26, 45, 0.2)",
                      borderRadius: 8,
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--orange, #6E1A2D)"
                    }}>
                      <span style={{
                        width: 12,
                        height: 12,
                        border: "2px solid var(--orange, #6E1A2D)",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "nexusSpinner 0.8s linear infinite"
                      }} />
                      <span>Transcribing speech with Gemini Audio Intelligence...</span>
                    </div>
                  ) : (
                    /* Standard Hero Omnibox Toolbar */
                    <>
                      {/* Left: Enhanced Action Tools (Attach + Voice + Tools Popover) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Attach File Button */}
                        <button
                          type="button"
                          onClick={() => followUpFileRef.current?.click()}
                          title="Attach document or screenshot"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: (followUpImage || followUpDoc) ? "rgba(110, 26, 45, 0.1)" : "transparent",
                            border: `1px solid ${(followUpImage || followUpDoc) ? "var(--orange, #6E1A2D)" : "var(--border-subtle, rgba(0,0,0,0.14))"}`,
                            borderRadius: 8,
                            padding: "6px 11px",
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: (followUpImage || followUpDoc) ? "var(--orange, #6E1A2D)" : "var(--text-primary, #1C1917)",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = (followUpImage || followUpDoc) ? "rgba(110, 26, 45, 0.1)" : "transparent"; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                          <span>Attach</span>
                        </button>

                        {/* Voice Dictation Button */}
                        <button
                          type="button"
                          onClick={startAudioRecording}
                          disabled={aiStreaming || isTranscribingAudio}
                          title="Dictate with Voice"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "transparent",
                            border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                            borderRadius: 8,
                            padding: "6px 11px",
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: "var(--text-primary, #1C1917)",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ fontSize: 13 }}>🎙️</span>
                          <span>Voice</span>
                        </button>

                        {/* Copilot Tools Dropdown Popover */}
                        <div id="nexus-hero-tools-container" style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => setToolsMenuOpen(prev => !prev)}
                            title="Specialized SAP Copilot Tools (AMS Matcher, Deep Research, Prompt Enhancer, Commands)"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: toolsMenuOpen ? "var(--bg-surface)" : "transparent",
                              border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                              borderRadius: 8,
                              padding: "6px 10px",
                              fontSize: 12.5,
                              fontWeight: 500,
                              color: "var(--text-primary, #1C1917)",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { if (!toolsMenuOpen) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ fontSize: 13 }}>⚡</span>
                            <span>Tools</span>
                            <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 1 }}>▼</span>
                          </button>

                          {toolsMenuOpen && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: "calc(100% + 8px)",
                                left: 0,
                                background: "var(--bg-card, #FFFFFF)",
                                border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                                borderRadius: 10,
                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                padding: "6px 0",
                                minWidth: 230,
                                zIndex: 1000,
                                display: "flex",
                                flexDirection: "column"
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  const q = followUpInput.trim() || "PGI queue error in SMQ2";
                                  handleRunSemanticSearch(q);
                                  setToolsMenuOpen(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "8px 14px",
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  fontSize: 12.5,
                                  color: "var(--text-primary, #1C1917)",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <span>🎯</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>Match AMS Archetypes</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Search 2,292+ SAP incidents</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeepResearchTopic(followUpInput.trim() || "PGI queue stalling in SMQ2 with split HUs");
                                  setDeepResearchModalOpen(true);
                                  setToolsMenuOpen(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "8px 14px",
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  fontSize: 12.5,
                                  color: "var(--text-primary, #1C1917)",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <span>🔬</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>Deep RCA Research</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Autonomous investigation</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsWalkAndTalkActive(prev => !prev);
                                  setToolsMenuOpen(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "8px 14px",
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  fontSize: 12.5,
                                  color: "var(--text-primary, #1C1917)",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <span>{isWalkAndTalkActive ? "🟢" : "🎧"}</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>Walk &amp; Talk Voice Mode</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{isWalkAndTalkActive ? "Active" : "Hands-free audio copilot"}</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleEnhancePrompt();
                                  setToolsMenuOpen(false);
                                }}
                                disabled={!followUpInput.trim() || isEnhancingPrompt}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "8px 14px",
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  fontSize: 12.5,
                                  color: (!followUpInput.trim() || isEnhancingPrompt) ? "var(--text-muted)" : "var(--text-primary, #1C1917)",
                                  cursor: (!followUpInput.trim() || isEnhancingPrompt) ? "not-allowed" : "pointer",
                                  opacity: (!followUpInput.trim() || isEnhancingPrompt) ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => { if (followUpInput.trim() && !isEnhancingPrompt) e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <span>✨</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>Enhance Prompt</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Polish with AI guidance</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setFollowUpInput("/");
                                  if (followUpTextareaRef.current) {
                                    followUpTextareaRef.current.focus();
                                    setTimeout(() => autoResizeTextarea(followUpTextareaRef.current, 52, 220), 0);
                                  }
                                  setToolsMenuOpen(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "8px 14px",
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  fontSize: 12.5,
                                  color: "var(--text-primary, #1C1917)",
                                  cursor: "pointer",
                                  borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, #F3F4F6)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--orange, #6E1A2D)" }}>/</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>Slash Commands</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Type / for quick actions</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Model Status & Circular Send Button (Exact Claude Style) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-muted, #78716C)",
                            background: "transparent"
                          }}
                          title="Auto Engine: Gemini Flash reasoning & SAP Knowledge Base"
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                          <span>Auto Engine</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleBottomSubmit}
                          disabled={!followUpInput.trim() && !followUpImage && !followUpDoc}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: "none",
                            background: (followUpInput.trim() || followUpImage || followUpDoc)
                              ? "var(--orange, #6E1A2D)"
                              : "var(--border-subtle, #E5E5DF)",
                            color: (followUpInput.trim() || followUpImage || followUpDoc) ? "#FFFFFF" : "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: (followUpInput.trim() || followUpImage || followUpDoc) ? "pointer" : "default",
                            boxShadow: (followUpInput.trim() || followUpImage || followUpDoc) ? "0 2px 6px rgba(110,26,45,0.25)" : "none",
                            transition: "all 0.15s ease"
                          }}
                          title="Send prompt (Enter)"
                        >
                          ↑
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Clean Minimalist Prompt Suggestion Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 22, maxWidth: 720 }}>
                {[
                  { label: "Triage Inbound qRFC Jam (SMQ2)", query: "SMQ2" },
                  { label: "PMR vs Delivery-Based Staging", query: "delivery-based production integration" },
                  { label: "bgRFC vs qRFC Supervisor Setup", query: "bgRFC vs qRFC" }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFollowUpInput(chip.query);
                      setSearchTopic(chip.query);
                      handleGenerateInvestigation(chip.query);
                    }}
                    style={{
                      background: "var(--bg-card, #FFFFFF)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                      borderRadius: 20,
                      padding: "7px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary, #1C1917)",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--orange, #6E1A2D)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.12))";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Centered Claude Footnote */}
              <div style={{ fontSize: 12, color: "var(--text-muted, #78716C)", textAlign: "center", marginTop: 24 }}>
                Nexus is an enterprise SAP AI assistant and verifies against official SAP OSS notes.
              </div>

            </div>
          )}

          {/* Plain AI Streaming / Output (NO CARDS, Plain text format) */}
          {(aiText || aiStreaming) && (activeSection === "all" || activeSection === "ai") && (
            <div style={{ marginBottom: 28, maxWidth: 840, margin: "0 auto" }}>

              {/* AI Executive Summary Banner */}
              {summaryToast && (
                <div style={{
                  marginBottom: 16,
                  padding: "16px 20px",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>✨</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1E40AF" }}>{summaryToast.title}</span>
                    </div>
                    <button onClick={() => setSummaryToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 16 }}>✕</button>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#1F2937" }}>{summaryToast.summary}</p>
                  {summaryToast.keyTakeaways && summaryToast.keyTakeaways.length > 0 && (
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 12.5, color: "#374151" }}>
                      {summaryToast.keyTakeaways.map((k, idx) => <li key={idx}>{k}</li>)}
                    </ul>
                  )}
                </div>
              )}
              <style>{`
                @keyframes nexusCursorPulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.15; }
                }
                @keyframes claudeWordStreamFade {
                  0% {
                    opacity: 0.85;
                    transform: translateY(1.5px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .claude-streaming-prose {
                  animation: claudeWordStreamFade 140ms ease-out forwards;
                }
                @keyframes claudeCursorPulse {
                  0%, 100% { opacity: 1; transform: scaleY(1); }
                  50% { opacity: 0.2; transform: scaleY(0.85); }
                }
              `}</style>

              {/* Formatted Output directly mapped by conversation turn segments */}
              {conversationTurns.length > 0 ? (
                conversationTurns.map((turn, tIdx) => {
                  const isFollowUpTurn = tIdx > 0;
                  const isStreamingThisTurn = aiStreaming && tIdx === conversationTurns.length - 1;

                  let queryTitle = "";
                  let attachmentBadge = "";
                  let turnBody = (turnVersionsMap[turn.id] && turnVersionsMap[turn.id].versions[turnVersionsMap[turn.id].activeIndex]) || turn.content || "";

                  // 1. Robust attachment extraction (handles filenames with parentheses like "(1).xlsx")
                  const attachMatch = turnBody.match(/\*\((Attached (?:Screenshot|Spreadsheet|Document):[\s\S]+?)\)\*/);
                  if (attachMatch) {
                    attachmentBadge = attachMatch[1];
                    turnBody = turnBody.replace(/\*\((Attached (?:Screenshot|Spreadsheet|Document):[\s\S]+?)\)\*\n*/g, '').trim();
                  }

                  if (isFollowUpTurn) {
                    const qMatch = turnBody.match(/^### Follow-up Query:\s*([^\n]+)/);
                    if (qMatch) {
                      queryTitle = qMatch[1].replace(/\*\([^\)]+\)\*/g, '').trim();
                    }
                    turnBody = turnBody.replace(/^### Follow-up Query:[^\n]*\n*/, '').trim();
                  } else {
                    queryTitle = searchTopic || activeTopic || (doc?.title ? doc.title.replace(/^SAP S\/4HANA:\s*/i, '').replace(/\s*Technical Investigation$/i, '') : "") || "Initial Inquiry";
                  }

                  // 2. Extract reasoning/thinking steps if present
                  let extractedThinking = "";
                  const thinkTagMatch = turnBody.match(/<think>([\s\S]*?)<\/think>/i);
                  if (thinkTagMatch) {
                    extractedThinking = thinkTagMatch[1].trim();
                    turnBody = turnBody.replace(/<think>[\s\S]*?<\/think>\n*/gi, '');
                  } else {
                    const reasoningMatch = turnBody.match(/\*Reasoning\.\.\.\*([\s\S]*?)(?:\n\n|$)/i);
                    if (reasoningMatch) {
                      extractedThinking = reasoningMatch[1].trim();
                      turnBody = turnBody.replace(/\*Reasoning\.\.\.\*[\s\S]*?(?:\n\n|$)/gi, '');
                    }
                  }

                  const cleanedBody = turnBody.replace(/\*Reasoning\.\.\.\*/g, '').trim();

                  return (
                    <div
                      key={turn.id}
                      id={turn.id}
                      style={{
                        scrollMarginTop: "40px",
                        marginBottom: tIdx === conversationTurns.length - 1 ? 0 : 36,
                        position: "relative"
                      }}
                    >
                      {/* User Message (Claude Right-Aligned Pill Bubble) */}
                      {queryTitle && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24, marginTop: tIdx === 0 ? 8 : 20 }}>
                          <div
                            className="claude-user-bubble"
                            style={{
                              background: "#ECEBE4",
                              borderRadius: "20px 20px 4px 20px",
                              padding: "12px 20px",
                              maxWidth: "76%",
                              fontSize: "var(--claude-user-bubble-size, 15.5px)",
                              color: "#1F1F1E",
                              lineHeight: 1.55,
                              fontFamily: "var(--font-sans)",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                            }}
                          >
                            {attachmentBadge && (
                              <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#73736C", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                <span>📎</span> {attachmentBadge}
                              </div>
                            )}
                            <div style={{ fontWeight: 450, whiteSpace: "pre-wrap" }}>
                              {queryTitle}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Turn Response Content */}
                      <div style={{ position: "relative" }}>
                        {/* Concept 3: Neural Synapse Ripple Thinking Accordion - Always at the top of the turn */}
                        {(isStreamingThisTurn || cleanedBody || extractedThinking) && (
                          <div style={{ marginBottom: 12 }}>
                            <ExpandableThinking
                              isStreaming={isStreamingThisTurn}
                              thinkingText={extractedThinking}
                              elapsedSeconds={turnMetricsMap[turn.id]?.elapsedSec || (isStreamingThisTurn ? streamMetrics.elapsedSec : undefined)}
                              modelName="Claude 3.7 Sonnet"
                              userPrompt={turn.userText || queryTitle || searchTopic}
                            />
                          </div>
                        )}

                        {cleanedBody ? (
                          <div className={isStreamingThisTurn ? "claude-streaming-prose" : ""}>
                            <FormattedText text={cleanedBody} onNavigate={onNavigate} />
                            {isStreamingThisTurn && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 7,
                                  height: 17,
                                  background: "var(--orange, #D97706)",
                                  marginLeft: 4,
                                  borderRadius: 1.5,
                                  verticalAlign: "middle",
                                  animation: "claudeCursorPulse 0.8s infinite ease-in-out"
                                }}
                              />
                            )}
                          </div>
                        ) : isStreamingThisTurn ? null : (
                          <div style={{ fontSize: 13, color: "var(--text-muted, #8E8E87)", fontStyle: "italic", padding: "8px 0" }}>
                            No response generated. Please retry your query.
                          </div>
                        )}

                          {/* Clean Claude Turn Footer: Telemetry + Version Navigator (< 1/2 >) + Quick Copy + Retry + ⋯ More Actions */}
                          {!isStreamingThisTurn && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 6, position: "relative" }}>
                              {/* Left: Subtle Minimalist Inference Telemetry + Version Navigator */}
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {turnMetricsMap[turn.id] && (
                                  <div
                                    title="Inference telemetry: Speed, duration, and tokens"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      fontFamily: "var(--font-mono, monospace)",
                                      color: "var(--text-muted, #78716C)",
                                      opacity: 0.85
                                    }}
                                  >
                                    <span style={{ color: "#10B981" }}>⚡</span>
                                    <span>{turnMetricsMap[turn.id].speedTokPerSec} tok/s</span>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    <span>{turnMetricsMap[turn.id].elapsedSec}s elapsed</span>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    <span>{turnMetricsMap[turn.id].tokenCount} tokens</span>
                                  </div>
                                )}

                                {/* Claude Response Version Navigator (< 1 / 2 >) */}
                                {turnVersionsMap[turn.id] && turnVersionsMap[turn.id].versions.length > 1 && (
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      background: "var(--bg-surface, rgba(0,0,0,0.04))",
                                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                                      borderRadius: 6,
                                      padding: "1px 6px",
                                      fontSize: 11,
                                      color: "var(--text-muted, #78716C)",
                                      fontFamily: "var(--font-sans, sans-serif)"
                                    }}
                                  >
                                    <button
                                      type="button"
                                      disabled={turnVersionsMap[turn.id].activeIndex === 0}
                                      onClick={() => handleSwitchTurnVersion(turn.id, turnVersionsMap[turn.id].activeIndex - 1)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: turnVersionsMap[turn.id].activeIndex === 0 ? "default" : "pointer",
                                        opacity: turnVersionsMap[turn.id].activeIndex === 0 ? 0.25 : 0.85,
                                        fontSize: 13,
                                        padding: "0 2px",
                                        lineHeight: 1
                                      }}
                                      title="Previous version"
                                    >
                                      ‹
                                    </button>
                                    <span style={{ fontWeight: 600 }}>
                                      {turnVersionsMap[turn.id].activeIndex + 1} / {turnVersionsMap[turn.id].versions.length}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={turnVersionsMap[turn.id].activeIndex === turnVersionsMap[turn.id].versions.length - 1}
                                      onClick={() => handleSwitchTurnVersion(turn.id, turnVersionsMap[turn.id].activeIndex + 1)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: turnVersionsMap[turn.id].activeIndex === turnVersionsMap[turn.id].versions.length - 1 ? "default" : "pointer",
                                        opacity: turnVersionsMap[turn.id].activeIndex === turnVersionsMap[turn.id].versions.length - 1 ? 0.25 : 0.85,
                                        fontSize: 13,
                                        padding: "0 2px",
                                        lineHeight: 1
                                      }}
                                      title="Next version"
                                    >
                                      ›
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Right: Quick Copy + Retry + ⋯ Three-Dots Popover Menu */}
                              <div data-turn-menu="true" style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                                {/* Dedicated Claude Retry Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRetryTurn(turn)}
                                  title="Regenerate this response (creates a new version)"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    background: "transparent",
                                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                                    color: "var(--text-muted, #78716C)",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontFamily: "var(--font-sans)",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.04))"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                  <span>🔄</span>
                                  <span>Retry</span>
                                </button>

                                {/* Quick Copy Icon Button */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyRichText(cleanedBody, turn.id)}
                                  title={copiedTurnId === turn.id ? "Copied!" : "Copy response"}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    background: copiedTurnId === turn.id ? "rgba(16, 185, 129, 0.1)" : "transparent",
                                    border: `1px solid ${copiedTurnId === turn.id ? "#10B981" : "var(--border-subtle, rgba(0,0,0,0.12))"}`,
                                    color: copiedTurnId === turn.id ? "#059669" : "var(--text-muted, #78716C)",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontFamily: "var(--font-sans)",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.04))"; }}
                                  onMouseLeave={(e) => { if (copiedTurnId !== turn.id) e.currentTarget.style.background = "transparent"; }}
                                >
                                  <span>{copiedTurnId === turn.id ? "✓" : "📋"}</span>
                                  <span>{copiedTurnId === turn.id ? "Copied" : "Copy"}</span>
                                </button>

                                {/* Three Dots (⋯) More Actions Button */}
                                <div style={{ position: "relative" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTurnMenuId(prev => prev === turn.id ? null : turn.id);
                                    }}
                                    title="More options (Read aloud, Task info, Fork, Pin, Create doc)"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 28,
                                      height: 26,
                                      background: activeTurnMenuId === turn.id ? "var(--bg-surface, rgba(0,0,0,0.08))" : "transparent",
                                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                                      borderRadius: 6,
                                      color: "var(--text-primary, #1C1917)",
                                      fontSize: 13,
                                      fontWeight: 700,
                                      letterSpacing: "1px",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.06))"; }}
                                    onMouseLeave={(e) => { if (activeTurnMenuId !== turn.id) e.currentTarget.style.background = "transparent"; }}
                                  >
                                    ⋯
                                  </button>

                                  {/* The Floating Popover Menu */}
                                  {activeTurnMenuId === turn.id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        position: "absolute",
                                        bottom: "calc(100% + 6px)",
                                        right: 0,
                                        background: "var(--bg-card, #FFFFFF)",
                                        border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                                        borderRadius: 8,
                                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                        padding: "6px 0",
                                        minWidth: 210,
                                        zIndex: 1000,
                                        display: "flex",
                                        flexDirection: "column"
                                      }}
                                    >
                                      {/* Read Aloud / Stop Audio */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTurnMenuId(null);
                                          handlePlayTurnSpeech(cleanedBody, turn.id);
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 14px",
                                          background: "transparent",
                                          border: "none",
                                          fontSize: 12.5,
                                          fontFamily: "var(--font-sans)",
                                          color: "var(--text-primary, #1C1917)",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          transition: "background 0.12s ease",
                                          width: "100%"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <span style={{ fontSize: 14 }}>
                                          {playingAudioTurnId === turn.id ? "⏹" : synthesizingTurnId === turn.id ? "⏳" : "🔊"}
                                        </span>
                                        <span>
                                          {playingAudioTurnId === turn.id ? "Stop Audio" : synthesizingTurnId === turn.id ? "Synthesizing Speech..." : "Read Aloud"}
                                        </span>
                                      </button>

                                      {/* Task Info Telemetry */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTurnMenuId(null);
                                          handleOpenTaskInfo(turnTaskInfoMap[turn.id] || currentTaskInfo, turn.id);
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 14px",
                                          background: "transparent",
                                          border: "none",
                                          fontSize: 12.5,
                                          fontFamily: "var(--font-sans)",
                                          color: "var(--text-primary, #1C1917)",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          transition: "background 0.12s ease",
                                          width: "100%"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <span style={{ fontSize: 14 }}>📊</span>
                                        <span>Task Telemetry & Info</span>
                                      </button>

                                      {/* Fork Conversation */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTurnMenuId(null);
                                          handleForkConversation(cleanedBody);
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 14px",
                                          background: "transparent",
                                          border: "none",
                                          fontSize: 12.5,
                                          fontFamily: "var(--font-sans)",
                                          color: "var(--text-primary, #1C1917)",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          transition: "background 0.12s ease",
                                          width: "100%"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <span style={{ fontSize: 14 }}>🔀</span>
                                        <span>Fork Conversation</span>
                                      </button>

                                      {/* Pin Insight */}
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setActiveTurnMenuId(null);
                                          try {
                                            const title = queryTitle || (cleanedBody.slice(0, 48) + "...");
                                            await api.createBookmark({
                                              title,
                                              content: cleanedBody,
                                              module: selectedModule || "SAP",
                                              conversationId: convId,
                                              tags: [selectedModule || "SAP", "Insight"]
                                            });
                                            alert("⭐ Insight pinned! You can review all saved insights in the 'Pinned' menu in the sidebar.");
                                          } catch (err) {
                                            alert("Failed to pin insight: " + err.message);
                                          }
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 14px",
                                          background: "transparent",
                                          border: "none",
                                          fontSize: 12.5,
                                          fontFamily: "var(--font-sans)",
                                          color: "var(--text-primary, #1C1917)",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          transition: "background 0.12s ease",
                                          width: "100%"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <span style={{ fontSize: 14 }}>⭐</span>
                                        <span>Pin to Saved Insights</span>
                                      </button>

                                      {/* Create Nexus Doc */}
                                      <button
                                        type="button"
                                        disabled={creatingDocTurnId === turn.id}
                                        onClick={async () => {
                                          setActiveTurnMenuId(null);
                                          try {
                                            setCreatingDocTurnId(turn.id);
                                            const res = await api.createNexusDoc({
                                              rawContent: cleanedBody,
                                              sourceConversationId: convId,
                                              sourceTurnId: turn.id
                                            });
                                            if (res && res.doc) {
                                              setTurnNexusDocs(prev => ({ ...prev, [turn.id]: res.doc }));
                                              setActiveNexusDoc(res.doc);
                                              setNexusDocPanelOpen(true);
                                            }
                                          } catch (err) {
                                            alert("Failed to create Nexus Doc: " + err.message);
                                          } finally {
                                            setCreatingDocTurnId(null);
                                          }
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 14px",
                                          background: "transparent",
                                          border: "none",
                                          fontSize: 12.5,
                                          fontFamily: "var(--font-sans)",
                                          color: "var(--text-primary, #1C1917)",
                                          textAlign: "left",
                                          cursor: creatingDocTurnId === turn.id ? "wait" : "pointer",
                                          transition: "background 0.12s ease",
                                          width: "100%"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <span style={{ fontSize: 14 }}>📄</span>
                                        <span>{creatingDocTurnId === turn.id ? "Structuring doc..." : "Create Nexus Doc"}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* In-chat Nexus Doc Card matching Claude screenshot */}
                          {turnNexusDocs[turn.id] && (
                            <NexusDocCard
                              doc={turnNexusDocs[turn.id]}
                              onOpen={(d) => {
                                setActiveNexusDoc(d);
                                setNexusDocPanelOpen(true);
                              }}
                            />
                          )}

                          {/* In-chat Autonomous SAP Tool Agent Timeline Card */}
                          {(turn.sapAgentResult || turnSapAgentMap[turn.id]) && (
                            <SapActionTimelineCard
                              agentData={turn.sapAgentResult || turnSapAgentMap[turn.id]}
                              onActionExecuted={(execResult) => {
                                setTurnSapAgentMap(prev => {
                                  const curr = prev[turn.id] || turn.sapAgentResult;
                                  return { ...prev, [turn.id]: { ...curr, executionResult: execResult } };
                                });
                              }}
                            />
                          )}

                          {/* Verified Sources & Live Citations Panel under Diagnosis */}
                          {((turnCitationsMap[turn.id] && turnCitationsMap[turn.id].length > 0) || (tIdx === conversationTurns.length - 1 && aiCitations && aiCitations.length > 0)) && (
                            <GroundingSourcesPanel
                              sources={turnCitationsMap[turn.id] || (tIdx === conversationTurns.length - 1 ? aiCitations : [])}
                              searchEntryHtml={tIdx === conversationTurns.length - 1 ? searchEntryHtml : null}
                            />
                          )}

                          {/* Smart Follow-Up Suggestions */}
                          {!isStreamingThisTurn && tIdx === conversationTurns.length - 1 && followUpSuggestions && followUpSuggestions.length > 0 && (
                            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--border-subtle, rgba(0,0,0,0.1))" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted, #78716C)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                <span>💡</span>
                                <span>Recommended Next Steps & Follow-Ups</span>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {followUpSuggestions.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => {
                                      setFollowUpInput(sug);
                                      const ta = document.querySelector('textarea[placeholder*="Ask"]');
                                      if (ta) ta.focus();
                                    }}
                                    style={{
                                      padding: "6px 14px",
                                      background: "rgba(88, 166, 255, 0.08)",
                                      border: "1px solid rgba(88, 166, 255, 0.3)",
                                      borderRadius: 16,
                                      fontSize: 13.5,
                                      fontFamily: "var(--font-sans)",
                                      color: "var(--text-primary, #1C1917)",
                                      cursor: "pointer",
                                      textAlign: "left",
                                      transition: "all 0.15s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(88, 166, 255, 0.18)";
                                      e.currentTarget.style.borderColor = "#58a6ff";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "rgba(88, 166, 255, 0.08)";
                                      e.currentTarget.style.borderColor = "rgba(88, 166, 255, 0.3)";
                                    }}
                                  >
                                    → {sug}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                })
              ) : (
                <div style={{ position: "relative" }}>
                  {/* Single-turn Fallback User Bubble */}
                  {searchTopic && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24, marginTop: 8 }}>
                      <div
                        className="claude-user-bubble"
                        style={{
                          background: "#ECEBE4",
                          borderRadius: "20px 20px 4px 20px",
                          padding: "12px 20px",
                          maxWidth: "76%",
                          fontSize: "var(--claude-user-bubble-size, 15.5px)",
                          color: "#1F1F1E",
                          lineHeight: 1.55,
                          fontFamily: "var(--font-sans)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                        }}
                      >
                        <div style={{ fontWeight: 450, whiteSpace: "pre-wrap" }}>
                          {searchTopic}
                        </div>
                      </div>
                    </div>
                  )}
                  {(() => {
                    let singleBody = aiText || "";
                    let singleAttachBadge = "";
                    const singleAttachMatch = singleBody.match(/\*\((Attached (?:Screenshot|Spreadsheet|Document):[\s\S]+?)\)\*/);
                    if (singleAttachMatch) {
                      singleAttachBadge = singleAttachMatch[1];
                      singleBody = singleBody.replace(/\*\((Attached (?:Screenshot|Spreadsheet|Document):[\s\S]+?)\)\*\n*/g, '').trim();
                    }

                    let singleThinking = "";
                    const singleThinkTag = singleBody.match(/<think>([\s\S]*?)<\/think>/i);
                    if (singleThinkTag) {
                      singleThinking = singleThinkTag[1].trim();
                      singleBody = singleBody.replace(/<think>[\s\S]*?<\/think>\n*/gi, '');
                    } else {
                      const singleReasoning = singleBody.match(/\*Reasoning\.\.\.\*([\s\S]*?)(?:\n\n|$)/i);
                      if (singleReasoning) {
                        singleThinking = singleReasoning[1].trim();
                        singleBody = singleBody.replace(/\*Reasoning\.\.\.\*[\s\S]*?(?:\n\n|$)/gi, '');
                      }
                    }
                    const cleanedSingleAiText = singleBody.replace(/\*Reasoning\.\.\.\*/g, '').trim();

                    return (
                      <div style={{ position: "relative" }}>
                        {/* Concept 3: Neural Synapse Ripple Thinking Accordion - Always at the top */}
                        {(aiStreaming || cleanedSingleAiText || singleThinking) && (
                          <div style={{ marginBottom: 12 }}>
                            <ExpandableThinking
                              isStreaming={aiStreaming}
                              thinkingText={singleThinking}
                              elapsedSeconds={aiStreaming ? streamMetrics.elapsedSec : undefined}
                              modelName="Claude 3.7 Sonnet"
                              userPrompt={queryTitle || searchTopic || term}
                            />
                          </div>
                        )}

                        {cleanedSingleAiText ? (
                          <>
                            <FormattedText text={cleanedSingleAiText} onNavigate={onNavigate} />
                            {aiStreaming && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 8,
                                  height: 16,
                                  background: "var(--orange, #FF5500)",
                                  marginLeft: 4,
                                  verticalAlign: "middle",
                                  animation: "nexusCursorPulse 0.8s infinite ease-in-out"
                                }}
                              />
                            )}

                            {/* Clean Claude Turn Footer: Telemetry + Quick Copy + ⋯ More Actions */}
                            {!aiStreaming && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 6, position: "relative" }}>
                                {streamMetrics.tokenCount > 0 ? (
                                  <div
                                    title="Inference telemetry: Speed, duration, and tokens"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      fontFamily: "var(--font-mono, monospace)",
                                      color: "var(--text-muted, #78716C)",
                                      opacity: 0.85
                                    }}
                                  >
                                    <span style={{ color: "#10B981" }}>⚡</span>
                                    <span>{streamMetrics.speedTokPerSec} tok/s</span>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    <span>{streamMetrics.elapsedSec}s elapsed</span>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    <span>{streamMetrics.tokenCount} tokens</span>
                                  </div>
                                ) : <div />}

                                <div data-turn-menu="true" style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyRichText(cleanedSingleAiText, "main-ai")}
                                    title={copiedTurnId === "main-ai" ? "Copied!" : "Copy response"}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      background: copiedTurnId === "main-ai" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                                      border: `1px solid ${copiedTurnId === "main-ai" ? "#10B981" : "var(--border-subtle, rgba(0,0,0,0.12))"}`,
                                      color: copiedTurnId === "main-ai" ? "#059669" : "var(--text-muted, #78716C)",
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      fontSize: 11.5,
                                      fontFamily: "var(--font-sans)",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.04))"; }}
                                    onMouseLeave={(e) => { if (copiedTurnId !== "main-ai") e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <span>{copiedTurnId === "main-ai" ? "✓" : "📋"}</span>
                                    <span>{copiedTurnId === "main-ai" ? "Copied" : "Copy"}</span>
                                  </button>

                                  <div style={{ position: "relative" }}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTurnMenuId(prev => prev === "main-ai" ? null : "main-ai");
                                      }}
                                      title="More options (Read aloud, Fork, Pin, etc.)"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 28,
                                        height: 26,
                                        background: activeTurnMenuId === "main-ai" ? "var(--bg-surface, rgba(0,0,0,0.08))" : "transparent",
                                        border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                                        borderRadius: 6,
                                        color: "var(--text-primary, #1C1917)",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        letterSpacing: "1px",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease"
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.06))"; }}
                                      onMouseLeave={(e) => { if (activeTurnMenuId !== "main-ai") e.currentTarget.style.background = "transparent"; }}
                                    >
                                      ⋯
                                    </button>

                                    {activeTurnMenuId === "main-ai" && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          position: "absolute",
                                          bottom: "calc(100% + 6px)",
                                          right: 0,
                                          background: "var(--bg-card, #FFFFFF)",
                                          border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                                          borderRadius: 8,
                                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                          padding: "6px 0",
                                          minWidth: 200,
                                          zIndex: 1000,
                                          display: "flex",
                                          flexDirection: "column"
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveTurnMenuId(null);
                                            handlePlayTurnSpeech(cleanedSingleAiText, "main-ai");
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 14px",
                                            background: "transparent",
                                            border: "none",
                                            fontSize: 12.5,
                                            fontFamily: "var(--font-sans)",
                                            color: "var(--text-primary, #1C1917)",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            transition: "background 0.12s ease",
                                            width: "100%"
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                          <span style={{ fontSize: 14 }}>
                                            {playingAudioTurnId === "main-ai" ? "⏹" : synthesizingTurnId === "main-ai" ? "⏳" : "🔊"}
                                          </span>
                                          <span>{playingAudioTurnId === "main-ai" ? "Stop Audio" : "Read Aloud"}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveTurnMenuId(null);
                                            handleForkConversation(cleanedSingleAiText);
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 14px",
                                            background: "transparent",
                                            border: "none",
                                            fontSize: 12.5,
                                            fontFamily: "var(--font-sans)",
                                            color: "var(--text-primary, #1C1917)",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            transition: "background 0.12s ease",
                                            width: "100%"
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                          <span style={{ fontSize: 14 }}>🔀</span>
                                          <span>Fork Conversation</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {aiCitations && aiCitations.length > 0 && (
                              <GroundingSourcesPanel
                                sources={aiCitations}
                                searchEntryHtml={searchEntryHtml}
                              />
                            )}

                            {activeSapAgentResult && (
                              <SapActionTimelineCard
                                agentData={activeSapAgentResult}
                                onActionExecuted={(execResult) => {
                                  setActiveSapAgentResult(prev => ({ ...prev, executionResult: execResult }));
                                }}
                              />
                            )}
                          </>
                        ) : aiStreaming ? null : null}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Retry Query Button if last request encountered an issue */}
              {lastFailedQuery && !aiStreaming && (
                <div style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <span style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500 }}>
                      An issue occurred while streaming. You can retry your query:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const q = lastFailedQuery;
                      setLastFailedQuery(null);
                      handleGenerateInvestigation(q);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 14px",
                      background: "var(--burgundy, #6E1A2D)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                    }}
                  >
                    <span>🔄 Retry Query</span>
                  </button>
                </div>
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
                  <FormattedText text={doc.overview} onNavigate={onNavigate} />
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

        {/* Floating Jump to Latest Button fallback if no bottom follow-up bar */}
        {isScrolledUp && !(doc || aiText || aiStreaming) && (
          <button
            type="button"
            onClick={() => {
              userScrolledUpRef.current = false;
              setIsScrolledUp(false);
              if (lenisRef.current && mainScrollRef.current) {
                lenisRef.current.scrollTo(mainScrollRef.current.scrollHeight, { duration: 0.9 });
              } else if (mainScrollRef.current) {
                mainScrollRef.current.scrollTo({
                  top: mainScrollRef.current.scrollHeight,
                  behavior: "smooth"
                });
              }
            }}
            title="Jump to latest message"
            style={{
              position: "absolute",
              bottom: 24,
              right: 32,
              background: "var(--burgundy-rich, #6E1A2D)",
              color: "#FFFFFF",
              padding: "7px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              zIndex: 99,
              animation: "dropdownFadeSlide 0.2s ease",
              whiteSpace: "nowrap"
            }}
          >
            <span style={{ fontSize: 13, animation: "nexusCursorPulse 1s infinite" }}>↓</span>
            <span>{aiStreaming ? "Generating below · Jump to live stream" : "Jump to latest"}</span>
          </button>
        )}

        {/* Hidden Global File Input for Attachments */}
        <input
          type="file"
          ref={followUpFileRef}
          onChange={(e) => handleFileInput(e, setFollowUpImage, setFollowUpDoc)}
          accept="image/*,.xlsx,.xls,.csv,.pdf,.txt,.md,.json"
          style={{ display: "none" }}
        />

        {/* In-Canvas Bottom Follow-up Bar (Only visible during an active investigation) */}
        {(doc || aiText || aiStreaming) && (
          <div
            style={{
              padding: "12px 24px 18px",
              background: "var(--bg-card, #FFFFFF)",
              borderTop: "1px solid var(--border-subtle)",
              flexShrink: 0
            }}
          >
            <form
              onSubmit={handleBottomSubmit}
              style={{
                maxWidth: 840,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              {/* Floating Jump to Latest Button anchored to the right side above the command card */}
              {isScrolledUp && (
                <button
                  type="button"
                  onClick={() => {
                    userScrolledUpRef.current = false;
                    setIsScrolledUp(false);
                    if (lenisRef.current && mainScrollRef.current) {
                      lenisRef.current.scrollTo(mainScrollRef.current.scrollHeight, { duration: 0.9 });
                    } else if (mainScrollRef.current) {
                      mainScrollRef.current.scrollTo({
                        top: mainScrollRef.current.scrollHeight,
                        behavior: "smooth"
                      });
                    }
                  }}
                  title="Jump to latest message"
                  style={{
                    position: "absolute",
                    top: -36,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--bg-card, #FFFFFF)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.18))",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 99,
                    fontSize: 14,
                    transition: "all 0.15s ease"
                  }}
                >
                  ↓
                </button>
              )}
              {/* Claude Context & Project Knowledge Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  padding: "0 6px",
                  fontSize: 11,
                  fontFamily: "var(--font-sans, -apple-system, sans-serif)",
                  color: "var(--text-muted, #78716C)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#D97706", fontSize: 12 }}>⚡</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary, #1C1917)" }}>Claude 3.7 Sonnet</span>
                  <span style={{ opacity: 0.35 }}>·</span>
                  <span>{searchTopic || activeTopic ? "Enterprise Context Active" : "Ready"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "#059669" }}>● Verified SAP Grounding</span>
                </div>
              </div>

              {/* Enhanced Cohesive Command Card */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  background: "var(--bg-card, #FFFFFF)",
                  border: "1.5px solid var(--border-subtle, #E5E5DF)",
                  borderRadius: 16,
                  padding: "12px 14px 10px 16px",
                  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Modern Slash Command Palette Menu */}
                <SlashCommandMenu
                  isOpen={followUpInput.startsWith('/') && !followUpInput.includes(' ')}
                  search={followUpInput.startsWith('/') ? followUpInput.slice(1) : ''}
                  onSelectCommand={(cmd) => {
                    if (cmd.id === 'shift-handover' || cmd.command === '/handover') {
                      setFollowUpInput("");
                      setShiftHandoverModalOpen(true);
                      return;
                    }
                    const newText = cmd.prefix || (cmd.command + " ");
                    setFollowUpInput(newText);
                    if (followUpTextareaRef.current) {
                      followUpTextareaRef.current.focus();
                      setTimeout(() => autoResizeTextarea(followUpTextareaRef.current, 44, 200), 0);
                    }
                  }}
                  onClose={() => {}}
                />

                {/* Attached Screenshot preview pill */}
                {followUpImage && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(110, 26, 45,0.08)", border: "1px solid rgba(110, 26, 45,0.25)", borderRadius: 8, padding: "4px 10px", width: "fit-content", marginBottom: 8, flexWrap: "wrap" }}>
                    <img
                      src={followUpImage.dataUrl}
                      alt="Screenshot Preview"
                      onClick={() => window.dispatchEvent(new CustomEvent('nexus-open-lightbox', { detail: { src: followUpImage.dataUrl, alt: followUpImage.name, title: `Attached: ${followUpImage.name}` } }))}
                      title="Click to view full resolution in Lightbox"
                      style={{ width: 26, height: 26, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border-subtle)", cursor: "zoom-in" }}
                    />
                    <span
                      onClick={() => window.dispatchEvent(new CustomEvent('nexus-open-lightbox', { detail: { src: followUpImage.dataUrl, alt: followUpImage.name, title: `Attached: ${followUpImage.name}` } }))}
                      style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)", fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                      title="Click to expand"
                    >
                      📷 {followUpImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleAnalyzeAttachedScreen}
                      disabled={isAnalyzingScreen}
                      title="Analyze SAP GUI / RF Terminal screen with Gemini 3.5 Flash OCR"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "var(--orange, #6E1A2D)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {isAnalyzingScreen ? "🔍 Analyzing..." : "🔍 Deep Screen OCR"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFollowUpImage(null); setScreenAnalysisData(null); }}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 2px", fontSize: 13, fontWeight: "bold" }}
                      title="Remove attached screenshot"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Visual Screen OCR Diagnostic Badge */}
                {screenAnalysisData && (
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderLeft: "4px solid #6E1A2D",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 8,
                    fontSize: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#6E1A2D", fontFamily: "var(--font-mono)" }}>
                        🎯 Screen Diagnostic: {screenAnalysisData.tcode || 'SAP GUI'} {screenAnalysisData.messageClass ? `(${screenAnalysisData.messageClass} ${screenAnalysisData.messageNumber || ''})` : ''}
                      </span>
                      <button type="button" onClick={() => setScreenAnalysisData(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                    <div style={{ color: "#334155", marginBottom: 4 }}>{screenAnalysisData.summary || screenAnalysisData.errorMessage}</div>
                    {screenAnalysisData.immediateFixSteps && screenAnalysisData.immediateFixSteps.length > 0 && (
                      <div style={{ fontSize: 11.5, color: "#065F46", background: "#ECFDF5", padding: "4px 8px", borderRadius: 4 }}>
                        <strong>Quick Fix:</strong> {screenAnalysisData.immediateFixSteps[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Spreadsheet preview pill */}
                {followUpDoc && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: followUpDoc.type === 'excel' ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", border: `1px solid ${followUpDoc.type === 'excel' ? 'rgba(16,185,129,0.35)' : 'rgba(59,130,246,0.35)'}`, borderRadius: 8, padding: "4px 10px", width: "fit-content", marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{followUpDoc.type === 'excel' ? '📊' : '📄'}</span>
                    <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: followUpDoc.type === 'excel' ? "#059669" : "#2563EB", fontWeight: 600, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {followUpDoc.filename} {followUpDoc.sheetCount ? `(${followUpDoc.sheetCount} sheets, ${followUpDoc.totalRows} rows)` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFollowUpDoc(null)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 2px", fontSize: 13, fontWeight: "bold" }}
                      title="Remove attached document"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Enhanced Prompt Toast / Revert Pill */}
                {showEnhanceSuccess && rawPromptDraft !== null && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 10px",
                      background: "rgba(110, 26, 45, 0.08)",
                      border: "1px solid rgba(110, 26, 45, 0.25)",
                      borderRadius: 8,
                      fontSize: 11.5,
                      color: "var(--orange, #6E1A2D)",
                      fontWeight: 600,
                      width: "fit-content",
                      marginBottom: 8
                    }}
                  >
                    <span>✨ Prompt Enhanced by AI</span>
                    <button
                      type="button"
                      onClick={handleRevertEnhancedPrompt}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--orange, #6E1A2D)",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: 0
                      }}
                      title="Revert to your raw draft"
                    >
                      ↩ Revert
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEnhanceSuccess(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "0 2px",
                        fontSize: 12
                      }}
                      title="Dismiss banner"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Audio Recording Error Toast */}
                {audioError && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 12, color: "#DC2626", fontWeight: 600, marginBottom: 8 }}>
                    <span>⚠️ {audioError}</span>
                    <button type="button" onClick={() => setAudioError(null)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕</button>
                  </div>
                )}

                {/* Clean, expanding Textarea */}
                <textarea
                  ref={followUpTextareaRef}
                  rows={1}
                  value={followUpInput}
                  onChange={(e) => {
                    setFollowUpInput(e.target.value);
                    autoResizeTextarea(e.target, 44, 200);
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
                      if (followUpTextareaRef.current) autoResizeTextarea(followUpTextareaRef.current, 44, 200);
                    }, 0);
                  }}
                  placeholder="Ask a follow-up, analyze spreadsheet data, paste an SAP screenshot, or type '/' for commands..."
                  disabled={aiStreaming}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    maxHeight: 200,
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    fontSize: 15,
                    color: "var(--text-primary)",
                    outline: "none",
                    resize: "none",
                    lineHeight: "23px",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-sans)"
                  }}
                />

                {/* Integrated Action Toolbar inside the Command Card */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
                    gap: 8
                  }}
                >
                  {isRecordingAudio ? (
                    /* Active Voice Recording Control Bar in Bottom Card */
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 10,
                      padding: "5px 12px",
                      gap: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#EF4444",
                          display: "inline-block",
                          animation: "nexusVoicePulse 1.2s infinite ease-in-out"
                        }} />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#DC2626", fontFamily: "var(--font-mono)" }}>
                          Listening {formatVoiceDuration(recordingSeconds)}
                        </span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, height: 16 }}>
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar1 0.6s infinite ease-in-out" }} />
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar2 0.7s infinite ease-in-out" }} />
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar3 0.5s infinite ease-in-out" }} />
                          <span style={{ width: 3, background: "#EF4444", borderRadius: 2, animation: "nexusWaveBar4 0.65s infinite ease-in-out" }} />
                        </div>
                        <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                          Speak SAP codes (/SCWM/PRDO, SMQ2), issue details, or follow-ups...
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          onClick={cancelAudioRecording}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 8px"
                          }}
                          title="Cancel voice recording"
                        >
                          Cancel ✕
                        </button>
                        <button
                          type="button"
                          onClick={stopAudioRecordingAndTranscribe}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "var(--orange, #6E1A2D)",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 8,
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(110, 26, 45, 0.25)"
                          }}
                          title="Finish and transcribe with Gemini"
                        >
                          <span>✓ Done</span>
                        </button>
                      </div>
                    </div>
                  ) : isTranscribingAudio ? (
                    /* Active Voice Transcription Loader in Bottom Card */
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "6px 12px",
                      background: "rgba(110, 26, 45, 0.08)",
                      border: "1px solid rgba(110, 26, 45, 0.2)",
                      borderRadius: 8,
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--orange, #6E1A2D)"
                    }}>
                      <span style={{
                        width: 12,
                        height: 12,
                        border: "2px solid var(--orange, #6E1A2D)",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "nexusSpinner 0.8s linear infinite"
                      }} />
                      <span>Transcribing audio with Gemini Speech Intelligence...</span>
                    </div>
                  ) : (
                    /* Standard Left Action Buttons (Claude Clean Layout) */
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Attach File Button */}
                      <button
                        type="button"
                        onClick={() => followUpFileRef.current?.click()}
                        title="Attach Excel (.xlsx, .csv), document, or screenshot"
                        disabled={aiStreaming}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: (followUpImage || followUpDoc) ? "rgba(110, 26, 45, 0.1)" : "transparent",
                          border: `1px solid ${(followUpImage || followUpDoc) ? "var(--orange, #6E1A2D)" : "var(--border-subtle)"}`,
                          borderRadius: 8,
                          padding: "6px 10px",
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: (followUpImage || followUpDoc) ? "var(--orange, #6E1A2D)" : "var(--text-primary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = (followUpImage || followUpDoc) ? "rgba(110, 26, 45, 0.1)" : "transparent"; }}
                      >
                        <span style={{ fontSize: 14 }}>📎</span>
                        <span>Attach</span>
                      </button>

                      {/* Voice Dictation Button */}
                      <button
                        type="button"
                        onClick={startAudioRecording}
                        disabled={aiStreaming || isTranscribingAudio}
                        title="Dictate with Voice (Gemini Multimodal Transcription)"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "transparent",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: 13 }}>🎙️</span>
                        <span>Voice</span>
                      </button>

                      {/* Copilot Tools Dropdown Popover */}
                      <div id="nexus-bottom-tools-container" style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setToolsMenuOpen(prev => !prev)}
                          title="Specialized SAP Copilot Tools (AMS Matcher, Deep Research, Prompt Enhancer, Commands)"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: toolsMenuOpen ? "var(--bg-surface)" : "transparent",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: 8,
                            padding: "6px 10px",
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                          onMouseLeave={(e) => { if (!toolsMenuOpen) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ fontSize: 13 }}>⚡</span>
                          <span>Tools</span>
                          <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 1 }}>▼</span>
                        </button>

                        {toolsMenuOpen && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "calc(100% + 8px)",
                              left: 0,
                              background: "var(--bg-card, #FFFFFF)",
                              border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                              borderRadius: 10,
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
                              padding: "6px 0",
                              minWidth: 230,
                              zIndex: 1000,
                              display: "flex",
                              flexDirection: "column"
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const q = followUpInput.trim() || "PGI queue error in SMQ2";
                                handleRunSemanticSearch(q);
                                setToolsMenuOpen(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 14px",
                                background: "transparent",
                                border: "none",
                                fontSize: 12.5,
                                color: "var(--text-primary)",
                                textAlign: "left",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>🎯</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>Match AMS Archetype</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Search 2,292+ official patterns</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeepResearchTopic(followUpInput.trim() || "PGI queue stalling in SMQ2 with split HUs");
                                setDeepResearchModalOpen(true);
                                setToolsMenuOpen(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 14px",
                                background: "transparent",
                                border: "none",
                                fontSize: 12.5,
                                color: "var(--text-primary)",
                                textAlign: "left",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>🔬</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>Deep Research</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Autonomous root-cause analysis</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsWalkAndTalkActive(prev => !prev);
                                setToolsMenuOpen(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 14px",
                                background: "transparent",
                                border: "none",
                                fontSize: 12.5,
                                color: "var(--text-primary)",
                                textAlign: "left",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>{isWalkAndTalkActive ? "🟢" : "🎧"}</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>Walk & Talk Mode</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{isWalkAndTalkActive ? "Active (auto-speaks replies)" : "Hands-free floor assistant"}</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleEnhancePrompt();
                                setToolsMenuOpen(false);
                              }}
                              disabled={!followUpInput.trim() || isEnhancingPrompt}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 14px",
                                background: "transparent",
                                border: "none",
                                fontSize: 12.5,
                                color: !followUpInput.trim() ? "var(--text-muted)" : "var(--text-primary)",
                                textAlign: "left",
                                cursor: !followUpInput.trim() ? "not-allowed" : "pointer"
                              }}
                              onMouseEnter={(e) => { if (followUpInput.trim()) e.currentTarget.style.background = "var(--bg-surface)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>✨</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>Enhance Prompt</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Auto-expand with SAP context</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFollowUpInput("/");
                                if (followUpTextareaRef.current) {
                                  followUpTextareaRef.current.focus();
                                  setTimeout(() => autoResizeTextarea(followUpTextareaRef.current, 44, 200), 0);
                                }
                                setToolsMenuOpen(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 14px",
                                background: "transparent",
                                border: "none",
                                fontSize: 12.5,
                                color: "var(--text-primary)",
                                textAlign: "left",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--orange, #6E1A2D)" }}>/</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>Command Menu</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Slash shortcuts (/triage, /vsm)</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Active Tool Status Indicator */}
                      {isWalkAndTalkActive && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(16, 185, 129, 0.12)", color: "#065F46", fontSize: 11, fontWeight: 600 }}>
                          <span>🟢</span> Walk & Talk Active
                        </span>
                      )}
                    </div>
                  )}

                  {/* Right Actions: Character Counter & Send / Stop Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {followUpInput.length > 0 && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: followUpInput.length > 31000 ? "red" : "var(--text-muted)", fontWeight: 500 }}>
                        {followUpInput.length.toLocaleString()} / 32k
                      </span>
                    )}

                    {aiStreaming ? (
                      <button
                        type="button"
                        onClick={handleStopStreaming}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "6px 14px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          height: 34,
                          background: "#FEE2E2",
                          border: "1.5px solid #EF4444",
                          color: "#DC2626",
                          borderRadius: 18,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)"
                        }}
                        title="Stop generating response (Esc)"
                      >
                        <span style={{ width: 9, height: 9, background: "#DC2626", borderRadius: 2, display: "inline-block" }} />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!followUpInput.trim() && !followUpImage && !followUpDoc}
                        title={(!followUpInput.trim() && !followUpImage && !followUpDoc) ? "Type a prompt to send" : "Send message (Enter)"}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "none",
                          background: (followUpInput.trim() || followUpImage || followUpDoc) ? "var(--orange, #6E1A2D)" : "var(--bg-surface, #E5E7EB)",
                          color: (followUpInput.trim() || followUpImage || followUpDoc) ? "#FFFFFF" : "var(--text-muted, #9CA3AF)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: (!followUpInput.trim() && !followUpImage && !followUpDoc) ? "not-allowed" : "pointer",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: (followUpInput.trim() || followUpImage || followUpDoc) ? "0 4px 12px rgba(110, 26, 45, 0.25)" : "none",
                          transform: (followUpInput.trim() || followUpImage || followUpDoc) ? "scale(1)" : "scale(0.96)"
                        }}
                        onMouseEnter={(e) => {
                          if (followUpInput.trim() || followUpImage || followUpDoc) {
                            e.currentTarget.style.transform = "scale(1.08)";
                            e.currentTarget.style.background = "#821E35";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (followUpInput.trim() || followUpImage || followUpDoc) {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.background = "var(--orange, #6E1A2D)";
                          }
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "var(--text-muted, #78716C)", fontFamily: "var(--font-sans)" }}>
              Nexus is an enterprise SAP AI assistant and verifies against official SAP OSS notes.
            </div>
          </div>
        )}
        </div>

        

        {/* Right Column: Docked Nexus Docs Panel */}
        {nexusDocPanelOpen && isDocDocked && activeNexusDoc ? (
          <div
            onMouseDown={handleDividerMouseDown}
            style={{
              width: 6,
              cursor: "col-resize",
              background: isDraggingDivider ? "var(--orange, #8A2435)" : "var(--border-subtle, #E5E5DF)",
              transition: isDraggingDivider ? "none" : "background 0.15s ease",
              position: "relative",
              zIndex: 10,
              userSelect: "none",
              flexShrink: 0
            }}
            title="Drag to resize split view"
          />
        ) : null}

        {/* Right Column: Docked Nexus Docs Panel */}
        {nexusDocPanelOpen && isDocDocked && activeNexusDoc && (
          <div
            style={{
              width: `${splitRatio}%`,
              height: "100%",
              minWidth: 320,
              maxWidth: "75%",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-main)",
              overflow: "hidden"
            }}
          >
            <NexusDocPanel
              doc={activeNexusDoc}
              isOpen={true}
              isDocked={true}
              onToggleDock={() => setIsDocDocked(false)}
              onClose={() => setNexusDocPanelOpen(false)}
              onUpdateDoc={(updated) => {
                setActiveNexusDoc(updated);
                setTurnNexusDocs(prev => {
                  const next = { ...prev };
                  Object.keys(next).forEach(k => {
                    if (next[k]?.id === updated.id) next[k] = updated;
                  });
                  return next;
                });
              }}
              onDeleteDoc={(deletedId) => {
                setTurnNexusDocs(prev => {
                  const next = { ...prev };
                  Object.keys(next).forEach(k => {
                    if (next[k]?.id === deletedId) delete next[k];
                  });
                  return next;
                });
                if (activeNexusDoc?.id === deletedId) {
                  setActiveNexusDoc(null);
                  setNexusDocPanelOpen(false);
                }
              }}
              onNavigate={onNavigate}
            />
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

      <SessionDeckBuilderModal
        isOpen={sessionDeckModalOpen}
        onClose={() => setSessionDeckModalOpen(false)}
        rawSession={{ id: convId, title: doc?.title || searchTopic, citations: aiCitations }}
        aiText={aiText}
        doc={doc}
        conversationTurns={conversationTurns}
      />

      <PptxExportValidationModal
        isOpen={pptxValidationModalOpen}
        onClose={() => setPptxValidationModalOpen(false)}
        model={pptxParsedModel}
        onConfirmDownload={handleConfirmPptxDownload}
        isGenerating={isGeneratingPptx}
        downloadedFile={downloadedPptxFile}
      />

      <TaskInfoPopover
        isOpen={taskInfoModalOpen}
        onClose={() => setTaskInfoModalOpen(false)}
        taskInfo={currentTaskInfo}
        conversationId={convId}
        requestId={currentTaskInfo?.requestId}
      />

      {/* Semantic Incident Matcher Modal (3072-dim embeddings against 2,292 AMS issues) */}
      <SemanticIncidentMatcherModal
        isOpen={Boolean(semanticModalData)}
        data={semanticModalData}
        isLoading={isSearchingSemantic}
        onClose={() => setSemanticModalData(null)}
        onSelectFix={(m) => {
          const prompt = `[Verified AMS Incident Reference: #${m.id || 'AMS'} - ${m.title}]\nRoot Cause: ${m.rootCause}\nVerified Fix: ${m.resolution}\nRelevant T-Codes: ${m.tcode}\n\nPlease adapt this exact resolution for our warehouse scenario:`;
          setFollowUpInput(prompt);
          setSemanticModalData(null);
          if (followUpTextareaRef.current) {
            followUpTextareaRef.current.focus();
          }
        }}
      />

      {/* Deep Autonomous SAP Investigation & Forensic RCA Modal */}
      <DeepResearchModal
        isOpen={deepResearchModalOpen}
        onClose={() => setDeepResearchModalOpen(false)}
        topic={deepResearchTopic}
        onTopicChange={setDeepResearchTopic}
        isGenerating={isGeneratingDeepResearch}
        onLaunch={handleRunDeepResearch}
      />

      {/* Audio Shift Handover Processor Modal (Voice Memo to SOP) */}
      <ShiftHandoverModal
        isOpen={shiftHandoverModalOpen}
        onClose={() => setShiftHandoverModalOpen(false)}
        onOpenDoc={(doc) => {
          if (doc) {
            setActiveNexusDoc(doc);
            setNexusDocPanelOpen(true);
            setIsDocDocked(true);
          }
          setShiftHandoverModalOpen(false);
        }}
      />

      {/* Nexus Docs Slide-Over Panel (when un-docked or floating) */}
      {nexusDocPanelOpen && (!isDocDocked || !activeNexusDoc) && (
        <NexusDocPanel
          doc={activeNexusDoc}
          isOpen={nexusDocPanelOpen}
          isDocked={false}
          onToggleDock={() => setIsDocDocked(true)}
          onClose={() => setNexusDocPanelOpen(false)}
          onUpdateDoc={(updated) => {
            setActiveNexusDoc(updated);
            setTurnNexusDocs(prev => {
              const next = { ...prev };
              Object.keys(next).forEach(k => {
                if (next[k]?.id === updated.id) next[k] = updated;
              });
              return next;
            });
          }}
          onDeleteDoc={(deletedId) => {
            setTurnNexusDocs(prev => {
              const next = { ...prev };
              Object.keys(next).forEach(k => {
                if (next[k]?.id === deletedId) delete next[k];
              });
              return next;
            });
            if (activeNexusDoc?.id === deletedId) {
              setActiveNexusDoc(null);
              setNexusDocPanelOpen(false);
            }
          }}
          onNavigate={onNavigate}
        />
      )}
      </div>
    </div>
  );
}
