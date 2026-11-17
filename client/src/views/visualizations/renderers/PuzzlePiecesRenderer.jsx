import React from "react";

export default function PuzzlePiecesRenderer({ data, onSelectNode, selectedNodeId }) {
  const pieces = data?.pieces || [];
  const interlockCore = data?.interlockCore || "Unified Integrated Core";

  const size = 250;
  const gridPositions = [
    { x: 260, y: 140 }, // Top-Left
    { x: 530, y: 140 }, // Top-Right
    { x: 260, y: 410 }, // Bottom-Left
    { x: 530, y: 410 }  // Bottom-Right
  ];

  return (
    <g className="metaphor-puzzle">
      {/* Title Header */}
      <text x="60" y="60" fill="var(--text-primary, #1C1917)" fontSize="24" fontWeight="800" fontFamily="var(--font-sans, system-ui)">
        🧩 {data.title || "Interlocking System Modules & Jigsaw Architecture"}
      </text>
      <text x="60" y="88" fill="var(--text-muted, #73736C)" fontSize="14" fontFamily="var(--font-sans, system-ui)">
        {data.subtitle || "Interlocking physical puzzle pieces showing how separate modules fit together to form a whole"}
      </text>

      {/* 4 Interlocking Puzzle Pieces */}
      {pieces.slice(0, 4).map((piece, idx) => {
        const pos = gridPositions[idx] || gridPositions[0];
        const isSelected = selectedNodeId === piece.id;
        const color = piece.color || ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"][idx % 4];

        return (
          <g
            key={piece.id || idx}
            onClick={() => onSelectNode && onSelectNode(piece, "piece", idx)}
            style={{ cursor: "pointer" }}
            transform={`translate(${pos.x}, ${pos.y})`}
          >
            {/* Puzzle Piece Shape with Rounded Jigsaw Tabs & Blanks */}
            <rect
              x="0"
              y="0"
              width={size}
              height={size}
              rx="18"
              fill={color}
              stroke="#0F172A"
              strokeWidth={isSelected ? 4 : 2}
              filter="drop-shadow(0 4px 12px rgba(0,0,0,0.12))"
              opacity="0.94"
            />

            {/* Simulated Interlocking Tabs / Connectors */}
            {idx === 0 && (
              /* Male Tab Right & Male Tab Bottom */
              <>
                <circle cx={size} cy={size / 2} r="24" fill={color} stroke="#0F172A" strokeWidth="2" />
                <circle cx={size / 2} cy={size} r="24" fill={color} stroke="#0F172A" strokeWidth="2" />
              </>
            )}
            {idx === 1 && (
              /* Female Slot Left & Male Tab Bottom */
              <>
                <circle cx="0" cy={size / 2} r="24" fill="var(--bg-main, #FAF8F5)" stroke="#0F172A" strokeWidth="2" />
                <circle cx={size / 2} cy={size} r="24" fill={color} stroke="#0F172A" strokeWidth="2" />
              </>
            )}
            {idx === 2 && (
              /* Female Slot Top & Male Tab Right */
              <>
                <circle cx={size / 2} cy="0" r="24" fill="var(--bg-main, #FAF8F5)" stroke="#0F172A" strokeWidth="2" />
                <circle cx={size} cy={size / 2} r="24" fill={color} stroke="#0F172A" strokeWidth="2" />
              </>
            )}
            {idx === 3 && (
              /* Female Slot Top & Female Slot Left */
              <>
                <circle cx={size / 2} cy="0" r="24" fill="var(--bg-main, #FAF8F5)" stroke="#0F172A" strokeWidth="2" />
                <circle cx="0" cy={size / 2} r="24" fill="var(--bg-main, #FAF8F5)" stroke="#0F172A" strokeWidth="2" />
              </>
            )}

            {/* Inner Content Card on Piece */}
            <g transform="translate(24, 28)">
              {/* Piece Position Tag */}
              <rect x="0" y="0" width="80" height="18" rx="9" fill="rgba(0,0,0,0.25)" />
              <text x="40" y="13" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                {piece.position || `Piece #${idx + 1}`}
              </text>

              {/* Title */}
              <text x="0" y="42" fill="#FFFFFF" fontSize="15" fontWeight="800" fontFamily="var(--font-sans)">
                {piece.label?.length > 20 ? piece.label.slice(0, 20) + ".." : piece.label}
              </text>

              {/* Features / Capabilities */}
              <g transform="translate(0, 56)">
                {(piece.features || []).slice(0, 3).map((feat, fIdx) => (
                  <g key={fIdx} transform={`translate(0, ${fIdx * 28})`}>
                    <rect x="0" y="0" width={size - 48} height="24" rx="4" fill="rgba(255,255,255,0.92)" />
                    <circle cx="10" cy="12" r="3" fill={color} />
                    <text x="18" y="16" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-sans)">
                      {feat.length > 24 ? feat.slice(0, 24) + ".." : feat}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          </g>
        );
      })}

      {/* Central Interlocking Keystone Seal */}
      <g transform="translate(520, 400)">
        <circle cx="0" cy="0" r="42" fill="#0F172A" stroke="#FDE68A" strokeWidth="3" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.3))" />
        <circle cx="0" cy="0" r="36" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="0" y="-4" fill="#FDE68A" fontSize="18" textAnchor="middle">★</text>
        <text x="0" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
          CORE FIT
        </text>
      </g>

      {/* Bottom Central Architecture Banner */}
      <g transform="translate(340, 690)">
        <rect x="0" y="0" width="360" height="34" rx="17" fill="var(--bg-card, #FFFFFF)" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="180" y="22" fill="var(--text-primary, #1C1917)" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
          🔗 {interlockCore}
        </text>
      </g>
    </g>
  );
}
