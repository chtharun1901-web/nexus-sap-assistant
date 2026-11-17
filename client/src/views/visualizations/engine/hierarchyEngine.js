/**
 * Nexus Enterprise Hierarchy Engine
 * Single, unified visual design engine replacing all disparate archetypes.
 *
 * Mandate:
 * - Every prompt is analyzed into a content-aware, presentation-grade Multi-Tier Hierarchy.
 * - Tier 1: Red (#E50000)
 * - Tier 2: Royal Blue (#0066CC)
 * - Tier 3: Bright Cyan (#00AEEF)
 * - Tier 4: Magenta (#D500A3)
 * - Tier 5+: Amber (#FF7700) or Emerald (#00A86B)
 * - Right Legend Column: Green-bordered white boxes (#5CA838) with bold black level descriptors.
 * - Branching bus connectors with downward drop arrowheads (↓).
 */

export const STARTER_HIERARCHY = {
  id: "vis-starter-hierarchy",
  title: "Enterprise Sales & Distribution Structure",
  subtitle: "Multi-Tier Commercial & Organizational Alignment Model",
  visualType: "enterprise_hierarchy",
  levels: [
    {
      levelIndex: 1,
      levelName: "Company",
      color: "#E50000",
      nodes: [
        { id: "n1-1", label: "ABC Corporation", parentId: null }
      ]
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
  ],
  createdAt: new Date().toISOString()
};

/**
 * Deterministic Content-Aware Local Hierarchy Parser
 * Analyzes unstructured prompts, bullet points, tabbed hierarchies, or sentences.
 */
export function parsePromptLocallyToHierarchy(rawText = "") {
  const text = (rawText || "").trim();
  if (!text) return JSON.parse(JSON.stringify(STARTER_HIERARCHY));

  const lower = text.toLowerCase();

  // 1. Detect Domain & Assign Appropriate Right-Side Green Level Descriptors
  let levelNames = ["Corporate Core", "Business Unit", "Operational Channel", "Execution Unit"];

  if (/sales|distribution|o2c|order to cash|pricing|shipping/i.test(lower)) {
    levelNames = ["Company", "Sales Organization", "Dist. Channel", "Division"];
  } else if (/procure|purchas|p2p|vendor|sourcing|invoice/i.test(lower)) {
    levelNames = ["Client / Enterprise", "Company Code", "Purchasing Org", "Plant / Storage Loc"];
  } else if (/warehouse|ewm|storage|putaway|picking|inbound|outbound/i.test(lower)) {
    levelNames = ["Warehouse Complex", "Storage Type", "Storage Section", "Bin / Unit Group"];
  } else if (/architecture|cloud|api|platform|integration|database|frontend/i.test(lower)) {
    levelNames = ["Enterprise Core", "Platform Systems", "Integration & APIs", "Data & Execution"];
  } else if (/security|compliance|gts|risk|sox|gdpr|audit/i.test(lower)) {
    levelNames = ["Governance Core", "Compliance Domain", "Risk Controls", "Operational Evidence"];
  } else if (/team|leadership|org|department|division|human resource/i.test(lower)) {
    levelNames = ["Executive Leadership", "Department / VP", "Functional Group", "Project Teams"];
  }

  // 2. Extract Title from first line or meaningful phrase
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let title = "Enterprise Hierarchy Architecture";
  let subtitle = "Content-Aware Multi-Tier Structural Model";

  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[#*\-•\d\.\s]+/, "").trim();
    if (firstLine.length > 4 && firstLine.length < 80) {
      title = firstLine;
    }
  }

  // 3. Extract items/tokens from lines or comma/tab separated content
  const tokens = [];
  lines.forEach((line) => {
    // If line has tabs or pipes or commas
    const parts = line.split(/[\t|;,]/).map((p) => p.replace(/^[#*\-•\d\.\s]+/, "").trim()).filter(Boolean);
    parts.forEach((p) => {
      if (p.length > 2 && !tokens.includes(p)) tokens.push(p);
    });
  });

  // Ensure we have meaningful nodes across 4 tiers
  // Level 1: Root Node (1 item)
  const l1Label = tokens[0] || (title.length < 35 ? title : "Enterprise Platform");

  // Level 2: 2-3 items
  let l2Items = tokens.slice(1, 4);
  if (l2Items.length === 0) {
    if (levelNames[1] === "Sales Organization") l2Items = ["Local Sales Organization", "Institutional Sales", "Export Sales Org"];
    else if (levelNames[1] === "Company Code") l2Items = ["Corporate CC 1000", "Regional CC 2000", "International CC 3000"];
    else l2Items = ["Primary Core Service", "Operations & Delivery", "Strategic Growth Unit"];
  }

  // Level 3: 3-4 items
  let l3Items = tokens.slice(4, 8);
  if (l3Items.length === 0) {
    if (levelNames[2] === "Dist. Channel") l3Items = ["Direct Sales", "Wholesale Distribution", "Retail Channel", "Online Portal"];
    else if (levelNames[2] === "Purchasing Org") l3Items = ["Central Procurement", "Regional Purchasing", "Plant Materials", "Direct Vendor"];
    else l3Items = ["Core Application API", "Workflow Engine", "Integration Queue", "Monitoring Gateway"];
  }

  // Level 4: 4 items
  let l4Items = tokens.slice(8, 12);
  if (l4Items.length === 0) {
    if (levelNames[3] === "Division") l4Items = ["Commercial Products", "Enterprise Hardware", "Software Licenses", "Maintenance Services"];
    else if (levelNames[3] === "Plant / Storage Loc") l4Items = ["Raw Materials", "Work-in-Process", "Finished Goods", "Quality Inspection"];
    else l4Items = ["Production Execution", "Reporting & Dashboards", "Security Enforcement", "Audit Compliance"];
  }

  return {
    id: "hier-" + Date.now().toString(36),
    title,
    subtitle,
    visualType: "enterprise_hierarchy",
    levels: [
      {
        levelIndex: 1,
        levelName: levelNames[0],
        color: "#E50000",
        nodes: [{ id: "n1-1", label: l1Label, parentId: null }]
      },
      {
        levelIndex: 2,
        levelName: levelNames[1],
        color: "#0066CC",
        nodes: l2Items.map((item, idx) => ({
          id: `n2-${idx + 1}`,
          label: item,
          parentId: "n1-1"
        }))
      },
      {
        levelIndex: 3,
        levelName: levelNames[2],
        color: "#00AEEF",
        nodes: l3Items.map((item, idx) => ({
          id: `n3-${idx + 1}`,
          label: item,
          parentId: `n2-${(idx % l2Items.length) + 1}`
        }))
      },
      {
        levelIndex: 4,
        levelName: levelNames[3],
        color: "#D500A3",
        nodes: l4Items.map((item, idx) => ({
          id: `n4-${idx + 1}`,
          label: item,
          parentId: `n3-${(idx % l3Items.length) + 1}`
        }))
      }
    ],
    createdAt: new Date().toISOString()
  };
}

/**
 * Intelligent AI Generation
 * Sends request to backend to extract precise business entities and tiers.
 */
export async function generateHierarchyWithAI(promptText = "", attachedFile = null) {
  const localFallback = parsePromptLocallyToHierarchy(promptText || attachedFile?.textContent || "");

  try {
    const aiSystemPrompt = `You are the Senior Enterprise Information Architect and Presentation Designer for Nexus.
Analyze the user's prompt or attached business document and construct a clean, authoritative Multi-Tier Enterprise Hierarchy Diagram.

VISUAL PARADIGM (STRICT):
The diagram is structured as 3 to 5 vertical tiers:
- Level 1 (Top Level): Central Enterprise Core / Root Corporation. (Red box: #E50000). 1 node.
- Level 2: Primary Sub-systems, Regional Organizations, or Core Functional Units. (Royal Blue: #0066CC). 2-4 nodes.
- Level 3: Distribution Channels, Process Streams, Interfaces, or Operating Units. (Bright Cyan: #00AEEF). 3-5 nodes.
- Level 4: Divisions, Product Categories, Storage Locations, Execution Units, or Components. (Magenta: #D500A3). 3-6 nodes.
- Level 5 (Optional if detailed): Detailed execution deliverables or tasks.

RIGHT-HAND LEGEND COLUMN:
For each tier, define the exact semantic name for the green-bordered legend box (e.g. "Company", "Sales Organization", "Dist. Channel", "Division", "Company Code", "Plant", "Storage Location", "Platform Core", etc.).

RESPOND ONLY WITH VALID RAW JSON (no markdown backticks, no preamble):
{
  "title": "Authoritative Diagram Title",
  "subtitle": "Short descriptive subtitle",
  "levels": [
    {
      "levelIndex": 1,
      "levelName": "Company",
      "nodes": [
        { "id": "n1-1", "label": "ABC Corporation", "parentId": null }
      ]
    },
    {
      "levelIndex": 2,
      "levelName": "Sales Organization",
      "nodes": [
        { "id": "n2-1", "label": "Local Sales Organization", "parentId": "n1-1" },
        { "id": "n2-2", "label": "Institutional Sales Organization", "parentId": "n1-1" },
        { "id": "n2-3", "label": "Export Sales Organization", "parentId": "n1-1" }
      ]
    },
    {
      "levelIndex": 3,
      "levelName": "Dist. Channel",
      "nodes": [
        { "id": "n3-1", "label": "Direct Sales", "parentId": "n2-1" },
        { "id": "n3-2", "label": "Wholesale Distribution", "parentId": "n2-1" },
        { "id": "n3-3", "label": "Retail Sales", "parentId": "n2-2" },
        { "id": "n3-4", "label": "Online Sales", "parentId": "n2-3" }
      ]
    },
    {
      "levelIndex": 4,
      "levelName": "Division",
      "nodes": [
        { "id": "n4-1", "label": "Home appliances", "parentId": "n3-1" },
        { "id": "n4-2", "label": "Tablets", "parentId": "n3-2" },
        { "id": "n4-3", "label": "Smartphones", "parentId": "n3-3" },
        { "id": "n4-4", "label": "Laptops", "parentId": "n3-4" }
      ]
    }
  ]
}`;

    const userParts = [{ text: `Analyze and map this request into the Multi-Tier Enterprise Hierarchy JSON:\n\n${promptText || attachedFile?.textContent || "Enterprise Architecture"}` }];
    if (attachedFile?.base64Data) {
      userParts.push({
        inlineData: {
          mimeType: attachedFile.mimeType || "image/png",
          data: attachedFile.base64Data
        }
      });
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: userParts }],
        systemInstruction: { parts: [{ text: aiSystemPrompt }] },
        mode: "DOCUMENT_TASK"
      })
    });

    if (res.ok) {
      const textStream = await res.text();
      let rawJsonStr = "";
      const lines = textStream.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) rawJsonStr += chunk;
          } catch (_) {}
        }
      }

      if (!rawJsonStr && textStream.trim().startsWith("{")) {
        rawJsonStr = textStream;
      }

      if (rawJsonStr) {
        const cleaned = rawJsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonText = cleaned.slice(firstBrace, lastBrace + 1);
          const parsedModel = JSON.parse(jsonText);
          if (parsedModel && parsedModel.levels && parsedModel.levels.length > 0) {
            // Apply standard colors to tiers
            const tierColors = ["#E50000", "#0066CC", "#00AEEF", "#D500A3", "#FF7700", "#00A86B"];
            parsedModel.levels.forEach((lvl, idx) => {
              lvl.levelIndex = idx + 1;
              lvl.color = tierColors[idx % tierColors.length];
            });

            return {
              id: "hier-" + Date.now().toString(36),
              visualType: "enterprise_hierarchy",
              title: parsedModel.title || localFallback.title,
              subtitle: parsedModel.subtitle || localFallback.subtitle,
              levels: parsedModel.levels,
              createdAt: new Date().toISOString()
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn("Hierarchy AI generation fell back to deterministic parser:", err.message);
  }

  return localFallback;
}
