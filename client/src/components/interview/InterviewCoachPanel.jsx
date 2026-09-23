import React from "react";

export default function InterviewCoachPanel({
  coachState = {},
  weakAreas = [],
  onRemoveWeakArea,
  onPracticeWeakArea,
  onCollapse
}) {
  const {
    topic = "SAP PP & EWM Staging Integration",
    mode = "Interview Mode (Spoken Practice)",
    confidenceScore = 88,
    accuracyScore = 92,
    completenessScore = 90,
    starScore = 86,
    missingPoints = [
      "Explicitly mention transaction /SCWM/STAGE for staging trigger",
      "Mention FIFO queue mechanism in SMQ2"
    ],
    suggestedImprovements = [
      "Deliver the 30-second answer first before detailing SPRO customizing.",
      "Quantify your production support impact (e.g. 'reduced P1 downtime by 40%')."
    ],
    followUpPredictions = [
      "What is the exact difference between TECO and CLSD status in CO02?",
      "How does EWM determine the staging storage bin if multiple PSAs exist?"
    ]
  } = coachState;

  const scoreColor = (score) => {
    if (score >= 85) return "#10B981";
    if (score >= 65) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-subtle)",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12 }}>🎓</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Interview Coach</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Live Spoken & Technical Telemetry</div>
          </div>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Collapse Panel"
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Body Scroll */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Active Focus Card */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 700, marginBottom: 4 }}>
            Active Focus
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
            {topic}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Mode: {mode}
          </div>
        </div>

        {/* Dimension Scorecards */}
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8 }}>
            Performance Rubric
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Technical Accuracy</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(accuracyScore), fontFamily: "var(--font-mono)" }}>
                {accuracyScore}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Spoken Confidence</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(confidenceScore), fontFamily: "var(--font-mono)" }}>
                {confidenceScore}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Completeness</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(completenessScore), fontFamily: "var(--font-mono)" }}>
                {completenessScore}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>STAR Structure</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(starScore), fontFamily: "var(--font-mono)" }}>
                {starScore}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Key Points Checklist */}
        {missingPoints && missingPoints.length > 0 && (
          <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#D97706" }}>Points to Mention Next Turn</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "var(--text-body)", lineHeight: 1.5 }}>
              {missingPoints.map((mp, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{mp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Spoken Coaching Recommendations */}
        {suggestedImprovements && suggestedImprovements.length > 0 && (
          <div style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>💡</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#3B82F6" }}>Spoken Delivery Tips</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "var(--text-body)", lineHeight: 1.5 }}>
              {suggestedImprovements.map((tip, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Anticipated Follow-Ups */}
        {followUpPredictions && followUpPredictions.length > 0 && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8 }}>
              Interviewer May Ask Next
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {followUpPredictions.map((f, i) => (
                <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px", fontSize: 11.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  ❓ {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Areas Watchlist */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              Weak Areas ({weakAreas.length})
            </span>
          </div>
          {weakAreas.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontStyle: "italic", background: "var(--bg-surface)", padding: "10px", borderRadius: 6, textAlign: "center" }}>
              No weak areas logged. Click "Add to Weak Areas" on difficult questions to bookmark them.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {weakAreas.map((w, i) => (
                <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{w.question}</div>
                    <div style={{ fontSize: 10, color: "#EF4444", fontFamily: "var(--font-mono)" }}>{w.category || "Needs Revision"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {onPracticeWeakArea && (
                      <button
                        onClick={() => onPracticeWeakArea(w)}
                        title="Practice Now"
                        style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.3)", color: "var(--orange)", fontSize: 10, padding: "2px 6px", borderRadius: 4, cursor: "pointer", fontWeight: 700 }}
                      >
                        Drill
                      </button>
                    )}
                    {onRemoveWeakArea && (
                      <button
                        onClick={() => onRemoveWeakArea(w.id || w.question)}
                        title="Remove"
                        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
