import JSZip from "jszip";

/**
 * Escapes XML strings for DrawingML / OpenXML
 */
export function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const EMU_PER_IN = 914400;
export function emu(inch) {
  return String(Math.round(inch * EMU_PER_IN));
}

const FONT = "Arial";

/**
 * Builds DrawingML Text Body
 */
function buildTxBody(textLines, fontSize = 9, bold = false, color = "1A1A1A", align = "ctr") {
  if (!textLines || textLines.length === 0) return "";
  const sz = String(Math.round(fontSize * 100));
  const b = bold ? "1" : "0";
  const algn = align === "l" ? "l" : align === "r" ? "r" : "ctr";

  const paras = textLines
    .map(
      (line) =>
        `<a:p><a:pPr algn="${algn}" indent="0" marL="0"><a:buNone/></a:pPr>` +
        `<a:r><a:rPr lang="en-US" sz="${sz}" b="${b}" dirty="0">` +
        `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` +
        `<a:latin typeface="${FONT}" pitchFamily="34" charset="0"/>` +
        `<a:ea typeface="${FONT}" pitchFamily="34" charset="-122"/>` +
        `<a:cs typeface="${FONT}" pitchFamily="34" charset="-120"/></a:rPr>` +
        `<a:t>${escapeXml(line)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${sz}" dirty="0"/></a:p>`
    )
    .join("");

  return `<xdr:txBody><a:bodyPr wrap="square" lIns="25400" tIns="25400" rIns="25400" bIns="25400" rtlCol="0" anchor="ctr"/><a:lstStyle/>${paras}</xdr:txBody>`;
}

// Preset color constants from files(5).zip
export const SHAPE_THEMES = {
  terminatorStart: { prst: "flowChartTerminator", fill: "C6E0B4", stroke: "548235", text: "1A1A1A", bold: true },
  terminatorSuccess: { prst: "flowChartTerminator", fill: "C6E0B4", stroke: "548235", text: "1A1A1A", bold: true },
  terminatorBlocked: { prst: "flowChartTerminator", fill: "F4B7B3", stroke: "C00000", text: "1A1A1A", bold: true },
  process: { prst: "flowChartProcess", fill: "FBE0CE", stroke: "C55A11", text: "1A1A1A", bold: false },
  decision: { prst: "flowChartDecision", fill: "FFE599", stroke: "BF9000", text: "1A1A1A", bold: true },
  database: { prst: "flowChartMagneticDisk", fill: "D9E1F2", stroke: "41719C", text: "1A1A1A", bold: false },
  container: { prst: "roundRect", fill: "F7F7F7", stroke: "BFBFBF", text: "808080", bold: true }
};

/**
 * 1. DYNAMIC MERMAID GRAPH PARSER
 */
