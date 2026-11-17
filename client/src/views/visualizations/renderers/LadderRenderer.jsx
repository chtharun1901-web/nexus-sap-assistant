import React from "react";

export default function LadderRenderer({ data, onSelectNode, selectedNodeId }) {
  const rungs = data?.rungs || [];
  const ladderLeftX = 180;
  const ladderRightX = 360;
  const totalRungs = rungs.length || 5;
  const rungSpacing = 80;
  const startY = 130;
  const bottomY = startY + (totalRungs - 1) * rungSpacing + 60;

  return (
    <g className="metaphor-ladder">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🪜 {data.title || "Progression & Achievement Ladder"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Stepping up through milestone rungs, skill tiers, and progressive achievements"}
      </text>

      {/* Target Pinnacle Summit Banner */}
      <g transform="translate(140, 100)">
        <polygon points="0,0 260,0 280,18 260,36 0,36 15,18" fill="#D97706" />
        <text x="140" y="23" fill="#FFFFFF" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-sans)">
          🏆 TARGET MATURITY SUMMIT
        </text>
      </g>

      {/* Main Ladder Structure */}
      <g className="ladder-rails">
        {/* Left Vertical Stile / Rail (Wood or Steel) */}
        <rect x={ladderLeftX} y={startY - 10} width="16" height={bottomY - startY + 20} rx="6" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        <rect x={ladderLeftX + 3} y={startY - 6} width="4" height={bottomY - startY + 12} fill="#B45309" opacity="0.6" />

        {/* Right Vertical Stile / Rail */}
        <rect x={ladderRightX} y={startY - 10} width="16" height={bottomY - startY + 20} rx="6" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        <rect x={ladderRightX + 3} y={startY - 6} width="4" height={bottomY - startY + 12} fill="#B45309" opacity="0.6" />
      </g>

      {/* Ladder Rungs & Attached Milestone Cards */}
      {rungs.map((rung, idx) => {
        const ry = startY + idx * rungSpacing + 30;
        const isSelected = selectedNodeId === rung.id || selectedNodeId === `rung-${idx}`;
        const isCurrent = rung.isCurrent;
        const isTarget = rung.isTarget;

        return (
          <g
            key={rung.id || idx}
            onClick={() => onSelectNode && onSelectNode(rung, "rung", idx)}
            style={{ cursor: "pointer" }}
          >
            {/* The Wooden / Metallic Horizontal Rung */}
            <rect
              x={ladderLeftX + 16}
              y={ry - 7}
              width={ladderRightX - ladderLeftX - 16}
              height="14"
              rx="4"
              fill={isCurrent ? "#EA580C" : (isTarget ? "#D97706" : "#A16207")}
              stroke="#451A03"
              strokeWidth="1.5"
            />
            {/* Steel Rung Fastener Bolts */}
            <circle cx={ladderLeftX + 8} cy={ry} r="3" fill="#E2E8F0" stroke="#334155" />
            <circle cx={ladderRightX + 8} cy={ry} r="3" fill="#E2E8F0" stroke="#334155" />

            {/* Step Number Badge in the center of the rung */}
            <g transform={`translate(${(ladderLeftX + ladderRightX) / 2 - 14}, ${ry - 12})`}>
              <circle cx="14" cy="12" r="13" fill="#1E293B" stroke="#FDE68A" strokeWidth="2" />
              <text x="14" y="16" fill="#F8FAFC" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                {rung.step || (totalRungs - idx)}
              </text>
            </g>

            {/* Connecting Connector Beam to Milestone Card */}
            <line x1={ladderRightX + 16} y1={ry} x2={ladderRightX + 60} y2={ry} stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />

            {/* Right-Hand Milestone Information Card */}
            <g transform={`translate(${ladderRightX + 60}, ${ry - 32})`}>
              {/* Card Container */}
              <rect
                x="0"
                y="0"
                width="640"
                height="64"
                rx="10"
                fill="var(--bg-card, #FFFFFF)"
                stroke={isSelected ? "var(--orange, #E8614D)" : (isCurrent ? "#EA580C" : "rgba(0,0,0,0.1)")}
                strokeWidth={isSelected ? 3 : (isCurrent ? 2 : 1)}
                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.04))"
              />

              {/* Status Indicator Bar */}
              <rect
                x="0"
                y="0"
                width="6"
                height="64"
                rx="10 0 0 10"
                fill={isCurrent ? "#EA580C" : (isTarget ? "#D97706" : "#10B981")}
              />

              {/* Badge Pill */}
              <g transform="translate(18, 12)">
                <rect
                  x="0"
                  y="0"
                  width="110"
                  height="20"
                  rx="10"
                  fill={isCurrent ? "rgba(234, 88, 12, 0.12)" : "rgba(0,0,0,0.06)"}
                />
                <text x="55" y="14" fill={isCurrent ? "#EA580C" : "var(--text-muted, #64748B)"} fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                  {rung.level || `Rung ${totalRungs - idx}`}
                </text>
              </g>

              {/* Title & Metric */}
              <text x="140" y="27" fill="var(--text-primary, #0F172A)" fontSize="14" fontWeight="800" fontFamily="var(--font-sans)">
                {rung.title}
              </text>
              {rung.metric && (
                <text x="580" y="27" fill="#0D9488" fontSize="12" fontWeight="700" textAnchor="end" fontFamily="var(--font-mono)">
                  📈 {rung.metric}
                </text>
              )}

              {/* Description */}
              <text x="140" y="47" fill="var(--text-muted, #64748B)" fontSize="11.5" fontFamily="var(--font-sans)">
                {rung.desc?.length > 70 ? rung.desc.slice(0, 70) + "..." : rung.desc}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
