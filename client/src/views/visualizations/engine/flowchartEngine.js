/**
 * Nexus Presentation-Grade Flowchart Engine
 * Generates horizontal swimlane decision flowcharts matching Images 2, 3, and 4.
 *
 * Visual Paradigm:
 * - Horizontal Swimlanes with left-side colored category cards
 * - Left-to-right process progression
 * - Standard Flowchart Shapes:
 *   - Start / End Terminators (Rounded Pills)
 *   - Process Rectangles
 *   - Decision Diamonds with "YES" / "NO" branch pill badges
 *   - Parallelograms (Input/Output)
 *   - Rejection / Error Terminators (Red pills)
 */

export const STARTER_FLOWCHART = {
  id: "vis-starter-flowchart",
  title: "Customer Order Processing & Fulfillment System",
  subtitle: "Cross-Functional Swimlane Flowchart with Decision Gates & Exception Loops",
  visualType: "flowchart",
  lanes: [
    { id: "lane-cust", name: "Customer / Storefront", color: "#F59E0B" },
    { id: "lane-sales", name: "Sales & Order Desk", color: "#E11D48" },
    { id: "lane-inv", name: "Inventory & Warehouse", color: "#0D9488" },
    { id: "lane-ship", name: "Logistics & Delivery", color: "#0284C7" }
  ],
  nodes: [
    { id: "fc-1", label: "Place Purchase Order", laneId: "lane-cust", type: "start", step: 1 },
    { id: "fc-2", label: "Verify Order Details", laneId: "lane-sales", type: "process", step: 2 },
    { id: "fc-3", label: "Credit Limit OK?", laneId: "lane-sales", type: "decision", step: 3 },
    { id: "fc-3-rej", label: "Notify Rejection", laneId: "lane-cust", type: "end_error", step: 3 },
    { id: "fc-4", label: "Query Stock Level", laneId: "lane-inv", type: "process", step: 4 },
    { id: "fc-5", label: "Item In Stock?", laneId: "lane-inv", type: "decision", step: 5 },
    { id: "fc-5-back", label: "Trigger Backorder", laneId: "lane-sales", type: "process", step: 5 },
    { id: "fc-6", label: "Pick, Pack & Label", laneId: "lane-inv", type: "process", step: 6 },
    { id: "fc-7", label: "Dispatch Carrier Delivery", laneId: "lane-ship", type: "process", step: 7 },
    { id: "fc-8", label: "Order Fulfilled (End)", laneId: "lane-ship", type: "end", step: 8 }
  ],
  edges: [
    { from: "fc-1", to: "fc-2" },
    { from: "fc-2", to: "fc-3" },
    { from: "fc-3", to: "fc-4", label: "YES" },
    { from: "fc-3", to: "fc-3-rej", label: "NO" },
    { from: "fc-4", to: "fc-5" },
    { from: "fc-5", to: "fc-6", label: "YES" },
    { from: "fc-5", to: "fc-5-back", label: "NO" },
    { from: "fc-6", to: "fc-7" },
    { from: "fc-7", to: "fc-8" }
  ],
  createdAt: new Date().toISOString()
};

/**
 * Deterministic Content-Aware Local Flowchart Parser
 */
