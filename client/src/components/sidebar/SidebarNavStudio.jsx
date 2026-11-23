import React from "react";

/**
 * SidebarNavStudio
 * 
 * Renders the 'SAP Studio & Architecture' navigation section in the Claude sidebar.
 * 
 * Navigation routes:
 *  - ⚡ Flow Simulator & Visualizations -> onNavigate("visualizations")
 *  - 🖥️ SAP Screen & ABAP Designer -> onNavigate("screen-designer")
 *  - 📚 Knowledge Base & OSS Notes -> onNavigate("knowledge")
 *  - 🎯 Architecture Challenges & Interview Prep -> onNavigate("interview")
 * 
 * Props:
 *  - activeView: current view string
 *  - onNavigate: navigation callback (view => void)
 *  - collapsed: boolean for collapsed icon-only sidebar mode
 *  - onOpenTemplates: optional callback to open prompt templates modal
 *  - onOpenBookmarks: optional callback to open bookmarks modal
 */

const NAV_ITEMS = [
  {
    id: "visualizations",
    label: "Enterprise Queue Flow Simulator",
    shortLabel: "Queue Simulator",
    icon: "⚡",
    tooltip: "Enterprise Queue Flow Simulator",
    isActive: (view) => view === "visualizations" || view === "simulator"
  },
  {
    id: "screen-designer",
    label: "Enterprise Screen & Form Designer",
    shortLabel: "Screen Designer",
    icon: "🖥️",
    tooltip: "Enterprise Screen & Form Designer",
    isActive: (view) => view === "screen-designer" || view === "sap-designer"
  },
  {
    id: "knowledge",
    label: "Enterprise Knowledge Base",
    shortLabel: "Knowledge Base",
    icon: "📚",
    tooltip: "Enterprise Knowledge Base",
    isActive: (view) => view === "knowledge" || view === "kb"
  },
  {
    id: "interview",
    label: "Enterprise Incident Troubleshooting Prep",
    shortLabel: "Troubleshooting Prep",
    icon: "🎯",
    tooltip: "Enterprise Incident Troubleshooting Prep",
    isActive: (view) => view === "interview"
  }
];

