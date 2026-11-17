import React, { useState, useEffect, useRef, useMemo } from "react";

/**
 * Classifies a turn's semantic type based on title and text content
 */
export function detectTurnSemanticType(turn) {
  const text = `${turn.title || ""} ${turn.content || ""}`.toLowerCase();

  // SAP Tool / BAPI / Code execution
  if (
    text.includes("/code") ||
    text.includes("bapi_") ||
    text.includes("rfc_") ||
    text.includes("idoc") ||
    text.includes("se16") ||
    text.includes("se38") ||
    text.includes("sm59") ||
    text.includes("bd87") ||
    text.includes("ltmc") ||
    text.includes("executed bapi") ||
    text.includes("executing script") ||
    text.includes("sql query") ||
    text.includes("database table") ||
    text.includes("diagnostic execution")
  ) {
    return {
      type: "tool",
      label: "SAP Tool / BAPI",
      icon: "⚡",
      badgeBg: "rgba(139, 92, 246, 0.12)",
      badgeBorder: "rgba(139, 92, 246, 0.35)",
      badgeColor: "#8B5CF6",
      accent: "#8B5CF6"
    };
  }

  // Functional Spec / Word FSD / Deliverable / Architecture
  if (
    text.includes("fsd") ||
    text.includes("functional spec") ||
    text.includes("chezzion") ||
    text.includes("deliverable") ||
    text.includes("wricef") ||
    text.includes("blueprint") ||
    text.includes("architecture specification") ||
    text.includes("business requirement") ||
    text.includes("functional design") ||
    text.includes("runbook")
  ) {
    return {
      type: "fsd",
      label: "Word FSD",
      icon: "📄",
      badgeBg: "rgba(16, 185, 129, 0.12)",
      badgeBorder: "rgba(16, 185, 129, 0.35)",
      badgeColor: "#10B981",
      accent: "#10B981"
    };
  }

  // Email Draft / Outbound Memo / Executive Note
  if (
    text.includes("email draft") ||
    text.includes("subject:") ||
    text.includes("dear ") ||
    text.includes("mailto:") ||
    text.includes("stakeholder memo") ||
    text.includes("formal email") ||
    text.includes("communication draft")
  ) {
    return {
      type: "email",
      label: "Email Draft",
      icon: "✉️",
      badgeBg: "rgba(2, 132, 199, 0.12)",
      badgeBorder: "rgba(2, 132, 199, 0.35)",
      badgeColor: "#0284C7",
      accent: "#0284C7"
    };
  }

  // Deck / Slide / Presentation / Visual / VSM
  if (
    text.includes("slide") ||
    text.includes("deck") ||
    text.includes("presentation") ||
    text.includes("vsm") ||
    text.includes("value stream") ||
    text.includes("schematic") ||
    text.includes("warehouse-visual") ||
    text.includes("diagram") ||
    text.includes("flowchart") ||
    text.includes("throughput chart")
  ) {
    return {
      type: "deck",
      label: "Deck / VSM",
      icon: "📊",
      badgeBg: "rgba(245, 158, 11, 0.12)",
      badgeBorder: "rgba(245, 158, 11, 0.35)",
      badgeColor: "#F59E0B",
      accent: "#F59E0B"
    };
  }

  // Default User Inquiry / Question / Prompt
  return {
    type: "question",
    label: "Question",
    icon: "💬",
    badgeBg: "rgba(232, 97, 77, 0.12)",
    badgeBorder: "rgba(232, 97, 77, 0.35)",
    badgeColor: "#E8614D",
    accent: "#E8614D"
  };
}

/**
 * Unified Turn Navigator HUD
 * Combines Option 3 (Compact Radial Dial & Circular HUD) with Option 1 (Semantic Type-Aware Mini-Map Flyout)
 */
