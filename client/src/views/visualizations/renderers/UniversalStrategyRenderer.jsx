import React from "react";
import { DESIGN_FAMILIES, VISUAL_PATTERNS } from "../engine/strategyPipeline.js";

/**
 * Universal Visual Strategy SVG Renderer
 * Presentation-Grade Vector Engine with 7 Specialized Storytelling Layout Engines:
 * 1. Transformation Bridge / Journey (As-Is -> Bridge -> To-Be)
 * 2. Problem -> Impact -> Recommendation -> ROI Chain
 * 3. Capability Maturity Staircase (Stepped Ascent)
 * 4. 2x2 Strategic Quadrant Matrix
 * 5. Hub-and-Spoke System Ecosystem
 * 6. Layered Enterprise Architecture Stack
 * 7. Cross-Functional Process Swimlanes
 */
export default function UniversalStrategyRenderer({
  data = {},
  onSelectNode = () => {},
  selectedNodeId = null
}) {
  const {
    title = "Enterprise Visual Strategy",
    subtitle = "Reconstructed Business Architecture",
    visualPattern = VISUAL_PATTERNS.CROSS_FUNCTIONAL_SWIMLANE,
    visualType = VISUAL_PATTERNS.CROSS_FUNCTIONAL_SWIMLANE,
    designFamily = "sap_enterprise",
    designTheme = "sap_enterprise",
    lanes = [],
    nodes = [],
    connectors = [],
    legend = [],
    contentUnderstanding = {},
    proposedComposition = {}
  } = data;

  const activePattern = visualPattern || visualType || VISUAL_PATTERNS.CROSS_FUNCTIONAL_SWIMLANE;
  const familyKey = (designFamily || designTheme || "sap_enterprise").toUpperCase();
  const theme = DESIGN_FAMILIES[familyKey] || DESIGN_FAMILIES.SAP_ENTERPRISE;

  const totalWidth = 1180;
  const headerHeight = 115;

  // =========================================================================
  // HELPER: Semantic Node Color Mapping
  // =========================================================================
  const getNodeColors = (node = {}) => {
    const { type = "", status = "", category = "" } = node;
    const cat = category.toLowerCase();
    const stat = status.toUpperCase();

    // Category-specific storytelling tiers
    if (cat === "problem") return { stroke: "#E11D48", fill: "#FFF1F2", badge: "#E11D48", text: "#9F1239" };
    if (cat === "impact") return { stroke: "#D97706", fill: "#FFFBEB", badge: "#D97706", text: "#92400E" };
    if (cat === "recommendation") return { stroke: "#2563EB", fill: "#EFF6FF", badge: "#2563EB", text: "#1E40AF" };
    if (cat === "outcome" || cat === "future") return { stroke: "#059669", fill: "#ECFDF5", badge: "#059669", text: "#065F46" };
    if (cat === "current") return { stroke: "#64748B", fill: "#F8FAFC", badge: "#475569", text: "#1E293B" };
    if (cat === "bridge") return { stroke: "#0891B2", fill: "#F0FDFA", badge: "#0891B2", text: "#155E75" };

    // Semantic shape types
    if (type === "decision") return { stroke: "#F59E0B", fill: "#FFFDF5", badge: "#D97706", text: "#78350F" };
    if (type === "cylinder") return { stroke: "#0284C7", fill: "#F0F9FF", badge: "#0284C7", text: "#075985" };
    if (type === "document") return { stroke: "#8B5CF6", fill: "#FAF5FF", badge: "#7C3AED", text: "#5B21B6" };
    if (type === "terminator") return { stroke: "#10B981", fill: "#ECFDF5", badge: "#059669", text: "#065F46" };

    // Status overrides
    if (stat.includes("FAIL") || stat.includes("ALERT") || stat.includes("BLOCK")) {
      return { stroke: "#EF4444", fill: "#FEF2F2", badge: "#DC2626", text: "#991B1B" };
    }
    if (stat.includes("COMPLET") || stat.includes("PASS") || stat.includes("ACTIVE")) {
      return { stroke: "#10B981", fill: "#F0FDF4", badge: "#059669", text: "#065F46" };
    }

    return { stroke: theme.primary, fill: "#FFFFFF", badge: theme.accent, text: theme.text };
  };

  // =========================================================================
  // RENDERER 1: TRANSFORMATION BRIDGE / JOURNEY
  // =========================================================================
  const renderTransformationBridge = () => {
    const canvasHeight = 620;
    const startY = headerHeight + 25;
    const zoneW = 340;
    const bridgeW = 380;
    const zoneH = canvasHeight - startY - 50;

    const currentNodes = nodes.filter((n) => n.category === "current" || n.laneId === "lane-current");
    const bridgeNodes = nodes.filter((n) => n.category === "bridge" || n.laneId === "lane-bridge");
    const futureNodes = nodes.filter((n) => n.category === "future" || n.laneId === "lane-future");

    return (
      <g>
        {/* Left Zone: As-Is Current State Container */}
        <g transform={`translate(40, ${startY})`}>
          <rect width={zoneW} height={zoneH} rx={14} fill="#FFF8F8" stroke="#FECDD3" strokeWidth={1.5} filter="url(#strat-shadow)" />
          {/* Header */}
          <rect width={zoneW} height={38} rx={14} fill="#FFE4E6" />
          <text x={16} y={24} fontSize={13} fontWeight={800} fill="#9F1239" fontFamily={theme.fontHeading}>
            CURRENT STATE (AS-IS)
          </text>
          <text x={zoneW - 16} y={24} textAnchor="end" fontSize={10} fontWeight={700} fill="#E11D48">
            Baseline Friction
          </text>

          {/* Current Nodes */}
          {currentNodes.map((node, i) => {
            const isSelected = selectedNodeId === node.id;
            const colors = getNodeColors(node);
            const ny = 55 + i * 110;
            return (
              <g
                key={node.id}
                transform={`translate(16, ${ny})`}
                onClick={() => onSelectNode(node, "node", i)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width={zoneW - 32}
                  height={92}
                  rx={8}
                  fill={colors.fill}
                  stroke={isSelected ? theme.accent : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  filter={isSelected ? "url(#strat-glow)" : "url(#strat-shadow)"}
                />
                <rect x={10} y={10} width={80} height={18} rx={4} fill={colors.badge} opacity={0.15} />
                <text x={50} y={22} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.badge}>
                  {node.badge || "AS-IS"}
                </text>
                <text x={10} y={46} fontSize={12.5} fontWeight={750} fill="#1E293B">
                  {node.label}
                </text>
                <text x={10} y={64} fontSize={10.5} fill="#64748B">
                  {node.sublabel}
                </text>
                {node.tcode && (
                  <text x={zoneW - 44} y={23} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#94A3B8">
                    {node.tcode}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Center Zone: Transformation Bridge Path */}
        <g transform={`translate(400, ${startY})`}>
          {/* Bridge Arched Roadway */}
          <path
            d={`M 10 180 Q ${bridgeW / 2} 110 ${bridgeW - 10} 180 L ${bridgeW - 10} 220 Q ${bridgeW / 2} 150 10 220 Z`}
            fill="url(#strat-bridge-grad)"
            opacity={0.85}
          />
          {/* Bridge Suspension Cables */}
          <line x1={bridgeW / 2} y1={50} x2={bridgeW / 2} y2={130} stroke="#0891B2" strokeWidth={2} strokeDasharray="3 3" />
          <line x1={80} y1={90} x2={80} y2={165} stroke="#0891B2" strokeWidth={1.5} strokeDasharray="2 3" opacity={0.6} />
          <line x1={bridgeW - 80} y1={90} x2={bridgeW - 80} y2={165} stroke="#0891B2" strokeWidth={1.5} strokeDasharray="2 3" opacity={0.6} />

          {/* Transformation Bridge Center Card */}
          {bridgeNodes.length > 0 ? (
            bridgeNodes.map((node, i) => {
              const isSelected = selectedNodeId === node.id;
              const colors = getNodeColors(node);
              return (
                <g
                  key={node.id}
                  transform={`translate(35, 75)`}
                  onClick={() => onSelectNode(node, "node", i)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={bridgeW - 70}
                    height={115}
                    rx={12}
                    fill="#FFFFFF"
                    stroke={isSelected ? theme.accent : "#0891B2"}
                    strokeWidth={isSelected ? 2.5 : 2}
                    filter="url(#strat-shadow)"
                  />
                  <rect x={12} y={12} width={130} height={20} rx={5} fill="rgba(8,145,178,0.12)" />
                  <text x={77} y={26} textAnchor="middle" fontSize={10} fontWeight={800} fill="#0891B2">
                    ⚡ {node.badge || "MIGRATION ENGINE"}
                  </text>
                  <text x={14} y={54} fontSize={13} fontWeight={800} fill="#0F172A">
                    {node.label}
                  </text>
                  <text x={14} y={74} fontSize={11} fill="#475569">
                    {node.sublabel}
                  </text>
                  <text x={14} y={96} fontSize={9.5} fill="#0891B2" fontWeight={700}>
                    Nexus Event Mesh & Clean Core Decoupling
                  </text>
                </g>
              );
            })
          ) : (
            <g transform={`translate(40, 95)`}>
              <rect width={bridgeW - 80} height={90} rx={10} fill="#FFFFFF" stroke="#0891B2" strokeWidth={1.5} filter="url(#strat-shadow)" />
              <text x={(bridgeW - 80) / 2} y={38} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#0891B2">
                TRANSFORMATION BRIDGE
              </text>
              <text x={(bridgeW - 80) / 2} y={58} textAnchor="middle" fontSize={10.5} fill="#64748B">
                Clean Core Decoupling & Event Mesh
              </text>
            </g>
          )}

          {/* Directional Bridge Travel Pulse */}
          <circle cx={bridgeW / 2} cy={140} r={5} fill="#F43F5E">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Right Zone: To-Be Target State Container */}
        <g transform={`translate(800, ${startY})`}>
          <rect width={zoneW} height={zoneH} rx={14} fill="#F0FDF4" stroke="#BBF7D0" strokeWidth={1.5} filter="url(#strat-shadow)" />
          {/* Header */}
          <rect width={zoneW} height={38} rx={14} fill="#DCFCE7" />
          <text x={16} y={24} fontSize={13} fontWeight={800} fill="#14532D" fontFamily={theme.fontHeading}>
            TARGET STATE (TO-BE)
          </text>
          <text x={zoneW - 16} y={24} textAnchor="end" fontSize={10} fontWeight={700} fill="#16A34A">
            Autonomous Value
          </text>

          {/* Future Nodes */}
          {futureNodes.map((node, i) => {
            const isSelected = selectedNodeId === node.id;
            const colors = getNodeColors(node);
            const ny = 55 + i * 110;
            return (
              <g
                key={node.id}
                transform={`translate(16, ${ny})`}
                onClick={() => onSelectNode(node, "node", i)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width={zoneW - 32}
                  height={92}
                  rx={8}
                  fill="#FFFFFF"
                  stroke={isSelected ? theme.accent : "#10B981"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  filter={isSelected ? "url(#strat-glow)" : "url(#strat-shadow)"}
                />
                <rect x={10} y={10} width={90} height={18} rx={4} fill="rgba(16,185,129,0.12)" />
                <text x={55} y={22} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#059669">
                  ✓ {node.badge || "TO-BE VALUE"}
                </text>
                <text x={10} y={46} fontSize={12.5} fontWeight={750} fill="#0F172A">
                  {node.label}
                </text>
                <text x={10} y={64} fontSize={10.5} fill="#475569">
                  {node.sublabel}
                </text>
                {node.tcode && (
                  <text x={zoneW - 44} y={23} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#059669">
                    {node.tcode}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </g>
    );
  };

  // =========================================================================
  // RENDERER 2: PROBLEM -> IMPACT -> RECOMMENDATION -> OUTCOME (4 TIERS)
  // =========================================================================
  const renderProblemImpactChain = () => {
    const canvasHeight = 600;
    const startY = headerHeight + 25;
    const tierW = 250;
    const gap = 30;
    const colCount = 4;

    const tiers = [
      { key: "problem", title: "1. PROBLEM / BOTTLENECK", color: "#E11D48", bg: "#FFF1F2", border: "#FECDD3", icon: "⚠️" },
      { key: "impact", title: "2. BUSINESS IMPACT", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "💥" },
      { key: "recommendation", title: "3. STRATEGIC ACTION", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🎯" },
      { key: "outcome", title: "4. EXPECTED VALUE & ROI", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "💎" }
    ];

    return (
      <g>
        {tiers.map((tier, colIdx) => {
          const colX = 35 + colIdx * (tierW + gap);
          const colNodes = nodes.filter(
            (n) => (n.category && n.category.toLowerCase() === tier.key) || Math.floor(nodes.indexOf(n) / 1.5) === colIdx
          );

          return (
            <g key={tier.key} transform={`translate(${colX}, ${startY})`}>
              {/* Column Pillar Background */}
              <rect width={tierW} height={420} rx={12} fill={tier.bg} stroke={tier.border} strokeWidth={1.5} filter="url(#strat-shadow)" />

              {/* Column Header */}
              <rect width={tierW} height={36} rx={12} fill={tier.color} />
              <text x={12} y={22} fontSize={11} fontWeight={800} fill="#FFFFFF" fontFamily={theme.fontHeading}>
                {tier.icon} {tier.title}
              </text>

              {/* Cards in this column */}
              {colNodes.slice(0, 3).map((node, rIdx) => {
                const isSelected = selectedNodeId === node.id;
                const cardY = 50 + rIdx * 115;
                return (
                  <g
                    key={node.id}
                    transform={`translate(10, ${cardY})`}
                    onClick={() => onSelectNode(node, "node", rIdx)}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      width={tierW - 20}
                      height={98}
                      rx={8}
                      fill="#FFFFFF"
                      stroke={isSelected ? theme.accent : tier.color}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      filter={isSelected ? "url(#strat-glow)" : "url(#strat-shadow)"}
                    />
                    <rect x={8} y={8} width={85} height={16} rx={3} fill={tier.color} opacity={0.12} />
                    <text x={50} y={20} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={tier.color}>
                      {node.badge || tier.key.toUpperCase()}
                    </text>
                    <text x={8} y={42} fontSize={12} fontWeight={800} fill="#1E293B">
                      {node.label}
                    </text>
                    <text x={8} y={60} fontSize={10} fill="#64748B">
                      {node.sublabel}
                    </text>
                    {node.tcode && (
                      <text x={tierW - 28} y={20} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#94A3B8">
                        {node.tcode}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Connecting arrow pointing to next column */}
              {colIdx < colCount - 1 && (
                <path
                  d={`M ${tierW + 6} 210 L ${tierW + gap - 6} 210`}
                  stroke={tier.color}
                  strokeWidth={2.5}
                  markerEnd="url(#strat-arrow-solid)"
                />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // =========================================================================
  // RENDERER 3: MATURITY STAIRCASE & PROGRESSION
  // =========================================================================
  const renderMaturityStaircase = () => {
    const canvasHeight = 620;
    const startY = headerHeight + 35;
    const stepCount = Math.max(3, Math.min(5, nodes.length || 4));
    const stepW = 220;
    const stepRise = 70;

    return (
      <g>
        {Array.from({ length: stepCount }).map((_, idx) => {
          const stepX = 50 + idx * stepW;
          const stepY = startY + (stepCount - 1 - idx) * stepRise;
          const node = nodes[idx] || { label: `Maturity Stage ${idx + 1}`, sublabel: "Target Capability Tiers" };
          const isSelected = selectedNodeId === node.id;
          const colors = getNodeColors(node);

          return (
            <g key={`step-${idx}`}>
              {/* Stepped Pedestal Base */}
              <path
                d={`M ${stepX} ${stepY + 120} L ${stepX + stepW - 10} ${stepY + 120} L ${stepX + stepW - 10} ${canvasHeight - 50} L ${stepX} ${canvasHeight - 50} Z`}
                fill={idx === stepCount - 1 ? "#FEF3C7" : "#F1F5F9"}
                stroke="#CBD5E1"
                strokeWidth={1.5}
              />
              {/* Step Top Tread */}
              <line x1={stepX} y1={stepY + 120} x2={stepX + stepW - 10} y2={stepY + 120} stroke={theme.accent} strokeWidth={3} />

              {/* Level Big Watermark */}
              <text x={stepX + stepW / 2 - 10} y={stepY + 200} textAnchor="middle" fontSize={60} fontWeight={900} fill="#E2E8F0" opacity={0.6}>
                0{idx + 1}
              </text>

              {/* Floating Capability Card */}
              <g
                transform={`translate(${stepX}, ${stepY})`}
                onClick={() => onSelectNode(node, "node", idx)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width={stepW - 10}
                  height={110}
                  rx={10}
                  fill="#FFFFFF"
                  stroke={isSelected ? theme.accent : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  filter={isSelected ? "url(#strat-glow)" : "url(#strat-shadow)"}
                />
                <rect x={10} y={10} width={70} height={18} rx={4} fill={colors.badge} opacity={0.15} />
                <text x={45} y={22} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.badge}>
                  LEVEL {idx + 1}
                </text>
                <text x={10} y={48} fontSize={12.5} fontWeight={800} fill="#1E293B">
                  {node.label}
                </text>
                <text x={10} y={68} fontSize={10.5} fill="#64748B">
                  {node.sublabel}
                </text>
                {node.tcode && (
                  <text x={stepW - 22} y={22} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#94A3B8">
                    {node.tcode}
                  </text>
                )}
              </g>

              {/* Ascending Progression Arrow */}
              {idx < stepCount - 1 && (
                <path
                  d={`M ${stepX + stepW - 15} ${stepY + 50} Q ${stepX + stepW + 5} ${stepY - 10} ${stepX + stepW + 5} ${stepY - 20}`}
                  stroke={theme.accent}
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="3 3"
                  markerEnd="url(#strat-arrow-queue)"
                />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // =========================================================================
  // RENDERER 4: 2x2 STRATEGIC QUADRANT MATRIX
  // =========================================================================
  const renderMatrix2x2 = () => {
    const startY = headerHeight + 35;
    const matrixW = 860;
    const matrixH = 460;
    const startX = 160;
    const halfW = matrixW / 2;
    const halfH = matrixH / 2;

    const quadrants = [
      { name: "QUICK WINS (High Impact, Low Effort)", x: startX, y: startY, bg: "#F0FDF4", border: "#BBF7D0", tag: "Priority 1" },
      { name: "STRATEGIC BETS (High Impact, High Effort)", x: startX + halfW, y: startY, bg: "#EFF6FF", border: "#BFDBFE", tag: "Priority 2" },
      { name: "LOW HANGING FRUIT (Low Impact, Low Effort)", x: startX, y: startY + halfH, bg: "#FEFCE8", border: "#FEF08A", tag: "Priority 3" },
      { name: "DE-PRIORITIZE (Low Impact, High Effort)", x: startX + halfW, y: startY + halfH, bg: "#FFF1F2", border: "#FECDD3", tag: "Deprioritize" }
    ];

    return (
      <g>
        {/* Y Axis Label */}
        <text x={100} y={startY + halfH} textAnchor="middle" transform={`rotate(-90 100 ${startY + halfH})`} fontSize={13} fontWeight={800} fill="#475569">
          STRATEGIC IMPACT →
        </text>

        {/* X Axis Label */}
        <text x={startX + halfW} y={startY + matrixH + 35} textAnchor="middle" fontSize={13} fontWeight={800} fill="#475569">
          IMPLEMENTATION EFFORT & COMPLEXITY →
        </text>

        {/* 4 Quadrants */}
        {quadrants.map((q, qIdx) => {
          const qNodes = nodes.filter((_, i) => i % 4 === qIdx);
          return (
            <g key={q.name}>
              <rect x={q.x} y={q.y} width={halfW} height={halfH} fill={q.bg} stroke={q.border} strokeWidth={1.5} />
              <text x={q.x + 16} y={q.y + 24} fontSize={11} fontWeight={800} fill="#1E293B">
                {q.name}
              </text>
              {qNodes.slice(0, 2).map((node, nIdx) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${q.x + 20}, ${q.y + 45 + nIdx * 78})`}
                    onClick={() => onSelectNode(node, "node", nIdx)}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      width={halfW - 40}
                      height={68}
                      rx={8}
                      fill="#FFFFFF"
                      stroke={isSelected ? theme.accent : "#CBD5E1"}
                      strokeWidth={isSelected ? 2.5 : 1}
                      filter="url(#strat-shadow)"
                    />
                    <text x={12} y={28} fontSize={12} fontWeight={750} fill="#0F172A">
                      {node.label}
                    </text>
                    <text x={12} y={48} fontSize={10} fill="#64748B">
                      {node.sublabel}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  // =========================================================================
  // RENDERER 5: HUB AND SPOKE ECOSYSTEM
  // =========================================================================
  const renderHubAndSpoke = () => {
    const cx = totalWidth / 2;
    const cy = headerHeight + 250;
    const radius = 220;
    const satelliteNodes = nodes.slice(1, 7);
    const centerNode = nodes[0] || { label: "Central S/4HANA Core", sublabel: "Enterprise Integration Hub" };

    return (
      <g>
        {/* Radial Conduits */}
        {satelliteNodes.map((node, i) => {
          const angle = (i * (360 / satelliteNodes.length) * Math.PI) / 180;
          const sx = cx + radius * Math.cos(angle);
          const sy = cy + radius * Math.sin(angle);
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={sx}
              y2={sy}
              stroke="#06B6D4"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Orbit Rings */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={1.5} strokeDasharray="3 6" />

        {/* Satellites */}
        {satelliteNodes.map((node, i) => {
          const angle = (i * (360 / satelliteNodes.length) * Math.PI) / 180;
          const sx = cx + radius * Math.cos(angle);
          const sy = cy + radius * Math.sin(angle);
          const isSelected = selectedNodeId === node.id;
          const cardW = 160;
          const cardH = 75;

          return (
            <g
              key={node.id}
              transform={`translate(${sx - cardW / 2}, ${sy - cardH / 2})`}
              onClick={() => onSelectNode(node, "node", i)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width={cardW}
                height={cardH}
                rx={10}
                fill="#FFFFFF"
                stroke={isSelected ? theme.accent : "#0284C7"}
                strokeWidth={isSelected ? 2.5 : 1.5}
                filter="url(#strat-shadow)"
              />
              <text x={cardW / 2} y={30} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="#0F172A">
                {node.label}
              </text>
              <text x={cardW / 2} y={50} textAnchor="middle" fontSize={9.5} fill="#64748B">
                {node.sublabel}
              </text>
            </g>
          );
        })}

        {/* Central Core Engine */}
        <g
          transform={`translate(${cx - 100}, ${cy - 55})`}
          onClick={() => onSelectNode(centerNode, "node", 0)}
          style={{ cursor: "pointer" }}
        >
          <rect
            width={200}
            height={110}
            rx={16}
            fill={theme.primary}
            stroke={theme.accent}
            strokeWidth={3}
            filter="url(#strat-shadow)"
          />
          <text x={100} y={42} textAnchor="middle" fontSize={14} fontWeight={900} fill="#FFFFFF" fontFamily={theme.fontHeading}>
            {centerNode.label}
          </text>
          <text x={100} y={64} textAnchor="middle" fontSize={10.5} fill="#CBD5E1">
            {centerNode.sublabel}
          </text>
          <rect x={40} y={78} width={120} height={18} rx={4} fill={theme.accent} opacity={0.3} />
          <text x={100} y={91} textAnchor="middle" fontSize={9} fontWeight={800} fill="#FDE047">
            ENTERPRISE NUCLEUS
          </text>
        </g>
      </g>
    );
  };

  // =========================================================================
  // RENDERER 6: DEFAULT CROSS-FUNCTIONAL SWIMLANE / PIPELINE
  // =========================================================================
  const renderCrossFunctionalSwimlane = () => {
    const activeLanes = lanes.length > 0 ? lanes : [
      { id: "lane-1", name: "1. Ingestion & Origin Layer" },
      { id: "lane-2", name: "2. Queue & Gateway Layer" },
      { id: "lane-3", name: "3. Core Rules & Execution" }
    ];

    const laneColW = 280;
    const laneGap = 20;
    const startX = 40;
    const startY = headerHeight + 25;
    const laneCount = activeLanes.length;

    // Position nodes within lanes
    const positionedNodes = nodes.map((node, index) => {
      let laneIdx = activeLanes.findIndex((l) => l.id === node.laneId);
      if (laneIdx === -1) laneIdx = index % laneCount;

      const sameLaneNodes = nodes.filter((n, idx) => {
        const lI = activeLanes.findIndex((l) => l.id === n.laneId);
        return (lI === laneIdx || (lI === -1 && idx % laneCount === laneIdx)) && idx < index;
      });

      const nx = startX + laneIdx * (laneColW + laneGap) + 15;
      const nw = laneColW - 30;
      const nh = node.type === "decision" ? 115 : 120;
      const ny = startY + 45 + sameLaneNodes.length * 155;

      return {
        ...node,
        laneIdx,
        computedX: nx,
        computedY: ny,
        width: nw,
        height: nh
      };
    });

    return (
      <g>
        {activeLanes.map((lane, lIdx) => {
          const lx = startX + lIdx * (laneColW + laneGap);
          return (
            <g key={lane.id}>
              <rect x={lx} y={startY} width={laneColW} height={460} rx={10} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4 4" />
              <rect x={lx} y={startY} width={laneColW} height={34} rx={10} fill={theme.surface} />
              <text x={lx + 14} y={startY + 22} fontSize={11.5} fontWeight={800} fill={theme.text} fontFamily={theme.fontHeading}>
                {lane.name}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {positionedNodes.map((node, idx) => {
          const isSelected = selectedNodeId === node.id;
          const colors = getNodeColors(node);
          return (
            <g
              key={node.id}
              transform={`translate(${node.computedX}, ${node.computedY})`}
              onClick={() => onSelectNode(node, "node", idx)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width={node.width}
                height={node.height}
                rx={10}
                fill={colors.fill}
                stroke={isSelected ? theme.accent : colors.stroke}
                strokeWidth={isSelected ? 2.5 : 1.2}
                filter={isSelected ? "url(#strat-glow)" : "url(#strat-shadow)"}
              />
              <rect x={10} y={10} width={80} height={18} rx={4} fill={colors.badge} opacity={0.15} />
              <text x={50} y={22} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={colors.badge}>
                {node.badge || "STEP " + (idx + 1)}
              </text>
              <text x={10} y={48} fontSize={12.5} fontWeight={750} fill="#0F172A">
                {node.label}
              </text>
              <text x={10} y={68} fontSize={10.5} fill="#475569">
                {node.sublabel}
              </text>
              {node.tcode && (
                <text x={node.width - 12} y={23} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#94A3B8">
                  {node.tcode}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // =========================================================================
  // ROUTER: Pick layout based on pattern
  // =========================================================================
  const renderLayoutContent = () => {
    switch (activePattern) {
      case VISUAL_PATTERNS.CURRENT_TO_BE_BRIDGE:
      case VISUAL_PATTERNS.TRANSFORMATION_JOURNEY:
        return renderTransformationBridge();
      case VISUAL_PATTERNS.PROBLEM_IMPACT_RECOMMENDATION:
      case VISUAL_PATTERNS.RADIAL_ISSUE_MAP:
        return renderProblemImpactChain();
      case VISUAL_PATTERNS.MATURITY_STAIRCASE:
        return renderMaturityStaircase();
      case VISUAL_PATTERNS.MATRIX_2X2:
        return renderMatrix2x2();
      case VISUAL_PATTERNS.HUB_AND_SPOKE:
        return renderHubAndSpoke();
      default:
        return renderCrossFunctionalSwimlane();
    }
  };

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 680`}
      width="100%"
      height="100%"
      style={{ display: "block", overflow: "visible", fontFamily: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="strat-shadow" x="-8%" y="-8%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
        <filter id="strat-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={theme.accent} floodOpacity="0.45" />
        </filter>

        <linearGradient id="strat-header-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={theme.primary} />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id="strat-bridge-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        <marker id="strat-arrow-solid" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
        </marker>
        <marker id="strat-arrow-queue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0891B2" />
        </marker>
      </defs>

      {/* Grid Pattern Background */}
      <g opacity="0.08">
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={`g-${i}`} x1="0" y1={i * 30} x2={totalWidth} y2={i * 30} stroke="#94A3B8" strokeDasharray="2 4" strokeWidth="0.8" />
        ))}
      </g>

      {/* Presentation Header Bar */}
      <g transform="translate(40, 25)">
        <rect width={totalWidth - 80} height={70} rx={12} fill="url(#strat-header-grad)" filter="url(#strat-shadow)" />
        <text x={24} y={32} fontSize={18} fontWeight={900} fill="#FFFFFF" fontFamily={theme.fontHeading}>
          {title}
        </text>
        <text x={24} y={52} fontSize={11.5} fill="#CBD5E1">
          {subtitle}
        </text>

        {/* Pattern & Family Badges */}
        <g transform={`translate(${totalWidth - 360}, 20)`}>
          <rect width={130} height={26} rx={6} fill="rgba(255,255,255,0.15)" />
          <text x={65} y={17} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#FDE047">
            {activePattern.replace(/_/g, " ").toUpperCase()}
          </text>
        </g>
        <g transform={`translate(${totalWidth - 215}, 20)`}>
          <rect width={120} height={26} rx={6} fill={theme.accent} />
          <text x={60} y={17} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#FFFFFF">
            {theme.name.slice(0, 16).toUpperCase()}
          </text>
        </g>
      </g>

      {/* Active Storytelling Pattern Layout Content */}
      {renderLayoutContent()}
    </svg>
  );
}
