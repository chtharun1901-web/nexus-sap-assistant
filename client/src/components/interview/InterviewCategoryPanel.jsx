import React, { useState } from "react";
import { INTERVIEW_CATEGORIES } from "./interviewData.js";

export default function InterviewCategoryPanel({
  selectedCategory,
  onSelectCategory,
  categoryStats = {},
  weakCount = 0
}) {
  const [search, setSearch] = useState("");

  const filteredCategories = INTERVIEW_CATEGORIES.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-subtle)",
        overflow: "hidden"
      }}
    >
      {/* Search & Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Preparation Modules
          </span>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--orange)", background: "rgba(255,85,0,0.1)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
            {INTERVIEW_CATEGORIES.length} Domains
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Filter domains (e.g. PP, EWM, STAR)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 10px 7px 28px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
          <span style={{ position: "absolute", left: 9, top: 7.5, fontSize: 12, color: "var(--text-muted)" }}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 8, top: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredCategories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const stats = categoryStats[cat.id] || { completed: 0, total: cat.totalQuestions || 20 };
            const progress = stats.total > 0 ? Math.min(Math.round((stats.completed / stats.total) * 100), 100) : 0;
            const isWeakCategory = cat.id === "weak-areas";
            const displayCount = isWeakCategory ? weakCount : stats.total;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: isSelected ? "rgba(255,85,0,0.12)" : "transparent",
                  border: isSelected ? "1px solid rgba(255,85,0,0.35)" : "1px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  position: "relative"
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = "var(--bg-surface)";
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: "0 2px 2px 0",
                      background: "var(--orange)"
                    }}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? "var(--orange)" : "var(--text-primary)"
                      }}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: "var(--font-mono)",
                      color: isWeakCategory && weakCount > 0 ? "#EF4444" : "var(--text-muted)",
                      background: isWeakCategory && weakCount > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                      padding: "1px 6px",
                      borderRadius: 9999,
                      fontWeight: 600
                    }}
                  >
                    {displayCount} {isWeakCategory ? "Items" : "Qs"}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.35, marginBottom: 6, paddingLeft: 24 }}>
                  {cat.description}
                </div>

                {/* Mini Progress Bar */}
                {!isWeakCategory && (
                  <div style={{ width: "100%", paddingLeft: 24, boxSizing: "border-box" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9.5, color: "var(--text-muted)", marginBottom: 2 }}>
                      <span>Mastery: {progress}%</span>
                      <span>{stats.completed}/{stats.total}</span>
                    </div>
                    <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        style={{
                          width: progress + "%",
                          height: "100%",
                          background: progress >= 80 ? "#10B981" : progress >= 40 ? "#F59E0B" : "var(--orange)",
                          borderRadius: 2,
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--text-muted)" }}>
          <span>💡</span>
          <span>Click any category to practice targeted interview questions.</span>
        </div>
      </div>
    </div>
  );
}
