import React, { useState, useEffect, useMemo } from "react";

export default function DrillingReasoningHUD({
  activeModule = "SAP Global Trade Services (GTS)",
  hasAttachment = false,
  isStreaming = false,
  queryTitle = ""
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  // Dynamic contextual stages matching Claude's natural phrasing
  const stages = useMemo(() => {
    const isGts = /gts|trade|customs/i.test(activeModule || "") || /gts|customs/i.test(queryTitle || "");
    const isEwm = /ewm|warehouse|staging|pmr/i.test(activeModule || "") || /ewm|warehouse|pmr/i.test(queryTitle || "");
    const isSd = /sd|sales|pricing|order/i.test(activeModule || "");
    const isSheet = hasAttachment || /spreadsheet|excel|sheet/i.test(queryTitle || "");

    if (isSheet) {
      return [
        "Analyzing attached spreadsheet records & cell data",
        "Validating document columns, IDs & schemas",
        "Correlating transactional records with SAP tables",
        "Synthesizing diagnostic insights & data reconciliation"
      ];
    }
    if (isGts) {
      return [
        "Digging into official SAP GTS documentation",
        "Scanning customs declarations & compliance rules",
        "Validating partner profiles, document types & determination",
        "Structuring technical runbook & verified citations"
      ];
    }
    if (isEwm) {
      return [
        "Digging into official SAP EWM documentation",
        "Scanning warehouse order queues, PMRs & staging rules",
        "Validating storage types, bin controls & qRFC flows",
        "Structuring diagnostic runbook & verified citations"
      ];
    }
    if (isSd) {
      return [
        "Digging into official SAP SD documentation",
        "Evaluating pricing conditions, copy controls & sales documents",
        "Correlating partner determination & billing schedules",
        "Structuring technical runbook & verified citations"
      ];
    }
    return [
      "Digging into official SAP documentation",
      "Scanning T-Codes, master data & determination rules",
      "Correlating document flows & system customizing",
      "Structuring technical runbook & verified citations"
    ];
  }, [activeModule, hasAttachment, queryTitle]);

  // Real-time wall-clock timer (1-second precision)
  useEffect(() => {
    if (!isStreaming) return;
    const start = Date.now();
    setElapsedSeconds(1);

    const timer = setInterval(() => {
      const secs = Math.max(1, Math.floor((Date.now() - start) / 1000));
      setElapsedSeconds(secs);
    }, 1000);

    return () => clearInterval(timer);
  }, [isStreaming]);

  // Contextual stage cycle while streaming
  useEffect(() => {
    if (!isStreaming) {
      setStageIndex(stages.length - 1);
      return;
    }
    setStageIndex(0);

    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2400);

    return () => clearInterval(stageInterval);
  }, [isStreaming, stages]);

  const currentStageText = stages[stageIndex] || stages[0];

  return (
    <div style={{ margin: "10px 0 16px", userSelect: "none" }}>
      <style>{`
        @keyframes claudeDot1 {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes claudeDot2 {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes claudeFadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Minimalist Claude Thinking Line */}
      <div
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: "4px 8px 4px 2px",
          borderRadius: 6,
          transition: "background 0.15s ease",
          background: expanded ? "rgba(0,0,0,0.03)" : "transparent"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = "transparent"; }}
        title="Click to view reasoning breakdown"
      >
        {/* Animated Terracotta Thinking Dots (Claude style) */}
        {isStreaming ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3.5, padding: "0 2px" }}>
            <span
              style={{
                width: 4.5,
                height: 4.5,
                borderRadius: "50%",
                background: "#CC5500",
                animation: "claudeDot1 1.2s infinite ease-in-out"
              }}
            />
            <span
              style={{
                width: 4.5,
                height: 4.5,
                borderRadius: "50%",
                background: "#CC5500",
                animation: "claudeDot2 1.2s infinite ease-in-out 0.35s"
              }}
            />
          </div>
        ) : (
          <span style={{ fontSize: 13, color: "#8E8E87" }}>⚡</span>
        )}

        {/* Minimalist Label */}
        <span
          style={{
            fontSize: 13.5,
            color: isStreaming ? "#5A5A54" : "#73736C",
            fontWeight: 450,
            fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
            letterSpacing: "-0.01em"
          }}
        >
          {isStreaming ? currentStageText : `Thought for ${elapsedSeconds}s`}
        </span>

        {/* Real-time Second Indicator while Streaming */}
        {isStreaming && (
          <span
            style={{
              fontSize: 12,
              color: "#8E8E87",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 500
            }}
          >
            ({elapsedSeconds}s)
          </span>
        )}

        {/* Subtle Chevron */}
        <span
          style={{
            fontSize: 11,
            color: "#999990",
            display: "inline-block",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
            marginLeft: 1
          }}
        >
          ›
        </span>
      </div>

      {/* Collapsible Clean Reasoning Details Card */}
      {expanded && (
        <div
          style={{
            marginTop: 8,
            padding: "12px 16px",
            background: "#FAFAF7",
            border: "1px solid #E6E6DF",
            borderRadius: 8,
            maxWidth: 680,
            animation: "claudeFadeIn 0.18s ease-out",
            fontSize: 12.5,
            color: "#4A4A45",
            lineHeight: 1.6
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, borderBottom: "1px solid #EDEDE6", paddingBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 11.5, color: "#2B2B27", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-mono, monospace)" }}>
              Reasoning & Knowledge Verification
            </span>
            <span style={{ fontSize: 11, color: "#8E8E87", fontFamily: "var(--font-mono, monospace)" }}>
              {isStreaming ? `Elapsed: ${elapsedSeconds}s` : `Completed in ${elapsedSeconds}s`}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stages.map((st, idx) => {
              const isPast = idx < stageIndex || !isStreaming;
              const isCurrent = idx === stageIndex && isStreaming;

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: isCurrent ? "#1F1F1E" : (isPast ? "#4A4A45" : "#999990"),
                    fontWeight: isCurrent ? 600 : 400
                  }}
                >
                  <span style={{ fontSize: 11 }}>
                    {isPast ? "✓" : (isCurrent ? "→" : "○")}
                  </span>
                  <span>{st}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, paddingTop: 6, borderTop: "1px solid #EDEDE6", fontSize: 11, color: "#8E8E87" }}>
            Domain: {activeModule || "SAP Core"} · Evidence Grounding Active
          </div>
        </div>
      )}
    </div>
  );
}
