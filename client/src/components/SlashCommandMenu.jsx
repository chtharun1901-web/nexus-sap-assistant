import React, { useState, useEffect, useRef, useMemo } from "react";

export const COMMANDS = [
  {
    command: "/doc",
    label: "Create Nexus Doc",
    description: "Formulate an executive reference document from the prompt",
    prefix: "/doc ",
    icon: "📄",
    color: "#3B82F6",
    category: "Documentation & Deliverables",
    fullText: "Create Nexus Doc · Formulate an executive reference document from the prompt"
  },
  {
    command: "/vsm",
    label: "Value Stream Map",
    description: "Diagram manufacturing/logistics process lead time & scrap",
    prefix: "/vsm ",
    icon: "🗺️",
    color: "#10B981",
    category: "Documentation & Deliverables",
    fullText: "Value Stream Map · Diagram manufacturing/logistics process lead time & scrap"
  },
  {
    command: "/pptx",
    label: "Presentation Deck",
    description: "Build 16:9 widescreen PowerPoint slides",
    prefix: "/pptx ",
    icon: "📊",
    color: "#8A2435",
    category: "Documentation & Deliverables",
    fullText: "Presentation Deck · Build 16:9 widescreen PowerPoint slides"
  },
  {
    command: "/tcode",
    label: "T-Code Dictionary",
    description: "Deep dive into transaction codes, auth objects, and parameters",
    prefix: "/tcode ",
    icon: "🔍",
    color: "#F59E0B",
    category: "SAP Technical & Architecture",
    fullText: "T-Code Dictionary · Deep dive into transaction codes, auth objects, and parameters"
  },
  {
    command: "/safeguard",
    label: "Production Safeguard Audit",
    description: "Assess risks and rollback procedures before execution",
    prefix: "/safeguard ",
    icon: "🛡️",
    color: "#EC4899",
    category: "SAP Technical & Architecture",
    fullText: "Production Safeguard Audit · Assess risks and rollback procedures before execution"
  },
  {
    command: "/quiz",
    label: "SAP Practice Exam",
    description: "Generate certification scenario questions",
    prefix: "/quiz ",
    icon: "🎯",
    color: "#8B5CF6",
    category: "Certification & Knowledge",
    fullText: "SAP Practice Exam · Generate certification scenario questions"
  },
  {
    command: "/summary",
    label: "Executive Summary",
    description: "Synthesize the active case findings and key takeaways",
    prefix: "/summary ",
    icon: "📝",
    color: "#06B6D4",
    category: "Executive Insights",
    fullText: "Executive Summary · Synthesize the active case findings and key takeaways"
  },
  {
    command: "/deep-research",
    label: "Deep Autonomous RCA Investigation",
    description: "Launch multi-phase forensic investigation report with architecture and SOP",
    prefix: "/deep-research ",
    icon: "🔬",
    color: "#6E1A2D",
    category: "Gemini AI Intelligence",
    fullText: "Deep Autonomous RCA Investigation · Launch multi-phase forensic report with architecture and SOP"
  },
  {
    command: "/semantic",
    label: "Semantic Incident Matcher",
    description: "Dense vector retrieval across 2,292+ AMS tracker rows (Gemini Embedding 2)",
    prefix: "/semantic ",
    icon: "🎯",
    color: "#10B981",
    category: "Gemini AI Intelligence",
    fullText: "Semantic Incident Matcher · Dense vector retrieval across 2,292+ AMS tracker rows (Gemini Embedding 2)"
  },
  {
    command: "/tts",
    label: "Audio Shift Briefing",
    description: "Synthesize high-fidelity voice speech for floor walk (Gemini 3.8 Flash TTS)",
    prefix: "/tts ",
    icon: "🔊",
    color: "#D97706",
    category: "Gemini AI Intelligence",
    fullText: "Audio Shift Briefing · Synthesize high-fidelity voice speech for floor walk (Gemini 3.8 Flash TTS)"
  },
  {
    command: "/ocr",
    label: "Visual RF / Screen OCR Analyzer",
    description: "Extract SAP message class, number, and T-code from screenshot",
    prefix: "/ocr ",
    icon: "🖼️",
    color: "#3B82F6",
    category: "Gemini AI Intelligence",
    fullText: "Visual RF / Screen OCR Analyzer · Extract SAP message class, number, and T-code from screenshot"
  },
  {
    id: "code-execute",
    command: "/code",
    label: "/code",
    description: "Execute Python calculations (SLA, OTIF, throughput, analytics)",
    prefix: "/code ",
    icon: "🐍",
    color: "#10B981",
    category: "V2.0 Intelligence",
    fullText: "/code · Execute Python calculations (SLA, OTIF, throughput, analytics)"
  },
  {
    id: "cache-query",
    command: "/cache",
    label: "/cache",
    description: "Query the cached AMS incident knowledge base (75% cheaper, 3x faster)",
    prefix: "/cache ",
    icon: "⚡",
    color: "#EAB308",
    category: "V2.0 Intelligence",
    fullText: "/cache · Query the cached AMS incident knowledge base (75% cheaper, 3x faster)"
  },
  {
    id: "shift-handover",
    command: "/handover",
    label: "/handover",
    description: "Process shift audio memo into structured SOP & Handover Doc",
    prefix: "/handover ",
    icon: "🎧",
    color: "#8A2435",
    category: "V2.0 Intelligence",
    fullText: "/handover · Process shift audio memo into structured SOP & Handover Doc"
  },
  {
    id: "sap-agent",
    command: "/agent",
    label: "/agent",
    description: "Autonomous SAP agent: multi-step warehouse incident diagnosis & chained execution",
    prefix: "/agent ",
    icon: "🤖",
    color: "#6366F1",
    category: "V2.0 Intelligence",
    fullText: "/agent · Autonomous SAP agent: multi-step warehouse incident diagnosis & chained execution"
  },
  {
    id: "visual-layout",
    command: "/visual",
    label: "/visual",
    description: "Generate architectural warehouse layout or staging diagram",
    prefix: "/visual ",
    icon: "🎨",
    color: "#EC4899",
    category: "V2.0 Intelligence",
    fullText: "/visual · Generate architectural warehouse layout or staging diagram"
  }
];