export default function SidebarNavStudio({
  activeView,
  onNavigate,
  collapsed = false,
  onOpenTemplates,
  onOpenBookmarks
}) {
  const handleNavigate = (viewId) => {
    if (onNavigate) {
      onNavigate(viewId);
    }
  };

  const handleOpenTemplates = () => {
    if (onOpenTemplates) {
      onOpenTemplates();
    } else {
      window.dispatchEvent(new CustomEvent("nexus-open-templates-modal"));
    }
  };

  const handleOpenBookmarks = () => {
    if (onOpenBookmarks) {
      onOpenBookmarks();
    } else {
      window.dispatchEvent(new CustomEvent("nexus-open-bookmarks-modal"));
    }
  };

  // --- COLLAPSED ICON-ONLY MODE ---
  if (collapsed) {
    return (
      <div
        className="sidebar-nav-studio-collapsed"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "8px 0",
          width: "100%",
          borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
          borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))"
        }}
      >
        <style>{`
          .sidebar-studio-icon-btn {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 16px;
            background: transparent;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.15s ease;
            color: var(--text-body, #44403C);
          }
          .sidebar-studio-icon-btn:hover {
            background: var(--bg-card-hover, rgba(0,0,0,0.05));
            border-color: var(--border-subtle, rgba(0,0,0,0.1));
            transform: translateY(-1px);
          }
          .sidebar-studio-icon-btn.active {
            background: rgba(212, 98, 43, 0.12) !important;
            border: 1px solid rgba(212, 98, 43, 0.35) !important;
            box-shadow: 0 1px 3px rgba(212, 98, 43, 0.12);
          }
          .sidebar-studio-mini-pill {
            width: 32px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-size: 13px;
            background: var(--bg-card, #FFFFFF);
            border: 1px solid var(--border-subtle, rgba(0,0,0,0.1));
            cursor: pointer;
            transition: all 0.15s ease;
            color: var(--text-body, #44403C);
          }
          .sidebar-studio-mini-pill:hover {
            background: rgba(212, 98, 43, 0.08);
            border-color: rgba(212, 98, 43, 0.35);
            color: var(--text-primary, #1C1917);
          }
        `}</style>

        {NAV_ITEMS.map((item) => {
          const active = item.isActive(activeView);
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-studio-icon-btn ${active ? "active" : ""}`}
              onClick={() => handleNavigate(item.id)}
              title={item.tooltip}
              aria-label={item.label}
            >
              <span>{item.icon}</span>
            </button>
          );
        })}

        {/* Subtle separator */}
        <div
          style={{
            width: 22,
            height: 1,
            background: "var(--border-subtle, rgba(0,0,0,0.1))",
            margin: "4px 0"
          }}
        />

        {/* Collapsed Quick Actions */}
        <button
          type="button"
          className="sidebar-studio-mini-pill"
          onClick={handleOpenTemplates}
          title="Prompt Templates"
          aria-label="Prompt Templates"
        >
          <span>📝</span>
        </button>

        <button
          type="button"
          className="sidebar-studio-mini-pill"
          onClick={handleOpenBookmarks}
          title="Bookmarks"
          aria-label="Bookmarks"
        >
          <span>⭐</span>
        </button>
      </div>
    );
  }

  // --- EXPANDED SIDEBAR MODE ---
  return (
    <div
      className="sidebar-nav-studio-section"
      style={{
        padding: "10px 12px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        userSelect: "none"
      }}
    >
      <style>{`
        .sidebar-studio-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-body, #44403C);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.15s ease;
          position: relative;
        }
        .sidebar-studio-nav-btn:hover {
          background: var(--bg-card-hover, rgba(0,0,0,0.04));
          color: var(--text-primary, #1C1917);
        }
        .sidebar-studio-nav-btn.active {
          background: rgba(212, 98, 43, 0.08) !important;
          border: 1px solid rgba(212, 98, 43, 0.25) !important;
          color: var(--text-primary, #1C1917) !important;
          font-weight: 600 !important;
          box-shadow: 0 1px 2px rgba(212, 98, 43, 0.04);
        }
        .sidebar-studio-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-body, #57534E);
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border-subtle, rgba(0,0,0,0.12));
          cursor: pointer;
          transition: all 0.14s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          white-space: nowrap;
        }
        .sidebar-studio-pill-btn:hover {
          background: rgba(212, 98, 43, 0.06);
          border-color: rgba(212, 98, 43, 0.35);
          color: var(--text-primary, #1C1917);
          transform: translateY(-0.5px);
        }
        .sidebar-studio-pill-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Crisp Section Header with 11px uppercase label & subtle letter-spacing */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 4px 6px 4px"
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted, #78716C)"
          }}
        >
          STUDIO & KNOWLEDGE
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: "rgba(212, 98, 43, 0.8)",
            backgroundColor: "rgba(212, 98, 43, 0.08)",
            padding: "1px 6px",
            borderRadius: 8,
            letterSpacing: "0.02em"
          }}
        >
          ENTERPRISE 3.7
        </span>
      </div>

      {/* Navigation items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(activeView);
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-studio-nav-btn ${active ? "active" : ""}`}
              onClick={() => handleNavigate(item.id)}
              title={item.tooltip}
            >
              <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 12.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1
                }}
              >
                {item.label}
              </span>
              {active && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    backgroundColor: "#D4622B",
                    boxShadow: "0 0 4px rgba(212, 98, 43, 0.5)",
                    flexShrink: 0
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Access Pills: '📝 Prompt Templates' & '⭐ Bookmarks' */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 6,
          padding: "2px 2px 0 2px"
        }}
      >
        <button
          type="button"
          className="sidebar-studio-pill-btn"
          onClick={handleOpenTemplates}
          title="Open reusable prompt templates"
        >
          <span style={{ fontSize: 11 }}>📝</span>
          <span>Prompt Templates</span>
        </button>

        <button
          type="button"
          className="sidebar-studio-pill-btn"
          onClick={handleOpenBookmarks}
          title="Open saved bookmarks & enterprise notes"
        >
          <span style={{ fontSize: 11 }}>⭐</span>
          <span>Bookmarks</span>
        </button>
      </div>
    </div>
  );
}
