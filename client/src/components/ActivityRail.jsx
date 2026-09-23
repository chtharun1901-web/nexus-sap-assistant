import React, { useState } from "react";

const ITEMS = [
  { id: "home",      label: "Home",          tooltip: "Home Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "workspace", label: "Workspace",     tooltip: "SAP Investigation Workspace", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" },
  { id: "interview", label: "Copilot",       tooltip: "Operations Intelligence Copilot", icon: "M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm10 16H4V9h16v11z" },
  { id: "cases",     label: "Cases",         tooltip: "Cases & Investigations", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
  { id: "knowledge", label: "Knowledge",     tooltip: "Personal Knowledge Library", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" },
  { id: "kb",        label: "KB & Notes",    tooltip: "Official SAP KB & OSS Notes", icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
];

export default function ActivityRail({ active, onNavigate }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <nav
      id="tour-activity-rail"
      style={{
        position: "relative",
        background: "#080604",
        borderRight: "1px solid rgba(245, 158, 11, 0.22)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0",
        gap: 6,
        zIndex: 100,
        width: 60,
        flexShrink: 0,
        overflow: "hidden"
      }}
    >
      {/* Subtle Transparent Sacred Mandala Wallpaper in Background Only */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/wallpapers/indian-art-mandala.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.2,
          filter: "saturate(0.9) contrast(1.1)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* Dark Ambient Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(8, 6, 4, 0.6) 0%, rgba(5, 4, 3, 0.85) 100%)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      {/* Top Logo */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "rgba(245, 158, 11, 0.14)",
          border: "1px solid rgba(245, 158, 11, 0.55)",
          boxShadow: "0 0 14px rgba(245, 158, 11, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FBBF24",
          fontSize: 13,
          fontWeight: 900,
          fontFamily: "var(--font-mono)",
          marginBottom: 8,
          flexShrink: 0,
          cursor: "default"
        }}
        title="SANJAYA (सञ्जय) — SAP Operations Intelligence"
      >
        SJ
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: 30,
          height: 1,
          background: "rgba(255, 255, 255, 0.08)",
          marginBottom: 4
        }}
      />

      {/* Navigation Buttons (Clean Glass Buttons, No Image Inside) */}
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        const isHovered = hoveredId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            title={item.tooltip || item.label}
            style={{
              position: "relative",
              zIndex: 2,
              width: 52,
              height: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              outline: "none"
            }}
          >
            {/* Active Neon Bar Indicator */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 7,
                  bottom: 7,
                  width: 3.5,
                  borderRadius: "0 4px 4px 0",
                  background: "linear-gradient(180deg, #FF5500, #F59E0B)",
                  boxShadow: "0 0 10px rgba(255, 85, 0, 0.85), 0 0 16px rgba(245, 158, 11, 0.5)"
                }}
              />
            )}

            {/* Clean Glass Tile with Fluid Hover Animation */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                background: isActive
                  ? "rgba(255, 85, 0, 0.18)"
                  : isHovered
                  ? "rgba(245, 158, 11, 0.16)"
                  : "rgba(255, 255, 255, 0.05)",
                border: isActive
                  ? "1px solid rgba(255, 85, 0, 0.65)"
                  : isHovered
                  ? "1px solid #F59E0B"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: isActive
                  ? "0 0 12px rgba(255, 85, 0, 0.35)"
                  : isHovered
                  ? "0 0 14px rgba(245, 158, 11, 0.4)"
                  : "none",
                transform: isHovered ? "translateY(-2px) scale(1.08)" : isActive ? "scale(1.02)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              <svg
                width={17}
                height={17}
                viewBox="0 0 24 24"
                fill="none"
                stroke={isActive ? "#FF5500" : isHovered ? "#FBBF24" : "#A1A1AA"}
                strokeWidth={isActive ? 2.3 : isHovered ? 2.1 : 1.7}
                style={{
                  filter: isActive
                    ? "drop-shadow(0 0 6px rgba(255, 85, 0, 0.7))"
                    : isHovered
                    ? "drop-shadow(0 0 5px rgba(245, 158, 11, 0.6))"
                    : "none",
                  transition: "all 0.18s ease"
                }}
              >
                <path d={item.icon} />
              </svg>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
