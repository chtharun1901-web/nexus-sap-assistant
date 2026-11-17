import React from "react";

export default function VisualizationsSidebar({
  savedVisualizations = [],
  activeId = null,
  onSelect = () => {},
  onNew = () => {},
  onDelete = () => {},
  onNavigate = () => {}
}) {
  const getMetaphorIcon = (item) => {
    if (!item) return "🎨";
    const pat = (item.visualPattern || item.visualType || item.metaphor || "").toLowerCase();
    if (pat === "flowchart" || (item.lanes && item.edges && !item.visualPattern && !item.levels)) return "🔀";
    if (pat === "enterprise_hierarchy" || (item.levels && item.levels.length > 0)) return "🏛️";
    if (pat === "current_to_be_bridge" || pat === "transformation_journey") return "🌉";
    if (pat === "hub_and_spoke") return "🕸️";
    if (pat === "matrix_2x2") return "📊";
    if (pat === "maturity_staircase") return "📶";
    if (pat === "problem_impact_recommendation") return "🎯";
    if (pat === "layered_architecture" || pat === "system_landscape" || pat === "containers") return "📦";
    if (pat === "roadmap") return "🗺️";
    return "🎨";
  };

  return (
    <aside
      style={{
        width: 270,
        minWidth: 270,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-card, #FFFFFF)",
        borderRight: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
        boxShadow: "1px 0 3px rgba(0,0,0,0.02)",
        zIndex: 20,
        userSelect: "none"
      }}
    >
      {/* 1. Brand & Return to Workspace */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 900, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              Nexus Slide Studio
            </div>
            <div style={{ fontSize: 9.5, color: "var(--burgundy-rich, #6E1A2D)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              SAP SLIDE STUDIO
            </div>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate("workspace")}
            title="Return to Main Workspace"
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: "var(--bg-surface, #F8FAFC)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* 2. New Visualization Action */}
      <div style={{ padding: "12px 14px" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 8,
            background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
            color: "#FFFFFF",
            border: "none",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(110,26,45,0.25)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.92"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <span style={{ fontSize: 16 }}>+</span>
          <span>New Visualization</span>
        </button>
      </div>

      {/* 3. Section Header */}
      <div
        style={{
          padding: "6px 16px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase"
        }}
      >
        <span>Saved Visualizations</span>
        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", opacity: 0.8 }}>
          ({savedVisualizations.length})
        </span>
      </div>

      {/* 4. Visualizations History List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "6px 8px"
        }}
      >
        {savedVisualizations.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📦</div>
            <div>No saved visualizations yet.</div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
              Create your first diagram above!
            </div>
          </div>
        ) : (
          savedVisualizations.map((item) => {
            const isSelected = activeId === item.id;
            const icon = getMetaphorIcon(item.metaphor);

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  marginBottom: 3,
                  borderRadius: 6,
                  background: isSelected ? "var(--burgundy-light, #FDF2F4)" : "transparent",
                  borderLeft: isSelected ? "3px solid var(--burgundy-rich, #6E1A2D)" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.12s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.03))";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={item.title}
                    >
                      {item.title || "Untitled Diagram"}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      {item.metaphor?.toUpperCase()} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Preset"}
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="Delete visualization"
                  style={{
                    opacity: isSelected ? 0.7 : 0.2,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "inherit",
                    padding: "2px 4px",
                    marginLeft: 4,
                    transition: "opacity 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = isSelected ? "0.7" : "0.2"; e.currentTarget.style.color = "inherit"; }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Bottom Engine Info */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface, #F8FAFC)",
          fontSize: 11,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
      >
        <span style={{ fontSize: 13 }}>⚡</span>
        <span style={{ fontWeight: 600 }}>Nexus AI Vector Studio</span>
      </div>
    </aside>
  );
}
