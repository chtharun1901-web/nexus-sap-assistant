import React, { useState } from "react";

export default function PresentationDeckPreview({
  model,
  onExportPptx,
  onExportWord,
  onClose,
  onRefine,
  isExporting = false
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [followupText, setFollowupText] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  if (!model) return null;

  const slideList = [
    { id: 0, tag: "COVER SLIDE", title: model.professionalTitle || "SAP S/4HANA Master Architecture", subtitle: "Approved Executive Deck" },
    { id: 1, tag: "1. DIRECT EXECUTIVE ANSWER", title: model.slideTitles?.slide2 || "Executive Answer & Architecture Model", subtitle: "Core Golden Verdict" },
    { id: 2, tag: "2. MODULE CLASSIFICATION", title: model.slideTitles?.slide3 || "Enterprise Module Classification", subtitle: "Hub-and-Spoke Ecosystem" },
    { id: 3, tag: "3. BUSINESS PROCESS FLOW", title: model.slideTitles?.slide4 || "Business Process Flow", subtitle: "Sequential Role Extension" },
    { id: 4, tag: "4. LAYERED CONFIGURATION", title: model.slideTitles?.slide5 || "Layered Configuration Architecture", subtitle: "Org Data to Transaction" },
    { id: 5, tag: "5. DATABASE DATA MODEL", title: model.slideTitles?.slide6 || "Database Data Model Architecture", subtitle: "Entity Containers" },
    { id: 6, tag: "6. DETERMINATION LOGIC", title: model.slideTitles?.slide7 || "Automated Determination Logic", subtitle: "OVL2 & OVKK Dual Engine" },
    { id: 7, tag: "7. CROSS-MODULE ECOSYSTEM", title: model.slideTitles?.slide8 || "Cross-Module Enterprise Ecosystem", subtitle: "SD, FI, MM, LE Integration" },
    { id: 8, tag: "8. TROUBLESHOOTING RUNBOOK", title: model.slideTitles?.slide9 || "Troubleshooting & Diagnostic Tree", subtitle: "Decision Triage & Logs" },
    { id: 9, tag: "9. ECC VS S/4HANA & SPRO", title: model.slideTitles?.slide10 || "Architecture Evolution & SPRO", subtitle: "CVI Bridge & Migration" },
    { id: 10, tag: "10. INTERVIEW DELIVERY", title: model.slideTitles?.slide11 || "Consulting & Interview Delivery", subtitle: "Elevator Pitch & Q&A" },
    { id: 11, tag: "11. TECHNICAL REFERENCE", title: model.slideTitles?.slide12 || "Technical Reference Matrix", subtitle: "T-Codes & Table Catalog" }
  ];

  const quickPills = [
    "Deepen SPRO Customizing Paths",
    "Add Route Determination (0VTC)",
    "Expand Troubleshooting Decision Logic",
    "Detail Pricing Condition Tables (V/08)",
    "Elaborate CVI Sync Dump Resolutions"
  ];

  const handleSendFollowup = async (textToSend) => {
    const prompt = (textToSend || followupText).trim();
    if (!prompt || isRefining) return;
    setIsRefining(true);
    try {
      if (onRefine) {
        await onRefine(prompt);
      }
      setFollowupText("");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "var(--bg-main, #0B0F19)",
        color: "var(--text-primary, #EDEDED)",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif)",
        overflow: "hidden"
      }}
    >
      {/* ── Top Header Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "var(--bg-surface, #111827)",
          borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          zIndex: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#E2E8F0",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            title="Return to Studio Hero"
          >
            ← Studio
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em"
                }}
              >
                {model.professionalTitle || "SAP Architecture Presentation"}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 750,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "var(--burgundy-light, rgba(110,26,45,0.25))",
                  color: "var(--burgundy-accent, #FF9488)",
                  border: "1px solid var(--burgundy-border, rgba(110,26,45,0.5))",
                  letterSpacing: "0.5px"
                }}
              >
                12 SLIDES · MASTER TEMPLATE
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted, #94A3B8)", marginTop: 2 }}>
              Case: <strong style={{ color: "#FBBF24" }}>{model.caseId || "NX-CASE"}</strong> • Landscape: {model.landscape || "SAP S/4HANA"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onExportPptx}
            disabled={isExporting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 6,
              background: "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
              border: "none",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 750,
              cursor: isExporting ? "wait" : "pointer",
              boxShadow: "0 2px 10px rgba(110,26,45,0.4)",
              transition: "all 0.15s ease"
            }}
            title="Export strictly styled 12-slide editable presentation (.pptx)"
          >
            📊 {isExporting ? "Generating PPTX..." : "Download PowerPoint (.pptx)"}
          </button>

          <button
            onClick={onExportWord}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 6,
              background: "#1E3A8A",
              border: "none",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(30,58,138,0.3)"
            }}
            title="Download executive investigation report (.docx)"
          >
            📄 Download Word (.docx)
          </button>
        </div>
      </div>

      {/* ── Main Studio Content (Split: Sidebar + Presentation Canvas) ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Left Thumbnails Strip */}
        <div
          style={{
            width: 250,
            background: "var(--bg-surface, #0F172A)",
            borderRight: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "12px 10px",
            gap: 8,
            flexShrink: 0
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 750,
              color: "var(--text-muted, #94A3B8)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              padding: "4px 8px",
              marginBottom: 4
            }}
          >
            Slide Storyboard (12)
          </div>

          {slideList.map((s, idx) => {
            const isActive = activeSlide === idx;
            return (
              <div
                key={s.id}
                onClick={() => setActiveSlide(idx)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isActive ? "var(--burgundy-light, rgba(110,26,45,0.28))" : "rgba(255,255,255,0.03)",
                  border: isActive ? "1.5px solid var(--burgundy, #6E1A2D)" : "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start"
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 5px",
                    borderRadius: 4,
                    background: isActive ? "var(--burgundy, #6E1A2D)" : "rgba(255,255,255,0.1)",
                    color: "#FFFFFF",
                    lineHeight: 1.2
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: isActive ? "var(--burgundy-accent, #FF9488)" : "var(--text-muted, #94A3B8)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {s.tag}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#FFFFFF" : "var(--text-body, #CBD5E1)",
                      lineHeight: 1.3,
                      marginTop: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {s.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Presentation Stage */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflowY: "auto",
            background: "var(--bg-main, #0B0F19)",
            alignItems: "center",
            padding: "16px 24px 80px 24px",
            position: "relative"
          }}
        >
          {/* Slide Navigation Header Bar */}
          <div
            style={{
              width: "100%",
              maxWidth: 960,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted, #94A3B8)" }}>
              PREVIEWING SLIDE <strong style={{ color: "#FFFFFF" }}>{activeSlide + 1}</strong> OF 12
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                disabled={activeSlide === 0}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: activeSlide === 0 ? "rgba(255,255,255,0.3)" : "#FFFFFF",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: activeSlide === 0 ? "not-allowed" : "pointer"
                }}
              >
                ‹ Previous
              </button>
              <button
                onClick={() => setActiveSlide((prev) => Math.min(11, prev + 1))}
                disabled={activeSlide === 11}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: activeSlide === 11 ? "rgba(255,255,255,0.3)" : "#FFFFFF",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: activeSlide === 11 ? "not-allowed" : "pointer"
                }}
              >
                Next ›
              </button>
            </div>
          </div>

          {/* ── 16:9 Slide Canvas Mockup ── */}
          <div
            style={{
              width: "100%",
              maxWidth: 960,
              aspectRatio: "16 / 9",
              background: activeSlide === 0 ? "#0F172A" : "#F8FAFC",
              borderRadius: 10,
              boxShadow: "0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              color: activeSlide === 0 ? "#FFFFFF" : "#0F172A"
            }}
          >
            {/* Top Chrome Banner for slides 2-12 */}
            {activeSlide > 0 && (
              <div
                style={{
                  height: 48,
                  background: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 22px",
                  borderBottom: "3px solid #F59E0B",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#FBBF24" }}>👑</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#FFFFFF", letterSpacing: "1px" }}>
                    NEXUS SAP COPILOT
                  </span>
                  <span style={{ opacity: 0.4, color: "#FFFFFF" }}>|</span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 750,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(245,158,11,0.2)",
                      color: "#FBBF24",
                      border: "1px solid rgba(245,158,11,0.4)"
                    }}
                  >
                    {slideList[activeSlide].tag}
                  </span>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>
                  {model.caseId || "NX-AUTO"} • {model.landscape || "S/4HANA 2023"}
                </div>
              </div>
            )}

            {/* Slide Body Stage */}
            <div
              style={{
                flex: 1,
                padding: activeSlide === 0 ? "32px 40px" : "18px 24px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {renderSlideContent(activeSlide, model, slideList)}
            </div>

            {/* Bottom Footer Bar */}
            <div
              style={{
                height: 28,
                background: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 22px",
                borderTop: "1px solid #1E293B",
                fontSize: 9.5,
                color: "#94A3B8",
                flexShrink: 0
              }}
            >
              <span>CONFIDENTIAL & READ-ONLY SAP ARCHITECTURE · 100% NATIVE OBJECTS</span>
              <span style={{ fontWeight: 700, color: "#E2E8F0" }}>
                SLIDE {activeSlide + 1} OF 12
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Presentation Follow-Up Bar (Pinned Bottom) ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 24px",
          background: "var(--bg-surface, #111827)",
          borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 30
        }}
      >
        {/* Quick Suggestion Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          <span style={{ fontSize: 10.5, fontWeight: 750, color: "var(--text-muted, #94A3B8)", flexShrink: 0 }}>
            Quick Refine:
          </span>
          {quickPills.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSendFollowup(pill)}
              disabled={isRefining}
              style={{
                padding: "3px 10px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#E2E8F0",
                fontSize: 11,
                fontWeight: 600,
                cursor: isRefining ? "wait" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              + {pill}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="text"
            value={followupText}
            onChange={(e) => setFollowupText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendFollowup();
              }
            }}
            placeholder="Ask a follow-up or refine these presentation slides (e.g., 'Add delivery block configuration', 'Deepen CVI error resolution')..."
            style={{
              flex: 1,
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
              background: "rgba(255,255,255,0.06)",
              color: "#FFFFFF",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit"
            }}
          />

          <button
            onClick={() => handleSendFollowup()}
            disabled={!followupText.trim() || isRefining}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              background: (!followupText.trim() || isRefining)
                ? "rgba(255,255,255,0.1)"
                : "var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%))",
              color: "#FFFFFF",
              border: "none",
              fontSize: 12.5,
              fontWeight: 750,
              cursor: (!followupText.trim() || isRefining) ? "not-allowed" : "pointer",
              boxShadow: followupText.trim() ? "0 2px 8px rgba(110,26,45,0.3)" : "none"
            }}
          >
            {isRefining ? "Refining..." : "Send Follow-Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Slide Canvas Content Renderer for all 12 slides
 */
function renderSlideContent(index, model, slideList) {
  switch (index) {
    case 0:
      // Slide 1: Cover Slide
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 4, background: "#1E293B", color: "#FBBF24", border: "1px solid #F59E0B" }}>
              👑 NEXUS SAP COPILOT · EXECUTIVE DECK
            </span>
          </div>

          <h1 style={{ margin: "0 0 14px 0", fontSize: 24, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.25 }}>
            {model.professionalTitle}
          </h1>

          <p style={{ margin: "0 0 24px 0", fontSize: 12, color: "#94A3B8", lineHeight: 1.5, maxWidth: "85%" }}>
            Inquiry Scope: "{model.originalUserQuestion?.slice(0, 180)}..."
            <br />
            Comprehensive 8-Part SAP Architecture & Grounded Knowledge Transformation.
          </p>

          <div
            style={{
              padding: "14px 18px",
              borderRadius: 6,
              background: "#1E293B",
              border: "1px solid #334155",
              maxWidth: "85%",
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA" }}>
              CASE IDENTIFIER: {model.caseId} | MODULE: {model.moduleClassification?.primaryModule || "SAP SD"} | DATE: {new Date().toLocaleDateString()}
            </div>
            <div style={{ fontSize: 10, color: "#E2E8F0" }}>
              Target Landscape: {model.landscape} | Evidence Status: {model.evidenceStatus}
            </div>
          </div>
        </div>
      );

    case 1:
      // Slide 2: Direct Executive Answer
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide2}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
            {/* Left Model Container */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6E1A2D", marginBottom: 10 }}>
                S/4HANA Master Data Architecture Model
              </div>

              {/* Node BUT000 */}
              <div style={{ padding: "8px 12px", background: "#1E293B", borderRadius: 6, border: "1.5px solid #3B82F6", textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#FBBF24" }}>BUSINESS PARTNER (BUT000)</div>
                <div style={{ fontSize: 9, color: "#E2E8F0" }}>Single Leading Golden Object · Replaces XD01 / VD01</div>
              </div>

              <div style={{ textAlign: "center", color: "#64748B", fontSize: 11, margin: "2px 0" }}>↓ CVI Synchronization</div>

              {/* Node Role Extension */}
              <div style={{ padding: "8px 12px", background: "rgba(110,26,45,0.08)", borderRadius: 6, border: "1.5px solid #6E1A2D", textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#6E1A2D" }}>CUSTOMER ROLE EXTENSION (FLCU01 & FLCU00)</div>
                <div style={{ fontSize: 8.5, color: "#475569" }}>Links BUT000 GUID to Customer KNA1 & KNB1</div>
              </div>

              {/* Branches KNVV & KNVS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ padding: 6, background: "rgba(37,99,235,0.08)", borderRadius: 6, border: "1px solid #3B82F6" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#1D4ED8" }}>Sales Area (KNVV)</div>
                  <div style={{ fontSize: 8, color: "#334155" }}>Pricing Procedure (KALKS) · Currency</div>
                </div>
                <div style={{ padding: 6, background: "rgba(13,148,136,0.08)", borderRadius: 6, border: "1px solid #0D9488" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0F766E" }}>Shipping Data (KNVS)</div>
                  <div style={{ fontSize: 8, color: "#334155" }}>Shipping Condition (VSBED) · Plant</div>
                </div>
              </div>

              <div style={{ marginTop: "auto", padding: "6px 8px", background: "#FEF3C7", borderRadius: 4, textAlign: "center", fontSize: 8.5, fontWeight: 700, color: "#B45309" }}>
                DOWNSTREAM SD DETERMINATION: Pricing (OVKK) · Shipping Point (OVL2) · Partners (VOPAN)
              </div>
            </div>

            {/* Right Verdict Container */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6E1A2D", marginBottom: 8 }}>
                Direct Executive Verdict
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: 9.5, color: "#334155", lineHeight: 1.4 }}>
                {model.directAnswer?.slice(0, 320)}...
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                <div style={{ padding: "6px 8px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 4 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: "#6E1A2D" }}>SINGLE LEADING OBJECT</div>
                  <div style={{ fontSize: 8, color: "#64748B" }}>BUT000 manages all identity data across enterprise entities.</div>
                </div>
                <div style={{ padding: "6px 8px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 4 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: "#6E1A2D" }}>CVI SYNCHRONIZATION</div>
                  <div style={{ fontSize: 8, color: "#64748B" }}>Customer/Vendor Integration guarantees database consistency.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 2:
      // Slide 3: Module & Process Classification
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide3}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
            <div style={{ padding: 12, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#6E1A2D" }}>PRIMARY MODULE CLASSIFICATION</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: "4px 0" }}>
                {model.moduleClassification?.primaryModule || "SAP SD (Sales & Distribution)"}
              </div>
              <div style={{ fontSize: 9, color: "#64748B" }}>Sub-Area: {model.moduleClassification?.subArea}</div>
            </div>

            <div style={{ padding: 12, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#0284C7" }}>CROSS-MODULE INTEGRATION SCOPE</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", margin: "4px 0" }}>
                {model.moduleClassification?.crossModuleScope?.join(" · ") || "SD · FI · MM · LE"}
              </div>
              <div style={{ fontSize: 9, color: "#64748B" }}>Coordinates Financials, Inventory, and Outbound Logistics.</div>
            </div>

            <div style={{ padding: 12, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#0D9488" }}>BUSINESS PROCESS DEFINITION</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", margin: "4px 0" }}>
                {model.moduleClassification?.businessProcess || "Customer Master Maintenance"}
              </div>
            </div>

            <div style={{ padding: 12, background: "#1E293B", borderRadius: 8, color: "#FFFFFF" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#FBBF24" }}>KEY TRANSACTIONAL COCKPITS</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", margin: "4px 0" }}>
                BP · VA01 · VL01N · VF01 · OVL2 · OVKK
              </div>
            </div>
          </div>
        </div>
      );

    case 3:
      // Slide 4: Business Process Flow
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide4}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, flex: 1, marginBottom: 10 }}>
            {model.processFlow?.slice(0, 6).map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: "#6E1A2D", background: "rgba(110,26,45,0.08)", padding: "2px 4px", borderRadius: 3, alignSelf: "flex-start" }}>
                  STEP 0{idx + 1}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0F172A", margin: "6px 0 4px 0", lineHeight: 1.2 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 8, color: "#64748B", lineHeight: 1.3, flex: 1 }}>
                  {step.action?.slice(0, 90)}...
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#0284C7", marginTop: 4 }}>
                  [{step.tcode}]
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "8px 14px", background: "#1E293B", borderRadius: 6, color: "#FFFFFF" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#FBBF24" }}>PROCESS EXECUTION CRITICALITY & GOVERNANCE RULES</div>
            <div style={{ fontSize: 8.5, color: "#E2E8F0", marginTop: 2 }}>
              1. General BP cannot create sales orders in VA01 until FLCU01 is extended to Sales Area.
              2. Shipping Conditions (KNVS) must exist to prevent automatic delivery blocking (V1 382 & VL 149).
            </div>
          </div>
        </div>
      );

    case 4:
      // Slide 5: Layered Architecture
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide5}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {[
              { level: "LAYER 1 · ORGANIZATIONAL DATA", title: "Enterprise Sales Structure", desc: "Sales Organization (VKORG) · Distribution Channel (VTWEG) · Division (SPART)", bg: "#1E293B", text: "#FFFFFF", tag: "#FBBF24" },
              { level: "LAYER 2 · MASTER DATA ATTRIBUTES", title: "Business Partner Customer Scope (KNVV & KNVS)", desc: "Customer Pricing Procedure (KALKS) · Shipping Conditions (VSBED) · Delivering Plant (VWERK)", bg: "#EFF6FF", text: "#1E293B", tag: "#2563EB" },
              { level: "LAYER 3 · AUTOMATED DETERMINATION", title: "Condition Technique & Rule Engines", desc: "Shipping Point Determination (OVL2) · Pricing Procedure Determination (OVKK) · Partner Determination", bg: "#F0FDF4", text: "#1E293B", tag: "#16A34A" },
              { level: "LAYER 4 · TRANSACTIONAL OUTCOMES", title: "Order-to-Cash Execution Documents", desc: "Sales Order (VA01) → Outbound Delivery (VL01N) → Billing Document (VF01)", bg: "#FFF1F2", text: "#1E293B", tag: "#E11D48" }
            ].map((layer, idx) => (
              <div
                key={idx}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  background: layer.bg,
                  color: layer.text,
                  border: "1px solid rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: layer.tag }}>{layer.level}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, margin: "2px 0" }}>{layer.title}</div>
                  <div style={{ fontSize: 8.5, opacity: 0.85 }}>{layer.desc}</div>
                </div>
                <span style={{ fontSize: 14 }}>➔</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 5:
      // Slide 6: Database Data Model
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide6}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, flex: 1 }}>
            {model.tablesAndFields?.slice(0, 5).map((tbl, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: idx === 0 ? "1.5px solid #F59E0B" : "1px solid #CBD5E1",
                  borderRadius: 6,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ background: idx === 0 ? "#1E293B" : "#0F172A", color: idx === 0 ? "#FBBF24" : "#FFFFFF", padding: "4px 6px", borderRadius: 4, textAlign: "center", fontSize: 11, fontWeight: 800 }}>
                  {tbl.table}
                </div>
                <div style={{ fontSize: 8, color: "#64748B", textAlign: "center", margin: "4px 0" }}>{tbl.name}</div>
                <div style={{ fontSize: 7.5, fontWeight: 700, color: "#6E1A2D", background: "rgba(110,26,45,0.08)", padding: 2, borderRadius: 2, textAlign: "center", marginBottom: 6 }}>
                  {tbl.role}
                </div>
                <div style={{ fontSize: 7.5, fontWeight: 700, color: "#0284C7" }}>KEYS:</div>
                <div style={{ fontSize: 7.5, color: "#1E293B", marginBottom: 6 }}>{tbl.keyFields?.join(", ")}</div>
                <div style={{ fontSize: 7.5, fontWeight: 700, color: "#475569" }}>FIELDS:</div>
                <div style={{ fontSize: 7.5, color: "#334155" }}>{tbl.dataFields?.slice(0, 3).join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 6:
      // Slide 7: Automated Determination Logic
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide7}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
            {/* OVL2 */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0F766E" }}>SHIPPING POINT DETERMINATION</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", background: "#0D9488", color: "#FFFFFF", borderRadius: 4 }}>OVL2</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                <div style={{ padding: 4, background: "#F1F5F9", borderRadius: 4, fontSize: 8 }}>INPUT 1: Shipping Condition (KNVS-VSBED)</div>
                <div style={{ padding: 4, background: "#F1F5F9", borderRadius: 4, fontSize: 8 }}>INPUT 2: Loading Group (MARC-LADGR)</div>
                <div style={{ padding: 4, background: "#F1F5F9", borderRadius: 4, fontSize: 8 }}>INPUT 3: Delivering Plant (KNVS-VWERK)</div>
              </div>
              <div style={{ marginTop: "auto", padding: "8px 10px", background: "#1E293B", borderRadius: 6, color: "#FFFFFF" }}>
                <div style={{ fontSize: 8, color: "#94A3B8" }}>DETERMINED OUTCOME:</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#34D399" }}>Shipping Point (TVST-VSTEL)</div>
                <div style={{ fontSize: 8, color: "#E2E8F0" }}>Required for Outbound Delivery generation in VL01N.</div>
              </div>
            </div>

            {/* OVKK */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#B45309" }}>PRICING PROCEDURE DETERMINATION</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", background: "#F59E0B", color: "#FFFFFF", borderRadius: 4 }}>OVKK</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                <div style={{ padding: 4, background: "#F1F5F9", borderRadius: 4, fontSize: 8 }}>INPUT 1: Sales Area (Sales Org + Distr Ch + Division)</div>
                <div style={{ padding: 4, background: "#F1F5F9", borderRadius: 4, fontSize: 8 }}>INPUT 2: Customer Pricing Procedure (KNVV-KALKS)</div>
                <div style={{ padding: 4, background: "#F1F5F9", borderRadius: 4, fontSize: 8 }}>INPUT 3: Document Pricing Procedure (TVAK-KALVG)</div>
              </div>
              <div style={{ marginTop: "auto", padding: "8px 10px", background: "#1E293B", borderRadius: 6, color: "#FFFFFF" }}>
                <div style={{ fontSize: 8, color: "#94A3B8" }}>DETERMINED OUTCOME:</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#FBBF24" }}>Pricing Procedure (T683-KALSM)</div>
                <div style={{ fontSize: 8, color: "#E2E8F0" }}>Calculates condition technique hierarchy, base price & taxes.</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 7:
      // Slide 8: Cross-Module Integration Ecosystem
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide8}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
            <div style={{ padding: 10, background: "rgba(110,26,45,0.06)", border: "1px solid #6E1A2D", borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#6E1A2D" }}>SAP FI (Financial Accounting)</div>
              <div style={{ fontSize: 8.5, color: "#334155", marginTop: 4 }}>
                • Reconciliation Account (KNB1-AKONT)<br />
                • Payment Terms (ZTERM) & Dunning<br />
                • Real-time Billing Postings (VF01 → BKPF)
              </div>
            </div>

            <div style={{ padding: 10, background: "rgba(37,99,235,0.06)", border: "1px solid #2563EB", borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1D4ED8" }}>SAP SD (Sales & Distribution)</div>
              <div style={{ fontSize: 8.5, color: "#334155", marginTop: 4 }}>
                • Sales Area extension (Role FLCU01)<br />
                • Pricing schema evaluation (OVKK)<br />
                • Partner functions (SP, SH, BP, PY via VOPAN)
              </div>
            </div>

            <div style={{ padding: 10, background: "rgba(16,185,129,0.06)", border: "1px solid #10B981", borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#047857" }}>SAP MM (Materials Management)</div>
              <div style={{ fontSize: 8.5, color: "#334155", marginTop: 4 }}>
                • Delivering Plant sourcing (KNVS-VWERK)<br />
                • Loading Group matching (MARC-LADGR)<br />
                • Stock reservation & ATP availability
              </div>
            </div>

            <div style={{ padding: 10, background: "rgba(13,148,136,0.06)", border: "1px solid #0D9488", borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#0F766E" }}>SAP LE / EWM (Logistics Execution)</div>
              <div style={{ fontSize: 8.5, color: "#334155", marginTop: 4 }}>
                • Shipping Point Determination (OVL2)<br />
                • Route determination (Country + Transport Zone)<br />
                • Automated delivery creation & EWM dispatch
              </div>
            </div>
          </div>
        </div>
      );

    case 8:
      // Slide 9: Troubleshooting Diagnostic Tree
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide9}
          </h2>

          <div style={{ padding: "6px 12px", background: "rgba(185,28,28,0.1)", border: "1px solid #EF4444", borderRadius: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: "#B91C1C" }}>REPORTED SYMPTOM: </span>
            <span style={{ fontSize: 8.5, color: "#7F1D1D" }}>Order entry fails in VA01 (V1 382) or Delivery fails in VL01N (VL 149)</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flex: 1, marginBottom: 8 }}>
            {[
              { stage: "STAGE 1 · BP ROLE VERIFICATION", q: "Is Customer Role FLCU01 extended to Sales Area?", no: "Extend BP Role FLCU01 to Sales Org, Channel, Division.", yes: "Proceed to Shipping Verification.", tool: "T-Code: BP" },
              { stage: "STAGE 2 · SHIPPING DATA CHECK", q: "Are Shipping Conditions (KNVS) maintained?", no: "Maintain Shipping Condition & Delivering Plant in BP.", yes: "Proceed to CVI Check.", tool: "T-Code: BP / OVL2" },
              { stage: "STAGE 3 · CVI SYNCHRONIZATION", q: "Is CVI Synchronization operational?", no: "Inspect SLG1 log for Object CVI_FS; fix number assignments.", yes: "Order creation verified.", tool: "T-Code: SLG1" }
            ].map((s, idx) => (
              <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 8, fontWeight: 800, background: "#1E293B", color: "#FFFFFF", padding: "2px 4px", borderRadius: 3, textAlign: "center" }}>{s.stage}</div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: "#0F172A", margin: "6px 0" }}>{s.q}</div>
                <div style={{ padding: 4, background: "#FEE2E2", borderRadius: 4, fontSize: 7.5, color: "#B91C1C", marginBottom: 4 }}><strong>IF NO:</strong> {s.no}</div>
                <div style={{ padding: 4, background: "#DCFCE7", borderRadius: 4, fontSize: 7.5, color: "#047857", marginBottom: 4 }}><strong>IF YES:</strong> {s.yes}</div>
                <div style={{ fontSize: 7.5, fontWeight: 800, color: "#0284C7", textAlign: "center", marginTop: "auto" }}>{s.tool}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "6px 12px", background: "#1E293B", borderRadius: 6, color: "#FFFFFF", fontSize: 8 }}>
            <span style={{ fontWeight: 800, color: "#FBBF24" }}>LOGS: </span>
            SLG1 (Object: CVI_FS, Subobject: RUN) for synchronization traces • MDS_LOAD_COCKPIT for bulk synchronization triage.
          </div>
        </div>
      );

    case 9:
      // Slide 10: ECC vs S/4HANA Architecture & SPRO
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide10}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1, marginBottom: 8 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>SAP ECC 6.0 TRADITIONAL MODEL</div>
              <div style={{ fontSize: 8.5, color: "#475569", lineHeight: 1.5 }}>
                ❌ Decentralized transactions: XD01, VD01, FD01.<br />
                ❌ Redundant customer & vendor records in KNA1 and LFA1.<br />
                ❌ Direct table storage with zero Business Partner golden header.<br />
                ❌ Classic credit management via KNKK/KNKA (FD32).
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1.5px solid #0284C7", borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0284C7", marginBottom: 6 }}>SAP S/4HANA MODERN ARCHITECTURE</div>
              <div style={{ fontSize: 8.5, color: "#0F172A", lineHeight: 1.5 }}>
                ✔ Unified BP transaction centralized in transaction BP.<br />
                ✔ Single Golden Source of Truth (BUT000) for all entity roles.<br />
                ✔ CVI synchronization engine automatically updates KNA1/KNVV.<br />
                ✔ Native FSCM credit management integrated in BP role UKM000.
              </div>
            </div>
          </div>

          <div style={{ padding: "8px 12px", background: "#1E293B", borderRadius: 6, color: "#FFFFFF" }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: "#FBBF24" }}>OFFICIAL SPRO CUSTOMIZING PATH: CUSTOMER/VENDOR INTEGRATION</div>
            <div style={{ fontSize: 8, color: "#E2E8F0", marginTop: 2 }}>
              SPRO → Cross-Application Components → Master Data Synchronization → Customer/Vendor Integration → Business Partner Settings → Settings for Customer Integration → Field Assignment → Assign Keys → Define Number Assignment for Direction BP to Customer
            </div>
          </div>
        </div>
      );

    case 10:
      // Slide 11: Consulting & Interview Delivery
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide11}
          </h2>

          <div style={{ padding: "8px 12px", background: "#FFFFFF", border: "1.5px solid #6E1A2D", borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: "#6E1A2D" }}>30-SECOND EXECUTIVE ELEVATOR PITCH</div>
            <div style={{ fontSize: 9, color: "#1E293B", marginTop: 4, lineHeight: 1.35 }}>
              {model.interviewDelivery?.executivePitch}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#0284C7", marginBottom: 4 }}>1-2 MINUTE DELIVERY FLOW</div>
              {model.interviewDelivery?.comprehensiveDelivery?.slice(0, 3).map((item, i) => (
                <div key={i} style={{ fontSize: 8, color: "#334155", marginBottom: 4 }}>
                  • {item}
                </div>
              ))}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#B45309", marginBottom: 4 }}>PREDICTED PANEL FOLLOW-UPS</div>
              {model.interviewDelivery?.panelFollowUps?.slice(0, 3).map((q, i) => (
                <div key={i} style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 11:
      // Slide 12: Technical Reference & Grounded Evidence
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {model.slideTitles?.slide12}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, flex: 1 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#6E1A2D", marginBottom: 6 }}>TRANSACTION CODE MATRIX</div>
              {model.tCodes?.slice(0, 6).map((t, i) => (
                <div key={i} style={{ fontSize: 8, color: "#334155", marginBottom: 3 }}>
                  <strong style={{ color: "#6E1A2D" }}>{t.code}</strong> — {t.desc}
                </div>
              ))}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0284C7", marginBottom: 6 }}>DATABASE TABLES & KEYS</div>
              {model.tablesAndFields?.slice(0, 4).map((t, i) => (
                <div key={i} style={{ fontSize: 8, color: "#334155", marginBottom: 4 }}>
                  <strong style={{ color: "#0284C7" }}>{t.table}</strong> ({t.name})<br />
                  <span style={{ fontSize: 7.5, color: "#64748B" }}>Keys: {t.keyFields?.join(", ")}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0F766E", marginBottom: 6 }}>GROUNDED EVIDENCE AUDIT</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#0D9488", marginBottom: 4 }}>
                ✔ Status: {model.evidenceStatus}
              </div>
              {model.sources?.slice(0, 2).map((s, i) => (
                <div key={i} style={{ fontSize: 7.5, color: "#475569", marginBottom: 4 }}>
                  [{s.citationId || i + 1}] {s.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
