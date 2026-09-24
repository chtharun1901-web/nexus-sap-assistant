import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api.js";
import ClaudeSidebar from "./components/ClaudeSidebar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import GuidedTour from "./components/GuidedTour.jsx";
import ValueStreamMapModal from "./components/ValueStreamMapModal.jsx";
import Welcome from "./views/Welcome.jsx";
import Home from "./views/Home.jsx";
import Workspace from "./views/Workspace.jsx";
import Cases from "./views/Cases.jsx";
import Knowledge from "./views/Knowledge.jsx";
import KnowledgeBase from "./views/KnowledgeBase.jsx";
import InterviewPrep from "./views/InterviewPrep.jsx";
import KeyboardShortcuts from "./components/KeyboardShortcuts.jsx";
import "./styles/theme.css";

export const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

export default function App() {
  const [user, setUser] = useState(undefined);
  const [authModal, setAuthModal] = useState(null);
  const [activeView, setActiveView] = useState("workspace");
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSection, setActiveSection] = useState("all");
  const [activeCaseDoc, setActiveCaseDoc] = useState(null);
  const [appWallpaper, setAppWallpaper] = useState(() => localStorage.getItem("sanjaya_app_wallpaper") || "none");
  const [showTour, setShowTour] = useState(false);
  const [showArtifactsModal, setShowArtifactsModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nexus_dark_mode') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('nexus_dark_mode', darkMode);
  }, [darkMode]);

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
    if (u && u.id) {
      const completed = localStorage.getItem("sanjaya_tour_completed_" + u.id);
      if (!completed) {
        setShowTour(true);
      }
    }
  };

  const logout = () => { api.logout().finally(() => setUser(null)); };

  const navigateTo = (view, topic = null) => {
    setActiveView(view);
    setActiveTopic(topic || null);
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
        onSignIn={() => setAuthModal("login")}
        onRegister={() => setAuthModal("register")}
        onGoogleAuth={() => setAuthModal("google")}
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

  return (
    <AuthCtx.Provider value={{ user, login, logout, setAuthModal }}>
      <KeyboardShortcuts
        onFocusSearch={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) textarea.focus();
        }}
        onNewSession={handleNewChat}
        onStopStreaming={() => window.dispatchEvent(new CustomEvent('nexus-stop-streaming'))}
        onToggleDarkMode={() => setDarkMode(d => !d)}
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
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Main Content View with minimal Claude Top Bar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-main, #F5F1EB)" }}>
          {/* Claude Clean Top Bar */}
          <header
            style={{
              height: 48,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-card, #FAF8F5)",
              borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
              flexShrink: 0
            }}
          >
            {/* Active Chat Title Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", maxWidth: "60%" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary, #1C1917)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeTopic || (activeSessionId ? `Session: ${activeSessionId}` : "Nexus SAP Process Architecture & Investigation Studio")}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted, #78716C)" }}>⌵</span>
            </div>

            {/* Top Right Actions: Share Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>Ctrl</span><span>+</span><span>K</span>
              </div>
              <button
                type="button"
                onClick={handleShareSession}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  background: "var(--bg-card, #FFFFFF)",
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.14))",
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text-primary, #1C1917)",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
                }}
              >
                <span>📄</span>
                <span>Share</span>
              </button>
            </div>
          </header>

          {/* Main Full-Screen View Area */}
          <main style={{ flex: 1, overflow: "hidden", position: "relative", background: "var(--bg-main, #F5F1EB)" }}>
            <ErrorBoundary>
              {viewEl}
            </ErrorBoundary>
          </main>
        </div>
      </div>

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
    </AuthCtx.Provider>
  );
}
