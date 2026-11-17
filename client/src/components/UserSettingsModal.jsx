import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function UserSettingsModal({
  isOpen,
  onClose,
  user,
  onLogout,
  currentWallpaper,
  onWallpaperChange
}) {
  // Navigation State — defaults to "skills" to match the uploaded design
  const [activeTab, setActiveTab] = useState("skills");
  const [skillsSubTab, setSkillsSubTab] = useState("discover"); // "yours" | "discover"
  const [searchQuery, setSearchQuery] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");

  // API Key State
  const [apiKey, setApiKey] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const [testing, setTesting] = useState(false);

  // Settings State from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("nexus_user_settings");
      return saved ? JSON.parse(saved) : {
        displayName: user?.display_name || user?.displayName || user?.name || "Enterprise Consultant",
        role: "Senior SAP EWM / TM Solution Architect",
        defaultLanding: "workspace",
        clockFormat: "IST",
        socraticMode: false,
        themePalette: "dark",
        activeModel: "gemini-3.5-flash-lite",
        reasoningDepth: "balanced",
        installedSkills: ["data", "sap-ewm-tm", "chezzion-fsd"],
        capabilities: {
          grounding: true,
          codeExecution: true,
          toolAgent: true,
          voiceHandover: true,
          warehouseVision: true
        }
      };
    } catch (e) {
      return {
        displayName: user?.display_name || user?.displayName || user?.name || "Enterprise Consultant",
        role: "Senior SAP EWM / TM Solution Architect",
        defaultLanding: "workspace",
        installedSkills: ["data", "sap-ewm-tm", "chezzion-fsd"],
        capabilities: { grounding: true, codeExecution: true, toolAgent: true }
      };
    }
  });

  const [savedToast, setSavedToast] = useState("");

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      api.getStatus().then(d => {
        if (d.hasKey) setApiKeyStatus("API Key Configured & Active ✓");
        else setApiKeyStatus("No API Key configured");
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(""), 2800);
  };

  const handleSaveSettings = (updated) => {
    const next = updated || settings;
    setSettings(next);
    localStorage.setItem("nexus_user_settings", JSON.stringify(next));
    showToast("Settings saved successfully ✓");
  };

  const toggleSkillInstalled = (skillId) => {
    const current = settings.installedSkills || [];
    const exists = current.includes(skillId);
    const nextInstalled = exists
      ? current.filter(id => id !== skillId)
      : [...current, skillId];
    
    const next = { ...settings, installedSkills: nextInstalled };
    handleSaveSettings(next);
    showToast(exists ? `Skill uninstalled` : `Skill added to your workspace ✓`);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    try {
      setApiKeyStatus("Saving key...");
      const res = await api.saveKey({ key: apiKey.trim() });
      if (res.ok) {
        setApiKeyStatus("API Key Saved Successfully ✓");
        setApiKey("");
        showToast("Gemini API key updated ✓");
      } else {
        setApiKeyStatus("Error: " + (res.error || "Invalid key"));
      }
    } catch (e) {
      setApiKeyStatus("Error: " + e.message);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus("Pinging Nexus Enterprise Server...");
    try {
      const d = await api.getStatus();
      setTimeout(() => {
        setTesting(false);
        setTestStatus(`Connected (HTTP 200, Key: ${d.hasKey ? "Active" : "Missing"})`);
        showToast("Server online & responsive ✓");
      }, 500);
    } catch (e) {
      setTesting(false);
      setTestStatus("Failed: " + e.message);
    }
  };

  // Nav Menu Definitions matching Claude Settings Modal
  const PREFERENCES_NAV = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "account", label: "Account", icon: "👤" },
    { id: "privacy", label: "Privacy", icon: "🛡️" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "capabilities", label: "Capabilities", icon: "📦" },
    { id: "memory", label: "Memory", icon: "🌐" },
    { id: "reflect", label: "Reflect", icon: "🪞" },
    { id: "time_focus", label: "Time and focus", icon: "🕒" },
    { id: "nexus_code", label: "Claude Code", icon: "</>" },
  ];

  const CUSTOMIZE_NAV = [
    { id: "skills", label: "Skills", icon: "📑" },
    { id: "connectors", label: "Connectors", icon: "🔌" },
    { id: "plugins", label: "Plugins", icon: "🧩" },
  ];

  // Catalog of Skills (matching screenshot + SAP enterprise consultant extensions)
  const SKILLS_CATALOG = [
    {
      id: "coursera",
      title: "Learn with Coursera",
      desc: "Turn any learning intent into a personalized Coursera...",
      meta: "104.1K installs",
      icon: "🎓"
    },
    {
      id: "2hongo",
      title: "2hongo",
      desc: "Study Japanese in Claude with 2hongo's dictionary,...",
      meta: "Anthropic Directory",
      icon: "💬"
    },
    {
      id: "adhd-reader",
      title: "ADHD Reader",
      desc: "Bolds the first letters of each word in Claude's...",
      meta: "Anthropic Directory",
      icon: "🎓"
    },
    {
      id: "adhd-study",
      title: "ADHD Study Coach",
      desc: "A single study-companion agent for ADHD learners, a...",
      meta: "Anthropic Directory",
      icon: "🎓"
    },
    {
      id: "ampup",
      title: "AmpUp MCP Plugin",
      desc: "Author Ampl in colonlow with auto-syntax validation...",
      meta: "MCP Directory",
      icon: "📈"
    },
    {
      id: "analytics-power",
      title: "Analytics Power Hour Li...",
      desc: "Search and quote Analytics podcasts, models and KPIs...",
      meta: "Community",
      icon: "📊"
    },
    {
      id: "sap-ewm-tm",
      title: "SAP EWM-TM Architect",
      desc: "Direct FO-to-ODO cross-module trigger, TU doors & freight staging...",
      meta: "Nexus Official",
      icon: "📦"
    },
    {
      id: "chezzion-fsd",
      title: "Chezzion FSD Engine",
      desc: "Client-ready Word (.docx) Functional Specs with BAdI mappings...",
      meta: "Consulting Suite",
      icon: "📄"
    },
    {
      id: "s4-migration",
      title: "S/4HANA Migration Cockpit",
      desc: "Multi-sheet Excel (.xlsx) master data workbooks with pre-load validation...",
      meta: "Enterprise Studio",
      icon: "📑"
    },
    {
      id: "badi-explorer",
      title: "SAP BAdI & Clean Core",
      desc: "Enhancement Spot & BAdI code generator for clean core S/4HANA...",
      meta: "ABAP Platform",
      icon: "⚡"
    }
  ];

  const filteredSkills = SKILLS_CATALOG.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(skillsFilter.toLowerCase()) ||
                          s.desc.toLowerCase().includes(skillsFilter.toLowerCase());
    if (skillsSubTab === "yours") {
      return matchesSearch && (settings.installedSkills || []).includes(s.id);
    }
    return matchesSearch;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px"
      }}
      onClick={onClose}
    >
      {/* Modal Dialog Window */}
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          height: "680px",
          backgroundColor: "#1E1E1E",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          borderRadius: "16px",
          boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#EDEDED",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            height: "48px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#F3F3F3", letterSpacing: "-0.01em" }}>
            Settings
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9C9C9E",
              fontSize: "17px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s ease"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#FFFFFF"}
            onMouseLeave={e => e.currentTarget.style.color = "#9C9C9E"}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Main Panel */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR NAVIGATION */}
          {/* ========================================================================= */}
          <div
            style={{
              width: "230px",
              backgroundColor: "#18181A",
              borderRight: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              overflowY: "auto",
              flexShrink: 0
            }}
          >
            {/* Search Input in Left Sidebar */}
            <div
              style={{
                backgroundColor: "#222226",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                gap: "8px",
                marginBottom: "8px"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#EDEDED",
                  fontSize: "13px",
                  width: "100%"
                }}
              />
            </div>

            {/* PREFERENCES SECTION */}
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#71717A", padding: "8px 8px 4px 8px", textTransform: "capitalize" }}>
              Preferences
            </div>
            {PREFERENCES_NAV.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent",
                    color: isActive ? "#FFFFFF" : "#A1A1AA",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: isActive ? "600" : "400",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: "14px", width: "18px", display: "inline-block", textAlign: "center" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* CUSTOMIZE SECTION */}
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#71717A", padding: "16px 8px 4px 8px", textTransform: "capitalize" }}>
              Customize
            </div>
            {CUSTOMIZE_NAV.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent",
                    color: isActive ? "#FFFFFF" : "#A1A1AA",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: isActive ? "600" : "400",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: "14px", width: "18px", display: "inline-block", textAlign: "center" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT MAIN CONTENT PANEL */}
          {/* ========================================================================= */}
          <div style={{ flex: 1, backgroundColor: "#1E1E1E", overflowY: "auto", padding: "24px 28px" }}>
            
            {/* Toast Notification */}
            {savedToast && (
              <div
                style={{
                  position: "fixed",
                  bottom: "28px",
                  right: "28px",
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  zIndex: 10000,
                  animation: "fadeIn 0.2s ease"
                }}
              >
                {savedToast}
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: SKILLS (EXACT MATCH TO USER SCREENSHOT) */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "skills" && (
              <div>
                {/* Header Row: Title, Segmented Tabs, Search & Add */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                      Skills
                    </h2>
                    
                    {/* Segmented Control: Yours / Discover */}
                    <div
                      style={{
                        backgroundColor: "#27272A",
                        borderRadius: "8px",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                      }}
                    >
                      <button
                        onClick={() => setSkillsSubTab("yours")}
                        style={{
                          padding: "4px 12px",
                          fontSize: "12.5px",
                          fontWeight: "500",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: skillsSubTab === "yours" ? "#3F3F46" : "transparent",
                          color: skillsSubTab === "yours" ? "#FFFFFF" : "#A1A1AA",
                          transition: "all 0.15s ease"
                        }}
                      >
                        Yours
                      </button>
                      <button
                        onClick={() => setSkillsSubTab("discover")}
                        style={{
                          padding: "4px 12px",
                          fontSize: "12.5px",
                          fontWeight: "500",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: skillsSubTab === "discover" ? "#3F3F46" : "transparent",
                          color: skillsSubTab === "discover" ? "#FFFFFF" : "#A1A1AA",
                          transition: "all 0.15s ease"
                        }}
                      >
                        Discover
                      </button>
                    </div>
                  </div>

                  {/* Right Actions: Search, Sort, + Add Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Search Input */}
                    <div
                      style={{
                        backgroundColor: "#27272A",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        padding: "5px 10px",
                        gap: "6px",
                        width: "160px"
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.3-4.3"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search"
                        value={skillsFilter}
                        onChange={e => setSkillsFilter(e.target.value)}
                        style={{
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "#EDEDED",
                          fontSize: "12.5px",
                          width: "100%"
                        }}
                      />
                    </div>

                    {/* Filter / Sort Button */}
                    <button
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        color: "#A1A1AA",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Sort / Filter"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="7" y1="12" x2="17" y2="12"/>
                        <line x1="10" y1="18" x2="14" y2="18"/>
                      </svg>
                    </button>

                    {/* + Add ▾ White Button */}
                    <button
                      onClick={() => showToast("Skill Upload Modal / URL Connector Opened")}
                      style={{
                        backgroundColor: "#FFFFFF",
                        color: "#111111",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 14px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                      }}
                    >
                      <span>+ Add</span>
                      <span style={{ fontSize: "10px" }}>▼</span>
                    </button>
                  </div>
                </div>

                {/* ------------------------------------------------------------------- */}
                {/* HERO FEATURED CARD: DATA (EXACT GREEN CARD FROM SCREENSHOT) */}
                {/* ------------------------------------------------------------------- */}
                <div
                  style={{
                    backgroundColor: "#162B1A",
                    border: "1px solid rgba(52, 211, 153, 0.25)",
                    borderRadius: "14px",
                    padding: "22px 24px",
                    marginBottom: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Left Column: Text & Buttons */}
                  <div style={{ maxWidth: "460px", zIndex: 2 }}>
                    <div style={{ fontSize: "12px", color: "#6EE7B7", fontWeight: "600", letterSpacing: "0.02em" }}>
                      From Anthropic
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "3px" }}>
                      Data
                    </div>
                    <div style={{ fontSize: "13.5px", color: "#A7F3D0", marginTop: "8px", lineHeight: "1.45" }}>
                      Query, chart and explain your data — SQL, spreadsheets and dashboards in one place.
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button
                        onClick={() => toggleSkillInstalled("data")}
                        style={{
                          backgroundColor: (settings.installedSkills || []).includes("data") ? "rgba(20, 83, 45, 0.85)" : "rgba(255, 255, 255, 0.15)",
                          border: "1px solid rgba(52, 211, 153, 0.45)",
                          color: "#6EE7B7",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {(settings.installedSkills || []).includes("data") ? "✓ Added" : "+ Add Data"}
                      </button>

                      <button
                        onClick={() => showToast("Opening Data Plugin View...")}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.35)",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          color: "#EDEDED",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: "pointer"
                        }}
                      >
                        View plugin
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Exact Graphic (Spreadsheet grid + Upward Chart Badge) */}
                  <div style={{ zIndex: 2, marginRight: "12px" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "140px",
                        height: "100px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {/* Stylized Spreadsheet Table Outline */}
                      <svg width="120" height="84" viewBox="0 0 120 84" fill="none">
                        <rect x="2" y="2" width="116" height="80" rx="10" stroke="#34D399" strokeWidth="2.5" strokeOpacity="0.8"/>
                        {/* Horizontal Rows */}
                        <line x1="2" y1="28" x2="118" y2="28" stroke="#34D399" strokeWidth="2.5" strokeOpacity="0.8"/>
                        <line x1="2" y1="56" x2="118" y2="56" stroke="#34D399" strokeWidth="2.5" strokeOpacity="0.8"/>
                        {/* Vertical Columns */}
                        <line x1="42" y1="2" x2="42" y2="82" stroke="#34D399" strokeWidth="2.5" strokeOpacity="0.8"/>
                        <line x1="82" y1="2" x2="82" y2="82" stroke="#34D399" strokeWidth="2.5" strokeOpacity="0.8"/>
                      </svg>

                      {/* Circular Upward Trend Badge */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          right: "4px",
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          backgroundColor: "#132716",
                          border: "3px solid #34D399",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                          <polyline points="17 6 23 6 23 12"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------------- */}
                {/* SECTION: FOR YOU (2-COLUMN GRID FROM SCREENSHOT) */}
                {/* ------------------------------------------------------------------- */}
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#EDEDED", marginBottom: "14px" }}>
                    For you
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {filteredSkills.map(skill => {
                      const isAdded = (settings.installedSkills || []).includes(skill.id);
                      return (
                        <div
                          key={skill.id}
                          style={{
                            backgroundColor: "#242426",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            borderRadius: "12px",
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "12px",
                            transition: "border-color 0.15s ease"
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"}
                        >
                          {/* Left: Icon & Description */}
                          <div style={{ display: "flex", gap: "12px", minWidth: 0 }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                backgroundColor: "#303034",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                flexShrink: 0
                              }}
                            >
                              {skill.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {skill.title}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#A1A1AA", marginTop: "2px", lineHeight: "1.35", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {skill.desc}
                              </div>
                              <div style={{ fontSize: "10.5px", color: "#71717A", marginTop: "4px" }}>
                                {skill.meta}
                              </div>
                            </div>
                          </div>

                          {/* Right: Try & Add Buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <button
                              onClick={() => showToast(`Starting test session for ${skill.title}...`)}
                              style={{
                                backgroundColor: "rgba(255, 255, 255, 0.07)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "16px",
                                padding: "4px 10px",
                                color: "#EDEDED",
                                fontSize: "11.5px",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer"
                              }}
                            >
                              <span>💬</span>
                              <span>Try</span>
                            </button>

                            <button
                              onClick={() => toggleSkillInstalled(skill.id)}
                              style={{
                                backgroundColor: isAdded ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.07)",
                                border: isAdded ? "1px solid rgba(16, 185, 129, 0.45)" : "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "16px",
                                width: "28px",
                                height: "26px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: isAdded ? "#10B981" : "#EDEDED",
                                fontSize: "13px",
                                cursor: "pointer"
                              }}
                              title={isAdded ? "Installed (Click to remove)" : "Add skill"}
                            >
                              {isAdded ? "✓" : "+"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: GENERAL */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>General Preferences</h2>
                  <p style={{ fontSize: "12.5px", color: "#A1A1AA", marginTop: "4px" }}>Configure profile attributes, default perspectives, and model engines.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", color: "#A1A1AA", fontWeight: "600" }}>Display Name</label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={e => handleSaveSettings({ ...settings, displayName: e.target.value })}
                    style={{ backgroundColor: "#27272A", border: "1px solid rgba(255,255,255,0.1)", color: "#EDEDED", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", color: "#A1A1AA", fontWeight: "600" }}>Operational Role Context</label>
                  <input
                    type="text"
                    value={settings.role}
                    onChange={e => handleSaveSettings({ ...settings, role: e.target.value })}
                    style={{ backgroundColor: "#27272A", border: "1px solid rgba(255,255,255,0.1)", color: "#EDEDED", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", color: "#A1A1AA", fontWeight: "600" }}>Default Model Engine</label>
                  <select
                    value={settings.activeModel}
                    onChange={e => handleSaveSettings({ ...settings, activeModel: e.target.value })}
                    style={{ backgroundColor: "#27272A", border: "1px solid rgba(255,255,255,0.1)", color: "#EDEDED", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Low Latency • Default)</option>
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (High Reasoning & Tool Agent)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Architectural Design)</option>
                  </select>
                </div>

                {/* Wallpaper Palette Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "12px", color: "#A1A1AA", fontWeight: "600" }}>Theme & Background Wallpaper</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { id: "none", label: "Obsidian Minimal Dark", sub: "Clean Enterprise Studio" },
                      { id: "sanjaya-palace", label: "Sanjaya Royal Palace", sub: "Golden Arches & Architecture" },
                      { id: "sanjaya-divine", label: "Divya Drishti Vision", sub: "Traditional Classical Art" },
                      { id: "indian-mandala", label: "Sacred Mandala Geometry", sub: "Cosmic Concentric Art" }
                    ].map(w => (
                      <button
                        key={w.id}
                        onClick={() => onWallpaperChange && onWallpaperChange(w.id)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          backgroundColor: currentWallpaper === w.id ? "rgba(255, 255, 255, 0.12)" : "#27272A",
                          border: currentWallpaper === w.id ? "1px solid #34D399" : "1px solid rgba(255,255,255,0.06)",
                          textAlign: "left",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#EDEDED" }}>{w.label}</div>
                        <div style={{ fontSize: "11px", color: "#A1A1AA", marginTop: "2px" }}>{w.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: ACCOUNT */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "account" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>Account & Authentication</h2>
                  <p style={{ fontSize: "12.5px", color: "#A1A1AA", marginTop: "4px" }}>Manage API credentials, user sessions, and enterprise identity.</p>
                </div>

                {/* API Key Box */}
                <div style={{ backgroundColor: "#27272A", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF", marginBottom: "4px" }}>Google Gemini API Key</div>
                  <div style={{ fontSize: "11.5px", color: apiKeyStatus.includes("Active") ? "#10B981" : "#F59E0B", marginBottom: "10px" }}>
                    {apiKeyStatus}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key (AIzaSy...)"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      style={{ flex: 1, backgroundColor: "#1E1E1E", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: "6px", fontSize: "12.5px" }}
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKey.trim()}
                      style={{ backgroundColor: "#FFFFFF", color: "#111", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: apiKey.trim() ? "pointer" : "default" }}
                    >
                      Save Key
                    </button>
                  </div>
                </div>

                {/* Ping Test */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.4)", color: "#93C5FD", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {testing ? "Testing..." : "⚡ Test Server Ping"}
                  </button>
                  {testStatus && <span style={{ fontSize: "12px", color: "#A1A1AA" }}>{testStatus}</span>}
                </div>

                {/* User Session Info */}
                <div style={{ backgroundColor: "#27272A", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12.5px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px" }}>
                    <span style={{ color: "#71717A" }}>Email:</span>
                    <span style={{ color: "#EDEDED" }}>{user?.email || "consultant@enterprise.nexus"}</span>
                    <span style={{ color: "#71717A" }}>Role:</span>
                    <span style={{ color: "#34D399", fontWeight: "600" }}>{user?.role || "SAP Senior Architect"}</span>
                    <span style={{ color: "#71717A" }}>Client:</span>
                    <span style={{ color: "#EDEDED" }}>Wakefit DC (TN03 / TN10)</span>
                  </div>
                </div>

                <div style={{ paddingTop: "10px" }}>
                  <button
                    onClick={() => { onClose(); onLogout && onLogout(); }}
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.35)", color: "#EF4444", padding: "8px 16px", borderRadius: "6px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Sign Out of Nexus
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: CAPABILITIES */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "capabilities" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>System Capabilities</h2>
                  <p style={{ fontSize: "12.5px", color: "#A1A1AA", marginTop: "4px" }}>Activate or deactivate core AI reasoning tools and execution engines.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { key: "grounding", name: "Official SAP Search Grounding", desc: "Live queries against help.sap.com & SAP Community with source cards" },
                    { key: "codeExecution", name: "Python Sandbox Code Engine", desc: "Local sandboxed Python execution for mathematical verification & charts" },
                    { key: "toolAgent", name: "Autonomous SAP Tool Agent", desc: "Multi-turn investigation with human-in-the-loop state mutation" },
                    { key: "voiceHandover", name: "Audio Shift Handover Processor", desc: "Native multimodal speech ingestion and auto-persistence to SQLite" },
                    { key: "warehouseVision", name: "Warehouse Layout Visualizer", desc: "2D/SVG blueprint generator with interactive zoom and SVG/PNG export" }
                  ].map(c => {
                    const enabled = settings.capabilities?.[c.key] !== false;
                    return (
                      <div
                        key={c.key}
                        onClick={() => {
                          const nextCaps = { ...(settings.capabilities || {}), [c.key]: !enabled };
                          handleSaveSettings({ ...settings, capabilities: nextCaps });
                        }}
                        style={{
                          backgroundColor: "#27272A",
                          border: enabled ? "1px solid rgba(52, 211, 153, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>{c.name}</div>
                          <div style={{ fontSize: "11.5px", color: "#A1A1AA", marginTop: "2px" }}>{c.desc}</div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: enabled ? "#34D399" : "#71717A" }}>
                          {enabled ? "✓ Enabled" : "Disabled"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: CLAUDE CODE / NEXUS CODE */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "nexus_code" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>Claude Code / Sandbox</h2>
                  <p style={{ fontSize: "12.5px", color: "#A1A1AA", marginTop: "4px" }}>Local execution sandbox, ABAP syntax validator, and code generation settings.</p>
                </div>

                <div style={{ backgroundColor: "#27272A", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12.5px" }}>
                  <div style={{ fontWeight: "600", color: "#FFFFFF", marginBottom: "6px" }}>Python Execution Engine Status</div>
                  <div style={{ color: "#34D399", fontFamily: "monospace" }}>Runtime: Python 3.12 (Embedded Subprocess Sandbox) • Port 3456 Active</div>
                  <p style={{ color: "#A1A1AA", marginTop: "8px" }}>Allows instant calculation of warehouse capacities, wave distributions, and data migration checksums.</p>
                </div>

                <div style={{ backgroundColor: "#27272A", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12.5px" }}>
                  <div style={{ fontWeight: "600", color: "#FFFFFF", marginBottom: "6px" }}>Clean Core ABAP Strictness</div>
                  <p style={{ color: "#A1A1AA", marginBottom: "10px" }}>Enforce RAP (RESTful Application Programming) and reject deprecated direct database modifications.</p>
                  <span style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "rgba(52, 211, 153, 0.2)", color: "#34D399", fontWeight: "600" }}>Tier 1 & Tier 2 Extensions Only</span>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: CONNECTORS */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "connectors" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>Enterprise Connectors</h2>
                  <p style={{ fontSize: "12.5px", color: "#A1A1AA", marginTop: "4px" }}>Manage live connections to ERP landscapes, BTP Event Mesh, and source control.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { name: "SAP S/4HANA 2023 FPS02", type: "RFC / OData Destination", status: "Connected (Client 100)", active: true },
                    { name: "SAP Event Mesh (BTP)", type: "CloudEvents Webhook", status: "Listening (SMQ2/EDIDC)", active: true },
                    { name: "Chezzion Enterprise Template API", type: "REST / Document Factory", status: "Active (v3.2)", active: true },
                    { name: "GitHub Corporate Repo", type: "Version Control", status: "Standby", active: false }
                  ].map((conn, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#27272A",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>{conn.name}</div>
                        <div style={{ fontSize: "11.5px", color: "#A1A1AA", marginTop: "2px" }}>{conn.type}</div>
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: "600", color: conn.active ? "#34D399" : "#71717A" }}>
                        {conn.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB: PLUGINS */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "plugins" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>Installed Plugins</h2>
                  <p style={{ fontSize: "12.5px", color: "#A1A1AA", marginTop: "4px" }}>Manage document generators, visual diagram engines, and format exporters.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { name: "Microsoft Word (.docx) Engine", desc: "Generates formatted Functional Specifications & Blueprints with custom styling" },
                    { name: "Microsoft PowerPoint (.pptx) Deck Builder", desc: "Builds 16:9 executive presentation decks for client workshops" },
                    { name: "S/4HANA Migration Cockpit (.xlsx)", desc: "Builds multi-sheet master data workbooks with data validation" },
                    { name: "Mermaid & SVG Architecture Visualizer", desc: "Renders live interactive swimlanes and process graphs in chat" }
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#242426",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px 16px"
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>{p.name}</div>
                      <div style={{ fontSize: "11.5px", color: "#A1A1AA", marginTop: "4px", lineHeight: "1.4" }}>{p.desc}</div>
                      <div style={{ marginTop: "10px", fontSize: "11.5px", color: "#34D399", fontWeight: "600" }}>✓ Active in Workspace</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback for other settings tabs (Privacy, Billing, Memory, Reflect, Time) */}
            {["privacy", "billing", "memory", "reflect", "time_focus"].includes(activeTab) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", textTransform: "capitalize", margin: 0 }}>
                  {activeTab.replace("_", " & ")}
                </h2>
                <div style={{ backgroundColor: "#27272A", borderRadius: "10px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12.5px" }}>
                  <p style={{ color: "#A1A1AA", lineHeight: "1.5" }}>
                    Configure enterprise policy, audit logs, and data retention rules for {activeTab}. All settings are strictly governed by SAP Clean Core security standards.
                  </p>
                  <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.08)", color: "#EDEDED", fontSize: "11px" }}>Status: Compliant</span>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(52, 211, 153, 0.2)", color: "#34D399", fontSize: "11px" }}>Audit Trail Active</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
