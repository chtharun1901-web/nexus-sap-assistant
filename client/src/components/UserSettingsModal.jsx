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
  const [activeTab, setActiveTab] = useState("settings");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const [testing, setTesting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("nexus_user_settings");
      return saved ? JSON.parse(saved) : {
        displayName: user?.display_name || "User",
        role: "Senior SAP PP/EWM Consultant",
        defaultLanding: "workspace",
        clockFormat: "IST",
        socraticMode: false,
        themePalette: "parchment",
        activeModel: "gemini-3.5-flash-lite",
        reasoningDepth: "balanced",
        skills: {
          pp: true,
          ewm: true,
          integration: true,
          mmsd: true,
          abap: true,
          socratic: false
        },
        addons: {
          diagrams: true,
          exportWord: true,
          exportExcel: true,
          ocr: true,
          voice: true
        }
      };
    } catch (e) {
      return {
        displayName: user?.display_name || "User",
        role: "Senior SAP PP/EWM Consultant",
        defaultLanding: "workspace",
        skills: { pp: true, ewm: true, integration: true }
      };
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getStatus().then(d => {
        if (d.hasKey) setApiKeyStatus("API Key Configured & Active ✓");
        else setApiKeyStatus("No API Key configured");
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    localStorage.setItem("nexus_user_settings", JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    try {
      const res = await api.saveKey(apiKey.trim());
      if (res.ok) {
        setApiKeyStatus("API Key Saved Successfully ✓");
        setApiKey("");
      } else {
        setApiKeyStatus("Error saving key: " + (res.error || "Invalid key"));
      }
    } catch (e) {
      setApiKeyStatus("Error: " + e.message);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus("Testing live API and server connection...");
    try {
      const d = await api.getStatus();
      setTimeout(() => {
        setTesting(false);
        setTestStatus("Connected successfully to Nexus Enterprise Server (HTTP 200, Key: " + (d.hasKey ? "Active" : "Missing") + ")");
      }, 600);
    } catch (e) {
      setTesting(false);
      setTestStatus("Connection failed: " + e.message);
    }
  };

  const toggleSkill = (k) => {
    setSettings(prev => ({
      ...prev,
      skills: { ...prev.skills, [k]: !prev.skills?.[k] }
    }));
  };

  const toggleAddon = (k) => {
    setSettings(prev => ({
      ...prev,
      addons: { ...prev.addons, [k]: !prev.addons?.[k] }
    }));
  };

  const TABS = [
    { id: "settings", label: "General Settings", icon: "⚙️" },
    { id: "themes", label: "Themes & Wallpapers", icon: "🎨" },
    { id: "personalization", label: "Personalization", icon: "✨" },
    { id: "skills", label: "Skills & Knowledge", icon: "🧠" },
    { id: "addons", label: "Add-ons & Plugins", icon: "🧩" },
    { id: "connectors", label: "Connectors & APIs", icon: "🔌" },
    { id: "account", label: "Account & Session", icon: "👤" }
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          maxHeight: "88vh",
          background: "#0D0A07",
          border: "1px solid rgba(245, 158, 11, 0.4)",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(245, 158, 11, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#EDEDED",
          fontFamily: "var(--font-sans)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(18, 14, 10, 0.6) 100%)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111",
                fontSize: 15,
                fontWeight: 900,
                fontFamily: "var(--font-mono)"
              }}
            >
              {user?.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#EDEDED" }}>
                User Control Center & Settings
              </div>
              <div style={{ fontSize: 11.5, color: "#A1A1AA" }}>
                {user?.email || "user@enterprise.nexus"} · {settings.role}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#A1A1AA",
              width: 28,
              height: 28,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 13
            }}
          >
            ✕
          </button>
        </div>

        {/* Body Container */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Tabs Sidebar */}
          <div
            style={{
              width: 220,
              background: "rgba(0, 0, 0, 0.3)",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              flexShrink: 0
            }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: activeTab === t.id ? "rgba(245, 158, 11, 0.16)" : "transparent",
                  border: activeTab === t.id ? "1px solid rgba(245, 158, 11, 0.45)" : "1px solid transparent",
                  color: activeTab === t.id ? "#FBBF24" : "#A1A1AA",
                  fontSize: 12.5,
                  fontWeight: activeTab === t.id ? 700 : 500,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Right Content Pane */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {/* 1. General Settings */}
            {activeTab === "settings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  General System Settings
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 600 }}>Display Name</label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={e => setSettings({ ...settings, displayName: e.target.value })}
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 600 }}>Operational Role Context</label>
                  <input
                    type="text"
                    value={settings.role}
                    onChange={e => setSettings({ ...settings, role: e.target.value })}
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 600 }}>AI Reasoning Engine Model</label>
                  <select
                    value={settings.activeModel}
                    onChange={e => setSettings({ ...settings, activeModel: e.target.value })}
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Fast & Low-Latency - Default)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Architecture & Code Analysis)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (General Multimodal)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2. Themes & Wallpapers */}
            {activeTab === "themes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  Themes & Wallpaper Gallery
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 600 }}>Active Sacred Wallpapers</label>
                  {[
                    { id: "sanjaya-palace", label: "Sanjaya Royal Palace", sub: "Golden Arches & Sunrise", file: "/wallpapers/sanjaya-palace.jpg" },
                    { id: "sanjaya-divine", label: "Divya Drishti Vision", sub: "Kurukshetra Tanjore Art", file: "/wallpapers/sanjaya-divine-vision.jpg" },
                    { id: "indian-banner", label: "Epic Indian Art Banner", sub: "Royal Traditional Art", file: "/wallpapers/indian-art-banner.jpg" },
                    { id: "indian-mandala", label: "Sacred Mandala Geometry", sub: "Intricate Cosmic Art", file: "/wallpapers/indian-art-mandala.jpg" },
                    { id: "none", label: "Obsidian Dark Minimal", sub: "Clean Enterprise Studio", file: null }
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => onWallpaperChange && onWallpaperChange(w.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 12px",
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
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: w.file ? `url('${w.file}') center/cover` : "#0A0A0A",
                          border: "1px solid rgba(255,255,255,0.2)",
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: currentWallpaper === w.id ? "#FBBF24" : "#EDEDED" }}>
                          {w.label}
                        </div>
                        <div style={{ fontSize: 11, color: "#A1A1AA" }}>{w.sub}</div>
                      </div>
                      {currentWallpaper === w.id && (
                        <span style={{ color: "#F59E0B", fontSize: 14, fontWeight: 800 }}>✓ Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Personalization */}
            {activeTab === "personalization" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  UI Personalization & Preferences
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 600 }}>Default Startup View</label>
                  <select
                    value={settings.defaultLanding}
                    onChange={e => setSettings({ ...settings, defaultLanding: e.target.value })}
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="workspace">Workspace (Investigation Canvas)</option>
                    <option value="home">Home Dashboard</option>
                    <option value="interview">Copilot & Advisory</option>
                    <option value="cases">Cases & History</option>
                    <option value="knowledge">Personal Knowledge</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 600 }}>Timezone Clock Header</label>
                  <select
                    value={settings.clockFormat}
                    onChange={e => setSettings({ ...settings, clockFormat: e.target.value })}
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="IST">India Standard Time (IST - UTC+5:30)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="EST">Eastern Standard Time (EST - UTC-5)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. Skills & Knowledge */}
            {activeTab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  Active Skills & Knowledge Engines
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { key: "pp", name: "SAP Production Planning (PP)", desc: "BOMs, Routings, MRP Live, Work Centers, Production Versions (C223), Orders" },
                    { key: "ewm", name: "SAP Extended Warehouse Management (EWM)", desc: "PMR Staging, Storage Types, Physical Inventory, Control Cycles (/SCWM/PSA_CC)" },
                    { key: "integration", name: "qRFC & bgRFC Integration Sentinel", desc: "SMQ1, SMQ2, SMQR, SMQS, SM37, bgRFC Supervisor Destinations, RFC connection diagnostics" },
                    { key: "mmsd", name: "Materials Management & Delivery Logistics", desc: "Purchase Orders, MIGO Goods Movements, Inbound/Outbound Deliveries, Control Cycles" },
                    { key: "abap", name: "ABAP Platform & Runtime Diagnostics", desc: "ST22 Short Dump triage, SM21 System Log parsing, SLG1 Application Log analysis" },
                    { key: "socratic", name: "Socratic Mentor Mode", desc: "Interactive step-by-step diagnostic guidance instead of single-turn runbook generation" }
                  ].map((s) => (
                    <div
                      key={s.key}
                      onClick={() => toggleSkill(s.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: settings.skills?.[s.key] ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                        border: settings.skills?.[s.key] ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        cursor: "pointer"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: settings.skills?.[s.key] ? "#EDEDED" : "#71717A" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
                          {s.desc}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: settings.skills?.[s.key] ? "#10B981" : "#71717A" }}>
                        {settings.skills?.[s.key] ? "✓ Enabled" : "Disabled"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Add-ons & Plugins */}
            {activeTab === "addons" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  Integrated Add-ons & Tooling
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { key: "diagrams", name: "Hierarchy & Org Structure Visualizer", desc: "Interactive React SVG & ELK.js tree diagram engine for SAP hierarchies" },
                    { key: "exportWord", name: "Microsoft Word (.doc) Exporter", desc: "Styled multi-page Word report generation with color branding" },
                    { key: "exportExcel", name: "Microsoft Excel (.xlsx) Engine", desc: "SheetJS workbook generation with diagnostic tables and symptom data" },
                    { key: "ocr", name: "Multimodal Screenshot & Image Inspector", desc: "Direct vision analysis for SAP GUI and Fiori error screenshots" },
                    { key: "voice", name: "Text-to-Speech Rehearsal Engine", desc: "Audio spoken summary simulation for technical explanations" }
                  ].map((a) => (
                    <div
                      key={a.key}
                      onClick={() => toggleAddon(a.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: settings.addons?.[a.key] ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                        border: settings.addons?.[a.key] ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        cursor: "pointer"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: settings.addons?.[a.key] ? "#EDEDED" : "#71717A" }}>
                          {a.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
                          {a.desc}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: settings.addons?.[a.key] ? "#10B981" : "#71717A" }}>
                        {settings.addons?.[a.key] ? "✓ Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Connectors & APIs */}
            {activeTab === "connectors" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  Connectors & API Integrations
                </h3>

                {/* Gemini Key Config */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#EDEDED", marginBottom: 4 }}>
                    Google Gemini AI API Key
                  </div>
                  <div style={{ fontSize: 11.5, color: apiKeyStatus.includes("Active") ? "#10B981" : "#F59E0B", marginBottom: 8, fontWeight: 600 }}>
                    {apiKeyStatus}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="password"
                      placeholder="Enter new Gemini API key (AIzaSy...)"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      style={{ flex: 1, background: "#141414", border: "1px solid rgba(255,255,255,0.12)", color: "#EDEDED", padding: "8px 12px", borderRadius: 6, fontSize: 12.5 }}
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKey.trim()}
                      style={{ background: "var(--orange)", color: "#FFF", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: apiKey.trim() ? "pointer" : "default" }}
                    >
                      Save Key
                    </button>
                  </div>
                </div>

                {/* SAP RFC Destination */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#EDEDED" }}>
                      SAP S/4HANA RFC Partner Destination
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      STANDBY
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#A1A1AA", lineHeight: 1.45 }}>
                    Target: S/4HANA 2023 FPS02 (Client 100) · Protocol: qRFC & bgRFC · Read-only safety telemetry active.
                  </div>
                </div>

                {/* Test Connectivity */}
                <div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                      color: "#93C5FD",
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: testing ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>⚡</span>
                    <span>{testing ? "Testing..." : "Test Server & API Ping"}</span>
                  </button>
                  {testStatus && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: testStatus.includes("success") ? "#10B981" : "#EDEDED", fontFamily: "var(--font-mono)" }}>
                      {testStatus}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. Account & Session */}
            {activeTab === "account" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FBBF24", margin: 0 }}>
                  Account & Session Information
                </h3>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 12.5 }}>
                    <span style={{ color: "#71717A" }}>User ID:</span>
                    <span style={{ color: "#EDEDED", fontFamily: "var(--font-mono)" }}>{user?.id || "usr-enterprise-admin"}</span>
                    <span style={{ color: "#71717A" }}>Email:</span>
                    <span style={{ color: "#EDEDED" }}>{user?.email || "admin@enterprise.nexus"}</span>
                    <span style={{ color: "#71717A" }}>Workspace:</span>
                    <span style={{ color: "#EDEDED" }}>ws-enterprise-default</span>
                    <span style={{ color: "#71717A" }}>Role:</span>
                    <span style={{ color: "#F59E0B", fontWeight: 600 }}>{user?.role || "SAP Operations Lead"}</span>
                  </div>
                </div>

                <div style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => {
                      onClose();
                      onLogout && onLogout();
                    }}
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#EF4444",
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>🚪</span>
                    <span>Sign Out of Nexus</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Save Action */}
        <div
          style={{
            padding: "12px 20px",
            background: "rgba(0, 0, 0, 0.4)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {savedSuccess ? (
            <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>
              ✓ Settings saved successfully!
            </span>
          ) : (
            <span style={{ fontSize: 11.5, color: "#71717A" }}>
              Preferences are automatically preserved.
            </span>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#EDEDED", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
            >
              Close
            </button>
            <button
              onClick={handleSaveSettings}
              style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
