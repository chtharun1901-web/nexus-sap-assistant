import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import UserSettingsModal from "./UserSettingsModal.jsx";

const SECTIONS = [
  { id: "all", label: "📄 Complete Investigation" },
  { id: "ai", label: "⚡ AI Live Reasoning" },
  { id: "overview", label: "1. Incident Overview" },
  { id: "symptoms", label: "2. Diagnostic Symptoms" },
  { id: "safeguards", label: "3. Production Safeguards" },
  { id: "procedure", label: "4. Step-by-Step Triage" },
  { id: "tcodes", label: "5. T-Code Reference" },
  { id: "evidence", label: "6. Official Citations" }
];

export default function ClaudeSidebar({
  user,
  activeView,
  onNavigate,
  activeSessionId,
  onSelectSession,
  onNewChat,
  activeCaseDoc,
  activeSection = "all",
  onSelectSection,
  onLogout,
  currentWallpaper,
  onWallpaperChange,
  onStartTour,
  darkMode,
  onToggleDarkMode
}) {
  const [conversations, setConversations] = useState([]);
  const [copiedSession, setCopiedSession] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const loadConversations = () => {
    api.getConversations()
      .then((d) => {
        setConversations(d.conversations || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  const copySessionId = (sid) => {
    if (!sid) return;
    navigator.clipboard?.writeText(sid);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Nexus_Sessions_Export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const userName = user?.display_name || user?.email?.split("@")[0] || "Raghav";
  const userInitial = userName.charAt(0).toUpperCase();
  const currentCaseId = activeCaseDoc?.caseId || (activeSessionId ? "NEW INQUIRY" : "READY");
  const displaySessionId = activeSessionId || "conv-init-session";

  return (
    <>
      <aside
        style={{
          width: 270,
          height: "100vh",
          background: "var(--bg-surface, #EDE8E0)",
          borderRight: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          userSelect: "none",
          fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
          color: "var(--text-primary, #1C1917)",
          overflow: "hidden"
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "14px 16px 10px 16px",
            borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              onClick={() => onNavigate && onNavigate("home")}
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary, #1C1917)",
                letterSpacing: "-0.02em",
                cursor: "pointer"
              }}
              title="Nexus Studio - Home"
            >
              Nexus
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("home")}
            style={{
              background: "none",
              border: "none",
              fontSize: 12,
              color: "var(--text-muted, #78716C)",
              cursor: "pointer",
              padding: "2px 6px"
            }}
            title="Dashboard Overview"
          >
            🏠
          </button>
        </div>

        {/* Nexus 2.0 Simulator Launcher */}
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))" }}>
          <button
            type="button"
            onClick={() => {
              window.open("/?view=simulator", "_blank");
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 10px",
              background: "var(--bg-card, #FAF8F5)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease"
            }}
            title="Open Nexus 2.0 GTS Execution Simulator in a new tab"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--orange, #6E1A2D)";
              e.currentTarget.style.background = "rgba(110,26,45,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.background = "var(--bg-card, #FAF8F5)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚡</span>
              <span>Nexus 2.0 (GTS Simulator)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: "rgba(110,26,45,0.12)", color: "var(--orange, #6E1A2D)", fontFamily: "var(--font-mono)" }}>
                FIORI
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>↗</span>
            </div>
          </button>
        </div>

        {/* 1. Active Case Block (Image 2 Top) */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexShrink: 0,
            background: "rgba(0,0,0,0.015)"
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted, #78716C)",
                fontFamily: "var(--font-mono, monospace)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 3
              }}
            >
              ACTIVE CASE
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "var(--orange, #6E1A2D)",
                fontFamily: "var(--font-mono, monospace)",
                marginBottom: 6
              }}
            >
              {currentCaseId}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted, #78716C)", fontFamily: "var(--font-mono, monospace)" }}>
                SES:
              </span>
              <button
                type="button"
                onClick={() => copySessionId(displaySessionId)}
                title="Click to copy Unique Session ID"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--text-primary, #1C1917)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span style={{ maxWidth: 105, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displaySessionId}
                </span>
                <span style={{ fontSize: 8.5, color: copiedSession ? "var(--green, #10B981)" : "var(--text-muted, #78716C)" }}>
                  {copiedSession ? "✓" : "📋"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Chats and Tasks Section (Full Height Sidebar List) */}
        <div style={{ padding: "14px 14px 10px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted, #78716C)",
                letterSpacing: "-0.01em",
                textTransform: "uppercase"
              }}
            >
              Chats and tasks
            </span>
            <button
              type="button"
              onClick={() => {
                if (onNewChat) onNewChat();
                else if (onNavigate) onNavigate("workspace", null);
              }}
              style={{
                background: "var(--bg-card, #FFFFFF)",
                border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                color: "var(--text-primary, #1C1917)",
                fontSize: 11.5,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 6,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--orange, #6E1A2D)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong, rgba(0,0,0,0.16))"; }}
              title="Start New Investigation Session"
            >
              + New
            </button>
          </div>

          <div
            className="smooth-scroll-container"
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingRight: 2
            }}
          >
            {conversations.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-muted, #78716C)", padding: "12px 6px" }}>
                No active sessions yet. Click + New to begin.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeSessionId === c.session_id || activeSessionId === c.id;
                const sid = c.session_id || c.id;
                const title = c.title || sid;

                return (
                  <div
                    key={sid}
                    onClick={() => {
                      if (onSelectSession) onSelectSession(sid);
                      if (onNavigate) onNavigate("workspace", null);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: isSelected ? "rgba(0, 0, 0, 0.07)" : "transparent",
                      color: isSelected ? "var(--text-primary, #1C1917)" : "var(--text-body, #44403C)",
                      fontWeight: isSelected ? 700 : 400,
                      transition: "all 0.12s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(0,0,0,0.035)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Small clean bullet dot like Image 1 */}
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: isSelected ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-muted, #78716C)",
                        flexShrink: 0
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.35
                      }}
                    >
                      {title}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Bottom User Bar */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            padding: "10px 14px",
            background: "var(--bg-surface, #EDE8E0)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flexShrink: 0
          }}
        >
          {/* User Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px",
              borderRadius: 6,
              background: "var(--bg-card, #FFFFFF)",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {userInitial}
              </div>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary, #1C1917)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted, #78716C)" }}>Free Plan</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={handleExportAll}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted, #78716C)", padding: "2px" }}
                title="Download All Sessions JSON"
              >
                ⤓
              </button>
              <button
                type="button"
                onClick={() => onStartTour && onStartTour()}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted, #78716C)", padding: "2px" }}
                title="Guided Tour"
              >
                🧭
              </button>
              <button
                type="button"
                onClick={onToggleDarkMode}
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 12,
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted, #78716C)", padding: "2px" }}
                title="Settings & Wallpaper"
              >
                ⚙️
              </button>
              <button
                type="button"
                onClick={onLogout}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#DC2626", padding: "2px" }}
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettingsModal && (
        <UserSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          user={user}
          onLogout={onLogout}
          currentWallpaper={currentWallpaper}
          onWallpaperChange={onWallpaperChange}
        />
      )}
    </>
  );
}
