import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function GenAiPreferencesModal({ isOpen, onClose, onPreferencesUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [responseStyle, setResponseStyle] = useState("detailed");
  const [technicalDepth, setTechnicalDepth] = useState("functional");
  const [defaultModule, setDefaultModule] = useState("ALL");
  const [defaultEdition, setDefaultEdition] = useState("ALL");
  const [languageTone, setLanguageTone] = useState("professional");
  const [autoSave, setAutoSave] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [preferredExportFormat, setPreferredExportFormat] = useState("word");
  const [customInstructions, setCustomInstructions] = useState("");

  const MODULES = ["ALL", "SD", "MM", "PP", "EWM", "GTS", "FI/CO", "AI"];
  const EDITIONS = ["ALL", "Cloud Public", "Cloud Private", "On-Premise"];

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    api.getPreferences()
      .then((res) => {
        if (res.preferences) {
          const p = res.preferences;
          setResponseStyle(p.responseStyle || "detailed");
          setTechnicalDepth(p.technicalDepth || "functional");
          setDefaultModule(p.defaultModule || "ALL");
          setDefaultEdition(p.defaultEdition || "ALL");
          setLanguageTone(p.languageTone || "professional");
          setAutoSave(p.autoSave !== undefined ? p.autoSave : true);
          setDailyDigest(p.dailyDigest !== undefined ? p.dailyDigest : false);
          setPreferredExportFormat(p.preferredExportFormat || "word");
          setCustomInstructions(p.customInstructions || "");
        }
      })
      .catch((err) => setError(err.message || "Failed to load preferences"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        responseStyle,
        technicalDepth,
        defaultModule,
        defaultEdition,
        languageTone,
        autoSave,
        dailyDigest,
        preferredExportFormat,
        customInstructions
      };
      const res = await api.updatePreferences(payload);
      setSavedSuccess(true);
      if (onPreferencesUpdated) onPreferencesUpdated(res.preferences);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          color: "#c9d1d9",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #30363d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0d1117"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚙️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f6fc" }}>
                AI Personalization & System Preferences
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b949e" }}>
                Nexus shapes every AI response, prompt, and retrieval based on your tailored configuration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b949e",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(248,81,73,0.15)", border: "1px solid #f85149", borderRadius: 6, color: "#ff7b72", fontSize: 13 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8b949e" }}>Loading preferences...</div>
          ) : (
            <>
              {/* Row 1: Response Style & Depth */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 6, textTransform: "uppercase" }}>
                    AI Response Style
                  </label>
                  <select
                    value={responseStyle}
                    onChange={(e) => setResponseStyle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      color: "#f0f6fc",
                      fontSize: 14
                    }}
                  >
                    <option value="detailed">Thorough & Step-by-Step (Default)</option>
                    <option value="concise">Concise & Dense (Bullet Points)</option>
                    <option value="executive">Executive Summary (Decision Lead)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 6, textTransform: "uppercase" }}>
                    Technical Depth
                  </label>
                  <select
                    value={technicalDepth}
                    onChange={(e) => setTechnicalDepth(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      color: "#f0f6fc",
                      fontSize: 14
                    }}
                  >
                    <option value="functional">Functional Consultant (Business & SPRO)</option>
                    <option value="developer">ABAP / BTP Developer (Code & CDS)</option>
                    <option value="architect">Enterprise Architect (Topology & RFC)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Default Module & Edition */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 8, textTransform: "uppercase" }}>
                  Primary SAP Module Focus
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {MODULES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDefaultModule(m)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid",
                        background: defaultModule === m ? "#1f6feb" : "#21262d",
                        borderColor: defaultModule === m ? "#388bfd" : "#30363d",
                        color: defaultModule === m ? "#fff" : "#c9d1d9",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 8, textTransform: "uppercase" }}>
                  Primary Landscape Edition
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {EDITIONS.map((ed) => (
                    <button
                      key={ed}
                      type="button"
                      onClick={() => setDefaultEdition(ed)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid",
                        background: defaultEdition === ed ? "#238636" : "#21262d",
                        borderColor: defaultEdition === ed ? "#2ea043" : "#30363d",
                        color: defaultEdition === ed ? "#fff" : "#c9d1d9",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {ed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Custom Instructions */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#8b949e", textTransform: "uppercase" }}>
                    Custom Directives & Tone
                  </label>
                  <span style={{ fontSize: 11, color: "#6e7681" }}>Injected into every query prompt</span>
                </div>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always include relevant SAP Notes, T-codes, and highlight if a feature requires SAP BTP integration..."
                  rows={3}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#f0f6fc",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Row 4: Switches & Export Format */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#0d1117", padding: 14, borderRadius: 8, border: "1px solid #21262d" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f6fc" }}>Auto-Save AI Responses</div>
                    <div style={{ fontSize: 11, color: "#8b949e" }}>Automatically index answers in history</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#1f6feb" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f6fc" }}>Weekly Intelligence Digest</div>
                    <div style={{ fontSize: 11, color: "#8b949e" }}>Synthesize new release notes weekly</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={(e) => setDailyDigest(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#1f6feb" }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #30363d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0d1117"
          }}
        >
          <div style={{ fontSize: 12, color: savedSuccess ? "#3fb950" : "#8b949e" }}>
            {savedSuccess ? "✓ Preferences saved and active!" : "Saved automatically to your enterprise profile."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "#21262d",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#c9d1d9",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 20px",
                background: savedSuccess ? "#238636" : "#1f6feb",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(31,111,235,0.3)"
              }}
            >
              {saving ? "Saving..." : savedSuccess ? "Saved!" : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
