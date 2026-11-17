import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function GenAiDocsModal({ isOpen, onClose, onOpenDoc }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadDocs = () => {
    setLoading(true);
    api.listNexusDocs()
      .then((res) => {
        setDocs(res.docs || []);
      })
      .catch((err) => setError(err.message || "Failed to load documents"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadDocs();
      setShowCreateNew(false);
      setNewTitle("");
      setNewContent("");
    }
  }, [isOpen]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.deleteNexusDoc(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Failed to delete document: " + err.message);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await api.createNexusDoc({
        title: newTitle.trim(),
        content: newContent || "# " + newTitle.trim() + "\n\nStart writing..."
      });
      if (res && res.doc) {
        setDocs((prev) => [res.doc, ...prev]);
        setShowCreateNew(false);
        setNewTitle("");
        setNewContent("");
        if (onOpenDoc) {
          onOpenDoc(res.doc);
          onClose();
        }
      }
    } catch (err) {
      alert("Failed to create document: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const filteredDocs = docs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (d.title || "").toLowerCase().includes(q) || (d.content || "").toLowerCase().includes(q);
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
          maxWidth: 820,
          maxHeight: "88vh",
          backgroundColor: "var(--bg-main, #1F1E1B)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
          overflow: "hidden",
          fontFamily: "var(--font-sans, system-ui)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-card, #262522)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary, #EDEDED)" }}>
                Nexus Docs Library
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted, #8E8E87)" }}>
                Persistent, rich-formatted documents created from conversations
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowCreateNew(!showCreateNew)}
              style={{
                padding: "6px 12px",
                background: showCreateNew ? "rgba(255,255,255,0.1)" : "var(--burgundy-rich, #8A2435)",
                border: "none",
                borderRadius: 6,
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>{showCreateNew ? "Cancel" : "+ New Doc"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted, #8E8E87)",
                cursor: "pointer",
                fontSize: 16,
                padding: 4
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Create New Form (if open) */}
        {showCreateNew && (
          <form
            onSubmit={handleCreateNew}
            style={{
              padding: "16px 20px",
              background: "rgba(138, 36, 53, 0.08)",
              borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}
          >
            <input
              type="text"
              placeholder="Document Title (e.g. Wakefit Outbound Talking Points)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{
                padding: "8px 12px",
                background: "var(--bg-main, #1F1E1B)",
                border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                borderRadius: 6,
                color: "var(--text-primary, #EDEDED)",
                fontSize: 14,
                outline: "none"
              }}
            />
            <textarea
              placeholder="Initial Markdown Content (optional)..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              style={{
                padding: "8px 12px",
                background: "var(--bg-main, #1F1E1B)",
                border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                borderRadius: 6,
                color: "var(--text-primary, #EDEDED)",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                outline: "none",
                resize: "vertical"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={isCreating}
                style={{
                  padding: "6px 16px",
                  background: "var(--burgundy-rich, #8A2435)",
                  border: "none",
                  borderRadius: 6,
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {isCreating ? "Creating..." : "Create Document"}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
          <input
            type="text"
            placeholder="Search documents by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              background: "var(--bg-card, #262522)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
              borderRadius: 6,
              color: "var(--text-primary, #EDEDED)",
              fontSize: 13,
              outline: "none"
            }}
          />
        </div>

        {/* Content / Documents List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              Loading documents...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 40, color: "#EF4444" }}>
              {error}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                {search ? "No matching documents found" : "No Nexus Docs created yet"}
              </div>
              <div style={{ fontSize: 12 }}>
                {search
                  ? "Try adjusting your search keywords."
                  : "Click the '📄 Create Nexus Doc' button on any AI response in chat to generate a document."}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 }}>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    if (onOpenDoc) onOpenDoc(doc);
                    onClose();
                  }}
                  style={{
                    padding: "14px",
                    background: "var(--bg-card, #262522)",
                    border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--burgundy-rich, #8A2435)";
                    e.currentTarget.style.background = "var(--bg-card-hover, #2D2C28)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle, rgba(255,255,255,0.08))";
                    e.currentTarget.style.background = "var(--bg-card, #262522)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "rgba(37, 99, 235, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: 14 }}>📄</span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary, #EDEDED)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {doc.title || "Untitled Document"}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--text-muted, #8E8E87)",
                          marginTop: 4,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.4
                        }}
                      >
                        {doc.content ? doc.content.slice(0, 140).replace(/[#*`]/g, "") : "Empty document"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 8,
                      borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                      fontSize: 11,
                      color: "var(--text-muted, #78716C)"
                    }}
                  >
                    <span>
                      {new Date(doc.created_at || Date.now()).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, doc.id)}
                        title="Delete document"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: 12,
                          padding: "2px 4px"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        🗑️
                      </button>
                      <span style={{ color: "var(--burgundy-rich, #B91C1C)", fontWeight: 600 }}>Open ›</span>
                    </div>
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
