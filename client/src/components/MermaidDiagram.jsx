import React, { useEffect, useRef, useState, useMemo } from "react";
import { parseMermaidToGraph, exportDrawingMlExcel } from "../utils/valueStreamMapping.js";

// Modern Claude-Style Rotating Radial Flower Spinner
export function ClaudeThinkingFlower({ text = "Laying out the dynamic process flow", elapsed = 0 }) {
  return (
    <div style={{ margin: "12px 0", display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
      {elapsed > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", userSelect: "none" }}>
          <span>Thought for {elapsed}s</span>
          <span style={{ fontSize: 10 }}>›</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="claude-thinking-flower" style={{ width: 20, height: 20, minWidth: 20, minHeight: 20, position: "relative" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 12 + 8.2 * Math.cos(rad);
              const cy = 12 + 8.2 * Math.sin(rad);
              const opacity = 0.2 + 0.8 * ((i + 1) / 12);
              return <circle key={deg} cx={cx.toFixed(2)} cy={cy.toFixed(2)} r="1.25" fill="#6366F1" opacity={opacity} />;
            })}
          </svg>
        </div>
        <span style={{ fontSize: 13, color: "#334155", fontWeight: 500, fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
          {text}
        </span>
      </div>
    </div>
  );
}

export default function MermaidDiagram({ chart, title }) {
  const [activeChart, setActiveChart] = useState(chart || "");
  const [showSource, setShowSource] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    setActiveChart(chart || "");
  }, [chart]);

  const graph = useMemo(() => {
    return parseMermaidToGraph(activeChart, title);
  }, [activeChart, title]);

  if (!graph || !graph.nodes || graph.nodes.length === 0) return null;

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportDrawingMlExcel(graph);
    } catch (e) {
      console.error("Excel Export Error:", e);
      alert("Export Error: " + e.message);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.45));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("pre") || e.target.closest(".floating-zoom-controls")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopySource = () => {
    navigator.clipboard.writeText(activeChart);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DrawingML_Process_Flow_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const S = 100;
  const viewBoxW = Math.round(graph.totalWidth * S);
  const viewBoxH = Math.round(graph.totalHeight * S);

  return (
    <div
      style={{
        margin: "24px 0",
        background: isFullscreen ? "#FFFFFF" : "#FAFAFA",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        overflow: "hidden",
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 999999 : "auto",
        display: "flex",
        flexDirection: "column",
        height: isFullscreen ? "100vh" : "auto",
        width: isFullscreen ? "100vw" : "100%",
        boxShadow: isFullscreen ? "none" : "0 4px 20px rgba(0, 0, 0, 0.04)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)"
      }}
    >
      {/* Card Header Bar */}
      <div
        style={{
          padding: "12px 20px 8px 20px",
          background: "#FAFAFA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.01em"
            }}
          >
            Process Flow Architecture Diagram
          </span>
          <span style={{ fontSize: 11, color: "#64748B" }}>⌵</span>
          <span
            style={{
              fontSize: 10.5,
              padding: "1px 7px",
              borderRadius: 4,
              background: "#DCFCE7",
              color: "#166534",
              fontWeight: 700
            }}
          >
            DrawingML Engine (Dynamic Flow)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              background: "#059669",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              opacity: isExporting ? 0.6 : 1
            }}
            title="Download real OOXML Excel file with native DrawingML shapes"
          >
            <span>📊</span>
            <span>{isExporting ? "Exporting..." : "Export to Excel (.xlsx)"}</span>
          </button>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowMenu((m) => !m)}
              style={{
                background: "#F1F5F9",
                border: "1px solid #CBD5E1",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                cursor: "pointer",
                color: "#334155"
              }}
              title="More Actions"
            >
              ⋯
            </button>

            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 30,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  zIndex: 100,
                  minWidth: 190,
                  padding: "4px 0",
                  fontSize: 12
                }}
              >
                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#059669",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span>📊</span> Export to Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span>⤓</span> Export Vector SVG
                </button>
                <button
                  type="button"
                  onClick={handleCopySource}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span>📋</span> {copied ? "✓ Copied Code" : "Copy Source Code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSource((s) => !s);
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span>{showSource ? "👁️" : "</>"}</span> {showSource ? "Hide Source" : "View Source"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreen((f) => !f);
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span>{isFullscreen ? "✕" : "⛶"}</span> {isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thought Header */}
      <div style={{ padding: "0 20px 10px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          onClick={() => setShowThought((t) => !t)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "#64748B",
            cursor: "pointer",
            userSelect: "none"
          }}
        >
          <span>Thought for 12s</span>
          <span style={{ fontSize: 10, transform: showThought ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}>›</span>
        </div>
        {showThought && (
          <div
            style={{
              fontSize: 12,
              color: "#475569",
              background: "#F1F5F9",
              padding: "8px 12px",
              borderRadius: 6,
              margin: "4px 0 8px 0",
              lineHeight: 1.5
            }}
          >
            Constructed native Dynamic DrawingML process architecture matching files(5).zip specs (Terminator, Process, Decision, Containers) with clean topology.
          </div>
        )}
      </div>

      {showSource && (
        <div
          style={{
            padding: "12px 20px",
            background: "#0F172A",
            color: "#F8FAFC",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 12,
            overflowX: "auto",
            borderBottom: "1px solid #1E293B"
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{activeChart}</pre>
        </div>
      )}

      {/* Main Diagram Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          minHeight: isFullscreen ? "calc(100vh - 120px)" : 340,
          maxHeight: isFullscreen ? "none" : 640,
          overflow: "auto",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          padding: "20px 14px",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none"
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.12s ease-out",
            width: "100%",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            width="100%"
            style={{ maxWidth: viewBoxW, minWidth: Math.min(viewBoxW, 900), display: "block", overflow: "visible", fontFamily: "Arial, sans-serif" }}
          >
            <defs>
              <marker id="arr-595959" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#595959" />
              </marker>
              <marker id="arr-BF9000" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#BF9000" />
              </marker>
              <marker id="arr-38761D" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38761D" />
              </marker>
              <marker id="arr-C00000" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#C00000" />
              </marker>
            </defs>

            {/* Title Header */}
            <text x={0.25 * S} y={0.24 * S} fontSize="14" fontWeight="bold" fill="#1A1A1A">
              {graph.headerTitle}
            </text>

            {/* Subgraph Containers */}
            {graph.containers && graph.containers.map((c) => (
              <g key={c.id}>
                <rect
                  x={c.x * S}
                  y={c.y * S}
                  width={c.w * S}
                  height={c.h * S}
                  rx="8"
                  ry="8"
                  fill="#F7F7F7"
                  stroke="#BFBFBF"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
                <text x={(c.x + 0.12) * S} y={(c.y + 0.22) * S} fontSize="11" fontWeight="bold" fill="#808080">
                  {c.title}
                </text>
              </g>
            ))}

            {/* Edges & Connectors */}
            {graph.edges && graph.edges.map((e, idx) => {
              const x1 = e.x1 * S;
              const y1 = e.y1 * S;
              const x2 = e.x2 * S;
              const y2 = e.y2 * S;
              const col = e.color ? `#${e.color}` : "#595959";
              const isDash = e.dash === "dash";

              let pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
              if (e.isWrap) {
                const midY = (y1 + y2) / 2;
                pathD = `M ${x1} ${y1} L ${x1 + 24} ${y1} L ${x1 + 24} ${midY} L ${x2 - 24} ${midY} L ${x2 - 24} ${y2} L ${x2} ${y2}`;
              } else if (e.isVertical) {
                const midY = (y1 + y2) / 2;
                pathD = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
              }

              return (
                <g key={idx}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={col}
                    strokeWidth={e.thick ? 2.2 : 1.5}
                    strokeDasharray={isDash ? "4 3" : "none"}
                    markerEnd={`url(#arr-${e.color || "595959"})`}
                  />
                  {e.label && (
                    <g transform={`translate(${e.lx * S}, ${e.ly * S})`}>
                      <rect x="-18" y="-9" width="36" height="18" rx="3" fill="#FFFFFF" fillOpacity="0.9" />
                      <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill={col}>
                        {e.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {graph.nodes && graph.nodes.map((n) => {
              const nx = n.x * S;
              const ny = n.y * S;
              const nw = n.w * S;
              const nh = n.h * S;
              const fill = `#${n.fill}`;
              const stroke = `#${n.stroke}`;
              const textColor = `#${n.text || "1A1A1A"}`;

              const lines = (n.label || "").split("\n");

              return (
                <g key={n.id} transform={`translate(${nx}, ${ny})`}>
                  {n.prst === "flowChartTerminator" ? (
                    <rect x="0" y="0" width={nw} height={nh} rx={nh / 2} ry={nh / 2} fill={fill} stroke={stroke} strokeWidth="1.6" />
                  ) : n.prst === "flowChartDecision" ? (
                    <polygon
                      points={`${nw / 2},0 ${nw},${nh / 2} ${nw / 2},${nh} 0,${nh / 2}`}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.6"
                    />
                  ) : (
                    <rect x="0" y="0" width={nw} height={nh} rx="4" ry="4" fill={fill} stroke={stroke} strokeWidth="1.4" />
                  )}

                  {lines.map((l, lIdx) => {
                    const startY = nh / 2 - (lines.length - 1) * 7 + lIdx * 14 + 4;
                    return (
                      <text
                        key={lIdx}
                        x={nw / 2}
                        y={startY}
                        textAnchor="middle"
                        fontSize={n.bold ? 11 : 10}
                        fontWeight={n.bold ? "bold" : "normal"}
                        fill={textColor}
                      >
                        {l.length > 28 ? l.substring(0, 26) + "..." : l}
                      </text>
                    );
                  })}
                </g>
              );
            })}

            {/* Shape Legend at bottom */}
            <g transform={`translate(${0.25 * S}, ${(graph.totalHeight - 0.45) * S})`}>
              <text x="0" y="-8" fontSize="11" fontWeight="bold" fill="#1A1A1A">
                Shape legend (native DrawingML autoshapes)
              </text>

              <g transform="translate(0, 4)">
                <rect x="0" y="0" width="30" height="22" rx="11" ry="11" fill="#C6E0B4" stroke="#548235" strokeWidth="1.4" />
                <text x="36" y="15" fontSize="10" fill="#595959">Terminator (Start / End)</text>
              </g>

              <g transform="translate(240, 4)">
                <rect x="0" y="0" width="30" height="22" rx="3" ry="3" fill="#FBE0CE" stroke="#C55A11" strokeWidth="1.4" />
                <text x="36" y="15" fontSize="10" fill="#595959">Process Step</text>
              </g>

              <g transform="translate(440, 4)">
                <polygon points="15,0 30,11 15,22 0,11" fill="#FFE599" stroke="#BF9000" strokeWidth="1.4" />
                <text x="36" y="15" fontSize="10" fill="#595959">Decision Gate</text>
              </g>

              <g transform="translate(640, 4)">
                <rect x="0" y="0" width="30" height="22" rx="11" ry="11" fill="#F4B7B3" stroke="#C00000" strokeWidth="1.4" />
                <text x="36" y="15" fontSize="10" fill="#595959">Blocked / Exception</text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Floating Zoom Bar */}
      <div
        className="floating-zoom-controls"
        style={{
          padding: "6px 14px",
          background: "#F8FAFC",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11.5,
          color: "#64748B"
        }}
      >
        <span>Pan: Drag canvas | Zoom: Buttons below</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={handleZoomOut}
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            -
          </button>
          <span style={{ minWidth: 40, textAlign: "center", fontWeight: 600 }}>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              marginLeft: 4
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
