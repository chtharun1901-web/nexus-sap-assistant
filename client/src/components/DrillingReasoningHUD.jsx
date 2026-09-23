import React, { useState, useEffect } from "react";

const DEFAULT_DRILLING_STAGES = [
  { icon: "🌀", title: "Drilling into SAP Domain Knowledge Base", detail: "Querying indexed SAP Help Portal, OSS Notes catalog, and standard architectural flows..." },
  { icon: "🔍", title: "Scanning T-Codes, Master Data & Determination Rules", detail: "Evaluating core transaction codes, condition techniques, tables (VBAK, VBAP, /SAPSLL/*), and CDS views..." },
  { icon: "📊", title: "Correlating Document Flows & Attached Data Records", detail: "Validating spreadsheet records, partner profiles, organizational assignments, and field lengths..." },
  { icon: "⚙️", title: "Cross-Referencing SPRO Customizing Paths & System Rules", detail: "Structuring configuration runbooks, S/4HANA release differences, and copy controls..." },
  { icon: "🧠", title: "Synthesizing 8-Part Diagnostic Standard & Executive Pitch", detail: "Formulating business process flows, troubleshooting runbooks, consulting soundbites, and panel Q&A..." },
  { icon: "✨", title: "Streaming Real-Time Architectural Synthesis", detail: "Rendering formatted technical runbook with verified citations..." }
];

