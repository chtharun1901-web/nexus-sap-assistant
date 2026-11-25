/**
 * WmsScenarioExpander.js
 *
 * Non-SAP WMS (LATTICE WMS) 360-degree Scenario-to-Model Expansion Engine.
 * Expands 1 seed scenario into a multi-dimensional test model across:
 *   1. Positive / Happy Path
 *   2. Negative & Validation
 *   3. Boundary & Volume
 *   4. State & Lifecycle Transitions
 *   5. Cross-Module Ripple Effects
 *   6. Concurrency & Timezone (IST / Asia/Calcutta)
 */

const LATTICE_MODULES = {
  "Yard & Transport": [
    "Yard Truck Visits",
    "Transportation Management",
    "Transport",
    "Yard check-in settings"
  ],
  "Inbound": [
    "Inbound",
    "Delivery Appointments",
    "Purchase Orders",
    "Inbound Receiving",
    "Palletization",
    "Goods Quality Inspection",
    "Inbound Labels",
    "Putaway Worklist",
    "Inbound Reports",
    "Inbound Configuration",
    "Inspection and Label Configuration"
  ],
  "Inventory": [
    "Inventory Dashboard",
    "Replenishment",
    "Physical Inventory",
    "Cycle-count Schedules",
    "Inventory Reconciliation",
    "Customer Returns",
    "Inventory Disposition",
    "Scrapping and Disposal",
    "Replenishment Configuration"
  ]
};

function detectModuleArea(seedScenario, requestedArea) {
  if (requestedArea && requestedArea !== "Auto-Detect" && LATTICE_MODULES[requestedArea]) {
    return requestedArea;
  }
  const s = (seedScenario || "").toLowerCase();
  if (/(yard|truck|dock|transport|gate|check-in|appointment)/.test(s)) return "Yard & Transport";
  if (/(inventory|cycle|physical|reconciliation|replenish|scrap|disposal|return|disposition)/.test(s)) return "Inventory";
  return "Inbound";
}

function detectPrimaryTile(seedScenario, area) {
  const s = (seedScenario || "").toLowerCase();
  const allTiles = [
    ...LATTICE_MODULES["Yard & Transport"],
    ...LATTICE_MODULES["Inbound"],
    ...LATTICE_MODULES["Inventory"]
  ];
  for (const tile of allTiles) {
    if (s.includes(tile.toLowerCase())) return tile;
  }
  if (s.includes("receiv")) return "Inbound Receiving";
  if (s.includes("pallet")) return "Palletization";
  if (s.includes("inspect") || s.includes("quality") || s.includes("qa")) return "Goods Quality Inspection";
  if (s.includes("putaway")) return "Putaway Worklist";
  if (s.includes("label")) return "Inbound Labels";
  if (s.includes("po") || s.includes("purchase")) return "Purchase Orders";
  if (s.includes("cycle")) return "Cycle-count Schedules";
  if (s.includes("scrap")) return "Scrapping and Disposal";
  if (s.includes("reconcil")) return "Inventory Reconciliation";
  if (s.includes("truck") || s.includes("yard")) return "Yard Truck Visits";
  return LATTICE_MODULES[area]?.[0] || "Inbound Receiving";
}

