export function parseMermaidGraph(chartText) {
  if (!chartText) return null;
  const lines = chartText.split(/\r?\n/);

  const nodes = new Map();
  const edges = [];
  const subgraphs = [];
  let currentSubgraph = null;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith("%%") || line.startsWith("classDef") || line.startsWith("style")) continue;

    // Detect Subgraph
    const subMatch = line.match(/^subgraph\s+([a-zA-Z0-9_\-]+)(?:\s*\["([^"]+)"\]|\s*\[([^\]]+)\]|\s*([a-zA-Z0-9_\-\s]+))?/i);
    if (subMatch) {
      const subId = subMatch[1];
      const subTitle = subMatch[2] || subMatch[3] || subMatch[4] || subId;
      currentSubgraph = { id: subId, title: subTitle.trim(), nodeIds: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }
    if (line.toLowerCase() === "end") {
      currentSubgraph = null;
      continue;
    }

    if (line.startsWith("flowchart") || line.startsWith("graph")) continue;

    // Detect Edges: A --> B or A["Label"] -->|Yes| B{"Decision?"}
    const edgeRegex = /([a-zA-Z0-9_\-]+(?:\s*\["[^"]+"\]|\s*\[[^\]]+\]|\s*\([^\)]+\)|\s*\{[^}]+\})?)\s*(-->|-.->|==>|->)\s*(?:\|([^|]+)\|)?\s*([a-zA-Z0-9_\-]+(?:\s*\["[^"]+"\]|\s*\[[^\]]+\]|\s*\([^\)]+\)|\s*\{[^}]+\})?)/g;
    
    let match;
    let foundEdge = false;
    while ((match = edgeRegex.exec(line)) !== null) {
      foundEdge = true;
      const fromStr = match[1].trim();
      const arrowType = match[2];
      const edgeLabel = match[3] ? match[3].replace(/["']/g, "").trim() : "";
      const toStr = match[4].trim();

      const fromNode = parseNodeDef(fromStr);
      const toNode = parseNodeDef(toStr);

      if (!nodes.has(fromNode.id)) nodes.set(fromNode.id, fromNode);
      else if (fromNode.label !== fromNode.id) nodes.get(fromNode.id).label = fromNode.label;

      if (!nodes.has(toNode.id)) nodes.set(toNode.id, toNode);
      else if (toNode.label !== toNode.id) nodes.get(toNode.id).label = toNode.label;

      if (currentSubgraph) {
        if (!currentSubgraph.nodeIds.includes(fromNode.id)) currentSubgraph.nodeIds.push(fromNode.id);
        if (!currentSubgraph.nodeIds.includes(toNode.id)) currentSubgraph.nodeIds.push(toNode.id);
      }

      edges.push({
        from: fromNode.id,
        to: toNode.id,
        label: edgeLabel,
        isDashed: arrowType === "-.->" || edgeLabel.toLowerCase() === "no",
        arrowType
      });
    }

    // Standalone node
    if (!foundEdge) {
      const singleMatch = line.match(/^([a-zA-Z0-9_\-]+)\s*(?:\["([^"]+)"\]|\[([^\]]+)\]|\("([^"]+)"\)|\(([^)]+)\)|\{"([^"]+)"\}|\{([^}]+)\})/);
      if (singleMatch) {
        const node = parseNodeDef(line);
        if (!nodes.has(node.id)) nodes.set(node.id, node);
        if (currentSubgraph && !currentSubgraph.nodeIds.includes(node.id)) {
          currentSubgraph.nodeIds.push(node.id);
        }
      }
    }
  }

  if (nodes.size === 0) return null;

  return { nodes: Array.from(nodes.values()), edges, subgraphs };
}

function parseNodeDef(str) {
  const match = str.match(/^([a-zA-Z0-9_\-]+)\s*(?:\["([^"]+)"\]|\[([^\]]+)\]|\(\["([^"]+)"\]\)|\(\[([^\]]+)\]\)|\("([^"]+)"\)|\(([^)]+)\)|\{"([^"]+)"\}|\{([^}]+)\})?/);
  if (match) {
    const id = match[1];
    let rawLabel = match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || match[8] || match[9] || id;
    rawLabel = rawLabel.replace(/<br\s*\/?>/gi, "\n").replace(/["']/g, "").trim();

    // Determine shape geometry
    let shape = "flowChartProcess";
    let fill = "FBE0CE";
    let stroke = "C55A11";

    if (str.includes("{") || rawLabel.includes("?") || /^(?:check|is|valid|sufficient)\b/i.test(rawLabel)) {
      shape = "flowChartDecision";
      fill = "FFE599";
      stroke = "BF9000";
    } else if (str.includes("([") || str.includes("(") || /^(?:start|begin|init|trigger|order saved|confirmed|success|complete|end|finish)\b/i.test(rawLabel)) {
      shape = "flowChartTerminator";
      if (/^(?:order blocked|exception|error|failed|rejected|stop|abort)\b/i.test(rawLabel) || rawLabel.toLowerCase().includes("blocked") || rawLabel.toLowerCase().includes("exception")) {
        fill = "F4B7B3";
        stroke = "C00000";
      } else {
        fill = "C6E0B4";
        stroke = "548235";
      }
    } else if (/^(?:order blocked|exception|error|failed|rejected|stop|abort)\b/i.test(rawLabel) || rawLabel.toLowerCase().includes("blocked") || rawLabel.toLowerCase().includes("exception")) {
      shape = "flowChartTerminator";
      fill = "F4B7B3";
      stroke = "C00000";
    }

    return { id, label: rawLabel, shape, fill, stroke };
  }

  const clean = str.replace(/["\[\]\(\)\{\}]/g, "").trim();
  return { id: clean.replace(/\s+/g, "_"), label: clean, shape: "flowChartProcess", fill: "FBE0CE", stroke: "C55A11" };
}

const testChart1 = `flowchart TD
    PO["Production Order Released"] --> StagingReq["WM Staging Triggered (/SCWM/STAGE)"]
    StagingReq --> Sim["Simulation: Check Stock Availability & Bins"]
    Sim --> Exec["Execution: Create Warehouse Tasks (Pick & Move)"]
    Exec --> PSA["Materials Arrive at Production Supply Area (PSA)"]
    PSA --> Prod["Workers Consume Parts During Manufacturing"]`;

console.log("Graph 1 parsed:", JSON.stringify(parseMermaidGraph(testChart1), null, 2));

const testChart2 = `flowchart TD
    Start([Start CO01]) --> Param[Enter Plant & Material]
    Param --> Check{Stock Available?}
    Check -->|Yes| Create[Create Production Order]
    Check -->|No| Hold([Order Blocked])
    Create --> Release([Order Released PP01])`;

console.log("Graph 2 parsed:", JSON.stringify(parseMermaidGraph(testChart2), null, 2));
