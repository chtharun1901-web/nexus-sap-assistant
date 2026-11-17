import React, { useState, useEffect } from "react";

export default function NodeInspectorModal({ node, nodeType, nodeIndex, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (node) {
      setFormData(JSON.parse(JSON.stringify(node)));
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleItemChange = (iIdx, field, val) => {
    setFormData((prev) => {
      const items = [...(prev.items || [])];
      if (items[iIdx]) {
        items[iIdx] = { ...items[iIdx], [field]: val };
      }
      return { ...prev, items };
    });
  };

  const handleSave = () => {
    onSave(formData, nodeType, nodeIndex);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card, #FFFFFF)",
          borderRadius: 14,
          padding: 24,
          width: 520,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
          color: "var(--text-primary, #1C1917)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>✏️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Edit Vector Illustration Element</h3>
              <span style={{ fontSize: 11, color: "var(--text-muted, #73736C)", fontFamily: "var(--font-mono)" }}>
                Element Type: {nodeType?.toUpperCase()} #{nodeIndex + 1}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--text-muted)"
            }}
          >
            ✕
          </button>
        </div>

        {/* Dynamic Fields based on node data */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Label / Title */}
          {(formData.label !== undefined || formData.title !== undefined || formData.destination !== undefined || formData.name !== undefined) && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                Primary Title / Label
              </label>
              <input
                type="text"
                value={formData.label || formData.title || formData.destination || formData.name || ""}
                onChange={(e) => {
                  if (formData.name !== undefined) handleChange("name", e.target.value);
                  else if (formData.label !== undefined) handleChange("label", e.target.value);
                  else if (formData.title !== undefined) handleChange("title", e.target.value);
                  else if (formData.destination !== undefined) handleChange("destination", e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-subtle, #CBD5E1)",
                  background: "var(--bg-surface, #F8FAFC)",
                  color: "inherit",
                  fontSize: 13
                }}
              />
            </div>
          )}

          {/* Subtitle / Level / Metric */}
          {(formData.desc || formData.sublabel || formData.metric || formData.capacity || formData.distance) && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                Description / Metric / Note
              </label>
              <input
                type="text"
                value={formData.desc || formData.sublabel || formData.metric || formData.capacity || formData.distance || ""}
                onChange={(e) => {
                  if (formData.desc !== undefined) handleChange("desc", e.target.value);
                  else if (formData.sublabel !== undefined) handleChange("sublabel", e.target.value);
                  else if (formData.metric !== undefined) handleChange("metric", e.target.value);
                  else if (formData.capacity !== undefined) handleChange("capacity", e.target.value);
                  else if (formData.distance !== undefined) handleChange("distance", e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-subtle, #CBD5E1)",
                  background: "var(--bg-surface, #F8FAFC)",
                  color: "inherit",
                  fontSize: 13
                }}
              />
            </div>
          )}

          {/* Badge / Status Tag */}
          {(formData.badge || formData.status) && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                Badge / Status Flag
              </label>
              <input
                type="text"
                value={formData.badge || formData.status || ""}
                onChange={(e) => {
                  if (formData.badge !== undefined) handleChange("badge", e.target.value);
                  else handleChange("status", e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-subtle, #CBD5E1)",
                  background: "var(--bg-surface, #F8FAFC)",
                  color: "inherit",
                  fontSize: 13
                }}
              />
            </div>
          )}

          {/* Technical T-Code / Queue Key / Category */}
          {formData.tcode !== undefined && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                Technical Key / SAP T-Code / Queue
              </label>
              <input
                type="text"
                value={formData.tcode || ""}
                onChange={(e) => handleChange("tcode", e.target.value)}
                placeholder="e.g. SMQ1 / /SCWM/STAGE"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-subtle, #CBD5E1)",
                  background: "var(--bg-surface, #F8FAFC)",
                  color: "inherit",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>
          )}

          {/* Child Items list if present (e.g. Crate items) */}
          {formData.items && formData.items.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Contained Items & Values ({formData.items.length})
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {formData.items.map((item, iIdx) => (
                  <div key={iIdx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) => handleItemChange(iIdx, "name", e.target.value)}
                      placeholder="Item name"
                      style={{
                        flex: 2,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--border-subtle)",
                        fontSize: 12
                      }}
                    />
                    <input
                      type="text"
                      value={item.count || ""}
                      onChange={(e) => handleItemChange(iIdx, "count", e.target.value)}
                      placeholder="Metric / Count"
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--border-subtle)",
                        fontSize: 12
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "inherit"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              background: "var(--orange, #E8614D)",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            Apply to Vector Graphic
          </button>
        </div>
      </div>
    </div>
  );
}
