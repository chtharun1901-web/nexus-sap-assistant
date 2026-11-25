import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import ModernTableCard from "../components/ModernTableCard.jsx";
import { triggerToast } from "../components/ToastContainer.jsx";

const PRESET_SCENARIOS = [
  {
    label: "Inbound Receiving against PO",
    seed: "Inbound Receiving against a Purchase Order with partial & over-receipt handling",
    area: "Inbound"
  },
  {
    label: "Goods Quality Inspection Hold",
    seed: "Goods Quality Inspection fails batch check and routes pallet to Scrapping and Disposal",
    area: "Inbound"
  },
  {
    label: "Palletization & Label Printing",
    seed: "Palletization of mixed SKUs and generating Inbound Labels before Putaway Worklist",
    area: "Inbound"
  },
  {
    label: "Cycle-Count Variance Reconciliation",
    seed: "Cycle-count Schedules physical variance triggers Inventory Reconciliation adjustment",
    area: "Inventory"
  },
  {
    label: "Yard Truck Visit & Dock Gate-In",
    seed: "Yard Truck Visits check-in against Delivery Appointment in Asia/Calcutta timezone",
    area: "Yard & Transport"
  }
];

const ALL_DIMENSIONS = [
  { id: "Positive / Happy Path", short: "Positive", color: "#10B981", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.3)" },
  { id: "Negative & Validation", short: "Negative", color: "#EF4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.3)" },
  { id: "Boundary & Volume", short: "Boundary", color: "#D97706", bg: "rgba(217, 119, 6, 0.08)", border: "rgba(217, 119, 6, 0.3)" },
  { id: "State & Lifecycle", short: "State Flow", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.3)" },
  { id: "Cross-Module Ripple", short: "Cross-Module", color: "#2563EB", bg: "rgba(37, 99, 235, 0.08)", border: "rgba(37, 99, 235, 0.3)" },
  { id: "Concurrency & Timezone", short: "Concurrency", color: "#D4622B", bg: "rgba(212, 98, 43, 0.08)", border: "rgba(212, 98, 43, 0.3)" }
];

