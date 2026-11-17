import React from "react";

export default function SignpostRenderer({ data, onSelectNode, selectedNodeId }) {
  const signs = data?.signs || [];
  const postX = 560;
  const postTopY = 130;
  const postBottomY = 640;

  return (
    <g className="metaphor-signpost">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🪧 {data.title || "Directional Signpost: Strategic Choices & Pathways"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Wooden directional signpost pointing to alternative destinations, categories, and choices"}
      </text>

      {/* Main Upright Wooden Post */}
      <g className="wooden-upright-post">
        {/* Post Finial Top */}
        <polygon points={`${postX - 18},${postTopY} ${postX},${postTopY - 20} ${postX + 18},${postTopY}`} fill="#92400E" />
        {/* Main Post Body */}
        <rect x={postX - 18} y={postTopY} width="36" height={postBottomY - postTopY} fill="#78350F" stroke="#451A03" strokeWidth="2.5" />
        {/* Wood Grain Lines */}
        <line x1={postX - 6} y1={postTopY} x2={postX - 6} y2={postBottomY} stroke="#92400E" strokeWidth="2" opacity="0.6" />
        <line x1={postX + 8} y1={postTopY} x2={postX + 8} y2={postBottomY} stroke="#B45309" strokeWidth="1.5" opacity="0.4" />

        {/* Grass / Ground Stones at Bottom */}
        <ellipse cx={postX} cy={postBottomY} rx="70" ry="18" fill="#15803D" opacity="0.8" />
        <circle cx={postX - 35} cy={postBottomY - 4} r="12" fill="#64748B" />
        <circle cx={postX + 38} cy={postBottomY - 6} r="14" fill="#475569" />
        <circle cx={postX - 10} cy={postBottomY + 4} r="8" fill="#94A3B8" />
      </g>

      {/* Directional Wooden Signs Mounted to Post */}
      {signs.map((sign, idx) => {
        const sy = postTopY + 40 + idx * 130;
        const isLeft = sign.direction === "left";
        const isRight = sign.direction === "right";
        const isForward = sign.direction === "forward" || (!isLeft && !isRight);
        const isSelected = selectedNodeId === sign.id;
        const woodColor = sign.woodTone || (idx % 2 === 0 ? "#854D0E" : "#92400E");

        const signWidth = 360;
        const signHeight = 90;
        const arrowCut = 30;

        let signTransform = "";
        let pathD = "";

        if (isLeft) {
          // Arrow points Left: <--------[
          signTransform = `translate(${postX - signWidth}, ${sy})`;
          pathD = `
            M 0 ${signHeight / 2}
            L ${arrowCut} 0
            L ${signWidth} 0
            L ${signWidth} ${signHeight}
            L ${arrowCut} ${signHeight}
            Z
          `;
        } else if (isRight) {
          // Arrow points Right: ]-------->
          signTransform = `translate(${postX}, ${sy})`;
          pathD = `
            M 0 0
            L ${signWidth - arrowCut} 0
            L ${signWidth} ${signHeight / 2}
            L ${signWidth - arrowCut} ${signHeight}
            L 0 ${signHeight}
            Z
          `;
        } else {
          // Forward / Center Sign
          signTransform = `translate(${postX - signWidth / 2}, ${sy})`;
          pathD = `
            M 0 0
            L ${signWidth} 0
            L ${signWidth - 10} ${signHeight}
            L 10 ${signHeight}
            Z
          `;
        }

        return (
          <g
            key={sign.id || idx}
            onClick={() => onSelectNode && onSelectNode(sign, "sign", idx)}
            style={{ cursor: "pointer" }}
            transform={signTransform}
          >
            {/* The Wooden Board Planks with Carved Edge */}
            <path
              d={pathD}
              fill={woodColor}
              stroke="#451A03"
              strokeWidth={isSelected ? 3.5 : 2}
              filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
            />
            {/* Wood Texture Planks Line */}
            <line x1="20" y1={signHeight / 2} x2={signWidth - 20} y2={signHeight / 2} stroke="#713F12" strokeWidth="1.5" strokeDasharray="6 3" />

            {/* Iron Mounting Bolts / Nails */}
            <circle cx={isLeft ? signWidth - 20 : (isRight ? 20 : signWidth / 2 - 20)} cy="25" r="3.5" fill="#1E293B" stroke="#94A3B8" />
            <circle cx={isLeft ? signWidth - 20 : (isRight ? 20 : signWidth / 2 + 20)} cy="65" r="3.5" fill="#1E293B" stroke="#94A3B8" />

            {/* Sign Text & Destination */}
            <g transform={`translate(${isLeft ? arrowCut + 14 : 26}, 24)`}>
              {/* Destination Name */}
              <text x="0" y="0" fill="#FEF3C7" fontSize="14" fontWeight="800" fontFamily="var(--font-sans)">
                {sign.destination?.length > 24 ? sign.destination.slice(0, 24) + ".." : sign.destination}
              </text>
              {/* Distance / Effort Pill */}
              <g transform="translate(0, 10)">
                <rect x="0" y="0" width="160" height="18" rx="4" fill="rgba(0,0,0,0.3)" />
                <text x="80" y="13" fill="#FDE68A" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                  📍 {sign.distance || "Target Route"}
                </text>
              </g>
              {/* Strategic Trade-Off / Note */}
              <text x="0" y="48" fill="#F8FAFC" fontSize="10.5" fontFamily="var(--font-sans)" opacity="0.9">
                {sign.tradeoff?.length > 34 ? sign.tradeoff.slice(0, 34) + "..." : sign.tradeoff}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
