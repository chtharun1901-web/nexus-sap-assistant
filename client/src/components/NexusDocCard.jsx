import React from "react";

export default function NexusDocCard({ doc, onOpen, statusText = "Make doc changes (batch)" }) {
  if (!doc) return null;

  return (
    <div style={{ margin: "12px 0 6px 0", maxWidth: 440 }}>
      {/* Batch / Status header line matching Claude */}
      {statusText && (
        <div
          onClick={() => onOpen && onOpen(doc)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "var(--text-muted, #9CA3AF)",
            cursor: "pointer",
            marginBottom: 6,
            fontWeight: 500,
            transition: "color 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary, #E5E7EB)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted, #9CA3AF)")}
        >
          <span style={{ fontSize: 13 }}>📄</span>
          <span>{statusText}</span>
          <span style={{ fontSize: 11 }}>›</span>
        </div>
      )}

      {/* Main Doc Card matching Claude screenshot */}
      <div
        onClick={() => onOpen && onOpen(doc)}
        role="button"
        tabIndex={0}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 14px",
          background: "var(--bg-card, #1F1E1B)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          borderRadius: 12,
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--burgundy-rich, #8A2435)";
          e.currentTarget.style.background = "var(--bg-card-hover, #262522)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle, rgba(255,255,255,0.08))";
          e.currentTarget.style.background = "var(--bg-card, #1F1E1B)";
        }}
      >
        {/* Left: Blue Doc Icon + Titles */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-primary, #EDEDED)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "var(--font-sans, system-ui)"
              }}
              title={doc.title}
            >
              {doc.title || "Untitled Document"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted, #8E8E87)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2
              }}
            >
              <span>Nexus Docs</span>
              <span>·</span>
              <span style={{ fontSize: 10 }}>🔒</span>
              <span>Only you</span>
            </div>
          </div>
        </div>

        {/* Right: Open Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpen) onOpen(doc);
          }}
          style={{
            padding: "5px 14px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
            borderRadius: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-primary, #EDEDED)",
            cursor: "pointer",
            fontFamily: "var(--font-sans, system-ui)",
            transition: "all 0.15s ease",
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }}
        >
          Open
        </button>
      </div>
    </div>
  );
}
