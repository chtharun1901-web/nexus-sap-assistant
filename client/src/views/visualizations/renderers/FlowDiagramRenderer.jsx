import React from "react";

/**
 * Opus 5.5-Grade Vector Flow & Pipeline Diagram Renderer
 * Features:
 * - Multi-stage swimlane architecture with glassmorphic cards
 * - Decision bifurcations (conditional branches & audit forks)
 * - Animated data-flow pulses traveling along connector conduits
 * - Technical metadata tags (SAP T-codes, queue IDs, tables, latencies)
 * - Fully vector, scalable & standalone downloadable as SVG/PNG
 */
export default function FlowDiagramRenderer({
  data = {},
  onSelectNode = () => {},
  selectedNodeId = null
}) {
  const {
    title = "System Flow & Pipeline Architecture",
    subtitle = "End-to-End Process Flow (Opus 5.5 Architectural Vector)",
    stages = [],
    nodes = [],
    connections = []
  } = data;

  const defaultStages = [
    { id: "st-1", name: "1. Order Ingestion", lane: "Origin Layer" },
    { id: "st-2", name: "2. Queue & Gateway", lane: "Integration Layer" },
    { id: "st-3", name: "3. Compliance & Rules", lane: "Decision Layer" },
    { id: "st-4", name: "4. Execution & Post", lane: "Execution Layer" }
  ];

  const activeStages = stages.length > 0 ? stages : defaultStages;

  // Group nodes by stage
  const stageColWidth = 220;
  const stageGap = 20;
  const startX = 40;
  const startY = 130;

  // Assign computed positions to each node
  const computedNodes = nodes.map((node, index) => {
    let stageIndex = activeStages.findIndex((s) => s.id === node.stageId);
    if (stageIndex === -1) {
      stageIndex = Math.min(index % activeStages.length, activeStages.length - 1);
    }

    // Count how many nodes precede this one in the same stage
    const sameStageNodes = nodes.filter((n, idx) => {
      const sIdx = activeStages.findIndex((s) => s.id === n.stageId);
      return (sIdx === stageIndex || (sIdx === -1 && Math.min(idx % activeStages.length, activeStages.length - 1) === stageIndex)) && idx < index;
    });

    const colX = startX + stageIndex * (stageColWidth + stageGap);
    const nodeY = startY + 36 + sameStageNodes.length * 155;

    return {
      ...node,
      computedX: colX,
      computedY: nodeY,
      width: stageColWidth,
      height: 125,
      stageIndex
    };
  });

  // Calculate dynamic SVG height based on maximum nodes in any stage
  const maxNodesInStage = activeStages.reduce((max, stage, sIdx) => {
    const count = computedNodes.filter((n) => n.stageIndex === sIdx).length;
    return Math.max(max, count);
  }, 1);
  const svgHeight = Math.max(620, startY + 50 + maxNodesInStage * 165);

  const getStatusColor = (status = "") => {
    const s = status.toUpperCase();
    if (s.includes("COMPLETE") || s.includes("PASSED") || s.includes("CLEARED")) return "#10B981";
    if (s.includes("ACTIVE") || s.includes("BUFFER") || s.includes("IN-FLIGHT")) return "#3B82F6";
    if (s.includes("DECISION") || s.includes("ALERT") || s.includes("WARN")) return "#F59E0B";
    if (s.includes("FAIL") || s.includes("BLOCK") || s.includes("ERROR")) return "#EF4444";
    return "#8B5CF6";
  };

  const getCategoryColor = (category = "") => {
    const c = category.toUpperCase();
    if (c.includes("ORIGIN") || c.includes("TRIGGER")) return "#6366F1";
    if (c.includes("QUEUE") || c.includes("RFC")) return "#06B6D4";
    if (c.includes("DECISION")) return "#F59E0B";
    if (c.includes("EXEC") || c.includes("POST")) return "#10B981";
    if (c.includes("EVENT")) return "#EC4899";
    return "#8B5CF6";
  };

  return (
    <svg
      viewBox={`0 0 1020 ${svgHeight}`}
      width="100%"
      height="100%"
      style={{ display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Gradients */}
        <linearGradient id="flow-card-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="flow-header-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Pulse Conduit Gradient */}
        <linearGradient id="conduit-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Arrowhead Markers */}
        <marker
          id="flow-arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748B" />
        </marker>

        <marker
          id="flow-arrow-success"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
        </marker>

        <marker
          id="flow-arrow-alert"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" />
        </marker>

        {/* Filters */}
        <filter id="flow-shadow" x="-8%" y="-8%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
        <filter id="flow-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#6366F1" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Grid Pattern / Sub-grid */}
      <g opacity="0.15">
        {Array.from({ length: 25 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="20"
            y1={i * 30}
            x2="1000"
            y2={i * 30}
            stroke="#94A3B8"
            strokeDasharray="2 4"
            strokeWidth="0.8"
          />
        ))}
      </g>

      {/* Title & Header Banner */}
      <g id="flow-diagram-header">
        <rect
          x="30"
          y="18"
          width="960"
          height="80"
          rx="12"
          fill="url(#flow-header-grad)"
          filter="url(#flow-shadow)"
        />
        <text
          x="55"
          y="48"
          fill="#FFFFFF"
          fontSize="21"
          fontWeight="850"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.02em"
        >
          {title}
        </text>
        <text
          x="55"
          y="72"
          fill="rgba(255,255,255,0.85)"
          fontSize="12.5"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {subtitle}
        </text>

        {/* Live Architecture Tag */}
        <rect x="800" y="32" width="165" height="28" rx="14" fill="rgba(255,255,255,0.18)" />
        <circle cx="818" cy="46" r="4.5" fill="#34D399">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <text
          x="830"
          y="50"
          fill="#FFFFFF"
          fontSize="10.5"
          fontWeight="750"
          fontFamily="monospace"
        >
          OPUS 5.5 PIPELINE
        </text>
      </g>

      {/* Swimlane Columns */}
      {activeStages.map((stage, sIdx) => {
        const laneX = startX + sIdx * (stageColWidth + stageGap);
        const laneHeight = svgHeight - startY - 30;

        return (
          <g key={stage.id || `stage-${sIdx}`} id={`lane-${stage.id}`}>
            {/* Lane Backdrop */}
            <rect
              x={laneX}
              y={startY}
              width={stageColWidth}
              height={laneHeight}
              rx="10"
              fill="#FFFFFF"
              fillOpacity="0.45"
              stroke="#E2E8F0"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />

            {/* Lane Header Pill */}
            <rect
              x={laneX + 8}
              y={startY + 8}
              width={stageColWidth - 16}
              height="24"
              rx="6"
              fill="#F1F5F9"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
            <text
              x={laneX + stageColWidth / 2}
              y={startY + 23}
              textAnchor="middle"
              fill="#334155"
              fontSize="11"
              fontWeight="750"
              fontFamily="system-ui, sans-serif"
            >
              {stage.name}
            </text>
          </g>
        );
      })}

      {/* Connecting Flow Conduits */}
      <g id="flow-connections">
        {connections.map((conn, cIdx) => {
          const fromNode = computedNodes.find((n) => n.id === conn.from);
          const toNode = computedNodes.find((n) => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const p1x = fromNode.computedX + fromNode.width;
          const p1y = fromNode.computedY + fromNode.height / 2;
          const p2x = toNode.computedX;
          const p2y = toNode.computedY + toNode.height / 2;

          const dx = p2x - p1x;
          const c1x = p1x + dx * 0.5;
          const c1y = p1y;
          const c2x = p1x + dx * 0.5;
          const c2y = p2y;

          const pathD = `M ${p1x} ${p1y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2x} ${p2y}`;

          const isSuccess = conn.type === "success";
          const isAlert = conn.type === "alert" || conn.type === "failure";
          const strokeColor = isSuccess ? "#10B981" : isAlert ? "#F59E0B" : "#64748B";
          const markerId = isSuccess ? "url(#flow-arrow-success)" : isAlert ? "url(#flow-arrow-alert)" : "url(#flow-arrow-default)";

          // Label center
          const labelX = (p1x + p2x) / 2;
          const labelY = (p1y + p2y) / 2 - 8;

          return (
            <g key={`conn-${cIdx}`}>
              {/* Underlying glow path */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="4"
                strokeOpacity="0.12"
              />

              {/* Main Conduit Line */}
              <path
                id={`flow-path-${cIdx}`}
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray={isSuccess ? "none" : "5 3"}
                markerEnd={markerId}
              />

              {/* Animated Data-Flow Pulse Traveling Along Path */}
              <circle r="3.5" fill={isSuccess ? "#10B981" : "#6366F1"}>
                <animateMotion
                  path={pathD}
                  dur="2.5s"
                  repeatCount="indefinite"
                  begin={`${cIdx * 0.4}s`}
                />
              </circle>

              {/* Conduit Label Chip */}
              {conn.label && (
                <g>
                  <rect
                    x={labelX - (conn.label.length * 3.5 + 8)}
                    y={labelY - 9}
                    width={conn.label.length * 7 + 16}
                    height="17"
                    rx="4"
                    fill="#FFFFFF"
                    stroke={strokeColor}
                    strokeWidth="0.8"
                    filter="url(#flow-shadow)"
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    fill={strokeColor}
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {conn.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Nodes Render */}
      <g id="flow-nodes">
        {computedNodes.map((node, nIdx) => {
          const isSelected = selectedNodeId === node.id;
          const statusColor = getStatusColor(node.status);
          const categoryColor = getCategoryColor(node.category);
          const isDecision = !!node.isDecision;

          return (
            <g
              key={node.id || `node-${nIdx}`}
              id={node.id}
              onClick={() => onSelectNode(node, "flow_node", nIdx)}
              style={{ cursor: "pointer" }}
              transform={`translate(${node.computedX}, ${node.computedY})`}
              filter={isSelected ? "url(#flow-glow)" : "url(#flow-shadow)"}
            >
              {/* Card Container */}
              <rect
                x="0"
                y="0"
                width={node.width}
                height={node.height}
                rx={isDecision ? "16" : "10"}
                fill="url(#flow-card-grad)"
                stroke={isSelected ? "#6366F1" : isDecision ? "#F59E0B" : "#CBD5E1"}
                strokeWidth={isSelected ? "2.5" : isDecision ? "2" : "1.2"}
              />

              {/* Top Accent Strip */}
              <path
                d={
                  isDecision
                    ? `M 0 16 A 16 16 0 0 1 16 0 L ${node.width - 16} 0 A 16 16 0 0 1 ${node.width} 16 L ${node.width} 5 L 0 5 Z`
                    : `M 0 10 A 10 10 0 0 1 10 0 L ${node.width - 10} 0 A 10 10 0 0 1 ${node.width} 10 L ${node.width} 4 L 0 4 Z`
                }
                fill={categoryColor}
              />

              {/* Category Pill + Status Chip */}
              <g transform="translate(10, 14)">
                {/* Category Pill */}
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="16"
                  rx="4"
                  fill={`${categoryColor}18`}
                  stroke={categoryColor}
                  strokeWidth="0.8"
                />
                <text
                  x="35"
                  y="11.5"
                  textAnchor="middle"
                  fill={categoryColor}
                  fontSize="8.5"
                  fontWeight="800"
                  fontFamily="monospace"
                >
                  {node.category || "PROCESS"}
                </text>

                {/* Status Dot + Text */}
                <g transform="translate(110, 0)">
                  <circle cx="0" cy="8" r="3.5" fill={statusColor} />
                  <text
                    x="7"
                    y="11.5"
                    fill="#475569"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {node.status || "READY"}
                  </text>
                </g>
              </g>

              {/* Node Title with Icon */}
              <text
                x="12"
                y="52"
                fill="#0F172A"
                fontSize="12.5"
                fontWeight="750"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {node.icon ? `${node.icon} ` : ""}{node.title.length > 22 ? node.title.slice(0, 20) + "..." : node.title}
              </text>

              {/* Description preview */}
              <text
                x="12"
                y="71"
                fill="#64748B"
                fontSize="10"
                fontFamily="system-ui, sans-serif"
                style={{ lineClamp: 2 }}
              >
                {node.desc ? node.desc.slice(0, 34) + (node.desc.length > 34 ? "..." : "") : "Pipeline execution node"}
              </text>

              {/* T-Code / Technical Key Footer Badge */}
              <g transform="translate(12, 92)">
                <rect
                  x="0"
                  y="0"
                  width={node.width - 24}
                  height="20"
                  rx="4"
                  fill="#F1F5F9"
                  stroke="#E2E8F0"
                  strokeWidth="0.8"
                />
                <text
                  x="8"
                  y="13.5"
                  fill="#1E293B"
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  ⚙️ {node.tcode || node.badge || "S/4HANA bgRFC"}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
