import React, { useState, useMemo } from "react";
import ExcelJS from "exceljs";
import { copyTableToClipboard, exportTableCSV } from "../utils/tableClipboardUtils.js";
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
  {
    id: "Positive / Happy Path",
    short: "Positive",
    dot: "#10B981",
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#6EE7B7",
    excelFill: "FFD1FAE5",
    excelFont: "FF065F46"
  },
  {
    id: "Negative & Validation",
    short: "Negative",
    dot: "#EF4444",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FCA5A5",
    excelFill: "FFFEE2E2",
    excelFont: "FF991B1B"
  },
  {
    id: "Boundary & Volume",
    short: "Boundary",
    dot: "#F59E0B",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FCD34D",
    excelFill: "FFFEF3C7",
    excelFont: "FF92400E"
  },
  {
    id: "State & Lifecycle",
    short: "State Flow",
    dot: "#8B5CF6",
    color: "#5B21B6",
    bg: "#EDE9FE",
    border: "#C4B5FD",
    excelFill: "FFEDE9FE",
    excelFont: "FF5B21B6"
  },
  {
    id: "Cross-Module Ripple",
    short: "Cross-Module",
    dot: "#2563EB",
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#93C5FD",
    excelFill: "FFDBEAFE",
    excelFont: "FF1E40AF"
  },
  {
    id: "Concurrency & Timezone",
    short: "Concurrency",
    dot: "#D4622B",
    color: "#9A3412",
    bg: "#FFEDD5",
    border: "#FDBA74",
    excelFill: "FFFFEDD5",
    excelFont: "FF9A3412"
  }
];

