import React from "react";

const CATEGORY_STYLES = {
  client: {
    bg: "#17365D",
    border: "#0F243E",
    headerBg: "#0F243E",
    text: "#FFFFFF",
    subtext: "#BFDBFE",
    badgeBg: "rgba(255,255,255,0.18)",
    badgeText: "#FFFFFF",
    icon: "🏢",
    tcodeBg: "rgba(255,255,255,0.15)",
    tcodeText: "#E0F2FE"
  },
  companyCode: {
    bg: "#1E40AF",
    border: "#1E3A8A",
    headerBg: "#172554",
    text: "#FFFFFF",
    subtext: "#DBEAFE",
    badgeBg: "rgba(255,255,255,0.18)",
    badgeText: "#FFFFFF",
    icon: "🏛️",
    tcodeBg: "rgba(255,255,255,0.15)",
    tcodeText: "#E0F2FE"
  },
  plant: {
    bg: "#0F766E",
    border: "#115E59",
    headerBg: "#134E4A",
    text: "#FFFFFF",
    subtext: "#CCFBF1",
    badgeBg: "rgba(255,255,255,0.18)",
    badgeText: "#FFFFFF",
    icon: "🏭",
    tcodeBg: "rgba(255,255,255,0.15)",
    tcodeText: "#CCFBF1"
  },
  pp: {
    bg: "var(--bg-card)",
    border: "#059669",
    headerBg: "rgba(5, 150, 105, 0.12)",
    text: "var(--text-primary)",
    subtext: "var(--text-muted)",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    badgeText: "#047857",
    icon: "⚙️",
    tcodeBg: "rgba(5, 150, 105, 0.1)",
    tcodeText: "#065F46"
  },
  ewm: {
    bg: "var(--bg-card)",
    border: "#EA580C",
    headerBg: "rgba(234, 88, 12, 0.12)",
    text: "var(--text-primary)",
    subtext: "var(--text-muted)",
    badgeBg: "rgba(249, 115, 22, 0.15)",
    badgeText: "#C2410C",
    icon: "📦",
    tcodeBg: "rgba(234, 88, 12, 0.1)",
    tcodeText: "#9A3412"
  },
  storage: {
    bg: "var(--bg-card)",
    border: "#7C3AED",
    headerBg: "rgba(124, 58, 237, 0.12)",
    text: "var(--text-primary)",
    subtext: "var(--text-muted)",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    badgeText: "#6D28D9",
    icon: "🗄️",
    tcodeBg: "rgba(124, 58, 237, 0.1)",
    tcodeText: "#5B21B6"
  },
  planning: {
    bg: "var(--bg-card)",
    border: "#0284C7",
    headerBg: "rgba(2, 132, 199, 0.12)",
    text: "var(--text-primary)",
    subtext: "var(--text-muted)",
    badgeBg: "rgba(14, 165, 233, 0.15)",
    badgeText: "#0369A1",
    icon: "📊",
    tcodeBg: "rgba(2, 132, 199, 0.1)",
    tcodeText: "#075985"
  }
};

export default function DiagramNode({ node, isSelected, onClick, isFullscreen }) {
  const categoryKey = node.category || (node.branch === "ewm" ? "ewm" : node.type || "pp");
  const style = CATEGORY_STYLES[node.type] || CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.pp;
  const isDarkCard = node.type === "client" || node.type === "companyCode" || node.type === "plant";

  const fontSize = isFullscreen ? 16 : 14;
  const subFontSize = isFullscreen ? 12.5 : 11.5;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(node);
      }}
      style={{
        width: isFullscreen ? 290 : 250,
        background: style.bg,
        border: `2px solid ${isSelected ? "var(--orange)" : style.border}`,
        borderRadius: 10,
        boxShadow: isSelected
          ? "0 0 0 3px rgba(255,85,0,0.35), 0 8px 24px rgba(0,0,0,0.12)"
          : "0 2px 10px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "all 0.18s ease-in-out",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        userSelect: "none"
      }}
    >
      {/* Node Header */}
      <div
        style={{
          padding: isFullscreen ? "10px 14px" : "8px 12px",
          background: style.headerBg,
          borderBottom: `1px solid ${style.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: isFullscreen ? 17 : 15 }}>{node.icon || style.icon}</span>
          <span
            style={{
              fontWeight: 800,
              fontSize,
              color: style.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {node.label}
          </span>
        </div>
        {node.tcode && (
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              background: style.tcodeBg,
              color: style.tcodeText,
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            {(node.tcode || "").split("/")[0]?.trim() || ""}
          </span>
        )}
      </div>

      {/* Node Body */}
      <div style={{ padding: isFullscreen ? "12px 14px" : "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Technical Name Badge */}
        {node.technicalName && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontSize: subFontSize,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: style.badgeText,
                background: style.badgeBg,
                padding: "2px 6px",
                borderRadius: 4
              }}
            >
              {node.technicalName}
            </span>
          </div>
        )}

        {/* Short Description */}
        <div
          style={{
            fontSize: subFontSize,
            color: style.subtext,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {node.description}
        </div>

        {/* Example Value Pill */}
        {node.example && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 6,
              borderTop: isDarkCard ? "1px solid rgba(255,255,255,0.12)" : "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: isDarkCard ? "#E0F2FE" : "var(--text-muted)"
            }}
          >
            <span>Ex: <strong style={{ color: isDarkCard ? "#FFFFFF" : "var(--text-primary)" }}>{node.example}</strong></span>
            <span style={{ fontSize: 10, color: isSelected ? "var(--orange)" : "var(--text-faint)" }}>Details →</span>
          </div>
        )}
      </div>
    </div>
  );
}
