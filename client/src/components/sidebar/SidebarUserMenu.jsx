import React, { useState, useEffect, useRef } from "react";

/**
 * SidebarUserMenu Component
 * Claude-style user profile card and dropup popover menu for the sidebar.
 * Restores all previously unreachable modal capabilities in an intuitive dropup interface.
 */
export default function SidebarUserMenu({
  user,
  onLogout,
  onToggleDarkMode,
  darkMode,
  onStartTour,
  onExportAll,
  onOpenSettings,
  onOpenPreferences,
  onOpenBookmarks,
  onOpenTemplates,
  onOpenQuiz,
  onOpenDocs,
  onOpenAnalytics,
  collapsed = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropup popover on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const userName =
    user?.name ||
    user?.display_name ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Test User");

  const userEmail = user?.email || "";
  const userInitial = (userName.charAt(0) || "U").toUpperCase();
  const planLabel =
    user?.plan ||
    (user?.tier === "free" ? "Free Plan" : "Enterprise Context");

  const handleAction = (callback) => {
    if (callback) callback();
    setIsOpen(false);
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: collapsed ? "center" : "stretch"
      }}
    >
      {/* Dropup Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="User profile and navigation menu"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            right: collapsed ? "auto" : 0,
            width: collapsed ? 250 : "100%",
            minWidth: 230,
            maxWidth: 280,
            background: "var(--bg-card, #FFFFFF)",
            border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))",
            borderRadius: 10,
            boxShadow:
              "0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)",
            padding: "6px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            userSelect: "none"
          }}
        >
          {/* User Profile Header in Popover */}
          <div
            style={{
              padding: "8px 10px 8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
              marginBottom: 4
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {userInitial}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary, #1C1917)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted, #78716C)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {userEmail || planLabel}
              </div>
            </div>
          </div>

          {/* Section 1: Modal & Exploration Capabilities */}
          <MenuItem
            icon="⚙️"
            label="Settings & Customization"
            onClick={() => handleAction(onOpenSettings)}
          />

          {onOpenPreferences && (
            <MenuItem
              icon="🎛️"
              label="AI Engine Preferences"
              onClick={() => handleAction(onOpenPreferences)}
            />
          )}

          <MenuItem
            icon="📝"
            label="Prompt Templates Library"
            onClick={() => handleAction(onOpenTemplates)}
          />

          <MenuItem
            icon="⭐"
            label="Bookmarks & Starred"
            onClick={() => handleAction(onOpenBookmarks)}
          />

          <MenuItem
            icon="📊"
            label="Session Digest & Analytics"
            onClick={() => handleAction(onOpenAnalytics)}
          />

          <MenuItem
            icon="🎓"
            label="SAP Certification Quiz"
            onClick={() => handleAction(onOpenQuiz)}
          />

          <MenuItem
            icon="📑"
            label="Offline SAP Docs Library"
            onClick={() => handleAction(onOpenDocs)}
          />

          <MenuDivider />

          {/* Section 2: Utilities */}
          <MenuItem
            icon="🌓"
            label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            badge={darkMode ? "Dark" : "Light"}
            onClick={() => {
              if (onToggleDarkMode) onToggleDarkMode();
              setIsOpen(false);
            }}
          />

          <MenuItem
            icon="📥"
            label="Export All Sessions"
            badge="JSON"
            onClick={() => handleAction(onExportAll)}
          />

          <MenuItem
            icon="🧭"
            label="Guided Tour"
            onClick={() => handleAction(onStartTour)}
          />

          <MenuDivider />

          {/* Section 3: Sign Out */}
          <MenuItem
            icon="🚪"
            label="Sign Out"
            isDestructive={true}
            onClick={() => handleAction(onLogout)}
          />
        </div>
      )}

      {/* User Profile Card Button */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title={`${userName} (${planLabel})`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background:
              "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            border: isOpen
              ? "2px solid var(--orange, #6E1A2D)"
              : "2px solid transparent",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.15s ease, border-color 0.15s ease",
            padding: 0,
            outline: "none"
          }}
        >
          {userInitial}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 8px",
            borderRadius: 8,
            background: isOpen
              ? "var(--bg-card-hover, rgba(0, 0, 0, 0.05))"
              : "var(--bg-card, #FFFFFF)",
            border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s ease, border-color 0.15s ease",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background:
                  "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11.5,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {userInitial}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                overflow: "hidden"
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary, #1C1917)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {userName}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 1
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 500,
                    padding: "0.5px 5px",
                    borderRadius: 4,
                    background:
                      "var(--burgundy-light, rgba(110, 26, 45, 0.08))",
                    color: "var(--burgundy, #6E1A2D)",
                    border:
                      "1px solid var(--burgundy-border, rgba(110, 26, 45, 0.18))",
                    whiteSpace: "nowrap"
                  }}
                >
                  {planLabel}
                </span>
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted, #78716C)",
              paddingLeft: 4,
              flexShrink: 0,
              userSelect: "none"
            }}
          >
            {isOpen ? "▴" : "▾"}
          </span>
        </button>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  badge,
  isDestructive = false,
  onClick,
  title
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "7px 10px",
        background: hovered
          ? isDestructive
            ? "var(--red-light, rgba(239, 68, 68, 0.12))"
            : "var(--bg-card-hover, rgba(0, 0, 0, 0.05))"
          : "transparent",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "13px",
        fontWeight: isDestructive ? 500 : 450,
        color: isDestructive
          ? "var(--red, #EF4444)"
          : "var(--text-primary, #1C1917)",
        transition: "background 0.15s ease, color 0.15s ease",
        fontFamily: "inherit"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <span style={{ fontSize: "14px", lineHeight: 1, flexShrink: 0 }}>
          {icon}
        </span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {label}
        </span>
      </div>
      {badge && (
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 500,
            padding: "1px 6px",
            borderRadius: "10px",
            background: "var(--border-subtle, rgba(0, 0, 0, 0.06))",
            color: "var(--text-muted, #78716C)",
            marginLeft: "8px",
            flexShrink: 0
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MenuDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: "var(--border-subtle, rgba(0, 0, 0, 0.08))",
        margin: "4px 2px"
      }}
    />
  );
}
