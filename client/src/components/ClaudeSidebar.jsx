import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import UserSettingsModal from "./UserSettingsModal.jsx";
import GenAiPreferencesModal from "./GenAiPreferencesModal.jsx";
import GenAiBookmarksModal from "./GenAiBookmarksModal.jsx";
import GenAiPromptTemplatesModal from "./GenAiPromptTemplatesModal.jsx";
import GenAiQuizModal from "./GenAiQuizModal.jsx";
import GenAiAnalyticsModal from "./GenAiAnalyticsModal.jsx";
import GenAiDocsModal from "./GenAiDocsModal.jsx";

import SidebarNavStudio from "./sidebar/SidebarNavStudio.jsx";
import SidebarUserMenu from "./sidebar/SidebarUserMenu.jsx";
import SidebarConversationItem from "./sidebar/SidebarConversationItem.jsx";

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showPromptTemplatesModal, setShowPromptTemplatesModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  // Pinned conversations persisted in localStorage
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("nexus_pinned_conversations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
        const exists = prev.some((c) => (c.session_id || c.id) === (updated.session_id || updated.id));
        if (exists) {
          return prev.map((c) =>
            (c.session_id || c.id) === (updated.session_id || updated.id) ? { ...c, ...updated } : c
          );
        }
        return [updated, ...prev];
      });
      loadConversations();
    };

    window.addEventListener("nexus-conversation-updated", handleConvUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("nexus-conversation-updated", handleConvUpdate);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setAutoCollapsed(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isCollapsed = collapsed !== undefined ? (collapsed || autoCollapsed) : autoCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse(!isCollapsed);
    else setAutoCollapsed((prev) => !prev);
  };

  const handlePinToggle = (sid) => {
    setPinnedIds((prev) => {
      const next = prev.includes(sid) ? prev.filter((id) => id !== sid) : [sid, ...prev];
      localStorage.setItem("nexus_pinned_conversations", JSON.stringify(next));
      return next;
    });
  };

  const handleRename = async (sid, newTitle) => {
    if (!sid || !newTitle.trim()) return;
    try {
      await api.updateConversation(sid, { title: newTitle.trim() });
      setConversations((prev) =>
        prev.map((c) => ((c.session_id || c.id) === sid ? { ...c, title: newTitle.trim() } : c))
      );
      window.dispatchEvent(
        new CustomEvent("nexus-conversation-updated", { detail: { id: sid, title: newTitle.trim() } })
      );
    } catch (err) {
      console.warn("Rename conversation failed:", err);
    }
  };

  const handleDelete = async (sid) => {
    if (!sid) return;
    if (!window.confirm("Delete this conversation session?")) return;
    try {
      await api.deleteConversation(sid);
      setConversations((prev) => prev.filter((c) => (c.session_id || c.id) !== sid));
      setPinnedIds((prev) => {
        const next = prev.filter((id) => id !== sid);
        localStorage.setItem("nexus_pinned_conversations", JSON.stringify(next));
        return next;
      });
      if (activeSessionId === sid) {
        if (onNewChat) onNewChat();
        else if (onNavigate) onNavigate("workspace", null);
      }
    } catch (err) {
      console.warn("Delete conversation failed:", err);
    }
  };

  const handleExportAll = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Nexus_Sessions_Export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredConvs = conversations.filter(
    (c) => !searchFilter || c.title?.toLowerCase().includes(searchFilter.toLowerCase())
  );

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

  // Split into pinned and unpinned
  const pinnedConvs = filteredConvs.filter((c) => pinnedIds.includes(c.session_id || c.id));
  const unpinnedConvs = filteredConvs.filter((c) => !pinnedIds.includes(c.session_id || c.id));

  const groupedConvs = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": []
  };

  unpinnedConvs.forEach((c) => {
    groupedConvs[getGroup(c)].push(c);
  });

  // COLLAPSED SIDEBAR (Icon-only mode)
  if (isCollapsed) {
    return (
      <aside
        style={{
          width: 52,
          height: "100vh",
          background: "var(--bg-surface, #FAF9F5)",
          borderRight: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          userSelect: "none",
          paddingTop: 12,
          paddingBottom: 12,
          boxSizing: "border-box"
        }}
      >
        {/* Logo & Expand Toggle */}
        <div
          onClick={handleToggleCollapse}
          title="Expand Sidebar"
          style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginBottom: 10,
            borderRadius: 8,
            transition: "background 0.15s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 0L13.5 8.5L22 10L14.5 13.5L16 22L11 15.5L4 19L7.5 12L0 8.5L8.5 7.5L12 0Z" fill="#D4622B" />
          </svg>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => { if (onNewChat) onNewChat(); else if (onNavigate) onNavigate("workspace", null); }}
          style={collapsedIconBtnStyle}
          title="New Chat (+)"
        >
          ＋
        </button>

        <button
          onClick={() => {
            if (onOpenSearchModal) onOpenSearchModal();
            else window.dispatchEvent(new CustomEvent("nexus-open-search-modal"));
          }}
          style={collapsedIconBtnStyle}
          title="Search (Ctrl+K)"
        >
          🔍
        </button>

        <button
          onClick={() => onNavigate && onNavigate("projects")}
          style={{
            ...collapsedIconBtnStyle,
            background: activeView === "projects" || activeView === "project-detail" ? "rgba(212, 98, 43, 0.12)" : "transparent"
          }}
          title="Projects Gallery"
        >
          📁
        </button>

        <div style={{ width: 26, height: 1, background: "var(--border-subtle, rgba(0,0,0,0.08))", margin: "8px 0" }} />

        {/* Studio Tools Collapsed Icons */}
        <SidebarNavStudio
          activeView={activeView}
          onNavigate={onNavigate}
          collapsed={true}
          onOpenTemplates={() => setShowPromptTemplatesModal(true)}
          onOpenBookmarks={() => setShowBookmarksModal(true)}
        />

        <div style={{ flex: 1 }} />

        {/* Collapsed User Avatar Popover */}
        <SidebarUserMenu
          user={user}
          onLogout={onLogout}
          onToggleDarkMode={onToggleDarkMode}
          darkMode={darkMode}
          onStartTour={onStartTour}
          onExportAll={handleExportAll}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenPreferences={() => setShowPreferencesModal(true)}
          onOpenBookmarks={() => setShowBookmarksModal(true)}
          onOpenTemplates={() => setShowPromptTemplatesModal(true)}
          onOpenQuiz={() => setShowQuizModal(true)}
          onOpenDocs={() => setShowDocsModal(true)}
          onOpenAnalytics={() => setShowAnalyticsModal(true)}
          collapsed={true}
        />
      </aside>
    );
  }

  // EXPANDED SIDEBAR (Full Claude layout)
  return (
    <>
      <aside
        style={{
          width: 275,
          height: "100vh",
          background: "var(--bg-surface, #FAF9F5)",
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
            <button
              onClick={handleToggleCollapse}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: "var(--text-muted, #78716C)",
                padding: "2px 4px",
                borderRadius: 4
              }}
              title="Collapse sidebar"
            >
              ☰
            </button>
            <div
              onClick={() => onNavigate && onNavigate("home")}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              title="Nexus Home"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
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
              fontSize: 13,
              color: "var(--text-muted, #78716C)",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 4
            }}
            title="Overview Dashboard"
          >
            🏠
          </button>
        </div>

        {/* Primary Action & Navigation */}
        <div
          style={{
            padding: "10px 14px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))"
          }}
        >
          {/* + New Chat Button */}
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
              background: "var(--bg-card, #FFFFFF)",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-primary, #1C1917)",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "all 0.12s ease",
              marginBottom: 4
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4622B"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.14))"; }}
          >
            <span style={{ fontSize: 16, color: "#D4622B" }}>+</span>
            <span>New Chat</span>
          </button>

          {/* Search Item */}
          <div
            onClick={() => {
              if (onOpenSearchModal) {
                onOpenSearchModal();
              } else {
                window.dispatchEvent(new CustomEvent("nexus-open-search-modal"));
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
              color: "var(--text-primary, #1C1917)",
              cursor: "pointer",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 14 }}>🔍</span>
            <span>Search</span>
            <span style={{ marginLeft: "auto", fontSize: 10.5, fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted, #78716C)" }}>
              Ctrl+K
            </span>
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
              color: activeView === "projects" || activeView === "project-detail" ? "#D4622B" : "var(--text-primary, #1C1917)",
              background: activeView === "projects" || activeView === "project-detail" ? "rgba(212, 98, 43, 0.08)" : "transparent",
              cursor: "pointer",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={(e) => {
              if (activeView !== "projects" && activeView !== "project-detail") {
                e.currentTarget.style.background = "rgba(0,0,0,0.04)";
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
        </div>

        {/* RESTORED SAP ARCHITECTURE STUDIO & KNOWLEDGE TOOLS */}
        <SidebarNavStudio
          activeView={activeView}
          onNavigate={onNavigate}
          collapsed={false}
          onOpenTemplates={() => setShowPromptTemplatesModal(true)}
          onOpenBookmarks={() => setShowBookmarksModal(true)}
        />

        {/* CHATS AND TASKS SECTION */}
        <div style={{ padding: "12px 14px 6px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted, #78716C)",
                letterSpacing: "0.06em",
                textTransform: "uppercase"
              }}
            >
              Chats & Tasks
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted, #78716C)" }}>
              {conversations.length}
            </span>
          </div>

          {/* Search Conversations Input */}
          <div style={{ marginBottom: 10, position: "relative" }}>
            <input
              type="text"
              id="nexus-sidebar-search-input"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: "100%",
                padding: "6px 26px 6px 9px",
                background: "var(--bg-card, #FFFFFF)",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                borderRadius: "6px",
                color: "var(--text-primary, #1C1917)",
                fontSize: "12px",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                style={{
                  position: "absolute",
                  right: "6px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted, #78716C)",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                &times;
              </button>
            )}
          </div>

          {/* Conversations Scroll Container */}
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
              <>
                {/* 📌 Pinned Conversations Group */}
                {pinnedConvs.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#D4622B",
                        padding: "8px 8px 4px"
                      }}
                    >
                      📌 Pinned
                    </div>
                    {pinnedConvs.map((c) => {
                      const sid = c.session_id || c.id;
                      const isSelected = activeSessionId === sid;
                      return (
                        <SidebarConversationItem
                          key={sid}
                          conversation={c}
                          isSelected={isSelected}
                          isPinned={true}
                          onSelect={(id) => {
                            if (onSelectSession) onSelectSession(id);
                            if (onNavigate) onNavigate("workspace", null);
                          }}
                          onRename={handleRename}
                          onPinToggle={handlePinToggle}
                          onDelete={handleDelete}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Standard Date Groups */}
                {["Today", "Yesterday", "Previous 7 Days", "Older"].map((group) => {
                  const groupConvs = groupedConvs[group];
                  if (groupConvs.length === 0) return null;
                  return (
                    <React.Fragment key={group}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--text-muted, #78716C)",
                          padding: "10px 8px 4px"
                        }}
                      >
                        {group}
                      </div>
                      {groupConvs.map((c) => {
                        const sid = c.session_id || c.id;
                        const isSelected = activeSessionId === sid;
                        return (
                          <SidebarConversationItem
                            key={sid}
                            conversation={c}
                            isSelected={isSelected}
                            isPinned={false}
                            onSelect={(id) => {
                              if (onSelectSession) onSelectSession(id);
                              if (onNavigate) onNavigate("workspace", null);
                            }}
                            onRename={handleRename}
                            onPinToggle={handlePinToggle}
                            onDelete={handleDelete}
                          />
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* RESTORED CLAUDE-STYLE USER PROFILE BAR WITH DROPDOWN POPOVER */}
        <SidebarUserMenu
          user={user}
          onLogout={onLogout}
          onToggleDarkMode={onToggleDarkMode}
          darkMode={darkMode}
          onStartTour={onStartTour}
          onExportAll={handleExportAll}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenPreferences={() => setShowPreferencesModal(true)}
          onOpenBookmarks={() => setShowBookmarksModal(true)}
          onOpenTemplates={() => setShowPromptTemplatesModal(true)}
          onOpenQuiz={() => setShowQuizModal(true)}
          onOpenDocs={() => setShowDocsModal(true)}
          onOpenAnalytics={() => setShowAnalyticsModal(true)}
          collapsed={false}
        />
      </aside>

      {/* ALL MODALS RENDERED & FULLY FUNCTIONAL */}
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

      {showPreferencesModal && (
        <GenAiPreferencesModal
          isOpen={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
        />
      )}

      {showBookmarksModal && (
        <GenAiBookmarksModal
          isOpen={showBookmarksModal}
          onClose={() => setShowBookmarksModal(false)}
        />
      )}

      {showPromptTemplatesModal && (
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
      )}

      {showQuizModal && (
        <GenAiQuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
        />
      )}

      {showDocsModal && (
        <GenAiDocsModal
          isOpen={showDocsModal}
          onClose={() => setShowDocsModal(false)}
          onOpenDoc={(doc) => {
            window.dispatchEvent(new CustomEvent("nexus-open-doc", { detail: doc }));
            if (onNavigate) onNavigate("workspace");
          }}
        />
      )}

      {showAnalyticsModal && (
        <GenAiAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}
    </>
  );
}

const collapsedIconBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  marginBottom: 12,
  fontSize: 18,
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  color: "var(--text-primary, #1C1917)",
  transition: "background 0.15s ease"
};
