import { useState, useEffect } from "react";

const TOUR_STEPS = [
  {
    id: "welcome",
    target: "#tour-hero-banner",
    title: "Welcome to Nexus",
    tag: "STEP 1 OF 5 · ENTERPRISE SYSTEMS INTELLIGENCE",
    desc: "Nexus is your autonomous companion for mission-critical enterprise systems. Engineered with real-time pipeline telemetry, deterministic root-cause diagnosis, and zero-hallucination architectural reasoning.",
    icon: "✳",
    position: "bottom"
  },
  {
    id: "rail",
    target: "#tour-activity-rail",
    title: "🧭 Studio & Navigation Drawer",
    tag: "STEP 2 OF 5 · UNIFIED NAVIGATION",
    desc: "Seamlessly navigate between your Investigation Workspace, interactive System Flow Simulator, ABAP & Code Designer, and authoritative Knowledge Vault.",
    icon: "⚡",
    position: "right"
  },
  {
    id: "system-status",
    target: "#tour-system-status",
    title: "🛡️ Autonomous Diagnostics & Safeguards",
    tag: "STEP 3 OF 5 · TELEMETRY & SAFEGUARDS",
    desc: "Inspect queue blockages, interface bottlenecks, and transactional performance with non-disruptive, read-only inspection safeguards designed for zero production downtime.",
    icon: "🏛️",
    position: "bottom"
  },
  {
    id: "search",
    target: "#tour-search-card",
    title: "🔍 Grounded Knowledge & Runbooks",
    tag: "STEP 4 OF 5 · DETERMINISTIC SEARCH",
    desc: "Search 50,000+ pre-indexed technical engineering guides, verified architecture patterns, and standard operational runbooks with instant clickable citations.",
    icon: "📖",
    position: "top"
  },
  {
    id: "workspace-ready",
    target: "#tour-quick-topics",
    title: "📸 Multimodal Vision & Clean Exports",
    tag: "STEP 5 OF 5 · MULTIMODAL STUDIO",
    desc: "Paste console, GUI, or terminal error screenshots directly with Ctrl+V for instant OCR and guided remediation. Export publication-grade runbooks directly to Word, Excel, and PowerPoint with one click.",
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

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        if (stepIndex < TOUR_STEPS.length - 1) {
          setStepIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (stepIndex > 0) {
          setStepIndex((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [stepIndex, isOpen, onClose]);

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
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
      }}
    >
      <style>{`
        @keyframes tourCardFadeIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .claude-tour-close-btn {
          background: transparent;
          border: none;
          color: #78716C;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .claude-tour-close-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #1C1917;
        }
        .claude-tour-ghost-btn {
          background: transparent;
          border: none;
          color: #78716C;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .claude-tour-ghost-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1C1917;
        }
        .claude-tour-next-btn {
          background: #D4622B;
          border: none;
          color: #FFFFFF;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(212, 98, 43, 0.25);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
        }
        .claude-tour-next-btn:hover {
          background: #C85824;
          box-shadow: 0 2px 8px rgba(212, 98, 43, 0.35);
        }
        .claude-tour-next-btn:active {
          transform: translateY(1px);
        }
        .claude-tour-dot {
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Backdrop: rgba(28, 25, 23, 0.45) with blur(8px) */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(28, 25, 23, 0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
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
            border: "2px solid #D4622B",
            boxShadow: "0 0 0 9999px rgba(28, 25, 23, 0.18), 0 0 24px rgba(212, 98, 43, 0.35), inset 0 0 12px rgba(212, 98, 43, 0.1)",
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
          background: "#FFFFFF",
          border: "1px solid var(--border-subtle, #E5E5DF)",
          borderRadius: 16,
          padding: "28px 32px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)",
          color: "#1C1917",
          animation: "tourCardFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Top Tag & Close Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(212, 98, 43, 0.08)",
              border: "1px solid rgba(212, 98, 43, 0.25)",
              color: "#D4622B",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: 20,
              padding: "4px 12px"
            }}
          >
            <span>{step.icon}</span> {step.tag}
          </span>
          <button
            onClick={onClose}
            className="claude-tour-close-btn"
            title="Close Tour (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Step Title */}
        <h3
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#1C1917",
            fontFamily: "'Newsreader', 'Lora', Georgia, serif",
            letterSpacing: "-0.015em",
            marginBottom: 12,
            lineHeight: 1.3
          }}
        >
          {step.title}
        </h3>

        {/* Step Description */}
        <p
          style={{
            fontSize: 14.5,
            color: "#57534E",
            lineHeight: 1.65,
            marginBottom: 28
          }}
        >
          {step.desc}
        </p>

        {/* Progress Dots / Pills & Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid var(--border-subtle, #E5E5DF)",
            paddingTop: 20
          }}
        >
          {/* Progress Dots / Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                className="claude-tour-dot"
                title={`Step ${i + 1} of ${TOUR_STEPS.length}`}
                style={{
                  width: i === stepIndex ? 26 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === stepIndex ? "#D4622B" : "rgba(0, 0, 0, 0.12)"
                }}
              />
            ))}
          </div>

          {/* Navigation Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="claude-tour-ghost-btn"
              >
                Back
              </button>
            )}

            <button
              onClick={onClose}
              className="claude-tour-ghost-btn"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="claude-tour-next-btn"
            >
              <span>{isLast ? "Get Started ✨" : "Next"}</span>
              {!isLast && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
