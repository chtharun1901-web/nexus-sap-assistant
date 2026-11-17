import React from "react";

/**
 * Enterprise Hierarchy Vector Renderer
 * Matches the authoritative presentation style from media_1790856010304.png:
 * - Level 1 (Top): Vibrant Red (#E50000) solid box with bold white text
 * - Level 2: Royal Blue (#0066CC) solid boxes with bold white text
 * - Level 3: Bright Cyan (#00AEEF) solid boxes with bold white text
 * - Level 4: Magenta (#D500A3) solid boxes with bold white text
 * - Level 5+: Amber (#FF7700) or Emerald (#00A86B)
 * - Right Column: Dedicated column with crisp GREEN-bordered white boxes (#5CA838)
 *   aligned with each tier row showing the semantic level name (e.g. Company, Sales Organization, Dist. Channel, Division).
 * - Connectors:
 *   - "tree" mode (Intelligent Adaptive): Direct 1-to-1 drops when aligned, or localized subtree forks for specific parents.
 *   - "bus" mode: Shared horizontal trunk spine across the tier.
 */
export default function EnterpriseHierarchyRenderer({
  data = {},
  onSelectNode = () => {},
  selectedNodeId = null
}) {
  const {
    title = "Enterprise Organizational & Process Hierarchy",
    subtitle = "Multi-Tier Content-Aware Visual Structure",
    levels = [],
    layoutStyle = "tree" // "tree" (adaptive tree branches) or "bus" (shared distribution spine)
  } = data;

  const totalWidth = 1180;
  const headerHeight = 70;
  const rowSpacing = 118;
  const startY = headerHeight + 35;
  const boxHeight = 52;

  // Calculate dynamic canvas height based on number of levels
  const effectiveLevels = levels && levels.length > 0 ? levels : [
    {
      levelIndex: 1,
      levelName: "Company",
      color: "#E50000",
      nodes: [{ id: "n1-1", label: "ABC Corporation", parentId: null }]
    },
    {
      levelIndex: 2,
      levelName: "Sales Organization",
      color: "#0066CC",
      nodes: [
        { id: "n2-1", label: "Local Sales Organization", parentId: "n1-1" },
        { id: "n2-2", label: "Institutional Sales Organization", parentId: "n1-1" },
        { id: "n2-3", label: "Export Sales Organization", parentId: "n1-1" }
      ]
    },
    {
      levelIndex: 3,
      levelName: "Dist. Channel",
      color: "#00AEEF",
      nodes: [
        { id: "n3-1", label: "Direct Sales", parentId: "n2-1" },
        { id: "n3-2", label: "Wholesale Distribution", parentId: "n2-1" },
        { id: "n3-3", label: "Retail Sales", parentId: "n2-2" },
        { id: "n3-4", label: "Online Sales", parentId: "n2-3" }
      ]
    },
    {
      levelIndex: 4,
      levelName: "Division",
      color: "#D500A3",
      nodes: [
        { id: "n4-1", label: "Home appliances", parentId: "n3-1" },
        { id: "n4-2", label: "Tablets", parentId: "n3-2" },
        { id: "n4-3", label: "Smartphones", parentId: "n3-3" },
        { id: "n4-4", label: "Laptops", parentId: "n3-4" }
      ]
    }
  ];

  // Dynamic canvas height with generous bottom padding so 5+ levels are never clipped
  const totalHeight = Math.max(580, startY + effectiveLevels.length * rowSpacing + 85);

  // Layout boundaries
  const mainDiagramLeft = 50;
  const mainDiagramRight = 890;
  const mainDiagramWidth = mainDiagramRight - mainDiagramLeft; // 840px
  const rightColumnX = 930;
  const rightColumnWidth = 185;

  // Tier color mapping
  const getTierColor = (index, userColor) => {
    if (userColor) return userColor;
    if (index === 0) return "#E50000"; // Red
    if (index === 1) return "#0066CC"; // Royal Blue
    if (index === 2) return "#00AEEF"; // Bright Cyan
    if (index === 3) return "#D500A3"; // Magenta
    if (index === 4) return "#FF7700"; // Amber
    return "#00A86B"; // Emerald
  };

  // Pre-calculate positions for all nodes across levels
  const computedLevels = effectiveLevels.map((lvl, lIdx) => {
    const rowY = startY + lIdx * rowSpacing;
    const count = lvl.nodes?.length || 1;
    const tierColor = getTierColor(lIdx, lvl.color);

    // Dynamic width per node based on count
    let nodeW = 185;
    if (count === 1) nodeW = 230;
    else if (count === 2) nodeW = 210;
    else if (count === 3) nodeW = 195;
    else if (count === 4) nodeW = 175;
    else if (count >= 5) nodeW = Math.max(125, Math.floor(mainDiagramWidth / count) - 16);

    const totalNodesWidth = count * nodeW;
    const availableSpace = mainDiagramWidth - totalNodesWidth;
    const gap = count > 1 ? availableSpace / (count - 1) : 0;

    const computedNodes = (lvl.nodes || []).map((node, nIdx) => {
      let nodeX;
      if (count === 1) {
        nodeX = mainDiagramLeft + (mainDiagramWidth - nodeW) / 2;
      } else {
        nodeX = mainDiagramLeft + nIdx * (nodeW + gap);
      }

      return {
        ...node,
        x: nodeX,
        y: rowY,
        width: nodeW,
        height: boxHeight,
        color: tierColor,
        levelIndex: lIdx + 1
      };
    });

    return {
      ...lvl,
      levelIndex: lIdx + 1,
      color: tierColor,
      rowY,
      nodes: computedNodes
    };
  });

  return (
    <svg
      id="nexus-hierarchy-svg"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
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
        {/* Blue Arrowhead */}
        <marker
          id="arrow-blue"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#0066CC" />
        </marker>

        {/* Orange Arrowhead */}
        <marker
          id="arrow-orange"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#E65100" />
        </marker>

        {/* Navy Arrowhead */}
        <marker
          id="arrow-navy"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#0A2540" />
        </marker>

        {/* Subtle drop shadow for hover selection */}
        <filter id="node-active-shadow" x="-8%" y="-8%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* ── 1. Top Header (Clean Minimalist Title & Subtitle) ── */}
      <g transform="translate(50, 32)">
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

      {/* ── 2. Hierarchical Inter-Level Connectors (Intelligent & Adaptive) ── */}
      <g className="connectors-layer">
        {computedLevels.map((lvl, lIdx) => {
          if (lIdx === computedLevels.length - 1) return null; // No connectors from bottom tier
          const nextLvl = computedLevels[lIdx + 1];
          if (!nextLvl || !nextLvl.nodes || nextLvl.nodes.length === 0) return null;

          const isLowerTier = lIdx >= 2;
          const strokeColor = isLowerTier ? "#E65100" : "#0066CC";
          const arrowMarker = isLowerTier ? "url(#arrow-orange)" : "url(#arrow-blue)";

          // ── Case A: Single Parent (Level 1 or any single-node tier) ──
          if (lvl.nodes.length === 1) {
            const parent = lvl.nodes[0];
            const parentCenterX = parent.x + parent.width / 2;
            const parentBottomY = parent.y + parent.height;

            // If next level ALSO has 1 node: direct straight vertical line
            if (nextLvl.nodes.length === 1) {
              const child = nextLvl.nodes[0];
              const childCenterX = child.x + child.width / 2;
              return (
                <line
                  key={`line-1-to-1-${lIdx}`}
                  x1={parentCenterX}
                  y1={parentBottomY}
                  x2={childCenterX}
                  y2={child.y - 1}
                  stroke={strokeColor}
                  strokeWidth="2"
                  markerEnd={arrowMarker}
                />
              );
            }

            // Single parent branching into multiple children (e.g. 1 parent -> 3 children)
            const busY = parentBottomY + 22;
            const nextMinX = nextLvl.nodes[0].x + nextLvl.nodes[0].width / 2;
            const nextMaxX = nextLvl.nodes[nextLvl.nodes.length - 1].x + nextLvl.nodes[nextLvl.nodes.length - 1].width / 2;

            return (
              <g key={`single-parent-fork-${lIdx}`}>
                {/* Vertical drop from top parent to bus */}
                <line
                  x1={parentCenterX}
                  y1={parentBottomY}
                  x2={parentCenterX}
                  y2={busY}
                  stroke={strokeColor}
                  strokeWidth="2"
                />
                {/* Horizontal distribution spine spanning children */}
                <line
                  x1={nextMinX}
                  y1={busY}
                  x2={nextMaxX}
                  y2={busY}
                  stroke={strokeColor}
                  strokeWidth="2"
                />
                {/* Downward drop arrows into each child */}
                {nextLvl.nodes.map((child, cIdx) => {
                  const childCenterX = child.x + child.width / 2;
                  return (
                    <line
                      key={`drop-${lIdx}-${cIdx}`}
                      x1={childCenterX}
                      y1={busY}
                      x2={childCenterX}
                      y2={child.y - 1}
                      stroke={strokeColor}
                      strokeWidth="2"
                      markerEnd={arrowMarker}
                    />
                  );
                })}
              </g>
            );
          }

          // ── Case B: Equal Node Count (1-to-1 Aligned Subtrees in Tree mode) ──
          // If layoutStyle is "tree" AND node counts are equal (e.g. 3 nodes in row 3, 3 nodes in row 4)
          // Each child aligns directly under its parent!
          if (layoutStyle === "tree" && lvl.nodes.length === nextLvl.nodes.length) {
            return (
              <g key={`aligned-1to1-${lIdx}`}>
                {nextLvl.nodes.map((child, cIdx) => {
                  const parent = lvl.nodes[cIdx];
                  const parentCenterX = parent.x + parent.width / 2;
                  const parentBottomY = parent.y + parent.height;
                  const childCenterX = child.x + child.width / 2;

                  if (Math.abs(parentCenterX - childCenterX) < 18) {
                    // Straight direct vertical line
                    return (
                      <line
                        key={`straight-${lIdx}-${cIdx}`}
                        x1={childCenterX}
                        y1={parentBottomY}
                        x2={childCenterX}
                        y2={child.y - 1}
                        stroke={strokeColor}
                        strokeWidth="2"
                        markerEnd={arrowMarker}
                      />
                    );
                  }

                  // Stepped elbow
                  const midY = parentBottomY + 20;
                  return (
                    <path
                      key={`elbow-${lIdx}-${cIdx}`}
                      d={`M ${parentCenterX} ${parentBottomY} L ${parentCenterX} ${midY} L ${childCenterX} ${midY} L ${childCenterX} ${child.y - 1}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                      markerEnd={arrowMarker}
                    />
                  );
                })}
              </g>
            );
          }

          // ── Case C: True Parent-Child Subtree Branching (Tree mode with varying counts) ──
          if (layoutStyle === "tree") {
            // Group children by parent
            const childrenByParent = {};
            nextLvl.nodes.forEach((child, cIdx) => {
              let pId = child.parentId;
              if (!pId || !lvl.nodes.some((p) => p.id === pId)) {
                // Map to closest parent above
                const closest = lvl.nodes.reduce((prev, curr) => {
                  const prevDist = Math.abs(prev.x + prev.width / 2 - (child.x + child.width / 2));
                  const currDist = Math.abs(curr.x + curr.width / 2 - (child.x + child.width / 2));
                  return currDist < prevDist ? curr : prev;
                }, lvl.nodes[0]);
                pId = closest.id;
              }
              if (!childrenByParent[pId]) childrenByParent[pId] = [];
              childrenByParent[pId].push(child);
            });

            return (
              <g key={`subtrees-${lIdx}`}>
                {lvl.nodes.map((parent, pIdx) => {
                  const kids = childrenByParent[parent.id] || [];
                  if (kids.length === 0) return null;

                  const parentCenterX = parent.x + parent.width / 2;
                  const parentBottomY = parent.y + parent.height;

                  if (kids.length === 1) {
                    const child = kids[0];
                    const childCenterX = child.x + child.width / 2;
                    if (Math.abs(parentCenterX - childCenterX) < 18) {
                      return (
                        <line
                          key={`single-kid-${pIdx}`}
                          x1={childCenterX}
                          y1={parentBottomY}
                          x2={childCenterX}
                          y2={child.y - 1}
                          stroke={strokeColor}
                          strokeWidth="2"
                          markerEnd={arrowMarker}
                        />
                      );
                    }
                    const midY = parentBottomY + 20;
                    return (
                      <path
                        key={`single-kid-elbow-${pIdx}`}
                        d={`M ${parentCenterX} ${parentBottomY} L ${parentCenterX} ${midY} L ${childCenterX} ${midY} L ${childCenterX} ${child.y - 1}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2"
                        markerEnd={arrowMarker}
                      />
                    );
                  }

                  // Parent has multiple children: localized fork under this parent!
                  const busY = parentBottomY + 20;
                  const minKidX = kids[0].x + kids[0].width / 2;
                  const maxKidX = kids[kids.length - 1].x + kids[kids.length - 1].width / 2;

                  return (
                    <g key={`parent-fork-${pIdx}`}>
                      {/* Vertical line from parent to localized bus */}
                      <line
                        x1={parentCenterX}
                        y1={parentBottomY}
                        x2={parentCenterX}
                        y2={busY}
                        stroke={strokeColor}
                        strokeWidth="2"
                      />
                      {/* Localized horizontal bar spanning only this parent's kids */}
                      <line
                        x1={minKidX}
                        y1={busY}
                        x2={maxKidX}
                        y2={busY}
                        stroke={strokeColor}
                        strokeWidth="2"
                      />
                      {/* Downward drop arrows into each child */}
                      {kids.map((kid, kIdx) => {
                        const kidCenterX = kid.x + kid.width / 2;
                        return (
                          <line
                            key={`kid-drop-${pIdx}-${kIdx}`}
                            x1={kidCenterX}
                            y1={busY}
                            x2={kidCenterX}
                            y2={kid.y - 1}
                            stroke={strokeColor}
                            strokeWidth="2"
                            markerEnd={arrowMarker}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            );
          }

          // ── Case D: Shared Matrix Bus Mode ("bus") ──
          // A full-width horizontal trunk bar connecting all upper nodes to all lower nodes
          const prevBottomY = lvl.rowY + boxHeight;
          const busY = prevBottomY + 20;
          const nextMinX = nextLvl.nodes[0].x + nextLvl.nodes[0].width / 2;
          const nextMaxX = nextLvl.nodes[nextLvl.nodes.length - 1].x + nextLvl.nodes[nextLvl.nodes.length - 1].width / 2;

          return (
            <g key={`full-bus-${lIdx}-to-${lIdx + 1}`}>
              {/* Lines from upper level down into bus */}
              {lvl.nodes.map((node, nIdx) => {
                const nodeCenterX = node.x + node.width / 2;
                return (
                  <line
                    key={`up-${nIdx}`}
                    x1={nodeCenterX}
                    y1={prevBottomY}
                    x2={nodeCenterX}
                    y2={busY}
                    stroke={strokeColor}
                    strokeWidth="2"
                  />
                );
              })}

              {/* Horizontal trunk bus bar */}
              <line
                x1={nextMinX}
                y1={busY}
                x2={nextMaxX}
                y2={busY}
                stroke={strokeColor}
                strokeWidth="2"
              />

              {/* Downward drop arrows from bus to lower level boxes */}
              {nextLvl.nodes.map((child, cIdx) => {
                const childCenterX = child.x + child.width / 2;
                return (
                  <line
                    key={`down-${cIdx}`}
                    x1={childCenterX}
                    y1={busY}
                    x2={childCenterX}
                    y2={child.y - 1}
                    stroke={strokeColor}
                    strokeWidth="2"
                    markerEnd={arrowMarker}
                  />
                );
              })}
            </g>
          );
        })}
      </g>

      {/* ── 3. Main Diagram Nodes (Colored Rectangles) ── */}
      <g className="nodes-layer">
        {computedLevels.map((lvl, lIdx) => (
          <g key={`level-${lIdx}`}>
            {lvl.nodes.map((node, nIdx) => {
              const isSelected = selectedNodeId === node.id;

              // Text wrapping helper
              const label = node.label || node.title || `Node ${nIdx + 1}`;
              const words = label.split(" ");
              let line1 = label;
              let line2 = "";

              if (label.length > 20 && words.length > 1) {
                const mid = Math.ceil(words.length / 2);
                line1 = words.slice(0, mid).join(" ");
                line2 = words.slice(mid).join(" ");
              }

              return (
                <g
                  key={node.id || `node-${lIdx}-${nIdx}`}
                  onClick={() => onSelectNode(node, "hierarchy_node", nIdx, lIdx)}
                  style={{ cursor: "pointer" }}
                  filter={isSelected ? "url(#node-active-shadow)" : undefined}
                >
                  {/* Solid colored node rectangle with sharp crisp corners */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx="1.5"
                    ry="1.5"
                    fill={node.color}
                    stroke={isSelected ? "#000000" : "none"}
                    strokeWidth={isSelected ? 2 : 0}
                  />

                  {/* Centered bold white text */}
                  {line2 ? (
                    <text
                      x={node.x + node.width / 2}
                      y={node.y + node.height / 2 - 7}
                      fill="#FFFFFF"
                      fontSize={node.width < 150 ? "11.5" : "13"}
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      <tspan x={node.x + node.width / 2} dy="0">{line1}</tspan>
                      <tspan x={node.x + node.width / 2} dy="15">{line2}</tspan>
                    </text>
                  ) : (
                    <text
                      x={node.x + node.width / 2}
                      y={node.y + node.height / 2}
                      fill="#FFFFFF"
                      fontSize={node.width < 150 ? "12" : "13.5"}
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {line1}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </g>

      {/* ── 4. Right-Hand Side Level Indicator Column (Green-Bordered Boxes) ── */}
      <g className="right-legend-layer">
        {computedLevels.map((lvl, lIdx) => {
          const levelName = lvl.levelName || `Level ${lIdx + 1}`;
          const isSelected = selectedNodeId === `level-tag-${lIdx}`;

          return (
            <g
              key={`right-tag-${lIdx}`}
              onClick={() => onSelectNode({ id: `level-tag-${lIdx}`, name: levelName, index: lIdx }, "level_tag", lIdx, lIdx)}
              style={{ cursor: "pointer" }}
            >
              {/* White box with clean green border */}
              <rect
                x={rightColumnX}
                y={lvl.rowY}
                width={rightColumnWidth}
                height={boxHeight}
                rx="2"
                ry="2"
                fill="#FFFFFF"
                stroke="#5CA838"
                strokeWidth="2"
                filter={isSelected ? "url(#node-active-shadow)" : undefined}
              />

              {/* Bold black text indicating level name */}
              <text
                x={rightColumnX + rightColumnWidth / 2}
                y={lvl.rowY + boxHeight / 2}
                fill="#000000"
                fontSize="14"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {levelName}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
