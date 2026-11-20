import React, { useState, useEffect } from "react";

export default function Welcome({ onSignIn, onRegister, onGoogleAuth, onOtpLogin }) {
  const rotatingCaptions = [
    "Automating root-cause diagnostics for mission-critical operations",
    "Synthesizing production-grade technical specifications in seconds",
    "Sub-second triage for high-throughput transactional pipelines",
    "Zero-hallucination verification against verified engineering architectures"
  ];

  const marqueeItems = [
    { icon: "⚡", label: "Autonomous Queue & Pipeline Diagnostic Telemetry" },
    { icon: "📄", label: "Automated Engineering Specifications & Executive Runbooks" },
    { icon: "🏛️", label: "Mission-Critical Enterprise Systems Architecture" },
    { icon: "🔍", label: "Deterministic Root-Cause Forensics & Error Log Analysis" },
    { icon: "🛡️", label: "Real-Time Anomaly Detection & Non-Disruptive Safeguards" },
    { icon: "💻", label: "Production Enterprise Code & Syntax Generation" },
    { icon: "🌐", label: "Zero-Latency Cross-System Workflow Orchestration" },
    { icon: "📊", label: "1-Click Formatted Excel, Word & PowerPoint Runbooks" }
  ];

  const [captionIndex, setCaptionIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCaptionIndex((prev) => (prev + 1) % rotatingCaptions.length);
        setIsFading(false);
      }, 280);
    }, 3800);
    return () => clearInterval(timer);
  }, [rotatingCaptions.length]);

  const exhibitionCards = [
    {
      id: "queue-triage",
      tag: "FORENSIC DIAGNOSTICS",
      title: "Real-Time Queue Triage & Bottleneck Isolation",
      desc: "Instantaneous visibility across mission-critical enterprise landscapes. Continuous queue depth monitoring, blockage root cause classification, and automated triage for asynchronous messaging, transactional event streams, and background RFC pipelines without human latency.",
      badge: "LIVE TELEMETRY",
      badgeColor: "#10B981",
      previewItems: [
        { label: "Asynchronous Inbound Queue Monitor", detail: "INB_EVENT_QUEUE_0419 · SYSFAIL · 14 blocked", status: "BLOCKED", color: "#EF4444" },
        { label: "High-Throughput Gateway Destination", detail: "GATEWAY_SUPERVISOR · Unit ID: 0050568A · OK", status: "ACTIVE", color: "#10B981" },
        { label: "Staging Replenishment Pipeline", detail: "DISPATCH_STAGE_REQ · /CORE/STAGE · 0 locks", status: "READY", color: "#D4622B" }
      ],
      highlights: [
        { icon: "⚡", title: "Sub-Second Queue Triage", text: "Isolate blocked delivery queues and transactional scheduler locks in milliseconds." },
        { icon: "🏛️", title: "Distributed Enterprise Architecture", text: "Seamless telemetry across complex warehouse management, supply chain, and ERP environments." },
        { icon: "🛡️", title: "Zero Production Disruption", text: "Read-only inspection safeguards that prevent accidental write operations." }
      ]
    },
    {
      id: "grounded-oss",
      tag: "DETERMINISTIC VERIFICATION",
      title: "Authoritative Grounding in 50,000+ Enterprise Engineering Notes",
      desc: "Unlike generic chatbots, Nexus never guesses. Every diagnostic insight, configuration recommendation, and resolution runbook is strictly anchored in authoritative architecture standards, release documentation, and pre-indexed technical notes.",
      badge: "TIER 1 VERIFIED",
      badgeColor: "#D4622B",
      previewItems: [
        { label: "Enterprise Architecture Note 2871625", detail: "High-Throughput Transactional Queue Optimization & Scheduler Tuning", status: "VERIFIED", color: "#059669" },
        { label: "Official Architecture Knowledge Base", detail: "Advanced Production Integration & Material Staging Standards", status: "OFFICIAL", color: "#2563EB" },
        { label: "Core Systems Note 3012841", detail: "Asynchronous vs Synchronous Remote Service Architecture", status: "VERIFIED", color: "#059669" }
      ],
      highlights: [
        { icon: "📖", title: "50,000+ Pre-Indexed Guides", text: "Immediate retrieval of verified technical solutions and architecture patterns." },
        { icon: "📑", title: "Verifiable Source Citations", text: "Clickable references with exact note identifiers, architecture documentation, and system parameters." },
        { icon: "🎯", title: "Deterministic Accuracy", text: "Rigorous evidence verification before presenting any operational guidance." }
      ]
    },
    {
      id: "multimodal-vision",
      tag: "MULTIMODAL FORENSIC STUDIO",
      title: "Instant Visual Diagnosis from Console, Terminal & GUI Screenshots",
      desc: "Skip tedious manual log transcription. Simply paste or upload screenshots from enterprise management consoles, desktop GUIs, web dashboards, or terminal displays. Nexus extracts error codes, inspects symptoms, and prescribes the exact fix.",
      badge: "VISION OCR ENGINE",
      badgeColor: "#8B5CF6",
      previewItems: [
        { label: "System Short Dump / Exception ST22", detail: "CALL_FUNCTION_NOT_FOUND · Function /SYSTEM/DELIVERY_CREATE", status: "PARSED", color: "#8B5CF6" },
        { label: "Enterprise Web Console Error Code", detail: "Remote communication handshake failure in destination PROD_CLUSTER_01", status: "ISOLATED", color: "#D97706" },
        { label: "Terminal / Barcode Scanner Error", detail: "Storage bin verification mismatch in location sector 0010", status: "RESOLVED", color: "#10B981" }
      ],
      highlights: [
        { icon: "📸", title: "Instant Clipboard Paste", text: "Paste screenshots directly with Ctrl+V into the investigation studio." },
        { icon: "🔍", title: "Automatic OCR & Symptom Parsing", text: "Extracts system codes, queue identifiers, and error strings with high fidelity." },
        { icon: "💡", title: "Guided Remediation Sequences", text: "Delivers step-by-step resolution sequences tailored to the visual error." }
      ]
    }
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflowY: "auto", background: "#FFFFFF", color: "var(--text-primary, #1F1F1E)", fontFamily: "var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
      {/* ── EMBEDDED KEYFRAMES & STYLING FOR MARQUEE ── */}
      <style>{`
        @keyframes nexusMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .nexus-marquee-track {
          display: flex;
          width: max-content;
          gap: 12px;
          animation: nexusMarquee 34s linear infinite;
        }
        .nexus-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ── TOP CLAUDE EDITORIAL NAVIGATION BAR ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border-subtle, #EFECE6)",
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {/* Brand Lockup: Spark + Newsreader Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 2px 6px rgba(212, 98, 43, 0.28))" }}>
            <path d="M12 0L13.5 8.5L22 10L14.5 13.5L16 22L11 15.5L4 19L7.5 12L0 8.5L8.5 7.5L12 0Z" fill="#D4622B" />
          </svg>
          <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontSize: 25, fontWeight: 550, color: "#1F1F1E", letterSpacing: "-0.02em" }}>
            Nexus
          </span>
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 650, color: "#8E8E87", background: "#F5F4EE", padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            ENTERPRISE SYSTEMS INTELLIGENCE
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={onSignIn}
            style={{
              padding: "8px 18px",
              background: "#FFFFFF",
              border: "1px solid var(--border-subtle, #E5E5DF)",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 550,
              color: "#1F1F1E",
              cursor: "pointer",
              transition: "all 0.18s ease"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onOtpLogin || onSignIn}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 20px",
              background: "var(--terracotta, #D4622B)",
              border: "1px solid var(--terracotta, #D4622B)",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(212, 98, 43, 0.22)",
              transition: "all 0.18s ease"
            }}
          >
            <span>Launch Workspace</span>
            <span style={{ fontSize: 14 }}>→</span>
          </button>
        </div>
      </header>

      {/* ── HERO EXHIBITION PAVILION ── */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "64px 24px 44px 24px", textAlign: "center" }}>
        
        {/* Curated Pill Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 15px",
            background: "#FAF8F5",
            border: "1px solid #ECE7DA",
            borderRadius: 20,
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--terracotta, #D4622B)",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <span style={{ fontSize: 11, color: "#D4622B" }}>★</span>
          <span>Autonomous Architecture &amp; Forensic Systems Intelligence</span>
        </div>

        {/* Large Editorial Serif Headline */}
        <h1
          style={{
            fontFamily: "'Newsreader', 'Lora', Georgia, serif",
            fontSize: "clamp(38px, 5.2vw, 58px)",
            fontWeight: 450,
            color: "#1F1F1E",
            lineHeight: 1.14,
            letterSpacing: "-0.03em",
            maxWidth: 920,
            margin: "0 auto 18px auto"
          }}
        >
          Intelligence for the world's most demanding enterprise systems.
        </h1>

        {/* Dynamic Rotating Live Subtitle Pill */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 20, minHeight: 38 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 18px",
              background: "#FAF7F2",
              border: "1px solid #ECE2D4",
              borderRadius: 24,
              boxShadow: "0 1px 4px rgba(212, 98, 43, 0.04)"
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#D4622B",
                boxShadow: "0 0 0 3px rgba(212, 98, 43, 0.18)",
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                fontSize: "clamp(15px, 2.1vw, 17.5px)",
                fontStyle: "italic",
                color: "#994317",
                fontWeight: 500,
                opacity: isFading ? 0 : 1,
                transform: isFading ? "translateY(3px)" : "translateY(0)",
                transition: "opacity 0.28s ease, transform 0.28s ease"
              }}
            >
              "{rotatingCaptions[captionIndex]}"
            </span>
          </div>
        </div>

        {/* Static Subtitle Description */}
        <p
          style={{
            fontSize: 17,
            color: "var(--text-muted, #73736C)",
            lineHeight: 1.62,
            maxWidth: 750,
            margin: "0 auto 36px auto",
            fontWeight: 420
          }}
        >
          Nexus delivers forensic queue triage, deterministic root-cause diagnosis, and automated Word/Excel runbooks—engineered for mission-critical enterprise architectures.
        </p>

        {/* Dual Primary Call-to-Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 36 }}>
          <button
            type="button"
            onClick={onOtpLogin || onSignIn}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 30px",
              background: "var(--terracotta, #D4622B)",
              border: "1px solid var(--terracotta, #D4622B)",
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(212, 98, 43, 0.24)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
          >
            <span>Enter Nexus Workspace</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>

          <button
            type="button"
            onClick={onRegister}
            style={{
              padding: "13px 26px",
              background: "#FFFFFF",
              border: "1.5px solid var(--border-subtle, #E5E5DF)",
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 550,
              color: "#1F1F1E",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              transition: "all 0.15s ease"
            }}
          >
            Create Free Account
          </button>
        </div>

        {/* Dynamic Continuous Scrolling Ticker / Marquee */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1000,
            margin: "0 auto 36px auto",
            overflow: "hidden",
            maskImage: "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)",
            padding: "4px 0"
          }}
        >
          <div className="nexus-marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 16px",
                  background: "#FAF9F5",
                  border: "1px solid #ECE7DA",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#2C2C28",
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  userSelect: "none"
                }}
              >
                <span style={{ fontSize: 13.5 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Enterprise Feature Tags */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#8E8E87" }}>
          <span>✓ Zero Production Disruption (Read-Only)</span>
          <span>•</span>
          <span>✓ 100% Deterministic Architecture Grounding</span>
          <span>•</span>
          <span>✓ Sub-Second Queue Isolation</span>
          <span>•</span>
          <span>✓ Excel &amp; Word Runbook Automation</span>
        </div>
      </section>

      {/* ── EXHIBITION FEATURE GALLERY CARDS (HALLS A, B, C) ── */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 24px 72px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 26 }}>
          {exhibitionCards.map((card, cIdx) => (
            <div
              key={card.id}
              style={{
                background: "#FAF9F5",
                border: "1.5px solid var(--border-subtle, #EFECE6)",
                borderRadius: 20,
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
              }}
            >
              {/* Telemetry Visual Card Display */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E5DC",
                  borderRadius: 14,
                  padding: "18px 20px",
                  marginBottom: 24,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px dashed #E5E1D5" }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: card.badgeColor, letterSpacing: "0.05em" }}>
                    {card.badge}
                  </span>
                  <span style={{ fontSize: 11, color: "#A8A29E" }}>EXHIBITION {cIdx + 1}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {card.previewItems.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        background: "#FAF9F6",
                        border: "1px solid #ECE8DE",
                        borderRadius: 8,
                        padding: "8px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 650, color: "#1F1F1E" }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: "#78716C", overflow: "hidden", textOverflow: "ellipsis" }}>{item.detail}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 750, color: item.color, background: "#FFFFFF", border: `1px solid ${item.color}33`, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tag & Editorial Headline */}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--terracotta, #D4622B)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                {card.tag}
              </div>

              <h2
                style={{
                  fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                  fontSize: 23,
                  fontWeight: 600,
                  color: "#1F1F1E",
                  lineHeight: 1.25,
                  marginBottom: 12
                }}
              >
                {card.title}
              </h2>

              <p style={{ fontSize: 14, color: "var(--text-muted, #73736C)", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                {card.desc}
              </p>

              {/* Card Highlights */}
              <div style={{ borderTop: "1px solid #ECE7DA", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {card.highlights.map((h, hIdx) => (
                  <div key={hIdx} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12.5 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{h.icon}</span>
                    <div>
                      <strong style={{ color: "#1F1F1E" }}>{h.title}: </strong>
                      <span style={{ color: "#78716C" }}>{h.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENTERPRISE TRUST & TELEMETRY STRIP ── */}
      <section style={{ background: "#FAF9F5", borderTop: "1px solid var(--border-subtle, #EFECE6)", padding: "44px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontSize: 36, fontWeight: 600, color: "#1F1F1E", marginBottom: 4 }}>
              50,000+
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8E8E87", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Pre-Indexed Architecture Notes
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontSize: 36, fontWeight: 600, color: "var(--terracotta, #D4622B)", marginBottom: 4 }}>
              0%
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8E8E87", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Hallucination Tolerance
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontSize: 36, fontWeight: 600, color: "#1F1F1E", marginBottom: 4 }}>
              &lt; 1.2s
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8E8E87", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Queue Anomaly Isolation
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontSize: 36, fontWeight: 600, color: "#10B981", marginBottom: 4 }}>
              100%
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8E8E87", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Read-Only Production Safety
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle, #EFECE6)", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "#8E8E87", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 0L13.5 8.5L22 10L14.5 13.5L16 22L11 15.5L4 19L7.5 12L0 8.5L8.5 7.5L12 0Z" fill="#D4622B" />
          </svg>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 600, color: "#1F1F1E" }}>Nexus</span>
          <span>· Enterprise Systems Intelligence &amp; Forensic Architecture</span>
        </div>
        <div>
          <span>Confidential &amp; Verified against authoritative enterprise engineering documentation.</span>
        </div>
      </footer>
    </div>
  );
}