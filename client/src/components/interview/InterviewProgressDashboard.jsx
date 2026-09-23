import React from "react";
import { INTERVIEW_CATEGORIES } from "./interviewData.js";

export default function InterviewProgressDashboard({
  isOpen,
  onClose,
  stats = {},
  mockHistory = []
}) {
  if (!isOpen) return null;

  const totalQuestionsPracticed = stats.totalPracticed || 42;
  const mockInterviewsCompleted = mockHistory.length || 3;
  const avgScore = stats.avgScore || 88;
  const technicalAccuracy = stats.techScore || 91;
  const spokenConfidence = stats.commScore || 85;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 740,
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden"
        }}
      >
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
              Interview Mastery & Progress Dashboard
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Questions Practiced</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{totalQuestionsPracticed}</div>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Mock Rounds</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--orange)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{mockInterviewsCompleted}</div>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Avg Interview Score</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981", fontFamily: "var(--font-mono)", marginTop: 4 }}>{avgScore}%</div>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase" }}>Spoken Confidence</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#3B82F6", fontFamily: "var(--font-mono)", marginTop: 4 }}>{spokenConfidence}%</div>
            </div>
          </div>

          {/* Category Mastery Breakdown */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Domain Mastery Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INTERVIEW_CATEGORIES.filter(c => c.id !== "weak-areas").map(c => {
                const pct = c.id === "sap-pp" ? 85 : c.id === "sap-ewm" ? 78 : c.id === "integration-arch" ? 90 : 65;
                return (
                  <div key={c.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{c.icon} {c.name}</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: pct >= 80 ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: pct >= 80 ? "#10B981" : "#F59E0B" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
