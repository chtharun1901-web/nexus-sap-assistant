import React, { useState, useRef, useMemo } from "react";
import { extractDrawingFlowData, exportDrawingMlExcel } from "../utils/valueStreamMapping.js";

export default function ValueStreamMapModal({ isOpen, onClose, doc, aiText, sessionId, conversationTurns }) {
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const svgRef = useRef(null);

  const graph = useMemo(() => {
    if (!isOpen) return null;
    return extractDrawingFlowData(doc, aiText, conversationTurns, sessionId);
  }, [isOpen, doc, aiText, conversationTurns, sessionId]);

  if (!isOpen || !graph) return null;

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportDrawingMlExcel(graph);
    } catch (e) {
      console.error("Export Error:", e);
      alert("Error generating Excel file: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(graph.sessionId || "SAP").replace(/[^a-zA-Z0-9_-]/g, "_")}_Process_Flow.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 950;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${String(graph.sessionId || "SAP").replace(/[^a-zA-Z0-9_-]/g, "_")}_Process_Flow.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  const S = 100;
  const sessionBadge = String(graph.sessionId || "conv-active-session").substring(0, 24);
  const viewBoxW = Math.round(graph.totalWidth * S);
  const viewBoxH = Math.round(graph.totalHeight * S);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          width: "96vw",
          maxWidth: 1440,
          height: "92vh",
          maxHeight: 880,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#1E293B",
          fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)"
        }}
      >
        {/* Top Control Bar */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            background: "#F8FAFC"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 18,
                boxShadow: "0 4px 10px rgba(5, 150, 105, 0.25)"
              }}
            >
              📊
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
                  Dynamic Stream Mapping Studio
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "#DCFCE7",
                    color: "#166534",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono, monospace)"
                  }}
                >
                  {sessionBadge}
                </span>
              </div>
              <p style={{ fontSize: 12, margin: "2px 0 0 0", color: "#64748B" }}>
                Dynamic Process Flow Engine Grounded in files(5).zip DrawingML Specifications
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Zoom Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                overflow: "hidden"
              }}
            >
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "#475569",
                  fontWeight: "bold"
                }}
                title="Zoom Out"
              >
                -
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155",
                  minWidth: 42,
                  textAlign: "center"
                }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "#475569",
                  fontWeight: "bold"
                }}
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* SVG Export Button */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer"
              }}
              title="Download Vector SVG"
            >
              <span>🖼️</span> SVG
            </button>

            {/* PNG Export Button */}
            <button
              type="button"
              onClick={handleDownloadPng}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer"
              }}
              title="Download High-Res PNG"
            >
              <span>📷</span> PNG
            </button>

            {/* Primary Excel DrawingML Export Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                opacity: isExporting ? 0.6 : 1
              }}
              title="Generate and download genuine Excel .xlsx workbook containing native editable DrawingML shapes"
            >
              <span>📊</span>
              <span>{isExporting ? "Generating XML..." : "Download Excel (.xlsx)"}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: 8,
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 16
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dynamic Process Flow Visual Canvas */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
              width: "100%",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
              width="100%"
              style={{
                maxWidth: viewBoxW,
                minWidth: Math.min(viewBoxW, 960),
                display: "block",
                overflow: "visible",
                fontFamily: "Arial, sans-serif"
              }}
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

        {/* Footer */}
        <div
          style={{
            padding: "10px 24px",
            borderTop: "1px solid #E2E8F0",
            background: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#64748B"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔒</span>
            <span>Grounded in active session topology & ISO standard flowchart shapes</span>
          </div>
          <div>
            Excel (.xlsx) export writes valid OpenXML DrawingML autoshapes (<code style={{ color: "#059669" }}>&lt;xdr:wsDr&gt;</code>)
          </div>
        </div>
      </div>
    </div>
  );
}
