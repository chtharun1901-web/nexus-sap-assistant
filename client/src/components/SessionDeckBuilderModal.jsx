import React, { useState, useEffect, useMemo } from "react";
import { buildSessionPresentationGraph } from "../utils/sessionDeckAnalyzer.js";
import { exportSessionPresentationPptx } from "../utils/exportSessionPptx.js";

export default function SessionDeckBuilderModal({
  isOpen,
  onClose,
  rawSession,
  aiText,
  doc,
  conversationTurns = []
}) {
  const [deckGraph, setDeckGraph] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [selectedSlideIds, setSelectedSlideIds] = useState([]);
  const [theme, setTheme] = useState("executive");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);

  // Initialize or re-analyze session graph whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const graph = buildSessionPresentationGraph(rawSession, aiText, doc, conversationTurns);
      setDeckGraph(graph);
      setCustomTitle(graph.sessionTitle || "SAP End-to-End Learning Summary");
      setCustomSubtitle(graph.sessionSubtitle || "SAP Enterprise Architecture & Diagnostic Review");
      setSelectedSlideIds(graph.slides.map(s => s.id));
      setExportSuccess(false);
    }
  }, [isOpen, rawSession, aiText, doc, conversationTurns]);

  if (!isOpen || !deckGraph) return null;

  // Handle slide reordering (Move Up / Move Down)
  const moveSlide = (index, direction) => {
    const newSlides = [...deckGraph.slides];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    // Recalculate slide numbers
    newSlides.forEach((s, idx) => {
      s.slideNumber = idx + 1;
    });

    setDeckGraph({ ...deckGraph, slides: newSlides });
  };

  // Remove / delete individual slide
  const removeSlide = (slideId) => {
    const newSlides = deckGraph.slides.filter(s => s.id !== slideId);
    newSlides.forEach((s, idx) => {
      s.slideNumber = idx + 1;
    });
    setDeckGraph({ ...deckGraph, slides: newSlides, suggestedSlideCount: newSlides.length });
    setSelectedSlideIds(prev => prev.filter(id => id !== slideId));
  };

  // Toggle slide selection
  const toggleSlideSelection = (slideId) => {
    setSelectedSlideIds(prev =>
      prev.includes(slideId) ? prev.filter(id => id !== slideId) : [...prev, slideId]
    );
  };

  // Select all or deselect all
  const toggleSelectAll = () => {
    if (selectedSlideIds.length === deckGraph.slides.length) {
      setSelectedSlideIds([]);
    } else {
      setSelectedSlideIds(deckGraph.slides.map(s => s.id));
    }
  };

  // Regenerate entire deck structure from raw session
  const handleRegenerate = () => {
    const graph = buildSessionPresentationGraph(rawSession, aiText, doc, conversationTurns);
    setDeckGraph(graph);
    setCustomTitle(graph.sessionTitle);
    setCustomSubtitle(graph.sessionSubtitle);
    setSelectedSlideIds(graph.slides.map(s => s.id));
  };

  // Handle slide title edit
  const handleSlideTitleChange = (slideId, newTitle) => {
    const newSlides = deckGraph.slides.map(s => {
      if (s.id === slideId) {
        return { ...s, title: newTitle };
      }
      return s;
    });
    setDeckGraph({ ...deckGraph, slides: newSlides });
  };

  // Export to PowerPoint
  const handleExportPptx = async () => {
    if (selectedSlideIds.length === 0) {
      alert("Please select at least one slide to export.");
      return;
    }

    setIsExporting(true);
    try {
      const activeGraph = {
        ...deckGraph,
        sessionTitle: customTitle,
        sessionSubtitle: customSubtitle
      };
      await exportSessionPresentationPptx(activeGraph, {
        theme,
        selectedSlideIds,
        includeNotes
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error("Session PowerPoint Export failed:", err);
      alert("Failed to export PowerPoint deck: " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  // Print outline / Export outline summary
  const handlePrintOutline = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 15, 29, 0.78)",
        backdropFilter: "blur(6px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          color: "#0F172A",
          width: "100%",
          maxWidth: 960,
          maxHeight: "92vh",
          borderRadius: 14,
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
          animation: "modalFadeIn 0.2s ease-out"
        }}
      >
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.97) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E2E8F0",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.35)"
              }}
            >
              📽️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                  Session Deck Builder
                </h2>
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.2)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    color: "#FCD34D",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono, monospace)"
                  }}
                >
                  FULL SESSION ANALYSIS
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0 0" }}>
                Multi-turn conversation normalized into an editable consultant-grade PowerPoint presentation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#CBD5E1",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#FFFFFF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#CBD5E1"; }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          
          {/* 1. Title & Subtitle Edit Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 5 }}>
                Presentation Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter deck title..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 7,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#0F172A",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 5 }}>
                Presentation Subtitle
              </label>
              <input
                type="text"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="Enter deck subtitle..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 7,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  color: "#334155",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* 2. Analysis Intelligence Pipeline Metrics */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12
            }}
          >
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase", display: "block" }}>
                  Topics Analyzed
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                  {deckGraph.topicsAnalyzedCount} {deckGraph.topicsAnalyzedCount === 1 ? "Query" : "Turns"}
                </span>
              </div>

              <div style={{ height: 24, width: 1, background: "#CBD5E1" }} />

              <div>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase", display: "block" }}>
                  Modules Detected
                </span>
                <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                  {deckGraph.detectedModules.map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 4,
                        background: m.badgeBg || "rgba(59, 130, 246, 0.12)",
                        border: `1px solid ${m.badgeBorder || "#3B82F6"}`,
                        color: m.color || "#2563EB"
                      }}
                    >
                      {m.code}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ height: 24, width: 1, background: "#CBD5E1" }} />

              <div>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase", display: "block" }}>
                  Primary Business Process
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#065F46" }}>
                  ⚙️ {deckGraph.primaryProcess?.name || "Cross-Module Orchestration"}
                </span>
              </div>

              <div style={{ height: 24, width: 1, background: "#CBD5E1" }} />

              <div>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase", display: "block" }}>
                  Deduplicated / Cleaned
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>
                  ✓ {deckGraph.duplicatesRemovedCount} Noise items removed
                </span>
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              title="Re-analyze session and regenerate standard structure"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#1E293B",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
              }}
            >
              🔄 Regenerate Structure
            </button>
          </div>

          {/* 3. Theme & Export Customization Options */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid #E2E8F0",
              flexWrap: "wrap",
              gap: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                Visual Style:
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "executive", label: "Executive Navy Dark", icon: "🌌" },
                  { id: "midnight", label: "SAP Midnight Pro", icon: "🔷" },
                  { id: "slate", label: "Clean Enterprise Slate", icon: "📄" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: theme === t.id ? 700 : 500,
                      cursor: "pointer",
                      border: theme === t.id ? "1.5px solid #2563EB" : "1px solid #CBD5E1",
                      background: theme === t.id ? "#EFF6FF" : "#FFFFFF",
                      color: theme === t.id ? "#1D4ED8" : "#475569",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Include Speaker Notes</span>
              </label>

              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563EB",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                {selectedSlideIds.length === deckGraph.slides.length ? "Deselect All" : "Select All"} ({selectedSlideIds.length}/{deckGraph.slides.length})
              </button>
            </div>
          </div>

          {/* 4. Slide Outline Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {deckGraph.slides.map((slide, idx) => {
              const isSelected = selectedSlideIds.includes(slide.id);
              const isEditing = editingSlideId === slide.id;

              return (
                <div
                  key={slide.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: isSelected ? "1px solid #CBD5E1" : "1px solid #E2E8F0",
                    background: isSelected ? "#FFFFFF" : "#F8FAFC",
                    opacity: isSelected ? 1 : 0.65,
                    boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.03)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSlideSelection(slide.id)}
                    style={{ marginTop: 4, cursor: "pointer" }}
                  />

                  {/* Slide Number Badge */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "#0F172A",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono, monospace)",
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Slide Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => handleSlideTitleChange(slide.id, e.target.value)}
                          onBlur={() => setEditingSlideId(null)}
                          autoFocus
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: "#0F172A",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid #2563EB",
                            width: "70%"
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingSlideId(slide.id)}
                          title="Click to edit slide title"
                          style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", cursor: "pointer" }}
                        >
                          {slide.title} ✏️
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#F1F5F9",
                          color: "#475569",
                          textTransform: "uppercase"
                        }}
                      >
                        {slide.categoryTag || "CONTENT"}
                      </span>

                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "#065F46"
                        }}
                      >
                        ✓ {slide.confidence || "98%"} Confidence
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                      {slide.purpose}
                    </p>
                  </div>

                  {/* Reorder & Action Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => moveSlide(idx, -1)}
                      disabled={idx === 0}
                      title="Move slide up"
                      style={{
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: 4,
                        padding: "3px 7px",
                        fontSize: 11,
                        cursor: idx === 0 ? "not-allowed" : "pointer",
                        opacity: idx === 0 ? 0.3 : 1
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(idx, 1)}
                      disabled={idx === deckGraph.slides.length - 1}
                      title="Move slide down"
                      style={{
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: 4,
                        padding: "3px 7px",
                        fontSize: 11,
                        cursor: idx === deckGraph.slides.length - 1 ? "not-allowed" : "pointer",
                        opacity: idx === deckGraph.slides.length - 1 ? 0.3 : 1
                      }}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(slide.id)}
                      title="Remove slide from presentation"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94A3B8",
                        fontSize: 13,
                        cursor: "pointer",
                        padding: "2px 6px"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            background: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              Total: <strong>{selectedSlideIds.length}</strong> of <strong>{deckGraph.slides.length}</strong> slides selected for presentation
            </span>
            {exportSuccess && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", display: "inline-flex", alignItems: "center", gap: 4 }}>
                ✓ PowerPoint Deck Exported Successfully!
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={handlePrintOutline}
              title="Print slide summary outline"
              style={{
                padding: "8px 14px",
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#475569",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                cursor: "pointer"
              }}
            >
              🖨️ Print Outline
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#475569",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExportPptx}
              disabled={isExporting || selectedSlideIds.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                border: "none",
                cursor: isExporting || selectedSlideIds.length === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(234, 88, 12, 0.35)",
                transition: "all 0.15s ease"
              }}
            >
              {isExporting ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid #FFFFFF", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  <span>Building PowerPoint...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14 }}>📽️</span>
                  <span>Export to PowerPoint (.pptx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