export default function ScenarioModelStudio({ onNavigate }) {
  const [seedScenario, setSeedScenario] = useState(PRESET_SCENARIOS[0].seed);
  const [moduleArea, setModuleArea] = useState("Auto-Detect");
  const [plant, setPlant] = useState("demo-plant (India-001)");
  const [warehouse, setWarehouse] = useState("Automotive - Bosch Bidadi");
  const [selectedDims, setSelectedDims] = useState(() => ALL_DIMENSIONS.map((d) => d.id));
  const [activeDimFilter, setActiveDimFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [modelResult, setModelResult] = useState(null);

  const toggleDimension = (dimId) => {
    setSelectedDims((prev) => {
      if (prev.includes(dimId)) {
        if (prev.length === 1) {
          triggerToast("Keep at least 1 testing dimension selected", "warning");
          return prev;
        }
        return prev.filter((d) => d !== dimId);
      }
      return [...prev, dimId];
    });
  };

  const handleGenerateModel = async (overrideSeed, overrideArea) => {
    const activeSeed = (overrideSeed ?? seedScenario).trim();
    if (!activeSeed) {
      triggerToast("Enter a seed scenario to expand into a test model", "warning");
      return;
    }
    setLoading(true);
    setActiveDimFilter("ALL");
    try {
      const res = await fetch("/api/wms/expand-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedScenario: activeSeed,
          moduleArea: overrideArea ?? moduleArea,
          plant,
          warehouse,
          dimensions: selectedDims
        })
      });
      const data = await res.json();
      if (data && data.ok && data.model) {
        setModelResult(data.model);
        triggerToast(`✓ Generated ${data.model.totalScenarios} scenarios across ${selectedDims.length} dimensions`, "success");
      } else {
        triggerToast(data?.error || "Failed to generate scenario model", "error");
      }
    } catch (err) {
      triggerToast("Network error generating scenario model: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredScenarios = useMemo(() => {
    if (!modelResult?.scenarios) return [];
    if (activeDimFilter === "ALL") return modelResult.scenarios;
    return modelResult.scenarios.filter((s) => s.dimension === activeDimFilter);
  }, [modelResult, activeDimFilter]);

  const tableHeaders = [
    "Test ID",
    "Dimension",
    "Priority",
    "Scenario Title",
    "Pre-Conditions",
    "Execution Steps",
    "Expected Result",
    "Impacted WMS Tiles"
  ];

  const tableRows = useMemo(() => {
    return filteredScenarios.map((s) => [
      `**${s.testId}**`,
      s.dimension,
      s.priority,
      s.title,
      s.preConditions,
      s.steps.replace(/\n/g, " "),
      s.expectedResult,
      s.impactedTiles
    ]);
  }, [filteredScenarios]);

  const handleExportExcel = () => {
    if (!modelResult?.scenarios?.length) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Executive Model Summary
      const summaryData = [
        ["LATTICE WMS 360° QA SCENARIO MODEL REPORT"],
        ["Generated At", new Date().toLocaleString()],
        ["Seed Scenario", modelResult.seedScenario],
        ["Module Area", modelResult.moduleArea],
        ["Primary Tile", modelResult.primaryTile],
        ["Plant Context", modelResult.plant],
        ["Warehouse Context", modelResult.warehouse],
        ["Total Scenarios Generated", modelResult.totalScenarios],
        [],
        ["Dimension Breakdown", "Scenario Count"],
        ...(modelResult.dimensionsSummary || []).map((d) => [d.dimension, d.count])
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 32 }, { wch: 58 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Model Summary");

      // Sheet 2: Full Scenario Matrix
      const matrixData = [
        tableHeaders,
        ...modelResult.scenarios.map((s) => [
          s.testId,
          s.dimension,
          s.priority,
          s.title,
          s.preConditions,
          s.steps,
          s.expectedResult,
          s.impactedTiles
        ])
      ];
      const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
      wsMatrix["!cols"] = [
        { wch: 16 },
        { wch: 22 },
        { wch: 10 },
        { wch: 36 },
        { wch: 34 },
        { wch: 44 },
        { wch: 40 },
        { wch: 28 }
      ];
      XLSX.utils.book_append_sheet(wb, wsMatrix, "Scenario Test Matrix");

      const fileSlug = (modelResult.primaryTile || "wms-scenario-model").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      XLSX.writeFile(wb, `lattice-qa-model-${fileSlug}.xlsx`);
      triggerToast(`✓ Downloaded Multi-Sheet Excel: lattice-qa-model-${fileSlug}.xlsx`, "success");
    } catch (err) {
      triggerToast("Excel export failed: " + err.message, "error");
    }
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--bg-surface, #FAF9F5)",
        padding: "28px 32px 64px",
        fontFamily: "var(--font-sans)"
      }}
    >
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Header Banner */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            background: "#FFFFFF",
            border: "1px solid #E5E5DF",
            borderRadius: 14,
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#D4622B",
                  background: "rgba(212, 98, 43, 0.1)",
                  padding: "3px 9px",
                  borderRadius: 999
                }}
              >
                WMS QA Exhibition Studio
              </span>
              <span style={{ fontSize: 11.5, color: "#78716C" }}>
                1 Seed Scenario → 360° Multi-Dimensional Test Model
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 26,
                fontWeight: 600,
                color: "#1C1917",
                margin: 0
              }}
            >
              WMS Scenario-to-Model Generator
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {modelResult && (
              <button
                type="button"
                onClick={handleExportExcel}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 8,
                  background: "#10B981",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
                }}
              >
                <span>📊 Export Excel (.xlsx)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("workspace")}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                background: "#FAF9F5",
                border: "1px solid #E5E5DF",
                color: "#44403C",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ← Back to Workspace
            </button>
          </div>
        </div>

        {/* Input & Configuration Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E5DF",
            borderRadius: 14,
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          {/* Presets */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#78716C", marginRight: 4 }}>
              Quick WMS Presets:
            </span>
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSeedScenario(preset.seed);
                  setModuleArea(preset.area);
                  handleGenerateModel(preset.seed, preset.area);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: seedScenario === preset.seed ? "rgba(212, 98, 43, 0.1)" : "#FAF9F5",
                  border: `1px solid ${seedScenario === preset.seed ? "rgba(212, 98, 43, 0.4)" : "#E5E5DF"}`,
                  color: seedScenario === preset.seed ? "#D4622B" : "#44403C",
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Seed Input + Generate */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "stretch" }}>
            <input
              type="text"
              value={seedScenario}
              onChange={(e) => setSeedScenario(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerateModel();
              }}
              placeholder="Enter 1 seed WMS scenario (e.g., Inbound Receiving against Purchase Order)..."
              style={{
                flex: "1 1 420px",
                padding: "11px 14px",
                borderRadius: 10,
                border: "1px solid #E5E5DF",
                background: "#FAF9F5",
                color: "#1C1917",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => handleGenerateModel()}
              style={{
                padding: "11px 22px",
                borderRadius: 10,
                background: "#D4622B",
                border: "none",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.75 : 1,
                boxShadow: "0 2px 10px rgba(212, 98, 43, 0.25)"
              }}
            >
              {loading ? "Building Model..." : "✨ Build 360° Scenario Model"}
            </button>
          </div>

          {/* Context & Dimensions Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#78716C", marginBottom: 4 }}>
                WMS Module Area
              </label>
              <select
                value={moduleArea}
                onChange={(e) => setModuleArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #E5E5DF",
                  background: "#FAF9F5",
                  color: "#1C1917",
                  fontSize: 12.5
                }}
              >
                <option value="Auto-Detect">Auto-Detect from Scenario</option>
                <option value="Inbound">Inbound (11 Tiles)</option>
                <option value="Inventory">Inventory (10 Tiles)</option>
                <option value="Yard & Transport">Yard & Transport (4 Tiles)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#78716C", marginBottom: 4 }}>
                Active Plant
              </label>
              <input
                type="text"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #E5E5DF",
                  background: "#FAF9F5",
                  color: "#1C1917",
                  fontSize: 12.5
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#78716C", marginBottom: 4 }}>
                Active Warehouse
              </label>
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #E5E5DF",
                  background: "#FAF9F5",
                  color: "#1C1917",
                  fontSize: 12.5
                }}
              />
            </div>
          </div>

          {/* 6 Dimensions Selector */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#78716C", marginRight: 4 }}>
              Expansion Dimensions:
            </span>
            {ALL_DIMENSIONS.map((dim) => {
              const checked = selectedDims.includes(dim.id);
              return (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => toggleDimension(dim.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 11px",
                    borderRadius: 8,
                    background: checked ? dim.bg : "#FAF9F5",
                    border: `1px solid ${checked ? dim.border : "#E5E5DF"}`,
                    color: checked ? dim.color : "#78716C",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <span>{checked ? "✓" : "+"}</span>
                  <span>{dim.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Scenario Branching Tree / Model Map */}
        {modelResult && (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E5DF",
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 19, fontWeight: 600, color: "#1C1917", margin: 0 }}>
                  Interactive 360° Scenario Model Tree
                </h2>
                <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
                  Click any dimension branch below to filter the test matrix ({modelResult.totalScenarios} total scenarios)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDimFilter("ALL")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: activeDimFilter === "ALL" ? "#1C1917" : "#FAF9F5",
                  border: "1px solid #E5E5DF",
                  color: activeDimFilter === "ALL" ? "#FFFFFF" : "#44403C",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Show All ({modelResult.totalScenarios})
              </button>
            </div>

            {/* Root Seed Node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  background: "rgba(212, 98, 43, 0.08)",
                  border: "1.5px solid #D4622B",
                  color: "#1C1917",
                  textAlign: "center",
                  maxWidth: 680
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#D4622B", letterSpacing: "0.05em" }}>
                  Seed Scenario · {modelResult.moduleArea} ({modelResult.primaryTile})
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>
                  {modelResult.seedScenario}
                </div>
              </div>

              {/* Branch Cards */}
              <div
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                  gap: 12
                }}
              >
                {(modelResult.dimensionsSummary || []).map((item) => {
                  const meta = ALL_DIMENSIONS.find((d) => d.id === item.dimension) || ALL_DIMENSIONS[0];
                  const isSelected = activeDimFilter === item.dimension;
                  return (
                    <button
                      key={item.dimension}
                      type="button"
                      onClick={() => setActiveDimFilter(isSelected ? "ALL" : item.dimension)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: isSelected ? meta.bg : "#FAF9F5",
                        border: `1.5px solid ${isSelected ? meta.color : "#E5E5DF"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: meta.color,
                            display: "inline-block"
                          }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                          {item.count} Cases
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1C1917" }}>
                        {item.dimension}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Exportable Test Matrix Table */}
        {modelResult && (
          <div>
            <ModernTableCard
              headers={tableHeaders}
              rows={tableRows}
            />
          </div>
        )}
      </div>
    </div>
  );
}
