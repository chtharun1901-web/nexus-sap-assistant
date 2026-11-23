import React, { useEffect, useState } from "react";

export default function ReasoningOverlay({
  topic = "Enterprise Master Data Architecture",
  onComplete = () => {}
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  const steps = [
    { title: "Analyzing Enterprise Domain & Master Data Controls", detail: "Scanning sales area, fulfillment routing and organizational structure..." },
    { title: "Extracting 8-Layer Knowledge Graph", detail: "Resolving entity extension and synchronization logic..." },
    { title: "Mapping Database Entities & Flow Handlers", detail: "Indexing primary tables, key fields, and customizing schemas..." },
    { title: "Synthesizing Automated Determination Logic", detail: "Calculating shipping points, pricing schemas, and fulfillment determinations..." },
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
        background: "rgba(28, 25, 23, 0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid #E5E5DF",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.12)",
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
            background: "linear-gradient(135deg, #D4622B 0%, #B84D19 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(212, 98, 43, 0.3)",
            marginBottom: 20,
            fontSize: 24,
            color: "#FFFFFF"
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
            color: "#1C1917",
            letterSpacing: "-0.015em"
          }}
        >
          Synthesizing Enterprise Architecture Presentation
        </h3>

        {/* Topic Snippet */}
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: 12.5,
            color: "#78716C",
            lineHeight: 1.45,
            maxWidth: 440
          }}
        >
          Analyzing topic: <strong style={{ color: "#D4622B" }}>"{topic?.slice(0, 85)}{topic?.length > 85 ? "..." : ""}"</strong>
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: "#FAF9F5",
            border: "1px solid #E5E5DF",
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
              background: "linear-gradient(90deg, #D4622B 0%, #E8614D 100%)",
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
                    ? "rgba(212, 98, 43, 0.08)"
                    : isCompleted
                    ? "#FAF9F5"
                    : "transparent",
                  border: isCurrent
                    ? "1px solid rgba(212, 98, 43, 0.3)"
                    : isCompleted
                    ? "1px solid #E5E5DF"
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
                      ? "#D4622B"
                      : "#E5E5DF",
                    color: isCompleted || isCurrent ? "#FFFFFF" : "#78716C"
                  }}
                >
                  {isCompleted ? "✔" : isCurrent ? "●" : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isCurrent ? 750 : 600,
                      color: isCurrent ? "#1C1917" : isCompleted ? "#44403C" : "#A8A29E"
                    }}
                  >
                    {step.title}
                  </div>
                  {isCurrent && (
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "#78716C",
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
            color: "#78716C",
            letterSpacing: "0.2px"
          }}
        >
          Grounding 8 knowledge layers into native PowerPoint shapes
        </div>
      </div>
    </div>
  );
}
