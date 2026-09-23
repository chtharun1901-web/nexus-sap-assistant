import React, { useState, useRef, useEffect } from "react";
import DiagramNode from "./DiagramNode.jsx";
import DiagramDetailsPanel from "./DiagramDetailsPanel.jsx";
import DiagramToolbar from "./DiagramToolbar.jsx";
import { DEFAULT_SAP_PP_ORG_STRUCTURE } from "./diagramData.js";

export default function OrganizationalDiagram({ data }) {
  const chartData = data && data.nodes && data.nodes.length ? data : DEFAULT_SAP_PP_ORG_STRUCTURE;
  const containerRef = useRef(null);
  const diagramContentRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSource, setShowSource] = useState(false);

  // Branch collapse states
  const [ppCollapsed, setPpCollapsed] = useState(false);
  const [ewmCollapsed, setEwmCollapsed] = useState(false);

  // Separate nodes into Enterprise, PP, and EWM groups
  const rootClient = chartData.nodes.find(n => n.type === "client" || n.id === "client") || chartData.nodes[0];
  const companyCode = chartData.nodes.find(n => n.type === "companyCode" || n.id === "company-code") || chartData.nodes[1];
  const plant = chartData.nodes.find(n => n.type === "plant" || n.id === "plant") || chartData.nodes[2];

  const ppNodes = chartData.nodes.filter(n => n.branch === "pp" || n.category === "pp" || (n.id !== "client" && n.id !== "company-code" && n.id !== "plant" && n.branch !== "ewm" && n.category !== "ewm"));
  const ewmNodes = chartData.nodes.filter(n => n.branch === "ewm" || n.category === "ewm");

  // Zoom handlers
  const handleZoomIn = () => setScale(s => Math.min(s + 0.15, 2.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.15, 0.45));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest(".diagram-card") || e.target.closest(".details-panel")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Copy JSON
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(chartData, null, 2));
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!diagramContentRef.current) return;
    const contentHtml = diagramContentRef.current.outerHTML;
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Geist,sans-serif;background:#FAF8F5;padding:24px;">
          ${contentHtml}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgHeader], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAP_PP_Organizational_Structure_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download PNG
  const handleDownloadPNG = () => {
    if (!diagramContentRef.current) return;
    const node = diagramContentRef.current;
    // Create an image snapshot via SVG foreignObject
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1100">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:system-ui,sans-serif;background:#FAF8F5;padding:30px;box-sizing:border-box;">
          ${node.outerHTML}
        </div>
      </foreignObject>
    </svg>`;
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2800;
      canvas.height = 2200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `SAP_PP_Organizational_Structure_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <div
      style={{
        margin: "18px 0",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        display: "flex",
        flexDirection: "column",
        height: isFullscreen ? "100vh" : "auto",
        width: isFullscreen ? "100vw" : "100%"
      }}
    >
      {/* Top Header & Toolbar */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏛️</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {chartData.title || "SAP PP Organizational Structure"}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--font-mono)",
                background: "rgba(0,140,149,0.12)",
                color: "#008C95",
                border: "1px solid rgba(0,140,149,0.3)",
                padding: "2px 7px",
                borderRadius: 4,
                fontWeight: 700
              }}
            >
              Interactive Tree View
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {chartData.subtitle || "Relationship between enterprise structure, production planning, and warehouse execution"}
          </div>
        </div>

        {/* Interactive Toolbar */}
        <DiagramToolbar
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(f => !f)}
          onDownloadSVG={handleDownloadSVG}
          onDownloadPNG={handleDownloadPNG}
          onCopyJSON={handleCopyJSON}
          onToggleSource={() => setShowSource(s => !s)}
          showSource={showSource}
          ppCollapsed={ppCollapsed}
          ewmCollapsed={ewmCollapsed}
          onTogglePP={() => setPpCollapsed(p => !p)}
          onToggleEWM={() => setEwmCollapsed(e => !e)}
        />
      </div>

      {/* Structured JSON Source Drawer */}
      {showSource && (
        <div style={{ padding: "14px 18px", background: "#141414", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#EDEDED", fontFamily: "var(--font-mono)", fontSize: 12, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: "#A1A1AA" }}>
            <span>Structured Organizational JSON Definition:</span>
            <button onClick={handleCopyJSON} style={{ background: "none", border: "none", color: "var(--orange)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
              Copy JSON
            </button>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {JSON.stringify(chartData, null, 2)}
          </pre>
        </div>
      )}

      {/* Canvas Area with Details Drawer */}
      <div style={{ position: "relative", display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Main Interactive Diagram Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            flex: 1,
            minHeight: isFullscreen ? "calc(100vh - 120px)" : 480,
            maxHeight: isFullscreen ? "none" : 640,
            overflow: "auto",
            background: isFullscreen ? "#0D0D0D" : "var(--bg-main)",
            padding: "36px 24px",
            cursor: isDragging ? "grabbing" : "grab",
            display: "flex",
            justifyContent: "center",
            userSelect: "none"
          }}
        >
          <div
            ref={diagramContentRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "top center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              width: "fit-content",
              minWidth: 900
            }}
          >
            {/* Top Enterprise Spine: Client -> Company Code -> Plant */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              {/* Level 0: Client */}
              {rootClient && (
                <div className="diagram-card">
                  <DiagramNode
                    node={rootClient}
                    isSelected={selectedNode?.id === rootClient.id}
                    onClick={setSelectedNode}
                    isFullscreen={isFullscreen}
                  />
                </div>
              )}

              {/* Vertical Connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 18, background: "#1E40AF" }} />
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#1E40AF", fontWeight: 700 }}>contains ▼</span>
              </div>

              {/* Level 1: Company Code */}
              {companyCode && (
                <div className="diagram-card">
                  <DiagramNode
                    node={companyCode}
                    isSelected={selectedNode?.id === companyCode.id}
                    onClick={setSelectedNode}
                    isFullscreen={isFullscreen}
                  />
                </div>
              )}

              {/* Vertical Connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 18, background: "#0F766E" }} />
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#0F766E", fontWeight: 700 }}>assigns ▼</span>
              </div>

              {/* Level 2: Plant */}
              {plant && (
                <div className="diagram-card">
                  <DiagramNode
                    node={plant}
                    isSelected={selectedNode?.id === plant.id}
                    onClick={setSelectedNode}
                    isFullscreen={isFullscreen}
                  />
                </div>
              )}
            </div>

            {/* Fork Connector from Plant to Two Specialized Branches */}
            <div style={{ width: "100%", maxWidth: 840, display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0" }}>
              <div style={{ width: 2, height: 14, background: "var(--border-strong)" }} />
              <div style={{ width: "70%", height: 2, background: "var(--border-strong)" }} />
              <div style={{ width: "70%", display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: 2, height: 14, background: "#059669" }} />
                <div style={{ width: 2, height: 14, background: "#EA580C" }} />
              </div>
            </div>

            {/* Split Branches Container: SAP PP (Left) & SAP EWM (Right) */}
            <div style={{ display: "flex", gap: 24, width: "100%", maxWidth: 1100, alignItems: "flex-start", justifyContent: "center" }}>
              {/* Branch 1: SAP PP Organizational Structure Container */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(5, 150, 105, 0.04)",
                  border: "2px solid rgba(5, 150, 105, 0.35)",
                  borderRadius: 14,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                {/* Branch Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(5, 150, 105, 0.2)", paddingBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>⚙️</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#065F46" }}>
                        SAP PP Organizational Structure
                      </h4>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Plant Production Planning & Shop Floor Execution
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPpCollapsed(p => !p)}
                    style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                  >
                    {ppCollapsed ? "Expand +" : "Collapse −"}
                  </button>
                </div>

                {/* PP Nodes Grid */}
                {!ppCollapsed && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                    {ppNodes.map(node => (
                      <div key={node.id} className="diagram-card">
                        <DiagramNode
                          node={node}
                          isSelected={selectedNode?.id === node.id}
                          onClick={setSelectedNode}
                          isFullscreen={isFullscreen}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch 2: SAP EWM Organizational Structure Container */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(234, 88, 12, 0.04)",
                  border: "2px solid rgba(234, 88, 12, 0.35)",
                  borderRadius: 14,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                {/* Branch Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(234, 88, 12, 0.2)", paddingBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>📦</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#9A3412" }}>
                        SAP EWM Organizational Structure
                      </h4>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Warehouse Number, Storage Types & Staging Integration
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEwmCollapsed(e => !e)}
                    style={{ background: "none", border: "none", color: "#EA580C", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                  >
                    {ewmCollapsed ? "Expand +" : "Collapse −"}
                  </button>
                </div>

                {/* EWM Nodes Grid */}
                {!ewmCollapsed && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                    {ewmNodes.map(node => (
                      <div key={node.id} className="diagram-card">
                        <DiagramNode
                          node={node}
                          isSelected={selectedNode?.id === node.id}
                          onClick={setSelectedNode}
                          isFullscreen={isFullscreen}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Staging Integration Dashed Bridge Banner */}
            <div
              style={{
                width: "100%",
                maxWidth: 900,
                background: "var(--bg-surface)",
                border: "2px dashed #9333EA",
                borderRadius: 10,
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <span style={{ fontWeight: 800, color: "#7E22CE", fontFamily: "var(--font-mono)" }}>
                  INTEGRATION CONNECTOR:
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  Production Supply Area (PSA) bridges ERP shop-floor consumption with EWM staging warehouse tasks.
                </span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                PK05 ↔ /SCWM/PSA
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Node Details Side Drawer */}
        {selectedNode && (
          <div className="details-panel">
            <DiagramDetailsPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      {/* Enterprise Legend Footer */}
      <div
        style={{
          padding: "10px 18px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          fontSize: 11.5
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, fontFamily: "var(--font-mono)" }}>
            Legend:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#17365D" }} />
            <span style={{ color: "var(--text-body)" }}>Client (Mandant)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1E40AF" }} />
            <span style={{ color: "var(--text-body)" }}>Company Code</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#0F766E" }} />
            <span style={{ color: "var(--text-body)" }}>Plant (Werk)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#059669" }} />
            <span style={{ color: "var(--text-body)" }}>PP Units</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#EA580C" }} />
            <span style={{ color: "var(--text-body)" }}>EWM Units</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#9333EA" }} />
            <span style={{ color: "var(--text-body)" }}>Integration Bridge</span>
          </div>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
          💡 Click any card to inspect SAP T-Codes & Customizing details · Drag canvas to pan
        </div>
      </div>
    </div>
  );
}
