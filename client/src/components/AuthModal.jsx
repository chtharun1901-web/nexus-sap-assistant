import { useState } from "react";
import { api } from "../api.js";

export default function AuthModal({ mode = "login", onClose, onAuth, onSwitch }) {
  // Modes: "login" | "register" | "otp" | "forgot" | "google"
  const [activeTab, setActiveTab] = useState(mode === "register" ? "register" : "otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Enterprise Solutions Architect");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");
  const [devOtpCode, setDevOtpCode] = useState("");
  const [webPreviewUrl, setWebPreviewUrl] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

  // SMTP Settings
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpStatus, setSmtpStatus] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%",
    background: "#FAF9F5",
    border: "1px solid #E5E5DF",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#1C1917",
    fontSize: 13.5,
    outline: "none",
    transition: "all 0.15s ease",
    fontFamily: "inherit"
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = "#D4622B";
    e.target.style.boxShadow = "0 0 0 3px rgba(212, 98, 43, 0.12)";
    e.target.style.background = "#FFFFFF";
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = "#E5E5DF";
    e.target.style.boxShadow = "none";
    e.target.style.background = "#FAF9F5";
  };

  const handleSaveSmtp = async (e) => {
    e && e.preventDefault();
    if (!smtpUser || !smtpPass) {
      setSmtpStatus("Please provide both Gmail email and 16-character App Password");
      return;
    }
    try {
      await api.configureSmtp({ user: smtpUser.trim(), pass: smtpPass.trim() });
      setSmtpStatus("✓ Gmail SMTP configured! Live OTP emails will now deliver directly to inboxes.");
      setTimeout(() => setShowSmtpConfig(false), 2500);
    } catch (err) {
      setSmtpStatus("⚠ " + err.message);
    }
  };

  const handleSendOtp = async (e) => {
    e && e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address to receive your OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.sendOtp({ email });
      setOtpSent(true);
      if (res.testOtp) setDevOtpCode(res.testOtp);
      if (res.webPreviewUrl) setWebPreviewUrl(res.webPreviewUrl);
      if (res.html) setEmailHtml(res.html);
      setOtpNotice(`✓ Verification code dispatched to ${email}.`);
    } catch (err) {
      setError(err.message || "Failed to send OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmail = async () => {
    try {
      const res = await api.getLatestEmail(email);
      if (res.email) {
        setEmailHtml(res.email.html || "");
        if (res.email.webPreviewUrl) setWebPreviewUrl(res.email.webPreviewUrl);
        if (res.email.code) setDevOtpCode(res.email.code);
      }
      setShowEmailModal(true);
    } catch (e) {
      setShowEmailModal(true);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setError("Please enter the verification code sent to your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const d = await api.verifyOtp({ email, otp: otpCode.trim() });
      if (d && d.user) onAuth(d.user);
      else throw new Error("OTP verification failed");
    } catch (err) {
      setError(err.message || "Invalid or expired OTP code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitStandard = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const d = await api.register({
        email,
        password,
        displayName: name.trim() || email.split("@")[0],
        name: name.trim() || email.split("@")[0],
        role
      });
      if (d && d.user) onAuth(d.user);
      else throw new Error("No user returned from server");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28, 25, 23, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid var(--border-subtle, #E5E5DF)",
          borderRadius: 16,
          padding: "32px",
          width: 440,
          maxWidth: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            background: "none",
            border: "none",
            color: "#78716C",
            fontSize: 16,
            cursor: "pointer",
            lineHeight: 1,
            width: 28,
            height: 28,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s ease, color 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.06)";
            e.currentTarget.style.color = "#1C1917";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#78716C";
          }}
          title="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                background: "rgba(212, 98, 43, 0.08)",
                border: "1px solid rgba(212, 98, 43, 0.25)",
                color: "#D4622B",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-mono, monospace)"
              }}
            >
              NEXUS ENTERPRISE AI
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1C1917", letterSpacing: "-0.02em" }}>
            {activeTab === "otp" && "Passwordless OTP Login"}
            {activeTab === "register" && "Create Nexus Account"}
          </h2>
          <p style={{ fontSize: 13, color: "#78716C", marginTop: 4 }}>
            Direct Gmail OTP Authentication · Secure Enterprise Workspace
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: "#F5F5F0",
            padding: 4,
            borderRadius: 10,
            border: "1px solid #E5E5DF"
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab("otp"); setError(""); setOtpNotice(""); }}
            style={{
              flex: 1,
              background: activeTab === "otp" ? "#FFFFFF" : "transparent",
              border: activeTab === "otp" ? "1px solid rgba(0,0,0,0.14)" : "1px solid transparent",
              borderRadius: 8,
              color: activeTab === "otp" ? "#1C1917" : "#78716C",
              boxShadow: activeTab === "otp" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 0",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            🔑 OTP Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("register"); setError(""); setOtpNotice(""); }}
            style={{
              flex: 1,
              background: activeTab === "register" ? "#FFFFFF" : "transparent",
              border: activeTab === "register" ? "1px solid rgba(0,0,0,0.14)" : "1px solid transparent",
              borderRadius: 8,
              color: activeTab === "register" ? "#1C1917" : "#78716C",
              boxShadow: activeTab === "register" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 0",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            ✦ Create Account
          </button>
        </div>

        {/* Notice Banner */}
        {otpNotice && (
          <div
            style={{
              background: "rgba(212, 98, 43, 0.08)",
              border: "1px solid rgba(212, 98, 43, 0.25)",
              color: "#D4622B",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 16,
              lineHeight: 1.4,
              fontWeight: 500
            }}
          >
            ℹ {otpNotice}
          </div>
        )}

        {/* 1. CREATE ACCOUNT FORM */}
        {activeTab === "register" && (
          <form onSubmit={submitStandard} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#44403C", marginBottom: 5, display: "block" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="e.g. Raghav Sharma"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#44403C", marginBottom: 5, display: "block" }}>
                Enterprise Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{
                  ...inputStyle,
                  cursor: "pointer"
                }}
              >
                <option value="Enterprise Solutions Architect">Enterprise Solutions Architect</option>
                <option value="Systems Operations Lead">Systems Operations Lead</option>
                <option value="Lead Infrastructure Engineer">Lead Infrastructure Engineer</option>
                <option value="Technical Integration Specialist">Technical Integration Specialist</option>
                <option value="Enterprise Consultant">Enterprise Consultant</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#44403C", marginBottom: 5, display: "block" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="you@company.com"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#44403C" }}>Password</label>
                <span style={{ fontSize: 11, color: "#78716C" }}>min 8 characters</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #FCA5A5",
                  color: "#991B1B",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  lineHeight: 1.4,
                  fontWeight: 500
                }}
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                background: "#D4622B",
                color: "#FFFFFF",
                fontWeight: 650,
                borderRadius: 8,
                padding: "11px 16px",
                fontSize: 14,
                border: "none",
                boxShadow: "0 1px 3px rgba(212, 98, 43, 0.25)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                width: "100%",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#C85824";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#D4622B";
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* 2. PASSWORDLESS OTP LOGIN FORM */}
        {activeTab === "otp" && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#44403C", marginBottom: 5, display: "block" }}>
                Registered Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={otpSent}
                required
                placeholder="you@company.com"
                style={{
                  ...inputStyle,
                  opacity: otpSent ? 0.75 : 1
                }}
              />
            </div>

            {otpSent && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: "#44403C" }}>6-Digit OTP Code</label>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(""); }}
                    style={{ background: "none", border: "none", color: "#D4622B", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Change Email / Resend
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  required
                  placeholder="123456"
                  style={{
                    ...inputStyle,
                    color: "#D4622B",
                    fontSize: 22,
                    fontWeight: 750,
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "6px",
                    textAlign: "center"
                  }}
                />

                {/* Live Email Template Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleViewEmail}
                    style={{
                      background: "rgba(212, 98, 43, 0.08)",
                      border: "1px solid rgba(212, 98, 43, 0.25)",
                      color: "#D4622B",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <span>📬 View Sent Email Template</span>
                  </button>

                  {devOtpCode && (
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpCode)}
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#065F46",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5
                      }}
                      title="Paste generated verification code"
                    >
                      <span>⚡ Auto-fill Code ({devOtpCode})</span>
                    </button>
                  )}

                  {webPreviewUrl && (
                    <a
                      href={webPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#FAF9F5",
                        border: "1px solid #E5E5DF",
                        color: "#44403C",
                        fontSize: 12,
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderRadius: 6,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5
                      }}
                    >
                      <span>🔗 Web Mailbox</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #FCA5A5",
                  color: "#991B1B",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  lineHeight: 1.4,
                  fontWeight: 500
                }}
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                background: "#D4622B",
                color: "#FFFFFF",
                fontWeight: 650,
                borderRadius: 8,
                padding: "11px 16px",
                fontSize: 14,
                border: "none",
                boxShadow: "0 1px 3px rgba(212, 98, 43, 0.25)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                width: "100%",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#C85824";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#D4622B";
              }}
            >
              {loading ? "Processing..." : otpSent ? "Verify Code & Log In" : "Send One-Time Passcode (OTP)"}
            </button>

            {/* Expandable SMTP Settings */}
            <div style={{ marginTop: 10, borderTop: "1px solid #E5E5DF", paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#78716C",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: 0
                }}
              >
                <span>⚙ Configure Real Gmail / SMTP Dispatch {showSmtpConfig ? "▲" : "▼"}</span>
              </button>

              {showSmtpConfig && (
                <div style={{ marginTop: 10, background: "#FAF9F5", border: "1px solid #E5E5DF", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, color: "#78716C", marginBottom: 8, lineHeight: 1.4 }}>
                    Enter your Gmail & 16-character App Password to deliver live to your inbox:
                  </div>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 12.5, marginBottom: 8 }}
                  />
                  <input
                    type="password"
                    placeholder="Gmail App Password (16 chars)"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 12.5, marginBottom: 8 }}
                  />
                  {smtpStatus && (
                    <div
                      style={{
                        fontSize: 12,
                        color: smtpStatus.startsWith("✓") ? "#065F46" : "#991B1B",
                        background: smtpStatus.startsWith("✓") ? "#D1FAE5" : "#FEE2E2",
                        padding: "6px 10px",
                        borderRadius: 6,
                        marginBottom: 8
                      }}
                    >
                      {smtpStatus}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    style={{
                      background: "#D4622B",
                      border: "none",
                      color: "#FFFFFF",
                      padding: "7px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 650,
                      cursor: "pointer"
                    }}
                  >
                    Save SMTP Settings
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ── SENT EMAIL LIVE TEMPLATE VIEWER MODAL ────────────────── */}
      {showEmailModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 25, 23, 0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setShowEmailModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E5DF",
              borderRadius: 16,
              width: 580,
              maxWidth: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E5E5DF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#FAF9F5"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1C1917" }}>📬 Dispatched Email Template</span>
                <span
                  style={{
                    fontSize: 11,
                    background: "rgba(212, 98, 43, 0.08)",
                    border: "1px solid rgba(212, 98, 43, 0.2)",
                    color: "#D4622B",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono, monospace)"
                  }}
                >
                  To: {email || "user@enterprise.com"}
                </span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#78716C",
                  fontSize: 16,
                  cursor: "pointer",
                  borderRadius: 4,
                  padding: "2px 6px"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#F5F5F0" }}>
              {emailHtml ? (
                <iframe
                  srcDoc={emailHtml}
                  title="Rendered Email"
                  style={{ width: "100%", height: 420, border: "1px solid #E5E5DF", borderRadius: 8, background: "#FFFFFF" }}
                />
              ) : (
                <div style={{ padding: 24, textAlign: "center", color: "#78716C", fontSize: 13 }}>
                  Loading sent email template...
                </div>
              )}
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #E5E5DF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#FAF9F5"
              }}
            >
              {devOtpCode ? (
                <span style={{ fontSize: 12.5, color: "#065F46", fontFamily: "var(--font-mono, monospace)" }}>
                  Code: <strong>{devOtpCode}</strong>
                </span>
              ) : (
                <span />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                {devOtpCode && (
                  <button
                    type="button"
                    onClick={() => { setOtpCode(devOtpCode); setShowEmailModal(false); }}
                    style={{
                      background: "#D4622B",
                      border: "none",
                      color: "#FFFFFF",
                      borderRadius: 6,
                      fontWeight: 650,
                      padding: "7px 14px",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Use Code & Fill
                  </button>
                )}
                {webPreviewUrl && (
                  <a
                    href={webPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E5DF",
                      color: "#1C1917",
                      padding: "7px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      textDecoration: "none"
                    }}
                  >
                    Open Live Web Mailbox ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