export function parseMermaidToGraph(mermaidCode, titleHint = null) {
  if (!mermaidCode || typeof mermaidCode !== "string") return null;

  const lines = mermaidCode.split(/\r?\n/);
  const nodesMap = new Map();
  const edges = [];
  const subgraphs = [];
  let currentSubgraph = null;

  let graphTitle = titleHint || "Dynamic Process Flow Architecture";

  function registerNode(rawId, shapeType, label) {
    const id = rawId.trim();
    if (!id) return null;

    let cleanLabel = (label || id).replace(/<br\s*\/?>/gi, "\n").replace(/["']/g, "").trim();
    if (!cleanLabel) cleanLabel = id;

    let prst = "flowChartProcess";
    let themeKey = "process";

    const lowerLabel = cleanLabel.toLowerCase();
    const isStart = lowerLabel.includes("start") || lowerLabel.includes("trigger") || lowerLabel.includes("begin") || lowerLabel.includes("receive");
    const isEnd = lowerLabel.includes("end") || lowerLabel.includes("saved") || lowerLabel.includes("complete") || lowerLabel.includes("confirm") || lowerLabel.includes("success");
    const isBlocked = lowerLabel.includes("blocked") || lowerLabel.includes("error") || lowerLabel.includes("failed") || lowerLabel.includes("exception") || lowerLabel.includes("reject") || lowerLabel.includes("stop");

    if (shapeType === "terminator" || shapeType === "pill" || shapeType === "rounded") {
      prst = "flowChartTerminator";
      themeKey = isBlocked ? "terminatorBlocked" : isEnd ? "terminatorSuccess" : "terminatorStart";
    } else if (shapeType === "decision" || shapeType === "diamond" || shapeType === "hex" || cleanLabel.includes("?") || lowerLabel.startsWith("check") || lowerLabel.startsWith("valid") || lowerLabel.startsWith("is ")) {
      prst = "flowChartDecision";
      themeKey = "decision";
    } else if (shapeType === "database" || shapeType === "disk" || lowerLabel.startsWith("db:") || lowerLabel.startsWith("table:") || /^\/?[A-Z0-9_\/]{4,15}$/.test(cleanLabel)) {
      prst = "flowChartMagneticDisk";
      themeKey = "database";
    } else if (isBlocked) {
      prst = "flowChartTerminator";
      themeKey = "terminatorBlocked";
    } else if (isStart) {
      prst = "flowChartTerminator";
      themeKey = "terminatorStart";
    } else if (isEnd) {
      prst = "flowChartTerminator";
      themeKey = "terminatorSuccess";
    }

    const nodeData = {
      id,
      label: cleanLabel,
      shapeType,
      prst,
      themeKey,
      subgraphId: currentSubgraph ? currentSubgraph.id : null,
      ...SHAPE_THEMES[themeKey]
    };

    if (nodesMap.has(id)) {
      const existing = nodesMap.get(id);
      if (existing.label === id && cleanLabel !== id) {
        Object.assign(existing, nodeData);
      }
    } else {
      nodesMap.set(id, nodeData);
    }

    return nodesMap.get(id);
  }

  function parseNodeToken(token) {
    if (!token) return null;
    let t = token.trim();

    let m = t.match(/^([a-zA-Z0-9_\-]+)\s*\(\[\s*["']?([\s\S]*?)["']?\s*\]\)$/);
    if (m) return registerNode(m[1], "pill", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)\s*\[\(\s*["']?([\s\S]*?)["']?\s*\)\]$/);
    if (m) return registerNode(m[1], "database", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)\s*\{\{\s*["']?([\s\S]*?)["']?\s*\}\}/);
    if (m) return registerNode(m[1], "hex", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)\s*\{\s*["']?([\s\S]*?)["']?\s*\}$/);
    if (m) return registerNode(m[1], "decision", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)\s*\(\s*["']?([\s\S]*?)["']?\s*\)$/);
    if (m) return registerNode(m[1], "rounded", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)\s*\[\s*["']?([\s\S]*?)["']?\s*\]$/);
    if (m) return registerNode(m[1], "process", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)\s*\[\/\s*["']?([\s\S]*?)["']?\s*\/\]$/);
    if (m) return registerNode(m[1], "document", m[2]);

    m = t.match(/^([a-zA-Z0-9_\-]+)$/);
    if (m) return registerNode(m[1], "process", m[1]);

    return registerNode(t.replace(/[^a-zA-Z0-9_\-]/g, "_"), "process", t);
  }

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith("%%") || line.startsWith("classDef") || line.startsWith("style")) continue;

    const subMatch = line.match(/^subgraph\s+([a-zA-Z0-9_\-]+)(?:\s*\[\s*["']?([\s\S]*?)["']?\s*\])?/i);
    if (subMatch) {
      const subId = subMatch[1];
      const subTitle = (subMatch[2] || subId).replace(/["']/g, "").trim();
      currentSubgraph = { id: subId, title: subTitle, nodeIds: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }

    if (line === "end" && currentSubgraph) {
      currentSubgraph = null;
      continue;
    }

    if (line.startsWith("---") || line.startsWith("title:")) {
      const tMatch = line.match(/title:\s*(.+)/i);
      if (tMatch) graphTitle = tMatch[1].trim();
      continue;
    }

    if (line.startsWith("flowchart") || line.startsWith("graph")) continue;

    const arrowRegex = /(\s*-->\|\s*[\s\S]*?\s*\|\s*|\s*-\.-?>\|\s*[\s\S]*?\s*\|\s*|\s*==>\|\s*[\s\S]*?\s*\|\s*|\s*-->\s*|\s*-\.-?>\s*|\s*==>\s*|\s*--\s*[\s\S]*?\s*-->\s*)/;
    const parts = line.split(arrowRegex);

    if (parts.length >= 3) {
      for (let i = 0; i < parts.length - 2; i += 2) {
        const sourceToken = parts[i].trim();
        const arrowToken = parts[i + 1].trim();
        const targetToken = parts[i + 2].trim();

        const srcNode = parseNodeToken(sourceToken);
        const tgtNode = parseNodeToken(targetToken);

        if (srcNode && tgtNode) {
          let edgeLabel = "";
          let isDashed = arrowToken.includes("-.");
          let isThick = arrowToken.includes("==");

          const pipeMatch = arrowToken.match(/\|([\s\S]*?)\|/);
          const textMatch = arrowToken.match(/--\s*([\s\S]*?)\s*-->/);
          if (pipeMatch) edgeLabel = pipeMatch[1].trim();
          else if (textMatch) edgeLabel = textMatch[1].trim();

          const lowerEdge = edgeLabel.toLowerCase();
          let edgeColor = "595959";
          if (lowerEdge.includes("no") || lowerEdge.includes("fail") || lowerEdge.includes("block") || lowerEdge.includes("error") || isDashed) {
            edgeColor = "C00000";
            isDashed = true;
          } else if (lowerEdge.includes("yes") || lowerEdge.includes("ok") || lowerEdge.includes("valid") || lowerEdge.includes("pass")) {
            edgeColor = "38761D";
          }

          edges.push({
            from: srcNode.id,
            to: tgtNode.id,
            label: edgeLabel,
            color: edgeColor,
            dash: isDashed ? "dash" : "solid",
            thick: isThick
          });
        }
      }
    } else {
      parseNodeToken(line);
    }
  }

  const nodes = Array.from(nodesMap.values());
  if (nodes.length === 0) return null;

  return layoutDynamicGraph({
    title: graphTitle,
    nodes,
    edges,
    subgraphs
  });
}

/**
 * 2. DYNAMIC SESSION FLOW SYNTHESIZER
 */
export function extractDrawingFlowData(doc, aiText, conversationTurns, sessionId) {
  const effectiveSessionId = sessionId || doc?.caseId || "conv-active-session";
  const latestTurn = conversationTurns && conversationTurns.length > 0 ? conversationTurns[conversationTurns.length - 1] : null;
  const firstTurn = conversationTurns && conversationTurns.length > 0 ? conversationTurns[0] : null;

  let sessionTitle = latestTurn?.title || firstTurn?.title || doc?.title || "SAP Enterprise Process Flow";
  sessionTitle = sessionTitle.replace(/^###?\s*/, "").replace(/^Follow-up Query:\s*/i, "").trim();

  const combinedText = (
    (doc?.overview || "") +
    "\n" +
    (doc?.summary || "") +
    "\n" +
    (aiText || "") +
    "\n" +
    (conversationTurns?.map((t) => (t.title || "") + "\n" + (t.content || "")).join("\n") || "")
  ).trim();

  const lower = combinedText.toLowerCase();

  const mermaidBlockMatch = combinedText.match(/```mermaid([\s\S]*?)```/);
  if (mermaidBlockMatch) {
    const parsed = parseMermaidToGraph(mermaidBlockMatch[1], `${sessionTitle} — Architecture Flow`);
    if (parsed && parsed.nodes.length >= 2) {
      parsed.sessionId = effectiveSessionId;
      return parsed;
    }
  }

  const tcodeMatches = combinedText.match(/\b(?:\/SCWM\/[A-Z0-9_]+|[A-Z]{2,4}\d{1,3}[A-Z]?)\b/g) || [];
  const knownTcodes = Array.from(
    new Set(tcodeMatches.filter((t) => !/^(?:SAP|HTTP|JSON|HTML|ANSI|REST|POST|GET|STEP|NOTE|GUIDE|TIER|VIEW|TRUE|NULL)$/i.test(t)))
  );
  const mainTcode = knownTcodes[0] || (doc?.title?.match(/\b[A-Z0-9_\/]{3,10}\b/) ? doc.title.match(/\b[A-Z0-9_\/]{3,10}\b/)[0] : "SAP");

  const tableMatches =
    combinedText.match(
      /\b(?:\/SCWM\/[A-Z0-9_]+|AFKO|AFPO|RESB|AFVC|AFVU|KBED|AUFM|MSEG|AFRU|ARFCSSTATE|ARFCSDATA|QRFCSCHED|TRFCQOUT|TRFCQIN|MAST|STKO|STPO|PLKO|PLPO|PLAS|TJ02|JEST|AUFK|COEP|MARA|MARC|VBAK|VBAP|EKKO|EKPO|BKPF|BSEG|MKPF)\b/g
    ) || [];
  const knownTables = Array.from(new Set(tableMatches));

  const rawSteps = [];
  const lines = combinedText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const headingMatch = line.match(/^(?:###?\s*(?:\d+[\.:]\s*)?|Step\s*\d+[\.:]\s*|\d+[\.:]\s*)([A-Za-z0-9\s—:\-\(\)\/]{4,70})/);
    const boldMatch = line.match(/^[*-]\s*\*\*([A-Za-z0-9\s—:\-\(\)\/]{4,60})\*\*/);
    if (
      headingMatch &&
      !/^(?:incident overview|diagnostic symptoms|production safeguards|step-by-step|t-code reference|citations|conclusion|follow-up query|root cause|direct answer|direct definition)/i.test(
        headingMatch[1]
      )
    ) {
      rawSteps.push(headingMatch[1].replace(/[*`_]/g, "").trim());
    } else if (boldMatch && !/^(?:note|warning|tip|important|step|phase|the interview scenario)/i.test(boldMatch[1])) {
      rawSteps.push(boldMatch[1].replace(/[*`_]/g, "").trim());
    }
  }

  const uniqueSteps = Array.from(new Set(rawSteps)).slice(0, 8);

  let dynamicSteps = [];
  if (uniqueSteps.length >= 3) {
    dynamicSteps = uniqueSteps;
  } else if (lower.includes("putaway") || lower.includes("/scwm/")) {
    dynamicSteps = [
      `Inbound GR & Determine WPT (${mainTcode})`,
      `Storage Type & Section Search (/SCWM/T331)`,
      `Apply Putaway Strategy: Empty Bin / Add-to-Stock`,
      `Verify Bin Capacity & Dimensions`,
      `Generate & Queue Warehouse Task (WT)`,
      `Confirm Physical Putaway via RF Gun`
    ];
  } else if (lower.includes("co01") || lower.includes("production order") || lower.includes("bom")) {
    dynamicSteps = [
      `Enter FG Material, Plant & Order Type (${mainTcode})`,
      `Read Master BOM & Routing (${knownTables.slice(0, 2).join("/") || "MAST/STPO"})`,
      `Explode Multi-Level BOM (FG -> SFG -> RM)`,
      `ATP Availability Check for Components`,
      `Lead Time & Capacity Scheduling`,
      `Create Reservations (mvt 261) & Release Order`
    ];
  } else if (lower.includes("smq1") || lower.includes("smq2") || lower.includes("queue") || lower.includes("rfc")) {
    dynamicSteps = [
      `Inspect Outbound Queue (${mainTcode})`,
      `Check LUW Serialization Status (TRFCQOUT)`,
      `Execute qRFC Dispatcher Call`,
      `Validate Target Response Packet`,
      `Delete Processed LUW & Post Document`
    ];
  } else {
    dynamicSteps = [
      `Initialize ${mainTcode} Transaction & Header Data`,
      `Read Master Tables (${knownTables.slice(0, 2).join("/") || "Config DB"})`,
      `Validate Pre-requisites & Rules`,
      `Execute Core Processing Logic`,
      `Post Settlement & Status Confirmation`
    ];
  }

  const nodes = [];
  const edges = [];
  const subgraphs = [];

  const mid = Math.ceil(dynamicSteps.length / 2);
  const p1Steps = dynamicSteps.slice(0, mid);
  const p2Steps = dynamicSteps.slice(mid);

  const sub1 = { id: "phase1", title: `PHASE 1 — Master data & validation (${mainTcode})`, nodeIds: [] };
  const sub2 = { id: "phase2", title: "PHASE 2 — Execution & confirmation", nodeIds: [] };
  subgraphs.push(sub1, sub2);

  nodes.push({
    id: "p1_start",
    label: `Start\n${mainTcode}`,
    prst: "flowChartTerminator",
    themeKey: "terminatorStart",
    subgraphId: "phase1",
    ...SHAPE_THEMES.terminatorStart
  });

  let prevP1Id = "p1_start";
  p1Steps.forEach((s, idx) => {
    const isDec = s.includes("?") || s.toLowerCase().includes("check") || s.toLowerCase().includes("valid") || idx === Math.floor(p1Steps.length / 2);
    const nId = `p1_step_${idx + 1}`;
    nodes.push({
      id: nId,
      label: s,
      prst: isDec ? "flowChartDecision" : "flowChartProcess",
      themeKey: isDec ? "decision" : "process",
      subgraphId: "phase1",
      ...SHAPE_THEMES[isDec ? "decision" : "process"]
    });
    edges.push({ from: prevP1Id, to: nId, label: "", color: "595959", dash: "solid" });

    if (isDec) {
      const blockId = `p1_block_${idx}`;
      nodes.push({
        id: blockId,
        label: `Blocked\n(Validation Failed)`,
        prst: "flowChartTerminator",
        themeKey: "terminatorBlocked",
        subgraphId: "phase1",
        ...SHAPE_THEMES.terminatorBlocked
      });
      edges.push({ from: nId, to: blockId, label: "No", color: "C00000", dash: "dash" });
    }

    prevP1Id = nId;
  });

  let prevP2Id = prevP1Id;
  p2Steps.forEach((s, idx) => {
    const isDec = s.includes("?") || s.toLowerCase().includes("check") || s.toLowerCase().includes("valid");
    const nId = `p2_step_${idx + 1}`;
    nodes.push({
      id: nId,
      label: s,
      prst: isDec ? "flowChartDecision" : "flowChartProcess",
      themeKey: isDec ? "decision" : "process",
      subgraphId: "phase2",
      ...SHAPE_THEMES[isDec ? "decision" : "process"]
    });
    edges.push({
      from: prevP2Id,
      to: nId,
      label: idx === 0 ? "Proceed" : "",
      color: idx === 0 ? "38761D" : "595959",
      dash: "solid"
    });

    if (isDec) {
      const blockId = `p2_block_${idx}`;
      nodes.push({
        id: blockId,
        label: `Exception\n(Shortage / Error)`,
        prst: "flowChartTerminator",
        themeKey: "terminatorBlocked",
        subgraphId: "phase2",
        ...SHAPE_THEMES.terminatorBlocked
      });
      edges.push({ from: nId, to: blockId, label: "No", color: "C00000", dash: "dash" });
    }

    prevP2Id = nId;
  });

  nodes.push({
    id: "p2_end",
    label: `Process Complete\nStatus: CONFIRMED`,
    prst: "flowChartTerminator",
    themeKey: "terminatorSuccess",
    subgraphId: "phase2",
    ...SHAPE_THEMES.terminatorSuccess
  });
  edges.push({ from: prevP2Id, to: "p2_end", label: "Success", color: "38761D", dash: "solid" });

  const graph = layoutDynamicGraph({
    title: `${mainTcode}: ${sessionTitle} — Dynamic Architecture Flow`,
    nodes,
    edges,
    subgraphs
  });
  graph.sessionId = effectiveSessionId;
  return graph;
}

/**
 * 3. DYNAMIC GRAPH TOPOLOGICAL LAYOUT ENGINE
 */
export function layoutDynamicGraph(graphData) {
  const { title, nodes, edges, subgraphs = [] } = graphData;

  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n, inEdges: [], outEdges: [] }));

  edges.forEach((e) => {
    if (nodeMap.has(e.from) && nodeMap.has(e.to)) {
      nodeMap.get(e.from).outEdges.push(e);
      nodeMap.get(e.to).inEdges.push(e);
    }
  });

  const hasSubgraphs = subgraphs && subgraphs.length > 0;
  const groups = hasSubgraphs
    ? subgraphs.map((sg) => ({
        id: sg.id,
        title: sg.title,
        nodes: nodes.filter((n) => n.subgraphId === sg.id)
      }))
    : [{ id: "main", title: null, nodes }];

  const MAX_COLS = 4;
  const COL_GAP = 0.40;
  const ROW_GAP = 1.65;
  const START_X = 0.40;
  let currentGroupY = 0.75;

  const computedNodes = [];
  const computedContainers = [];

  groups.forEach((group) => {
    const groupNodes = group.nodes;
    if (groupNodes.length === 0) return;

    const mainNodes = [];
    const branchNodes = [];

    groupNodes.forEach((n) => {
      const isBlockedOrException =
        n.themeKey === "terminatorBlocked" ||
        n.label.toLowerCase().includes("blocked") ||
        n.label.toLowerCase().includes("exception") ||
        n.label.toLowerCase().includes("failed");
      if (isBlockedOrException) {
        branchNodes.push(n);
      } else {
        mainNodes.push(n);
      }
    });

    const groupStartY = currentGroupY;
    let maxGroupRow = 0;

    // Layout main flow nodes in wrapped rows of at most MAX_COLS (4 nodes/row)
    mainNodes.forEach((n, idx) => {
      const colIdx = idx % MAX_COLS;
      const rowIdx = Math.floor(idx / MAX_COLS);
      if (rowIdx > maxGroupRow) maxGroupRow = rowIdx;

      let w = 1.85;
      let h = 0.75;
      let yOffset = 0;

      if (n.prst === "flowChartTerminator") {
        w = 1.35;
      } else if (n.prst === "flowChartDecision") {
        w = 1.55;
        h = 0.95;
        yOffset = -0.10;
      } else if (n.prst === "flowChartMagneticDisk") {
        w = 1.65;
      } else if (n.label.length > 35) {
        w = 2.05;
      }

      const x = START_X + colIdx * (1.85 + COL_GAP);
      const y = groupStartY + rowIdx * ROW_GAP + yOffset;

      const placedNode = {
        ...n,
        x,
        y,
        w,
        h,
        centerX: x + w / 2,
        centerY: y + h / 2,
        row: rowIdx,
        col: colIdx
      };

      computedNodes.push(placedNode);
    });

    // Layout branch/exception nodes (attached below their parent decision)
    branchNodes.forEach((bn, bIdx) => {
      const w = 1.50;
      const h = 0.75;
      const sourceEdge = edges.find((e) => e.to === bn.id);
      const srcPlaced = sourceEdge ? computedNodes.find((cn) => cn.id === sourceEdge.from) : null;

      let bx = START_X;
      let by = groupStartY + (maxGroupRow + 1) * ROW_GAP;
      let branchRow = maxGroupRow + 1;

      if (srcPlaced) {
        bx = srcPlaced.x;
        by = srcPlaced.y + srcPlaced.h + 0.35;
        branchRow = srcPlaced.row + 0.5;
      } else {
        bx = START_X + (bIdx % MAX_COLS) * (1.85 + COL_GAP);
      }

      const placedBranch = {
        ...bn,
        x: bx,
        y: by,
        w,
        h,
        centerX: bx + w / 2,
        centerY: by + h / 2,
        row: branchRow,
        col: srcPlaced ? srcPlaced.col : bIdx % MAX_COLS
      };

      computedNodes.push(placedBranch);
    });

    const gPlacedNodes = computedNodes.filter((cn) => cn.subgraphId === group.id);
    const minX = gPlacedNodes.length > 0 ? Math.min(...gPlacedNodes.map((n) => n.x)) - 0.20 : 0.25;
    const maxX = gPlacedNodes.length > 0 ? Math.max(...gPlacedNodes.map((n) => n.x + n.w)) + 0.25 : 10.5;
    const minY = gPlacedNodes.length > 0 ? Math.min(...gPlacedNodes.map((n) => n.y)) - 0.38 : groupStartY - 0.38;
    const maxY = gPlacedNodes.length > 0 ? Math.max(...gPlacedNodes.map((n) => n.y + n.h)) + 0.28 : groupStartY + 1.2;

    if (group.title) {
      computedContainers.push({
        id: group.id,
        title: group.title,
        x: Math.max(0.20, minX),
        y: minY,
        w: Math.max(9.8, maxX - minX + 0.4),
        h: Math.max(1.30, maxY - minY)
      });
    }

    currentGroupY = maxY + 0.55;
  });

  const computedMap = new Map();
  computedNodes.forEach((cn) => computedMap.set(cn.id, cn));

  const computedEdges = [];
  edges.forEach((e) => {
    const src = computedMap.get(e.from);
    const tgt = computedMap.get(e.to);

    if (src && tgt) {
      let x1, y1, x2, y2;
      let isVertical = false;
      let isWrap = false;

      if (tgt.row > src.row && Math.abs(tgt.x - src.x) < 0.4) {
        // Direct downward branch (e.g. Decision -> Blocked directly underneath)
        x1 = src.centerX;
        y1 = src.y + src.h;
        x2 = tgt.centerX;
        y2 = tgt.y;
        isVertical = true;
      } else if (tgt.row > src.row) {
        // Multi-row wrap from end of previous row to start of next row
        x1 = src.x + src.w;
        y1 = src.centerY;
        x2 = tgt.x;
        y2 = tgt.centerY;
        isWrap = true;
      } else if (tgt.x >= src.x + src.w - 0.05) {
        // Forward sequential step on same row
        x1 = src.x + src.w;
        y1 = src.centerY;
        x2 = tgt.x;
        y2 = tgt.centerY;
      } else if (tgt.y > src.y + 0.4) {
        // Lower row step
        x1 = src.centerX;
        y1 = src.y + src.h;
        x2 = tgt.centerX;
        y2 = tgt.y;
        isVertical = true;
      } else {
        // Fallback wrap
        x1 = src.x + src.w;
        y1 = src.centerY;
        x2 = tgt.x;
        y2 = tgt.centerY;
        isWrap = true;
      }

      const lx = (x1 + x2) / 2;
      const ly = isVertical ? (y1 + y2) / 2 : (y1 + y2) / 2 - 0.12;

      computedEdges.push({
        ...e,
        x1,
        y1,
        x2,
        y2,
        lx,
        ly,
        isVertical,
        isWrap
      });
    }
  });

  const totalW = Math.max(10.5, ...computedNodes.map((n) => n.x + n.w + 0.6));
  const totalH = currentGroupY + 0.65;

  return {
    headerTitle: title || "Dynamic SAP Process Architecture Flow",
    nodes: computedNodes,
    edges: computedEdges,
    containers: computedContainers,
    totalWidth: totalW,
    totalHeight: totalH
  };
}

/**
 * 4. DYNAMIC DRAWINGML XML GENERATOR
 */
export function buildDrawingMlXml(graph) {
  let idCounter = 1;
  const nextId = () => ++idCounter;

  const shapesXml = [];

  function addShape(prst, x, y, w, h, fill, lineColor, text = null, fontSize = 9, bold = false, textColor = "1A1A1A", lineWidth = 1.25, name = null) {
    const sid = nextId();
    const nm = name || `Shape ${sid}`;
    const fillXml = `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>`;
    const lw = String(Math.round(lineWidth * 12700));
    const textLines = text ? text.split("\n") : null;
    const body = buildTxBody(textLines, fontSize, bold, textColor);
    const sp =
      `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="${escapeXml(nm)}"/>` +
      `<xdr:cNvSpPr/></xdr:nvSpPr>` +
      `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
      `<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom>${fillXml}` +
      `<a:ln w="${lw}"><a:solidFill><a:srgbClr val="${lineColor}"/></a:solidFill></a:ln></xdr:spPr>` +
      `${body}</xdr:sp>`;
    shapesXml.push(`<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`);
  }

  function addArrow(x1, y1, x2, y2, color = "595959", dash = "solid", width = 1.5) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1) || 0.01;
    const h = Math.abs(y2 - y1) || 0.01;
    const flipH = x2 < x1;
    const flipV = y2 < y1;
    const sid = nextId();
    let flipAttrs = "";
    if (flipH) flipAttrs += ' flipH="1"';
    if (flipV) flipAttrs += ' flipV="1"';
    const lw = String(Math.round(width * 12700));
    const dashXml = dash === "solid" ? "" : `<a:prstDash val="${dash}"/>`;
    const sp =
      `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="Line ${sid}"/>` +
      `<xdr:cNvSpPr/></xdr:nvSpPr>` +
      `<xdr:spPr><a:xfrm${flipAttrs}><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
      `<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:noFill/>` +
      `<a:ln w="${lw}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>${dashXml}` +
      `<a:tailEnd type="triangle"/></a:ln></xdr:spPr></xdr:sp>`;
    shapesXml.push(`<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`);
  }

  function addLabel(text, x, y, w, h, fontSize = 8, italic = false, bold = false, color = "595959", align = "ctr") {
    const sid = nextId();
    const sz = String(Math.round(fontSize * 100));
    const b = bold ? "1" : "0";
    const i = italic ? "1" : "0";
    const algn = align === "l" ? "l" : align === "r" ? "r" : "ctr";
    const sp =
      `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="Label ${sid}"/>` +
      `<xdr:cNvSpPr txBox="1"/></xdr:nvSpPr>` +
      `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></xdr:spPr>` +
      `<xdr:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/>` +
      `<a:p><a:pPr algn="${algn}" indent="0" marL="0"><a:buNone/></a:pPr>` +
      `<a:r><a:rPr lang="en-US" sz="${sz}" b="${b}" i="${i}" dirty="0">` +
      `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` +
      `<a:latin typeface="${FONT}" pitchFamily="34" charset="0"/></a:rPr>` +
      `<a:t>${escapeXml(text)}</a:t></a:r></a:p></xdr:txBody></xdr:sp>`;
    shapesXml.push(`<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`);
  }

  function addRrectBg(x, y, w, h, fill = "F7F7F7", line = "BFBFBF") {
    const sid = nextId();
    const sp =
      `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="BG ${sid}"/>` +
      `<xdr:cNvSpPr/></xdr:nvSpPr>` +
      `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
      `<a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>` +
      `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` +
      `<a:ln w="9525"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill><a:prstDash val="dash"/></a:ln></xdr:spPr></xdr:sp>`;
    shapesXml.push(`<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`);
  }

  // 1. Title Header
  addLabel(graph.headerTitle, 0.25, 0.08, 12.5, 0.28, 13, false, true, "1A1A1A", "l");

  // 2. Subgraph Containers
  if (graph.containers && graph.containers.length > 0) {
    graph.containers.forEach((c) => {
      addRrectBg(c.x, c.y, c.w, c.h);
      addLabel(c.title, c.x + 0.12, c.y + 0.06, 8.0, 0.22, 8, false, true, "808080", "l");
    });
  }

  // 3. Dynamic Nodes
  graph.nodes.forEach((n) => {
    addShape(n.prst, n.x, n.y, n.w, n.h, n.fill, n.stroke, n.label, 8.5, n.bold, n.text || "1A1A1A", 1.4);
  });

  // 4. Dynamic Edges & Labels
  graph.edges.forEach((e) => {
    addArrow(e.x1, e.y1, e.x2, e.y2, e.color, e.dash, e.thick ? 2.0 : 1.4);
    if (e.label) {
      addLabel(e.label, e.lx - 0.25, e.ly, 0.5, 0.2, 7.5, false, e.label.toLowerCase() === "yes" || e.label.toLowerCase() === "no", e.color, "ctr");
    }
  });

  // 5. Dynamic Shape Legend at Bottom
  const legend_y = graph.totalHeight - 0.45;
  addLabel("Shape legend (native DrawingML autoshapes)", 0.25, legend_y - 0.22, 5, 0.18, 8, false, true, "1A1A1A", "l");

  const legend_items = [
    ["flowChartTerminator", "C6E0B4", "548235", "Terminator (Start / End)"],
    ["flowChartProcess", "FBE0CE", "C55A11", "Process Step"],
    ["flowChartDecision", "FFE599", "BF9000", "Decision Gate"],
    ["flowChartTerminator", "F4B7B3", "C00000", "Blocked / Exception"]
  ];

  let lx = 0.25;
  legend_items.forEach(([prst, fill, line_c, txt]) => {
    addShape(prst, lx, legend_y, 0.3, 0.22, fill, line_c);
    addLabel(txt, lx + 0.35, legend_y - 0.02, 2.3, 0.26, 7.5, false, false, "595959", "l");
    lx += 2.8;
  });

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    shapesXml.join("") +
    `</xdr:wsDr>`
  );
}

/**
 * 5. EXPORT DRAWINGML EXCEL
 */
export async function exportDrawingMlExcel(graphOrFlow, customFilename = null) {
  let graph = graphOrFlow;
  if (!graph.nodes || !graph.edges) {
    if (typeof graphOrFlow === "string") {
      graph = parseMermaidToGraph(graphOrFlow);
    } else {
      graph = extractDrawingFlowData(graphOrFlow);
    }
  }

  const drawingXml = buildDrawingMlXml(graph);
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
  );

  zip.file(
    "docProps/app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>`
  );

  zip.file(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Antigravity SAP Assistant</dc:creator><dc:title>${escapeXml(
      graph.headerTitle
    )}</dc:title></cp:coreProperties>`
  );

  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Process Flow" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`
  );

  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`
  );

  zip.file(
    "xl/theme/theme1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4F81BD"/></a:accent1><a:accent2><a:srgbClr val="C0504D"/></a:accent2><a:accent3><a:srgbClr val="9BBB59"/></a:accent3><a:accent4><a:srgbClr val="8064A2"/></a:accent4><a:accent5><a:srgbClr val="4BACC6"/></a:accent5><a:accent6><a:srgbClr val="F79646"/></a:accent6><a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`
  );

  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><outlinePr summaryBelow="1" summaryRight="1"/><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:A1"/>
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews>
  <sheetFormatPr baseColWidth="8" defaultRowHeight="15"/>
  <sheetData></sheetData>
  <pageMargins left="0.2" right="0.2" top="0.2" bottom="0.2" header="0.5" footer="0.5"/>
  <pageSetup orientation="landscape" paperSize="8" fitToHeight="1" fitToWidth="1"/>
  <drawing r:id="rIdDraw1"/>
</worksheet>`
  );

  zip.file(
    "xl/worksheets/_rels/sheet1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDraw1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`
  );

  zip.file("xl/drawings/drawing1.xml", drawingXml);

  zip.file(
    "xl/drawings/_rels/drawing1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
  );

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const filename =
    customFilename ||
    `${String(graph.sessionId || "SAP_Process_Flow").replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function extractValueStreamData(doc, aiText, aiCitations, sessionId, conversationTurns) {
  return extractDrawingFlowData(doc, aiText, conversationTurns, sessionId);
}

export function synthesizeShapeFlowchart(doc, aiText, conversationTurns, sessionId) {
  return extractDrawingFlowData(doc, aiText, conversationTurns, sessionId);
}

export async function exportValueStreamMapExcel(flowOrDoc, aiText, aiCitations, sessionId, conversationTurns) {
  return exportDrawingMlExcel(flowOrDoc);
}