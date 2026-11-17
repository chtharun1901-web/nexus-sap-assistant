import React, { useState, useEffect, useRef } from "react";
import ModernCodeBlock from "./ModernCodeBlock.jsx";

/**
 * ClaudeArtifactSidecar
 * 
 * Claude 3.7 style docked split-pane artifact explorer.
 * Opens whenever an artifact, code block, or deep analysis is dispatched:
 * window.dispatchEvent(new CustomEvent('nexus-open-artifact', {
 *   detail: { title, type, content, language }
 * }))
 */
export default function ClaudeArtifactSidecar({
  isOpen: propIsOpen,
  onClose: propOnClose,
  artifact: propArtifact
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState({
    title: "SAP Staging Runbook",
    type: "code",
    content: "",
    language: "abap"
  });
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'preview'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;
  const currentArtifact = propArtifact || activeArtifact;

  // Listen to global open artifact event
  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.content) {
        setActiveArtifact({
          title: e.detail.title || "Nexus Artifact",
          type: e.detail.type || "code",
          content: e.detail.content || "",
          language: e.detail.language || "text"
        });
        setActiveTab(e.detail.type === "preview" ? "preview" : "code");
        setInternalOpen(true);
      }
    };

    window.addEventListener("nexus-open-artifact", handleOpen);
    return () => window.removeEventListener("nexus-open-artifact", handleOpen);
  }, []);

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else setInternalOpen(false);
  };

  const handleCopy = () => {
    if (!currentArtifact.content) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentArtifact.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    if (!currentArtifact.content) return;
    const lang = (currentArtifact.language || "txt").toLowerCase();
    const extMap = {
      abap: "abap",
      sql: "sql",
      python: "py",
      javascript: "js",
      typescript: "ts",
      json: "json",
      markdown: "md",
      html: "html",
      css: "css"
    };
    const ext = extMap[lang] || "txt";
    const filename = `${(currentArtifact.title || "artifact").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.${ext}`;

    const blob = new Blob([currentArtifact.content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const lineCount = (currentArtifact.content || "").split("\n").length;

  return (
    <aside
      className="claude-artifact-sidecar"
      style={{
        position: isFullscreen ? "fixed" : "sticky",
        top: isFullscreen ? 0 : 0,
        right: 0,
        bottom: 0,
        inset: isFullscreen ? 0 : undefined,
        width: isFullscreen ? "100vw" : "46%",
        minWidth: isFullscreen ? "auto" : 380,
        maxWidth: isFullscreen ? "100vw" : 640,
        height: isFullscreen ? "100vh" : "100%",
        zIndex: isFullscreen ? 9999 : 50,
        backgroundColor: "var(--bg-card, #FFFFFF)",
        borderLeft: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))",
        boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "sidecarSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        userSelect: "none"
      }}
    >
      <style>{`
        @keyframes sidecarSlideIn {
          from { transform: translateX(100%); opacity: 0.8; }
          to { transform: translateX(0); opacity: 1; }
        }
        .sidecar-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 9px;
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border-subtle, rgba(0,0,0,0.12));
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 550;
          color: var(--text-primary, #1C1917);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sidecar-btn:hover {
          background: var(--bg-surface, rgba(0,0,0,0.04));
          border-color: var(--border-subtle, rgba(0,0,0,0.2));
        }
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
          background: "var(--bg-surface, #FAFAF7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0
        }}
      >
        {/* Left: Artifact Title & Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(217, 119, 6, 0.1)",
              border: "1px solid rgba(217, 119, 6, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0
            }}
          >
            ⚡
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 650,
                color: "var(--text-primary, #1C1917)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {currentArtifact.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted, #78716C)", fontFamily: "monospace" }}>
              {currentArtifact.language?.toUpperCase() || "TEXT"} · {lineCount} lines · Artifact
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Copy Button */}
          <button
            type="button"
            className="sidecar-btn"
            onClick={handleCopy}
            title="Copy full artifact content"
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            className="sidecar-btn"
            onClick={handleDownload}
            title="Download file"
          >
            <span>⤓</span>
            <span>Download</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="sidecar-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Restore sidecar size" : "Expand to fullscreen"}
            style={{ padding: "5px 7px" }}
          >
            <span>{isFullscreen ? "⊡" : "⤢"}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            className="sidecar-btn"
            onClick={handleClose}
            title="Close Artifact Sidecar"
            style={{ padding: "5px 8px", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Artifact Body Viewport */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: 16,
          backgroundColor: "var(--bg-card, #FFFFFF)"
        }}
      >
        <ModernCodeBlock
          code={currentArtifact.content}
          language={currentArtifact.language || "text"}
          title={currentArtifact.title}
        />
      </div>

      {/* Bottom Status Footnote */}
      <div
        style={{
          padding: "8px 18px",
          borderTop: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
          background: "var(--bg-surface, #FAFAF7)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--text-muted, #78716C)",
          fontFamily: "var(--font-sans, sans-serif)",
          flexShrink: 0
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10B981" }} />
          Claude Artifact 2.0 Live Sidecar
        </span>
        <span>Esc to close</span>
      </div>
    </aside>
  );
}
