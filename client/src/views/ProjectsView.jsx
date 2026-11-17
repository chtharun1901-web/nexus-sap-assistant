import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const MODULE_COLORS = {
  "SAP EWM": { bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.35)", text: "#0891B2", accent: "#06B6D4" },
  "SAP GTS": { bg: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.35)", text: "#B45309", accent: "#D97706" },
  "SAP SD":  { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.35)", text: "#059669", accent: "#10B981" },
  "SAP TM":  { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.35)", text: "#4F46E5", accent: "#6366F1" },
  "SAP FICO":{ bg: "rgba(225, 29, 72, 0.12)", border: "rgba(225, 29, 72, 0.35)", text: "#BE123C", accent: "#E11D48" },
  "SAP MM":  { bg: "rgba(13, 148, 136, 0.12)", border: "rgba(13, 148, 136, 0.35)", text: "#0F766E", accent: "#0D9488" },
  "All":     { bg: "rgba(110, 26, 45, 0.12)", border: "rgba(110, 26, 45, 0.35)", text: "var(--burgundy-rich, #6E1A2D)", accent: "#6E1A2D" }
};

const MODULE_OPTIONS = [
  "SAP EWM",
  "SAP GTS",
  "SAP SD",
  "SAP TM",
  "SAP FICO",
  "SAP MM",
  "Cross-Module / Architecture"
];

