import React, { useState, useEffect, useRef } from "react";
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

function formatTime(dateStr) {
  if (!dateStr) return "recently";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "recently";
  }
}

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

export default function ProjectDetailView({ projectId, onNavigate }) {
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Modals & Forms
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showPreviewFile, setShowPreviewFile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    module: "SAP EWM",
    customInstructions: ""
  });
  const [fileForm, setFileForm] = useState({
    name: "",
    content: "",
    type: "text/markdown"
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await api.getProject(projectId);
      const proj = res.project || res;
      setProject(proj);

      setEditForm({
        name: proj.name || proj.title || "",
        description: proj.description || "",
        module: proj.module || proj.sap_module || "SAP EWM",
        customInstructions: proj.custom_instructions || proj.customInstructions || ""
      });

      // Load sessions
      try {
        const sRes = await api.getProjectSessions(projectId);
        const sList = Array.isArray(sRes) ? sRes : (sRes.sessions || sRes.data || []);
        setSessions(sList);
      } catch (sErr) {
        setSessions(proj.sessions || []);
      }

      // Load files
      setFiles(proj.files || []);
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Handle in-project search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.searchProject(projectId, searchQuery.trim());
        setSearchResults(res);
      } catch (err) {
        console.warn("Server in-project search fallback to local search:", err);
        // Fallback local search
        const q = searchQuery.toLowerCase();
        const matchedSessions = sessions.filter(
          (s) => (s.title && s.title.toLowerCase().includes(q)) || (s.id && s.id.toLowerCase().includes(q))
        );
        const matchedFiles = files.filter(
          (f) =>
            (f.name && f.name.toLowerCase().includes(q)) ||
            (f.content && f.content.toLowerCase().includes(q))
        );
        setSearchResults({
          sessions: matchedSessions,
          files: matchedFiles,
          messages: []
        });
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, projectId, sessions, files]);

  const handleStartNewChat = async () => {
    try {
      const res = await api.createProjectSession(projectId, {
        title: `${project?.name || "SAP"} Investigation`
      });
      const session = res.session || res;
      const sid = session.session_id || session.id;
      if (onNavigate) {
        onNavigate("workspace", session.title || project?.name, sid);
      }
    } catch (err) {
      console.warn("Fallback local session:", err);
      const newId = "conv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      if (onNavigate) {
        onNavigate("workspace", `${project?.name || "Project"} - Chat`, newId);
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const payload = {
        name: editForm.name.trim(),
        title: editForm.name.trim(),
        description: editForm.description.trim(),
        module: editForm.module,
        sap_module: editForm.module,
        customInstructions: editForm.customInstructions.trim(),
        custom_instructions: editForm.customInstructions.trim()
      };
      const res = await api.updateProject(projectId, payload);
      const updated = res.project || res;
      setProject(updated);
      setShowEditModal(false);
    } catch (err) {
      alert("Failed to update project: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete project "${project?.name}"? All associated sessions will remain intact.`)) {
      return;
    }
    try {
      setDeletingProject(true);
      await api.deleteProject(projectId);
      if (onNavigate) {
        onNavigate("projects");
      }
    } catch (err) {
      alert("Failed to delete project: " + err.message);
      setDeletingProject(false);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!fileForm.name.trim() || !fileForm.content.trim()) return;

    try {
      setUploadingFile(true);
      const res = await api.uploadProjectFile(projectId, {
        name: fileForm.name.trim(),
        content: fileForm.content,
        type: fileForm.type || "text/plain"
      });
      const newFile = res.file || res;

      setFiles((prev) => [...prev, newFile]);
      setShowAddFileModal(false);
      setFileForm({ name: "", content: "", type: "text/markdown" });
      await loadData();
    } catch (err) {
      alert("Failed to attach file: " + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId, fileName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Remove attached document "${fileName}" from this project?`)) return;

    try {
      await api.deleteProjectFile(projectId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (showPreviewFile?.id === fileId) {
        setShowPreviewFile(null);
      }
    } catch (err) {
      alert("Failed to delete file: " + err.message);
    }
  };

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      setFileForm((prev) => ({
        ...prev,
        name: file.name,
        content: typeof text === "string" ? text : "",
        type: file.type || "text/plain"
      }));
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-main)" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⚡</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Loading project workspace...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-main)" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Project not found</div>
        <button type="button" onClick={() => onNavigate && onNavigate("projects")} className="btn-primary" style={{ padding: "8px 16px" }}>
          ← Back to Projects Gallery
        </button>
      </div>
    );
  }

  const pModule = project.module || project.sap_module || "SAP EWM";
  const modTheme = MODULE_COLORS[pModule] || MODULE_COLORS["SAP EWM"];
  const customInstructions = project.custom_instructions || project.customInstructions;

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        background: "var(--bg-main, #F5F1EB)",
        color: "var(--text-primary, #1C1917)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        padding: "28px 40px 80px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 12 }}>
          <span
            onClick={() => onNavigate && onNavigate("projects")}
            style={{
              color: "var(--burgundy, #6E1A2D)",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            ← Projects Gallery
          </span>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{project.name}</span>
        </div>

        {/* Project Header Banner */}
        <div
          style={{
            background: "var(--bg-card, #FAF8F5)",
            border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            position: "relative",
            overflow: "hidden"
          }}
        >
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
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

                {customInstructions && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--burgundy-rich, #6E1A2D)",
                      background: "var(--burgundy-light, rgba(110,26,45,0.08))",
                      padding: "2px 7px",
                      borderRadius: 4,
                      border: "1px solid var(--burgundy-border, rgba(110,26,45,0.2))"
                    }}
                  >
                    ⚡ Custom Instructions Active
                  </span>
                )}
              </div>

              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "var(--text-primary, #1C1917)",
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.025em"
                }}
              >
                {project.name}
              </h1>

              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-body, #44403C)",
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: 720
                }}
              >
                {project.description || "Dedicated SAP project workspace for collaborative investigation and triage."}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  fontSize: 13.5,
                  cursor: "pointer"
                }}
              >
                <span>＋</span>
                <span>New Chat in Project</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="btn-secondary"
                style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13 }}
              >
                Edit Details
              </button>

              <button
                type="button"
                disabled={deletingProject}
                onClick={handleDeleteProject}
                style={{
                  background: "transparent",
                  border: "1px solid var(--red-light, rgba(239, 68, 68, 0.3))",
                  color: "var(--red-text, #991B1B)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-light, rgba(239, 68, 68, 0.1))"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {deletingProject ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Dual Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 24, alignItems: "start" }}>
          {/* LEFT COLUMN: Project Sessions & In-Project Search */}
          <div>
            <div
              style={{
                background: "var(--bg-card, #FAF8F5)",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                borderRadius: 14,
                padding: "20px 22px",
                marginBottom: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Project Conversations
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"} total
                </span>
              </div>

              {/* In-Project Search Bar */}
              <div style={{ position: "relative", marginBottom: 16 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 14,
                    color: "var(--text-muted)"
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in this project (titles, messages, files)..."
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 36px",
                    background: "var(--bg-surface, #EDE8E0)",
                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                    borderRadius: 8,
                    fontSize: 13,
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
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 15
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Real-time search status indicator */}
              {searching && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚡</span>
                  <span>Searching project history...</span>
                </div>
              )}

              {/* Search Results Display */}
              {searchResults ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--burgundy-rich, #6E1A2D)", marginBottom: 10 }}>
                    Search Results for "{searchQuery}"
                  </div>

                  {/* Matching Sessions */}
                  {searchResults.sessions && searchResults.sessions.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                        Sessions ({searchResults.sessions.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {searchResults.sessions.map((s) => (
                          <div
                            key={s.id || s.session_id}
                            onClick={() => onNavigate && onNavigate("workspace", s.title, s.id || s.session_id)}
                            style={{
                              padding: "10px 14px",
                              background: "var(--bg-surface, #EDE8E0)",
                              borderRadius: 8,
                              cursor: "pointer",
                              border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--burgundy, #6E1A2D)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.08))"; }}
                          >
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                              💬 {highlightMatch(s.title || s.id, searchQuery)}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                              Last updated {formatTime(s.updated_at || s.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Messages / Snippets */}
                  {searchResults.messages && searchResults.messages.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                        Turn Messages & Insights ({searchResults.messages.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {searchResults.messages.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => onNavigate && onNavigate("workspace", m.session_title || project.name, m.session_id)}
                            style={{
                              padding: "10px 14px",
                              background: "var(--bg-surface, #EDE8E0)",
                              borderRadius: 8,
                              cursor: "pointer",
                              border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))"
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                              In session: {m.session_title || m.session_id}
                            </div>
                            <div style={{ fontSize: 12.5, color: "var(--text-body)", lineHeight: 1.4 }}>
                              "{highlightMatch(m.snippet || m.content, searchQuery)}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Files */}
                  {searchResults.files && searchResults.files.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                        Attached Files ({searchResults.files.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {searchResults.files.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => setShowPreviewFile(f)}
                            style={{
                              padding: "10px 14px",
                              background: "var(--bg-surface, #EDE8E0)",
                              borderRadius: 8,
                              cursor: "pointer",
                              border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))"
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              📄 {highlightMatch(f.name, searchQuery)}
                            </div>
                            {f.content && (
                              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, maxHeight: 40, overflow: "hidden" }}>
                                {highlightMatch(f.content.slice(0, 160), searchQuery)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!searchResults.sessions || searchResults.sessions.length === 0) &&
                    (!searchResults.messages || searchResults.messages.length === 0) &&
                    (!searchResults.files || searchResults.files.length === 0) && (
                      <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        No results matched "{searchQuery}" in this project.
                      </div>
                    )}
                </div>
              ) : (
                /* Normal Sessions List */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sessions.length === 0 ? (
                    <div
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        border: "1px dashed var(--border-subtle, rgba(0,0,0,0.12))",
                        borderRadius: 10
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        No conversations in this project yet
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
                        Start a new conversation grounded in this project's custom instructions and knowledge documents.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartNewChat}
                        className="btn-primary"
                        style={{ padding: "7px 16px", fontSize: 13 }}
                      >
                        + Start First Conversation
                      </button>
                    </div>
                  ) : (
                    sessions.map((session) => {
                      const sid = session.session_id || session.id;
                      const title = session.title || `Investigation ${sid.slice(0, 10)}`;
                      return (
                        <div
                          key={sid}
                          onClick={() => onNavigate && onNavigate("workspace", title, sid)}
                          style={{
                            padding: "14px 16px",
                            background: "var(--bg-surface, #EDE8E0)",
                            border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                            borderRadius: 10,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--burgundy, #6E1A2D)";
                            e.currentTarget.style.transform = "translateX(2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.08))";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: 4,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              💬 {title}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                              Updated {formatTime(session.updated_at || session.created_at)}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--burgundy-rich, #6E1A2D)",
                              flexShrink: 0
                            }}
                          >
                            Open →
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Project Knowledge & Instructions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Custom Instructions Card */}
            <div
              style={{
                background: "var(--bg-card, #FAF8F5)",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Custom Instructions
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--burgundy, #6E1A2D)",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Edit
                </button>
              </div>

              {customInstructions ? (
                <div
                  style={{
                    background: "var(--bg-surface, #EDE8E0)",
                    border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                    borderRadius: 8,
                    padding: "12px 14px",
                    fontSize: 13,
                    color: "var(--text-body)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-sans)",
                    maxHeight: 200,
                    overflowY: "auto"
                  }}
                >
                  {customInstructions}
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    border: "1px dashed var(--border-subtle, rgba(0,0,0,0.12))",
                    borderRadius: 8,
                    color: "var(--text-muted)",
                    fontSize: 12.5
                  }}
                >
                  No custom instructions configured.
                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--burgundy, #6E1A2D)",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      + Add Instructions
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project Knowledge Files Card */}
            <div
              style={{
                background: "var(--bg-card, #FAF8F5)",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Knowledge & Files
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFileModal(true)}
                  style={{
                    background: "var(--burgundy-light, rgba(110,26,45,0.08))",
                    border: "1px solid var(--burgundy-border, rgba(110,26,45,0.2))",
                    color: "var(--burgundy, #6E1A2D)",
                    fontWeight: 700,
                    fontSize: 12,
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer"
                  }}
                >
                  ＋ Add File
                </button>
              </div>

              {files.length === 0 ? (
                <div
                  style={{
                    padding: "20px 14px",
                    textAlign: "center",
                    border: "1px dashed var(--border-subtle, rgba(0,0,0,0.12))",
                    borderRadius: 8,
                    color: "var(--text-muted)",
                    fontSize: 12.5
                  }}
                >
                  No attached reference files yet.
                  <div style={{ marginTop: 6 }}>
                    Upload runbooks, standard operating procedures, or configuration guides.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setShowPreviewFile(file)}
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface, #EDE8E0)",
                        border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        transition: "all 0.12s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong, rgba(0,0,0,0.2))"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle, rgba(0,0,0,0.08))"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 15, flexShrink: 0 }}>📄</span>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {file.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {file.size ? `${Math.round(file.size / 1024)} KB • ` : ""}
                            {formatTime(file.created_at || file.updated_at)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFile(file.id, file.name, e)}
                          title="Delete file"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: 13,
                            padding: "2px 6px"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red, #EF4444)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Edit Project Details */}
        {showEditModal && (
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
            onClick={() => !savingEdit && setShowEditModal(false)}
          >
            <div
              style={{
                background: "var(--bg-card, #FAF8F5)",
                border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                borderRadius: 14,
                padding: "28px 32px",
                width: 560,
                maxWidth: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px 0", color: "var(--text-primary)" }}>
                Edit Project Settings
              </h2>

              <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
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

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    SAP Domain / Module
                  </label>
                  <select
                    value={editForm.module}
                    onChange={(e) => setEditForm((f) => ({ ...f, module: e.target.value }))}
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

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
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

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700 }}>Custom Project Instructions</label>
                    <span style={{ fontSize: 11, color: "var(--burgundy, #6E1A2D)", fontWeight: 600 }}>
                      ⚡ Injected in all project chats
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={editForm.customInstructions}
                    onChange={(e) => setEditForm((f) => ({ ...f, customInstructions: e.target.value }))}
                    placeholder="Instructions directing AI tone, methodology, warehouse codes, and SAP best practices..."
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
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !editForm.name.trim()}
                    className="btn-primary"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add File / Document */}
        {showAddFileModal && (
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
            onClick={() => !uploadingFile && setShowAddFileModal(false)}
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
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                Attach Project Knowledge Document
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
                Upload or paste reference documents, runbooks, or configuration notes for AI grounding.
              </p>

              <form onSubmit={handleAddFile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Upload from disk button */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ fontSize: 12.5 }}
                  >
                    📁 Browse File from Computer
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilePicked}
                    accept=".txt,.md,.json,.csv,.sql,.log,.xml,.ya?ml"
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Supports .md, .txt, .json, .csv
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Document Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fileForm.name}
                    onChange={(e) => setFileForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. ewm_inbound_staging_triage.md"
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

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Document Content *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={fileForm.content}
                    onChange={(e) => setFileForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Paste markdown content, runbook steps, or reference tables here..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-surface, #EDE8E0)",
                      border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontFamily: "var(--font-mono, monospace)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                      lineHeight: 1.45
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => setShowAddFileModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingFile || !fileForm.name.trim() || !fileForm.content.trim()}
                    className="btn-primary"
                  >
                    {uploadingFile ? "Attaching..." : "Attach Document"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Document Preview */}
        {showPreviewFile && (
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
            onClick={() => setShowPreviewFile(null)}
          >
            <div
              style={{
                background: "var(--bg-card, #FAF8F5)",
                border: "1px solid var(--border-strong, rgba(0,0,0,0.16))",
                borderRadius: 14,
                padding: "24px 28px",
                width: 720,
                maxWidth: "100%",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    {showPreviewFile.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewFile(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 18,
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  background: "var(--bg-surface, #EDE8E0)",
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                  borderRadius: 8,
                  padding: "16px",
                  fontSize: 13,
                  fontFamily: "var(--font-mono, monospace)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  color: "var(--text-primary)"
                }}
              >
                {showPreviewFile.content || "Empty document."}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowPreviewFile(null)}
                  className="btn-secondary"
                  style={{ padding: "6px 14px", fontSize: 12.5 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
