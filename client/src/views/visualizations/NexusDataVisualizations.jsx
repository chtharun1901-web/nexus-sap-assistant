import React, { useState, useRef, useEffect } from "react";
import { generateHierarchyWithAI, STARTER_HIERARCHY, parsePromptLocallyToHierarchy } from "./engine/hierarchyEngine.js";
import { generateFlowchartWithAI, STARTER_FLOWCHART, parsePromptLocallyToFlowchart } from "./engine/flowchartEngine.js";
import { executeStrategyAnalysis, buildLocalStrategyModel, VISUAL_PATTERNS } from "./engine/strategyPipeline.js";
import { exportToEditablePowerPoint } from "./engine/pptxExport.js";
import { downloadSvg, downloadPng, copySvgToClipboard, downloadJson } from "./engine/exportUtils.js";
import MetaphorCanvas from "./components/MetaphorCanvas.jsx";
import NodeInspectorModal from "./components/NodeInspectorModal.jsx";
import VisualizationsSidebar from "./components/VisualizationsSidebar.jsx";
import VisualizationEntryHero from "./components/VisualizationEntryHero.jsx";
import { parseUploadedFile } from "./engine/fileParser.js";
import { ClaudeThinkingFlower } from "../../components/MermaidDiagram.jsx";
import { parseNexusSapAnswer } from "../../services/sapAnswerPptxParser.js";
import { generateSapKnowledgeDeck } from "../../services/sapKnowledgeDeckGenerator.js";
import PresentationDeckPreview from "./components/PresentationDeckPreview.jsx";
import ReasoningOverlay from "./components/ReasoningOverlay.jsx";

const STORAGE_KEY = "nexus_saved_visualizations";

export const DESIGN_MODULES = [
  { id: "full_deck", name: "👑 Full Executive Deck (12 Slides)", icon: "👑", description: "Complete 8-layer SAP architecture & interview delivery" },
  { id: "process_determination", name: "🔀 Process Flow & Determinations", icon: "🔀", description: "Business process flows, shipping point & pricing determination logic" },
  { id: "data_model", name: "🏛️ Data Model & Containers", icon: "🏛️", description: "BUT000, KNA1, KNVV, KNVS table relationships and data model containers" },
  { id: "migration_bridge", name: "🌉 ECC vs S/4HANA Strategic Bridge", icon: "🌉", description: "Direct customer maintenance vs CVI Business Partner synchronization" },
  { id: "cross_module", name: "🕸️ Cross-Module Ecosystem", icon: "🕸️", description: "Hub-and-spoke touchpoints across SD, FI, MM, and Logistics Execution" },
  { id: "flowchart", name: "Process Flowchart", icon: "🔀", description: "Horizontal swimlanes, decision diamonds & Yes/No paths" },
  { id: "enterprise_hierarchy", name: "Enterprise Hierarchy", icon: "🏛️", description: "Multi-tier organizational & structural model" }
];