const PRIORITY_STYLES = {
  P0: { color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5", excelFill: "FFFEE2E2", excelFont: "FF991B1B" },
  P1: { color: "#92400E", bg: "#FEF3C7", border: "#FCD34D", excelFill: "FFFEF3C7", excelFont: "FF92400E" },
  P2: { color: "#334155", bg: "#F1F5F9", border: "#CBD5E1", excelFill: "FFF1F5F9", excelFont: "FF334155" }
};

export default function ScenarioModelStudio({ onNavigate }) {
  const [seedScenario, setSeedScenario] = useState(PRESET_SCENARIOS[0].seed);
  const [moduleArea, setModuleArea] = useState("Auto-Detect");
  const [plant, setPlant] = useState("demo-plant (India-001)");
  const [warehouse, setWarehouse] = useState("Automotive - Bosch Bidadi");
  const [selectedDims, setSelectedDims] = useState(() => ALL_DIMENSIONS.map((d) => d.id));
  const [activeDimFilter, setActiveDimFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [expandAll, setExpandAll] = useState(false);
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
    setExpandedRows({});
    setExpandAll(false);
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
        triggerToast(`✓ Generated ${data.model.totalScenarios} color-coded scenarios`, "success");
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
    let list = modelResult.scenarios;
    if (activeDimFilter !== "ALL") {
      list = list.filter((s) => s.dimension === activeDimFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.testId.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.dimension.toLowerCase().includes(q) ||
          s.impactedTiles.toLowerCase().includes(q)
      );
    }
    return list;
  }, [modelResult, activeDimFilter, searchQuery]);

  const toggleRow = (testId) => {
    setExpandedRows((prev) => ({ ...prev, [testId]: !prev[testId] }));
  };

  const handleToggleExpandAll = () => {
    const next = !expandAll;
    setExpandAll(next);
    const map = {};
    if (next) {
      filteredScenarios.forEach((s) => {
        map[s.testId] = true;
      });
    }
    setExpandedRows(map);
  };

  const exportHeaders = [
    "Test ID",
    "Dimension",
    "Priority",
    "Scenario Title",
    "Pre-Conditions",
    "Execution Steps",
    "Expected Result",
    "Impacted WMS Tiles"
  ];

  const getPlainRows = () =>
    filteredScenarios.map((s) => [
      s.testId,
      s.dimension,
      s.priority,
      s.title,
      s.preConditions,
      s.steps.replace(/\n/g, " "),
      s.expectedResult,
      s.impactedTiles
    ]);

  const handleCopyExcel = async () => {
    const ok = await copyTableToClipboard(exportHeaders, getPlainRows(), { asMarkdown: false });
    if (ok) triggerToast(`✓ Copied ${filteredScenarios.length} scenarios formatted for Excel`, "success");
  };

  const handleExportCSV = () => {
    exportTableCSV(exportHeaders, getPlainRows(), "lattice-wms-scenario-matrix.csv");
    triggerToast("✓ Exported CSV scenario matrix", "success");
  };

  const handleExportColorCodedExcel = async () => {
    if (!modelResult?.scenarios?.length) return;
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "Nexus WMS QA Studio";
      wb.created = new Date();

      // Sheet 1: Color-Coded Executive Summary
      const wsSum = wb.addWorksheet("Model Summary", { views: [{ showGridLines: true }] });
      wsSum.columns = [{ width: 32 }, { width: 58 }];

      const titleRow = wsSum.addRow(["LATTICE WMS 360° QA SCENARIO MODEL"]);
      titleRow.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
      titleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4622B" } };
      titleRow.height = 28;
      wsSum.mergeCells("A1:B1");
      titleRow.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      const metaRows = [
        ["Seed Scenario", modelResult.seedScenario],
        ["Module Area", modelResult.moduleArea],
        ["Primary WMS Tile", modelResult.primaryTile],
        ["Active Plant", modelResult.plant],
        ["Active Warehouse", modelResult.warehouse],
        ["Total Scenarios Generated", modelResult.totalScenarios],
        ["Generated At", new Date().toLocaleString()]
      ];
      metaRows.forEach(([k, v]) => {
        const r = wsSum.addRow([k, v]);
        r.getCell(1).font = { bold: true, color: { argb: "FF44403C" } };
        r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF9F5" } };
        r.getCell(2).alignment = { wrapText: true };
        r.eachCell((c) => {
          c.border = {
            top: { style: "thin", color: { argb: "FFE5E5DF" } },
            bottom: { style: "thin", color: { argb: "FFE5E5DF" } },
            left: { style: "thin", color: { argb: "FFE5E5DF" } },
            right: { style: "thin", color: { argb: "FFE5E5DF" } }
          };
        });
      });

      wsSum.addRow([]);
      const sumHdr = wsSum.addRow(["Testing Dimension", "Scenario Count"]);
      sumHdr.font = { bold: true, color: { argb: "FFFFFFFF" } };
      sumHdr.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } };
      });

      (modelResult.dimensionsSummary || []).forEach((d) => {
        const dimMeta = ALL_DIMENSIONS.find((x) => x.id === d.dimension) || ALL_DIMENSIONS[0];
        const r = wsSum.addRow([d.dimension, d.count]);
        r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: dimMeta.excelFill } };
        r.getCell(1).font = { bold: true, color: { argb: dimMeta.excelFont } };
        r.getCell(2).font = { bold: true };
        r.getCell(2).alignment = { horizontal: "center" };
      });

      // Sheet 2: Color-Coded Scenario Matrix
      const ws = wb.addWorksheet("Scenario Test Matrix", {
        views: [{ state: "frozen", ySplit: 1 }]
      });

      ws.columns = [
        { header: "Test ID", key: "testId", width: 17 },
        { header: "Dimension", key: "dimension", width: 23 },
        { header: "Priority", key: "priority", width: 10 },
        { header: "Scenario Title", key: "title", width: 38 },
        { header: "Pre-Conditions", key: "preConditions", width: 34 },
        { header: "Execution Steps", key: "steps", width: 44 },
        { header: "Expected Result", key: "expectedResult", width: 40 },
        { header: "Impacted WMS Tiles", key: "impactedTiles", width: 28 }
      ];

      const headerRow = ws.getRow(1);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          bottom: { style: "medium", color: { argb: "FFD4622B" } }
        };
      });

      ws.autoFilter = "A1:H1";

      modelResult.scenarios.forEach((s, idx) => {
        const row = ws.addRow({
          testId: s.testId,
          dimension: s.dimension,
          priority: s.priority,
          title: s.title,
          preConditions: s.preConditions,
          steps: s.steps,
          expectedResult: s.expectedResult,
          impactedTiles: s.impactedTiles
        });

        const dimMeta = ALL_DIMENSIONS.find((d) => d.id === s.dimension) || ALL_DIMENSIONS[0];
        const prioMeta = PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.P2;
        const zebraBg = idx % 2 === 0 ? "FFFFFFFF" : "FFFAF9F5";

        row.eachCell((cell) => {
          cell.font = { name: "Calibri", size: 10.5, color: { argb: "FF1C1917" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: zebraBg } };
          cell.alignment = { vertical: "top", wrapText: true };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E5DF" } },
            bottom: { style: "thin", color: { argb: "FFE5E5DF" } },
            left: { style: "thin", color: { argb: "FFE5E5DF" } },
            right: { style: "thin", color: { argb: "FFE5E5DF" } }
          };
        });

        // Color-code Test ID
        const idCell = row.getCell("testId");
        idCell.font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF1C1917" } };

        // Color-code Dimension cell
        const dimCell = row.getCell("dimension");
        dimCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: dimMeta.excelFill } };
        dimCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: dimMeta.excelFont } };
        dimCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

        // Color-code Priority cell
        const prioCell = row.getCell("priority");
        prioCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: prioMeta.excelFill } };
        prioCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: prioMeta.excelFont } };
        prioCell.alignment = { vertical: "middle", horizontal: "center" };

        // Bold Scenario Title
        row.getCell("title").font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF1C1917" } };
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileSlug = (modelResult.primaryTile || "wms-scenario-model").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.href = url;
      a.download = `lattice-qa-color-coded-${fileSlug}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      triggerToast(`✓ Downloaded Color-Coded Excel: lattice-qa-color-coded-${fileSlug}.xlsx`, "success");
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
        padding: "24px 28px 64px",
        fontFamily: "var(--font-sans)"
      }}
    >
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
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
            padding: "18px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
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
                1 Seed Scenario → Color-Coded 360° Test Model
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 25,
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
                onClick={handleExportColorCodedExcel}
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
                <span>📊 Export Color-Coded Excel (.xlsx)</span>
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
            padding: "18px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 14
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
                padding: "10px 14px",
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
                padding: "10px 22px",
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

          {/* Context Row */}
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
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: checked ? dim.bg : "#FAF9F5",
                    border: `1px solid ${checked ? dim.border : "#E5E5DF"}`,
                    color: checked ? dim.color : "#78716C",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: checked ? dim.dot : "#A8A29E" }} />
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
              padding: "18px 22px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 600, color: "#1C1917", margin: 0 }}>
                  Interactive 360° Scenario Model Tree
                </h2>
                <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
                  Click any colored branch below to filter ({modelResult.totalScenarios} total scenarios)
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

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "rgba(212, 98, 43, 0.08)",
                  border: "1.5px solid #D4622B",
                  color: "#1C1917",
                  textAlign: "center",
                  maxWidth: 680
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#D4622B", letterSpacing: "0.05em" }}>
                  Seed · {modelResult.moduleArea} ({modelResult.primaryTile})
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>
                  {modelResult.seedScenario}
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10
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
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: isSelected ? meta.bg : "#FAF9F5",
                        border: `1.5px solid ${isSelected ? meta.dot : "#E5E5DF"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.dot }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                          {item.count} Cases
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1917" }}>
                        {item.dimension}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Eye-Catching Color-Coded Scannable QA Matrix */}
        {modelResult && (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E5DF",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)"
            }}
          >
            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "12px 16px",
                background: "#FAF9F5",
                borderBottom: "1px solid #E5E5DF"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1917" }}>
                  🎨 Color-Coded Test Matrix
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#78716C",
                    background: "#FFFFFF",
                    border: "1px solid #E5E5DF",
                    padding: "2px 8px",
                    borderRadius: 999
                  }}
                >
                  {filteredScenarios.length} Scenarios · Click any row to view steps
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter ID, title, tile..."
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #E5E5DF",
                    background: "#FFFFFF",
                    fontSize: 12,
                    color: "#1C1917",
                    outline: "none",
                    width: 170
                  }}
                />
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #E5E5DF",
                    background: "#FFFFFF",
                    color: "#44403C",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {expandAll ? "▴ Collapse Steps" : "▾ Expand All Steps"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyExcel}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #E5E5DF",
                    background: "#FFFFFF",
                    color: "#1C1917",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  📋 Copy for Excel
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #E5E5DF",
                    background: "#FFFFFF",
                    color: "#1C1917",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ⬇ CSV
                </button>
              </div>
            </div>

            {/* Clean Scannable Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#1C1917", color: "#FFFFFF" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" }}>Test ID</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" }}>Dimension</th>
                    <th style={{ padding: "10px 10px", fontWeight: 600, fontSize: 11.5, textAlign: "center" }}>Priority</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11.5 }}>Scenario Summary</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, fontSize: 11.5 }}>Impacted WMS Tiles</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11.5, textAlign: "right" }}>Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScenarios.map((s, idx) => {
                    const dimMeta = ALL_DIMENSIONS.find((d) => d.id === s.dimension) || ALL_DIMENSIONS[0];
                    const prioMeta = PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.P2;
                    const isExpanded = !!expandedRows[s.testId];
                    const tiles = (s.impactedTiles || "").split(",").map((t) => t.trim()).filter(Boolean);

                    return (
                      <React.Fragment key={s.testId}>
                        <tr
                          onClick={() => toggleRow(s.testId)}
                          style={{
                            background: isExpanded ? "#FFFBF7" : idx % 2 === 0 ? "#FFFFFF" : "#FAF9F5",
                            borderBottom: isExpanded ? "none" : "1px solid #E5E5DF",
                            borderLeft: `4px solid ${dimMeta.dot}`,
                            cursor: "pointer",
                            transition: "background 0.12s ease"
                          }}
                        >
                          <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: "#1C1917",
                                background: "#F5F4EE",
                                border: "1px solid #E5E5DF",
                                padding: "3px 7px",
                                borderRadius: 6
                              }}
                            >
                              {s.testId}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 9px",
                                borderRadius: 999,
                                background: dimMeta.bg,
                                border: `1px solid ${dimMeta.border}`,
                                color: dimMeta.color,
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dimMeta.dot }} />
                              {dimMeta.short}
                            </span>
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: prioMeta.bg,
                                border: `1px solid ${prioMeta.border}`,
                                color: prioMeta.color,
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              {s.priority}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#1C1917", fontWeight: 600, maxWidth: 360 }}>
                            {s.title}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {tiles.map((tile) => (
                                <span
                                  key={tile}
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    color: "#44403C",
                                    background: "#F5F4EE",
                                    border: "1px solid #E5E5DF",
                                    padding: "2px 7px",
                                    borderRadius: 5
                                  }}
                                >
                                  {tile}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#D4622B"
                              }}
                            >
                              {isExpanded ? "Hide ▴" : "View ▾"}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr
                            style={{
                              background: "#FFFBF7",
                              borderBottom: "1px solid #E5E5DF",
                              borderLeft: `4px solid ${dimMeta.dot}`
                            }}
                          >
                            <td colSpan={6} style={{ padding: "4px 16px 14px 16px" }}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                  gap: 10
                                }}
                              >
                                <div
                                  style={{
                                    background: "#FFFFFF",
                                    border: "1px solid #E5E5DF",
                                    borderRadius: 8,
                                    padding: "10px 12px"
                                  }}
                                >
                                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#78716C", textTransform: "uppercase", marginBottom: 4 }}>
                                    Pre-Conditions
                                  </div>
                                  <div style={{ fontSize: 12, color: "#44403C", lineHeight: 1.5 }}>
                                    {s.preConditions}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    background: "#FFFFFF",
                                    border: "1px solid #E5E5DF",
                                    borderRadius: 8,
                                    padding: "10px 12px"
                                  }}
                                >
                                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#D4622B", textTransform: "uppercase", marginBottom: 4 }}>
                                    Execution Steps
                                  </div>
                                  <div style={{ fontSize: 12, color: "#1C1917", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                                    {s.steps}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    background: "#F0FDF4",
                                    border: "1px solid #BBF7D0",
                                    borderRadius: 8,
                                    padding: "10px 12px"
                                  }}
                                >
                                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>
                                    Expected Result
                                  </div>
                                  <div style={{ fontSize: 12, color: "#065F46", lineHeight: 1.5 }}>
                                    {s.expectedResult}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
