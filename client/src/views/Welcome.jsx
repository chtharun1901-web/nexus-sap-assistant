export default function Welcome({ onSignIn, onRegister, onGoogleAuth, onOtpLogin }) {
  const storySections = [
    {
      id: "telemetry",
      layout: "text-left",
      tag: "✦ DIVYA DRISHTI TELEMETRY",
      title: "Real-Time Divine Vision for SAP Queues & EWM Operations",
      desc: "Instantaneous visibility across mission-critical SAP landscapes. Continuous queue depth monitoring, blockage root cause classification, and automated triage for SMQ1, SMQ2, and bgRFC pipelines without human latency.",
      img: "/wallpapers/sanjaya-divine-vision.jpg",
      imgCaption: "Divya Drishti Real-Time Observation",
      highlights: [
        { icon: "⚡", title: "Sub-Second Queue Triage", text: "Isolate blocked delivery queues and SMQR scheduler locks in milliseconds." },
        { icon: "🏛️", title: "S/4HANA & Decentral EWM", text: "Seamless telemetry across complex warehouse management and ERP environments." },
        { icon: "🛡️", title: "Zero Production Disruption", text: "Read-only inspection safeguards that prevent accidental write operations." }
      ]
    },
    {
      id: "grounded",
      layout: "text-right",
      tag: "📜 ZERO-HALLUCINATION REASONING",
      title: "100% Grounded Evidence from Official SAP Help & OSS Notes",
      desc: "Unlike generic chatbots, Sanjaya never guesses. Every diagnostic insight, transaction recommendation, and resolution runbook is strictly anchored in official SAP Help Portal articles and pre-indexed OSS notes.",
      img: "/wallpapers/art-1.jpg",
      imgCaption: "Sacred Knowledge & Verified OSS Vault",
      highlights: [
        { icon: "📖", title: "50,000+ Pre-Indexed Notes", text: "Immediate retrieval of authorized SAP OSS notes and resolution patterns." },
        { icon: "📑", title: "Verifiable Source Citations", text: "Clickable references with exact note numbers, SAP docs, and transaction codes." },
        { icon: "🎯", title: "Deterministic Accuracy", text: "Rigorous evidence verification before presenting any operational guidance." }
      ]
    },
    {
      id: "multimodal",
      layout: "text-left",
      tag: "✨ MULTIMODAL VISION STUDIO",
      title: "Paste Any SAP Error Screenshot for Instant Diagnosis",
      desc: "Skip tedious manual log transcription. Simply paste or upload screenshots from SAP GUI, Fiori Launchpad, or warehouse RF scanners. Sanjaya's vision engine extracts error codes, inspects symptoms, and prescribes the exact fix.",
      img: "/wallpapers/art-4.jpg",
      imgCaption: "Multimodal Visual Error Recognition",
      highlights: [
        { icon: "📸", title: "Instant Clipboard Paste", text: "Paste screenshots directly with Ctrl+V into the investigation studio." },
        { icon: "🔍", title: "Automatic OCR & Symptom Parsing", text: "Extracts T-codes, queue names, and error strings with high fidelity." },
        { icon: "💡", title: "Guided Remediation Sequences", text: "Delivers step-by-step resolution sequences tailored to the visual error." }
      ]
    },
    {
      id: "reporting",
      layout: "text-right",
      tag: "👑 EXECUTIVE DOSSIERS & AUDIT",
      title: "Technical Investigation Dossiers in Excel & Word Formats",
      desc: "Generate executive-ready audit dossiers and runbooks with one click. Complete with color-coded severity tables, verified evidence trails, and step-by-step remediation workflows for management and audit compliance.",
      img: "/wallpapers/sanjaya-palace.jpg",
      imgCaption: "Royal Palace Operational Reporting",
      highlights: [
        { icon: "📊", title: "Structured Excel & Word Export", text: "Beautifully formatted reports ready for executive distribution." },
        { icon: "🔒", title: "Isolated Per-User Workspaces", text: "Role-based access control with secure sandboxed investigation histories." },
        { icon: "💎", title: "Personal Knowledge Library", text: "Save private runbooks, verified SQL snippets, and operational procedures." }
      ]
    }
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Decoupled GPU-accelerated fixed background layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: "linear-gradient(180deg, rgba(8,5,2,0.50) 0%, rgba(12,7,3,0.72) 30%, rgba(6,4,2,0.94) 100%), url('/wallpapers/indian-art-banner.jpg')",
          backgroundPosition: "center top",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          transform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden"
        }}
      />

      {/* Butter-Smooth Scroll Container */}
      <div
        className="smooth-scroll-container"
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingTop: "clamp(20px, 3vh, 36px)",
          paddingBottom: "80px",
          boxSizing: "border-box",
          fontFamily: "var(--font-sans)"
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            gap: 48,
            position: "relative",
            zIndex: 2
          }}
        >
          {/* Top Luxury Header Bar */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(18, 10, 5, 0.92)",
              border: "1px solid rgba(212, 175, 55, 0.45)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "12px 28px",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              transform: "translateZ(0)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3D1C06 0%, #150802 100%)",
                  border: "1.5px solid #D4AF37",
                  boxShadow: "0 0 16px rgba(212,175,55,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FCD34D",
                  fontSize: 17,
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)"
                }}
              >
                SJ
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.06em" }}>
                    SANJAYA
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#D4AF37", fontFamily: "serif" }}>
                    (सञ्जय)
                  </span>
                </div>
                <span style={{ fontSize: 10, color: "#D4AF37", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                  DIVYA DRISHTI FOR ENTERPRISE SAP
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  background: "linear-gradient(90deg, rgba(212,175,55,0.2) 0%, rgba(255,106,0,0.2) 100%)",
                  border: "1px solid rgba(212,175,55,0.5)",
                  color: "#FDE68A",
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}
              >
                ✦ ENTERPRISE INTELLIGENCE
              </span>
              <button
                onClick={onSignIn}
                style={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)",
                  border: "1px solid #F3E5AB",
                  color: "#1C1004",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "8px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                  boxShadow: "0 2px 14px rgba(212,175,55,0.4)"
                }}
              >
                Sign In
              </button>
            </div>
          </header>

          {/* Hero Section: Executive Introduction */}
          <section
            className="story-card-gpu"
            style={{
              background: "rgba(16, 9, 4, 0.90)",
              border: "1px solid rgba(212, 175, 55, 0.45)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 24,
              padding: "48px 44px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(212, 175, 55, 0.15)",
                border: "1px solid rgba(212, 175, 55, 0.45)",
                color: "#FDE68A",
                padding: "5px 16px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 20,
                fontFamily: "var(--font-mono)"
              }}
            >
              <span>👑</span> DIVINE FORESIGHT · UNCOMPROMISING PRECISION
            </div>

            <h1
              style={{
                fontSize: "clamp(32px, 4.5vw, 52px)",
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: 20,
                maxWidth: 880
              }}
            >
              The Agent-Ready<br />
              <span
                style={{
                  background: "linear-gradient(135deg, #FFF9E6 0%, #F59E0B 40%, #D97706 80%, #92400E 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 24px rgba(245,158,11,0.35)"
                }}
              >
                SAP Operations Intelligence
              </span><br />
              & Knowledge Platform
            </h1>

            <p
              style={{
                fontSize: 16,
                color: "#E2D9D0",
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 760
              }}
            >
              Grounded AI reasoning across SAP EWM, qRFC queues, delivery triage, and runbook automation. Engineered for enterprise resilience with zero hallucination and 100% verified citations.
            </p>

            {/* Action Row */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                width: "100%",
                maxWidth: 680,
                background: "rgba(10, 6, 3, 0.75)",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                padding: "18px 24px",
                borderRadius: 16
              }}
            >
              <button
                onClick={onGoogleAuth || onSignIn}
                style={{
                  flex: 1,
                  minWidth: 190,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  background: "#FFFFFF",
                  color: "#1F2937",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.25)"
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

              <button
                onClick={onSignIn}
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 800,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #FF6600 0%, #D9480F 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(255,85,0,0.45)"
                }}
              >
                Sign In
              </button>

              <button
                onClick={onOtpLogin}
                style={{
                  flex: 1,
                  padding: "11px 18px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  borderRadius: 8,
                  color: "#FDE68A",
                  background: "rgba(212, 175, 55, 0.12)",
                  border: "1px solid rgba(212, 175, 55, 0.45)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span>🔑</span> Login with OTP
              </button>

              <button
                onClick={onRegister}
                style={{
                  flex: 1,
                  padding: "11px 18px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  borderRadius: 8,
                  color: "#D4C5B9",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  cursor: "pointer"
                }}
              >
                Create Account
              </button>
            </div>
          </section>

          {/* Alternating Story Sections (Text Left / Image Right & Image Left / Text Right) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {storySections.map((sec) => {
              const isTextLeft = sec.layout === "text-left";
              return (
                <section
                  key={sec.id}
                  className="story-card-gpu"
                  style={{
                    background: "rgba(16, 9, 4, 0.90)",
                    border: "1.5px solid rgba(212, 175, 55, 0.4)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: 24,
                    padding: "40px",
                    display: "grid",
                    gridTemplateColumns: isTextLeft ? "1.15fr 1fr" : "1fr 1.15fr",
                    gap: 36,
                    alignItems: "center",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.65)"
                  }}
                >
                  {/* When layout is text-right, render Image FIRST */}
                  {!isTextLeft && (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "2px solid rgba(212, 175, 55, 0.55)",
                        boxShadow: "0 12px 36px rgba(0,0,0,0.65)",
                        height: 340,
                        background: "#080402",
                        transform: "translateZ(0)"
                      }}
                    >
                      <img
                        src={sec.img}
                        alt={sec.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(180deg, transparent 0%, rgba(10,5,2,0.92) 100%)",
                          padding: "16px 20px 14px 20px"
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          {sec.tag}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#FFF8E7", marginTop: 2 }}>
                          {sec.imgCaption}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Big Text Explanation Container */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#D4AF37",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-mono)"
                      }}
                    >
                      {sec.tag}
                    </div>

                    <h2
                      style={{
                        fontSize: "clamp(24px, 2.6vw, 34px)",
                        fontWeight: 900,
                        color: "#FFFFFF",
                        lineHeight: 1.22,
                        letterSpacing: "-0.02em",
                        margin: 0
                      }}
                    >
                      {sec.title}
                    </h2>

                    <p
                      style={{
                        fontSize: 15,
                        color: "#D6CBC0",
                        lineHeight: 1.65,
                        margin: 0
                      }}
                    >
                      {sec.desc}
                    </p>

                    {/* Highlight Bullets */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
                      {sec.highlights.map((h, hIdx) => (
                        <div
                          key={hIdx}
                          style={{
                            background: "rgba(24, 13, 6, 0.75)",
                            border: "1px solid rgba(212, 175, 55, 0.28)",
                            borderRadius: 12,
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12
                          }}
                        >
                          <span style={{ fontSize: 20, marginTop: 1 }}>{h.icon}</span>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#FDE68A" }}>
                              {h.title}
                            </div>
                            <div style={{ fontSize: 12.5, color: "#C4B8AB", lineHeight: 1.5, marginTop: 2 }}>
                              {h.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* When layout is text-left, render Image SECOND */}
                  {isTextLeft && (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "2px solid rgba(212, 175, 55, 0.55)",
                        boxShadow: "0 12px 36px rgba(0,0,0,0.65)",
                        height: 340,
                        background: "#080402",
                        transform: "translateZ(0)"
                      }}
                    >
                      <img
                        src={sec.img}
                        alt={sec.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(180deg, transparent 0%, rgba(10,5,2,0.92) 100%)",
                          padding: "16px 20px 14px 20px"
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          {sec.tag}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#FFF8E7", marginTop: 2 }}>
                          {sec.imgCaption}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Footer Heritage Seal */}
          <footer
            className="story-card-gpu"
            style={{
              textAlign: "center",
              padding: "28px 24px",
              background: "rgba(16, 9, 4, 0.90)",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#FDE68A", letterSpacing: "0.08em" }}>
              👑 SANJAYA DIVINE SAP OPERATIONS PLATFORM
            </div>
            <div style={{ fontSize: 12, color: "#A89D92" }}>
              100% Grounded Evidence · Zero Hallucination Guarantee · Role-Based Enterprise Security · Confidential SAP Runbooks
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
