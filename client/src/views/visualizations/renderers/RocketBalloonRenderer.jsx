import React from "react";

export default function RocketBalloonRenderer({ data, onSelectNode, selectedNodeId }) {
  const stages = data?.stages || [];
  const balloons = data?.balloons || [];
  const rocketX = 280;

  return (
    <g className="metaphor-rocket">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🚀 {data.title || "Ascending Rocket & Balloon: Strategic Scaling Trajectory"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Objects moving upward to represent scaling, launching, or high-level strategic overviews"}
      </text>

      {/* Atmospheric Elevation Gradient Background Tiers */}
      <g className="atmosphere-tiers" transform="translate(60, 130)">
        {/* Orbit (Deep Space Dark Navy) */}
        <rect x="0" y="0" width="1080" height="110" fill="rgba(15, 23, 42, 0.9)" rx="6" />
        <text x="20" y="30" fill="#93C5FD" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
          🌌 ORBIT / EXOSPHERE (OVER 100 KM) — GLOBAL AUTONOMOUS SCALE
        </text>

        {/* Stratosphere (Cyan/Blue) */}
        <rect x="0" y="115" width="1080" height="110" fill="rgba(14, 165, 233, 0.18)" rx="6" />
        <text x="20" y="145" fill="#0284C7" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
          ☁️ STRATOSPHERE (50 KM) — CLOUD ACCELERATION & GLOBAL WATCHLISTS
        </text>

        {/* Troposphere (Sky Blue) */}
        <rect x="0" y="230" width="1080" height="110" fill="rgba(56, 189, 248, 0.1)" rx="6" />
        <text x="20" y="260" fill="#0369A1" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
          🌤️ TROPOSPHERE (12 KM) — STANDARDIZED INTEGRATION PIPELINES
        </text>

        {/* Launchpad Ground Base */}
        <rect x="0" y="345" width="1080" height="135" fill="rgba(241, 245, 249, 0.9)" rx="6" />
        <text x="20" y="375" fill="#475569" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
          🌱 LAUNCHPAD BASELINE (0 KM) — CLEAN CORE MASTER DATA & GOVERNANCE
        </text>
      </g>

      {/* Ascending Space Rocket */}
      <g className="space-rocket" transform={`translate(${rocketX}, 140)`}>
        {/* Exhaust Fire Plume / Thrust */}
        <polygon points="40,320 20,410 40,370 60,420 80,370 100,410 80,320" fill="#EA580C" />
        <polygon points="45,320 35,380 60,350 85,380 75,320" fill="#FACC15" />

        {/* Rocket Stage 1 (Base Boosters) */}
        <g transform="translate(30, 220)">
          {/* Main Booster Cylinder */}
          <rect x="0" y="0" width="60" height="100" rx="4" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
          {/* Side Fins */}
          <polygon points="0,60 -24,100 0,100" fill="#BE123C" stroke="#334155" strokeWidth="2" />
          <polygon points="60,60 84,100 60,100" fill="#BE123C" stroke="#334155" strokeWidth="2" />
          <text x="30" y="55" fill="#0F172A" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">STAGE 1</text>
        </g>

        {/* Rocket Stage 2 (Mid Propulsion) */}
        <g transform="translate(35, 130)">
          <rect x="0" y="0" width="50" height="90" rx="2" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
          <rect x="0" y="0" width="50" height="12" fill="#BE123C" />
          <text x="25" y="50" fill="#0F172A" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">STAGE 2</text>
        </g>

        {/* Rocket Stage 3 & Nosecone Payload (Top) */}
        <g transform="translate(38, 40)">
          <rect x="0" y="40" width="44" height="50" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
          {/* Aerodynamic Nosecone */}
          <path d="M 0 40 Q 22 0 44 40 Z" fill="#BE123C" stroke="#334155" strokeWidth="2" />
          {/* Porthole Window */}
          <circle cx="22" cy="56" r="8" fill="#38BDF8" stroke="#1E293B" strokeWidth="2" />
          <circle cx="20" cy="54" r="2.5" fill="#FFFFFF" />
          <text x="22" y="80" fill="#0F172A" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">ORBIT</text>
        </g>
      </g>

      {/* Floating Hot Air Balloon on the Upper Right (High-Level Overview Metaphor) */}
      <g className="hot-air-balloon" transform="translate(920, 220)">
        {/* Balloon Envelope Canopy */}
        <ellipse cx="60" cy="50" rx="48" ry="56" fill="#F97316" stroke="#9A3412" strokeWidth="2" />
        {/* Colorful Balloon Gores / Stripes */}
        <path d="M 60 -6 Q 30 50 60 106" fill="none" stroke="#FEF08A" strokeWidth="8" />
        <path d="M 60 -6 Q 90 50 60 106" fill="none" stroke="#BE123C" strokeWidth="8" />

        {/* Rigging Lines */}
        <line x1="35" y1="104" x2="48" y2="130" stroke="#78350F" strokeWidth="1.5" />
        <line x1="85" y1="104" x2="72" y2="130" stroke="#78350F" strokeWidth="1.5" />

        {/* Wicker Passenger Basket */}
        <rect x="46" y="130" width="28" height="20" rx="3" fill="#A16207" stroke="#713F12" strokeWidth="1.5" />
        {/* Burner Flame */}
        <polygon points="56,128 60,116 64,128" fill="#FACC15" />

        <text x="60" y="165" fill="#78350F" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
          STRATEGY BALLOON
        </text>
      </g>

      {/* Structured Tier Cards along the trajectory */}
      <g className="trajectory-cards" transform="translate(420, 140)">
        {stages.map((stg, sIdx) => {
          const sy = sIdx * 115;
          const isSelected = selectedNodeId === stg.tier;

          return (
            <g
              key={stg.tier || sIdx}
              onClick={() => onSelectNode && onSelectNode(stg, "stage", sIdx)}
              style={{ cursor: "pointer" }}
              transform={`translate(0, ${sy})`}
            >
              <rect
                x="0"
                y="0"
                width="460"
                height="88"
                rx="10"
                fill="var(--bg-card, #FFFFFF)"
                stroke={isSelected ? "var(--orange, #E8614D)" : "rgba(0,0,0,0.1)"}
                strokeWidth={isSelected ? 3 : 1.5}
                filter="drop-shadow(0 2px 8px rgba(0,0,0,0.06))"
              />
              <rect
                x="0"
                y="0"
                width="6"
                height="88"
                rx="10 0 0 10"
                fill={sIdx === 0 ? "#8B5CF6" : (sIdx === 1 ? "#3B82F6" : (sIdx === 2 ? "#0EA5E9" : "#10B981"))}
              />

              {/* Tier Pill */}
              <rect x="16" y="12" width="100" height="20" rx="10" fill="rgba(0,0,0,0.06)" />
              <text x="66" y="25" fill="#1E293B" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                {stg.tier}
              </text>

              {/* Altitude & Velocity */}
              <text x="440" y="26" fill="#0284C7" fontSize="11" fontWeight="700" textAnchor="end" fontFamily="var(--font-mono)">
                🛰️ {stg.altitude}
              </text>

              {/* Title */}
              <text x="16" y="48" fill="var(--text-primary, #0F172A)" fontSize="13.5" fontWeight="800" fontFamily="var(--font-sans)">
                {stg.title?.length > 42 ? stg.title.slice(0, 42) + "..." : stg.title}
              </text>

              {/* Description */}
              <text x="16" y="68" fill="var(--text-muted, #64748B)" fontSize="11" fontFamily="var(--font-sans)">
                {stg.desc?.length > 58 ? stg.desc.slice(0, 58) + "..." : stg.desc}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