function exportWordDocument(model) {
  const title = model.professionalTitle || model.topicTitle || "SAP Technical Investigation Report";
  const caseId = model.caseId || "NX-EXECUTIVE-REPORT";
  const dateStr = new Date().toLocaleString();
  
  let tcodeRows = "";
  if (model.tCodes?.length) {
    tcodeRows = model.tCodes.map((t, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding:8px 12px;border:1px solid #CBD5E1;font-family:Consolas,monospace;font-weight:bold;color:#6E1A2D;width:160px;">${t.code || t}</td>
        <td style="padding:8px 12px;border:1px solid #CBD5E1;color:#334155;">${t.desc || t.description || 'SAP Transaction'}</td>
      </tr>
    `).join("");
  }

  let tableRows = "";
  if (model.tablesAndFields?.length) {
    tableRows = model.tablesAndFields.map((tf, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding:8px 12px;border:1px solid #CBD5E1;font-family:Consolas,monospace;font-weight:bold;color:#2563EB;width:140px;">${tf.table}</td>
        <td style="padding:8px 12px;border:1px solid #CBD5E1;color:#334155;">${tf.description || ''}</td>
        <td style="padding:8px 12px;border:1px solid #CBD5E1;font-family:Consolas,monospace;color:#64748B;">${Array.isArray(tf.keyFields) ? tf.keyFields.join(", ") : tf.keyFields || ''}</td>
      </tr>
    `).join("");
  }

  let flowItems = "";
  if (model.processFlow?.length) {
    flowItems = model.processFlow.map((step, idx) => `
      <li style="margin-bottom:8px;color:#334155;"><strong>Step ${idx + 1}: ${step.stepName || step.label}</strong> — ${step.details || ''}</li>
    `).join("");
  }

  const wordContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <style>
    @page { margin: 1in; size: portrait; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; color: #1E293B; line-height: 1.6; font-size: 11pt; }
    .header-banner { background: #0F172A; color: #FFFFFF; padding: 22px 26px; border-radius: 6px; border-left: 6px solid #6E1A2D; margin-bottom: 24px; }
    .sec-title { font-size: 12.5pt; font-weight: bold; color: #0F172A; border-bottom: 2px solid #6E1A2D; padding-bottom: 4px; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 18px; }
    th { background: #0F172A; color: #FFFFFF; font-weight: bold; text-align: left; padding: 9px 12px; border: 1px solid #0F172A; font-size: 10pt; }
    td { padding: 8px 12px; border: 1px solid #CBD5E1; font-size: 10pt; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #CBD5E1; font-size: 9pt; color: #64748B; text-align: center; }
  </style>
</head>
<body>
  <div class="header-banner">
    <div style="font-size:10pt;color:#F3CBD2;font-weight:bold;letter-spacing:1px;margin-bottom:4px;">NEXUS SAP ENTERPRISE INTELLIGENCE REPORT</div>
    <h1 style="margin:0;font-size:19pt;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;">${title}</h1>
    <div style="font-size:9.5pt;color:#94A3B8;margin-top:8px;">Case: <strong>${caseId}</strong> | Generated: ${dateStr}</div>
  </div>

  <div class="sec-title">1. Executive Direct Answer</div>
  <p>${model.directAnswer || ''}</p>

  ${flowItems ? `
  <div class="sec-title">2. Business Process Flow</div>
  <ol>${flowItems}</ol>
  ` : ''}

  ${tcodeRows ? `
  <div class="sec-title">3. Transaction Codes & SPRO Paths</div>
  <table>
    <thead><tr><th>Transaction Code</th><th>Description & Function</th></tr></thead>
    <tbody>${tcodeRows}</tbody>
  </table>
  ` : ''}

  ${tableRows ? `
  <div class="sec-title">4. Database Architecture & Table Models</div>
  <table>
    <thead><tr><th>Table</th><th>Description</th><th>Key Fields</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  ` : ''}

  <div class="footer">
    Generated by Nexus SAP Enterprise Copilot • Executive Word Template v2.4 • Confidential Enterprise Documentation
  </div>
</body>
</html>`;

  const blob = new Blob([wordContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(caseId || "Nexus").replace(/[^a-zA-Z0-9_-]/g, "_")}_Investigation_Report.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function NexusDataVisualizations({ onNavigate }) {
  // Saved Visualizations List (stored in localStorage)
  const [savedVisualizations, setSavedVisualizations] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    // Rich initial library of diverse presentation-grade designs and modules
    const starterBridge = buildLocalStrategyModel("SAP S/4HANA Modernization Bridge", VISUAL_PATTERNS.CURRENT_TO_BE_BRIDGE);
    starterBridge.id = "vis-starter-bridge";
    const starterHub = buildLocalStrategyModel("Enterprise S/4HANA Ecosystem Landscape", VISUAL_PATTERNS.HUB_AND_SPOKE);
    starterHub.id = "vis-starter-hub";
    const starterMatrix = buildLocalStrategyModel("Digital Enterprise Prioritization Matrix", VISUAL_PATTERNS.MATRIX_2X2);
    starterMatrix.id = "vis-starter-matrix";

    return [STARTER_FLOWCHART, STARTER_HIERARCHY, starterBridge, starterHub, starterMatrix];
  });

  // Active diagram ID: null represents the "What do you want to generate?" entry hero page
  const [activeDiagramId, setActiveDiagramId] = useState(null);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModule, setSelectedModule] = useState("auto");
  const [zoom, setZoom] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Presentation Previewer & Reasoning Overlay States
  const [presentationDeckModel, setPresentationDeckModel] = useState(null);
  const [isReasoningOverlayOpen, setIsReasoningOverlayOpen] = useState(false);
  const [reasoningTopic, setReasoningTopic] = useState("");
  const pendingSapModelRef = useRef(null);

  // Bottom refine prompt & image
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refineImage, setRefineImage] = useState(null);
  const refineFileInputRef = useRef(null);

  // Inspector modal state
  const [editingNode, setEditingNode] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingLevelIndex, setEditingLevelIndex] = useState(null);

  const canvasRef = useRef(null);

  // Sync saved list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedVisualizations));
    } catch (_) {}
  }, [savedVisualizations]);

  // Handle "+ New Visualization"
  const handleNewVisualization = () => {
    setActiveDiagramId(null);
    setCurrentDiagram(null);
    setPresentationDeckModel(null);
    setRefinePrompt("");
    setRefineImage(null);
  };

  // Handle selecting a saved visualization from the left sidebar
  const handleSelectSaved = (item) => {
    setActiveDiagramId(item.id);
    setCurrentDiagram(JSON.parse(JSON.stringify(item)));
    if (item.sapModel) {
      setPresentationDeckModel(item.sapModel);
    } else {
      setPresentationDeckModel(null);
    }
    if (canvasRef.current) canvasRef.current.resetView();
  };

  // Handle deleting a visualization from sidebar
  const handleDeleteSaved = (idToDelete) => {
    setSavedVisualizations((prev) => prev.filter((item) => item.id !== idToDelete));
    if (activeDiagramId === idToDelete) {
      handleNewVisualization();
    }
  };

  // Direct Generation: Takes SAP Topic or prompt, routes to Knowledge Deck Engine with screen blur reasoning
  const handleInitiateAnalysis = async (promptText = "", attachedFile = null, forceModule = null) => {
    if (!promptText.trim() && !attachedFile) return;

    const topic = promptText || attachedFile?.fileName || "SAP S/4HANA Master Data Architecture";
    setReasoningTopic(topic);
    setIsReasoningOverlayOpen(true);
    setIsGenerating(true);

    const activeMod = forceModule || selectedModule || "full_deck";
    const textLower = topic.toLowerCase();
    const isSapDomain = /sap|sd|mm|fi|co|ewm|gts|cvi|bp|business partner|customer master|pricing|shipping|billing|master data|table|tcode|flcu01|ovkk|ovl2|obyc/i.test(textLower);

    const searchParams = new URLSearchParams(window.location.search);
    const caseId = searchParams.get("caseId") || ("NX-" + Date.now().toString(36).slice(-6).toUpperCase());
    const sapModel = parseNexusSapAnswer({ title: topic, userQuestion: topic, caseId }, topic);

    pendingSapModelRef.current = {
      sapModel,
      activeMod,
      promptText: topic,
      attachedFile,
      isSapDomain
    };
  };

  // Callback when the animated reasoning overlay completes (~3.6s)
  const handleReasoningComplete = () => {
    setIsReasoningOverlayOpen(false);
    setIsGenerating(false);

    if (!pendingSapModelRef.current) return;
    const { sapModel, activeMod } = pendingSapModelRef.current;

    // Set the presentation deck model for high-fidelity in-app preview
    setPresentationDeckModel(sapModel);

    // Build visual representation for the canvas
    let visualPattern = VISUAL_PATTERNS.CURRENT_TO_BE_BRIDGE;
    if (activeMod === "process_determination") {
      visualPattern = VISUAL_PATTERNS.CROSS_FUNCTIONAL_SWIMLANE;
    } else if (activeMod === "data_model") {
      visualPattern = VISUAL_PATTERNS.ENTERPRISE_HIERARCHY;
    } else if (activeMod === "cross_module") {
      visualPattern = VISUAL_PATTERNS.HUB_AND_SPOKE;
    } else {
      visualPattern = VISUAL_PATTERNS.CURRENT_TO_BE_BRIDGE;
    }

    let presentationModel = null;
    if (visualPattern === VISUAL_PATTERNS.CROSS_FUNCTIONAL_SWIMLANE) {
      presentationModel = parsePromptLocallyToFlowchart(
        `${sapModel.professionalTitle}\nRole Extension → General BP BUT000 → Assign Customer Role FLCU01 → Sales Area KNVV → Shipping & Billing KNVS → Sales Order VA01 → Determinations OVL2 & OVKK`
      );
    } else if (visualPattern === VISUAL_PATTERNS.ENTERPRISE_HIERARCHY) {
      presentationModel = parsePromptLocallyToHierarchy(
        `S/4HANA Customer Architecture: General BP BUT000, FI Company Code KNB1, Sales Area KNVV (Sales Org, Channel, Division), Shipping KNVS (Shipping Point, Plant)`
      );
    } else {
      presentationModel = buildLocalStrategyModel(
        sapModel.professionalTitle,
        visualPattern,
        "sap_enterprise"
      );
    }

    presentationModel.sapModel = sapModel;
    presentationModel.title = sapModel.professionalTitle || sapModel.topicTitle;
    presentationModel.subtitle = sapModel.slideTitles?.slide2 || (sapModel.directAnswer?.slice(0, 120) + "...");
    presentationModel.id = "nexus-deck-" + Date.now().toString(36);

    setSavedVisualizations((prev) => [presentationModel, ...prev.filter((i) => i.id !== presentationModel.id)]);
    setActiveDiagramId(presentationModel.id);
    setCurrentDiagram(presentationModel);
    setRefinePrompt("");
    setRefineImage(null);
  };

  // Handle follow-up refinements from the Presentation Previewer
  const handleRefinePresentationDeck = async (followupPrompt) => {
    if (!followupPrompt || !presentationDeckModel) return;

    setReasoningTopic(followupPrompt);
    setIsReasoningOverlayOpen(true);
    setIsGenerating(true);

    const updatedModel = JSON.parse(JSON.stringify(presentationDeckModel));
    updatedModel.directAnswer = `${updatedModel.directAnswer}\n\n[FOLLOW-UP REFINEMENT]: ${followupPrompt}`;

    if (/spro|config|path/i.test(followupPrompt)) {
      updatedModel.configurationPaths.push({
        area: "Extended Customizing Configuration",
        path: `SPRO → ${followupPrompt}`,
        tcode: "SPRO",
        criticality: "High"
      });
    }
    if (/route|shipping|plant|ovl2|0vtc/i.test(followupPrompt)) {
      updatedModel.determinationLogic.push({
        object: "Route Determination (0VTC)",
        formula: "Country + Departure Zone + Shipping Condition + Transport Group + Country + Destination Zone = Route",
        tcode: "0VTC",
        rule: "Determines physical transportation path and transit scheduling in Outbound Delivery."
      });
      updatedModel.tCodes.unshift({ code: "0VTC", desc: "Define Route Determination" });
    }
    if (/troubleshoot|error|fail|dump|slg1|cvi/i.test(followupPrompt)) {
      updatedModel.troubleshooting.push({
        symptom: `Resolution for: ${followupPrompt}`,
        rootCause: "Field status mismatch or unassigned synchronization parameters.",
        fix: "Execute transaction BUPA_MDS_EXEC and inspect SLG1 application log."
      });
    }
    if (/price|pricing|ovkk|v\/08|condition/i.test(followupPrompt)) {
      updatedModel.determinationLogic.push({
        object: "Condition Technique Hierarchy",
        formula: "Condition Tables (A-Tables) → Access Sequence → Condition Types (PR00) → Pricing Schema",
        tcode: "V/08",
        rule: "Applies pricing rules hierarchy during sales document processing."
      });
      updatedModel.tCodes.unshift({ code: "V/08", desc: "Maintain Pricing Procedure" });
    }

    pendingSapModelRef.current = {
      sapModel: updatedModel,
      activeMod: "full_deck",
      promptText: followupPrompt
    };
  };

  // Native Editable PowerPoint Export in Master Template
  const handleDownloadPptx = async () => {
    const targetModel = presentationDeckModel || currentDiagram?.sapModel;
    setIsExportingPptx(true);
    try {
      if (targetModel) {
        await generateSapKnowledgeDeck(targetModel);
      } else if (currentDiagram) {
        const searchParams = new URLSearchParams(window.location.search);
        const caseId = searchParams.get("caseId") || "NX-EXPORT";
        const sapModel = parseNexusSapAnswer(
          { title: currentDiagram.title, userQuestion: currentDiagram.title, caseId },
          currentDiagram.subtitle || currentDiagram.title
        );
        await generateSapKnowledgeDeck(sapModel);
      }
    } catch (err) {
      console.error("PPTX Export Error, falling back to editable shapes:", err);
      try {
        if (currentDiagram) await exportToEditablePowerPoint(currentDiagram);
      } catch (e2) {
        console.error(e2);
      }
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Native Executive Word Document Export
  const handleDownloadWord = () => {
    const targetModel = presentationDeckModel || currentDiagram?.sapModel;
    if (targetModel) {
      exportWordDocument(targetModel);
    } else if (currentDiagram) {
      const model = parseNexusSapAnswer(
        { title: currentDiagram.title, userQuestion: currentDiagram.title },
        currentDiagram.subtitle || currentDiagram.title
      );
      exportWordDocument(model);
    }
  };

  // Handle node or level tag click to edit
  const handleSelectNode = (node, type, index, levelIndex) => {
    setEditingNode(node);
    setEditingType(type);
    setEditingIndex(index);
    setEditingLevelIndex(levelIndex);
  };

  // Save changes from node inspector
  const handleSaveNode = (updatedNode, type, index) => {
    if (!currentDiagram) return;

    const copy = JSON.parse(JSON.stringify(currentDiagram));
    if (copy.levels) {
      if (type === "hierarchy_node" && copy.levels[editingLevelIndex]?.nodes[index]) {
        copy.levels[editingLevelIndex].nodes[index].label = updatedNode.label || updatedNode.title || updatedNode.name;
      } else if (type === "level_tag" && copy.levels[index]) {
        copy.levels[index].levelName = updatedNode.name || updatedNode.levelName || updatedNode.label;
      }
    } else if (copy.nodes && copy.nodes[index]) {
      copy.nodes[index].label = updatedNode.label || updatedNode.title || updatedNode.name;
    }

    setCurrentDiagram(copy);
    setSavedVisualizations((prev) =>
      prev.map((item) => (item.id === copy.id ? copy : item))
    );
  };

  // Export actions
  const handleDownloadSvg = () => {
    const svg = canvasRef.current?.getSvgElement();
    const prefix = currentDiagram?.visualType === "flowchart" ? "flowchart" : "hierarchy";
    if (svg && currentDiagram) downloadSvg(svg, `${prefix}_${currentDiagram.id || "diagram"}.svg`);
  };

  const handleDownloadPng = () => {
    const svg = canvasRef.current?.getSvgElement();
    const prefix = currentDiagram?.visualType === "flowchart" ? "flowchart" : "hierarchy";
    if (svg && currentDiagram) downloadPng(svg, `${prefix}_${currentDiagram.id || "diagram"}.png`);
  };

  const handleCopySvg = async () => {
    const svg = canvasRef.current?.getSvgElement();
    if (svg) {
      const ok = await copySvgToClipboard(svg);
      if (ok) {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      }
    }
  };

  const handleDownloadJson = () => {
    if (currentDiagram) downloadJson(currentDiagram, `hierarchy_${currentDiagram.id || "diagram"}.json`);
  };

  const getActiveModuleMeta = (diag) => {
    if (!diag) return DESIGN_MODULES[1];
    const pat = (diag.visualPattern || diag.visualType || "").toLowerCase();
    if (pat === "flowchart" || (diag.lanes && diag.edges && !diag.visualPattern && !diag.levels)) {
      return DESIGN_MODULES.find((m) => m.id === "flowchart");
    }
    if (pat === "enterprise_hierarchy" || (diag.levels && diag.levels.length > 0)) {
      return DESIGN_MODULES.find((m) => m.id === "enterprise_hierarchy");
    }
    return DESIGN_MODULES.find((m) => m.id === pat) || DESIGN_MODULES.find((m) => m.id === "current_to_be_bridge") || DESIGN_MODULES[1];
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "var(--bg-main, #F5F1EB)",
        color: "var(--text-primary, #1C1917)",
        fontFamily: "var(--font-sans)"
      }}
    >
      {/* ── Left Sidebar (Saved Hierarchies) ── */}
      <VisualizationsSidebar
        savedVisualizations={savedVisualizations}
        activeId={activeDiagramId}
        onSelect={handleSelectSaved}
        onNew={handleNewVisualization}
        onDelete={handleDeleteSaved}
        onNavigate={onNavigate}
      />

      {/* ── Main Work Area ── */}
      {presentationDeckModel ? (
        <PresentationDeckPreview
          model={presentationDeckModel}
          onExportPptx={handleDownloadPptx}
          onExportWord={handleDownloadWord}
          onClose={() => setPresentationDeckModel(null)}
          onRefine={handleRefinePresentationDeck}
          isExporting={isExportingPptx}
        />
      ) : activeDiagramId === null || !currentDiagram ? (
        // Entry Hero: Prompt input with suggestions & module selector
        <VisualizationEntryHero
          onGenerate={handleInitiateAnalysis}
          isGenerating={isGenerating}
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
        />
      ) : (
        // Visual Diagram Active Canvas & Controls
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Top Presentation Action Bar */}
          <header
            style={{
              padding: "10px 20px",
              background: "var(--bg-card, #FFFFFF)",
              borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              zIndex: 15
            }}
          >
            {/* Title & Metadata */}
            {(() => {
              const currentMeta = getActiveModuleMeta(currentDiagram);
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: currentMeta.id === "enterprise_hierarchy" ? "#E50000" : currentMeta.id === "flowchart" ? "#0284C7" : "var(--orange, #E8614D)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 900
                    }}
                  >
                    {currentMeta.icon}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.01em"
                        }}
                      >
                        {currentDiagram.title || currentMeta.name}
                      </h2>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 750,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "var(--bg-surface, #F1F5F9)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle, #CBD5E1)"
                        }}
                      >
                        {currentMeta.name.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {currentDiagram.subtitle}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Export Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Design Module Switcher Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Module:</span>
                <select
                  value={getActiveModuleMeta(currentDiagram).id}
                  onChange={(e) => {
                    const newMod = e.target.value;
                    const prompt = (currentDiagram.title || "") + "\n" + (currentDiagram.subtitle || "");
                    handleInitiateAnalysis(prompt, null, newMod);
                  }}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border-subtle, #CBD5E1)",
                    background: "var(--bg-surface, #F8FAFC)",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "'Aptos', sans-serif"
                  }}
                  title="Switch visual design module"
                >
                  {DESIGN_MODULES.filter((m) => m.id !== "auto").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Branching Layout Style Toggle (Tree vs Bus) for Hierarchy, or Swimlane indicator for Flowchart */}
              {!(currentDiagram?.visualType === "flowchart" || !!(currentDiagram?.lanes && currentDiagram?.edges)) ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "var(--bg-surface, #F1F5F9)",
                    border: "1px solid var(--border-subtle, #CBD5E1)",
                    borderRadius: 6,
                    padding: 2,
                    marginRight: 4
                  }}
                >
                  <button
                    onClick={() => {
                      const updated = { ...currentDiagram, layoutStyle: "tree" };
                      setCurrentDiagram(updated);
                      setSavedVisualizations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                    }}
                    title="Tree Branches (Direct & localized parent-child lines)"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: (currentDiagram.layoutStyle || "tree") === "tree" ? "#FFFFFF" : "transparent",
                      color: (currentDiagram.layoutStyle || "tree") === "tree" ? "#0F172A" : "var(--text-muted)",
                      fontWeight: (currentDiagram.layoutStyle || "tree") === "tree" ? 700 : 500,
                      fontSize: 11,
                      cursor: "pointer",
                      boxShadow: (currentDiagram.layoutStyle || "tree") === "tree" ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                    }}
                  >
                    🌳 Tree Branches
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...currentDiagram, layoutStyle: "bus" };
                      setCurrentDiagram(updated);
                      setSavedVisualizations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                    }}
                    title="Shared Bus (Trunk distribution bar across tier)"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: currentDiagram.layoutStyle === "bus" ? "#FFFFFF" : "transparent",
                      color: currentDiagram.layoutStyle === "bus" ? "#0F172A" : "var(--text-muted)",
                      fontWeight: currentDiagram.layoutStyle === "bus" ? 700 : 500,
                      fontSize: 11,
                      cursor: "pointer",
                      boxShadow: currentDiagram.layoutStyle === "bus" ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                    }}
                  >
                    🚌 Shared Bus
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    background: "rgba(2, 132, 199, 0.08)",
                    border: "1px solid rgba(2, 132, 199, 0.2)",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0284C7",
                    marginRight: 4
                  }}
                >
                  <span>↔️ Horizontal Flow</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>💎 Decision Gates</span>
                </div>
              )}

              {/* Native Editable PowerPoint Export */}
              <button
                onClick={handleDownloadPptx}
                disabled={isExportingPptx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: isExportingPptx ? "wait" : "pointer",
                  boxShadow: "0 2px 6px rgba(110,26,45,0.25)"
                }}
                title="Download complete 12-slide presentation (.pptx)"
              >
                📊 {isExportingPptx ? "Exporting PPTX..." : "PowerPoint (.pptx)"}
              </button>

              {/* Native Word Export */}
              <button
                onClick={handleDownloadWord}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#1E3A8A",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(30,58,138,0.25)"
                }}
                title="Download executive investigation report (.docx)"
              >
                📄 Word Document (.docx)
              </button>

              <button
                onClick={handleCopySvg}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "var(--bg-surface, #F8FAFC)",
                  border: "1px solid var(--border-subtle, #E2E8F0)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "inherit"
                }}
              >
                📋 {copyFeedback ? "Copied!" : "Copy Vector"}
              </button>

              <button
                onClick={handleDownloadSvg}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: "var(--orange, #E8614D)",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(232,97,77,0.3)"
                }}
              >
                📥 Download SVG
              </button>

              <button
                onClick={handleDownloadPng}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "var(--bg-surface, #F8FAFC)",
                  border: "1px solid var(--border-subtle, #E2E8F0)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "inherit"
                }}
              >
                🖼️ PNG
              </button>

              <button
                onClick={handleDownloadJson}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "transparent",
                  border: "1px solid var(--border-subtle, #E2E8F0)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  color: "var(--text-muted)"
                }}
              >
                JSON
              </button>

              <button
                onClick={handleNewVisualization}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "var(--bg-surface, #F8FAFC)",
                  border: "1px solid var(--border-subtle, #CBD5E1)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: "var(--text-primary)"
                }}
              >
                + New Visual
              </button>
            </div>
          </header>

          {/* Central Interactive Vector Canvas */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#FFFFFF" }}>
            {/* Thinking Flower during generation */}
            {isGenerating && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 40
                }}
              >
                <ClaudeThinkingFlower size={36} color="#E50000" />
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  Analyzing Content & Synthesizing Enterprise Hierarchy...
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                  Mapping business tiers, relational buses & level descriptors
                </div>
              </div>
            )}

            {/* Hint Badge (Dismissible, placed at top-left so it never covers bottom nodes) */}
            {showHint && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 16,
                  background: "rgba(17, 24, 39, 0.8)",
                  backdropFilter: "blur(6px)",
                  color: "#FFFFFF",
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: "'Aptos', sans-serif",
                  zIndex: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                }}
              >
                <span>💡 Click any node or green level tag to edit text • Drag to pan • Scroll to zoom</span>
                <button
                  onClick={() => setShowHint(false)}
                  title="Dismiss"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "0 2px",
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Canvas */}
            <MetaphorCanvas
              ref={canvasRef}
              data={currentDiagram}
              onSelectNode={handleSelectNode}
              selectedNodeId={editingNode?.id}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>

          {/* Bottom Refine & Transform Bar */}
          <div
            style={{
              padding: "10px 20px",
              background: "var(--bg-card, #FFFFFF)",
              borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 15
            }}
          >
            {/* Hidden Refine File Input */}
            <input
              type="file"
              ref={refineFileInputRef}
              accept=".pptx,.xlsx,.xls,.csv,.docx,.pdf,image/*"
              style={{ display: "none" }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const rawFile = e.target.files[0];
                  try {
                    const parsed = await parseUploadedFile(rawFile);
                    setRefineImage(parsed);
                  } catch (err) {
                    console.error("Error parsing refine file:", err);
                  }
                }
              }}
            />

            {/* Refine Attached File / Image Thumbnail */}
            {refineImage && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  alignSelf: "flex-start"
                }}
              >
                <span style={{ fontSize: 13 }}>📎</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{refineImage.fileName}</span>
                <button
                  onClick={() => setRefineImage(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => refineFileInputRef.current?.click()}
                title="Attach document or screenshot to refine hierarchy"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "inherit"
                }}
              >
                📎
              </button>

              <input
                type="text"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                onPaste={async (e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                      e.preventDefault();
                      const blob = items[i].getAsFile();
                      try {
                        const parsed = await parseUploadedFile(blob);
                        setRefineImage(parsed);
                      } catch (err) {
                        console.error("Paste parse error:", err);
                      }
                      break;
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isGenerating && (refinePrompt.trim() || refineImage)) {
                    const isFlow = currentDiagram?.visualType === "flowchart" || !!(currentDiagram?.lanes && currentDiagram?.edges);
                    handleInitiateAnalysis(
                      refinePrompt
                        ? `Refine and update this "${currentDiagram.title}" ${isFlow ? "flowchart" : "hierarchy"}:\n${refinePrompt}`
                        : `Analyze this attached document and update the "${currentDiagram.title}" ${isFlow ? "flowchart" : "hierarchy"}.`,
                      refineImage,
                      isFlow ? "flowchart" : "hierarchy"
                    );
                  }
                }}
                placeholder={
                  (currentDiagram?.visualType === "flowchart" || !!(currentDiagram?.lanes && currentDiagram?.edges))
                    ? 'Ask Nexus to refine this flowchart (e.g. "Add Quality Inspection lane", "Add expedited approval branch", "Change step 4")...'
                    : 'Ask Nexus to refine this hierarchy (e.g. "Add European Sales Org under Level 2", "Rename Division to Sub-systems")...'
                }
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                  color: "inherit",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "'Aptos', sans-serif"
                }}
              />
              <button
                onClick={() => {
                  const isFlow = currentDiagram?.visualType === "flowchart" || !!(currentDiagram?.lanes && currentDiagram?.edges);
                  handleInitiateAnalysis(
                    refinePrompt
                      ? `Refine and update this ${isFlow ? "flowchart" : "hierarchy"}:\n${refinePrompt}`
                      : `Analyze this attached file and update this ${isFlow ? "flowchart" : "hierarchy"}.`,
                    refineImage,
                    isFlow ? "flowchart" : "hierarchy"
                  );
                }}
                disabled={isGenerating || (!refinePrompt.trim() && !refineImage)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: isGenerating || (!refinePrompt.trim() && !refineImage) ? "#94A3B8" : "var(--orange, #E8614D)",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isGenerating || (!refinePrompt.trim() && !refineImage) ? "not-allowed" : "pointer"
                }}
              >
                {isGenerating ? "Analyzing..." : "Refine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Node / Level Tag Inspector Modal ── */}
      <NodeInspectorModal
        node={editingNode}
        nodeType={editingType}
        nodeIndex={editingIndex}
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
      />

      {/* ── Frosted Glass Reasoning Overlay with Screen Blur ── */}
      {isReasoningOverlayOpen && (
        <ReasoningOverlay
          topic={reasoningTopic}
          onComplete={handleReasoningComplete}
        />
      )}
    </div>
  );
}
