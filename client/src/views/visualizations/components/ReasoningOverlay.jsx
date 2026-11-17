import React, { useEffect, useState } from "react";

export default function ReasoningOverlay({
  topic = "SAP S/4HANA Master Data Architecture",
  onComplete = () => {}
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  const steps = [
    { title: "Analyzing SAP Domain & Master Data Controls", detail: "Scanning sales area, shipping data and organizational structure..." },
    { title: "Extracting 8-Layer Knowledge Graph", detail: "Resolving role extension FLCU01 and CVI synchronization logic..." },
    { title: "Mapping Database Entities & T-Codes", detail: "Indexing BUT000, KNA1, KNVV, KNVS with SPRO customizing paths..." },
    { title: "Synthesizing Automated Determination Logic", detail: "Calculating shipping point (OVL2) and pricing procedure (OVKK) schemas..." },
    { title: "Composing 12-Slide Master Template Storyboard", detail: "Generating native editable PowerPoint objects and evidence citations..." }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => { setCurrentStepIndex(1); setProgress(32); }, 700);
    const timer2 = setTimeout(() => { setCurrentStepIndex(2); setProgress(56); }, 1500);
    const timer3 = setTimeout(() => { setCurrentStepIndex(3); setProgress(78); }, 2300);
    const timer4 = setTimeout(() => { setCurrentStepIndex(4); setProgress(94); }, 3000);
    const timer5 = setTimeout(() => { setProgress(100); onComplete(); }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(11, 15, 25, 0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif)",
        padding: 20
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "rgba(17, 24, 39, 0.92)",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(110, 26, 45, 0.3)",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        {/* Pulsing Icon Badge */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(110, 26, 45, 0.6)",
            marginBottom: 20,
            fontSize: 24
          }}
        >
          <span style={{ animation: "pulse 1.8s infinite ease-in-out" }}>👑</span>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: 18,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.015em"
          }}
        >
          Synthesizing SAP Architecture Presentation
        </h3>

        {/* Topic Snippet */}
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: 12.5,
            color: "var(--text-muted, #94A3B8)",
            lineHeight: 1.45,
            maxWidth: 440
          }}
        >
          Analyzing topic: <strong style={{ color: "#FBBF24" }}>"{topic?.slice(0, 85)}{topic?.length > 85 ? "..." : ""}"</strong>
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 24,
            position: "relative"
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6E1A2D 0%, #E8614D 50%, #F59E0B 100%)",
              borderRadius: 3,
              transition: "width 0.4s ease"
            }}
          />
        </div>

        {/* Reasoning Steps List */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            textAlign: "left"
          }}
        >
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: isCurrent
                    ? "rgba(110, 26, 45, 0.16)"
                    : isCompleted
                    ? "rgba(255, 255, 255, 0.03)"
                    : "transparent",
                  border: isCurrent
                    ? "1px solid rgba(110, 26, 45, 0.4)"
                    : "1px solid transparent",
                  transition: "all 0.25s ease",
                  opacity: idx > currentStepIndex ? 0.35 : 1
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: 1,
                    background: isCompleted
                      ? "#10B981"
                      : isCurrent
                      ? "#F59E0B"
                      : "rgba(255, 255, 255, 0.1)",
                    color: "#FFFFFF"
                  }}
                >
                  {isCompleted ? "✔" : isCurrent ? "●" : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isCurrent ? 750 : 600,
                      color: isCurrent ? "#FFFFFF" : isCompleted ? "#E2E8F0" : "#64748B"
                    }}
                  >
                    {step.title}
                  </div>
                  {isCurrent && (
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "var(--text-muted, #94A3B8)",
                        marginTop: 2,
                        lineHeight: 1.3
                      }}
                    >
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notice */}
        <div
          style={{
            marginTop: 20,
            fontSize: 10.5,
            color: "var(--text-muted, #64748B)",
            letterSpacing: "0.2px"
          }}
        >
          Grounding 8 knowledge layers into native PowerPoint shapes
        </div>
      </div>
    </div>
  );
}
