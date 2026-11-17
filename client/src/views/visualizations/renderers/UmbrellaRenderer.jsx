import React from "react";

export default function UmbrellaRenderer({ data, onSelectNode, selectedNodeId }) {
  const ribs = data?.ribs || [];
  const shelteredElements = data?.shelteredElements || [];
  const rainHazards = data?.rainHazards || [];

  const centerX = 560;
  const canopyTopY = 160;
  const canopyBottomY = 280;
  const canopyWidth = 840;

  return (
    <g className="metaphor-umbrella">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        ☂️ {data.title || "Overarching Governance & Protection Umbrella"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Single overarching canopy shielding sub-elements, operations, and data streams from hazards"}
      </text>

      {/* Falling Rain Hazards (External Risks Deflected by Canopy) */}
      <g className="rain-hazards">
        {rainHazards.map((hazard, hIdx) => {
          const hx = 220 + hIdx * 170;
          const hy = 115 + (hIdx % 2) * 15;
          return (
            <g key={hIdx} transform={`translate(${hx}, ${hy})`}>
              {/* Rain Drop Stream */}
              <line x1="0" y1="0" x2="-8" y2="24" stroke="#60A5FA" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.8" />
              <line x1="16" y1="-8" x2="8" y2="16" stroke="#60A5FA" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
              {/* Hazard Pill */}
              <g transform="translate(-40, -18)">
                <rect x="0" y="0" width="120" height="22" rx="11" fill="rgba(239, 68, 68, 0.12)" stroke="#EF4444" strokeWidth="1.2" />
                <text x="60" y="14" fill="#DC2626" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
                  ⚡ {hazard}
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* Central Umbrella Shaft & Curved Handle */}
      <g className="umbrella-shaft">
        {/* Top Ferrule Tip */}
        <path d={`M ${centerX - 6} ${canopyTopY} L ${centerX} ${canopyTopY - 24} L ${centerX + 6} ${canopyTopY} Z`} fill="#D97706" />
        <circle cx={centerX} cy={canopyTopY - 24} r="5" fill="#B45309" />

        {/* Central Pole */}
        <line x1={centerX} y1={canopyTopY} x2={centerX} y2="480" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
        <line x1={centerX - 1} y1={canopyTopY} x2={centerX - 1} y2="480" stroke="#FDE68A" strokeWidth="1.5" />

        {/* Curved J-Hook Handle */}
        <path
          d={`M ${centerX} 480 Q ${centerX} 520 ${centerX - 35} 520 Q ${centerX - 70} 520 ${centerX - 70} 490`}
          fill="none"
          stroke="#78350F"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx={centerX - 70} cy={490} r="6" fill="#B45309" />
      </g>

      {/* Umbrella Canopy Fabric Segments */}
      <g className="umbrella-canopy">
        {ribs.map((rib, idx) => {
          const total = ribs.length || 4;
          const segWidth = canopyWidth / total;
          const leftX = centerX - canopyWidth / 2 + idx * segWidth;
          const rightX = leftX + segWidth;
          const isSelected = selectedNodeId === rib.id;

          // Arched canopy curve for each rib segment
          const pathD = `
            M ${centerX} ${canopyTopY}
            Q ${(leftX + centerX) / 2} ${canopyTopY + 40} ${leftX} ${canopyBottomY}
            Q ${(leftX + rightX) / 2} ${canopyBottomY - 18} ${rightX} ${canopyBottomY}
            Q ${(rightX + centerX) / 2} ${canopyTopY + 40} ${centerX} ${canopyTopY}
            Z
          `;

          return (
            <g
              key={rib.id || idx}
              onClick={() => onSelectNode && onSelectNode(rib, "rib", idx)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={pathD}
                fill={rib.color || (idx % 2 === 0 ? "#1E40AF" : "#2563EB")}
                stroke="#1E293B"
                strokeWidth={isSelected ? 4 : 2}
                opacity={isSelected ? 1 : 0.92}
              />
              {/* Rib Label */}
              <text
                x={(leftX + rightX) / 2}
                y={canopyBottomY - 45}
                fill="#FFFFFF"
                fontSize="12.5"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="var(--font-sans)"
              >
                {rib.label}
              </text>
              <text
                x={(leftX + rightX) / 2}
                y={canopyBottomY - 28}
                fill="#E2E8F0"
                fontSize="10"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
              >
                {rib.sublabel || rib.status}
              </text>
            </g>
          );
        })}

        {/* Central Crown Badge */}
        <g transform={`translate(${centerX - 170}, ${canopyTopY + 28})`}>
          <rect x="0" y="0" width="340" height="34" rx="17" fill="rgba(15, 23, 42, 0.88)" stroke="#E2E8F0" strokeWidth="1.5" />
          <text x="170" y="21" fill="#F8FAFC" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-sans)">
            🛡️ {data.canopyTitle || "Unified Umbrella Governance"}
          </text>
        </g>
      </g>

      {/* Sheltered Operational Pillars Under the Umbrella */}
      <g className="sheltered-pillars" transform="translate(0, 340)">
        {shelteredElements.map((elem, eIdx) => {
          const count = shelteredElements.length || 4;
          const pWidth = 190;
          const pGap = 20;
          const totalW = count * pWidth + (count - 1) * pGap;
          const startX = centerX - totalW / 2;
          const px = startX + eIdx * (pWidth + pGap);
          const py = 0;
          const isSelected = selectedNodeId === elem.id;

          return (
            <g
              key={elem.id || eIdx}
              onClick={() => onSelectNode && onSelectNode(elem, "sheltered", eIdx)}
              style={{ cursor: "pointer" }}
              transform={`translate(${px}, ${py})`}
            >
              {/* Protective Shield Glow */}
              <rect
                x="0"
                y="0"
                width={pWidth}
                height="150"
                rx="12"
                fill="var(--bg-card, #FFFFFF)"
                stroke={isSelected ? "var(--orange, #E8614D)" : "rgba(37, 99, 235, 0.3)"}
                strokeWidth={isSelected ? 3 : 1.5}
                filter="drop-shadow(0 2px 8px rgba(0,0,0,0.06))"
              />
              {/* Safe Status Badge */}
              <rect x="12" y="12" width="70" height="18" rx="4" fill="rgba(16, 185, 129, 0.12)" />
              <text x="47" y="24" fill="#059669" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                ✓ PROTECTED
              </text>

              <text x="14" y="52" fill="var(--text-primary, #1C1917)" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
                {elem.title?.length > 18 ? elem.title.slice(0, 18) + ".." : elem.title}
              </text>
              <foreignObject x="14" y="62" width={pWidth - 28} height="75">
                <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", lineHeight: 1.4, fontFamily: "system-ui" }}>
                  {elem.desc}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    </g>
  );
}