export default function TurnNavigatorHUD({
  turns = [],
  activeIndex = 0,
  onSelectTurn = () => {},
  onScrollToTop = null,
  onScrollToBottom = null,
  style = {},
  placement = "workspace"
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return localStorage.getItem("nexus_turn_hud_pinned") === "true";
    } catch {
      return false;
    }
  });
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem("nexus_turn_hud_pinned") === "true";
    } catch {
      return false;
    }
  });
  const [isDialHovered, setIsDialHovered] = useState(false);
  const [hoveredTurnIndex, setHoveredTurnIndex] = useState(null);
  const [collapseMiddle, setCollapseMiddle] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  const hudContainerRef = useRef(null);
  const flyoutListRef = useRef(null);
  const activeItemRef = useRef(null);

  const totalTurns = turns.length;
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, Math.max(0, totalTurns - 1)));
  const activeTurn = turns[safeActiveIndex] || null;

  // Toggle pinned persistence
  const togglePin = () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    setIsExpanded(nextPinned);
    try {
      localStorage.setItem("nexus_turn_hud_pinned", nextPinned ? "true" : "false");
    } catch (e) {
      // ignore
    }
  };

  // Close when clicking outside if not pinned
  useEffect(() => {
    if (!isExpanded || isPinned) return;
    const handleOutsideClick = (e) => {
      if (hudContainerRef.current && !hudContainerRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isExpanded, isPinned]);

  // Keyboard navigation shortcuts: Alt+Up / Alt+Down
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in input or textarea
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.altKey && (e.key === "ArrowUp" || e.key === "PageUp")) {
        e.preventDefault();
        handleStepPrev();
      } else if (e.altKey && (e.key === "ArrowDown" || e.key === "PageDown")) {
        e.preventDefault();
        handleStepNext();
      } else if (e.key === "Escape" && isExpanded && !isPinned) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [safeActiveIndex, totalTurns, isExpanded, isPinned]);

  // Auto-scroll active turn into view inside the flyout list when it opens or active turn changes
  useEffect(() => {
    if (isExpanded && activeItemRef.current && flyoutListRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [isExpanded, safeActiveIndex]);

  if (totalTurns === 0) return null;

  // Circular Dial Calculations
  // SVG radius 17, circumference ~ 106.81
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalTurns > 0 ? (safeActiveIndex + 1) / totalTurns : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleStepPrev = () => {
    if (safeActiveIndex > 0) {
      const prevIdx = safeActiveIndex - 1;
      onSelectTurn(prevIdx, turns[prevIdx].id);
    }
  };

  const handleStepNext = () => {
    if (safeActiveIndex < totalTurns - 1) {
      const nextIdx = safeActiveIndex + 1;
      onSelectTurn(nextIdx, turns[nextIdx].id);
    }
  };

  // Turn metadata with cached semantic classification
  const annotatedTurns = useMemo(() => {
    return turns.map((t, idx) => {
      const semantic = detectTurnSemanticType(t);
      return {
        ...t,
        originalIndex: idx,
        semantic
      };
    });
  }, [turns]);

  // Filtered turns if user enters search filter
  const visibleAnnotatedTurns = useMemo(() => {
    if (!searchFilter.trim()) return annotatedTurns;
    const q = searchFilter.toLowerCase();
    return annotatedTurns.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        t.semantic.label.toLowerCase().includes(q) ||
        `turn ${t.originalIndex + 1}`.includes(q)
    );
  }, [annotatedTurns, searchFilter]);

  const activeTurnSemantic = activeTurn ? detectTurnSemanticType(activeTurn) : null;

  return (
    <>
      <style>{`
        @keyframes nexusDialPulse {
          0%, 100% {
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(232, 97, 77, 0.4);
          }
          50% {
            box-shadow: 0 4px 22px rgba(0, 0, 0, 0.2), 0 0 0 6px rgba(232, 97, 77, 0);
          }
        }
        @keyframes nexusFlyoutFadeIn {
          from {
            opacity: 0;
            transform: translateX(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .nexus-turn-hud-btn:hover {
          background: var(--bg-card-hover) !important;
          color: var(--text-primary) !important;
          transform: scale(1.08);
        }
        .nexus-turn-item:hover {
          background: var(--bg-card-hover) !important;
          border-color: var(--border-strong) !important;
        }
      `}</style>

      {/* Main Floating HUD Container */}
      <div
        ref={hudContainerRef}
        style={{
          position: "fixed",
          right: "22px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 12,
          userSelect: "none",
          ...style
        }}
      >
        {/* ========================================================================= */}
        {/* OPTION 1: SEMANTIC TYPE-AWARE MINI-MAP FLYOUT                             */}
        {/* ========================================================================= */}
        {isExpanded && (
          <div
            style={{
              position: "absolute",
              right: "calc(100% + 14px)",
              top: "50%",
              transform: "translateY(-50%)",
              width: 320,
              maxWidth: "calc(100vw - 80px)",
              maxHeight: "80vh",
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              borderRadius: 16,
              boxShadow: "0 16px 48px rgba(0,0,0,0.22), 0 2px 10px rgba(0,0,0,0.08)",
              backdropFilter: "blur(18px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "nexusFlyoutFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 10000
            }}
          >
            {/* Flyout Header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-surface)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>🧭</span>
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                      color: "var(--text-muted)",
                      textTransform: "uppercase"
                    }}
                  >
                    Session Turns Map
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
                    Turn {safeActiveIndex + 1} of {totalTurns}
                  </div>
                </div>
              </div>

              {/* Quick Actions (Top, Bottom, Pin, Close) */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {onScrollToTop && (
                  <button
                    onClick={onScrollToTop}
                    title="Jump to Top (Home)"
                    className="nexus-turn-hud-btn"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 5,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      transition: "all 0.15s ease"
                    }}
                  >
                    ⏫
                  </button>
                )}

                {onScrollToBottom && (
                  <button
                    onClick={onScrollToBottom}
                    title="Jump to Bottom (End)"
                    className="nexus-turn-hud-btn"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 5,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      transition: "all 0.15s ease"
                    }}
                  >
                    ⏬
                  </button>
                )}

                {/* Pin Button */}
                <button
                  onClick={togglePin}
                  title={isPinned ? "Unpin flyout (auto-collapse)" : "Pin flyout (keep open)"}
                  className="nexus-turn-hud-btn"
                  style={{
                    background: isPinned ? "rgba(232, 97, 77, 0.14)" : "transparent",
                    border: isPinned ? "1px solid rgba(232, 97, 77, 0.4)" : "1px solid transparent",
                    color: isPinned ? "var(--orange)" : "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px 6px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    transition: "all 0.15s ease"
                  }}
                >
                  📌
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  title="Close Map (Esc)"
                  className="nexus-turn-hud-btn"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px 7px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    transition: "all 0.15s ease"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Filter Search (shows if turns >= 6) */}
            {totalTurns >= 6 && (
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-main)"
                }}
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 8,
                      fontSize: 11,
                      color: "var(--text-muted)",
                      pointerEvents: "none"
                    }}
                  >
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter turns by keyword or type..."
                    style={{
                      width: "100%",
                      padding: "5px 24px 5px 26px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      fontSize: 11.5,
                      color: "var(--text-primary)",
                      outline: "none",
                      fontFamily: "var(--font-sans)"
                    }}
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter("")}
                      style={{
                        position: "absolute",
                        right: 6,
                        background: "none",
                        border: "none",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        cursor: "pointer"
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Turn List */}
            <div
              ref={flyoutListRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 380
              }}
            >
              {visibleAnnotatedTurns.map((turn, vIdx) => {
                const isItemActive = turn.originalIndex === safeActiveIndex;
                const isItemHovered = hoveredTurnIndex === turn.originalIndex;

                return (
                  <div
                    key={turn.id}
                    ref={isItemActive ? activeItemRef : null}
                    onClick={() => {
                      onSelectTurn(turn.originalIndex, turn.id);
                      if (!isPinned) setIsExpanded(false);
                    }}
                    onMouseEnter={() => setHoveredTurnIndex(turn.originalIndex)}
                    onMouseLeave={() => setHoveredTurnIndex(null)}
                    className="nexus-turn-item"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 9,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: isItemActive
                        ? "rgba(110, 26, 45, 0.08)"
                        : isItemHovered
                        ? "var(--bg-surface)"
                        : "transparent",
                      border: isItemActive
                        ? "1px solid var(--orange)"
                        : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.16s ease",
                      position: "relative"
                    }}
                  >
                    {/* Active Left Pill Indicator */}
                    {isItemActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 2,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          borderRadius: 2,
                          background: "var(--orange)"
                        }}
                      />
                    )}

                    {/* Turn Index Pill */}
                    <div
                      style={{
                        minWidth: 26,
                        height: 22,
                        borderRadius: 5,
                        background: isItemActive
                          ? "var(--orange)"
                          : "var(--bg-surface)",
                        border: isItemActive
                          ? "1px solid var(--orange)"
                          : "1px solid var(--border-subtle)",
                        color: isItemActive ? "#FFFFFF" : "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1
                      }}
                    >
                      {turn.originalIndex + 1 < 10 ? `0${turn.originalIndex + 1}` : turn.originalIndex + 1}
                    </div>

                    {/* Turn Content & Semantic Badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 3
                        }}
                      >
                        {/* Semantic Type Badge */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3.5,
                            background: turn.semantic.badgeBg,
                            border: `1px solid ${turn.semantic.badgeBorder}`,
                            color: turn.semantic.badgeColor,
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 9.5,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em"
                          }}
                        >
                          <span style={{ fontSize: 10 }}>{turn.semantic.icon}</span>
                          <span>{turn.semantic.label}</span>
                        </span>

                        {isItemActive && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              color: "var(--orange)",
                              fontFamily: "var(--font-mono)",
                              textTransform: "uppercase"
                            }}
                          >
                            • ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Turn Title */}
                      <div
                        title={turn.title}
                        style={{
                          fontSize: 12,
                          fontWeight: isItemActive ? 700 : 500,
                          color: isItemActive ? "var(--text-primary)" : "var(--text-body)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.3
                        }}
                      >
                        {turn.title || `Turn ${turn.originalIndex + 1}`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {visibleAnnotatedTurns.length === 0 && (
                <div
                  style={{
                    padding: "20px 12px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 11.5
                  }}
                >
                  No turns match "{searchFilter}"
                </div>
              )}
            </div>

            {/* Flyout Footer */}
            <div
              style={{
                padding: "8px 14px",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                fontSize: 10.5,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>Alt+▲ / Alt+▼ to step</span>
              <span>{visibleAnnotatedTurns.length} turns mapped</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OPTION 3: COMPACT RADIAL DIAL & CIRCULAR HUD WIDGET                       */}
        {/* ========================================================================= */}
        <div
          onMouseEnter={() => setIsDialHovered(true)}
          onMouseLeave={() => setIsDialHovered(false)}
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "8px 6px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 28,
            boxShadow: isDialHovered
              ? "0 8px 24px rgba(0,0,0,0.18)"
              : "0 4px 16px rgba(0,0,0,0.1)",
            backdropFilter: "blur(14px)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* STEP PREVIOUS (▲) */}
          <button
            onClick={handleStepPrev}
            disabled={safeActiveIndex <= 0}
            title={safeActiveIndex > 0 ? `Previous Turn (${safeActiveIndex}/${totalTurns})` : "First Turn"}
            className="nexus-turn-hud-btn"
            style={{
              width: 28,
              height: 22,
              borderRadius: 11,
              background: "transparent",
              border: "none",
              color: safeActiveIndex <= 0 ? "var(--text-faint)" : "var(--text-primary)",
              cursor: safeActiveIndex <= 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              padding: 0,
              opacity: safeActiveIndex <= 0 ? 0.3 : 1,
              transition: "all 0.15s ease"
            }}
            aria-label="Previous Turn"
          >
            ▲
          </button>

          {/* CIRCULAR RADIAL PROGRESS DIAL */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            title={`Turn ${safeActiveIndex + 1} of ${totalTurns}. Click to toggle Semantic Mini-Map.`}
            style={{
              position: "relative",
              width: 48,
              height: 48,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "transform 0.18s ease"
            }}
          >
            {/* SVG Ring with Gradient */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 44 44"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%"
              }}
            >
              <defs>
                <linearGradient id="nexusRadialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="var(--orange)" />
                </linearGradient>
              </defs>

              {/* Background Track Circle */}
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3.2"
                opacity="0.35"
              />

              {/* Foreground Animated Progress Circle */}
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="url(#nexusRadialGradient)"
                strokeWidth="3.4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              />
            </svg>

            {/* Inner Center Readout */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                lineHeight: 1
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)"
                }}
              >
                {safeActiveIndex + 1}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  marginTop: 1
                }}
              >
                /{totalTurns}
              </span>
            </div>
          </div>

          {/* STEP NEXT (▼) */}
          <button
            onClick={handleStepNext}
            disabled={safeActiveIndex >= totalTurns - 1}
            title={safeActiveIndex < totalTurns - 1 ? `Next Turn (${safeActiveIndex + 2}/${totalTurns})` : "Latest Turn"}
            className="nexus-turn-hud-btn"
            style={{
              width: 28,
              height: 22,
              borderRadius: 11,
              background: "transparent",
              border: "none",
              color: safeActiveIndex >= totalTurns - 1 ? "var(--text-faint)" : "var(--text-primary)",
              cursor: safeActiveIndex >= totalTurns - 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              padding: 0,
              opacity: safeActiveIndex >= totalTurns - 1 ? 0.3 : 1,
              transition: "all 0.15s ease"
            }}
            aria-label="Next Turn"
          >
            ▼
          </button>

          {/* Mini Expand Icon / Map Pill */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Map" : "Open Semantic Mini-Map"}
            className="nexus-turn-hud-btn"
            style={{
              marginTop: 2,
              padding: "2px 5px",
              background: isExpanded ? "rgba(110, 26, 45, 0.14)" : "transparent",
              border: isExpanded ? "1px solid var(--orange)" : "1px solid transparent",
              borderRadius: 6,
              color: isExpanded ? "var(--orange)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 9.5,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 2,
              transition: "all 0.15s ease"
            }}
          >
            <span>{isExpanded ? "◀ MAP" : "MAP"}</span>
          </button>

          {/* Quick Hover Tooltip Preview when collapsed */}
          {!isExpanded && isDialHovered && activeTurn && (
            <div
              style={{
                position: "absolute",
                right: "calc(100% + 12px)",
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                borderRadius: 10,
                padding: "8px 12px",
                whiteSpace: "nowrap",
                maxWidth: 290,
                overflow: "hidden",
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                zIndex: 99999
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {activeTurnSemantic && (
                  <span
                    style={{
                      background: activeTurnSemantic.badgeBg,
                      border: `1px solid ${activeTurnSemantic.badgeBorder}`,
                      color: activeTurnSemantic.badgeColor,
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontSize: 9.5,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3
                    }}
                  >
                    <span>{activeTurnSemantic.icon}</span>
                    <span>{activeTurnSemantic.label}</span>
                  </span>
                )}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)"
                  }}
                >
                  Turn {safeActiveIndex + 1}/{totalTurns}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {activeTurn.title}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: "var(--text-faint)",
                  fontFamily: "var(--font-mono)",
                  marginTop: 2
                }}
              >
                Click dial to expand full navigation map
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
