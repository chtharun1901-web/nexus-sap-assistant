export function fixSpacedNodeIds(chart) {
  if (!chart || typeof chart !== "string") return chart;
  const lines = chart.split("\n");
  return lines.map((line) => {
    line = line.replace(/^(\s*)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*(\[|\(|\{|\{\{|\{\||\/\[|\[\[|\[\/|\[\\)/g, (m, indent, id, bracket) => {
      const trimmed = id.trim();
      if (/^(?:subgraph|style|class|classDef|click|linkStyle|flowchart|graph|sequenceDiagram|stateDiagram|classDiagram|erDiagram)\b/i.test(trimmed)) return m;
      const cleanId = trimmed.replace(/\s+/g, "_");
      return `${indent}${cleanId}${bracket}`;
    });
    line = line.replace(/(-->|-.->|==>|--\s*["']?[^"'\n]+?["']?\s*-->|\|[^|\n]+\|)\s*([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*(\[|\(|\{|\{\{|\{\||\/\[|\[\[|\[\/|\[\\)/g, (m, arrow, id, bracket) => {
      const cleanId = id.trim().replace(/\s+/g, "_");
      return `${arrow} ${cleanId}${bracket}`;
    });
    line = line.replace(/^(\s*)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*(-->|-.->|==>|--\s|--\>|\|\s)/g, (m, indent, id, arrow) => {
      const trimmed = id.trim();
      if (/^(?:subgraph|style|class|classDef|click|linkStyle)\b/i.test(trimmed)) return m;
      const cleanId = trimmed.replace(/\s+/g, "_");
      return `${indent}${cleanId} ${arrow}`;
    });
    line = line.replace(/(-->|-.->|==>|--\s*["']?[^"'\n]+?["']?\s*-->|\|[^|\n]+\|)\s*([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)\s*($|;|\n)/g, (m, arrow, id, suffix) => {
      const cleanId = id.trim().replace(/\s+/g, "_");
      return `${arrow} ${cleanId}${suffix}`;
    });
    line = line.replace(/^(\s*subgraph\s+)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)(\s*\[|\s*$)/gi, (m, sub, id, trail) => {
      const cleanId = id.trim().replace(/\s+/g, "_");
      return `${sub}${cleanId}${trail}`;
    });
    return line;
  }).join("\n");
}

export function sanitizeMermaid(raw) {
  if (!raw) return "";
  let chart = typeof raw === "string" ? raw.trim() : JSON.stringify(raw);
  chart = chart.replace(/^```(?:mermaid|text|flowchart|graph|json:diagram|json-diagram|diagram|json)?\s*\n?/i, "");
  chart = chart.replace(/\n?\s*```\s*$/i, "");
  chart = chart.trim();
  const diagStart = chart.search(/(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindmap)\b/i);
  if (diagStart !== -1) {
    chart = chart.substring(diagStart);
  } else if (chart.includes("-->") || chart.includes("->")) {
    chart = "flowchart TD\n" + chart;
  }
  // Convert standard -> to -->
  chart = chart.replace(/([a-zA-Z0-9_\]\)\}\>])\s*->\s*([a-zA-Z0-9_\[\(\{\<])/g, "$1 --> $2");

  chart = chart.replace(/"([^"]*)"/g, (match, inner) => {
    const fixed = inner.replace(/\\n/g, "<br/>").replace(/\n/g, "<br/>");
    return `"${fixed}"`;
  });
  chart = fixSpacedNodeIds(chart);
  const lines = chart.split("\n");
  const processed = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Ensure all node bracket contents are wrapped in double quotes and inner quotes are replaced
    line = line.replace(/(\b[a-zA-Z0-9_\-]+)\s*\[([^\]"\n]+)\]/g, (m, id, text) => {
      const cleanText = text.replace(/"/g, "'").replace(/[\[\]]/g, "").trim();
      return `${id}["${cleanText}"]`;
    });
    line = line.replace(/subgraph\s+([a-zA-Z0-9_\-]+)\s*\[([^\]"\n]+)\]/g, (m, id, text) => {
      const cleanText = text.replace(/"/g, "'").replace(/[\[\]]/g, "").trim();
      return `subgraph ${id} ["${cleanText}"]`;
    });
    // Sanitize edge text: -- text --> to -->|"text"|
    line = line.replace(/--\s*([^-\n|]+?)\s*-->/g, (m, label) => {
      const cleanLabel = label.replace(/["']/g, "").trim();
      return `-->|"${cleanLabel}"|`;
    });
    processed.push(line);
  }
  let result = processed.join("\n");
  if (!/^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindmap)/i.test(result.trim())) {
    result = "flowchart TD\n" + result;
  }
  return result;
}

const rawChart = `flowchart TD
    PO["Production Order Released"] --> StagingReq["WM Staging Triggered (/SCWM/STAGE)"]
    StagingReq --> Sim["Simulation: Check Stock Availability & Bins"]
    Sim --> Exec["Execution: Create Warehouse Tasks (Pick & Move)"]
    Exec --> PSA["Materials Arrive at Production Supply Area (PSA)"]
    PSA --> Prod["Workers Consume Parts During Manufacturing"]`;

const sanitized = sanitizeMermaid(rawChart);
console.log("Sanitized result:\n", sanitized);
