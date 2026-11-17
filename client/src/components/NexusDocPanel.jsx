import React, { useState, useEffect } from "react";
import { FormattedText } from "../views/Workspace.jsx";
import { api } from "../api.js";

export default function NexusDocPanel({
  doc,
  isOpen,
  onClose,
  onUpdateDoc,
  onDeleteDoc,
  onNavigate,
  isDocked = false,
  onToggleDock
}) {
  const [currentDoc, setCurrentDoc] = useState(doc);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("document");
  const [versions, setVersions] = useState([]);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);

  useEffect(() => {
    if (doc) {
      setCurrentDoc(doc);
      setEditTitle(doc.title || "");
      setEditContent(doc.content || "");
      setIsEditing(false);
      setVersions(prev => {
        if (!prev.length || prev[0]?.docId !== doc.id) {
          return [{
            docId: doc.id,
            version: 1,
            title: doc.title || "Untitled",
            content: doc.content || "",
            timestamp: doc.updated_at || new Date().toISOString()
          }];
        }
        return prev;
      });
      setSelectedVersionIdx(0);
    }
  }, [doc?.id]);

  if (!isOpen || !currentDoc) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateNexusDoc(currentDoc.id, {
        title: editTitle,
        content: editContent
      });
      if (res && res.doc) {
        setCurrentDoc(res.doc);
        setVersions(prev => [
          {
            docId: res.doc.id,
            version: prev.length + 1,
            title: res.doc.title,
            content: res.doc.content,
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
        setSelectedVersionIdx(0);
        if (onUpdateDoc) onUpdateDoc(res.doc);
      }
      setIsEditing(false);
    } catch (e) {
      alert("Failed to save document: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!currentDoc?.content) return;
    navigator.clipboard?.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!currentDoc) return;
    const blob = new Blob([`# ${currentDoc.title}\n\n${currentDoc.content}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentDoc.title || "nexus-doc").replace(/[^a-z0-9_-]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWord = () => {
    if (!currentDoc) return;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${currentDoc.title}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 40px; }
  h1 { font-size: 22pt; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
  h2 { font-size: 16pt; color: #333; margin-top: 24px; }
  h3 { font-size: 13pt; color: #555; }
  blockquote { border-left: 3px solid #8A2435; margin: 16px 0; padding: 8px 16px; background: #fdf8f8; font-style: italic; }
  code { font-family: Consolas, monospace; background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-size: 10pt; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 4px; font-family: Consolas, monospace; font-size: 10pt; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f0f4f8; font-weight: bold; }
</style>
</head>
<body>
  <h1>${currentDoc.title}</h1>
  <p style="color: #666; font-size: 10pt;">Nexus Docs · Created: ${new Date(currentDoc.created_at || Date.now()).toLocaleDateString()}</p>
  <hr/>
  <div>${currentDoc.content.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br/>')}</div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentDoc.title || "nexus-doc").replace(/[^a-z0-9_-]/gi, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${currentDoc.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteNexusDoc(currentDoc.id);
      if (onDeleteDoc) onDeleteDoc(currentDoc.id);
      onClose();
    } catch (e) {
      alert("Failed to delete document: " + e.message);
    }
  };

  return (
    <div
      style={{
        position: isDocked ? "relative" : "fixed",
        top: isDocked ? "auto" : 0,
        right: isDocked ? "auto" : 0,
        bottom: isDocked ? "auto" : 0,
        width: isDocked ? "100%" : (isExpanded ? "85vw" : "min(680px, 92vw)"),
        height: isDocked ? "100%" : "auto",
        background: "var(--bg-main, #181715)",
        borderLeft: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
        boxShadow: isDocked ? "none" : "-8px 0 32px rgba(0, 0, 0, 0.45)",
        zIndex: isDocked ? 1 : 9998,
        display: "flex",
        flexDirection: "column",
        transition: isDocked ? "none" : "width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "var(--font-sans, system-ui)",
        overflow: "hidden"
      }}
    >
      {/* 1. Header Bar matching Claude Doc Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          background: "var(--bg-card, #1F1E1B)",
          gap: 12
        }}
      >
        {/* Document Title with chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "rgba(37, 99, 235, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: 13 }}>📄</span>
          </div>
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--text-primary, #EDEDED)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title={currentDoc.title}
          >
            {currentDoc.title || "Untitled Document"}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted, #8E8E87)", flexShrink: 0 }}>⌵</span>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Dock / Split View Toggle */}
          {onToggleDock && (
            <button
              type="button"
              onClick={onToggleDock}
              title={isDocked ? "Float panel as overlay" : "Dock as split view with chat"}
              style={{
                background: isDocked ? "rgba(59, 130, 246, 0.15)" : "transparent",
                border: `1px solid ${isDocked ? "rgba(59, 130, 246, 0.35)" : "transparent"}`,
                color: isDocked ? "#60A5FA" : "var(--text-muted, #8E8E87)",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>{isDocked ? "◫ Docked" : "⧉ Split"}</span>
            </button>
          )}

          {/* Fullscreen / Width Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse width" : "Expand width"}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: 6,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary, #EDEDED)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted, #8E8E87)")}
          >
            {isExpanded ? "⤓" : "⤢"}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close panel"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: 6,
              fontSize: 16,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary, #EDEDED)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted, #8E8E87)")}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Subheader Toolbar matching Claude Screenshot (Version Tabs, Edit, Copy, Export, etc.) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 18px",
          borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          background: "var(--bg-main, #181715)",
          gap: 12
        }}
      >
        {/* Left: Version Pills + Only You Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {versions.map((ver, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedVersionIdx(idx);
                setCurrentDoc(prev => ({ ...prev, title: ver.title, content: ver.content }));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 5,
                background: selectedVersionIdx === idx ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${selectedVersionIdx === idx ? "#3B82F6" : "transparent"}`,
                fontSize: 11.5,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: selectedVersionIdx === idx ? "#93C5FD" : "var(--text-primary, #EDEDED)",
                cursor: "pointer"
              }}
              title={`Version ${ver.version} - ${new Date(ver.timestamp).toLocaleTimeString()}`}
            >
              <span>v{ver.version}</span>
              {idx === 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>(current)</span>}
            </button>
          ))}

          <div style={{ fontSize: 11, color: "var(--text-muted, #78716C)", display: "flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
            <span>🔒</span>
            <span>Only you</span>
          </div>
        </div>


        {/* Right: Action icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isEditing) {
                setEditTitle(currentDoc.title || "");
                setEditContent(currentDoc.content || "");
              }
              setIsEditing(!isEditing);
            }}
            title={isEditing ? "Cancel editing" : "Edit document"}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: isEditing ? "rgba(138, 36, 53, 0.25)" : "transparent",
              border: isEditing ? "1px solid var(--burgundy-rich, #8A2435)" : "1px solid transparent",
              color: isEditing ? "#F87171" : "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>✏️</span>
            <span style={{ fontSize: 11 }}>{isEditing ? "Editing" : "Edit"}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy document content"
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: copied ? "rgba(16, 185, 129, 0.15)" : "transparent",
              border: copied ? "1px solid #10B981" : "1px solid transparent",
              color: copied ? "#10B981" : "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span style={{ fontSize: 11 }}>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Export Dropdown / Word */}
          <button
            type="button"
            onClick={handleExportWord}
            title="Export as Microsoft Word document (.doc)"
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>📥</span>
            <span style={{ fontSize: 11 }}>Word</span>
          </button>

          {/* Export Markdown */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            title="Export as Markdown (.md)"
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span style={{ fontSize: 11 }}>MD</span>
          </button>

          {/* Delete Doc */}
          <button
            type="button"
            onClick={handleDelete}
            title="Delete this document"
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--text-muted, #8E8E87)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted, #8E8E87)")}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 3. Main Document Body with Claude Serif Typography */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 36px 48px 36px"
        }}
      >
        {isEditing ? (
          /* Edit Mode */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>
                Document Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  background: "var(--bg-card, #1F1E1B)",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                  borderRadius: 8,
                  color: "var(--text-primary, #EDEDED)",
                  fontSize: 16,
                  fontFamily: "var(--font-sans)",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>
                Markdown Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={22}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  background: "var(--bg-card, #1F1E1B)",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                  borderRadius: 8,
                  color: "var(--text-primary, #EDEDED)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily: "var(--font-mono, monospace)",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  background: "var(--burgundy-rich, #8A2435)",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode matching Claude screenshot */
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {/* Document Big Serif Title */}
            <h1
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "clamp(26px, 4vw, 34px)",
                fontWeight: 600,
                lineHeight: 1.25,
                color: "var(--text-primary, #EDEDED)",
                margin: "0 0 24px 0",
                letterSpacing: "-0.015em"
              }}
            >
              {currentDoc.title || "Untitled Document"}
            </h1>

            {/* Document Content rendered with Claude Serif Typography */}
            <div
              className="claude-response-prose nexus-doc-content"
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "16px",
                lineHeight: 1.7,
                color: "var(--text-body, #D1D5DB)"
              }}
            >
              <FormattedText text={currentDoc.content || ""} onNavigate={onNavigate} />
            </div>

            {/* Footer timestamp */}
            <div
              style={{
                marginTop: 48,
                paddingTop: 16,
                borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                fontSize: 12,
                color: "var(--text-muted, #78716C)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <span>Created {new Date(currentDoc.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                {currentDoc.updated_at && currentDoc.updated_at !== currentDoc.created_at && (
                  <span> · Updated {new Date(currentDoc.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>🔒</span>
                <span>Nexus Docs</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
