import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api.js";
import ClaudeSidebar from "./components/ClaudeSidebar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import GuidedTour from "./components/GuidedTour.jsx";
import ValueStreamMapModal from "./components/ValueStreamMapModal.jsx";
import TaskInfoPopover from "./components/TaskInfoPopover.jsx";
import Welcome from "./views/Welcome.jsx";
import Home from "./views/Home.jsx";
import Workspace from "./views/Workspace.jsx";
import Cases from "./views/Cases.jsx";
import Knowledge from "./views/Knowledge.jsx";
import KnowledgeBase from "./views/KnowledgeBase.jsx";
import InterviewPrep from "./views/InterviewPrep.jsx";
import KeyboardShortcuts from "./components/KeyboardShortcuts.jsx";
import Nexus2Simulator from "./views/nexus2/Nexus2Simulator.jsx";
import NexusDataVisualizations from "./views/visualizations/NexusDataVisualizations.jsx";
import SapScreenDesigner from "./views/SapScreenDesigner.jsx";
import ProjectsView from "./views/ProjectsView.jsx";
import ProjectDetailView from "./views/ProjectDetailView.jsx";
import ProjectSearchModal from "./components/ProjectSearchModal.jsx";
import ImageLightbox from "./components/ImageLightbox.jsx";
import ClaudeArtifactSidecar from "./components/ClaudeArtifactSidecar.jsx";
import "./styles/theme.css";

export const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