export function parsePromptLocallyToFlowchart(rawText = "") {
  const text = (rawText || "").trim();
  if (!text) return JSON.parse(JSON.stringify(STARTER_FLOWCHART));

  const lower = text.toLowerCase();

  // 1. Choose Domain-Specific Swimlanes
  let lanes = [
    { id: "l-1", name: "Initiator / Client", color: "#F59E0B" },
    { id: "l-2", name: "Review & Approval", color: "#E11D48" },
    { id: "l-3", name: "Operations / Execution", color: "#0D9488" },
    { id: "l-4", name: "Delivery / Completion", color: "#0284C7" }
  ];

  if (/order|sales|commerce|checkout|shopping|cart|payment/i.test(lower)) {
    lanes = [
      { id: "l-1", name: "Customer / Storefront", color: "#F59E0B" },
      { id: "l-2", name: "Sales & Order Desk", color: "#E11D48" },
      { id: "l-3", name: "Inventory & Warehouse", color: "#0D9488" },
      { id: "l-4", name: "Logistics & Delivery", color: "#0284C7" }
    ];
  } else if (/procure|purchas|p2p|vendor|sourcing|invoice|po /i.test(lower)) {
    lanes = [
      { id: "l-1", name: "Department Requester", color: "#F59E0B" },
      { id: "l-2", name: "Purchasing & Sourcing", color: "#0284C7" },
      { id: "l-3", name: "Finance & Accounts Payable", color: "#E11D48" },
      { id: "l-4", name: "Vendor Fulfillment", color: "#0D9488" }
    ];
  } else if (/incident|ticket|support|itil|devops|escalat|bug/i.test(lower)) {
    lanes = [
      { id: "l-1", name: "End User / Reporting", color: "#F59E0B" },
      { id: "l-2", name: "Tier 1 Helpdesk", color: "#0284C7" },
      { id: "l-3", name: "Tier 2 Engineering", color: "#E11D48" },
      { id: "l-4", name: "Release & Closure", color: "#0D9488" }
    ];
  } else if (/return|rma|refund|warranty|exchange/i.test(lower)) {
    lanes = [
      { id: "l-1", name: "Customer Requester", color: "#F59E0B" },
      { id: "l-2", name: "Support Evaluation", color: "#E11D48" },
      { id: "l-3", name: "Quality & Inspection", color: "#0D9488" },
      { id: "l-4", name: "Finance & Refund", color: "#0284C7" }
    ];
  }

  // 2. Extract Title and Subtitle
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let title = "Cross-Functional Process Flowchart";
  let subtitle = "End-to-End Decision Flow & Execution Pathway";

  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[#*\-•\d\.\s]+/, "").trim();
    if (firstLine.length > 4 && firstLine.length < 90) {
      title = firstLine;
    }
  }

  // 3. Extract Steps from lines or create standard flowchart steps
  const stepsFound = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleaned = line.replace(/^[#*\-•\d\.\s]+/, "").trim();
    if (cleaned.length > 3 && cleaned.length < 70 && !cleaned.toLowerCase().startsWith("title")) {
      stepsFound.push(cleaned);
    }
    if (stepsFound.length >= 8) break;
  }

  const nodes = [];
  const edges = [];

  if (stepsFound.length >= 4) {
    // Build from extracted lines
    stepsFound.forEach((stepText, idx) => {
      const stepNum = idx + 1;
      const isStart = idx === 0;
      const isEnd = idx === stepsFound.length - 1;
      const isDecision = stepText.includes("?") || /approve|check|validate|verify|valid/i.test(stepText);

      let type = "process";
      if (isStart) type = "start";
      else if (isEnd) type = "end";
      else if (isDecision) type = "decision";

      // Assign lane in round-robin or based on keywords
      let laneIdx = idx % lanes.length;
      if (isStart) laneIdx = 0;
      else if (isEnd) laneIdx = lanes.length - 1;
      else if (isDecision) laneIdx = 1;

      const nodeId = `fn-${stepNum}`;
      nodes.push({
        id: nodeId,
        label: stepText,
        laneId: lanes[laneIdx].id,
        type,
        step: stepNum
      });

      if (idx > 0) {
        const prevNode = nodes[nodes.length - 2];
        const isPrevDecision = prevNode.type === "decision";
        edges.push({
          from: prevNode.id,
          to: nodeId,
          label: isPrevDecision ? "YES" : ""
        });
      }
    });

    // Check if there was a decision; add a rejection/alternate path if so
    const decNode = nodes.find((n) => n.type === "decision");
    if (decNode) {
      const rejId = `${decNode.id}-alt`;
      nodes.push({
        id: rejId,
        label: "Escalate / Reject",
        laneId: lanes[0].id,
        type: "end_error",
        step: decNode.step
      });
      edges.push({
        from: decNode.id,
        to: rejId,
        label: "NO"
      });
    }
  } else {
    // Return structured template adapted to the detected domain
    return {
      id: "fc-" + Date.now().toString(36),
      visualType: "flowchart",
      title,
      subtitle,
      lanes,
      nodes: [
        { id: "n1", label: `Initiate ${title}`, laneId: lanes[0].id, type: "start", step: 1 },
        { id: "n2", label: "Review & Validate Input", laneId: lanes[1].id, type: "process", step: 2 },
        { id: "n3", label: "Meets Requirements?", laneId: lanes[1].id, type: "decision", step: 3 },
        { id: "n3-rej", label: "Return for Revision", laneId: lanes[0].id, type: "end_error", step: 3 },
        { id: "n4", label: "Execute Operational Flow", laneId: lanes[2].id, type: "process", step: 4 },
        { id: "n5", label: "Quality Check Passed?", laneId: lanes[2].id, type: "decision", step: 5 },
        { id: "n6", label: "Finalize & Deliver", laneId: lanes[3].id, type: "process", step: 6 },
        { id: "n7", label: "Process Completed", laneId: lanes[3].id, type: "end", step: 7 }
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4", label: "YES" },
        { from: "n3", to: "n3-rej", label: "NO" },
        { from: "n4", to: "n5" },
        { from: "n5", to: "n6", label: "YES" },
        { from: "n5", to: "n2", label: "NO" },
        { from: "n6", to: "n7" }
      ],
      createdAt: new Date().toISOString()
    };
  }

  return {
    id: "fc-" + Date.now().toString(36),
    visualType: "flowchart",
    title,
    subtitle,
    lanes,
    nodes,
    edges,
    createdAt: new Date().toISOString()
  };
}

/**
 * AI-Powered Flowchart Generator
 * Uses Gemini via /api/chat to output presentation-grade horizontal swimlane flowcharts.
 */
export async function generateFlowchartWithAI(promptText = "", attachedFile = null) {
  const localFallback = parsePromptLocallyToFlowchart(promptText || attachedFile?.textContent || "");

  try {
    const aiSystemPrompt = `You are the Lead Visual Solutions Architect for Enterprise Flowcharts.
Your task is to transform any user process description, workflow prompt, or image into a Presentation-Grade Horizontal Swimlane Decision Flowchart matching ANSI/ISO flowchart standards and modern executive presentation decks.

CRITICAL ARCHITECTURE RULES:
1. LAYOUT IS HORIZONTAL SWIMLANES:
   - Process flows strictly from LEFT to RIGHT across sequential steps (step 1, step 2, step 3, etc.).
   - NOT A VERTICAL WATERFALL! Each functional department/role owns a horizontal band.
2. SWIMLANES (3 to 4 distinct lanes):
   - Example 1 (Order Processing): "Customer / Storefront", "Sales & Order Desk", "Inventory & Warehouse", "Logistics & Delivery"
   - Example 2 (Procure to Pay): "Department Requester", "Purchasing & Sourcing", "Finance & Accounts Payable", "Vendor Fulfillment"
   - Example 3 (Incident Management): "End User / Support", "Tier 1 Helpdesk", "Tier 2 Engineering", "Release & Closure"
   - Each lane must have a distinct bold color: Amber (#F59E0B), Rose/Crimson (#E11D48), Teal (#0D9488), Blue (#0284C7).
3. FLOWCHART SHAPES (type field):
   - "start": First step terminator (stadium pill shape, green/lime).
   - "process": Standard operational action (crisp rectangle).
   - "decision": Decision gate diamond (question with question mark, e.g. "Approved?", "In Stock?", "Meets SLA?").
   - "io": Input or Output document (parallelogram shape).
   - "end": Successful completion terminator (emerald green stadium pill).
   - "end_error": Rejection, escalation, or cancellation (red stadium pill).
4. DECISION BRANCHING (edges):
   - Every "decision" node MUST have at least two outgoing edges:
     - One edge with label "YES" continuing the forward happy path.
     - One edge with label "NO" branching down or looping back to handle exceptions / rejections.
5. STEPS:
   - Provide "step" integer (1 to 8) on each node indicating its horizontal column position.
   - Keep node labels concise, professional, and action-oriented (2-4 words per label).

RESPOND ONLY WITH VALID RAW JSON (no markdown backticks, no preamble):
{
  "title": "Authoritative Flowchart Title",
  "subtitle": "Short descriptive subtitle of the workflow",
  "visualType": "flowchart",
  "lanes": [
    { "id": "lane-1", "name": "Customer / Front-End", "color": "#F59E0B" },
    { "id": "lane-2", "name": "Sales & Operations", "color": "#E11D48" },
    { "id": "lane-3", "name": "Fulfillment & Warehouse", "color": "#0D9488" },
    { "id": "lane-4", "name": "Logistics & Delivery", "color": "#0284C7" }
  ],
  "nodes": [
    { "id": "n1", "label": "Place Purchase Order", "laneId": "lane-1", "type": "start", "step": 1 },
    { "id": "n2", "label": "Validate Order Details", "laneId": "lane-2", "type": "process", "step": 2 },
    { "id": "n3", "label": "Credit Limit OK?", "laneId": "lane-2", "type": "decision", "step": 3 },
    { "id": "n3-rej", "label": "Reject Order", "laneId": "lane-1", "type": "end_error", "step": 3 },
    { "id": "n4", "label": "Check Inventory", "laneId": "lane-3", "type": "process", "step": 4 },
    { "id": "n5", "label": "In Stock?", "laneId": "lane-3", "type": "decision", "step": 5 },
    { "id": "n6", "label": "Pick & Pack Items", "laneId": "lane-3", "type": "process", "step": 6 },
    { "id": "n7", "label": "Carrier Dispatch", "laneId": "lane-4", "type": "process", "step": 7 },
    { "id": "n8", "label": "Order Delivered", "laneId": "lane-4", "type": "end", "step": 8 }
  ],
  "edges": [
    { "from": "n1", "to": "n2" },
    { "from": "n2", "to": "n3" },
    { "from": "n3", "to": "n4", "label": "YES" },
    { "from": "n3", "to": "n3-rej", "label": "NO" },
    { "from": "n4", "to": "n5" },
    { "from": "n5", "to": "n6", "label": "YES" },
    { "from": "n6", "to": "n7" },
    { "from": "n7", "to": "n8" }
  ]
}`;

    const userParts = [{ text: `Analyze and convert this process into a Horizontal Swimlane Decision Flowchart JSON:\n\n${promptText || attachedFile?.textContent || "Customer Order Processing"}` }];
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
          if (parsedModel && parsedModel.lanes && parsedModel.nodes && parsedModel.nodes.length > 0) {
            return {
              id: "fc-" + Date.now().toString(36),
              visualType: "flowchart",
              title: parsedModel.title || localFallback.title,
              subtitle: parsedModel.subtitle || localFallback.subtitle,
              lanes: parsedModel.lanes,
              nodes: parsedModel.nodes,
              edges: parsedModel.edges || [],
              createdAt: new Date().toISOString()
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn("Flowchart AI generation fell back to deterministic parser:", err.message);
  }

  return localFallback;
}
