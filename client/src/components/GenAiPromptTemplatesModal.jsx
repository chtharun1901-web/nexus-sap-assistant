import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function GenAiPromptTemplatesModal({ isOpen, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New template state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Troubleshooting");
  const [newTemplate, setNewTemplate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const CATEGORIES = ["ALL", "Troubleshooting", "Configuration", "Comparison", "Release", "Custom"];

  const loadTemplates = () => {
    setLoading(true);
    api.getPromptTemplates()
      .then((res) => {
        setTemplates(res.templates || []);
      })
      .catch((err) => setError(err.message || "Failed to load templates"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setShowCreateForm(false);
    }
  }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTemplate.trim()) return;
    setSaving(true);
    try {
      // Extract [VAR] variables
      const matches = newTemplate.match(/\[([A-Z0-9_]+)\]/g) || [];
      const variables = Array.from(new Set(matches.map((m) => m.slice(1, -1))));

      await api.createPromptTemplate({
        title: newTitle,
        category: newCategory,
        promptTemplate: newTemplate,
        variables,
        description: newDescription
      });

      setNewTitle("");
      setNewTemplate("");
      setNewDescription("");
      setShowCreateForm(false);
      loadTemplates();
    } catch (err) {
      alert("Failed to save template: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this custom template?")) return;
    try {
      await api.deletePromptTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Failed to delete template: " + err.message);
    }
  };

  if (!isOpen) return null;

  const filtered = templates.filter((t) => {
    const matchesCat = selectedCategory === "ALL" || (t.category || "").toLowerCase() === selectedCategory.toLowerCase();
    const s = search.toLowerCase();
    const matchesSearch = !s || (t.title || "").toLowerCase().includes(s) || (t.description || "").toLowerCase().includes(s);
    return matchesCat && matchesSearch;
  });

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
          maxWidth: 860,
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
            <span style={{ fontSize: 22 }}>💡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f6fc" }}>
                SAP Prompt Templates Library
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b949e" }}>
                Curated prompt blueprints designed for precision troubleshooting, customizing, and architectural evaluation.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                background: showCreateForm ? "#21262d" : "#238636",
                border: "1px solid",
                borderColor: showCreateForm ? "#30363d" : "#2ea043",
                color: "#fff",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {showCreateForm ? "Cancel" : "＋ New Template"}
            </button>
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
        </div>

        {/* Create Form Drawer */}
        {showCreateForm && (
          <form onSubmit={handleCreate} style={{ padding: 20, background: "#0d1117", borderBottom: "1px solid #30363d", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Template Title (e.g. Inbound Delivery Triage)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                style={{ padding: "8px 12px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: 13 }}
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ padding: "8px 12px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: 13 }}
              >
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="Configuration">Configuration</option>
                <option value="Comparison">Comparison</option>
                <option value="Release">Release</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <textarea
              placeholder="Prompt text... Use [VARIABLE_NAME] for placeholders (e.g. Please analyze queue [QUEUE_NAME] in transaction [TCODE])."
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              rows={3}
              required
              style={{ padding: "8px 12px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: 13, resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Brief description of the use case..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{ flex: 1, marginRight: 12, padding: "6px 12px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: 12 }}
              />
              <button
                type="submit"
                disabled={saving}
                style={{ padding: "6px 16px", background: "#1f6feb", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #21262d", background: "#0d1117", display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by keyword, transaction, or purpose..."
            style={{
              flex: 1,
              padding: "8px 14px",
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#f0f6fc",
              fontSize: 13
            }}
          />
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid",
                  background: selectedCategory === c ? "#1f6feb" : "#21262d",
                  borderColor: selectedCategory === c ? "#388bfd" : "#30363d",
                  color: selectedCategory === c ? "#fff" : "#8b949e"
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {error && <div style={{ color: "#ff7b72", gridColumn: "1 / -1" }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8b949e", gridColumn: "1 / -1" }}>Loading prompt templates...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#8b949e", gridColumn: "1 / -1" }}>
              No templates match your search criteria.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                  transition: "all 0.15s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(56,139,253,0.1)",
                        color: "#58a6ff",
                        border: "1px solid rgba(56,139,253,0.3)"
                      }}
                    >
                      {t.category}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {t.isSystem && (
                        <span style={{ fontSize: 11, color: "#3fb950", background: "rgba(63,185,80,0.1)", padding: "1px 6px", borderRadius: 4 }}>
                          Official
                        </span>
                      )}
                      {!t.isSystem && (
                        <button
                          onClick={(e) => handleDelete(e, t.id)}
                          style={{ background: "transparent", border: "none", color: "#8b949e", cursor: "pointer", fontSize: 12 }}
                          title="Delete custom template"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#f0f6fc" }}>{t.title}</h4>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#8b949e", lineHeight: 1.4 }}>{t.description}</p>

                  <div
                    style={{
                      background: "#161b22",
                      border: "1px solid #21262d",
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: 12,
                      color: "#c9d1d9",
                      fontFamily: "monospace",
                      lineHeight: 1.4,
                      maxHeight: 70,
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {t.promptTemplate}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #21262d", paddingTop: 10 }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(t.variables || []).map((v, vIdx) => (
                      <span key={vIdx} style={{ fontSize: 10, background: "#21262d", color: "#79c0ff", padding: "1px 5px", borderRadius: 3 }}>
                        [{v}]
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectTemplate) onSelectTemplate(t.promptTemplate);
                      onClose();
                    }}
                    style={{
                      padding: "6px 14px",
                      background: "#1f6feb",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(31,111,235,0.3)"
                    }}
                  >
                    Use Template →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