function formatRelativeTime(dateStr) {
  if (!dateStr) return "recently";
  try {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (e) {
    return "recently";
  }
}

export default function ProjectsView({ onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Project Form State
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    module: "SAP EWM",
    customInstructions: "",
    initialFileName: "",
    initialFileContent: ""
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      const list = Array.isArray(res) ? res : (res?.projects || res?.data || []);
      setProjects(list);
    } catch (err) {
      console.warn("Could not load projects from API:", err);
      // Fallback sample if empty
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      setCreating(true);
      setErrorMsg("");

      const payload = {
        name: newProject.name.trim(),
        title: newProject.name.trim(),
        description: newProject.description.trim(),
        module: newProject.module,
        sap_module: newProject.module,
        customInstructions: newProject.customInstructions.trim(),
        custom_instructions: newProject.customInstructions.trim(),
        initialFileName: newProject.initialFileName.trim(),
        initialFileContent: newProject.initialFileContent.trim()
      };

      const res = await api.createProject(payload);
      const created = res.project || res;

      // If initial file provided and project has an ID, upload file
      if (newProject.initialFileName && newProject.initialFileContent && created?.id) {
        try {
          await api.uploadProjectFile(created.id, {
            name: newProject.initialFileName,
            content: newProject.initialFileContent,
            type: "text/plain"
          });
        } catch (fErr) {
          console.warn("Initial file upload deferred:", fErr);
        }
      }

      setShowCreateModal(false);
      setNewProject({
        name: "",
        description: "",
        module: "SAP EWM",
        customInstructions: "",
        initialFileName: "",
        initialFileContent: ""
      });

      // Reload projects and navigate directly to the new project workspace
      await loadProjects();
      if (created?.id && onNavigate) {
        onNavigate("project-detail", created.id);
      }
    } catch (err) {
      console.error("Create project failed:", err);
      setErrorMsg(err.message || "Failed to create project workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleNewChatInProject = async (project, e) => {
    e.stopPropagation();
    try {
      const res = await api.createProjectSession(project.id, {
        title: `${project.name} Investigation`
      });
      const session = res.session || res;
      const sid = session.session_id || session.id;
      if (onNavigate) {
        onNavigate("workspace", session.title || project.name, sid);
      }
    } catch (err) {
      console.warn("Could not create remote session, creating local session:", err);
      const newId = "conv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      if (onNavigate) {
        onNavigate("workspace", `${project.name} - Chat`, newId);
      }
    }
  };

  const filterModules = ["All", "SAP EWM", "SAP GTS", "SAP SD", "SAP TM", "SAP FICO", "SAP MM"];

  const filteredProjects = projects.filter((p) => {
    const pModule = p.module || p.sap_module || "Cross-Module";
    const matchesModule = selectedModule === "All" || pModule.toLowerCase().includes(selectedModule.toLowerCase());
    const matchesQuery =
      !searchQuery ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.custom_instructions && p.custom_instructions.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesModule && matchesQuery;
  });

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        background: "var(--bg-main, #F5F1EB)",
        color: "var(--text-primary, #1C1917)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        padding: "36px 44px 80px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        {/* Header Breadcrumb & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted, #78716C)",
                fontFamily: "var(--font-mono, monospace)",
                marginBottom: 6,
                letterSpacing: "0.02em"
              }}
            >
              Nexus Workspaces &gt; <strong style={{ color: "var(--text-primary)" }}>Dedicated Projects</strong>
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "var(--text-primary, #1C1917)",
                letterSpacing: "-0.03em",
                margin: 0
              }}
            >
              Projects
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted, #78716C)",
                marginTop: 6,
                lineHeight: 1.5,
                maxWidth: 680
              }}
            >
              Organize SAP workstreams, custom instructions, knowledge files, and conversations into dedicated project workspaces.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 18px",
                fontSize: 13.5,
                cursor: "pointer"
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 28,
            background: "var(--bg-card, #FAF8F5)",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          {/* Search bar */}
          <div style={{ position: "relative", width: "100%" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: "var(--text-muted, #78716C)"
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, description, or custom instructions..."
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                background: "var(--bg-surface, #EDE8E0)",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                borderRadius: 8,
                fontSize: 13.5,
                color: "var(--text-primary)",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 16
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Module Filter Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginRight: 4 }}>
              Filter by Domain:
            </span>
            {filterModules.map((mod) => {
              const isSelected = selectedModule === mod;
              const styleMeta = MODULE_COLORS[mod] || MODULE_COLORS["All"];
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setSelectedModule(mod)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: isSelected ? `1.5px solid ${styleMeta.accent}` : "1px solid var(--border-subtle, rgba(0,0,0,0.1))",
                    background: isSelected ? styleMeta.bg : "var(--bg-surface, transparent)",
                    color: isSelected ? styleMeta.text : "var(--text-muted, #78716C)",
                    boxShadow: isSelected ? `0 1px 4px ${styleMeta.border}` : "none"
                  }}
                >
                  {mod}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 14 }}>Loading project workspaces...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div
            style={{
              padding: "64px 32px",
              textAlign: "center",
              background: "var(--bg-card, #FAF8F5)",
              border: "1px dashed var(--border-strong, rgba(0,0,0,0.16))",
              borderRadius: 14
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              {searchQuery || selectedModule !== "All" ? "No matching projects found" : "No projects created yet"}
            </h3>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 20px" }}>
              {searchQuery || selectedModule !== "All"
                ? "Try clearing your search query or choosing another SAP domain filter."
                : "Create your first dedicated project workspace to organize conversations, attach runbooks, and set custom SAP AI instructions."}
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{ padding: "8px 20px", fontSize: 13 }}
            >
              + Create First Project
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 20
            }}
          >
            {filteredProjects.map((project) => {
              const pModule = project.module || project.sap_module || "SAP EWM";
              const modTheme = MODULE_COLORS[pModule] || MODULE_COLORS["SAP EWM"];
              const sessionCount = project.session_count ?? project.sessions_count ?? project.sessions?.length ?? 0;
              const filesCount = project.files_count ?? project.file_count ?? project.files?.length ?? 0;
              const hasInstructions = !!(project.custom_instructions || project.customInstructions);

              return (
                <div
                  key={project.id}
                  onClick={() => onNavigate && onNavigate("project-detail", project.id)}
                  style={{
                    background: "var(--bg-card, #FAF8F5)",
                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                    borderRadius: 12,
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = modTheme.accent;
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.08))";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                  }}
                >
                  {/* Top Color Accent Bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: modTheme.accent
                    }}
                  />

                  {/* Header Row: Badge & Quick Action */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 6,
                          background: modTheme.bg,
                          color: modTheme.text,
                          border: `1px solid ${modTheme.border}`,
                          fontFamily: "var(--font-mono, monospace)"
                        }}
                      >
                        {pModule}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleNewChatInProject(project, e)}
                        title="Start a new chat in this project"
                        style={{
                          background: "var(--bg-surface, #EDE8E0)",
                          border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.12s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--burgundy-light, rgba(110,26,45,0.1))";
                          e.currentTarget.style.color = "var(--burgundy, #6E1A2D)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--bg-surface, #EDE8E0)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                      >
                        <span>＋</span>
                        <span>New Chat</span>
                      </button>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text-primary, #1C1917)",
                        margin: "0 0 6px 0",
                        letterSpacing: "-0.015em",
                        lineHeight: 1.35
                      }}
                    >
                      {project.name || project.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-body, #44403C)",
                        lineHeight: 1.5,
                        margin: "0 0 12px 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 38
                      }}
                    >
                      {project.description || "Dedicated SAP project workspace for collaborative investigation and triage."}
                    </p>

                    {/* Custom Instructions Indicator */}
                    <div style={{ marginBottom: 16 }}>
                      {hasInstructions ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--burgundy-rich, #6E1A2D)",
                            background: "var(--burgundy-light, rgba(110,26,45,0.08))",
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--burgundy-border, rgba(110,26,45,0.2))"
                          }}
                          title={project.custom_instructions || project.customInstructions}
                        >
                          <span>⚡</span>
                          <span>Custom instructions active</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11.5,
                            color: "var(--text-muted, #78716C)",
                            background: "var(--bg-surface, transparent)",
                            padding: "3px 8px",
                            borderRadius: 6
                          }}
                        >
                          <span>⚙️</span>
                          <span>Default system prompt</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics Footer */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                      paddingTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--text-muted, #78716C)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span title="Sessions in this project">
                        💬 {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
                      </span>
                      <span title="Knowledge reference files">
                        📄 {filesCount} {filesCount === 1 ? "file" : "files"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{formatRelativeTime(project.updated_at || project.created_at)}</span>
                      <span style={{ color: "var(--burgundy, #6E1A2D)", fontWeight: 700 }}>→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create Project */}
        {showCreateModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(6px)",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20
            }}
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <div
              style={{
                background: "var(--bg-card, #FAF8F5)",
                border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                borderRadius: 14,
                padding: "28px 32px",
                width: 580,
                maxWidth: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "var(--text-primary, #1C1917)",
                      margin: "0 0 4px 0",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    Create New Project Workspace
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted, #78716C)", margin: 0 }}>
                    Group SAP triage workstreams, custom prompt instructions, and reference files into one space.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "var(--red-light, rgba(239, 68, 68, 0.1))",
                    border: "1px solid var(--red-text, #991B1B)",
                    borderRadius: 8,
                    color: "var(--red-text, #991B1B)",
                    fontSize: 13,
                    marginBottom: 16
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Project Name */}
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. S/4HANA EWM 2023 Wave 2 Migration"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-surface, #EDE8E0)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* SAP Module Selector */}
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>
                    SAP Domain / Module
                  </label>
                  <select
                    value={newProject.module}
                    onChange={(e) => setNewProject((p) => ({ ...p, module: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-surface, #EDE8E0)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  >
                    {MODULE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newProject.description}
                    onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Briefly describe what this project covers..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-surface, #EDE8E0)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Custom Instructions */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                      Custom Project Instructions
                    </label>
                    <span style={{ fontSize: 11, color: "var(--burgundy, #6E1A2D)", fontWeight: 600 }}>
                      ⚡ Directs AI in all chats
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={newProject.customInstructions}
                    onChange={(e) => setNewProject((p) => ({ ...p, customInstructions: e.target.value }))}
                    placeholder="e.g. You are an expert SAP EWM Solution Architect specializing in embedded EWM 2023. Always verify /SCWM/MON status before suggesting database fixes. Assume warehouse number W001 and strict RF scanning."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-surface, #EDE8E0)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                      lineHeight: 1.5
                    }}
                  />
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                    Custom instructions will be prepended to the system prompt for every session in this project.
                  </div>
                </div>

                {/* Initial Knowledge File */}
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>
                    Initial Reference Document (Optional)
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="text"
                      value={newProject.initialFileName}
                      onChange={(e) => setNewProject((p) => ({ ...p, initialFileName: e.target.value }))}
                      placeholder="File name (e.g. plant_1000_runbook.md)"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "var(--bg-surface, #EDE8E0)",
                        border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                        borderRadius: 6,
                        fontSize: 12.5,
                        color: "var(--text-primary)",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                    <textarea
                      rows={3}
                      value={newProject.initialFileContent}
                      onChange={(e) => setNewProject((p) => ({ ...p, initialFileContent: e.target.value }))}
                      placeholder="Paste notes, error logs, or SOP documentation to ground conversations in this project..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "var(--bg-surface, #EDE8E0)",
                        border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                        borderRadius: 6,
                        fontSize: 12.5,
                        color: "var(--text-primary)",
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                    style={{ padding: "8px 16px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newProject.name.trim()}
                    className="btn-primary"
                    style={{ padding: "8px 20px", cursor: "pointer", opacity: creating || !newProject.name.trim() ? 0.6 : 1 }}
                  >
                    {creating ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
