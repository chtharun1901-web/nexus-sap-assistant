import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * SidebarConversationItem
 * 
 * Interactive conversation item in the sidebar with hover actions, inline renaming,
 * pinning status, project badge pill, and context dropdown menu.
 */
export default function SidebarConversationItem({
  conversation = {},
  isSelected = false,
  isPinned = false,
  onSelect,
  onRename,
  onPinToggle,
  onDelete
}) {
  const sessionId = conversation.session_id || conversation.id || "";
  const displayTitle = conversation.title || sessionId || "Untitled";
  const projectName = conversation.project_name || conversation.projectName;

  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(displayTitle);

  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const editContainerRef = useRef(null);

  // Sync edit title with conversation title changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(displayTitle);
    }
  }, [displayTitle, isEditing]);

  // Focus and select input text when entering rename mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle outside click for context menu and rename mode
  useEffect(() => {
    if (!menuOpen && !isEditing) return;

    const handlePointerDownOutside = (e) => {
      // Close dropdown menu on outside click
      if (menuOpen) {
        if (
          menuRef.current &&
          !menuRef.current.contains(e.target) &&
          !menuButtonRef.current?.contains(e.target)
        ) {
          setMenuOpen(false);
        }
      }

      // Cancel inline renaming on outside click
      if (isEditing) {
        if (
          editContainerRef.current &&
          !editContainerRef.current.contains(e.target)
        ) {
          setEditTitle(conversation.title || sessionId || "");
          setIsEditing(false);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
    };
  }, [menuOpen, isEditing, conversation.title, sessionId]);

  const handleRowClick = () => {
    if (isEditing) return;
    if (onSelect) {
      onSelect(sessionId);
    }
  };

  const handleRowKeyDown = (e) => {
    if (isEditing) return;
    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
      e.preventDefault();
      if (onSelect) {
        onSelect(sessionId);
      }
    }
  };

  const handleStartRename = (e) => {
    if (e) e.stopPropagation();
    setMenuOpen(false);
    setEditTitle(conversation.title || sessionId || "");
    setIsEditing(true);
  };

  const handleCommitRename = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const trimmed = editTitle.trim();
      if (trimmed && trimmed !== conversation.title) {
        if (onRename) {
          onRename(sessionId, trimmed);
        }
      }
      setIsEditing(false);
    },
    [editTitle, conversation.title, onRename, sessionId]
  );

  const handleCancelRename = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setEditTitle(conversation.title || sessionId || "");
      setIsEditing(false);
    },
    [conversation.title, sessionId]
  );

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleCommitRename(e);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleCancelRename(e);
    }
  };

  const handleTogglePin = (e) => {
    if (e) e.stopPropagation();
    setMenuOpen(false);
    if (onPinToggle) {
      onPinToggle(sessionId);
    }
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation();
    setMenuOpen(false);
    if (onDelete) {
      onDelete(sessionId);
    }
  };

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "6px 8px",
    border: "none",
    background: "transparent",
    color: "var(--text-primary, #1C1917)",
    fontSize: "12.5px",
    fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
    fontWeight: 500,
    borderRadius: 5,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.1s ease"
  };

  return (
    <div
      role="button"
      tabIndex={isEditing ? -1 : 0}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 6,
        cursor: isEditing ? "default" : "pointer",
        background: isSelected
          ? "rgba(0, 0, 0, 0.07)"
          : isHovered || menuOpen
            ? "rgba(0, 0, 0, 0.035)"
            : "transparent",
        color: isSelected ? "var(--text-primary, #1C1917)" : "var(--text-body, #44403C)",
        fontWeight: isSelected ? 700 : 400,
        transition: "all 0.12s ease",
        position: "relative",
        userSelect: isEditing ? "text" : "none",
        outline: "none"
      }}
    >
      {/* 5px dot indicator (terracotta spark #D4622B when active, muted #78716C when inactive) */}
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: isSelected ? "#D4622B" : "#78716C",
          flexShrink: 0,
          transition: "background 0.15s ease"
        }}
      />

      {isEditing ? (
        /* Inline Rename Mode */
        <div
          ref={editContainerRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flex: 1,
            minWidth: 0
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleInputKeyDown}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: "13.5px",
              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #D4622B",
              outline: "none",
              background: "var(--bg-card, #FFFFFF)",
              color: "var(--text-primary, #1C1917)",
              boxShadow: "0 0 0 1px rgba(212, 98, 43, 0.25)"
            }}
          />
          <button
            type="button"
            title="Save rename"
            onClick={handleCommitRename}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#D4622B",
              fontSize: 13,
              fontWeight: 700,
              padding: "2px 5px",
              borderRadius: 4,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.1s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(212, 98, 43, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            ✓
          </button>
          <button
            type="button"
            title="Cancel rename"
            onClick={handleCancelRename}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted, #78716C)",
              fontSize: 12,
              padding: "2px 5px",
              borderRadius: 4,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.1s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        /* Regular Title & Metadata Display */
        <>
          {/* Title text with ellipsis truncation, font size 13.5px, bold when selected */}
          <span
            title={displayTitle}
            style={{
              fontSize: 13.5,
              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
              fontWeight: isSelected ? 700 : 400,
              color: isSelected ? "var(--text-primary, #1C1917)" : "var(--text-body, #44403C)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
              flex: 1,
              minWidth: 0
            }}
          >
            {displayTitle}
          </span>

          {/* Pinned icon badge 📌 if isPinned === true */}
          {isPinned && (
            <span
              title="Pinned to top"
              style={{
                fontSize: 11,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.85
              }}
            >
              📌
            </span>
          )}

          {/* Project badge pill if conversation.project_name exists */}
          {projectName && (
            <span
              title={`Project: ${projectName}`}
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--burgundy-light, rgba(110,26,45,0.08))",
                color: "var(--burgundy, #6E1A2D)",
                border: "1px solid var(--burgundy-border, rgba(110,26,45,0.18))",
                fontWeight: 600,
                flexShrink: 0,
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 2
              }}
            >
              📁 {projectName}
            </span>
          )}

          {/* Hover trigger: reveals a subtle ··· action button on the right */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              flexShrink: 0
            }}
          >
            {(isHovered || menuOpen) && (
              <button
                ref={menuButtonRef}
                type="button"
                title="Conversation options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                style={{
                  background: menuOpen ? "rgba(0, 0, 0, 0.08)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  padding: "1px 5px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                  lineHeight: 1,
                  color: "var(--text-muted, #78716C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.12s ease, color 0.12s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.color = "var(--text-primary, #1C1917)";
                }}
                onMouseLeave={(e) => {
                  if (!menuOpen) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted, #78716C)";
                  }
                }}
              >
                ···
              </button>
            )}

            {/* ··· Context Dropdown Menu */}
            {menuOpen && (
              <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 4px)",
                  zIndex: 100,
                  minWidth: 140,
                  background: "var(--bg-card, #FAF8F5)",
                  color: "var(--text-primary, #1C1917)",
                  border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)",
                  padding: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}
              >
                {/* ✏️ Rename */}
                <button
                  type="button"
                  onClick={handleStartRename}
                  style={menuItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-card-hover, rgba(0, 0, 0, 0.04))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 13 }}>✏️</span>
                  <span>Rename</span>
                </button>

                {/* 📌 Pin to Top / Unpin from Top */}
                <button
                  type="button"
                  onClick={handleTogglePin}
                  style={menuItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-card-hover, rgba(0, 0, 0, 0.04))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 13 }}>📌</span>
                  <span>{isPinned ? "Unpin from Top" : "Pin to Top"}</span>
                </button>

                <div
                  style={{
                    height: 1,
                    background: "var(--border-subtle, rgba(0, 0, 0, 0.08))",
                    margin: "2px 4px"
                  }}
                />

                {/* 🗑️ Delete */}
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    ...menuItemStyle,
                    color: "var(--red, #EF4444)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--red-light, rgba(239, 68, 68, 0.1))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 13 }}>🗑️</span>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
