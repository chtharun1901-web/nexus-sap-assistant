import React, { useState } from "react";

/**
 * EmailDraftCard
 * Renders an AI-generated email draft in a single unified, professional letter card
 * with one-click copy, highlighted placeholders, and no broken layout fragments.
 */
export default function EmailDraftCard({ subject = "", to = "", paragraphs = [], rawText = "", renderInline }) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Clean subject
  const cleanSubject = subject.replace(/^(?:\*\*|\*|#*\s*)?subject\s*:?\s*(?:\*\*|\*)?\s*/i, "").trim();

  // Full email text for clipboard
  const fullEmailString = [
    cleanSubject ? `Subject: ${cleanSubject}` : "",
    to ? `To: ${to}` : "",
    "",
    paragraphs.join("\n\n")
  ].filter(Boolean).join("\n");

  const bodyOnlyString = paragraphs.join("\n\n");

  const handleCopyFull = () => {
    navigator.clipboard.writeText(fullEmailString);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2200);
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(cleanSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2200);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(bodyOnlyString);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2200);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(bodyOnlyString)}`;
    window.open(mailtoUrl, "_blank");
  };

  // Word count calculation
  const totalWords = bodyOnlyString.split(/\s+/).filter(Boolean).length;
  const readTimeSec = Math.max(15, Math.round((totalWords / 200) * 60));

  // Helper to render text with placeholders highlighted like [Name]
  const renderParagraphContent = (text) => {
    if (!text) return null;
    if (renderInline) {
      return renderInline(text);
    }
    return text;
  };

  return (
    <div
      className="nexus-email-draft-card"
      style={{
        margin: "20px 0",
        background: "var(--bg-card, #FFFFFF)",
        border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))",
        borderRadius: "14px",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        fontFamily: "var(--font-sans, -apple-system, sans-serif)",
        color: "var(--text-primary, #1C1917)"
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: "12px 18px",
          background: "linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)",
          borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)"
            }}
          >
            ✉️
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary, #1C1917)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Email Draft</span>
              <span
                style={{
                  fontSize: "10.5px",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  fontWeight: "600",
                  border: "1px solid rgba(16, 185, 129, 0.3)"
                }}
              >
                Single Page • Ready to Send
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #78716C)" }}>
              {totalWords} words · ~{readTimeSec}s read
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleOpenMailto}
            title="Open draft in default mail client (Outlook / Apple Mail)"
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.15))",
              color: "var(--text-muted, #555)",
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s ease"
            }}
          >
            <span>↗</span>
            <span>Open in Mail</span>
          </button>

          <button
            onClick={handleCopyFull}
            style={{
              background: copiedFull ? "#10B981" : "var(--orange, #2563EB)",
              color: "#FFFFFF",
              border: "none",
              padding: "6px 14px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              transition: "all 0.15s ease"
            }}
          >
            <span>{copiedFull ? "✓" : "📋"}</span>
            <span>{copiedFull ? "Copied Full Email!" : "Copy Full Email"}</span>
          </button>
        </div>
      </div>

      {/* Metadata Fields (Subject & To) */}
      <div
        style={{
          padding: "14px 20px",
          background: "var(--bg-surface, #FBFBF9)",
          borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontSize: "13px"
        }}
      >
        {to && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: "700", color: "var(--text-muted, #78716C)", width: "55px", fontSize: "12px" }}>To:</span>
            <span style={{ color: "var(--text-primary, #1C1917)", fontWeight: "500" }}>{to}</span>
          </div>
        )}

        {cleanSubject && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <span style={{ fontWeight: "700", color: "var(--text-muted, #78716C)", width: "55px", fontSize: "12px", flexShrink: 0 }}>Subject:</span>
              <span style={{ color: "var(--text-primary, #1C1917)", fontWeight: "600", letterSpacing: "-0.01em" }}>
                {cleanSubject}
              </span>
            </div>
            <button
              onClick={handleCopySubject}
              title="Copy subject line"
              style={{
                background: "transparent",
                border: "none",
                color: copiedSubject ? "#10B981" : "var(--text-muted, #78716C)",
                fontSize: "11px",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
                flexShrink: 0
              }}
            >
              {copiedSubject ? "✓ Subject Copied" : "Copy Subject"}
            </button>
          </div>
        )}
      </div>

      {/* Email Body Content — Single Clean Letter Surface */}
      <div
        style={{
          padding: "20px 24px",
          background: "var(--bg-card, #FFFFFF)",
          fontSize: "14.5px",
          lineHeight: "1.7",
          color: "var(--text-body, #2E2E2E)",
          fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
        }}
      >
        {paragraphs.map((para, idx) => {
          if (!para.trim()) return null;
          return (
            <p
              key={idx}
              style={{
                margin: "0 0 14px 0",
                lineHeight: "1.7"
              }}
            >
              {renderParagraphContent(para)}
            </p>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div
        style={{
          padding: "10px 20px",
          background: "var(--bg-surface, #FBFBF9)",
          borderTop: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--text-muted, #78716C)"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>💡</span>
          <span>Tip: Replace bracketed fields like <code style={{ backgroundColor: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: "3px" }}>[Interviewer Name]</code> before sending.</span>
        </span>

        <button
          onClick={handleCopyBody}
          style={{
            background: "transparent",
            border: "none",
            color: copiedBody ? "#10B981" : "var(--text-muted, #555)",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            padding: "3px 8px",
            borderRadius: "4px"
          }}
        >
          {copiedBody ? "✓ Body Copied" : "Copy Body Only"}
        </button>
      </div>
    </div>
  );
}