export const SLASH_COMMANDS = COMMANDS;

export default function SlashCommandMenu({
  isOpen = false,
  search = "",
  onSelectCommand,
  onClose,
  style = {},
  className = ""
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popoverRef = useRef(null);
  const itemRefs = useRef([]);

  // Filter commands based on search text (query after '/')
  const filteredCommands = useMemo(() => {
    const query = (search || "").trim().toLowerCase().replace(/^\//, "");
    if (!query) return COMMANDS;

    return COMMANDS.filter((cmd) => {
      const rawCmd = cmd.command.replace(/^\//, "").toLowerCase();
      const withSlash = cmd.command.toLowerCase();
      const label = cmd.label.toLowerCase();
      const desc = cmd.description.toLowerCase();
      const full = (cmd.fullText || "").toLowerCase();
      const category = (cmd.category || "").toLowerCase();

      return (
        rawCmd.includes(query) ||
        withSlash.includes(query) ||
        label.includes(query) ||
        desc.includes(query) ||
        full.includes(query) ||
        category.includes(query)
      );
    });
  }, [search]);

  // Group filtered commands by category preserving order
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation & global listeners when isOpen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0
            ? (prev - 1 + filteredCommands.length) % filteredCommands.length
            : 0
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (filteredCommands.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const target = filteredCommands[selectedIndex] || filteredCommands[0];
          if (target) {
            onSelectCommand?.(target);
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, filteredCommands, selectedIndex, onSelectCommand, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`slash-command-menu ${className}`}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        right: 0,
        maxWidth: 620,
        margin: "0 auto",
        zIndex: 1000,
        background: "color-mix(in srgb, var(--bg-card, #1A1A1A) 92%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--border-strong, rgba(255, 255, 255, 0.14))",
        borderRadius: 12,
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: 380,
        color: "var(--text-primary, #EDEDED)",
        fontFamily: "var(--font-sans, sans-serif)",
        animation: "slashFadeIn 0.12s ease-out",
        ...style
      }}
    >
      {/* Popover Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          background: "rgba(0, 0, 0, 0.12)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--orange, #E8614D)" }}>⚡</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-muted, #8B8B8B)"
            }}
          >
            Nexus Slash Commands
          </span>
        </div>
        {search && (
          <span
            style={{
              fontSize: 10.5,
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--text-muted, #71717A)",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "2px 6px",
              borderRadius: 4
            }}
          >
            matching: /{search}
          </span>
        )}
      </div>

      {/* Commands List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "6px"
        }}
      >
        {filteredCommands.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "var(--text-muted, #8B8B8B)",
              fontSize: 13
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>🔍</div>
            <div>
              No slash commands matching{" "}
              <strong style={{ color: "var(--text-primary, #EDEDED)" }}>
                /{search}
              </strong>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-faint, #71717A)",
                marginTop: 6
              }}
            >
              Press <kbd style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))", borderRadius: 3, padding: "1px 4px", fontSize: 10, fontFamily: "var(--font-mono)" }}>Esc</kbd> to close
            </div>
          </div>
        ) : (
          Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} style={{ marginBottom: 6 }}>
              {/* Category Header */}
              <div
                style={{
                  padding: "6px 10px 4px 10px",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-muted, #8B8B8B)",
                  userSelect: "none"
                }}
              >
                {category}
              </div>

              {/* Category Items */}
              {cmds.map((cmd) => {
                const itemIndex = filteredCommands.indexOf(cmd);
                const isSelected = itemIndex === selectedIndex;

                return (
                  <div
                    key={cmd.command}
                    ref={(el) => (itemRefs.current[itemIndex] = el)}
                    onClick={() => onSelectCommand?.(cmd)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                      background: isSelected
                        ? "var(--bg-card-hover, rgba(255, 255, 255, 0.08))"
                        : "transparent",
                      borderLeft: isSelected
                        ? `3px solid ${cmd.color}`
                        : "3px solid transparent"
                    }}
                  >
                    {/* Icon Container */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${cmd.color}18`,
                        border: `1px solid ${cmd.color}35`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0
                      }}
                    >
                      {cmd.icon}
                    </div>

                    {/* Text Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 2
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: cmd.color,
                            background: isSelected
                              ? `${cmd.color}22`
                              : "rgba(255, 255, 255, 0.05)",
                            padding: "1px 6px",
                            borderRadius: 4
                          }}
                        >
                          {cmd.command}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--text-primary, #EDEDED)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {cmd.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--text-muted, #8B8B8B)",
                          lineHeight: 1.35,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {cmd.description}
                      </div>
                    </div>

                    {/* Action Pill on Selection */}
                    {isSelected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                          fontSize: 10.5,
                          fontFamily: "var(--font-sans, sans-serif)",
                          color: "var(--text-muted, #A1A1AA)",
                          whiteSpace: "nowrap",
                          flexShrink: 0
                        }}
                      >
                        ↵ Enter to select
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Popover Footer Shortcuts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: "rgba(0, 0, 0, 0.16)",
          borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          fontSize: 11,
          color: "var(--text-muted, #8B8B8B)",
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <kbd
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                borderRadius: 3,
                padding: "1px 4px",
                fontSize: 10,
                fontFamily: "var(--font-mono, monospace)"
              }}
            >
              ↑
            </kbd>
            <kbd
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                borderRadius: 3,
                padding: "1px 4px",
                fontSize: 10,
                fontFamily: "var(--font-mono, monospace)"
              }}
            >
              ↓
            </kbd>
            <span>navigate</span>
          </span>
          <span style={{ opacity: 0.3 }}>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <kbd
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                borderRadius: 3,
                padding: "1px 4px",
                fontSize: 10,
                fontFamily: "var(--font-mono, monospace)"
              }}
            >
              ↵
            </kbd>
            <span>select</span>
          </span>
          <span style={{ opacity: 0.3 }}>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <kbd
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                borderRadius: 3,
                padding: "1px 4px",
                fontSize: 10,
                fontFamily: "var(--font-mono, monospace)"
              }}
            >
              esc
            </kbd>
            <span>close</span>
          </span>
        </div>
        <div
          style={{
            fontSize: 10.5,
            opacity: 0.6,
            fontFamily: "var(--font-mono, monospace)"
          }}
        >
          Nexus Copilot
        </div>
      </div>
    </div>
  );
}
