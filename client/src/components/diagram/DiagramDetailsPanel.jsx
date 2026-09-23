import React from "react";

export default function DiagramDetailsPanel({ node, onClose }) {
  if (!node) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 340,
        maxWidth: "90vw",
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-strong)",
        boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        position: "relative",
        zIndex: 20
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 18px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>
            SAP Organizational Unit
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            {node.label}
          </h3>
          {node.technicalName && (
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 3 }}>
              🇩🇪 {node.technicalName}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 4
          }}
          title="Close Details Panel"
        >
          ✕
        </button>
      </div>

      {/* Body Content */}
      <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 16, fontSize: 13, color: "var(--text-body)" }}>
        {/* Definition */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
            Operational Purpose & Role
          </div>
          <p style={{ lineHeight: 1.6, margin: 0, color: "var(--text-primary)" }}>
            {node.details || node.description}
          </p>
        </div>

        {/* T-Codes */}
        {node.tcode && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
              Primary Transactions / T-Codes
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {node.tcode.split("/").map((tc, idx) => (
                <span
                  key={idx}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    background: "rgba(255,85,0,0.12)",
                    border: "1px solid rgba(255,85,0,0.3)",
                    color: "var(--orange)",
                    padding: "3px 8px",
                    borderRadius: 4
                  }}
                >
                  {tc.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Example Value */}
        {node.example && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
              Standard Enterprise Example
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-primary)", background: "var(--bg-surface)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
              {node.example}
            </div>
          </div>
        )}

        {/* Configuration / SPRO Customizing Note */}
        {node.configNote && (
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
              ⚙️ Customizing & SPRO Governance
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: 0, color: "var(--text-body)" }}>
              {node.configNote}
            </p>
          </div>
        )}

        {/* Structural Position */}
        <div style={{ background: "rgba(0,140,149,0.08)", border: "1px solid rgba(0,140,149,0.25)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text-body)" }}>
          <strong style={{ color: "#008C95" }}>Hierarchy Level:</strong>{" "}
          {node.level === 0 ? "Global Enterprise (Root)" : node.level === 1 ? "Legal Entity Level" : node.level === 2 ? "Plant Manufacturing Level" : node.branch === "ewm" ? "EWM Logistics Branch" : "PP Production Branch"}
        </div>
      </div>
    </div>
  );
}
