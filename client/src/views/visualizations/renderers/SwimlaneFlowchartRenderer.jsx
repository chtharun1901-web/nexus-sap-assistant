import React from "react";

/**
 * Presentation-Grade Swimlane Flowchart Vector Renderer
 * Matches the reference styles from Images 2, 3, and 4:
 * 1. Horizontal Swimlanes with vibrant left-side header cards/pills
 * 2. Standard Flowchart Shapes:
 *    - Start / End Terminators (Rounded Pills / Stadium shapes)
 *    - Process Steps (Crisp Rectangles)
 *    - Decision Gates (Rotated Diamonds with Yes/No branches)
 *    - Input / Output (Parallelograms)
 * 3. Directional Flow with Arrowheads & "YES" / "NO" Branch Badges
 * 4. Cross-lane handoffs and exception / correction loopbacks
 */
export default function SwimlaneFlowchartRenderer({
  data = {},
  onSelectNode = () => {},
  selectedNodeId = null
}) {
  const {
    title = "Customer Order Processing System",
    subtitle = "End-to-End Process Flowchart with Decision Branches & Exception Paths",
    lanes = [],
    nodes = [],
    edges = []
  } = data;

  const totalWidth = 1180;
  const headerHeight = 70;
  const startY = headerHeight + 25;

  // Default fallback lanes if none provided
  const activeLanes = lanes && lanes.length > 0 ? lanes : [
    { id: "lane-1", name: "Customer / Front-End", color: "#F59E0B" },
    { id: "lane-2", name: "Sales & Order Desk", color: "#E11D48" },
    { id: "lane-3", name: "Inventory & Warehouse", color: "#0D9488" },
    { id: "lane-4", name: "Logistics & Dispatch", color: "#0284C7" }
  ];

  const laneCount = activeLanes.length;
  const laneHeight = 130;
  const totalCanvasHeight = Math.max(580, startY + laneCount * laneHeight + 60);

  // Layout boundaries
  const laneHeaderWidth = 140;
  const flowStartX = laneHeaderWidth + 30;
  const flowEndX = totalWidth - 40;
  const flowWidth = flowEndX - flowStartX;

  // Compute column slots across flowWidth
  // Count how many horizontal steps we have
  const maxStep = Math.max(
    ...nodes.map((n) => n.step || 1),
    nodes.length > 0 ? nodes.length : 6
  );
  const colCount = Math.max(4, maxStep);
  const colWidth = flowWidth / colCount;

  // Calculate coordinates for each node
  const computedNodes = nodes.map((node, index) => {
    let laneIdx = activeLanes.findIndex((l) => l.id === node.laneId);
    if (laneIdx === -1) laneIdx = index % laneCount;

    const laneY = startY + laneIdx * laneHeight;
    const laneMidY = laneY + laneHeight / 2;

    // Horizontal placement based on step or index
    const step = node.step || (index + 1);
    const colIdx = Math.min(step - 1, colCount - 1);
    const centerX = flowStartX + colIdx * colWidth + colWidth / 2;

    // Sizing based on type
    const type = (node.type || "process").toLowerCase();
    let w = 150;
    let h = 48;

    if (type === "decision") {
      w = 120;
      h = 60;
    } else if (type === "start" || type === "end" || type === "end_error") {
      w = 140;
      h = 44;
    } else if (type === "io") {
      w = 155;
      h = 46;
    }

    const x = centerX - w / 2;
    const y = laneMidY - h / 2;

    return {
      ...node,
      laneIdx,
      centerX,
      centerY: laneMidY,
      x,
      y,
      w,
      h,
      type
    };
  });

  // Map of nodes by ID for fast connector routing
  const nodeMap = {};
  computedNodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  // Helper colors for node shapes
  const getNodeFill = (node) => {
    const lane = activeLanes[node.laneIdx] || activeLanes[0];
    const type = node.type;

    if (type === "start") return "#84CC16"; // Lime / Light green start
    if (type === "end") return "#10B981"; // Emerald complete
    if (type === "end_error") return "#F43F5E"; // Rose / Coral rejection
    if (type === "decision") return "#F59E0B"; // Vibrant Gold / Amber diamond
    if (type === "io") return "#FB923C"; // Orange parallelogram
    return lane.color || "#0284C7"; // Process step inherits lane color
  };

  return (
    <svg
      id="nexus-flowchart-svg"
      viewBox={`0 0 ${totalWidth} ${totalCanvasHeight}`}
      width="100%"
      height="100%"
      style={{
        display: "block",
        background: "#FFFFFF",
        fontFamily: "'Aptos', sans-serif",
        userSelect: "none"
      }}
    >
      <defs>
        {/* Directional Arrowheads */}
        <marker
          id="fc-arrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748B" />
        </marker>

        <marker
          id="fc-arrow-yes"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#10B981" />
        </marker>

        <marker
          id="fc-arrow-no"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#E11D48" />
        </marker>

        {/* Node Selection Glow */}
        <filter id="fc-node-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.15" />
        </filter>
        <filter id="fc-active-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#2563EB" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* ── 1. Flowchart Header ── */}
      <g transform="translate(40, 32)">
        <text
          x="0"
          y="0"
          fontSize="18"
          fontWeight="800"
          fill="#111827"
          letterSpacing="-0.01em"
        >
          {title}
        </text>
        <text
          x="0"
          y="18"
          fontSize="12"
          fontWeight="500"
          fill="#6B7280"
        >
          {subtitle}
        </text>
      </g>

      {/* ── 2. Horizontal Swimlanes ── */}
      <g className="swimlanes-layer">
        {activeLanes.map((lane, lIdx) => {
          const ly = startY + lIdx * laneHeight;
          const isEven = lIdx % 2 === 0;

          return (
            <g key={lane.id || `lane-${lIdx}`}>
              {/* Lane Row Background Band */}
              <rect
                x="40"
                y={ly}
                width={totalWidth - 80}
                height={laneHeight}
                fill={isEven ? "#FFFFFF" : "#F8FAFC"}
                stroke="#E2E8F0"
                strokeWidth="1"
              />

              {/* Left-Side Colored Swimlane Header Card (Images 2 & 4 style) */}
              <rect
                x="40"
                y={ly}
                width={laneHeaderWidth}
                height={laneHeight}
                fill={lane.color || "#0F172A"}
              />

              {/* Lane Title Text */}
              <text
                x={40 + laneHeaderWidth / 2}
                y={ly + laneHeight / 2}
                fill="#FFFFFF"
                fontSize="12.5"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ letterSpacing: "0.02em" }}
              >
                {lane.name}
              </text>
            </g>
          );
        })}
      </g>

      {/* ── 3. Flowchart Connectors (with Yes/No Badges) ── */}
      <g className="connectors-layer">
        {edges.map((edge, eIdx) => {
          const source = nodeMap[edge.from || edge.source];
          const target = nodeMap[edge.to || edge.target];
          if (!source || !target) return null;

          const label = (edge.label || edge.condition || "").toUpperCase().trim();
          const isYes = label === "YES" || label === "Y" || label === "TRUE" || label === "PASS";
          const isNo = label === "NO" || label === "N" || label === "FALSE" || label === "FAIL" || label === "REJECT";

          const strokeColor = isYes ? "#10B981" : isNo ? "#E11D48" : "#64748B";
          const markerEnd = isYes ? "url(#fc-arrow-yes)" : isNo ? "url(#fc-arrow-no)" : "url(#fc-arrow)";

          // Calculate start and end connection points
          let startPt = { x: source.x + source.w, y: source.centerY }; // Default right exit
          let endPt = { x: target.x, y: target.centerY }; // Default left entrance

          // If target is in a lower lane, decision "NO" or cross-lane branch can exit bottom
          if (isNo && source.type === "decision") {
            startPt = { x: source.centerX, y: source.y + source.h }; // bottom exit of diamond
            if (target.centerX === source.centerX) {
              endPt = { x: target.centerX, y: target.y };
            } else if (target.centerX > source.centerX) {
              endPt = { x: target.x, y: target.centerY };
            } else {
              endPt = { x: target.x + target.w, y: target.centerY };
            }
          }

          // Path generation
          let pathD = "";
          let labelPos = null;

          // Straight horizontal line in same lane
          if (source.laneIdx === target.laneIdx && Math.abs(startPt.y - endPt.y) < 6) {
            pathD = `M ${startPt.x} ${startPt.y} L ${endPt.x - 2} ${endPt.y}`;
            labelPos = { x: (startPt.x + endPt.x) / 2, y: startPt.y - 10 };
          }
          // Straight vertical drop
          else if (Math.abs(startPt.x - endPt.x) < 6) {
            pathD = `M ${startPt.x} ${startPt.y} L ${endPt.x} ${endPt.y - 2}`;
            labelPos = { x: startPt.x + 14, y: (startPt.y + endPt.y) / 2 };
          }
          // Cross-lane stepped elbow
          else {
            const midX = startPt.x + (endPt.x - startPt.x) * 0.45;
            pathD = `M ${startPt.x} ${startPt.y} L ${midX} ${startPt.y} L ${midX} ${endPt.y} L ${endPt.x - 2} ${endPt.y}`;
            labelPos = { x: startPt.x + 18, y: startPt.y - 10 };
          }

          return (
            <g key={`edge-${eIdx}`}>
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isYes || isNo ? 2 : 1.75}
                markerEnd={markerEnd}
              />

              {/* Branch Condition Label (YES / NO Pill) */}
              {label && labelPos && (
                <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
                  <rect
                    x="-16"
                    y="-9"
                    width="32"
                    height="18"
                    rx="9"
                    fill={isYes ? "#ECFDF5" : isNo ? "#FFF1F2" : "#F1F5F9"}
                    stroke={isYes ? "#10B981" : isNo ? "#E11D48" : "#94A3B8"}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="1"
                    fontSize="9.5"
                    fontWeight="800"
                    fill={isYes ? "#059669" : isNo ? "#E11D48" : "#475569"}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* ── 4. Flowchart Node Shapes ── */}
      <g className="nodes-layer">
        {computedNodes.map((node, idx) => {
          const isSelected = selectedNodeId === node.id;
          const fill = getNodeFill(node);
          const type = node.type;

          // Text wrapping helper
          const label = node.label || node.title || `Step ${idx + 1}`;
          const words = label.split(" ");
          let line1 = label;
          let line2 = "";

          if (label.length > 18 && words.length > 1) {
            const mid = Math.ceil(words.length / 2);
            line1 = words.slice(0, mid).join(" ");
            line2 = words.slice(mid).join(" ");
          }

          return (
            <g
              key={node.id || `fn-${idx}`}
              onClick={() => onSelectNode(node, "flowchart_node", idx)}
              style={{ cursor: "pointer" }}
              filter={isSelected ? "url(#fc-active-glow)" : "url(#fc-node-shadow)"}
            >
              {/* SHAPE 1: Decision Diamond (Images 2, 3, 4 style) */}
              {type === "decision" ? (
                <g>
                  <polygon
                    points={`
                      ${node.centerX},${node.y}
                      ${node.x + node.w},${node.centerY}
                      ${node.centerX},${node.y + node.h}
                      ${node.x},${node.centerY}
                    `}
                    fill={fill}
                    stroke={isSelected ? "#1E293B" : "none"}
                    strokeWidth={isSelected ? 2.5 : 0}
                  />
                  {line2 ? (
                    <text
                      x={node.centerX}
                      y={node.centerY - 6}
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="750"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      <tspan x={node.centerX} dy="0">{line1}</tspan>
                      <tspan x={node.centerX} dy="13">{line2}</tspan>
                    </text>
                  ) : (
                    <text
                      x={node.centerX}
                      y={node.centerY}
                      fill="#FFFFFF"
                      fontSize="11.5"
                      fontWeight="750"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {line1}
                    </text>
                  )}
                </g>
              ) : type === "start" || type === "end" || type === "end_error" ? (
                /* SHAPE 2: Terminator Stadium Pill (Start / End) */
                <g>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx="22"
                    ry="22"
                    fill={fill}
                    stroke={isSelected ? "#1E293B" : "none"}
                    strokeWidth={isSelected ? 2.5 : 0}
                  />
                  <text
                    x={node.centerX}
                    y={node.centerY}
                    fill="#FFFFFF"
                    fontSize="11.5"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {label}
                  </text>
                </g>
              ) : type === "io" ? (
                /* SHAPE 3: Input / Output Parallelogram */
                <g>
                  <polygon
                    points={`
                      ${node.x + 14},${node.y}
                      ${node.x + node.w},${node.y}
                      ${node.x + node.w - 14},${node.y + node.h}
                      ${node.x},${node.y + node.h}
                    `}
                    fill={fill}
                    stroke={isSelected ? "#1E293B" : "none"}
                    strokeWidth={isSelected ? 2.5 : 0}
                  />
                  {line2 ? (
                    <text
                      x={node.centerX}
                      y={node.centerY - 5}
                      fill="#FFFFFF"
                      fontSize="11.5"
                      fontWeight="750"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      <tspan x={node.centerX} dy="0">{line1}</tspan>
                      <tspan x={node.centerX} dy="13">{line2}</tspan>
                    </text>
                  ) : (
                    <text
                      x={node.centerX}
                      y={node.centerY}
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="750"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {line1}
                    </text>
                  )}
                </g>
              ) : (
                /* SHAPE 4: Process Task Rectangle */
                <g>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx="4"
                    ry="4"
                    fill={fill}
                    stroke={isSelected ? "#1E293B" : "none"}
                    strokeWidth={isSelected ? 2.5 : 0}
                  />
                  {line2 ? (
                    <text
                      x={node.centerX}
                      y={node.centerY - 6}
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      <tspan x={node.centerX} dy="0">{line1}</tspan>
                      <tspan x={node.centerX} dy="14">{line2}</tspan>
                    </text>
                  ) : (
                    <text
                      x={node.centerX}
                      y={node.centerY}
                      fill="#FFFFFF"
                      fontSize="12.5"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {line1}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
