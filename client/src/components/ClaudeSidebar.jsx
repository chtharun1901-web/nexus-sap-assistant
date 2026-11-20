import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import UserSettingsModal from "./UserSettingsModal.jsx";
import GenAiPreferencesModal from "./GenAiPreferencesModal.jsx";
import GenAiBookmarksModal from "./GenAiBookmarksModal.jsx";
import GenAiPromptTemplatesModal from "./GenAiPromptTemplatesModal.jsx";
import GenAiQuizModal from "./GenAiQuizModal.jsx";
import GenAiAnalyticsModal from "./GenAiAnalyticsModal.jsx";
import GenAiDocsModal from "./GenAiDocsModal.jsx";


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
  onToggleDarkMode,
  collapsed,
  onToggleCollapse,
  onOpenSearchModal
}) {
  const [conversations, setConversations] = useState([]);
  const [copiedSession, setCopiedSession] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showPromptTemplatesModal, setShowPromptTemplatesModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [autoCollapsed, setAutoCollapsed] = useState(false);

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

    const handleConvUpdate = (e) => {
      const updated = e.detail;
      if (!updated) {
        loadConversations();
        return;
      }
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === updated.id);
        if (exists) {
          return prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        }
        return [updated, ...prev];
      });
      loadConversations();
    };

    window.addEventListener('nexus-conversation-updated', handleConvUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('nexus-conversation-updated', handleConvUpdate);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setAutoCollapsed(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCollapsed = collapsed !== undefined ? (collapsed || autoCollapsed) : autoCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse(!isCollapsed);
    else setAutoCollapsed(prev => !prev);
  };

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

  const userName = user?.display_name || user?.displayName || user?.name || user?.email?.split("@")[0] || "Raghav";
  const userInitial = userName.charAt(0).toUpperCase();
  const currentCaseId = activeCaseDoc?.caseId || (activeSessionId ? "NEW INQUIRY" : "READY");
  const displaySessionId = activeSessionId || "conv-init-session";

  const filteredConvs = conversations.filter(c => !searchFilter || c.title?.toLowerCase().includes(searchFilter.toLowerCase()));

  const getGroup = (c) => {
    const dStr = c.updated_at || c.created_at;
    if (!dStr) return "Older";
    const d = new Date(dStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    if (d >= today) return "Today";
    if (d >= yesterday) return "Yesterday";
    if (d >= lastWeek) return "Previous 7 Days";
    return "Older";
  };

  const groupedConvs = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": []
  };

  filteredConvs.forEach(c => {
    groupedConvs[getGroup(c)].push(c);
  });

  if (isCollapsed) {
    return (
      <aside
        style={{
          width: 48,
          height: "100vh",
          background: "var(--bg-surface, #EDE8E0)",
          borderRight: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          userSelect: "none",
          paddingTop: 14
        }}
      >
        <div
          onClick={handleToggleCollapse}
          title="Expand Nexus Sidebar"
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginBottom: 14,
            borderRadius: 8,
            transition: "background 0.2s"
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 0L13.5 8.5L22 10L14.5 13.5L16 22L11 15.5L4 19L7.5 12L0 8.5L8.5 7.5L12 0Z" fill="#D4622B" />
          </svg>
        </div>
        <button onClick={handleToggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }}>☰</button>
        <button onClick={() => { if (onNewChat) onNewChat(); else if (onNavigate) onNavigate("workspace", null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }} title="New Chat">＋</button>
        <button onClick={() => { if (onOpenSearchModal) onOpenSearchModal(); else window.dispatchEvent(new CustomEvent('nexus-open-search-modal')); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }} title="Search (Ctrl+K)">🔍</button>
        <button onClick={() => onNavigate && onNavigate("projects")} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }} title="Projects">📁</button>
        <button onClick={() => onNavigate && onNavigate("home")} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }} title="Home">🏠</button>
        <button onClick={() => onNavigate && onNavigate("workspace")} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }} title="Workspace">💼</button>
        <button onClick={() => onNavigate && onNavigate("screen-designer")} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 20, fontSize: 18 }} title="SAP Screen Designer">🖥️</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowSettingsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 18 }} title="Settings">⚙️</button>
      </aside>
    );
  }

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleToggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: "var(--text-muted, #78716C)" }}>☰</button>
            <div 
              onClick={() => onNavigate && onNavigate("home")} 
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              title="Nexus Studio - Home"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, filter: "drop-shadow(0 1px 3px rgba(212, 98, 43, 0.25))" }}>
                <path d="M12 0L13.5 8.5L22 10L14.5 13.5L16 22L11 15.5L4 19L7.5 12L0 8.5L8.5 7.5L12 0Z" fill="#D4622B" />
              </svg>
              <span
                style={{
                  fontFamily: "'Newsreader', 'Lora', 'Source Serif 4', Georgia, serif",
                  fontSize: 21,
                  fontWeight: 600,
                  color: "var(--text-primary, #1C1917)",
                  letterSpacing: "-0.015em"
                }}
              >
                Nexus
              </span>
            </div>
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

        {/* Clean Claude.ai Primary Navigation Grounded in Claude Reference */}
        <div style={{ padding: "10px 14px 8px", display: "flex", flexDirection: "column", gap: 3, borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))" }}>
          {/* + New Button */}
          <button
            type="button"
            onClick={() => {
              if (onNewChat) onNewChat();
              else if (onNavigate) onNavigate("workspace", null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "var(--bg-card, #FAF8F5)",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary)",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "all 0.12s ease",
              marginBottom: 4
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--orange, #6E1A2D)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.12))"; }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            <span>New</span>
          </button>

          {/* Search Item */}
          <div
            onClick={() => {
              if (onOpenSearchModal) {
                onOpenSearchModal();
              } else {
                window.dispatchEvent(new CustomEvent('nexus-open-search-modal'));
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover, rgba(0,0,0,0.04))"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 14 }}>🔍</span>
            <span>Search</span>
            <span style={{ marginLeft: "auto", fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Ctrl+K</span>
          </div>

          {/* Projects Gallery Item */}
          <div
            onClick={() => onNavigate && onNavigate("projects")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: activeView === "projects" || activeView === "project-detail" ? 700 : 500,
              color: activeView === "projects" || activeView === "project-detail" ? "var(--burgundy-rich, #6E1A2D)" : "var(--text-primary)",
              background: activeView === "projects" || activeView === "project-detail" ? "var(--burgundy-light, rgba(110,26,45,0.08))" : "transparent",
              cursor: "pointer",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={(e) => {
              if (activeView !== "projects" && activeView !== "project-detail") {
                e.currentTarget.style.background = "var(--bg-card-hover, rgba(0,0,0,0.04))";
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== "projects" && activeView !== "project-detail") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: 14 }}>📁</span>
            <span>Projects</span>
          </div>

          {/* Code / Screen Designer Item */}
          <div
            onClick={() => onNavigate && onNavigate("screen-designer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover, rgba(0,0,0,0.04))"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700 }}>&lt;/&gt;</span>
            <span>Code</span>
          </div>

          {/* Customize / Settings Item */}
          <div
            onClick={() => setShowSettingsModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover, rgba(0,0,0,0.04))"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 14 }}>⚙️</span>
            <span>Customize</span>
          </div>
        </div>

        {/* 2. Chats and Tasks Section (Full Height Sidebar List) */}
        <div style={{ padding: "14px 14px 10px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
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

          <div style={{ marginBottom: 12, position: 'relative' }}>
            <input
              type="text"
              id="nexus-sidebar-search-input"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '6px 24px 6px 8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                &times;
              </button>
            )}
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
            ) : filteredConvs.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-muted, #78716C)", padding: "12px 6px" }}>
                No conversations match your search.
              </div>
            ) : (
              ["Today", "Yesterday", "Previous 7 Days", "Older"].map(group => {
                const groupConvs = groupedConvs[group];
                if (groupConvs.length === 0) return null;
                return (
                  <React.Fragment key={group}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: 'rgba(255,255,255,0.35)',
                      padding: '12px 16px 4px'
                    }}>
                      {group}
                    </div>
                    {groupConvs.map((c) => {
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
                              fontSize: 13.5,
                              fontFamily: "var(--font-sans)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.4,
                              flex: 1
                            }}
                          >
                            {title}
                          </span>
                          {(c.project_name || c.projectName || c.project_id || c.projectId) && (
                            <span
                              title={`Project: ${c.project_name || c.projectName || "Attached"}`}
                              style={{
                                fontSize: 10,
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: "var(--burgundy-light, rgba(110,26,45,0.08))",
                                color: "var(--burgundy, #6E1A2D)",
                                border: "1px solid var(--burgundy-border, rgba(110,26,45,0.18))",
                                fontWeight: 600,
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2
                              }}
                            >
                              📁 {c.project_name || c.projectName || "Project"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
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

      {/* GenAI Preferences Modal */}
      <GenAiPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />

      {/* GenAI Bookmarks Modal */}
      <GenAiBookmarksModal
        isOpen={showBookmarksModal}
        onClose={() => setShowBookmarksModal(false)}
      />

      {/* GenAI Prompt Templates Modal */}
      <GenAiPromptTemplatesModal
        isOpen={showPromptTemplatesModal}
        onClose={() => setShowPromptTemplatesModal(false)}
        onSelectTemplate={(templateText) => {
          if (window.nexusInsertPrompt) {
            window.nexusInsertPrompt(templateText);
          } else {
            navigator.clipboard?.writeText(templateText);
            alert("Template copied to clipboard!");
          }
        }}
      />

      {/* GenAI SAP Quiz Modal */}
      <GenAiQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />

      {/* GenAI Docs Library Modal */}
      <GenAiDocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
        onOpenDoc={(doc) => {
          window.dispatchEvent(new CustomEvent('nexus-open-doc', { detail: doc }));
          if (onNavigate) onNavigate('workspace');
        }}
      />

      {/* GenAI Analytics & Digest Modal */}
      <GenAiAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </>
  );
}
