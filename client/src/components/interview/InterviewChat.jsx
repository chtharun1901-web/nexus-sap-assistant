import React, { useState, useRef, useEffect, useMemo } from "react";
import { FormattedText } from "../../views/Workspace.jsx";

const QUICK_PRESETS = [
  { label: "Production Version (C223)", prompt: "In SAP S/4HANA Manufacturing, what is the role of Production Version (C223) and why is it mandatory?" },
  { label: "Embedded vs Decentralized EWM", prompt: "Explain the architectural and staging differences between Embedded EWM and Decentralized EWM." },
  { label: "SMQ2 qRFC Stuck SYSFAIL", prompt: "How do you triage and resolve stuck inbound qRFC queues in SMQ2 with status SYSFAIL?" },
  { label: "TECO vs CLSD in CO02", prompt: "Explain the functional and financial differences between TECO (Technically Complete) and CLSD (Closed) in Production Orders." },
  { label: "bgRFC Supervisor Destination", prompt: "How does bgRFC handle supervisor destinations in S/4HANA compared to classic qRFC?" },
  { label: "P1 Outage Scenario Analysis", prompt: "Provide a comprehensive step-by-step resolution analysis for handling a high-priority P1 production supply outage in SAP." }
];

export default function InterviewChat({
  history = [],
  onSend,
  loading = false
}) {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState({});
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [hoveredTurn, setHoveredTurn] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Extract user question turns for right-side navigation dots
  const userTurns = useMemo(() => {
    return history
      .map((m, idx) => ({ ...m, originalIdx: idx }))
      .filter((m) => m.role === "user")
      .map((m, uIdx) => ({
        id: `interview-turn-${m.originalIdx}`,
        originalIdx: m.originalIdx,
        turnNumber: uIdx + 1,
        title: (m.content || "").slice(0, 60) + ((m.content || "").length > 60 ? "..." : "")
      }));
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const handleInputResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    const newH = Math.min(Math.max(el.scrollHeight, 38), 160);
    el.style.height = newH + "px";
  };

  const handleSend = (overrideText) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;
    if (!overrideText) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "38px";
    }
    onSend(textToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExportWord = (content) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Operations Advisory</title><style>body{font-family:Arial,sans-serif;line-height:1.6;}h1{color:#FF5500;}h2{color:#D97706;}</style></head><body>";
    const footer = "</body></html>";
    const html = header + "<h1>SAP Operations & Architecture Analysis</h1><hr/>" + content.replace(/\n/g, "<br/>") + footer;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "SAP_Technical_Analysis.doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-main)",
        overflow: "hidden"
      }}
    >
      {/* Quick Presets Strip */}
      <div
        style={{
          padding: "8px 24px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-subtle)",
          overflowX: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          whiteSpace: "nowrap"
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            marginRight: 4
          }}
        >
          Quick Presets:
        </span>
        {QUICK_PRESETS.map((item, i) => (
          <button
            key={i}
            onClick={() => handleSend(item.prompt)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              padding: "4px 10px",
              borderRadius: 5,
              fontSize: 11.5,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-sans)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--orange)";
              e.currentTarget.style.background = "rgba(255,85,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.background = "var(--bg-surface)";
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Messages Canvas */}
      <div
        ref={chatScrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          background: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          position: "relative"
        }}
      >
        {history.length === 0 && (
          <div style={{ maxWidth: 840, margin: "20px auto", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  padding: "3px 10px",
                  borderRadius: 4
                }}
              >
                OPERATIONS ASSISTANT
              </span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 700 }}>
                Active Advisory
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
                Landscape: S/4HANA 2023 · Embedded EWM
              </span>
            </div>

            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 10,
                letterSpacing: "-0.02em"
              }}
            >
              Welcome, ask anything.
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.65, marginBottom: 24 }}>
              Ask any SAP technical questions, enterprise scenarios, or operational workflows. Responses are generated with comprehensive technical depth, configuration rationale, and key T-Codes.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {QUICK_PRESETS.slice(0, 4).map((p, i) => (
                <div
                  key={i}
                  onClick={() => handleSend(p.prompt)}
                  style={{
                    cursor: "pointer",
                    padding: "14px 16px",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    background: "var(--bg-surface)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--orange)";
                    e.currentTarget.style.background = "rgba(255,85,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.background = "var(--bg-surface)";
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {p.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, idx) => {
          const isUser = msg.role === "user";
          const currentTab = activeTab[idx] || "standard";

          return (
            <div
              key={idx}
              id={isUser ? `interview-turn-${idx}` : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                width: "100%",
                maxWidth: 920,
                margin: "0 auto",
                scrollMarginTop: "24px"
              }}
            >
              {isUser ? (
                <div
                  style={{
                    background: "rgba(255,85,0,0.08)",
                    border: "1px solid rgba(255,85,0,0.25)",
                    borderRadius: "10px 10px 2px 10px",
                    padding: "10px 16px",
                    maxWidth: "85%",
                    fontSize: 13.5,
                    color: "var(--text-primary)",
                    lineHeight: 1.55,
                    fontWeight: 500
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    background: "transparent",
                    padding: "4px 0",
                    boxSizing: "border-box"
                  }}
                >
                  {/* Copilot Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--border-subtle)",
                      flexWrap: "wrap",
                      gap: 10
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--orange)", display: "inline-block" }} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}
                      >
                        NEXUS SAP COPILOT · OPERATIONS ADVISOR
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* Speakable Tab Switcher */}
                      {[
                        { id: "standard", label: "Full Analysis" },
                        { id: "short", label: "🗣️ Quick Summary" },
                        { id: "strong", label: "💪 Comprehensive" },
                        { id: "deep", label: "🔬 Deep-Dive" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setActiveTab((prev) => ({ ...prev, [idx]: t.id }));
                            if (t.id === "short") {
                              handleSend("Summarize your previous response into a concise 30-second summary.");
                            } else if (t.id === "strong") {
                              handleSend("Format your previous response as a structured 1-to-2 minute operational answer with business context, key T-Codes, and tables.");
                            } else if (t.id === "deep") {
                              handleSend("Provide a deep-dive technical breakdown of your previous response with configuration tables, edge cases, and qRFC/bgRFC queues.");
                            }
                          }}
                          style={{
                            background: currentTab === t.id ? "rgba(255,85,0,0.12)" : "var(--bg-surface)",
                            border: "1px solid " + (currentTab === t.id ? "rgba(255,85,0,0.4)" : "var(--border-subtle)"),
                            color: currentTab === t.id ? "var(--orange)" : "var(--text-primary)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--font-mono)"
                          }}
                        >
                          {t.label}
                        </button>
                      ))}

                      {/* Export Word */}
                      <button
                        onClick={() => handleExportWord(msg.content)}
                        title="Export to Word"
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        📄 Word
                      </button>
                    </div>
                  </div>

                  {/* Formatted Content */}
                  <div style={{ color: "var(--text-body)" }}>
                    <FormattedText text={msg.content} />
                  </div>

                  {/* Action Toolbar */}
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 6
                    }}
                  >
                    <button
                      onClick={() => handleSend("Evaluate this solution: " + msg.content)}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      ⭐ Evaluate Response
                    </button>
                    <button
                      onClick={() => handleSend("Explain this in natural spoken explanation language for a 5+ years experience SAP Consultant.")}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      🗣️ Natural Script
                    </button>
                    <button
                      onClick={() => handleSend("What difficult edge cases or technical nuances could arise from this?")}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      ❓ Explore Nuances
                    </button>
                    <button
                      onClick={() => handleSend("Give me a simpler explanation with a realistic production support example.")}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      💡 Practical Example
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(msg.content);
                      }}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer"
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              width: "fit-content",
              margin: "0 auto 0 0"
            }}
          >
            <span style={{ fontSize: 13 }}>🤖</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Formulating response...</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--orange)",
                    opacity: 0.8
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Right-Side User Question Turn Dots Rail */}
      {userTurns.length >= 1 && (
        <div
          style={{
            position: "fixed",
            right: "22px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            background: "var(--bg-surface)",
            border: "1.5px solid var(--border-strong)",
            padding: "14px 8px",
            borderRadius: 24,
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            backdropFilter: "blur(12px)"
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "var(--orange)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 2
            }}
          >
            TURNS
          </span>

          {userTurns.map((turn, tIdx) => {
            const isActive = activeTurnIndex === tIdx;
            const isHovered = hoveredTurn === tIdx;

            return (
              <div
                key={turn.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {tIdx < userTurns.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      width: 2,
                      height: 14,
                      background: "var(--border-subtle)",
                      zIndex: 0
                    }}
                  />
                )}

                <button
                  onClick={() => {
                    const el = document.getElementById(turn.id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      setActiveTurnIndex(tIdx);
                    }
                  }}
                  onMouseEnter={() => setHoveredTurn(tIdx)}
                  onMouseLeave={() => setHoveredTurn(null)}
                  className={isActive ? "anim-nav-dot-active" : ""}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: isActive ? 14 : 10,
                    height: isActive ? 14 : 10,
                    borderRadius: "50%",
                    background: isActive ? "var(--orange)" : isHovered ? "var(--text-primary)" : "var(--bg-card)",
                    border: isActive
                      ? "2px solid #FFFFFF"
                      : isHovered
                      ? "2px solid var(--orange)"
                      : "2px solid var(--border-strong)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isHovered ? "scale(1.4)" : "scale(1)",
                    boxShadow: isActive ? "0 0 10px rgba(255,85,0,0.85)" : "none"
                  }}
                  aria-label={`Jump to Question ${turn.turnNumber}: ${turn.title}`}
                />

                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      right: 32,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-strong)",
                      boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
                      borderRadius: 8,
                      padding: "7px 14px",
                      whiteSpace: "nowrap",
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      pointerEvents: "none",
                      fontFamily: "var(--font-sans)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      zIndex: 99999
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(255,85,0,0.15)",
                        color: "var(--orange)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)"
                      }}
                    >
                      Q${turn.turnNumber}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {turn.title}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Input Dock */}
      <div
        style={{
          padding: "12px 32px",
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            padding: "6px 12px"
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleInputResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 13.5,
              lineHeight: 1.5,
              resize: "none",
              minHeight: 38,
              maxHeight: 160,
              fontFamily: "var(--font-sans)"
            }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? "var(--orange)" : "rgba(0,0,0,0.06)",
              color: input.trim() && !loading ? "#FFFFFF" : "var(--text-muted)",
              border: "none",
              padding: "7px 16px",
              borderRadius: 5,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: input.trim() && !loading ? "pointer" : "default",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>Send</span>
            <span>↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
