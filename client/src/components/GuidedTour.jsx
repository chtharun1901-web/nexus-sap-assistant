import { useState, useEffect, useRef } from "react";

const TOUR_STEPS = [
  {
    id: "welcome",
    target: "#tour-hero-banner",
    title: "👑 Welcome to SANJAYA (सञ्जय)",
    tag: "STEP 1 OF 5 · ENTERPRISE AI SENTINEL",
    desc: "Sanjaya is your agent-ready SAP Operations Intelligence companion. With real-time queue triage, root-cause diagnosis for SMQ1, SMQ2, and bgRFC pipelines, and zero-hallucination grounded reasoning.",
    icon: "🛕",
    position: "bottom"
  },
  {
    id: "rail",
    target: "#tour-activity-rail",
    title: "🧭 Operational Activity Rail",
    tag: "STEP 2 OF 5 · NAVIGATION",
    desc: "Instantly navigate between your personalized Home dashboard, AI Investigation Workspace, Incident Management, Knowledge Vault, and official SAP OSS Notes Catalog.",
    icon: "⚡",
    position: "right"
  },
  {
    id: "system-status",
    target: "#tour-system-status",
    title: "🛡️ S/4HANA Context & Live Telemetry",
    tag: "STEP 3 OF 5 · SYSTEM & CONTROLS",
    desc: "Check active SAP warehouse context, Indian Standard Time (IST), Read-Only safety safeguards, custom Indian Art Wallpapers, and live system alert notifications.",
    icon: "🏛️",
    position: "bottom"
  },
  {
    id: "search",
    target: "#tour-search-card",
    title: "🔍 Grounded SAP Knowledge Search",
    tag: "STEP 4 OF 5 · INTELLIGENT SEARCH",
    desc: "Search official SAP Help documentation, pre-indexed OSS notes, and verified runbooks. Click any quick topic pill (like SMQ2 Queue Jam, PMR, bgRFC) to trigger immediate diagnosis.",
    icon: "📖",
    position: "top"
  },
  {
    id: "workspace-ready",
    target: "#tour-quick-topics",
    title: "📸 Multimodal Vision & Ready to Search",
    tag: "STEP 5 OF 5 · MULTIMODAL STUDIO",
    desc: "Whenever you face an SAP GUI or Fiori dump, simply paste the screenshot (Ctrl+V) directly into the AI Workspace for instant OCR and step-by-step fix recommendations. You're all set to begin!",
    icon: "✨",
    position: "top"
  }
];

export default function GuidedTour({ isOpen, onClose, onNavigate }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timer = setTimeout(updateRect, 300);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [stepIndex, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "auto",
        fontFamily: "var(--font-sans)"
      }}
    >
      {/* Semi-transparent dark overlay with radial spotlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5, 3, 2, 0.78)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          transition: "all 0.3s ease"
        }}
      />

      {/* Target Element Highlight Box */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 14,
            border: "2px solid #D4AF37",
            boxShadow: "0 0 0 9999px rgba(5, 3, 2, 0.55), 0 0 30px rgba(212, 175, 55, 0.65), inset 0 0 16px rgba(212, 175, 55, 0.25)",
            pointerEvents: "none",
            transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
            zIndex: 100000
          }}
        />
      )}

      {/* Interactive Tour Card Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 100001,
          width: "min(520px, 92vw)",
          background: "linear-gradient(145deg, #180D06 0%, #0E0703 100%)",
          border: "1.5px solid rgba(212, 175, 55, 0.65)",
          borderRadius: 20,
          padding: "28px 32px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.85), 0 0 35px rgba(212, 175, 55, 0.25)",
          color: "#FFF8E7",
          animation: "tourCardFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Top Tag & Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(212, 175, 55, 0.18)",
              border: "1px solid rgba(212, 175, 55, 0.45)",
              color: "#FDE68A",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 10.5,
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em"
            }}
          >
            <span>{step.icon}</span> {step.tag}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#A89D92",
              width: 28,
              height: 28,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Skip Tour"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#FFFFFF",
            marginBottom: 10,
            lineHeight: 1.25,
            letterSpacing: "-0.01em"
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 14.5,
            color: "#D6CBC0",
            lineHeight: 1.65,
            marginBottom: 26
          }}
        >
          {step.desc}
        </p>

        {/* Progress Dots & Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(212, 175, 55, 0.2)", paddingTop: 18 }}>
          {/* Progress Dots */}
          <div style={{ display: "flex", gap: 6 }}>
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                style={{
                  width: i === stepIndex ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === stepIndex ? "#D4AF37" : "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#EDEDED",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#A89D92",
                padding: "8px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              style={{
                background: isLast
                  ? "linear-gradient(135deg, #FF6600 0%, #D9480F 100%)"
                  : "linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: isLast ? "#FFFFFF" : "#1C1004",
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(212,175,55,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{isLast ? "Start Searching 🚀" : "Next"}</span>
              {!isLast && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}