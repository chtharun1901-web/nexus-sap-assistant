import React from "react";

export default function CompassRenderer({ data, onSelectNode, selectedNodeId }) {
  const cardinals = data?.cardinals || {};
  const centerCore = data?.centerCore || "Strategic Vision Center";

  const cx = 560;
  const cy = 380;
  const compassRadius = 150;

  return (
    <g className="metaphor-compass">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🧭 {data.title || "Strategic Compass: Cardinal Principles & Direction"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Strategic direction, core values, and finding your way forward"}
      </text>

      {/* Central Marine Brass Compass Structure */}
      <g className="compass-rose">
        {/* Outer Heavy Brass Dial Bezel */}
        <circle cx={cx} cy={cy} r={compassRadius + 24} fill="#D97706" stroke="#78350F" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={compassRadius + 18} fill="#451A03" />
        <circle cx={cx} cy={cy} r={compassRadius + 12} fill="#B45309" stroke="#FDE68A" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={compassRadius} fill="var(--bg-card, #FEF3C7)" stroke="#78350F" strokeWidth="2" />

        {/* 360 Degree Dial Ticks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = cx + (compassRadius - 10) * Math.cos(rad);
          const y1 = cy + (compassRadius - 10) * Math.sin(rad);
          const x2 = cx + compassRadius * Math.cos(rad);
          const y2 = cy + compassRadius * Math.sin(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#78350F" strokeWidth="2" />;
        })}

        {/* 8-Point Compass Star Points */}
        {/* North Point (Red Enamel) */}
        <polygon points={`${cx},${cy - compassRadius + 10} ${cx + 16},${cy} ${cx},${cy}`} fill="#DC2626" />
        <polygon points={`${cx},${cy - compassRadius + 10} ${cx - 16},${cy} ${cx},${cy}`} fill="#EF4444" />
        {/* South Point (Dark Slate) */}
        <polygon points={`${cx},${cy + compassRadius - 10} ${cx + 16},${cy} ${cx},${cy}`} fill="#1E293B" />
        <polygon points={`${cx},${cy + compassRadius - 10} ${cx - 16},${cy} ${cx},${cy}`} fill="#334155" />
        {/* East Point */}
        <polygon points={`${cx + compassRadius - 10},${cy} ${cx},${cy + 16} ${cx},${cy}`} fill="#1E293B" />
        <polygon points={`${cx + compassRadius - 10},${cy} ${cx},${cy - 16} ${cx},${cy}`} fill="#334155" />
        {/* West Point */}
        <polygon points={`${cx - compassRadius + 10},${cy} ${cx},${cy + 16} ${cx},${cy}`} fill="#1E293B" />
        <polygon points={`${cx - compassRadius + 10},${cy} ${cx},${cy - 16} ${cx},${cy}`} fill="#334155" />

        {/* Cardinal Letters On Dial */}
        <text x={cx} y={cy - compassRadius + 32} fill="#DC2626" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">N</text>
        <text x={cx} y={cy + compassRadius - 18} fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">S</text>
        <text x={cx + compassRadius - 26} y={cy + 6} fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">E</text>
        <text x={cx - compassRadius + 26} y={cy + 6} fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">W</text>

        {/* Center Hub & Brass Bezel */}
        <circle cx={cx} cy={cy} r="38" fill="#1E293B" stroke="#D97706" strokeWidth="3" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.3))" />
        <circle cx={cx} cy={cy} r="6" fill="#FDE68A" />
        <text x={cx} y={cy + 4} fill="#F8FAFC" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="var(--font-sans)">
          VISION
        </text>
      </g>

      {/* 4 Cardinal Initiative Strategic Dossiers */}
      {/* North: Top */}
      {cardinals.north && (
        <g
          transform={`translate(${cx - 160}, 110)`}
          onClick={() => onSelectNode && onSelectNode(cardinals.north, "cardinal_north", 0)}
          style={{ cursor: "pointer" }}
        >
          <rect x="0" y="0" width="320" height="74" rx="10" fill="var(--bg-card, #FFFFFF)" stroke="#DC2626" strokeWidth="2" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.06))" />
          <rect x="0" y="0" width="320" height="6" rx="10 10 0 0" fill="#DC2626" />
          <text x="14" y="24" fill="#DC2626" fontSize="13" fontWeight="800" fontFamily="var(--font-sans)">
            ▲ {cardinals.north.label}
          </text>
          <text x="14" y="44" fill="var(--text-muted, #64748B)" fontSize="11" fontFamily="var(--font-mono)">
            Theme: {cardinals.north.theme}
          </text>
          <text x="14" y="60" fill="var(--text-primary, #0F172A)" fontSize="11" fontFamily="var(--font-sans)">
            • {cardinals.north.initiatives?.[0] || "Key Objective"}
          </text>
        </g>
      )}

      {/* South: Bottom */}
      {cardinals.south && (
        <g
          transform={`translate(${cx - 160}, 580)`}
          onClick={() => onSelectNode && onSelectNode(cardinals.south, "cardinal_south", 1)}
          style={{ cursor: "pointer" }}
        >
          <rect x="0" y="0" width="320" height="74" rx="10" fill="var(--bg-card, #FFFFFF)" stroke="#1E293B" strokeWidth="1.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.06))" />
          <rect x="0" y="0" width="320" height="6" rx="10 10 0 0" fill="#1E293B" />
          <text x="14" y="24" fill="#0F172A" fontSize="13" fontWeight="800" fontFamily="var(--font-sans)">
            ▼ {cardinals.south.label}
          </text>
          <text x="14" y="44" fill="var(--text-muted, #64748B)" fontSize="11" fontFamily="var(--font-mono)">
            Theme: {cardinals.south.theme}
          </text>
          <text x="14" y="60" fill="var(--text-primary, #0F172A)" fontSize="11" fontFamily="var(--font-sans)">
            • {cardinals.south.initiatives?.[0] || "Key Objective"}
          </text>
        </g>
      )}

      {/* West: Left */}
      {cardinals.west && (
        <g
          transform={`translate(60, ${cy - 50})`}
          onClick={() => onSelectNode && onSelectNode(cardinals.west, "cardinal_west", 2)}
          style={{ cursor: "pointer" }}
        >
          <rect x="0" y="0" width="280" height="100" rx="10" fill="var(--bg-card, #FFFFFF)" stroke="#3B82F6" strokeWidth="1.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.06))" />
          <rect x="0" y="0" width="6" height="100" rx="10 0 0 10" fill="#3B82F6" />
          <text x="16" y="24" fill="#1D4ED8" fontSize="13" fontWeight="800" fontFamily="var(--font-sans)">
            ◀ {cardinals.west.label}
          </text>
          <text x="16" y="46" fill="var(--text-muted, #64748B)" fontSize="11" fontFamily="var(--font-mono)">
            Theme: {cardinals.west.theme}
          </text>
          <text x="16" y="68" fill="var(--text-primary, #0F172A)" fontSize="11" fontFamily="var(--font-sans)">
            • {cardinals.west.initiatives?.[0] || "Key Initiative"}
          </text>
        </g>
      )}

      {/* East: Right */}
      {cardinals.east && (
        <g
          transform={`translate(${cx + compassRadius + 50}, ${cy - 50})`}
          onClick={() => onSelectNode && onSelectNode(cardinals.east, "cardinal_east", 3)}
          style={{ cursor: "pointer" }}
        >
          <rect x="0" y="0" width="280" height="100" rx="10" fill="var(--bg-card, #FFFFFF)" stroke="#10B981" strokeWidth="1.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.06))" />
          <rect x="0" y="0" width="6" height="100" rx="10 0 0 10" fill="#10B981" />
          <text x="16" y="24" fill="#047857" fontSize="13" fontWeight="800" fontFamily="var(--font-sans)">
            ▶ {cardinals.east.label}
          </text>
          <text x="16" y="46" fill="var(--text-muted, #64748B)" fontSize="11" fontFamily="var(--font-mono)">
            Theme: {cardinals.east.theme}
          </text>
          <text x="16" y="68" fill="var(--text-primary, #0F172A)" fontSize="11" fontFamily="var(--font-sans)">
            • {cardinals.east.initiatives?.[0] || "Key Initiative"}
          </text>
        </g>
      )}
    </g>
  );
}
