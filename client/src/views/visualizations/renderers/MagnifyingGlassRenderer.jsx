import React from "react";

export default function MagnifyingGlassRenderer({ data, onSelectNode, selectedNodeId }) {
  const macroNodes = data?.macroView?.nodes || [];
  const drillDown = data?.drillDown || {};
  const findings = drillDown.findings || [];

  return (
    <g className="metaphor-magnifying">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🔍 {data.title || "Magnifying Glass: Forensic Zoom & Section Drill-Down"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Zooming into a specific, highly detailed section of a larger visual layout"}
      </text>

      {/* Left Pane: Macroscopic Overview */}
      <g transform="translate(60, 140)">
        <rect x="0" y="0" width="380" height="380" rx="14" fill="var(--bg-card, #FFFFFF)" stroke="var(--border-subtle, rgba(0,0,0,0.1))" strokeWidth="1.5" />
        <rect x="0" y="0" width="380" height="36" rx="14 14 0 0" fill="#1E293B" />
        <text x="16" y="23" fill="#F8FAFC" fontSize="12.5" fontWeight="700" fontFamily="var(--font-sans)">
          🌐 {data?.macroView?.title || "Macroscopic System Architecture"}
        </text>

        {/* Macro Flow Nodes */}
        {macroNodes.map((node, nIdx) => {
          const ny = 55 + nIdx * 78;
          const isTarget = nIdx === 1; // Target focused under magnifying lens

          return (
            <g key={node.id || nIdx} transform={`translate(20, ${ny})`}>
              <rect
                x="0"
                y="0"
                width="340"
                height="62"
                rx="8"
                fill={isTarget ? "rgba(234, 88, 12, 0.08)" : "var(--bg-surface, #F8FAFC)"}
                stroke={isTarget ? "#EA580C" : "rgba(0,0,0,0.1)"}
                strokeWidth={isTarget ? 2.5 : 1}
                strokeDasharray={isTarget ? "none" : "none"}
              />
              <circle cx="20" cy="31" r="7" fill={isTarget ? "#EA580C" : "#64748B"} />
              <text x="36" y="26" fill="var(--text-primary, #0F172A)" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
                {node.label}
              </text>
              <text x="36" y="44" fill="var(--text-muted, #64748B)" fontSize="11" fontFamily="var(--font-mono)">
                {node.role}
              </text>
              {isTarget && (
                <g transform="translate(240, 20)">
                  <rect x="0" y="0" width="88" height="22" rx="11" fill="#EA580C" />
                  <text x="44" y="15" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                    FOCUS LENS ➔
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Optical Magnifying Glass in the Center / Right */}
      <g transform="translate(480, 150)">
        {/* Connecting Focal Projection Cones */}
        <polygon
          points="0,120 180,60 180,340 0,180"
          fill="rgba(14, 165, 233, 0.12)"
          stroke="rgba(14, 165, 233, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Magnifying Glass Handle (Angled Rosewood / Brass) */}
        <g transform="translate(180, 260) rotate(42)">
          {/* Brass Collar */}
          <rect x="-8" y="90" width="16" height="20" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
          {/* Wooden Fluted Handle */}
          <rect x="-10" y="110" width="20" height="130" rx="10" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          {/* Grip Highlights */}
          <line x1="-3" y1="125" x2="-3" y2="225" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
          {/* End Cap */}
          <circle cx="0" cy="240" r="10" fill="#D97706" />
        </g>

        {/* Outer Heavy Brass Bezel Rim */}
        <circle cx="180" cy="180" r="150" fill="none" stroke="#D97706" strokeWidth="16" />
        <circle cx="180" cy="180" r="156" fill="none" stroke="#78350F" strokeWidth="2" />
        <circle cx="180" cy="180" r="142" fill="none" stroke="#FDE68A" strokeWidth="3" />

        {/* Translucent Optical Lens Interior */}
        <circle
          cx="180"
          cy="180"
          r="140"
          fill="rgba(240, 249, 255, 0.92)"
          stroke="#0284C7"
          strokeWidth="1.5"
        />

        {/* Lens Crosshair Reticle */}
        <line x1="180" y1="45" x2="180" y2="315" stroke="rgba(2, 132, 199, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="45" y1="180" x2="315" y2="180" stroke="rgba(2, 132, 199, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="180" cy="180" r="40" fill="none" stroke="rgba(2, 132, 199, 0.25)" strokeWidth="1" strokeDasharray="2 2" />

        {/* Curved Glare Arc on Lens */}
        <path
          d="M 80 110 A 130 130 0 0 1 270 90"
          fill="none"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Lens Forensic Details Rendered Inside */}
        <g transform="translate(60, 80)">
          <text x="120" y="20" fill="#0369A1" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
            {drillDown.magnification || "400x Forensic View"}
          </text>
          <text x="120" y="38" fill="#0F172A" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-sans)">
            {drillDown.inspectedComponent?.length > 22 ? drillDown.inspectedComponent.slice(0, 22) + ".." : drillDown.inspectedComponent}
          </text>

          {/* Microscopic Findings inside lens */}
          {findings.slice(0, 3).map((f, fIdx) => (
            <g key={fIdx} transform={`translate(15, ${52 + fIdx * 45})`}>
              <rect x="0" y="0" width="210" height="38" rx="6" fill="#FFFFFF" stroke="rgba(14, 165, 233, 0.35)" />
              <circle cx="10" cy="19" r="4" fill={f.severity === "critical" ? "#EF4444" : "#F59E0B"} />
              <text x="20" y="16" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="var(--font-sans)">
                {f.metric}
              </text>
              <text x="20" y="30" fill="#475569" fontSize="10" fontFamily="var(--font-mono)">
                {f.value?.length > 22 ? f.value.slice(0, 22) + ".." : f.value}
              </text>
            </g>
          ))}
        </g>
      </g>

      {/* Right Side: Deep-Dive Findings Dossier */}
      <g transform="translate(860, 140)">
        <rect x="0" y="0" width="300" height="380" rx="14" fill="var(--bg-card, #FFFFFF)" stroke="var(--border-subtle, rgba(0,0,0,0.1))" strokeWidth="1.5" />
        <rect x="0" y="0" width="300" height="36" rx="14 14 0 0" fill="#0F172A" />
        <text x="16" y="23" fill="#F8FAFC" fontSize="12.5" fontWeight="700" fontFamily="var(--font-sans)">
          🔬 Forensic Diagnostic Dossier
        </text>

        <g transform="translate(16, 50)">
          {findings.map((item, idx) => (
            <g
              key={idx}
              transform={`translate(0, ${idx * 60})`}
              onClick={() => onSelectNode && onSelectNode(item, "finding", idx)}
              style={{ cursor: "pointer" }}
            >
              <rect x="0" y="0" width="268" height="52" rx="8" fill="var(--bg-surface, #F8FAFC)" stroke="rgba(0,0,0,0.08)" />
              <rect x="0" y="0" width="4" height="52" rx="2 0 0 2" fill={item.severity === "critical" ? "#EF4444" : (item.severity === "high" ? "#EA580C" : "#10B981")} />
              <text x="14" y="18" fill="var(--text-primary, #0F172A)" fontSize="12" fontWeight="700" fontFamily="var(--font-sans)">
                {item.metric}
              </text>
              <text x="14" y="34" fill="var(--text-muted, #64748B)" fontSize="10.5" fontFamily="var(--font-mono)">
                {item.value?.length > 30 ? item.value.slice(0, 30) + "..." : item.value}
              </text>
              <text x="14" y="47" fill={item.severity === "critical" ? "#EF4444" : "#059669"} fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                Status: {item.status || "Verified"}
              </text>
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}
