import React, { useState } from "react";

export default function InterviewSettings({
  isOpen,
  onClose,
  settings = {},
  onSaveSettings,
  onResetProgress
}) {
  const [local, setLocal] = useState({
    answerLength: settings.answerLength || "Standard",
    difficulty: settings.difficulty || "Advanced",
    feedbackLevel: settings.feedbackLevel || "Detailed Coaching",
    showModelAnswer: settings.showModelAnswer ?? true,
    englishCorrection: settings.englishCorrection || "Gentle",
    ...settings
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSaveSettings) onSaveSettings(local);
    onClose();
  };

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
          maxWidth: 580,
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
            <span style={{ fontSize: 18 }}>⚙️</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
              Interview Prep Settings
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Default Answer Model Length
            </label>
            <select
              value={local.answerLength}
              onChange={e => setLocal({ ...local, answerLength: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
            >
              <option>30-Second Quick Spoken</option>
              <option>Standard (1-2 Minutes with Examples)</option>
              <option>Comprehensive Technical Deep-Dive</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Technical Coaching Depth
            </label>
            <select
              value={local.difficulty}
              onChange={e => setLocal({ ...local, difficulty: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
            >
              <option>Beginner (1-2 Years)</option>
              <option>Intermediate (3-5 Years)</option>
              <option>Advanced (5-8 Years Lead Consultant)</option>
              <option>Enterprise Architect (8+ Years)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Feedback Style
            </label>
            <select
              value={local.feedbackLevel}
              onChange={e => setLocal({ ...local, feedbackLevel: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
            >
              <option>Detailed Coaching with Spoken Improvement</option>
              <option>Quick Feedback (Scores Only)</option>
              <option>Silent Practice (Model Answer Only)</option>
            </select>
          </div>

          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => {
                if (confirm("Reset all interview preparation progress and weak areas?")) {
                  if (onResetProgress) onResetProgress();
                  onClose();
                }
              }}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "6px 12px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
            >
              🗑️ Reset Practice History & Progress
            </button>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
