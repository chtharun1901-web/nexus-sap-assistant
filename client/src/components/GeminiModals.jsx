import React from "react";

/**
 * Semantic Incident Matcher Modal
 * Displays dense vector similarity results from Gemini Embedding 2
 * over the 2,292 AMS hypercare incidents.
 */
export function SemanticIncidentMatcherModal({
  isOpen,
  onClose,
  data,
  isLoading,
  onSelectFix
}) {
  if (!isOpen && !data) return null;

  const matches = data?.matches || [];
  const query = data?.query || "";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        background: "var(--bg-card, #FFFFFF)",
        border: "1px solid var(--border-strong, #E2E8F0)",
        borderRadius: 16,
        width: "100%",
        maxWidth: 780,
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 48px rgba(0, 0, 0, 0.22)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(110, 26, 45, 0.04) 100%)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Gemini Embedding 2 · Semantic Incident Matcher
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                3072-dimensional vector similarity across 2,292+ live AMS warehouse tickets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Query Pill */}
        <div style={{ padding: "12px 24px", background: "var(--bg-surface, #F8FAFC)", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Queried Symptom: </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            "{query}"
          </span>
        </div>

        {/* Content / Matches List */}
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1 }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{
                width: 28,
                height: 28,
                border: "3px solid var(--orange, #6E1A2D)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "nexusSpinner 0.8s linear infinite",
                margin: "0 auto 12px auto"
              }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Computing dense vector cosine distances...</p>
            </div>
          ) : matches.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ margin: 0, fontSize: 14 }}>No close semantic matches found. Try describing the symptom or error code.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {matches.map((m, idx) => (
                <div
                  key={m.id || idx}
                  style={{
                    background: "var(--bg-card, #FFFFFF)",
                    border: "1px solid var(--border-subtle, #E2E8F0)",
                    borderLeft: `4px solid ${m.matchPercentage >= 80 ? "#10B981" : "#D97706"}`,
                    borderRadius: 10,
                    padding: "14px 18px",
                    transition: "all 0.15s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        background: m.matchPercentage >= 80 ? "rgba(16, 185, 129, 0.15)" : "rgba(217, 119, 6, 0.15)",
                        color: m.matchPercentage >= 80 ? "#065F46" : "#92400E",
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 8px",
                        borderRadius: 12
                      }}>
                        {m.matchPercentage}% Vector Match
                      </span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                        {m.plant || 'All Plants'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--orange, #6E1A2D)", fontFamily: "var(--font-mono)" }}>
                        {m.tcode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectFix(m)}
                      style={{
                        background: "var(--orange, #6E1A2D)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      Apply Standard Fix ↵
                    </button>
                  </div>

                  <h4 style={{ margin: "0 0 6px 0", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {m.title}
                  </h4>

                  <div style={{ fontSize: 12, color: "var(--text-body)", marginBottom: 6 }}>
                    <strong>Root Cause:</strong> {m.rootCause}
                  </div>

                  <div style={{ fontSize: 12, color: "#065F46", background: "rgba(16, 185, 129, 0.08)", padding: "6px 10px", borderRadius: 6 }}>
                    <strong>Verified Floor SOP:</strong> {m.resolution}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              background: "var(--bg-surface, #F1F5F9)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-muted)",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Deep Autonomous SAP Investigation Modal
 * Kicks off an exhaustive 5-phase forensic root cause report and saves it to Nexus Docs.
 */
export function DeepResearchModal({
  isOpen,
  onClose,
  topic,
  onTopicChange,
  isGenerating,
  onLaunch
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(5px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        background: "var(--bg-card, #FFFFFF)",
        border: "1px solid var(--border-strong, #E2E8F0)",
        borderRadius: 16,
        width: "100%",
        maxWidth: 680,
        boxShadow: "0 24px 52px rgba(0, 0, 0, 0.28)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "linear-gradient(135deg, rgba(110, 26, 45, 0.08) 0%, rgba(138, 36, 53, 0.03) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔬</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Gemini Deep Autonomous SAP Investigation Agent
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                Synthesizes a 5-phase forensic RCA report, architecture diagrams, and supervisor SOP
              </p>
            </div>
          </div>
          {!isGenerating && (
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "var(--text-muted)", cursor: "pointer" }}>
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px" }}>
          {isGenerating ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 36,
                height: 36,
                border: "3.5px solid var(--orange, #6E1A2D)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "nexusSpinner 0.8s linear infinite",
                margin: "0 auto 16px auto"
              }} />
              <h4 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Conducting Multi-Phase Deep Technical Investigation...
              </h4>
              <p style={{ margin: "0 0 20px 0", fontSize: 12.5, color: "var(--text-muted)" }}>
                Cross-referencing qRFC queue architecture, /SCWM/ tables, and hypercare patterns
              </p>

              {/* Live 5-Phase Checklist Stepper */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", maxWidth: 460, margin: "0 auto", background: "var(--bg-surface, #F8FAFC)", padding: "16px 20px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#065F46", fontWeight: 600 }}>
                  <span>✓</span> <span>1. Executive Perimeter & Operational Blast Radius</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#065F46", fontWeight: 600 }}>
                  <span>✓</span> <span>2. Technical Architecture & qRFC Interface Flow</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--orange)", fontWeight: 700 }}>
                  <span style={{ animation: "nexusCursorPulse 0.8s infinite" }}>▶</span> <span>3. Forensic Root Cause Analysis Matrix</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
                  <span>⚪</span> <span>4. Immediate Floor Resolution Playbook</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
                  <span>⚪</span> <span>5. Permanent Prevention & Supervisor SOP Playbook</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Investigation Topic or Problem Description:
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => onTopicChange(e.target.value)}
                placeholder="e.g. Outbound PGI queue stalling in SMQ2 during peak night shift at staging door in EWM 9.5 and S/4HANA with split handling units..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-strong, #CBD5E1)",
                  fontSize: 14,
                  lineHeight: "22px",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box"
                }}
              />

              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                <span>💡 Tip:</span>
                <span>The report will automatically be saved into <strong>Nexus Docs</strong> and opened in your split view.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onLaunch(topic)}
              disabled={!topic?.trim()}
              style={{
                padding: "8px 20px",
                background: topic?.trim() ? "var(--orange, #6E1A2D)" : "var(--border-subtle)",
                color: topic?.trim() ? "#FFFFFF" : "var(--text-muted)",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: topic?.trim() ? "pointer" : "not-allowed",
                boxShadow: topic?.trim() ? "0 4px 12px rgba(110, 26, 45, 0.25)" : "none"
              }}
            >
              Launch Autonomous Investigation 🔬
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
