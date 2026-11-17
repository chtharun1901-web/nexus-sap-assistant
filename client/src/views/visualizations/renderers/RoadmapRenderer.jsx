import React from "react";

export default function RoadmapRenderer({ data, onSelectNode, selectedNodeId }) {
  const highwayStops = data?.highwayStops || [];
  const horizonGoal = data?.horizonGoal || "Strategic Destination Horizon";

  return (
    <g className="metaphor-roadmap">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🛣️ {data.title || "Highway Roadmap & Strategic Crossroads"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Asphalt highway with milestones, fork decisions, roadblocks, and destination horizon"}
      </text>

      {/* Horizon Mountains & Destination Sun at the top right */}
      <g transform="translate(860, 100)">
        {/* Rising Sun */}
        <circle cx="160" cy="50" r="32" fill="#F59E0B" opacity="0.8" />
        {/* Mountain Silhouettes */}
        <polygon points="40,90 120,20 200,90" fill="#64748B" opacity="0.6" />
        <polygon points="120,90 190,35 260,90" fill="#475569" opacity="0.8" />
        <polygon points="180,90 240,40 300,90" fill="#334155" />
        {/* Destination Flag Banner */}
        <g transform="translate(90, 75)">
          <rect x="0" y="0" width="180" height="26" rx="6" fill="#1E293B" stroke="#FDE68A" strokeWidth="1.5" />
          <text x="90" y="17" fill="#FDE68A" fontSize="10.5" fontWeight="800" textAnchor="middle" fontFamily="var(--font-sans)">
            🏁 {horizonGoal}
          </text>
        </g>
      </g>

      {/* Curving Perspective Asphalt Highway */}
      <g className="highway-road">
        {/* Outer Road Surface (Dark Asphalt) */}
        <path
          d="
            M 120 620
            C 280 620, 240 480, 420 450
            C 620 420, 600 280, 800 240
            C 920 220, 980 180, 1020 160
            L 1040 160
            C 1000 185, 950 230, 820 255
            C 630 295, 660 435, 440 470
            C 260 500, 290 640, 120 650
            Z
          "
          fill="#334155"
          stroke="#1E293B"
          strokeWidth="3"
        />

        {/* Highway Shoulder Lines (Solid White) */}
        <path
          d="
            M 125 623
            C 280 623, 243 483, 423 453
            C 620 423, 603 283, 803 243
            C 920 223, 980 183, 1020 163
          "
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center Dashed Lane Stripe (High-Visibility Highway Yellow) */}
        <path
          d="
            M 120 635
            C 280 635, 241 495, 421 465
            C 620 435, 601 295, 801 255
            C 920 235, 980 195, 1030 170
          "
          fill="none"
          stroke="#FACC15"
          strokeWidth="4"
          strokeDasharray="14 10"
        />
      </g>

      {/* Roadside Milepost Stops & Crossroad Junctions */}
      {highwayStops.map((stop, idx) => {
        // Approximate point along the perspective highway
        const stopCoords = [
          { x: 140, y: 550, cardX: 180, cardY: 530 },
          { x: 340, y: 440, cardX: 380, cardY: 410 },
          { x: 550, y: 350, cardX: 590, cardY: 310 },
          { x: 740, y: 240, cardX: 780, cardY: 210 },
          { x: 920, y: 150, cardX: 740, cardY: 100 }
        ][idx] || { x: 200 + idx * 160, y: 400, cardX: 240 + idx * 160, cardY: 380 };

        const isSelected = selectedNodeId === stop.mile;
        const isCurrent = stop.isCurrent;

        return (
          <g
            key={stop.mile || idx}
            onClick={() => onSelectNode && onSelectNode(stop, "highway_stop", idx)}
            style={{ cursor: "pointer" }}
          >
            {/* Ground Anchor / Highway Mile Marker Post */}
            <g transform={`translate(${stopCoords.x}, ${stopCoords.y})`}>
              <line x1="0" y1="0" x2="0" y2="-30" stroke="#475569" strokeWidth="4" />
              {/* Milepost Sign Shield */}
              <g transform="translate(-24, -54)">
                <polygon points="24,0 48,10 48,36 24,46 0,36 0,10" fill={isCurrent ? "#EA580C" : "#0284C7"} stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="24" y="24" fill="#FFFFFF" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                  {stop.mile}
                </text>
              </g>
            </g>

            {/* Connecting Guide Line to Milestone Card */}
            <line x1={stopCoords.x} y1={stopCoords.y - 40} x2={stopCoords.cardX} y2={stopCoords.cardY + 30} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Milestone Card */}
            <g transform={`translate(${stopCoords.cardX}, ${stopCoords.cardY})`}>
              <rect
                x="0"
                y="0"
                width="280"
                height="80"
                rx="8"
                fill="var(--bg-card, #FFFFFF)"
                stroke={isSelected ? "var(--orange, #E8614D)" : (isCurrent ? "#EA580C" : "rgba(0,0,0,0.12)")}
                strokeWidth={isSelected ? 3 : (isCurrent ? 2 : 1)}
                filter="drop-shadow(0 2px 8px rgba(0,0,0,0.06))"
              />
              <rect
                x="0"
                y="0"
                width="6"
                height="80"
                rx="8 0 0 8"
                fill={isCurrent ? "#EA580C" : (stop.status === "Passed" ? "#10B981" : "#3B82F6")}
              />

              {/* Roadsign Header Pill */}
              <rect x="14" y="10" width="80" height="16" rx="4" fill="#1E293B" />
              <text x="54" y="22" fill="#F8FAFC" fontSize="8.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                {stop.roadSign || stop.mile}
              </text>

              {/* Status Badge */}
              <text x="264" y="22" fill={isCurrent ? "#EA580C" : "#059669"} fontSize="9.5" fontWeight="700" textAnchor="end" fontFamily="var(--font-mono)">
                {stop.status || stop.eta}
              </text>

              {/* Phase Title */}
              <text x="14" y="44" fill="var(--text-primary, #0F172A)" fontSize="12" fontWeight="700" fontFamily="var(--font-sans)">
                {stop.phase?.length > 30 ? stop.phase.slice(0, 30) + ".." : stop.phase}
              </text>

              {/* Description */}
              <text x="14" y="62" fill="var(--text-muted, #64748B)" fontSize="10.5" fontFamily="var(--font-sans)">
                {stop.details?.length > 38 ? stop.details.slice(0, 38) + "..." : stop.details}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
