import React, { useState } from "react";

export default function ResumeContextPanel({
  isOpen,
  onClose,
  profile = {},
  onSaveProfile
}) {
  const [formData, setFormData] = useState({
    targetRole: profile.targetRole || "Senior SAP PP/EWM Consultant",
    yearsExp: profile.yearsExp || "6+",
    currentRole: profile.currentRole || "SAP Functional Specialist",
    modules: profile.modules || "SAP PP, EWM, MM, Integration (qRFC/bgRFC)",
    keyProjects: profile.keyProjects || "S/4HANA Greenfield Implementation for Manufacturing Client; High-Rack EWM Warehouse Automation & PMR Integration.",
    resumeSummary: profile.resumeSummary || "Hands-on SAP Consultant with 6+ years specializing in discrete manufacturing, shop floor control, EWM production supply staging, and RFC queue triage."
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSaveProfile) onSaveProfile(formData);
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
          maxWidth: 680,
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
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
              Target Role & Resume Context
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Nexus personalizes interview questions, follow-ups, and self-introduction models using your configured role and project experience.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Target Role at Infosys
              </label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Total Years Experience
              </label>
              <input
                type="text"
                value={formData.yearsExp}
                onChange={e => setFormData({ ...formData, yearsExp: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Core SAP Modules & Integrations
            </label>
            <input
              type="text"
              value={formData.modules}
              onChange={e => setFormData({ ...formData, modules: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Key Project Highlights (for "Describe your project" questions)
            </label>
            <textarea
              rows={3}
              value={formData.keyProjects}
              onChange={e => setFormData({ ...formData, keyProjects: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Resume Summary / Experience Notes
            </label>
            <textarea
              rows={3}
              value={formData.resumeSummary}
              onChange={e => setFormData({ ...formData, resumeSummary: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12, resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
