import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("slides"); // "slides" | "inquiries"

  // Initialize session graph
  useEffect(() => {
    if (isOpen) {
      const graph = buildSessionPresentationGraph(rawSession, aiText, doc, conversationTurns);
      setDeckGraph(graph);
      setCustomTitle(graph.sessionTitle || "SAP End-to-End Session Learning Summary");
      setCustomSubtitle(graph.sessionSubtitle || "SAP Enterprise Architecture & Diagnostic Review");
      setSelectedSlideIds(graph.slides.map(s => s.id));
      setExportSuccess(false);
    }
  }, [isOpen, rawSession, aiText, doc, conversationTurns]);

  if (!isOpen || !deckGraph) return null;

  // Move slide up/down
  const moveSlide = (index, direction) => {
    const newSlides = [...deckGraph.slides];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    newSlides.forEach((s, idx) => {
      s.slideNumber = idx + 1;
    });

    setDeckGraph({ ...deckGraph, slides: newSlides });
  };

  // Remove slide
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

  // Select / Deselect all
  const toggleSelectAll = () => {
    if (selectedSlideIds.length === deckGraph.slides.length) {
      setSelectedSlideIds([]);
    } else {
      setSelectedSlideIds(deckGraph.slides.map(s => s.id));
    }
  };

  // Reset / Regenerate structure from session
  const handleRegenerate = () => {
    const graph = buildSessionPresentationGraph(rawSession, aiText, doc, conversationTurns);
    setDeckGraph(graph);
    setCustomTitle(graph.sessionTitle);
    setCustomSubtitle(graph.sessionSubtitle);
    setSelectedSlideIds(graph.slides.map(s => s.id));
  };

  // Edit slide title
  const handleSlideTitleChange = (slideId, newTitle) => {
    const newSlides = deckGraph.slides.map(s => {
      if (s.id === slideId) {
        return { ...s, title: newTitle };
      }
      return s;
    });
    setDeckGraph({ ...deckGraph, slides: newSlides });
  };

  // Export to PowerPoint (.pptx)
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
      setTimeout(() => setExportSuccess(false), 4500);
    } catch (err) {
      console.error("Session PowerPoint Export failed:", err);
      alert("Failed to export PowerPoint deck: " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

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
        backgroundColor: "rgba(28, 25, 23, 0.75)",
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
          background: "var(--bg-card, #FAF8F5)",
          color: "var(--text-primary, #1C1917)",
          width: "100%",
          maxWidth: 980,
          maxHeight: "92vh",
          borderRadius: 14,
          border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
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

        {/* Modal Header: Nexus Signature Burgundy Gradient */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19
              }}
            >
              📽️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 16.5, fontWeight: 700, margin: 0, letterSpacing: "-0.01em", color: "#FFFFFF" }}>
                  Session PowerPoint Deck Builder
                </h2>
                <span
                  style={{
                    background: "rgba(252, 211, 77, 0.2)",
                    border: "1px solid rgba(252, 211, 77, 0.5)",
                    color: "#FDE68A",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono, monospace)"
                  }}
                >
                  {deckGraph.topicsAnalyzedCount} INQUIRIES COVERED
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#F3CBD2", margin: "2px 0 0 0" }}>
                Converts your active session questions and answers into a structured presentation deck
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#FFFFFF",
              width: 30,
              height: 30,
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1, background: "var(--bg-main, #F5F1EB)" }}>
          
          {/* 1. Presentation Title & Subtitle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--burgundy-rich, #6E1A2D)", textTransform: "uppercase", marginBottom: 5 }}>
                Presentation Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter presentation title..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-primary, #1C1917)",
                  background: "var(--bg-card, #FAF8F5)",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--burgundy-rich, #6E1A2D)", textTransform: "uppercase", marginBottom: 5 }}>
                Presentation Subtitle
              </label>
              <input
                type="text"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="Enter presentation subtitle..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                  fontSize: 13.5,
                  color: "var(--text-body, #44403C)",
                  background: "var(--bg-card, #FAF8F5)",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* 2. Session Summary Bar in Nexus Style */}
          <div
            style={{
              background: "var(--bg-card, #FAF8F5)",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 10, color: "var(--text-muted, #78716C)", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                  Session Inquiries
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--burgundy-rich, #6E1A2D)", fontFamily: "var(--font-mono)" }}>
                  {deckGraph.topicsAnalyzedCount} Searched Turns
                </span>
              </div>

              <div style={{ height: 22, width: 1, background: "var(--border-strong, rgba(0,0,0,0.12))" }} />

              <div>
                <span style={{ fontSize: 10, color: "var(--text-muted, #78716C)", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                  Modules Explored
                </span>
                <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                  {deckGraph.detectedModules.map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "var(--burgundy-light, #FDF2F4)",
                        border: "1px solid var(--burgundy-border, #F3CBD2)",
                        color: "var(--burgundy-rich, #6E1A2D)",
                        fontFamily: "var(--font-mono)"
                      }}
                    >
                      {m.code}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ height: 22, width: 1, background: "var(--border-strong, rgba(0,0,0,0.12))" }} />

              <div>
                <span style={{ fontSize: 10, color: "var(--text-muted, #78716C)", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                  Generated Presentation
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-text, #065F46)" }}>
                  ✓ {deckGraph.slides.length} Focused Slides
                </span>
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              title="Reset and regenerate all inquiry slides"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "var(--bg-surface, #EDE8E0)",
                border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                padding: "5px 10px",
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--text-primary, #1C1917)",
                cursor: "pointer"
              }}
            >
              🔄 Reset Structure
            </button>
          </div>

          {/* 3. Navigation Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, borderBottom: "1.5px solid var(--border-strong, rgba(0,0,0,0.12))" }}>
            <button
              type="button"
              onClick={() => setActiveTab("slides")}
              style={{
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                background: "none",
                border: "none",
                borderBottom: activeTab === "slides" ? "2.5px solid var(--burgundy-rich, #6E1A2D)" : "2.5px solid transparent",
                color: activeTab === "slides" ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-muted, #78716C)",
                marginBottom: -1.5,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>📑</span>
              <span>Inquiry Slides List ({deckGraph.slides.length} Slides)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inquiries")}
              style={{
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                background: "none",
                border: "none",
                borderBottom: activeTab === "inquiries" ? "2.5px solid var(--burgundy-rich, #6E1A2D)" : "2.5px solid transparent",
                color: activeTab === "inquiries" ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-muted, #78716C)",
                marginBottom: -1.5,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>📋</span>
              <span>All Searched Inquiries ({deckGraph.topicsAnalyzedCount} Turns)</span>
            </button>
          </div>

          {/* 4. Tab 1 Content: Slide Outline Cards */}
          {activeTab === "slides" && (
            <>
              {/* Style & Options Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted, #78716C)" }}>
                    Theme:
                  </span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[
                      { id: "executive", label: "Executive Dark", icon: "🌌" },
                      { id: "midnight", label: "SAP Midnight", icon: "🔷" },
                      { id: "slate", label: "Nexus Slate Light", icon: "📄" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: theme === t.id ? 700 : 500,
                          cursor: "pointer",
                          border: theme === t.id ? "1.5px solid var(--burgundy-rich, #6E1A2D)" : "1px solid var(--border-strong, rgba(0,0,0,0.12))",
                          background: theme === t.id ? "var(--burgundy-light, #FDF2F4)" : "var(--bg-card, #FAF8F5)",
                          color: theme === t.id ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-body, #44403C)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-body)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={includeNotes}
                      onChange={(e) => setIncludeNotes(e.target.checked)}
                    />
                    <span>Speaker Notes</span>
                  </label>

                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--burgundy-rich, #6E1A2D)",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    {selectedSlideIds.length === deckGraph.slides.length ? "Deselect All" : "Select All"} ({selectedSlideIds.length}/{deckGraph.slides.length})
                  </button>
                </div>
              </div>

              {/* Slide Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deckGraph.slides.map((slide, idx) => {
                  const isSelected = selectedSlideIds.includes(slide.id);
                  const isEditing = editingSlideId === slide.id;
                  const isTopicInquiry = slide.type === "TOPIC_INQUIRY";

                  return (
                    <div
                      key={slide.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 7,
                        border: isTopicInquiry
                          ? "1.5px solid var(--burgundy-border, #F3CBD2)"
                          : isSelected ? "1px solid var(--border-strong, rgba(0,0,0,0.16))" : "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                        background: isTopicInquiry
                          ? "var(--burgundy-light, #FDF2F4)"
                          : isSelected ? "var(--bg-card, #FAF8F5)" : "var(--bg-surface, #EDE8E0)",
                        opacity: isSelected ? 1 : 0.65,
                        boxShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.03)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSlideSelection(slide.id)}
                        style={{ marginTop: 4, cursor: "pointer" }}
                      />

                      {/* Slide Number Badge */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 5,
                          background: isTopicInquiry ? "var(--burgundy-rich, #6E1A2D)" : "#1F1F1E",
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => handleSlideTitleChange(slide.id, e.target.value)}
                              onBlur={() => setEditingSlideId(null)}
                              autoFocus
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                padding: "2px 6px",
                                borderRadius: 4,
                                border: "1px solid var(--burgundy-rich, #6E1A2D)",
                                width: "70%"
                              }}
                            />
                          ) : (
                            <span
                              onClick={() => setEditingSlideId(slide.id)}
                              title="Click to edit slide title"
                              style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
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
                              background: "rgba(0,0,0,0.06)",
                              color: "var(--text-body)",
                              fontFamily: "var(--font-mono)"
                            }}
                          >
                            {slide.categoryTag || "CONTENT"}
                          </span>
                        </div>

                        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                          {slide.purpose}
                        </p>
                      </div>

                      {/* Reorder / Action buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => moveSlide(idx, -1)}
                          disabled={idx === 0}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-strong)",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 10,
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
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-strong)",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 10,
                            cursor: idx === deckGraph.slides.length - 1 ? "not-allowed" : "pointer",
                            opacity: idx === deckGraph.slides.length - 1 ? 0.3 : 1
                          }}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlide(slide.id)}
                          title="Remove slide"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "2px 5px"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 5. Tab 2 Content: All Searched Inquiries */}
          {activeTab === "inquiries" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12.5, color: "var(--text-body)", background: "var(--bg-card)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                💡 <strong>Session Inquiries ({deckGraph.topicsAnalyzedCount} Turns):</strong> Each inquiry below is automatically included as a dedicated slide in your presentation.
              </div>

              {(deckGraph.searchedInquiries || []).map((inq, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-card, #FAF8F5)",
                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                    borderRadius: 8,
                    padding: "12px 14px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          background: "var(--burgundy-rich, #6E1A2D)",
                          color: "#FFFFFF",
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        Turn #{inq.turnIndex}
                      </span>
                      <span
                        style={{
                          background: "var(--burgundy-light, #FDF2F4)",
                          color: "var(--burgundy-rich, #6E1A2D)",
                          border: "1px solid var(--burgundy-border, #F3CBD2)",
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4
                        }}
                      >
                        {inq.module}
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: "var(--green-text, #065F46)", fontWeight: 700 }}>
                      ✓ Generated in Slide #{idx + 3}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                    {inq.query}
                  </h3>

                  <p style={{ fontSize: 12, color: "var(--text-body)", margin: "0 0 6px 0", lineHeight: 1.45 }}>
                    {inq.responseSnippet}
                  </p>

                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)" }}>T-Codes:</span>
                    {(inq.tcodes && inq.tcodes.length > 0 ? inq.tcodes : ["/SAPSLL/BL_DOCS"]).map((tc, tcIdx) => (
                      <span
                        key={tcIdx}
                        style={{
                          fontSize: 10.5,
                          fontFamily: "var(--font-mono)",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-primary)",
                          padding: "1px 5px",
                          borderRadius: 3,
                          fontWeight: 600
                        }}
                      >
                        {tc}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            background: "var(--bg-card, #FAF8F5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total: <strong>{selectedSlideIds.length}</strong> of <strong>{deckGraph.slides.length}</strong> slides selected
            </span>
            {exportSuccess && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-text, #065F46)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                ✓ PowerPoint (.pptx) Exported!
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handlePrintOutline}
              style={{
                padding: "7px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-body)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                cursor: "pointer"
              }}
            >
              🖨️ Print
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-body)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExportPptx}
              disabled={isExporting || selectedSlideIds.length === 0}
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 18px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isExporting || selectedSlideIds.length === 0 ? "not-allowed" : "pointer"
              }}
            >
              {isExporting ? (
                <>
                  <span style={{ width: 12, height: 12, border: "2px solid #FFFFFF", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  <span>Generating Deck...</span>
                </>
              ) : (
                <>
                  <span>📽️</span>
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
