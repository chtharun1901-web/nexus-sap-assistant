import { useState, useEffect } from "react";
import { api } from "../api.js";
import UserSettingsModal from "./UserSettingsModal.jsx";

export default function EnterpriseHeader({ user, onLogout, onNavigate, activeTopic, activeSessionId, currentWallpaper = "none", onWallpaperChange, onStartTour }) {
  const [clock, setClock] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [ctx, setCtx] = useState("S/4HANA 2023 - Embedded EWM");
  const [headerSearch, setHeaderSearch] = useState("");
  const [showWallpapers, setShowWallpapers] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedHeaderSession, setCopiedHeaderSession] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + 5.5 * 3600000);
      setClock(ist.toISOString().substring(11, 19) + " IST");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const loadNotifications = () => {
    api.getNotifications()
      .then((d) => {
        const notifs = d.notifications || [];
        setNotifications(notifs);
        const unread = notifs.filter((n) => !n.read_at && !n.read_status).length;
        setNotifCount(unread);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    api.getContexts().then((d) => {
      if (d.contexts?.[0]) setCtx(d.contexts[0].display_name || ctx);
    }).catch(() => {});
  }, []);

  const handleToggleNotifs = () => {
    const nextState = !showNotifs;
    setShowNotifs(nextState);
    if (nextState) {
      loadNotifications();
      setShowWallpapers(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.readAllNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: 1, read_at: new Date().toISOString() })));
      setNotifCount(0);
    } catch (e) {}
  };

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (q && onNavigate) {
      onNavigate("workspace", q);
      setHeaderSearch("");
    }
  };

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "#0B0E14",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "var(--font-sans)",
          flexShrink: 0,
          zIndex: 90
        }}
      >
        <div id="tour-system-status" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => onNavigate && onNavigate("workspace")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#EDEDED",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
            title="Click to go to Investigation Workspace"
          >
            <span className="anim-status-beacon" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
            {ctx}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>

          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#71717A", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--orange)" }}>◆</span> Mode: Limited Phase 3 (Read-Only)
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span> Live SAP connector: Unavailable
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span> Execution: Disabled
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeSessionId && (
            <div
              onClick={() => {
                navigator.clipboard?.writeText(activeSessionId);
                setCopiedHeaderSession(true);
                setTimeout(() => setCopiedHeaderSession(false), 2000);
              }}
              title="Click to copy Active Session Reference ID"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "#EDEDED",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              <span style={{ color: "var(--orange)", fontWeight: 700 }}>SESSION:</span>
              <span style={{ fontWeight: 600, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeSessionId}
              </span>
              <span style={{ fontSize: 9.5, color: copiedHeaderSession ? "var(--green)" : "var(--text-muted)" }}>
                {copiedHeaderSession ? "✓" : "📋"}
              </span>
            </div>
          )}
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#71717A" }}>{clock}</span>

          {/* Global Search Everything in Workspace */}
          <form onSubmit={handleHeaderSearch} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 6,
                padding: "3px 8px",
                width: 170
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" style={{ marginRight: 6 }}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search everything..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#EDEDED",
                  fontSize: 11.5,
                  width: "100%",
                  fontFamily: "var(--font-sans)"
                }}
              />
              <span style={{ fontSize: 9.5, color: "#71717A", fontFamily: "var(--font-mono)" }}>↵</span>
            </div>
          </form>

          {/* Tour Guide Trigger */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              title="Start Interactive Guided Tour"
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                color: "#FBBF24",
                borderRadius: 6,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <span>🧭</span>
              <span>Tour</span>
            </button>
          )}

          {/* Wallpaper Switcher */}
          <div id="tour-wallpapers" style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowWallpapers(!showWallpapers);
                setShowNotifs(false);
              }}
              title="Sanjaya Divine Wallpapers"
              style={{
                background: showWallpapers || currentWallpaper !== "none" ? "rgba(245, 158, 11, 0.22)" : "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#FBBF24",
                borderRadius: 6,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <span>🛕</span>
              <span>Wallpaper</span>
            </button>

            {showWallpapers && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  width: 260,
                  background: "rgba(18, 14, 10, 0.95)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  borderRadius: 12,
                  backdropFilter: "blur(20px)",
                  padding: 12,
                  boxShadow: "0 14px 40px rgba(0,0,0,0.7)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "#FBBF24", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    🛕 SANJAYA WALLPAPERS
                  </span>
                  <button
                    onClick={() => setShowWallpapers(false)}
                    style={{ background: "none", border: "none", color: "#71717A", fontSize: 13, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                {[
                  { id: "sanjaya-palace", label: "Sanjaya Royal Palace", sub: "Golden Arches & Sunrise", file: "/wallpapers/sanjaya-palace.jpg" },
                  { id: "sanjaya-divine", label: "Divya Drishti Vision", sub: "Kurukshetra Tanjore Art", file: "/wallpapers/sanjaya-divine-vision.jpg" },
                  { id: "indian-banner", label: "Epic Indian Art Banner", sub: "Royal Traditional Art", file: "/wallpapers/indian-art-banner.jpg" },
                  { id: "indian-mandala", label: "Sacred Mandala Geometry", sub: "Intricate Cosmic Art", file: "/wallpapers/indian-art-mandala.jpg" },
                  { id: "none", label: "Obsidian Dark Minimal", sub: "Clean Enterprise Studio", file: null }
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      onWallpaperChange && onWallpaperChange(w.id);
                      setShowWallpapers(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: currentWallpaper === w.id ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.03)",
                      border: currentWallpaper === w.id ? "1px solid rgba(245,158,11,0.6)" : "1px solid rgba(255,255,255,0.06)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: w.file ? `url('${w.file}') center/cover` : "#0A0A0A",
                        border: "1px solid rgba(255,255,255,0.2)",
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: currentWallpaper === w.id ? "#FBBF24" : "#EDEDED", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {w.label}
                      </div>
                      <div style={{ fontSize: 10, color: "#A1A1AA" }}>{w.sub}</div>
                    </div>
                    {currentWallpaper === w.id && (
                      <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 800 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Button & Dropdown */}
          <div id="tour-notifications" style={{ position: "relative" }}>
            <button
              onClick={handleToggleNotifs}
              title="System & Sentinel Notifications"
              style={{
                background: showNotifs ? "rgba(212, 175, 55, 0.18)" : "none",
                border: showNotifs ? "1px solid rgba(212, 175, 55, 0.5)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                color: showNotifs || notifCount > 0 ? "#FDE68A" : "#A1A1AA",
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </button>

            {notifCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "var(--orange)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  pointerEvents: "none"
                }}
              >
                {notifCount}
              </span>
            )}

            {showNotifs && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  width: 360,
                  maxHeight: 460,
                  background: "rgba(18, 11, 6, 0.96)",
                  border: "1px solid rgba(212, 175, 55, 0.45)",
                  borderRadius: 14,
                  backdropFilter: "blur(20px)",
                  padding: 16,
                  boxShadow: "0 18px 50px rgba(0,0,0,0.85)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#FDE68A", fontFamily: "var(--font-mono)" }}>
                      🔔 NOTIFICATIONS
                    </span>
                    {notifCount > 0 && (
                      <span style={{ background: "rgba(255,85,0,0.2)", border: "1px solid var(--orange)", color: "var(--orange)", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                        {notifCount} new
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#D4AF37",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline"
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifs(false)}
                      style={{ background: "none", border: "none", color: "#A89D92", fontSize: 13, cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, paddingRight: 4 }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 12px", color: "#A89D92", fontSize: 12.5 }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = !n.read_at && !n.read_status;
                      return (
                        <div
                          key={n.id}
                          style={{
                            background: isUnread ? "rgba(212, 175, 55, 0.12)" : "rgba(255,255,255,0.03)",
                            border: isUnread ? "1px solid rgba(212, 175, 55, 0.35)" : "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 10,
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            position: "relative"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: isUnread ? "#FFF8E7" : "#D4C5B9" }}>
                              {n.title}
                            </div>
                            {isUnread && (
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF5500", marginTop: 4, flexShrink: 0 }} />
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#C4B8AB", lineHeight: 1.45 }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: 9.5, color: "#8E8276", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive User Button -> Opens User Settings & Control Center */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Open User Settings & Control Center (Settings, Themes, Skills, Addons, Connectors)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 20,
              padding: "3px 10px 3px 4px",
              cursor: "pointer",
              transition: "all 0.18s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#F59E0B";
              e.currentTarget.style.background = "rgba(245, 158, 11, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111",
                fontSize: 12,
                fontWeight: 800
              }}
            >
              {user?.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <span style={{ fontSize: 12, color: "#EDEDED", fontWeight: 600 }}>
              {user?.display_name || "User"}
            </span>
            <span style={{ fontSize: 10, color: "#71717A" }}>⚙️</span>
          </button>
        </div>
      </header>

      {/* User Settings & Control Center Modal */}
      <UserSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        onLogout={onLogout}
        currentWallpaper={currentWallpaper}
        onWallpaperChange={onWallpaperChange}
      />
    </>
  );
}
