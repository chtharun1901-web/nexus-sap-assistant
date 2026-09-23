import React, { useState, useEffect } from "react";

const DEFAULT_DRILLING_STAGES = [
  { icon: "🌀", title: "Drilling into SAP Domain Knowledge Base", detail: "Querying indexed SAP Help Portal, OSS Notes catalog, and standard architectural flows..." },
  { icon: "🔍", title: "Scanning T-Codes, Master Data & Determination Rules", detail: "Evaluating core transaction codes, condition techniques, tables (VBAK, VBAP, /SAPSLL/*), and CDS views..." },
  { icon: "📊", title: "Correlating Document Flows & Attached Data Records", detail: "Validating spreadsheet records, partner profiles, organizational assignments, and field lengths..." },
  { icon: "⚙️", title: "Cross-Referencing SPRO Customizing Paths & System Rules", detail: "Structuring configuration runbooks, S/4HANA release differences, and copy controls..." },
  { icon: "🧠", title: "Synthesizing 8-Part Diagnostic Standard & Executive Pitch", detail: "Formulating business process flows, troubleshooting runbooks, consulting soundbites, and panel Q&A..." },
  { icon: "✨", title: "Streaming Real-Time Architectural Synthesis", detail: "Rendering formatted technical runbook with verified citations..." }
];

export default function DrillingReasoningHUD({ activeModule = "SAP Global Trade Services", hasAttachment = false, isStreaming = true }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer interval
  useEffect(() => {
    if (!isStreaming) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const sec = ((Date.now() - startTime) / 1000).toFixed(1);
      setElapsedSeconds(sec);
    }, 100);

    return () => clearInterval(timer);
  }, [isStreaming]);

  // Stage progression interval
  useEffect(() => {
    if (!isStreaming) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < DEFAULT_DRILLING_STAGES.length - 1 ? prev + 1 : prev));
    }, 1400);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const currentStage = DEFAULT_DRILLING_STAGES[stageIndex] || DEFAULT_DRILLING_STAGES[0];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(110, 26, 45, 0.06) 0%, rgba(30, 58, 138, 0.05) 50%, rgba(245, 158, 11, 0.04) 100%)",
        border: "1px solid rgba(110, 26, 45, 0.25)",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px -2px rgba(110, 26, 45, 0.08)",
        backdropFilter: "blur(8px)"
      }}
    >
      {/* Top Animated Shimmer Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, #6E1A2D 0%, #D97706 35%, #3B82F6 70%, #6E1A2D 100%)",
          backgroundSize: "200% 100%",
          animation: "nexusDrillShimmer 2s linear infinite"
        }}
      />

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
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Animated Drilling Radar Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(110, 26, 45, 0.2) 0%, rgba(110, 26, 45, 0.05) 70%)",
              border: "1.5px solid rgba(110, 26, 45, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                borderTop: "2px solid #6E1A2D",
                borderRight: "2px solid transparent",
                animation: "nexusRadarSpin 1.2s linear infinite"
              }}
            />
            <span style={{ fontSize: 14, animation: "nexusDrillPulse 1.5s ease-in-out infinite" }}>
              {currentStage.icon}
            </span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#6E1A2D", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Nexus Deep Drilling Engine
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "1px 6px",
                  borderRadius: 9999,
                  fontWeight: 700
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "nexusDrillPulse 1s infinite" }} />
                ACTIVE REASONING
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
              {activeModule ? `Domain: ${activeModule}` : "Auto-Detecting Module"} · Standard: 8-Part Deep Matrix
            </div>
          </div>
        </div>

        {/* Live Elapsed Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#6E1A2D",
              background: "#FFFFFF",
              border: "1px solid rgba(110, 26, 45, 0.2)",
              padding: "3px 10px",
              borderRadius: 6,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          >
            ⏱ {elapsedSeconds}s
          </div>
        </div>
      </div>

      {/* Active Stage Animated Banner */}
      <div
        key={stageIndex}
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: 8,
          padding: "10px 14px",
          marginTop: 6,
          animation: "nexusFadeInStage 0.35s ease-out",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#6E1A2D", fontWeight: 700 }}>
              {currentStage.title}
            </span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              (Step {stageIndex + 1} of {DEFAULT_DRILLING_STAGES.length})
            </span>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {DEFAULT_DRILLING_STAGES.map((_, sIdx) => (
              <div
                key={sIdx}
                style={{
                  width: sIdx === stageIndex ? 16 : 6,
                  height: 4,
                  borderRadius: 2,
                  background: sIdx <= stageIndex ? "#6E1A2D" : "#E2E8F0",
                  transition: "all 0.3s ease"
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.45 }}>
          {currentStage.detail}
        </div>
      </div>
    </div>
  );
}
