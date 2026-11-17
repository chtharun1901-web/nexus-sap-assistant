/**
 * AI Metaphorical Data Visualization Parser
 * Translates arbitrary user text, tables, notes, or project descriptions
 * into structured visualization models for all 9 metaphorical archetypes.
 */

import { METAPHOR_TYPES, PRESET_DIAGRAMS } from "./presets.js";
import { api } from "../../../api.js";

/**
 * Detects the most appropriate metaphor based on semantic keywords in the text.
 */
export function detectBestMetaphor(text = "") {
  const lower = text.toLowerCase();

  if (/flow|foe|flowchart|pipeline|conduit|swimlane|process flow|step[- ]by[- ]step|workflow|opus/i.test(lower)) {
    return METAPHOR_TYPES.FLOW;
  }
  if (/umbrella|shield|govern|overarch|protect|canopy|shelter/i.test(lower)) {
    return METAPHOR_TYPES.UMBRELLA;
  }
  if (/zoom|magnif|microscop|drill|inspect|deep[- ]dive|forensic|lens/i.test(lower)) {
    return METAPHOR_TYPES.MAGNIFYING;
  }
  if (/ladder|rung|step|maturity|level|tier|climb|progression|ascen/i.test(lower)) {
    return METAPHOR_TYPES.LADDER;
  }
  if (/puzzle|jigsaw|piece|interlock|fit together|modular|component/i.test(lower)) {
    return METAPHOR_TYPES.PUZZLE;
  }
  if (/compass|direction|north|south|east|west|cardinal|guiding|pillar|vision/i.test(lower)) {
    return METAPHOR_TYPES.COMPASS;
  }
  if (/road|highway|path|milestone|crossroad|journey|track|route/i.test(lower)) {
    return METAPHOR_TYPES.ROADMAP;
  }
  if (/signpost|sign|choice|decision|fork|option|alternative|destination/i.test(lower)) {
    return METAPHOR_TYPES.SIGNPOST;
  }
  if (/rocket|balloon|launch|orbit|scale|trajectory|stratospher|altitude|propulsion/i.test(lower)) {
    return METAPHOR_TYPES.ROCKET;
  }
  if (/crate|box|jar|contain|storage|categor|bucket|store|inventory/i.test(lower)) {
    return METAPHOR_TYPES.CONTAINERS;
  }

  // Default heuristic based on structure
  if (/phase|month|q[1-4]|stage/i.test(lower)) {
    return METAPHOR_TYPES.ROADMAP;
  }
  return METAPHOR_TYPES.CONTAINERS;
}

/**
 * Deterministic local fallback parser: extracts clean structures from raw text
 * when streaming or offline.
 */