function buildDeterministicScenarioModel({
  seedScenario,
  moduleArea = "Auto-Detect",
  plant = "demo-plant (India-001)",
  warehouse = "Automotive - Bosch Bidadi",
  dimensions = [
    "Positive / Happy Path",
    "Negative & Validation",
    "Boundary & Volume",
    "State & Lifecycle",
    "Cross-Module Ripple",
    "Concurrency & Timezone"
  ]
}) {
  const cleanSeed = (seedScenario || "Inbound Receiving against Purchase Order").trim();
  const area = detectModuleArea(cleanSeed, moduleArea);
  const primaryTile = detectPrimaryTile(cleanSeed, area);
  const prefix = area === "Yard & Transport" ? "YRD" : area === "Inventory" ? "INV" : "INB";

  const templates = {
    "Positive / Happy Path": [
      {
        priority: "P0",
        title: `Standard End-to-End Execution: ${cleanSeed}`,
        preConditions: `Active plant "${plant}", warehouse "${warehouse}"; valid master data & user role permissions.`,
        steps: `1. Navigate to ${primaryTile}.\n2. Enter valid transaction data for "${cleanSeed}".\n3. Submit and confirm execution.`,
        expected: `Transaction completes with HTTP 200; status updates cleanly and audit record is logged.`,
        impactedTiles: `${primaryTile}, Inventory Dashboard`
      },
      {
        priority: "P0",
        title: `Label & Audit Trail Verification for ${primaryTile}`,
        preConditions: `Print/Label configuration active in Inspection and Label Configuration.`,
        steps: `1. Execute "${cleanSeed}".\n2. Trigger label/document generation.\n3. Verify barcode & timestamp.`,
        expected: `Barcode label renders with Asia/Calcutta timestamp and matches transaction reference ID.`,
        impactedTiles: `${primaryTile}, Inbound Labels, Inbound Reports`
      },
      {
        priority: "P1",
        title: `Search, Filter & Pagination on ${primaryTile} Worklist`,
        preConditions: `At least 25 active records exist in ${warehouse}.`,
        steps: `1. Open ${primaryTile}.\n2. Filter by Plant "${plant}" and search by reference ID.\n3. Paginate to page 2.`,
        expected: `Filtered results match exact plant/warehouse context with zero duplicate rows.`,
        impactedTiles: `${primaryTile}`
      }
    ],
    "Negative & Validation": [
      {
        priority: "P0",
        title: `Reject Execution with Missing Mandatory Reference / Closed Order`,
        preConditions: `Target document is Closed/Cancelled or mandatory field is blank.`,
        steps: `1. Open ${primaryTile}.\n2. Attempt "${cleanSeed}" with missing/cancelled reference.\n3. Click Submit.`,
        expected: `System blocks submission with clear inline validation message; zero partial DB writes.`,
        impactedTiles: `${primaryTile}`
      },
      {
        priority: "P1",
        title: `Duplicate Scan / Double-Submission Guardrail`,
        preConditions: `Valid record already processed once for "${cleanSeed}".`,
        steps: `1. Rescan identical barcode/HU or click Submit twice rapidly.\n2. Inspect worklist & stock.`,
        expected: `Second submission is rejected as duplicate; stock is NOT double-counted.`,
        impactedTiles: `${primaryTile}, Inventory Reconciliation`
      },
      {
        priority: "P1",
        title: `Unauthorized Warehouse / Plant Role Access Check`,
        preConditions: `User only assigned to another plant, not "${plant}".`,
        steps: `1. Attempt to execute "${cleanSeed}" under "${warehouse}".\n2. Inspect API response.`,
        expected: `Access denied (403); user cannot view or mutate stock in "${warehouse}".`,
        impactedTiles: `${primaryTile}, Inventory Dashboard`
      }
    ],
    "Boundary & Volume": [
      {
        priority: "P0",
        title: `Partial Quantity Execution & Open Remainder Tracking`,
        preConditions: `Open order/task with quantity = 100 units.`,
        steps: `1. Execute "${cleanSeed}" for 40 units.\n2. Save and reload ${primaryTile}.`,
        expected: `40 units processed; remaining open quantity accurately shows 60 units.`,
        impactedTiles: `${primaryTile}, Purchase Orders, Inbound Reports`
      },
      {
        priority: "P0",
        title: `Over-Quantity / Max Bin Capacity Tolerance Boundary`,
        preConditions: `Tolerance configured in Inbound Configuration (e.g. +5% max).`,
        steps: `1. Attempt "${cleanSeed}" with 106 units (above tolerance) and negative/zero qty (0, -1).`,
        expected: `Negative/zero and above-tolerance quantities are blocked with threshold error.`,
        impactedTiles: `${primaryTile}, Inbound Configuration`
      },
      {
        priority: "P2",
        title: `Decimal Precision & Large Batch Bulk Processing (500+ Lines)`,
        preConditions: `Bulk payload with 500 line items and 3-decimal weights (e.g. 12.375 kg).`,
        steps: `1. Process bulk "${cleanSeed}" dataset.\n2. Verify rounding and UI responsiveness.`,
        expected: `All 500 items process within SLA (<3s); decimal quantities show zero rounding drift.`,
        impactedTiles: `${primaryTile}, Palletization, Inventory Dashboard`
      }
    ],
    "State & Lifecycle": [
      {
        priority: "P0",
        title: `Out-of-Order Step Block (Skip Prerequisite Stage)`,
        preConditions: `Prerequisite step (e.g., Yard Check-in or Goods Quality Inspection) is still Pending.`,
        steps: `1. Attempt to jump directly to downstream action for "${cleanSeed}".\n2. Observe status lock.`,
        expected: `System enforces lifecycle state machine and blocks premature transition.`,
        impactedTiles: `${primaryTile}, Goods Quality Inspection, Putaway Worklist`
      },
      {
        priority: "P1",
        title: `QA Hold → Blocked → Scrapping & Disposal Transition`,
        preConditions: `Item flagged as damaged during "${cleanSeed}".`,
        steps: `1. Route stock to Goods Quality Inspection Hold.\n2. Fail inspection → move to Scrapping and Disposal.`,
        expected: `Stock moves from QA Hold to Scrapped; excluded from Available/Replenishment stock.`,
        impactedTiles: `Goods Quality Inspection, Inventory Disposition, Scrapping and Disposal`
      },
      {
        priority: "P1",
        title: `Cancel / Reverse Completed Step Before Putaway`,
        preConditions: `"${cleanSeed}" completed, Putaway still Open.`,
        steps: `1. Trigger reversal/cancellation.\n2. Check Putaway Worklist and Inventory Dashboard.`,
        expected: `Linked Putaway task is auto-cancelled and inventory balance reverts cleanly.`,
        impactedTiles: `${primaryTile}, Putaway Worklist, Inventory Dashboard`
      }
    ],
    "Cross-Module Ripple": [
      {
        priority: "P0",
        title: `End-to-End Stock Sync: ${primaryTile} → Inventory Dashboard & Reconciliation`,
        preConditions: `Baseline stock recorded on Inventory Dashboard for SKU.`,
        steps: `1. Complete "${cleanSeed}".\n2. Open Inventory Dashboard and Inventory Reconciliation.`,
        expected: `On-hand/in-transit delta matches exact transaction quantity with 0 variance.`,
        impactedTiles: `${primaryTile}, Inventory Dashboard, Inventory Reconciliation`
      },
      {
        priority: "P1",
        title: `Downstream Trigger: Putaway Worklist & Replenishment Update`,
        preConditions: `Putaway rules & min/max bin levels active in Replenishment Configuration.`,
        steps: `1. Complete "${cleanSeed}".\n2. Open Putaway Worklist and Replenishment.`,
        expected: `Putaway task auto-generated with destination bin; replenishment need recalculated.`,
        impactedTiles: `${primaryTile}, Putaway Worklist, Replenishment`
      },
      {
        priority: "P1",
        title: `Yard & Delivery Appointment Status Synchronization`,
        preConditions: `Linked Delivery Appointment & Yard Truck Visit in "Checked-In" state.`,
        steps: `1. Finish "${cleanSeed}".\n2. Check Yard Truck Visits & Delivery Appointments.`,
        expected: `Appointment & Yard visit progress automatically to "Completed / Ready for Gate-Out".`,
        impactedTiles: `${primaryTile}, Yard Truck Visits, Delivery Appointments`
      }
    ],
    "Concurrency & Timezone": [
      {
        priority: "P1",
        title: `Two Operators Scanning Same Pallet / Worklist Item Simultaneously`,
        preConditions: `Operator A and Operator B logged into "${warehouse}".`,
        steps: `1. Both open same task for "${cleanSeed}".\n2. Operator A confirms first; Operator B submits 1s later.`,
        expected: `Optimistic lock prevents double execution; Operator B sees "Already processed by Operator A".`,
        impactedTiles: `${primaryTile}, Putaway Worklist`
      },
      {
        priority: "P1",
        title: `Midnight Cutoff & Timezone Consistency (Asia/Calcutta IST)`,
        preConditions: `System clock set to 23:58–00:02 IST ("Times shown in Asia/Calcutta").`,
        steps: `1. Execute "${cleanSeed}" across midnight.\n2. Inspect Inbound Reports & Cycle-count Schedules.`,
        expected: `Posting date & audit timestamps remain consistent in IST without UTC day-shift bugs.`,
        impactedTiles: `${primaryTile}, Inbound Reports, Cycle-count Schedules`
      },
      {
        priority: "P2",
        title: `Plant Switch Isolation (${plant} vs Secondary Plant)`,
        preConditions: `User switches "Active Plant" / "Active warehouse" dropdown in header.`,
        steps: `1. Start "${cleanSeed}" in "${plant}".\n2. Switch Active Warehouse in top header.`,
        expected: `Worklist refreshes strictly for new warehouse; zero cross-plant data leakage.`,
        impactedTiles: `${primaryTile}, Inventory Dashboard`
      }
    ]
  };

  const scenarios = [];
  let counter = 1;
  for (const dim of dimensions) {
    const items = templates[dim] || [];
    for (const item of items) {
      const code = dim.split(" ")[0].toUpperCase().slice(0, 3);
      scenarios.push({
        testId: `TC-${prefix}-${code}-${String(counter).padStart(3, "0")}`,
        dimension: dim,
        priority: item.priority,
        title: item.title,
        preConditions: item.preConditions,
        steps: item.steps,
        expectedResult: item.expected,
        impactedTiles: item.impactedTiles
      });
      counter++;
    }
  }

  return {
    seedScenario: cleanSeed,
    moduleArea: area,
    primaryTile,
    plant,
    warehouse,
    generatedBy: "deterministic-lattice-engine",
    totalScenarios: scenarios.length,
    dimensionsSummary: dimensions.map((d) => ({
      dimension: d,
      count: scenarios.filter((s) => s.dimension === d).length
    })),
    scenarios
  };
}

module.exports = {
  LATTICE_MODULES,
  buildDeterministicScenarioModel
};
