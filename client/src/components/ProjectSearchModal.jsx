import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

function highlightMatch(text, query) {
  if (!text || !query) return text;
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: "var(--amber-light, #FEF3C7)",
          color: "var(--amber-text, #92400E)",
          padding: "1px 3px",
          borderRadius: 3,
          fontWeight: 700
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function ProjectSearchModal({
  isOpen,
  onClose,
  currentProjectId = null,
  currentProjectName = null,
  onNavigate,
  onStartTour
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState(() => (currentProjectId ? "project" : "all"));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const quickActions = [
    {
      id: "qa-dashboard",
      icon: "📊",
      label: "Open QA & Telemetry Dashboard",
      hint: "Telemetry",
      keywords: "qa telemetry dashboard metrics testing",
      run: () => {
        window.dispatchEvent(new CustomEvent("nexus-open-qa-dashboard"));
        onClose();
      }
    },
    {
      id: "swarm-stealth",
      icon: "👻",
      label: "Toggle Swarm Stealth Mode (Alt+T)",
      hint: "Alt+T",
      keywords: "swarm stealth mode overlay cursor agents",
      run: () => {
        window.dispatchEvent(new CustomEvent("nexus-toggle-swarm-stealth"));
        onClose();
      }
    },
    {
      id: "scenario-studio",
      icon: "🧬",
      label: "Open WMS Scenario Model Studio",
      hint: "QA Studio",
      keywords: "wms scenario model generator test cases lattice studio",
      run: () => {
        if (onNavigate) onNavigate("scenario-studio");
        onClose();
      }
    },
    {
      id: "queue-simulator",
      icon: "🌊",
      label: "Open Queue Flow Simulator",
      hint: "Visualizations",
      keywords: "queue flow simulator visualizations rfc",
      run: () => {
        if (onNavigate) onNavigate("visualizations");
        onClose();
      }
    },
    {
      id: "screen-designer",
      icon: "🖥️",
      label: "Open Screen & Form Designer",
      hint: "Studio",
      keywords: "screen form designer sap ui studio",
      run: () => {
        if (onNavigate) onNavigate("screen-designer");
        onClose();
      }
    },
    {
      id: "knowledge-base",
      icon: "📚",
      label: "Open Knowledge Base",
      hint: "Docs",
      keywords: "knowledge base docs runbooks",
      run: () => {
        if (onNavigate) onNavigate("knowledge");
        onClose();
      }
    },
    {
      id: "guided-tour",
      icon: "✨",
      label: "Start Guided Tour",
      hint: "Help",
      keywords: "guided tour walkthrough help onboarding",
      run: () => {
        if (onStartTour) onStartTour();
        onClose();
      }
    }
  ];

  const trimmedQuery = query.trim().toLowerCase();
  const filteredQuickActions = trimmedQuery
    ? quickActions.filter(
        (action) =>
          action.label.toLowerCase().includes(trimmedQuery) ||
          action.keywords.toLowerCase().includes(trimmedQuery) ||
          action.hint.toLowerCase().includes(trimmedQuery)
      )
    : quickActions;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
      setScope(currentProjectId ? "project" : "all");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentProjectId]);

  // Global Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent("nexus-open-search-modal"));
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Live search debounced
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const pId = scope === "project" ? currentProjectId : undefined;
        let data;
        try {
          data = await api.globalSearch(query.trim(), pId);
        } catch (apiErr) {
          console.warn("api.globalSearch fallback to client search:", apiErr);
          // Fallback search across conversations
          const convRes = await api.getConversations().catch(() => ({ conversations: [] }));
          const convs = convRes.conversations || [];
          const q = query.toLowerCase();
          const matchedConvs = convs.filter((c) =>
            (c.title && c.title.toLowerCase().includes(q)) ||
            (c.id && c.id.toLowerCase().includes(q))
          );
          data = {
            sessions: matchedConvs,
            messages: [],
            files: []
          };
        }

        const normalized = {
          sessions: data?.sessions || data?.conversations || [],
          messages: data?.messages || data?.turns || [],
          files: data?.files || data?.documents || []
        };
        setResults(normalized);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, scope, currentProjectId]);

  // Flatten items for arrow key navigation
  const flatItems = [];
  filteredQuickActions.forEach((a) => flatItems.push({ type: "action", item: a }));
  if (results) {
    (results.sessions || []).forEach((s) => flatItems.push({ type: "session", item: s }));
    (results.messages || []).forEach((m) => flatItems.push({ type: "message", item: m }));
    (results.files || []).forEach((f) => flatItems.push({ type: "file", item: f }));
  }

  const handleSelectItem = (itemObj) => {
    if (!itemObj) return;
    if (itemObj.type === "action") {
      itemObj.item.run();
      return;
    }
    onClose();

    if (itemObj.type === "session") {
      const s = itemObj.item;
      const sid = s.session_id || s.id;
      if (onNavigate) {
        onNavigate("workspace", s.title, sid);
      }
    } else if (itemObj.type === "message") {
      const m = itemObj.item;
      const sid = m.session_id || m.conversation_id || m.sessionId;
      if (onNavigate) {
        onNavigate("workspace", m.session_title || "Search Result", sid);
      }
    } else if (itemObj.type === "file") {
      const f = itemObj.item;
      if (f.project_id || f.projectId) {
        if (onNavigate) {
          onNavigate("project-detail", f.project_id || f.projectId);
        }
      }
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelectItem(flatItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  let currentFlatIdx = 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 640,
          maxWidth: "92vw",
          background: "var(--bg-card, #FAF8F5)",
          border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
          borderRadius: 14,
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "75vh",
          fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
          color: "var(--text-primary, #1C1917)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Box */}
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <span style={{ fontSize: 18, color: "var(--text-muted)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              scope === "project" && currentProjectName
                ? `Search in ${currentProjectName} (sessions, messages, files)...`
                : "Search all sessions, SAP projects, and runbooks..."
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-primary)",
              fontFamily: "inherit"
            }}
          />
          {loading && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", animation: "spin 1s infinite linear" }}>
              ⚡
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              background: "var(--bg-surface, #EDE8E0)",
              border: "1px solid var(--border-subtle)",
              padding: "2px 6px",
              borderRadius: 4,
              color: "var(--text-muted)"
            }}
          >
            ESC
          </span>
        </div>

        {/* Scope Selector (Current Project vs All) */}
        {currentProjectId && (
          <div
            style={{
              padding: "8px 20px",
              background: "var(--bg-surface, #EDE8E0)",
              borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12
            }}
          >
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Scope:</span>
            <button
              type="button"
              onClick={() => setScope("project")}
              style={{
                padding: "3px 10px",
                borderRadius: 14,
                border: scope === "project" ? "1px solid var(--burgundy, #6E1A2D)" : "1px solid transparent",
                background: scope === "project" ? "var(--burgundy-light, rgba(110,26,45,0.1))" : "transparent",
                color: scope === "project" ? "var(--burgundy, #6E1A2D)" : "var(--text-muted)",
                fontWeight: scope === "project" ? 700 : 500,
                cursor: "pointer"
              }}
            >
              📁 Current Project ({currentProjectName || "Active"})
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              style={{
                padding: "3px 10px",
                borderRadius: 14,
                border: scope === "all" ? "1px solid var(--burgundy, #6E1A2D)" : "1px solid transparent",
                background: scope === "all" ? "var(--burgundy-light, rgba(110,26,45,0.1))" : "transparent",
                color: scope === "all" ? "var(--burgundy, #6E1A2D)" : "var(--text-muted)",
                fontWeight: scope === "all" ? 700 : 500,
                cursor: "pointer"
              }}
            >
              🌐 All Projects & Chats
            </button>
          </div>
        )}

        {/* Results Container */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {/* Quick Actions & Studio Tools Section */}
          {filteredQuickActions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "4px 8px 6px"
                }}
              >
                Quick Actions & Studio Tools
              </div>
              {filteredQuickActions.map((action) => {
                const thisIdx = currentFlatIdx++;
                const isSelected = selectedIndex === thisIdx;
                return (
                  <div
                    key={action.id}
                    onClick={() => handleSelectItem({ type: "action", item: action })}
                    onMouseEnter={() => setSelectedIndex(thisIdx)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: isSelected ? "var(--bg-surface, rgba(0,0,0,0.06))" : "transparent",
                      border: isSelected ? "1px solid var(--burgundy, #6E1A2D)" : "1px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 3,
                      transition: "background 0.12s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 15 }}>{action.icon}</span>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {query.trim() ? highlightMatch(action.label, query.trim()) : action.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                      {action.hint} ↵
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!query.trim() ? (
            <div style={{ padding: "14px 20px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 12.5 }}>
              Type to search conversations, specific SAP t-code advice, or attached runbooks.
            </div>
          ) : results && flatItems.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No matches found for <strong style={{ color: "var(--text-primary)" }}>"{query}"</strong>.
            </div>
          ) : (
            <div>
              {/* Sessions Category */}
              {results?.sessions && results.sessions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "4px 8px 6px"
                    }}
                  >
                    Conversations ({results.sessions.length})
                  </div>
                  {results.sessions.map((s) => {
                    const thisIdx = currentFlatIdx++;
                    const isSelected = selectedIndex === thisIdx;
                    return (
                      <div
                        key={s.id || s.session_id}
                        onClick={() => handleSelectItem({ type: "session", item: s })}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: isSelected ? "var(--bg-surface, rgba(0,0,0,0.06))" : "transparent",
                          border: isSelected ? "1px solid var(--burgundy, #6E1A2D)" : "1px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 3
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ fontSize: 15 }}>💬</span>
                          <span
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {highlightMatch(s.title || s.id, query)}
                          </span>
                          {(s.project_name || s.projectName || s.module) && (
                            <span
                              style={{
                                fontSize: 10.5,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "var(--burgundy-light, rgba(110,26,45,0.08))",
                                color: "var(--burgundy, #6E1A2D)",
                                fontWeight: 600
                              }}
                            >
                              {s.project_name || s.projectName || s.module}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Open ↵</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Messages Category */}
              {results?.messages && results.messages.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "4px 8px 6px"
                    }}
                  >
                    Turn Messages & Evidence ({results.messages.length})
                  </div>
                  {results.messages.map((m, idx) => {
                    const thisIdx = currentFlatIdx++;
                    const isSelected = selectedIndex === thisIdx;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectItem({ type: "message", item: m })}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: isSelected ? "var(--bg-surface, rgba(0,0,0,0.06))" : "transparent",
                          border: isSelected ? "1px solid var(--burgundy, #6E1A2D)" : "1px solid transparent",
                          marginBottom: 3
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                          💭 in {m.session_title || m.session_id}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-body)",
                            lineHeight: 1.4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          "{highlightMatch(m.snippet || m.content, query)}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Knowledge Files Category */}
              {results?.files && results.files.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "4px 8px 6px"
                    }}
                  >
                    Knowledge Files ({results.files.length})
                  </div>
                  {results.files.map((f) => {
                    const thisIdx = currentFlatIdx++;
                    const isSelected = selectedIndex === thisIdx;
                    return (
                      <div
                        key={f.id}
                        onClick={() => handleSelectItem({ type: "file", item: f })}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: isSelected ? "var(--bg-surface, rgba(0,0,0,0.06))" : "transparent",
                          border: isSelected ? "1px solid var(--burgundy, #6E1A2D)" : "1px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 3
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 15 }}>📄</span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {highlightMatch(f.name, query)}
                          </span>
                          {f.project_name && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>in {f.project_name}</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>View Project ↵</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: "8px 20px",
            borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            background: "var(--bg-surface, #EDE8E0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11.5,
            color: "var(--text-muted)"
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div>Nexus Quick Search</div>
        </div>
      </div>
    </div>
  );
}