export default function App() {
  const [user, setUser] = useState(undefined);
  const [authModal, setAuthModal] = useState(null);
  const [activeView, setActiveView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("view") === "visualizations" ||
        window.location.hash === "#visualizations" ||
        params.get("view") === "simulator" ||
        window.location.hash === "#simulator"
      ) {
        return "visualizations";
      }
    } catch (_) {}
    return "workspace";
  });
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [activeCaseDoc, setActiveCaseDoc] = useState(null);
  const [appWallpaper, setAppWallpaper] = useState(() => localStorage.getItem("sanjaya_app_wallpaper") || "none");
  const [showTour, setShowTour] = useState(false);
  const [showArtifactsModal, setShowArtifactsModal] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('nexus_theme_mode') || (localStorage.getItem('nexus_dark_mode') === 'true' ? 'dark' : 'oat');
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('nexus_focus_mode') === 'true');
  const [taskInfoOpen, setTaskInfoOpen] = useState(false);
  const [headerTaskInfo, setHeaderTaskInfo] = useState(null);
  const [taskInfoAnchorRect, setTaskInfoAnchorRect] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    const onTaskInfoEvent = (e) => {
      if (e.detail) setHeaderTaskInfo(e.detail);
    };
    const onOpenSearchEvent = () => setSearchModalOpen(true);
    const onConvUpdated = (e) => {
      if (e.detail?.title) {
        setActiveTopic(e.detail.title);
      }
      if (e.detail?.id) {
        setActiveSessionId(e.detail.id);
      }
    };

    window.addEventListener('nexus-task-info', onTaskInfoEvent);
    window.addEventListener('nexus-open-search-modal', onOpenSearchEvent);
    window.addEventListener('nexus-conversation-updated', onConvUpdated);

    return () => {
      window.removeEventListener('nexus-task-info', onTaskInfoEvent);
      window.removeEventListener('nexus-open-search-modal', onOpenSearchEvent);
      window.removeEventListener('nexus-conversation-updated', onConvUpdated);
    };
  }, []);

  const handleToggleTaskInfo = (e) => {
    if (taskInfoOpen) {
      setTaskInfoOpen(false);
      return;
    }
    const rect = e?.currentTarget?.getBoundingClientRect();
    if (rect) {
      setTaskInfoAnchorRect(rect);
    }
    if (!headerTaskInfo) {
      setHeaderTaskInfo({
        creditsUsed: 288,
        tokens: { prompt: 760, completion: 2120, total: 2880 },
        timeWorkedMs: 14500,
        model: "gemini-3.5-flash-lite",
        conversationId: activeSessionId,
        subagents: [
          {
            id: "sub-1",
            name: "Research SAP EWM & Process Order issues across standard catalogs",
            status: "completed"
          },
          {
            id: "sub-2",
            name: "Verify production safeguards & RFC queue integrity",
            status: "completed"
          }
        ]
      });
    }
    setTaskInfoOpen(true);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('nexus_theme_mode', themeMode);
    localStorage.setItem('nexus_dark_mode', themeMode === 'dark');
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('nexus_focus_mode', focusMode);
  }, [focusMode]);

  useEffect(() => {
    if (!themeMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('#nexus-theme-switcher-container')) {
        setThemeMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [themeMenuOpen]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('#nexus-header-export-dropdown')) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const handleWallpaperChange = (wId) => {
    setAppWallpaper(wId);
    if (wId) localStorage.setItem("sanjaya_app_wallpaper", wId);
    else localStorage.removeItem("sanjaya_app_wallpaper");
  };

  const wallpaperMap = {
    "sanjaya-palace": "linear-gradient(180deg, rgba(8,6,4,0.85) 0%, rgba(10,8,6,0.92) 100%), url('/wallpapers/sanjaya-palace.jpg') center top / cover no-repeat fixed",
    "sanjaya-divine": "linear-gradient(180deg, rgba(8,6,4,0.85) 0%, rgba(10,8,6,0.92) 100%), url('/wallpapers/sanjaya-divine-vision.jpg') center top / cover no-repeat fixed",
    "indian-banner": "linear-gradient(180deg, rgba(8,6,4,0.85) 0%, rgba(10,8,6,0.92) 100%), url('/wallpapers/indian-art-banner.jpg') center top / cover no-repeat fixed",
    "indian-mandala": "linear-gradient(180deg, rgba(8,6,4,0.85) 0%, rgba(10,8,6,0.92) 100%), url('/wallpapers/indian-art-mandala.jpg') center top / cover no-repeat fixed",
  };

  useEffect(() => {
    api.me().then(d => {
      const u = d.user || null;
      setUser(u);
      if (u && u.id) {
        handleNewChat();
        const completed = localStorage.getItem("sanjaya_tour_completed_" + u.id);
        if (!completed) {
          setShowTour(true);
        }
      }
    }).catch(() => setUser(null));
  }, []);

  const login = (u) => {
    setUser(u);
    setAuthModal(null);
    handleNewChat();
    if (u && u.id) {
      const completed = localStorage.getItem("sanjaya_tour_completed_" + u.id);
      if (!completed) {
        setShowTour(true);
      }
    }
  };

  const logout = () => { api.logout().finally(() => setUser(null)); };

  const navigateTo = (view, topicOrProjectId = null, sessionId = null) => {
    if (view === "project-detail") {
      setActiveProjectId(topicOrProjectId);
    } else {
      setActiveTopic(topicOrProjectId || null);
    }
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
    setActiveView(view);
  };

  const handleNewChat = () => {
    const newId = "conv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    setActiveSessionId(newId);
    setActiveTopic(null);
    setActiveCaseDoc(null);
    setActiveSection("all");
    setActiveView("workspace");
  };

  const handleShareSession = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Session reference copied to clipboard!");
  };

  if (user === undefined) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg-main, #F5F1EB)",color:"var(--text-primary, #1C1917)",fontFamily:"Georgia, serif",fontSize:18}}>
      Loading Nexus...
    </div>
  );

  if (!user) return (
    <AuthCtx.Provider value={{ user, login, logout, setAuthModal }}>
      <Welcome
        onSignIn={() => setAuthModal("otp")}
        onRegister={() => setAuthModal("register")}
        onGoogleAuth={() => setAuthModal("otp")}
        onOtpLogin={() => setAuthModal("otp")}
      />
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onAuth={login}
          onSwitch={(m) => setAuthModal(m)}
        />
      )}
    </AuthCtx.Provider>
  );

  const viewEl = {
    home:      <Home onNavigate={navigateTo} />,
    projects:  <ProjectsView onNavigate={navigateTo} />,
    "project-detail": <ProjectDetailView projectId={activeProjectId} onNavigate={navigateTo} />,
    workspace: (
      <Workspace
        activeTopic={activeTopic}
        onNavigate={navigateTo}
        activeSessionId={activeSessionId}
        onSessionChange={setActiveSessionId}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onCaseDocChange={setActiveCaseDoc}
      />
    ),
    interview: <InterviewPrep onNavigate={navigateTo} />,
    cases:     <Cases onOpen={(c) => navigateTo("workspace", c.title || c.case_id)} />,
    knowledge: <Knowledge />,
    kb:        <KnowledgeBase />,
    visualizations: <NexusDataVisualizations onNavigate={navigateTo} />,
    simulator: <NexusDataVisualizations onNavigate={navigateTo} />,
    "screen-designer": <SapScreenDesigner onNavigate={navigateTo} />,
    "sap-designer": <SapScreenDesigner onNavigate={navigateTo} />,
  }[activeView] || (
    <Workspace
      activeTopic={activeTopic}
      onNavigate={navigateTo}
      activeSessionId={activeSessionId}
      onSessionChange={setActiveSessionId}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onCaseDocChange={setActiveCaseDoc}
    />
  );

  const currentBg = appWallpaper !== "none" ? (wallpaperMap[appWallpaper] || "var(--bg-main, #F5F1EB)") : "var(--bg-main, #F5F1EB)";

  if (activeView === "visualizations" || activeView === "simulator") {
    return (
      <AuthCtx.Provider value={{ user, login, logout, setAuthModal }}>
        <KeyboardShortcuts
          onFocusSearch={() => {}}
          onNewSession={handleNewChat}
          onStopStreaming={() => window.dispatchEvent(new CustomEvent('nexus-stop-streaming'))}
          onToggleDarkMode={() => setThemeMode(m => m === 'dark' ? 'oat' : 'dark')}
          onExport={() => window.dispatchEvent(new CustomEvent('nexus-export'))}
        />
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg-main)" }}>
          <ErrorBoundary>
            <NexusDataVisualizations onNavigate={navigateTo} />
          </ErrorBoundary>
        </div>
      </AuthCtx.Provider>
    );
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout, setAuthModal }}>
      <KeyboardShortcuts
        onFocusSearch={() => setSearchModalOpen(true)}
        onNewSession={handleNewChat}
        onStopStreaming={() => window.dispatchEvent(new CustomEvent('nexus-stop-streaming'))}
        onToggleDarkMode={() => setThemeMode(m => m === 'dark' ? 'oat' : 'dark')}
        onExport={() => window.dispatchEvent(new CustomEvent('nexus-export'))}
      />
      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: currentBg, transition: "background 0.3s ease" }}>
        {/* Full Claude Sidebar Grounded in Image 2 */}
        <ClaudeSidebar
          user={user}
          activeView={activeView}
          onNavigate={navigateTo}
          activeSessionId={activeSessionId}
          onSelectSession={(sid) => {
            setActiveSessionId(sid);
            setActiveView("workspace");
          }}
          onNewChat={handleNewChat}
          activeCaseDoc={activeCaseDoc}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onLogout={logout}
          currentWallpaper={appWallpaper}
          onWallpaperChange={handleWallpaperChange}
          onStartTour={() => setShowTour(true)}
          darkMode={themeMode === 'dark'}
          onToggleDarkMode={() => setThemeMode(m => m === 'dark' ? 'oat' : 'dark')}
          collapsed={focusMode}
          onToggleCollapse={(val) => setFocusMode(typeof val === 'boolean' ? val : f => !f)}
          onOpenSearchModal={() => setSearchModalOpen(true)}
        />

        {/* Main Content View with minimal Claude Top Bar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-main, #FFFFFF)" }}>
          {/* Claude Clean Top Bar */}
          <header
            style={{
              height: 48,
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-card, #FFFFFF)",
              borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
              flexShrink: 0
            }}
          >
            {/* Active Chat Title Dropdown (Exact Claude.ai Layout) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                maxWidth: "60%"
              }}
              title="Session Title"
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary, #1C1917)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {activeView === "projects"
                  ? "Projects Gallery"
                  : activeView === "project-detail"
                  ? "Project Workspace"
                  : (activeTopic || "New Chat")}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted, #78716C)" }}>▼</span>
            </div>

            {/* Right Side: Clean Claude Actions (Export ▾ + Theme Toggle + Clean Menu) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Header Export Dropdown (Clean Claude Header Style Grounded in Claude Reference) */}
              <div id="nexus-header-export-dropdown" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen(prev => !prev)}
                  title="Export Session & Artifacts"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    background: exportMenuOpen ? "var(--bg-surface, rgba(0,0,0,0.06))" : "var(--bg-card, #FFFFFF)",
                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--text-primary, #1C1917)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.06))"; }}
                  onMouseLeave={(e) => { if (!exportMenuOpen) e.currentTarget.style.background = "var(--bg-card, #FFFFFF)"; }}
                >
                  <span style={{ fontSize: 13, display: "inline-block", transform: "translateY(-0.5px)" }}>⤓</span>
                  <span>Export</span>
                  <span style={{ fontSize: 9, color: "var(--text-muted, #78716C)", marginLeft: 1 }}>▼</span>
                </button>
                {exportMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: "var(--bg-card, #FFFFFF)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                      borderRadius: 8,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      padding: "6px 0",
                      minWidth: 220,
                      zIndex: 1000,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    {[
                      { label: "Export Session to PPT", icon: "📽️", event: "nexus-export-ppt" },
                      { label: "Export to Word (.doc)", icon: "📄", event: "nexus-export-word" },
                      { label: "Export to Excel (.xls)", icon: "📊", event: "nexus-export-excel" },
                      { label: "Export Slide to PPTX", icon: "📽️", event: "nexus-export-pptx-slide" },
                      { label: "Value Stream Map", icon: "🗺️", event: "nexus-export-vsm" },
                      { label: "Auto-Summarize Session", icon: "✨", event: "nexus-auto-summarize" },
                      { label: "Save to Knowledge Base", icon: "📚", event: "nexus-save-kb" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent(item.event));
                          setExportMenuOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "8px 14px",
                          background: "transparent",
                          border: "none",
                          fontSize: 12.5,
                          fontFamily: "var(--font-sans)",
                          color: "var(--text-primary)",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background 0.12s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface, rgba(0,0,0,0.05))"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle (☀️ Warm Burgundy / 🌙 Horizon Dark) */}
              <button
                type="button"
                onClick={() => setThemeMode(m => m === 'dark' ? 'oat' : 'dark')}
                title={themeMode === 'dark' ? "Switch to Warm Burgundy" : "Switch to Horizon Dark"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  background: "transparent",
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                  borderRadius: 6,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {themeMode === 'dark' ? '🌙' : '☀️'}
              </button>

              {/* Discreet Share Button */}
              <button
                type="button"
                onClick={handleShareSession}
                title="Share conversation session"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  background: "transparent",
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                🔗
              </button>

              {/* Discreet Secondary Menu */}
              <button
                type="button"
                onClick={handleToggleTaskInfo}
                title="Task Telemetry"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 15,
                  color: "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                ⋯
              </button>
            </div>
          </header>

          {/* Main Full-Screen View Area with Claude Artifact Sidecar Split */}
          <main style={{ flex: 1, overflow: "hidden", position: "relative", background: "var(--bg-main, #FFFFFF)", display: "flex" }}>
            <div style={{ flex: 1, height: "100%", overflow: "hidden", position: "relative" }}>
              <ErrorBoundary>
                {viewEl}
              </ErrorBoundary>
            </div>
            {/* Claude Artifact 2.0 Live Docked Sidecar */}
            <ClaudeArtifactSidecar />
          </main>
        </div>
      </div>

      {/* Antigravity-style Task Info Popover */}
      <TaskInfoPopover
        isOpen={taskInfoOpen}
        onClose={() => setTaskInfoOpen(false)}
        taskInfo={headerTaskInfo}
        conversationId={activeSessionId}
        requestId={headerTaskInfo?.requestId}
        anchorRect={taskInfoAnchorRect}
      />

      {/* Interactive Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => {
          setShowTour(false);
          if (user?.id) localStorage.setItem("sanjaya_tour_completed_" + user.id, "true");
        }}
      />

      {/* Artifacts Studio Modal */}
      {showArtifactsModal && (
        <ValueStreamMapModal
          isOpen={showArtifactsModal}
          onClose={() => setShowArtifactsModal(false)}
          sessionId={activeSessionId}
        />
      )}
      {/* Global & In-Project Scoped Search Modal */}
      <ProjectSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        currentProjectId={activeProjectId}
        onNavigate={navigateTo}
      />

      {/* Global Fullscreen Image Lightbox with Zoom, Pan, Copy & Download */}
      <ImageLightbox />
    </AuthCtx.Provider>
  );
}