export function parseTextLocally(text, chosenMetaphor) {
  const metaphor = chosenMetaphor || detectBestMetaphor(text);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Extract a sensible title
  let title = "Data Visualization Model";
  if (lines.length > 0) {
    title = lines[0].replace(/^[#*\-•\d\.\s]+/, "").slice(0, 60);
  }

  // Extract bullet points / items
  const items = [];
  lines.slice(1).forEach((line) => {
    const clean = line.replace(/^[#*\-•\d\.\s]+/, "").trim();
    if (clean.length > 3) {
      items.push(clean);
    }
  });

  const base = PRESET_DIAGRAMS[metaphor] ? JSON.parse(JSON.stringify(PRESET_DIAGRAMS[metaphor])) : {};
  base.title = title;
  base.subtitle = `AI-synthesized from input text (${items.length} elements detected)`;
  base.metaphor = metaphor;

  if (metaphor === METAPHOR_TYPES.FLOW) {
    base.stages = [
      { id: "st-1", name: "1. Order Ingestion", lane: "Origin Layer" },
      { id: "st-2", name: "2. Queue & Gateway", lane: "Integration Layer" },
      { id: "st-3", name: "3. Rules & Decision", lane: "Decision Layer" },
      { id: "st-4", name: "4. Warehouse Staging", lane: "Execution Layer" }
    ];

    if (items.length > 0) {
      base.nodes = items.slice(0, 6).map((item, idx) => {
        const stageIdx = Math.min(Math.floor(idx / 1.5), 3);
        const isDec = /check|validat|rule|screen|if|decision|audit/i.test(item);
        return {
          id: `fn-${idx + 1}`,
          stageId: `st-${stageIdx + 1}`,
          title: item.slice(0, 28),
          category: idx === 0 ? "ORIGIN" : isDec ? "DECISION" : idx === items.length - 1 ? "TERMINAL" : "PROCESS",
          desc: item,
          tcode: idx === 0 ? "VA01 / ME21N" : isDec ? "/SAPSLL/SPL_REC" : "SMQ1 / /SCWM/PRDI",
          badge: isDec ? "Decision Fork" : `Step ${idx + 1}`,
          isDecision: isDec,
          status: idx === 0 ? "COMPLETED" : isDec ? "DECISION" : "ACTIVE",
          icon: isDec ? "⚖️" : idx === 0 ? "📄" : "⚡"
        };
      });

      base.connections = [];
      for (let i = 0; i < base.nodes.length - 1; i++) {
        base.connections.push({
          from: base.nodes[i].id,
          to: base.nodes[i + 1].id,
          label: base.nodes[i].isDecision ? "Passed" : "qRFC Concurrency",
          type: base.nodes[i].isDecision ? "success" : "default"
        });
      }
    }
  } else if (metaphor === METAPHOR_TYPES.CONTAINERS) {
    if (items.length > 0) {
      const chunkSize = Math.max(1, Math.ceil(items.length / 4));
      const chunks = [];
      for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
      }
      base.containers = chunks.slice(0, 4).map((chunk, idx) => ({
        id: `c-${idx + 1}`,
        label: `Category ${idx + 1}: ${chunk[0]?.slice(0, 24) || "Data Group"}`,
        type: idx % 2 === 0 ? "wooden_crate" : "glass_jar",
        capacity: `${chunk.length} items logged`,
        badge: idx === 0 ? "Primary Crate" : "Archive Vault",
        items: chunk.map((item, iIdx) => ({
          name: item.slice(0, 40),
          count: `Metric #${iIdx + 1}`,
          status: "Processed"
        }))
      }));
    }
  } else if (metaphor === METAPHOR_TYPES.UMBRELLA) {
    base.canopyTitle = title;
    if (items.length > 0) {
      base.ribs = items.slice(0, 4).map((item, idx) => ({
        id: `rib-${idx + 1}`,
        label: item.slice(0, 24),
        sublabel: "Core Protection Area",
        status: "Active",
        color: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"][idx % 4]
      }));
      base.shelteredElements = items.slice(4, 8).map((item, idx) => ({
        id: `sh-${idx + 1}`,
        title: item.slice(0, 30),
        desc: "Sheltered under governance umbrella policy."
      }));
      if (base.shelteredElements.length === 0) {
        base.shelteredElements = items.slice(0, 3).map((item, idx) => ({
          id: `sh-${idx + 1}`,
          title: `Sheltered Item ${idx + 1}`,
          desc: item
        }));
      }
    }
  } else if (metaphor === METAPHOR_TYPES.LADDER) {
    if (items.length > 0) {
      base.rungs = items.slice(0, 5).map((item, idx, arr) => ({
        step: arr.length - idx,
        title: item.slice(0, 35),
        level: `Rung ${arr.length - idx} ${idx === 0 ? "— Top Goal" : ""}`,
        metric: `Level ${arr.length - idx}`,
        desc: item,
        badge: idx === 0 ? "Target Goal" : (idx === arr.length - 1 ? "Foundation" : "Progress"),
        isTarget: idx === 0,
        isCurrent: idx === Math.floor(arr.length / 2)
      }));
    }
  } else if (metaphor === METAPHOR_TYPES.ROADMAP) {
    if (items.length > 0) {
      base.highwayStops = items.slice(0, 5).map((item, idx, arr) => ({
        mile: `Mile ${idx * 25}`,
        phase: item.slice(0, 30),
        status: idx === 0 ? "Passed" : (idx === 1 ? "Active" : "Upcoming"),
        eta: `Stage ${idx + 1}`,
        details: item,
        roadSign: idx === arr.length - 1 ? "DESTINATION" : `PHASE ${idx + 1}`,
        isCurrent: idx === 1
      }));
    }
  } else if (metaphor === METAPHOR_TYPES.SIGNPOST) {
    if (items.length > 0) {
      const dirs = ["left", "right", "forward"];
      base.signs = items.slice(0, 3).map((item, idx) => ({
        id: `sign-${idx + 1}`,
        direction: dirs[idx % 3],
        destination: item.slice(0, 30),
        distance: `Priority #${idx + 1}`,
        woodTone: ["#78350F", "#92400E", "#A16207"][idx % 3],
        points: [item.slice(0, 50), "Evaluated trade-off path", "Target deliverable"],
        tradeoff: "Resource & implementation consideration"
      }));
    }
  } else if (metaphor === METAPHOR_TYPES.PUZZLE) {
    if (items.length > 0) {
      const positions = ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"];
      base.pieces = items.slice(0, 4).map((item, idx) => ({
        id: `pz-${idx + 1}`,
        label: item.slice(0, 26),
        position: positions[idx % 4],
        color: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"][idx % 4],
        features: [item.slice(0, 40), "Modular Integration Point"],
        connectsWith: [`pz-${((idx + 1) % 4) + 1}`]
      }));
    }
  } else if (metaphor === METAPHOR_TYPES.COMPASS) {
    if (items.length > 0) {
      base.cardinals.north.label = `North Star: ${items[0]?.slice(0, 28) || "Core Vision"}`;
      base.cardinals.north.initiatives = [items[0] || "Primary guiding standard"];
      if (items[1]) {
        base.cardinals.south.label = `South Anchor: ${items[1].slice(0, 28)}`;
        base.cardinals.south.initiatives = [items[1]];
      }
      if (items[2]) {
        base.cardinals.east.label = `East Horizon: ${items[2].slice(0, 28)}`;
        base.cardinals.east.initiatives = [items[2]];
      }
      if (items[3]) {
        base.cardinals.west.label = `West Execution: ${items[3].slice(0, 28)}`;
        base.cardinals.west.initiatives = [items[3]];
      }
    }
  } else if (metaphor === METAPHOR_TYPES.MAGNIFYING) {
    if (items.length > 0) {
      base.drillDown.inspectedComponent = items[0] || "Core Detailed Inspection";
      base.drillDown.findings = items.slice(0, 4).map((item, idx) => ({
        metric: `Insight ${idx + 1}`,
        value: item,
        status: "Analyzed",
        severity: idx === 0 ? "high" : "safe"
      }));
    }
  } else if (metaphor === METAPHOR_TYPES.ROCKET) {
    if (items.length > 0) {
      base.stages = items.slice(0, 4).map((item, idx, arr) => ({
        tier: `Stage ${arr.length - idx}`,
        title: item.slice(0, 36),
        altitude: `${(arr.length - idx) * 20} km Altitude`,
        velocity: `${(arr.length - idx) * 3} km/s`,
        desc: item,
        badge: idx === 0 ? "Orbit Target" : "Thrust Active"
      }));
    }
  }

  return base;
}

/**
 * Full AI Generator: Calls backend to produce deep structured JSON for chosen metaphor.
 * Accepts text prompt and optional attached screenshot / image.
 */
export async function generateMetaphorWithAI(promptText = "", metaphorType = null, attachedImage = null) {
  const effectiveText = promptText || (attachedImage ? `Analyze this attached SAP screenshot and map it into the ${metaphorType || "appropriate"} metaphor.` : "");
  const chosenMetaphor = metaphorType === "auto" || !metaphorType ? detectBestMetaphor(effectiveText) : metaphorType;

  // First create baseline structure immediately
  const localModel = parseTextLocally(effectiveText, chosenMetaphor);

  // Attempt online AI enhancement via chat endpoint with JSON schema prompt
  try {
    const aiSystemPrompt = `You are the Nexus Enterprise SAP & Metaphorical Vector Diagram Architect.
You possess deep authoritative knowledge of SAP S/4HANA, EWM, GTS, SD, PP, MM, FI/CO, and qRFC/bgRFC queue integration.

MISSION:
The user provides text and/or an SAP screenshot/diagram.
1. DEEPLY INSPECT the input text and image for:
   - SAP Module & Domain: SAP EWM, GTS, SD, PP, MM, FI/CO, TM, BTP, qRFC.
   - SAP Transactions & Tools: e.g. SMQ1, SMQ2, /SCWM/STAGE, /SCWM/PRDO, /SCWM/MON, CO01, VA01, VL01N, /SAPSLL/BL_DOCS, SLG1, SM21, SM12, SPRO.
   - SAP Database Tables & Objects: VBAK, LIKP, /SCWM/AQUA, BUT000, MARA, AFKO, PMR (Production Material Request).
   - Core Bottlenecks & Findings: System errors (SYSFAIL, RFC_ERROR), lock collisions, missing parts, blocked sanctions matches.
2. SYNTHESIZE these SAP processes and entities into an accurate, elegant "${chosenMetaphor}" visual illustration.
3. Respond ONLY with a valid JSON object matching the requested metaphor structure (no markdown fences, no preamble, raw JSON).

Metaphor: ${chosenMetaphor}
Available archetype formats:
- flow: { title, subtitle, metaphor: "flow", stages: [{ id, name, lane }], nodes: [{ id, stageId, title, category: "ORIGIN"|"QUEUE"|"DECISION"|"EXECUTION"|"TERMINAL", desc, tcode, badge, status: "COMPLETED"|"ACTIVE"|"DECISION"|"SCHEDULED"|"STANDBY", icon, isDecision: boolean }], connections: [{ from, to, label, type: "default"|"success"|"alert"|"failure" }] }
- containers: { title, subtitle, metaphor: "containers", containers: [{ id, label, type: "wooden_crate"|"glass_jar", capacity, badge, items: [{ name, count, status }] }] }
- umbrella: { title, subtitle, metaphor: "umbrella", canopyTitle, canopySubtitle, ribs: [{ id, label, sublabel, status, color }], shelteredElements: [{ id, title, desc }], rainHazards: ["hazard1"] }
- magnifying: { title, subtitle, metaphor: "magnifying", macroView: { title, nodes: [{ id, label, type, role }] }, drillDown: { title, magnification, inspectedComponent, findings: [{ metric, value, status, severity: "critical"|"high"|"warning"|"safe" }] } }
- ladder: { title, subtitle, metaphor: "ladder", rungs: [{ step: number, title, level, metric, desc, badge, isTarget: boolean, isCurrent: boolean }] }
- puzzle: { title, subtitle, metaphor: "puzzle", interlockCore, pieces: [{ id, label, position, color, features: [], connectsWith: [] }] }
- compass: { title, subtitle, metaphor: "compass", centerCore, cardinals: { north: { code: "N", label, theme, initiatives: [] }, south: {}, east: {}, west: {} } }
- roadmap: { title, subtitle, metaphor: "roadmap", horizonGoal, highwayStops: [{ mile, phase, status, eta, details, roadSign, isCurrent: boolean }] }
- signpost: { title, subtitle, metaphor: "signpost", postTitle, postLocation, signs: [{ id, direction: "left"|"right"|"forward", destination, distance, woodTone, points: [], tradeoff }] }
- rocket: { title, subtitle, metaphor: "rocket", launchObjective, stages: [{ tier, title, altitude, velocity, desc, badge }], balloons: [{ id, title, altitude, color }] }`;

    const userParts = [{ text: `Analyze and convert this data/screenshot into the "${chosenMetaphor}" metaphor JSON:\n\n${effectiveText}` }];
    if (attachedImage?.base64Data) {
      userParts.push({
        inlineData: {
          mimeType: attachedImage.mimeType || "image/png",
          data: attachedImage.base64Data
        }
      });
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: userParts }
        ],
        systemInstruction: { parts: [{ text: aiSystemPrompt }] },
        mode: "DOCUMENT_TASK"
      })
    });

    if (response.ok) {
      const textStream = await response.text();
      // Extract data from SSE or direct text
      let rawJsonStr = "";
      const lines = textStream.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) rawJsonStr += chunk;
          } catch(e) {}
        }
      }

      if (!rawJsonStr && textStream.trim().startsWith("{")) {
        rawJsonStr = textStream;
      }

      if (rawJsonStr) {
        // Strip markdown backticks if any
        const cleaned = rawJsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonText = cleaned.slice(firstBrace, lastBrace + 1);
          const parsedModel = JSON.parse(jsonText);
          if (parsedModel && parsedModel.title) {
            parsedModel.metaphor = chosenMetaphor;
            return parsedModel;
          }
        }
      }
    }
  } catch (err) {
    console.warn("AI generation fell back to deterministic parser:", err.message);
  }

  return localModel;
}
