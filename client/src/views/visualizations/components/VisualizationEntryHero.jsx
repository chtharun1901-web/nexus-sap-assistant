import React, { useState, useRef, useEffect } from "react";
import { ClaudeThinkingFlower } from "../../../components/MermaidDiagram.jsx";
import { parseUploadedFile } from "../engine/fileParser.js";

export default function VisualizationEntryHero({
  onGenerate = () => {},
  isGenerating = false,
  selectedModule = "full_deck",
  onSelectModule = () => {}
}) {
  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeCaseInfo, setActiveCaseInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Check URL parameters and local storage for active case topic
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCaseId = searchParams.get("caseId");
      const urlTitle = searchParams.get("title");
      if (urlCaseId || urlTitle) {
        setActiveCaseInfo({
          caseId: urlCaseId || "NX-SAPSDSDM-5738",
          title: urlTitle || "SAP SD SD-M02 Business Partner & Customer Master (Sales Area, Shipping Data)"
        });
      } else {
        const storedCase = localStorage.getItem("nexus_active_case");
        if (storedCase) {
          const parsed = JSON.parse(storedCase);
          if (parsed && (parsed.caseId || parsed.title)) {
            setActiveCaseInfo(parsed);
          }
        }
      }
    } catch (_) {}
  }, []);

  const processFile = async (file) => {
    if (!file) return;
    try {
      const parsed = await parseUploadedFile(file);
      setAttachedFile(parsed);
    } catch (err) {
      console.error("Failed to parse file:", err);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        processFile(blob);
        break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((prompt.trim() || attachedFile) && !isGenerating) {
        onGenerate(prompt, attachedFile, selectedModule);
      }
    }
  };

  const handleLaunch = () => {
    if ((prompt.trim() || attachedFile) && !isGenerating) {
      onGenerate(prompt, attachedFile, selectedModule);
    }
  };

  const handleCardClick = (presetText) => {
    setPrompt(presetText);
    onGenerate(presetText, attachedFile, "full_deck");
  };

  const presets = [
    {
      title: "Business Partner & Customer Master (SD-M02)",
      desc: "BP roles FLCU01, Sales Area KNVV, Shipping KNVS & CVI sync.",
      prompt: "SAP SD SD-M02 Business Partner & Customer Master (Sales Area, Shipping Data)"
    },
    {
      title: "Pricing Condition Technique (OVKK)",
      desc: "Condition tables, access sequences, pricing procedure & VK11.",
      prompt: "SAP SD Pricing Condition Technique & Determination Logic (OVKK / V/08 / VK11)"
    },
    {
      title: "Shipping Point Determination (OVL2)",
      desc: "Shipping condition, loading group, delivering plant & delivery split.",
      prompt: "SAP SD Shipping Point Determination & Route Determination (OVL2 / 0VTC)"
    },
    {
      title: "Automatic Account Determination (OBYC)",
      desc: "Valuation classes, movement types, account assignment & GL.",
      prompt: "SAP MM Automatic Account Determination & Valuation Classes (OBYC)"
    }
  ];

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "36px 24px 60px",
        background: "var(--bg-main, #F5F1EB)",
        userSelect: "none"
      }}
    >
      {/* 1. Clean Header matching Nexus Home */}
      <div style={{ maxWidth: 760, width: "100%", textAlign: "left", marginBottom: 20 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 20,
            padding: "4px 14px",
            marginBottom: 14
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6E1A2D", display: "inline-block" }} />
          <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Executive Deck · 100% Native PPTX
          </span>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            margin: "0 0 8px 0"
          }}
        >
          Nexus Slide Studio
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 620
          }}
        >
          Enter any SAP topic to generate an executive 12-slide presentation with native PowerPoint shapes.
        </p>
      </div>

      {/* 2. Active Case Card (if detected) */}
      {activeCaseInfo && (
        <div
          style={{
            maxWidth: 760,
            width: "100%",
            marginBottom: 18,
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--bg-card, #FFFFFF)",
            border: "1px solid var(--burgundy-border, #F3CBD2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "var(--burgundy-light, #FDF2F4)",
                    color: "var(--burgundy-rich, #6E1A2D)",
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  ACTIVE CASE
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  {activeCaseInfo.caseId}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeCaseInfo.title}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleCardClick(activeCaseInfo.title || activeCaseInfo.caseId)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
              border: "none",
              color: "#FFFFFF",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(110,26,45,0.2)"
            }}
          >
            Generate Active Topic (.pptx)
          </button>
        </div>
      )}

      {/* 3. Main Input Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          maxWidth: 760,
          width: "100%",
          background: "var(--bg-card, #FFFFFF)",
          borderRadius: 12,
          border: isDragging ? "1.5px dashed var(--burgundy-rich, #6E1A2D)" : "1px solid var(--border-strong, rgba(0,0,0,0.12))",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: 14,
          marginBottom: 24,
          position: "relative"
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.pptx,.xlsx,.xls,.csv,.docx,.pdf,.txt,.md"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        {attachedFile && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 6,
              background: "var(--burgundy-light, #FDF2F4)",
              border: "1px solid var(--burgundy-border, #F3CBD2)",
              marginBottom: 10
            }}
          >
            <span style={{ fontSize: 13 }}>📎</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--burgundy-rich, #6E1A2D)" }}>
              {attachedFile.fileName}
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 13,
                cursor: "pointer",
                color: "var(--text-muted)",
                marginLeft: 6
              }}
            >
              ✕
            </button>
          </div>
        )}

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Enter an SAP topic (e.g. Business Partner SD-M02, Pricing OVKK, Shipping OVL2)..."
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "vertical",
            fontSize: 14,
            lineHeight: 1.5,
            background: "transparent",
            color: "var(--text-primary, #1C1917)",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />

        {/* Action Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.06))"
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach reference document or screenshot"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 6,
              background: attachedFile ? "var(--burgundy-light, #FDF2F4)" : "var(--bg-surface)",
              color: attachedFile ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-primary)",
              border: attachedFile ? "1px solid var(--burgundy-border, #F3CBD2)" : "1px solid var(--border-subtle)",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <span>📎</span>
            <span>{attachedFile ? attachedFile.fileName : "Attach Document (Ctrl+V)"}</span>
          </button>

          <button
            onClick={handleLaunch}
            disabled={isGenerating || (!prompt.trim() && !attachedFile)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 18px",
              borderRadius: 6,
              background: isGenerating || (!prompt.trim() && !attachedFile) ? "#94A3B8" : "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
              color: "#FFFFFF",
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: isGenerating || (!prompt.trim() && !attachedFile) ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(110,26,45,0.25)"
            }}
          >
            {isGenerating ? "Generating Deck..." : "Generate Presentation (.pptx)"}
          </button>
        </div>

        {isGenerating && (
          <div style={{ marginTop: 12, padding: "6px 0" }}>
            <ClaudeThinkingFlower text="Generating executive presentation..." />
          </div>
        )}
      </div>

      {/* 4. Topic Presets Grid matching Nexus Home Cards */}
      <div style={{ maxWidth: 760, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left" }}>
          Quick Presets
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
          {presets.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(item.prompt)}
              style={{
                cursor: "pointer",
                padding: "14px 16px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                background: "var(--bg-surface)",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--burgundy-rich, #6E1A2D)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
