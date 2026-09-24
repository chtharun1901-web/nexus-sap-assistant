import React from "react";
import { ROLES } from "../data/initialData.js";

export default function Nexus2Header({
  activeRole,
  onRoleChange,
  showLearningPanel,
  onToggleLearningPanel,
  onOpenLandscape,
  onExitSimulator
}) {
  const currentRole = ROLES.find(r => r.id === activeRole) || ROLES[0];

  return (
    <header
      style={{
        height: 52,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-card, #FAF8F5)",
        borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.1))",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
      }}
    >
      {/* Brand & Landscape Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          type="button"
          onClick={onExitSimulator}
          style={{
            background: "none",
            border: "1px solid var(--border-subtle)",
            borderRadius: 6,
            padding: "4px 9px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--text-muted)"
          }}
          title="Return to Nexus Investigation Studio"
        >
          ← Nexus Studio
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 18,
              fontWeight: 800,
              color: "var(--orange, #6E1A2D)",
              letterSpacing: "-0.01em"
            }}
          >
            Nexus 2.0
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              background: "rgba(110,26,45,0.1)",
              color: "var(--orange, #6E1A2D)",
              padding: "2px 7px",
              borderRadius: 4,
              border: "1px solid rgba(110,26,45,0.25)"
            }}
          >
            GTS EXECUTION SIMULATOR
          </span>
        </div>

        {/* Live Landscape Bridge Badge */}
        <div
          onClick={onOpenLandscape}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            padding: "3px 10px",
            borderRadius: 16,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            fontSize: 11,
            fontFamily: "var(--font-mono)"
          }}
          title="Click to view Connected System Landscape Architecture"
        >
          <span style={{ color: "var(--green, #10B981)" }}>●</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>S/4HANA</span>
          <span style={{ color: "var(--text-muted)" }}>⇄</span>
          <span style={{ fontWeight: 700, color: "var(--orange, #6E1A2D)" }}>GTS 2023</span>
          <span style={{ color: "var(--text-muted)" }}>⇄</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>EWM 100</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>🗺️</span>
        </div>
      </div>

      {/* Role Selector & Learning Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Role Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)" }}>Active Role:</span>
          <select
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-strong)",
              cursor: "pointer",
              outline: "none"
            }}
            title={currentRole.description}
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>
                {r.badge} {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Learning Mode Toggle Button */}
        <button
          type="button"
          onClick={onToggleLearningPanel}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            background: showLearningPanel ? "var(--orange, #6E1A2D)" : "var(--bg-surface)",
            color: showLearningPanel ? "#FFFFFF" : "var(--text-primary)",
            border: "1px solid " + (showLearningPanel ? "var(--orange)" : "var(--border-subtle)"),
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: showLearningPanel ? "0 2px 6px rgba(110,26,45,0.3)" : "none"
          }}
          title="Toggle Learning Explanation & SAP Help Panel"
        >
          <span>💡</span>
          <span>{showLearningPanel ? "Learning View: ON" : "Learning View"}</span>
        </button>
      </div>
    </header>
  );
}
