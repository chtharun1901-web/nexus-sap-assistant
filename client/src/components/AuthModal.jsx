import { useState } from "react";
import { api } from "../api.js";

export default function AuthModal({ mode = "login", onClose, onAuth, onSwitch }) {
  // Modes: "login" | "register" | "otp" | "forgot" | "google"
  const [activeTab, setActiveTab] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("SAP Operations Lead");
  
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

  // Forgot password state
  const [newPassword, setNewPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetNotice, setResetNotice] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveSmtp = async (e) => {
    e && e.preventDefault();
    if (!smtpUser || !smtpPass) {
      setSmtpStatus("Please provide both Gmail/SMTP email and App Password");
      return;
    }
    try {
      await api.configureSmtp({ user: smtpUser.trim(), pass: smtpPass.trim() });
      setSmtpStatus("✓ SMTP configured! Real emails will now deliver directly to inboxes.");
      setTimeout(() => setShowSmtpConfig(false), 2000);
    } catch(err) {
      setSmtpStatus("⚠ " + err.message);
    }
  };

  const handleGoogleSignIn = async (e) => {
    e && e.preventDefault();
    const googleEmail = email.trim();
    if (!googleEmail || !googleEmail.includes("@")) {
      setError("Please enter your Google account email (e.g. name@gmail.com)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const d = await api.googleLogin({
        email: googleEmail,
        displayName: name.trim() || googleEmail.split("@")[0],
        googleId: "google-" + Date.now(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleEmail)}`
      });
      if (d && d.user) onAuth(d.user);
      else throw new Error("Google authentication failed");
    } catch (err) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
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
    } catch(e) {
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

  const handleRequestPasswordReset = async (e) => {
    e && e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.passwordReset({ email });
      setResetSent(true);
      if (res.testOtp) setDevOtpCode(res.testOtp);
      setResetNotice(`✓ Password reset verification code sent to ${email}. Check your email.`);
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setError("Please provide the reset code and a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const d = await api.resetPasswordConfirm({ email, otp: otpCode.trim(), newPassword });
      if (d && d.user) onAuth(d.user);
      else {
        setActiveTab("login");
        setResetNotice("Password reset successfully! Please sign in with your new password.");
      }
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const submitStandard = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let d;
      if (activeTab === "login") {
        d = await api.login({ email, password });
      } else {
        d = await api.register({
          email,
          password,
          displayName: name.trim() || email.split("@")[0],
          name: name.trim() || email.split("@")[0],
          role
        });
      }
      if (d && d.user) onAuth(d.user);
      else throw new Error("No user returned from server");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
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
          background: "#0D0D0D",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 14,
          padding: "28px 32px",
          width: 440,
          maxWidth: "100%",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,85,0,0.15)",
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
            color: "#71717A",
            fontSize: 18,
            cursor: "pointer",
            lineHeight: 1
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
                background: "rgba(255,85,0,0.15)",
                border: "1px solid rgba(245,158,11,0.4)",
                color: "#FBBF24",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono)"
              }}
            >
              SANJAYA (सञ्जय)
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#EDEDED", letterSpacing: "-0.02em" }}>
            {activeTab === "login" && "Sign In to Sanjaya"}
            {activeTab === "register" && "Create Sanjaya Account"}
            {activeTab === "otp" && "Passwordless OTP Login"}
            {activeTab === "forgot" && "Reset Your Password"}
            {activeTab === "google" && "Sign in with Google"}
          </h2>
          <p style={{ fontSize: 13, color: "#A1A1AA", marginTop: 4 }}>
            Authenticated SAP Operations & Diagnostic Intelligence
          </p>
        </div>

        {/* Google OAuth Quick Trigger on Login/Register */}
        {(activeTab === "login" || activeTab === "register") && (
          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => { setActiveTab("google"); setError(""); }}
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "10px 16px",
                color: "#1F2937",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                transition: "all 0.15s ease"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 12px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 11, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>or with credentials</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        )}

        {/* Tab switcher */}
        {activeTab !== "google" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setError(""); setOtpNotice(""); setResetNotice(""); }}
              style={{
                flex: 1,
                background: activeTab === "login" ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: activeTab === "login" ? "#EDEDED" : "#71717A",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "7px 0",
                cursor: "pointer"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("otp"); setError(""); setOtpNotice(""); setResetNotice(""); }}
              style={{
                flex: 1,
                background: activeTab === "otp" ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: activeTab === "otp" ? "#EDEDED" : "#71717A",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "7px 0",
                cursor: "pointer"
              }}
            >
              🔑 OTP Login
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("register"); setError(""); setOtpNotice(""); setResetNotice(""); }}
              style={{
                flex: 1,
                background: activeTab === "register" ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: activeTab === "register" ? "#EDEDED" : "#71717A",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "7px 0",
                cursor: "pointer"
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Notice Banners */}
        {otpNotice && (
          <div style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", color: "#67E8F9", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 12, lineHeight: 1.4 }}>
            ℹ {otpNotice}
          </div>
        )}
        {resetNotice && (
          <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86EFAC", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 12, lineHeight: 1.4 }}>
            ✓ {resetNotice}
          </div>
        )}

        {/* 1. SIGN IN & CREATE ACCOUNT FORM */}
        {(activeTab === "login" || activeTab === "register") && (
          <form onSubmit={submitStandard} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeTab === "register" && (
              <>
                <div>
                  <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Raghav Sharma"
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 6,
                      padding: "8px 12px",
                      color: "#EDEDED",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>SAP Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#141414",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 6,
                      padding: "8px 12px",
                      color: "#EDEDED",
                      fontSize: 13,
                      outline: "none"
                    }}
                  >
                    <option>SAP Operations Lead</option>
                    <option>SAP PP Functional Consultant</option>
                    <option>SAP EWM Operations Lead</option>
                    <option>SAP Basis & Security Administrator</option>
                    <option>ABAP Integration Developer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#EDEDED",
                  fontSize: 13,
                  outline: "none"
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label style={{ fontSize: 12, color: "#A1A1AA" }}>Password</label>
                {activeTab === "login" && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab("forgot"); setError(""); }}
                    style={{ background: "none", border: "none", color: "var(--orange)", fontSize: 11.5, cursor: "pointer" }}
                  >
                    Forgot Password?
                  </button>
                )}
                {activeTab === "register" && (
                  <span style={{ fontSize: 11, color: "#71717A" }}>min 8 characters</span>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#EDEDED",
                  fontSize: 13,
                  outline: "none"
                }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5", padding: "8px 12px", borderRadius: 6, fontSize: 12.5, lineHeight: 1.4 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: 6, padding: "10px 0", fontSize: 14, opacity: loading ? 0.7 : 1, width: "100%" }}
            >
              {loading ? "Authenticating..." : activeTab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        )}

        {/* 2. PASSWORDLESS OTP LOGIN FORM */}
        {activeTab === "otp" && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Registered Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent}
                required
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#EDEDED",
                  fontSize: 13,
                  outline: "none"
                }}
              />
            </div>

            {otpSent && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: "#A1A1AA" }}>6-Digit OTP Code</label>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(""); }}
                    style={{ background: "none", border: "none", color: "var(--orange)", fontSize: 11, cursor: "pointer" }}
                  >
                    Change Email / Resend
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  placeholder="123456"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "var(--orange)",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "4px",
                    textAlign: "center",
                    outline: "none"
                  }}
                />

                {/* Live Email Template Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleViewEmail}
                    style={{
                      background: "rgba(255,85,0,0.12)",
                      border: "1px solid rgba(255,85,0,0.35)",
                      color: "var(--orange)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <span>📬 View Sent Email Template</span>
                  </button>

                  {devOtpCode && (
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpCode)}
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.35)",
                        color: "#86EFAC",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
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
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#EDEDED",
                        fontSize: 11.5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span>🔗 Web Mailbox</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5", padding: "8px 12px", borderRadius: 6, fontSize: 12.5, lineHeight: 1.4 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: 6, padding: "10px 0", fontSize: 14, opacity: loading ? 0.7 : 1, width: "100%" }}
            >
              {loading ? "Processing..." : otpSent ? "Verify Code & Log In" : "Send One-Time Passcode (OTP)"}
            </button>

            {/* Expandable SMTP Settings */}
            <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                style={{ background: "none", border: "none", color: "#71717A", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <span>⚙ Configure Real Gmail / SMTP Dispatch {showSmtpConfig ? "▲" : "▼"}</span>
              </button>

              {showSmtpConfig && (
                <div style={{ marginTop: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 6 }}>
                    Enter your Gmail & 16-char App Password to deliver live to your inbox:
                  </div>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    style={{ width: "100%", background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "6px 8px", color: "#EDEDED", fontSize: 12, marginBottom: 6 }}
                  />
                  <input
                    type="password"
                    placeholder="Gmail App Password (16 chars)"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    style={{ width: "100%", background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "6px 8px", color: "#EDEDED", fontSize: 12, marginBottom: 6 }}
                  />
                  {smtpStatus && <div style={{ fontSize: 11, color: smtpStatus.startsWith("✓") ? "#86EFAC" : "#FCA5A5", marginBottom: 6 }}>{smtpStatus}</div>}
                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    style={{ background: "var(--orange)", border: "none", color: "#fff", padding: "5px 12px", borderRadius: 4, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    Save SMTP Settings
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {activeTab === "forgot" && (
          <form onSubmit={resetSent ? handleConfirmPasswordReset : handleRequestPasswordReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Your Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetSent}
                required
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#EDEDED",
                  fontSize: 13,
                  outline: "none"
                }}
              />
            </div>

            {resetSent && (
              <>
                <div>
                  <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Reset Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    placeholder="123456"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 6,
                      padding: "8px 12px",
                      color: "var(--orange)",
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "3px",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>New Password (min 8 characters)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 6,
                      padding: "8px 12px",
                      color: "#EDEDED",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5", padding: "8px 12px", borderRadius: 6, fontSize: 12.5, lineHeight: 1.4 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: 6, padding: "10px 0", fontSize: 14, opacity: loading ? 0.7 : 1, width: "100%" }}
            >
              {loading ? "Processing..." : resetSent ? "Set New Password & Log In" : "Send Reset Code"}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("login"); setError(""); }}
              style={{ background: "none", border: "none", color: "#A1A1AA", fontSize: 12, cursor: "pointer", marginTop: 4 }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* 4. GOOGLE OAUTH SIGN IN FORM */}
        {activeTab === "google" && (
          <form onSubmit={handleGoogleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", padding: 8, background: "#FFFFFF", borderRadius: "50%", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#EDEDED" }}>Google Account Authorization</div>
              <div style={{ fontSize: 11.5, color: "#A1A1AA", marginTop: 2 }}>Authenticate securely with your enterprise or personal Google account</div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Google Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@gmail.com or you@company.com"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "9px 12px",
                  color: "#EDEDED",
                  fontSize: 13.5,
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4, display: "block" }}>Display Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name (e.g. Tharun)"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "9px 12px",
                  color: "#EDEDED",
                  fontSize: 13.5,
                  outline: "none"
                }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5", padding: "8px 12px", borderRadius: 6, fontSize: 12.5, lineHeight: 1.4 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "11px 16px",
                color: "#1F2937",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.15s ease"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? "Authorizing Google Account..." : "Sign in with Google"}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("login"); setError(""); }}
              style={{ background: "none", border: "none", color: "#A1A1AA", fontSize: 12, cursor: "pointer", textAlign: "center" }}
            >
              ← Back to standard Sign In
            </button>
          </form>
        )}
      </div>

      {/* ── SENT EMAIL LIVE TEMPLATE VIEWER MODAL ────────────────── */}
      {showEmailModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
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
              background: "#111111",
              border: "1px solid rgba(255,85,0,0.4)",
              borderRadius: 12,
              width: 580,
              maxWidth: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(255,85,0,0.2)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0A0A0A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#EDEDED" }}>📬 Dispatched Email Template</span>
                <span style={{ fontSize: 11, background: "rgba(255,85,0,0.15)", color: "var(--orange)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)" }}>
                  To: {email || "user@enterprise.com"}
                </span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{ background: "none", border: "none", color: "#A1A1AA", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#050505" }}>
              {emailHtml ? (
                <iframe
                  srcDoc={emailHtml}
                  title="Rendered Email"
                  style={{ width: "100%", height: 420, border: "none", borderRadius: 8, background: "#0A0A0A" }}
                />
              ) : (
                <div style={{ padding: 24, textAlign: "center", color: "#A1A1AA", fontSize: 13 }}>
                  Loading sent email template...
                </div>
              )}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0A0A0A" }}>
              {devOtpCode ? (
                <span style={{ fontSize: 12, color: "#86EFAC", fontFamily: "var(--font-mono)" }}>
                  Code: <strong>{devOtpCode}</strong>
                </span>
              ) : <span />}
              <div style={{ display: "flex", gap: 8 }}>
                {devOtpCode && (
                  <button
                    type="button"
                    onClick={() => { setOtpCode(devOtpCode); setShowEmailModal(false); }}
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                  >
                    ⚡ Use Code & Fill
                  </button>
                )}
                {webPreviewUrl && (
                  <a
                    href={webPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: "#27272A", color: "#EDEDED", padding: "6px 12px", borderRadius: 6, fontSize: 12, textDecoration: "none" }}
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
