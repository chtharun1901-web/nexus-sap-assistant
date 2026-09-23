import React, { useState } from "react";
import { DEFAULT_7DAY_PLAN } from "./interviewData.js";

export default function PreparationPlan({
  isOpen,
  onClose,
  plan = DEFAULT_7DAY_PLAN,
  onToggleDay
}) {
  const [days, setDays] = useState(plan);

  if (!isOpen) return null;

  const toggle = (idx) => {
    const updated = days.map((d, i) => i === idx ? { ...d, completed: !d.completed } : d);
    setDays(updated);
    if (onToggleDay) onToggleDay(updated);
  };

  const completedCount = days.filter(d => d.completed).length;
  const pct = Math.round((completedCount / days.length) * 100);

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
          maxWidth: 720,
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
            <span style={{ fontSize: 18 }}>📅</span>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                Infosys 7-Day Interview Preparation Roadmap
              </span>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Roadmap Progress: {completedCount}/{days.length} Days Mastered ({pct}%)
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                background: d.completed ? "rgba(16,185,129,0.05)" : "var(--bg-surface)",
                border: "1px solid " + (d.completed ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"),
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12
              }}
            >
              <input
                type="checkbox"
                checked={!!d.completed}
                onChange={() => toggle(i)}
                style={{ marginTop: 3, accentColor: "#10B981", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: d.completed ? "#10B981" : "var(--text-primary)" }}>
                    Day {d.day}: {d.title}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: d.completed ? "#10B981" : "var(--text-muted)" }}>
                    {d.completed ? "COMPLETED" : "PENDING"}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>
                  {d.goal}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {d.topics.map((t, ti) => (
                    <span key={ti} style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", padding: "1px 6px", borderRadius: 4, color: "var(--text-body)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
