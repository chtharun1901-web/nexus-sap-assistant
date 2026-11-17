import React, { useState, useRef, useEffect } from "react";
import ModernImageLoader from "./ModernImageLoader.jsx";

/**
 * WarehouseVisualRenderer
 * Feature #25: Imagen 3 Visual Warehouse Diagram & Precision Vector SVG Schematic
 * 
 * Renders either bitmap images or inline interactive vector SVG schematics with:
 * - Zoom in / out / reset / fit-width controls
 * - Mouse drag-to-pan canvas
 * - Export options: Vector SVG (.svg) and High-Res Raster PNG (.png)
 * - Complete architectural legend: Dock Doors, Staging Lanes, Fast-Pick Area, Quarantine Bin 0090
 * - Interactive zone filtering & telemetry HUD
 */
export default function WarehouseVisualRenderer({ data = {}, onNavigate }) {
  const visualType = data.type || (data.imageUrl ? "bitmap" : "svg");
  const imageUrl = data.imageUrl || "";
  const svgContent = data.svgContent || "";
  const prompt = data.prompt || "Warehouse Topology Schematic";
  const title = data.title || "Architectural Warehouse Layout";
  const metadata = data.metadata || {};
  const engine = metadata.engine || (visualType === "bitmap" ? "Google Imagen 3 (imagen-3.0-generate-002)" : "Gemini 3.5 Precision Vector Architecture");

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeLegendFilter, setActiveLegendFilter] = useState(null);
  const [showRawSvg, setShowRawSvg] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const svgWrapperRef = useRef(null);

  // Zoom handlers
  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.4));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest(".no-pan")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Export to SVG
  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Nexus_Warehouse_Schematic_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PNG (Rasterizes SVG or downloads bitmap directly)
  const handleDownloadPng = async () => {
    setExportingPng(true);
    try {
      if (visualType === "bitmap" && imageUrl) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `Nexus_Warehouse_Diagram_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      if (svgContent) {
        const canvas = document.createElement("canvas");
        canvas.width = 1000 * 2; // 2x retina clarity
        canvas.height = 600 * 2;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(svgUrl);

          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = `Nexus_Warehouse_Schematic_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setExportingPng(false);
        };

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          setExportingPng(false);
          // Fallback to svg download
          handleDownloadSvg();
        };

        img.src = svgUrl;
      }
    } catch (e) {
      console.error("PNG export error:", e);
      setExportingPng(false);
    }
  };

  // Copy SVG or image link
  const handleCopy = () => {
    if (visualType === "svg" && svgContent) {
      navigator.clipboard.writeText(svgContent);
    } else if (imageUrl) {
      navigator.clipboard.writeText(imageUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const legendItems = [
    { id: "docks", label: "Dock Doors (D01-D04)", color: "#10B981", bg: "rgba(16,185,129,0.15)", border: "#10B981", desc: "Hydraulic levelers, Inbound (D01-02), Outbound staging (D03-04)" },
    { id: "staging", label: "Staging Lanes (LANE 01-03)", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", border: "#F59E0B", desc: "Floor buffer & wave release staging with hazard perimeter" },
    { id: "fastpick", label: "Fast-Pick Golden Zone", color: "#3B82F6", bg: "rgba(59,130,246,0.15)", border: "#3B82F6", desc: "High-turnover SKU sequence (Aisle 01) for rapid replenishment" },
    { id: "quarantine", label: "Quarantine Bin 0090", color: "#EF4444", bg: "rgba(239,68,68,0.15)", border: "#EF4444", desc: "Restricted QA block zone, physical hold & defect inspection" },
    { id: "gipack", label: "GI-PACK & VAS Stations", color: "#F97316", bg: "rgba(249,115,22,0.15)", border: "#F97316", desc: "Packing tables OP1/OP2, scale verification & kitting lines" },
    { id: "arterial", label: "AGV / Forklift Arterial", color: "#EAB308", bg: "rgba(234,179,8,0.15)", border: "#EAB308", desc: "10 km/h directional guidance corridors & crossing nodes" }
  ];

  return (
    <div
      ref={containerRef}
      style={{
        margin: "20px 0",
        background: isFullscreen ? "#080C16" : "#0D1322",
        border: "1px solid #1E293B",
        borderRadius: isFullscreen ? 0 : 12,
        overflow: "hidden",
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 999999 : "auto",
        display: "flex",
        flexDirection: "column",
        height: isFullscreen ? "100vh" : "auto",
        width: isFullscreen ? "100vw" : "100%",
        boxShadow: isFullscreen ? "none" : "0 8px 32px rgba(0, 0, 0, 0.35)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        color: "#F8FAFC"
      }}
    >
      {/* ── TOP HEADER CONTROL BAR ────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 18px",
          background: "#0F172A",
          borderBottom: "1px solid #1E293B",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          userSelect: "none"
        }}
      >
        {/* Left Title & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎨</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.02em", color: "#F1F5F9" }}>
                {title}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: visualType === "bitmap" ? "rgba(217,119,6,0.2)" : "rgba(16,185,129,0.2)",
                  color: visualType === "bitmap" ? "#FBBF24" : "#34D399",
                  border: `1px solid ${visualType === "bitmap" ? "rgba(217,119,6,0.4)" : "rgba(16,185,129,0.4)"}`
                }}
              >
                {visualType === "bitmap" ? "Imagen 3 Bitmap" : "Vector SVG Schematic"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
              {prompt.length > 70 ? prompt.substring(0, 70) + "..." : prompt}
            </div>
          </div>
        </div>

        {/* Right Action Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {/* Zoom Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#1E293B",
              borderRadius: 6,
              padding: "2px 4px",
              border: "1px solid #334155"
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom out"
              style={{
                background: "transparent",
                border: "none",
                color: "#CBD5E1",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 4
              }}
            >
              −
            </button>
            <span
              onClick={handleResetZoom}
              title="Click to reset zoom"
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                color: "#94A3B8",
                padding: "0 6px",
                minWidth: 42,
                textAlign: "center",
                cursor: "pointer"
              }}
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom in"
              style={{
                background: "transparent",
                border: "none",
                color: "#CBD5E1",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 4
              }}
            >
              +
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom & Pan"
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "4px 6px",
                fontSize: 11,
                borderRadius: 4
              }}
            >
              ↺
            </button>
          </div>

          {/* Toggle Raw SVG Code */}
          {visualType === "svg" && (
            <button
              type="button"
              onClick={() => setShowRawSvg(!showRawSvg)}
              style={{
                background: showRawSvg ? "#334155" : "#1E293B",
                border: "1px solid #334155",
                color: showRawSvg ? "#38BDF8" : "#94A3B8",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <span>&lt;/&gt;</span>
              <span>{showRawSvg ? "Diagram" : "SVG Code"}</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(16,185,129,0.2)" : "#1E293B",
              border: `1px solid ${copied ? "#10B981" : "#334155"}`,
              color: copied ? "#34D399" : "#CBD5E1",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={exportingPng}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#CBD5E1",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            <span>🖼️</span>
            <span>{exportingPng ? "Exporting..." : "PNG"}</span>
          </button>

          {/* Export SVG (if SVG available) */}
          {visualType === "svg" && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                border: "none",
                color: "#FFFFFF",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 1px 3px rgba(16,185,129,0.3)"
              }}
            >
              <span>⬇</span>
              <span>SVG</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#CBD5E1",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
        </div>
      </div>

      {/* ── CANVAS VIEWPORT (INTERACTIVE ZOOM & PAN) ──────────────────── */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: "relative",
          flex: 1,
          minHeight: isFullscreen ? "calc(100vh - 160px)" : 480,
          maxHeight: isFullscreen ? "calc(100vh - 160px)" : 650,
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
          background: "radial-gradient(ellipse at center, #0F172A 0%, #080C16 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Helper Hint */}
        <div
          className="no-pan"
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            fontSize: 10.5,
            color: "#64748B",
            fontFamily: "var(--font-mono, monospace)",
            pointerEvents: "none",
            zIndex: 10,
            background: "rgba(15,23,42,0.75)",
            padding: "3px 8px",
            borderRadius: 4,
            border: "1px solid rgba(51,65,85,0.5)"
          }}
        >
          <span>🖱 Drag to Pan · Scroll or +/− to Zoom</span>
        </div>

        {/* Raw SVG Code Editor/Viewer View */}
        {showRawSvg ? (
          <div
            className="no-pan"
            style={{
              width: "100%",
              height: "100%",
              padding: 16,
              boxSizing: "border-box",
              overflow: "auto"
            }}
          >
            <pre
              style={{
                background: "#080C16",
                color: "#38BDF8",
                padding: 16,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                lineHeight: 1.5,
                margin: 0,
                border: "1px solid #1E293B",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all"
              }}
            >
              <code>{svgContent}</code>
            </pre>
          </div>
        ) : (
          /* Diagram View: Transformed Canvas */
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.08s ease-out",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              userSelect: "none"
            }}
          >
            {visualType === "bitmap" && imageUrl ? (
              <ModernImageLoader
                src={imageUrl}
                alt={title}
                title={`${title} • Imagen 3`}
                enableLightbox={true}
                maxHeight="88vh"
              />
            ) : svgContent ? (
              <div
                ref={svgWrapperRef}
                style={{
                  width: "92%",
                  height: "92%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div style={{ color: "#94A3B8", fontSize: 13 }}>
                Diagram content unavailable
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ARCHITECTURAL LEGEND & HUD BAR ───────────────────────────── */}
      <div
        style={{
          padding: "12px 18px",
          background: "#0B1120",
          borderTop: "1px solid #1E293B",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8" }}>
            ARCHITECTURAL LEGEND &amp; ZONING DIRECTORY
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-mono, monospace)" }}>
            Engine: {engine}
          </div>
        </div>

        {/* Legend Interactive Pills */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 8
          }}
        >
          {legendItems.map((item) => {
            const isSelected = activeLegendFilter === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveLegendFilter(isSelected ? null : item.id)}
                style={{
                  background: isSelected ? item.bg : "#0F172A",
                  border: `1px solid ${isSelected ? item.border : "#1E293B"}`,
                  borderRadius: 6,
                  padding: "7px 10px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: item.color,
                    marginTop: 3,
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 8px ${item.color}` : "none"
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: isSelected ? item.color : "#E2E8F0" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2, lineHeight: 1.35 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
