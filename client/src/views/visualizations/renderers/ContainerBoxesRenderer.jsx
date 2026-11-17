import React from "react";

export default function ContainerBoxesRenderer({ data, onSelectNode, selectedNodeId }) {
  const containers = data?.containers || [];
  const containerWidth = 240;
  const containerHeight = 310;
  const gap = 24;
  const startX = 60;
  const startY = 140;

  return (
    <g className="metaphor-containers">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        📦 {data.title || "Categorized Data Containers & Storage Vaults"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Partitioned wooden crates and glass jars representing distinct data domains"}
      </text>

      {/* Grid of Containers */}
      {containers.map((c, idx) => {
        const x = startX + idx * (containerWidth + gap);
        const y = startY;
        const isSelected = selectedNodeId === c.id;
        const isJar = c.type === "glass_jar";

        return (
          <g
            key={c.id || idx}
            onClick={() => onSelectNode && onSelectNode(c, "container", idx)}
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
            transform={`translate(${x}, ${y})`}
          >
            {/* Selection Aura */}
            {isSelected && (
              <rect
                x="-8"
                y="-8"
                width={containerWidth + 16}
                height={containerHeight + 16}
                rx="14"
                fill="none"
                stroke="var(--orange, #E8614D)"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
            )}

            {isJar ? (
              /* Translucent Glass Jar Visualization */
              <g className="glass-jar">
                {/* Cork Lid */}
                <rect x="65" y="-14" width="110" height="16" rx="4" fill="#C29B78" stroke="#8C6541" strokeWidth="2" />
                <rect x="75" y="0" width="90" height="10" fill="#A87F56" />

                {/* Glass Jar Body */}
                <rect
                  x="0"
                  y="10"
                  width={containerWidth}
                  height={containerHeight - 10}
                  rx="24"
                  fill="rgba(224, 242, 254, 0.45)"
                  stroke="#7DD3FC"
                  strokeWidth="2.5"
                />
                {/* Glass Specular Glare */}
                <path
                  d={`M 14 30 Q 14 ${containerHeight - 40} 14 ${containerHeight - 40}`}
                  stroke="rgba(255, 255, 255, 0.85)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              /* Heavy Duty Wooden Crate Visualization */
              <g className="wooden-crate">
                {/* Base Crate Planks */}
                <rect
                  x="0"
                  y="0"
                  width={containerWidth}
                  height={containerHeight}
                  rx="8"
                  fill="#D97706"
                  stroke="#92400E"
                  strokeWidth="2.5"
                />
                {/* Wood Planks Divider Lines */}
                <line x1="0" y1="75" x2={containerWidth} y2="75" stroke="#78350F" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="0" y1="150" x2={containerWidth} y2="150" stroke="#78350F" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="0" y1="225" x2={containerWidth} y2="225" stroke="#78350F" strokeWidth="2" strokeDasharray="4 2" />

                {/* Diagonal Reinforcement Slats */}
                <line x1="8" y1="12" x2={containerWidth - 8} y2={containerHeight - 12} stroke="#B45309" strokeWidth="10" strokeLinecap="round" opacity="0.4" />
                <line x1={containerWidth - 8} y1="12" x2="8" y2={containerHeight - 12} stroke="#B45309" strokeWidth="10" strokeLinecap="round" opacity="0.4" />

                {/* Corner Steel Brackets */}
                <rect x="0" y="0" width="22" height="22" fill="#475569" rx="2" />
                <circle cx="8" cy="8" r="2.5" fill="#E2E8F0" />
                <rect x={containerWidth - 22} y="0" width="22" height="22" fill="#475569" rx="2" />
                <circle cx={containerWidth - 8} cy="8" r="2.5" fill="#E2E8F0" />
                <rect x="0" y={containerHeight - 22} width="22" height="22" fill="#475569" rx="2" />
                <circle cx="8" cy={containerHeight - 8} r="2.5" fill="#E2E8F0" />
                <rect x={containerWidth - 22} y={containerHeight - 22} width="22" height="22" fill="#475569" rx="2" />
                <circle cx={containerWidth - 8} cy={containerHeight - 8} r="2.5" fill="#E2E8F0" />
              </g>
            )}

            {/* Container Header / Label Badge */}
            <g transform="translate(14, 20)">
              <rect x="0" y="0" width={containerWidth - 28} height="36" rx="6" fill="rgba(255, 255, 255, 0.92)" stroke="rgba(0,0,0,0.12)" />
              <text x="10" y="22" fill="#1C1917" fontSize="13" fontWeight="700" fontFamily="var(--font-sans, system-ui)">
                {c.label?.length > 22 ? c.label.slice(0, 22) + "..." : c.label}
              </text>
            </g>

            {/* Sub-badge pill */}
            {c.badge && (
              <g transform={`translate(${containerWidth - 95}, 62)`}>
                <rect x="0" y="0" width="82" height="18" rx="9" fill="#1E293B" opacity="0.85" />
                <text x="41" y="13" fill="#F8FAFC" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-mono)">
                  {c.badge}
                </text>
              </g>
            )}

            {/* Capacity Line */}
            <text x="16" y="76" fill={isJar ? "#0369A1" : "#78350F"} fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
              ⚡ {c.capacity || "Capacity: Normal"}
            </text>

            {/* Contained Items List */}
            <g transform="translate(14, 94)">
              {(c.items || []).slice(0, 4).map((item, iIdx) => (
                <g key={iIdx} transform={`translate(0, ${iIdx * 48})`}>
                  <rect
                    x="0"
                    y="0"
                    width={containerWidth - 28}
                    height="40"
                    rx="6"
                    fill="rgba(255, 255, 255, 0.95)"
                    stroke="rgba(0,0,0,0.08)"
                  />
                  <circle cx="12" cy="14" r="4" fill={isJar ? "#0284C7" : "#D97706"} />
                  <text x="22" y="17" fill="#0F172A" fontSize="11.5" fontWeight="600" fontFamily="var(--font-sans)">
                    {item.name?.length > 20 ? item.name.slice(0, 20) + ".." : item.name}
                  </text>
                  <text x="22" y="32" fill="#64748B" fontSize="10" fontFamily="var(--font-mono)">
                    {item.count} • {item.status || "OK"}
                  </text>
                </g>
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}
