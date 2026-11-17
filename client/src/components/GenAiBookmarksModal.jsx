import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function GenAiBookmarksModal({ isOpen, onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const MODULES = ["ALL", "SD", "MM", "PP", "EWM", "GTS", "FI/CO", "General"];

  const loadBookmarks = () => {
    setLoading(true);
    api.getBookmarks({ search, module: selectedModule !== "ALL" ? selectedModule : "" })
      .then((res) => {
        setBookmarks(res.bookmarks || []);
      })
      .catch((err) => setError(err.message || "Failed to load bookmarks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen, search, selectedModule]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Remove this saved insight?")) return;
    try {
      await api.deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      if (selectedBookmark?.id === id) setSelectedBookmark(null);
    } catch (err) {
      alert("Failed to delete bookmark: " + err.message);
    }
  };

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          maxWidth: 820,
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
            <span style={{ fontSize: 22 }}>📌</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f6fc" }}>
                Pinned Insights & Bookmarked Answers
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b949e" }}>
                Critical SAP solutions, triage steps, and configuration advice starred during investigations.
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

        {/* Search & Filter Bar */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #21262d", background: "#0d1117", display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved insights, tcodes, or topics..."
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
            {MODULES.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModule(m)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid",
                  background: selectedModule === m ? "#1f6feb" : "#21262d",
                  borderColor: selectedModule === m ? "#388bfd" : "#30363d",
                  color: selectedModule === m ? "#fff" : "#8b949e"
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* List of Bookmarks */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <div style={{ color: "#ff7b72", padding: 10 }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8b949e" }}>Loading your pinned insights...</div>
          ) : bookmarks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#8b949e" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#c9d1d9", marginBottom: 6 }}>No Pinned Insights Yet</div>
              <div style={{ fontSize: 13, maxWidth: 400, margin: "0 auto" }}>
                Click the star or pin icon on any AI response in the Workspace chat to save verified resolutions here.
              </div>
            </div>
          ) : (
            bookmarks.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBookmark(selectedBookmark?.id === b.id ? null : b)}
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: "14px 18px",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>📌</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f6fc" }}>{b.title}</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#21262d",
                        color: "#58a6ff",
                        border: "1px solid #30363d"
                      }}
                    >
                      {b.module || "SAP"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={(e) => handleCopy(e, b.content, b.id)}
                      style={{
                        background: "#21262d",
                        border: "1px solid #30363d",
                        borderRadius: 4,
                        padding: "3px 8px",
                        fontSize: 11,
                        color: copiedId === b.id ? "#3fb950" : "#c9d1d9",
                        cursor: "pointer"
                      }}
                    >
                      {copiedId === b.id ? "✓ Copied" : "Copy"}
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, b.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: 13,
                        color: "#8b949e",
                        cursor: "pointer",
                        padding: "2px 6px"
                      }}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#8b949e",
                    lineHeight: 1.5,
                    whiteSpace: selectedBookmark?.id === b.id ? "pre-wrap" : "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxHeight: selectedBookmark?.id === b.id ? "none" : "2.8em"
                  }}
                >
                  {b.content}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#6e7681", marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(b.tags || []).map((t, idx) => (
                      <span key={idx} style={{ background: "rgba(56,139,253,0.1)", color: "#58a6ff", padding: "1px 6px", borderRadius: 4 }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div>{new Date(b.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
