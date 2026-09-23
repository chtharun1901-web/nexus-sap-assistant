import React, { useState } from "react";

export default function DiagramToolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFullscreen,
  onToggleFullscreen,
  onDownloadSVG,
  onDownloadPNG,
  onCopyJSON,
  onToggleSource,
  showSource,
  ppCollapsed,
  ewmCollapsed,
  onTogglePP,
  onToggleEWM
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyJSON && onCopyJSON();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap"
      }}
    >
      {/* Branch Collapse / Expand Filters */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={onTogglePP}
          style={{
            padding: "5px 10px",
            background: ppCollapsed ? "rgba(255,255,255,0.06)" : "rgba(5, 150, 105, 0.15)",
            border: `1px solid ${ppCollapsed ? "var(--border-subtle)" : "#059669"}`,
            borderRadius: 6,
            color: ppCollapsed ? "var(--text-muted)" : "#059669",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
          title={ppCollapsed ? "Expand SAP PP Branch" : "Collapse SAP PP Branch"}
        >
          <span>{ppCollapsed ? "＋" : "✓"}</span>
          <span>PP Branch</span>
        </button>

        <button
          type="button"
          onClick={onToggleEWM}
          style={{
            padding: "5px 10px",
            background: ewmCollapsed ? "rgba(255,255,255,0.06)" : "rgba(234, 88, 12, 0.15)",
            border: `1px solid ${ewmCollapsed ? "var(--border-subtle)" : "#EA580C"}`,
            borderRadius: 6,
            color: ewmCollapsed ? "var(--text-muted)" : "#EA580C",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
          title={ewmCollapsed ? "Expand SAP EWM Branch" : "Collapse SAP EWM Branch"}
        >
          <span>{ewmCollapsed ? "＋" : "✓"}</span>
          <span>EWM Branch</span>
        </button>
      </div>

      {/* Zoom Controls */}
      <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, overflow: "hidden" }}>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          style={{ padding: "5px 9px", background: "none", border: "none", color: "var(--text-primary)", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
        >
          −
        </button>
        <span style={{ padding: "5px 8px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", borderLeft: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)", display: "flex", alignItems: "center" }}>
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          style={{ padding: "5px 9px", background: "none", border: "none", color: "var(--text-primary)", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
        >
          +
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          title="Fit to Screen / Reset Zoom"
          style={{ padding: "5px 10px", background: "none", border: "none", borderLeft: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer" }}
        >
          ↺ Fit View
        </button>
      </div>

      {/* Export & Actions */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          onClick={onDownloadSVG}
          title="Download Scalable Vector SVG"
          style={{ padding: "5px 10px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: "var(--text-primary)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
        >
          SVG ⤓
        </button>
        <button
          type="button"
          onClick={onDownloadPNG}
          title="Download High-Resolution PNG"
          style={{ padding: "5px 10px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: "var(--text-primary)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
        >
          PNG ⤓
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Structured JSON"
          style={{ padding: "5px 10px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: copied ? "var(--orange)" : "var(--text-primary)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
        >
          {copied ? "✓ JSON Copied" : "Copy JSON"}
        </button>
        <button
          type="button"
          onClick={onToggleSource}
          title="Toggle JSON Source Code View"
          style={{ padding: "5px 10px", background: showSource ? "rgba(255,85,0,0.12)" : "var(--bg-card)", border: `1px solid ${showSource ? "var(--orange)" : "var(--border-subtle)"}`, borderRadius: 6, color: showSource ? "var(--orange)" : "var(--text-muted)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
        >
          {showSource ? "Hide Data" : "{ } JSON"}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Interactive View"}
          style={{ padding: "5px 10px", background: isFullscreen ? "var(--orange)" : "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: isFullscreen ? "#FFFFFF" : "var(--text-primary)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
        >
          {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"}
        </button>
      </div>
    </div>
  );
}