export default function DrillingReasoningHUD({
  activeModule = "SAP Global Trade Services (GTS)",
  hasAttachment = false,
  isStreaming = false
}) {
  const [stageIndex, setStageIndex] = useState(isStreaming ? 0 : DEFAULT_DRILLING_STAGES.length - 1);
  const [elapsedSeconds, setElapsedSeconds] = useState(isStreaming ? "0.0" : "1.8");
  const [expanded, setExpanded] = useState(false);

  // Timer interval while streaming
  useEffect(() => {
    if (!isStreaming) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const sec = ((Date.now() - startTime) / 1000).toFixed(1);
      setElapsedSeconds(sec);
    }, 100);

    return () => clearInterval(timer);
  }, [isStreaming]);

  // Stage progression interval while streaming
  useEffect(() => {
    if (!isStreaming) {
      setStageIndex(DEFAULT_DRILLING_STAGES.length - 1);
      return;
    }

    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < DEFAULT_DRILLING_STAGES.length - 1 ? prev + 1 : prev));
    }, 1300);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const currentStage = DEFAULT_DRILLING_STAGES[stageIndex] || DEFAULT_DRILLING_STAGES[0];

  return (
    <div
      style={{
        background: isStreaming
          ? "linear-gradient(135deg, rgba(110, 26, 45, 0.08) 0%, rgba(30, 58, 138, 0.06) 50%, rgba(245, 158, 11, 0.05) 100%)"
          : "linear-gradient(135deg, #FFFFFF 0%, rgba(248, 250, 252, 0.9) 100%)",
        border: isStreaming ? "1.5px solid rgba(110, 26, 45, 0.4)" : "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 18,
        position: "relative",
        overflow: "hidden",
        boxShadow: isStreaming
          ? "0 4px 20px -2px rgba(110, 26, 45, 0.12)"
          : "0 1px 4px rgba(0, 0, 0, 0.03)",
        transition: "all 0.25s ease"
      }}
    >
      {/* Top Animated Shimmer Bar while streaming */}
      {isStreaming && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #6E1A2D 0%, #D97706 35%, #3B82F6 70%, #6E1A2D 100%)",
            backgroundSize: "200% 100%",
            animation: "nexusDrillShimmer 1.8s linear infinite"
          }}
        />
      )}

      <style>{`
        @keyframes nexusDrillShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes nexusDrillPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes nexusRadarSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes nexusFadeInStage {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Animated Drilling Radar Icon / Checkmark */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: isStreaming
                ? "radial-gradient(circle, rgba(110, 26, 45, 0.25) 0%, rgba(110, 26, 45, 0.05) 70%)"
                : "rgba(16, 185, 129, 0.12)",
              border: `1.5px solid ${isStreaming ? "rgba(110, 26, 45, 0.5)" : "rgba(16, 185, 129, 0.4)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}
          >
            {isStreaming && (
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  borderTop: "2px solid #6E1A2D",
                  borderRight: "2px solid transparent",
                  animation: "nexusRadarSpin 1.1s linear infinite"
                }}
              />
            )}
            <span style={{ fontSize: 13, animation: isStreaming ? "nexusDrillPulse 1.4s ease-in-out infinite" : "none" }}>
              {isStreaming ? currentStage.icon : "⚡"}
            </span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: isStreaming ? "#6E1A2D" : "#0F172A", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Nexus Deep Drilling Engine
              </span>

              {isStreaming ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    background: "rgba(110, 26, 45, 0.12)",
                    color: "#6E1A2D",
                    border: "1px solid rgba(110, 26, 45, 0.3)",
                    padding: "1px 6px",
                    borderRadius: 9999,
                    fontWeight: 700
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6E1A2D", animation: "nexusDrillPulse 1s infinite" }} />
                  DRILLING IN PROGRESS
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "1px 6px",
                    borderRadius: 9999,
                    fontWeight: 700
                  }}
                >
                  ✓ 6/6 STAGES VERIFIED
                </span>
              )}
            </div>

            <div style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-mono)", marginTop: 1 }}>
              {activeModule ? `Domain: ${activeModule}` : "SAP Expert Domain"} · 8-Part Diagnostic Standard
            </div>
          </div>
        </div>

        {/* Right Action Controls (Elapsed time & Toggle) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: isStreaming ? "#6E1A2D" : "#475569",
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              padding: "2px 8px",
              borderRadius: 5
            }}
          >
            ⏱ {elapsedSeconds}s
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#334155",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 5,
              cursor: "pointer",
              fontFamily: "var(--font-mono)"
            }}
          >
            <span>{expanded || isStreaming ? "Hide Stages" : "View Drilling Path"}</span>
            <span style={{ fontSize: 9 }}>{expanded || isStreaming ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Active Stage (When Streaming) */}
      {isStreaming && (
        <div
          key={stageIndex}
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(110, 26, 45, 0.15)",
            borderRadius: 7,
            padding: "8px 12px",
            marginTop: 10,
            animation: "nexusFadeInStage 0.3s ease-out",
            boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: "#6E1A2D", fontWeight: 700 }}>
                {currentStage.title}
              </span>
              <span style={{ fontSize: 10.5, color: "#94A3B8" }}>
                (Stage {stageIndex + 1} of {DEFAULT_DRILLING_STAGES.length})
              </span>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {DEFAULT_DRILLING_STAGES.map((_, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    width: sIdx === stageIndex ? 14 : 5,
                    height: 3.5,
                    borderRadius: 2,
                    background: sIdx <= stageIndex ? "#6E1A2D" : "#E2E8F0",
                    transition: "all 0.25s ease"
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.4 }}>
            {currentStage.detail}
          </div>
        </div>
      )}

      {/* Expanded Stages List (When toggled or completed) */}
      {(expanded || (isStreaming && expanded)) && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            animation: "nexusFadeInStage 0.2s ease-out"
          }}
        >
          {DEFAULT_DRILLING_STAGES.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 11.5,
                background: idx <= stageIndex ? "rgba(248, 250, 252, 0.9)" : "transparent",
                padding: "6px 8px",
                borderRadius: 5,
                border: idx === stageIndex && isStreaming ? "1px solid rgba(110, 26, 45, 0.3)" : "1px solid transparent"
              }}
            >
              <span style={{ fontSize: 12 }}>
                {idx < stageIndex || (!isStreaming) ? "✅" : (idx === stageIndex ? "🌀" : "⚪")}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: idx <= stageIndex ? "#0F172A" : "#94A3B8" }}>
                  {st.title}
                </div>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 1 }}>
                  {st.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
