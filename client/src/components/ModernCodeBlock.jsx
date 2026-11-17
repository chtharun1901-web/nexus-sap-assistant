import React, { useState } from "react";

/**
 * ModernCodeBlock
 * 
 * Replaces the vintage raw black terminal box with an executive, modern Claude/Vercel-style code block.
 * Features:
 * - macOS terminal dots & language badge (e.g. TEXT, ABAP, JSON, BASH)
 * - Line count indicator
 * - 1-Click Copy Button with animated "Copied!" feedback
 * - Wrap / Unwrap toggle to eliminate horizontal scrolling on long lines
 * - Custom slim translucent scrollbar (removes ugly vintage OS scrollbars)
 */
export default function ModernCodeBlock({ code = "", language = "text", title = "" }) {
  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(true); // Default to wrapped so no horizontal scrollbar by default!

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code snippet:", err);
    }
  };

  const cleanLang = (language || "text").trim().toLowerCase();
  const displayLang = cleanLang === "abap" 
    ? "SAP ABAP" 
    : cleanLang === "sh" || cleanLang === "bash" || cleanLang === "shell" 
    ? "BASH / CLI" 
    : cleanLang.toUpperCase();

  const linesCount = code.split("\n").length;

  return (
    <div
      className="modern-code-card-root"
      style={{
        margin: "14px 0 18px",
        borderRadius: 10,
        overflow: "hidden",
        background: "#18181B",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.14)",
        fontFamily: "var(--font-mono, 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace)"
      }}
    >
      <style>{`
        .modern-code-scroll::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .modern-code-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-code-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 4px;
        }
        .modern-code-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.32);
        }
        .modern-code-action-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #FFFFFF !important;
        }
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 14px",
          background: "#222226",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          userSelect: "none"
        }}
      >
        {/* Left Side: Terminal Dots + Language Badge + Line Count */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* macOS window dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F56", opacity: 0.85 }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E", opacity: 0.85 }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27C93F", opacity: 0.85 }} />
          </div>

          {/* Language Pill */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: "0.04em",
              color: "#A1A1AA",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            {displayLang}
          </span>

          {/* Line Count */}
          <span style={{ fontSize: 11, color: "#71717A" }}>
            {linesCount} {linesCount === 1 ? "line" : "lines"}
          </span>
        </div>

        {/* Right Side: Sidecar + Wrap Toggle + Prominent Copy Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Open in Claude Artifact Sidecar */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-open-artifact', {
                detail: {
                  title: title || `${displayLang} Code Snippet`,
                  type: "code",
                  content: code,
                  language: cleanLang
                }
              }));
            }}
            title="Dock in Claude Artifact Sidecar"
            className="modern-code-action-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 5,
              padding: "3px 8px",
              fontSize: 11.5,
              color: "#E4E4E7",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit"
            }}
          >
            <span>⤢</span>
            <span>Sidecar</span>
          </button>

          {/* Wrap / Unwrap Toggle Button */}
          <button
            type="button"
            onClick={() => setIsWrapped(prev => !prev)}
            title={isWrapped ? "Switch to single-line horizontal scroll" : "Wrap lines to fit window"}
            className="modern-code-action-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: isWrapped ? "rgba(255, 255, 255, 0.08)" : "transparent",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 5,
              padding: "3px 8px",
              fontSize: 11.5,
              color: isWrapped ? "#E4E4E7" : "#A1A1AA",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit"
            }}
          >
            <span>{isWrapped ? "↩ Wrapped" : "↔ No Wrap"}</span>
          </button>

          {/* Dedicated 1-Click Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code to clipboard"
            className="modern-code-action-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.06)",
              border: `1px solid ${copied ? "#10B981" : "rgba(255, 255, 255, 0.14)"}`,
              borderRadius: 5,
              padding: "3px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              color: copied ? "#34D399" : "#F4F4F5",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit"
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre
        className="modern-code-scroll"
        style={{
          margin: 0,
          padding: "14px 18px",
          overflowX: isWrapped ? "visible" : "auto",
          whiteSpace: isWrapped ? "pre-wrap" : "pre",
          wordBreak: isWrapped ? "break-word" : "normal",
          fontSize: 13,
          lineHeight: 1.62,
          color: "#EDEDED",
          fontFamily: "inherit"
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
