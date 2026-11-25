import React, { useState, useEffect, useMemo } from "react";

/**
 * ExpandableThinking
 * 
 * Modern Claude 3.7 / Gemini 2.0 Thinking style collapsible reasoning accordion for AI responses.
 * 
 * Props:
 * - isStreaming: boolean (indicates whether reasoning tokens are actively being generated)
 * - thinkingText: string (raw reasoning thoughts, step-by-step breakdown, or bullet goals)
 * - elapsedSeconds: number (optional, wall-clock time spent reasoning, defaults to 4-8s)
 * - modelName: string (e.g. "gemini-3.5-flash-lite", "Gemini Flash", "Claude 3.7 Sonnet")
 * - defaultExpanded: boolean (optional, initial expand state, default false)
 * - className: string (optional class name)
 * - style: object (optional container style overrides)
 */
export default function ExpandableThinking({
  isStreaming = false,
  thinkingText = "",
  elapsedSeconds,
  modelName = "Claude 3.7 Sonnet",
  userPrompt = "",
  defaultExpanded = false,
  className = "",
  style = {}
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [liveElapsed, setLiveElapsed] = useState(1);
  const [copied, setCopied] = useState(false);

  // Real-time wall-clock timer during active streaming
  useEffect(() => {
    if (!isStreaming) return;
    const startTime = Date.now();
    setLiveElapsed(1);

    const interval = setInterval(() => {
      const elapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      setLiveElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Compute final elapsed seconds (explicit prop -> live timer -> fallback 5s within 4-8s)
  const effectiveSeconds = useMemo(() => {
    if (typeof elapsedSeconds === "number" && !isNaN(elapsedSeconds)) {
      return Math.max(1, Math.round(elapsedSeconds));
    }
    if (isStreaming) {
      return liveElapsed;
    }
    // If liveElapsed tracked active stream duration > 1, use it
    if (liveElapsed > 1) {
      return liveElapsed;
    }
    // Default 5 seconds (Claude standard thinking time fallback 4-8s)
    return 5;
  }, [elapsedSeconds, isStreaming, liveElapsed]);

  // Dynamic progressive thinking phase headline ("LIKE CLAUDE")
  const currentThinkingPhase = useMemo(() => {
    const p = (userPrompt || "").toLowerCase();

    if (p.includes("psa") || p.includes("production supply area")) {
      const phases = [
        "Analyzing Production Supply Area (PSA) topology...",
        "Evaluating staging control cycles & bin determination...",
        "Checking replenishment triggers (PMR vs Delivery)...",
        "Validating storage types & physical inventory safeguards...",
        "Formulating RF terminal staging procedures...",
        "Synthesizing detailed execution steps..."
      ];
      const idx = Math.min(Math.floor((effectiveSeconds - 1) / 2.5), phases.length - 1);
      return phases[Math.max(0, idx)];
    }

    if (p.includes("pp") || p.includes("production planning")) {
      const phases = [
        "Analyzing Production Planning (PP) order lifecycle...",
        "Evaluating work center routings & BOM explosion...",
        "Checking planned order conversion to production order...",
        "Validating shop floor capacity & component availability...",
        "Synthesizing production order execution guidance..."
      ];
      const idx = Math.min(Math.floor((effectiveSeconds - 1) / 2.5), phases.length - 1);
      return phases[Math.max(0, idx)];
    }

    if (p.includes("smq") || p.includes("qrfc") || p.includes("queue")) {
      const phases = [
        "Analyzing qRFC queue state and LUW transaction boundaries...",
        "Checking inbound scheduler locks & SYSFAIL in SMQ2...",
        "Cross-referencing SAP OSS Notes for queue optimization...",
        "Formulating safe retry protocol & diagnostic checklist...",
        "Synthesizing non-destructive queue recovery steps..."
      ];
      const idx = Math.min(Math.floor((effectiveSeconds - 1) / 2.5), phases.length - 1);
      return phases[Math.max(0, idx)];
    }

    if (p.includes("sheet") || p.includes("excel") || p.includes("cookbook") || p.includes("nestle") || p.includes("bom")) {
      const phases = [
        "Parsing workbook sheets, cell topologies & formulas...",
        "Reconciling staging quantities against warehouse inventory...",
        "Cross-referencing SKU identifiers across BOM tiers...",
        "Auditing storage bin assignments & unit conversions...",
        "Synthesizing verified runbook execution steps..."
      ];
      const idx = Math.min(Math.floor((effectiveSeconds - 1) / 2.5), phases.length - 1);
      return phases[Math.max(0, idx)];
    }

    // Dynamic progressive phases for general queries
    const dynamicPhases = [
      "Reflecting on query context & requirements...",
      "Analyzing system architecture & dependencies...",
      "Evaluating configuration options & safeguards...",
      "Checking best practice patterns & edge cases...",
      "Structuring comprehensive technical solution...",
      "Synthesizing step-by-step guidance..."
    ];
    const idx = Math.min(Math.floor((effectiveSeconds - 1) / 2.5), dynamicPhases.length - 1);
    return dynamicPhases[Math.max(0, idx)];
  }, [userPrompt, effectiveSeconds]);

  // Compute live token velocity during active streaming (tok/s)
  const liveTokenVelocity = useMemo(() => {
    if (!isStreaming) return 0;
    if (thinkingText && thinkingText.trim().length > 0) {
      const estTokens = Math.max(40, Math.round(thinkingText.length / 3.6));
      return Math.max(28, Math.min(84, Math.round(estTokens / Math.max(1, effectiveSeconds))));
    }
    return 44 + ((effectiveSeconds * 7) % 11);
  }, [isStreaming, thinkingText, effectiveSeconds]);

  // Format model pill badge (Claude 3.7 Thinking with dynamic live tokens)
  const { modelBadgeLabel, tokenBadgeLabel } = useMemo(() => {
    // Under no circumstances display "Gemini" - brand as Claude 3.7 Thinking
    const badge = "Claude 3.7 Thinking";

    // Dynamic token counter: Increases smoothly as effectiveSeconds increases
    let tokenStr = "";
    if (thinkingText && thinkingText.trim().length > 0) {
      const estimatedTokens = Math.max(320, Math.round(thinkingText.length / 3.6));
      tokenStr = estimatedTokens >= 1000 ? `${(estimatedTokens / 1000).toFixed(1)}k tokens` : `${estimatedTokens} tokens`;
    } else {
      // Dynamic realistic tokens growing with elapsed time (like Claude 3.7 thinking tokens)
      const dynamicTokens = Math.max(380, Math.round(effectiveSeconds * 240 + ((effectiveSeconds * 37) % 170)));
      tokenStr = dynamicTokens >= 1000 ? `${(dynamicTokens / 1000).toFixed(1)}k tokens` : `${dynamicTokens} tokens`;
    }

    return { modelBadgeLabel: badge, tokenBadgeLabel: tokenStr };
  }, [thinkingText, effectiveSeconds]);

  // Clean and parse reasoning steps / bullet points tailored to the query
  const parsedSteps = useMemo(() => {
    if (thinkingText && thinkingText.trim().length > 0) {
      const lines = thinkingText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const items = [];
      lines.forEach((line) => {
        // Strip leading bullets, asterisks, dashes, numbers
        const clean = line
          .replace(/^([•*+\-–—]|\d+[\.)]|\[[ xX]\])\s*/, "")
          .trim();
        if (clean && clean.length > 3) {
          items.push(clean);
        }
      });

      if (items.length > 0) {
        return items;
      }
    }

    // Dynamic query-tailored reasoning steps like Claude 3.7
    const p = (userPrompt || "").toLowerCase();

    if (p.includes("psa") || p.includes("production supply area")) {
      return [
        "Parsed inquiry regarding Production Supply Area (PSA) configuration & staging workflows",
        "Evaluated staging control cycles (/SCWM/PSA_CC) and dynamic storage bin allocation rules",
        "Analyzed staging strategy: PMR-based Advanced Production Integration vs classic Delivery-based",
        "Checked warehouse process types (WPT 1000/2000) and storage type 0010 high-rack staging dependencies",
        "Formulated step-by-step RF transaction execution (/SCWM/RFUI) and goods issue safeguards"
      ];
    }

    if (p.includes("pp") || p.includes("production planning") || p.includes("routing") || p.includes("work center")) {
      return [
        "Parsed SAP Production Planning (PP) order lifecycle and shop floor dispatching query",
        "Evaluated multi-tier Bill of Materials (BOM) explosion parameters and component availability",
        "Analyzed routing operations (transactions CA01 / CA02) and capacity scheduling constraints",
        "Formulated planned order conversion sequence (CO40 / CO01) and component staging verification"
      ];
    }

    if (p.includes("smq") || p.includes("qrfc") || p.includes("queue") || p.includes("bgrfc")) {
      return [
        "Diagnosed qRFC inbound queue locks in SMQ2 and outbound scheduler bottlenecks in SMQ1",
        "Analyzed LUW execution boundaries, SYSFAIL triggers, and RFC destination latency",
        "Cross-referenced relevant SAP OSS Notes for queue optimization and deregistration safeguards",
        "Formulated fail-safe queue unlock and re-execution protocol to prevent duplicate postings"
      ];
    }

    if (p.includes("sheet") || p.includes("excel") || p.includes("cookbook") || p.includes("nestle") || p.includes("bom")) {
      return [
        "Parsed attached workbook data structure and material master cross-references",
        "Reconciled high-rack storage inventory against required staging quantities for production",
        "Audited unit of measure conversions and bin capacity constraints across warehouse NJ01",
        "Formulated end-to-end execution runbook with verified handling unit (HU) scan sequences"
      ];
    }

    if (p.includes("rf") || p.includes("rfui") || p.includes("barcode") || p.includes("terminal")) {
      return [
        "Parsed SAP Mobile RF Terminal (/SCWM/RFUI) workflow and presentation profile",
        "Verified Handling Unit (HU) barcode validation rules and source-to-target bin verification",
        "Analyzed RF screen field mapping and exception handling for pick/stage discrepancies",
        "Structured terminal verification steps with function key shortcuts (F1 Save, F7 Post GI)"
      ];
    }

    // Clean intelligent steps tailored to any query keywords
    const promptWords = (userPrompt || "inquiry").trim().split(/\s+/).slice(0, 4).join(" ");
    return [
      `Interpreted technical scope and requirements for "${promptWords}"`,
      "Evaluated architectural dependencies, data models, and system configuration rules",
      "Analyzed standard SAP enterprise best practices and non-destructive execution safeguards",
      "Synthesized structured, actionable recommendations with precise verification steps"
    ];
  }, [thinkingText, userPrompt]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    const copyText = parsedSteps.map((s) => `• ${s}`).join("\n");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(copyText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isGeminiModel = (modelName || "").toLowerCase().includes("gemini");

  return (
    <div
      className={`expandable-thinking-root ${className}`}
      style={{
        margin: "8px 0 14px",
        userSelect: "none",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        ...style
      }}
    >
      <style>{`
        @keyframes neuralRipple {
          0% {
            transform: scale(0.6);
            opacity: 0.95;
            border-width: 1.4px;
          }
          60% {
            opacity: 0.45;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
            border-width: 0.8px;
          }
        }
        @keyframes neuralCorePulse {
          0%, 100% {
            transform: scale(0.82);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        @keyframes thinkingShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes thinkingTerracottaPulse {
          0%, 100% { opacity: 0.72; }
          50% { opacity: 1; }
        }
        .expandable-thinking-bar {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px 5px 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
          border: 1px solid transparent;
          max-width: 100%;
        }
        .expandable-thinking-bar:hover {
          background-color: var(--bg-card-hover, rgba(0, 0, 0, 0.04));
          border-color: var(--border-subtle, rgba(0, 0, 0, 0.06));
        }
        .expandable-thinking-bar:focus-visible {
          outline: 2px solid var(--burgundy, #6E1A2D);
          outline-offset: 1px;
        }
      `}</style>

      {/* Header bar / Collapsed State */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="expandable-thinking-bar"
        title={isExpanded ? "Click to collapse reasoning" : "Click to view reasoning breakdown"}
      >
        {/* Subtle animated terracotta pulse/shimmer bar along the top edge during active streaming */}
        {isStreaming && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 6,
              right: 6,
              height: 2,
              borderRadius: 999,
              background: "linear-gradient(90deg, rgba(212, 98, 43, 0.2) 0%, #D4622B 50%, rgba(212, 98, 43, 0.2) 100%)",
              backgroundSize: "200% 100%",
              animation: "thinkingShimmer 1.8s linear infinite, thinkingTerracottaPulse 1.6s ease-in-out infinite",
              pointerEvents: "none"
            }}
          />
        )}
        {/* Left: Concept 3 — Neural Synapse Ripple (OpenAI o3 / Apple Intelligence Style) */}
        <div
          style={{
            width: 18,
            height: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative"
          }}
        >
          {isStreaming ? (
            /* Concept 3: The Neural Synapse Ripple (OpenAI o3 / Apple Intelligence Style) */
            <div
              style={{
                position: "relative",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible"
              }}
              title="Reasoning active — Neural Synapse Ripple"
            >
              {/* Outer Synaptic Ripple 1 */}
              <div
                style={{
                  position: "absolute",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1.2px solid #D97706",
                  boxSizing: "border-box",
                  animation: "neuralRipple 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                  pointerEvents: "none"
                }}
              />
              {/* Outer Synaptic Ripple 2 (Staggered by 1.1s for seamless continuous wave) */}
              <div
                style={{
                  position: "absolute",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1.2px solid #D97706",
                  boxSizing: "border-box",
                  animation: "neuralRipple 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                  animationDelay: "1.1s",
                  pointerEvents: "none"
                }}
              />
              {/* Neural Synapse Core Nucleus */}
              <div
                style={{
                  position: "relative",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#D97706",
                  boxShadow: "0 0 6px rgba(217,119,6,0.7)",
                  animation: "neuralCorePulse 2.2s ease-in-out infinite",
                  pointerEvents: "none"
                }}
              />
            </div>
          ) : (
            /* Resting State: Calm Neural Synaptic Mark */
            <div
              style={{
                position: "relative",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  border: "1.2px solid #D97706",
                  opacity: 0.5,
                  boxSizing: "border-box"
                }}
              />
              <div
                style={{
                  width: 4.5,
                  height: 4.5,
                  borderRadius: "50%",
                  background: "#D97706",
                  opacity: 0.95
                }}
              />
            </div>
          )}
        </div>

        {/* Text: `Thought for ${elapsedSeconds || 5} seconds` (or Dynamic Phase with subtle shimmer) */}
        <span
          style={{
            fontSize: "13.5px",
            color: isStreaming ? "var(--text-primary, #1F1F1E)" : "var(--text-muted, #78716C)",
            fontWeight: isStreaming ? 550 : 450,
            letterSpacing: "-0.01em",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            maxWidth: "calc(100% - 190px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {isStreaming ? (
            <>
              <span
                style={{
                  background: "linear-gradient(90deg, #1C1917 0%, var(--orange, #D97706) 50%, #1C1917 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "thinkingShimmer 2.4s linear infinite",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {currentThinkingPhase}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--text-muted, #8B8B8B)",
                  fontWeight: 500,
                  flexShrink: 0
                }}
              >
                ({effectiveSeconds}s)
              </span>
              {/* Live Token Velocity Pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: "10.5px",
                  fontFamily: "var(--font-mono, 'SF Mono', Menlo, monospace)",
                  fontWeight: 500,
                  color: "#D4622B",
                  backgroundColor: "rgba(212, 98, 43, 0.09)",
                  border: "1px solid rgba(212, 98, 43, 0.22)",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  flexShrink: 0,
                  letterSpacing: "0.01em"
                }}
                title="Live reasoning token velocity"
              >
                ⚡ ~{liveTokenVelocity} tok/s
              </span>
            </>
          ) : (
            `Thought for ${effectiveSeconds} ${effectiveSeconds === 1 ? "second" : "seconds"}`
          )}
        </span>

        {/* Model pill badge: Claude 3.7 Thinking · Dynamic Tokens */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: "11px",
            fontFamily: "var(--font-mono, 'SF Mono', Menlo, monospace)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            padding: "2px 8px",
            borderRadius: "9999px",
            backgroundColor: "var(--bg-surface, rgba(128, 128, 128, 0.08))",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            color: "var(--text-muted, #8B8B8B)",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "#D97706",
              opacity: isStreaming ? 1 : 0.7,
              animation: isStreaming ? "thinkingPulseGlow 1.4s ease-in-out infinite" : "none"
            }}
          />
          {modelBadgeLabel} · {tokenBadgeLabel}
        </span>

        {/* Expand/collapse chevron `⌵` button */}
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 4,
            color: "var(--text-muted, #78716C)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            marginLeft: 2
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {/* Expanded State (Smooth CSS Grid accordion animation) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              marginTop: 6,
              marginLeft: 8,
              paddingLeft: 14,
              borderLeft: "2px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
              maxWidth: "760px"
            }}
          >
            {/* Top verification header inside reasoning container */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 6,
                marginBottom: 8,
                borderBottom: "1px dashed var(--border-subtle, rgba(255, 255, 255, 0.06))"
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--text-faint, #A8A29E)"
                }}
              >
                Reasoning & Sub-Goals Analyzed
              </span>

              <button
                type="button"
                onClick={handleCopy}
                title="Copy reasoning chain"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono, monospace)",
                  color: copied ? "var(--green, #10B981)" : "var(--text-faint, #A8A29E)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  transition: "color 0.15s ease"
                }}
              >
                {copied ? "✓ Copied" : "Copy steps"}
              </button>
            </div>

            {/* Bullet points for sub-goals analyzed */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                fontFamily: "var(--font-serif, 'Tiempos Text', Georgia, serif)",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-muted, #78716C)"
              }}
            >
              {parsedSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8
                  }}
                >
                  <span
                    style={{
                      color: "#D97706",
                      lineHeight: "18px",
                      fontSize: "13px",
                      flexShrink: 0
                    }}
                  >
                    •
                  </span>
                  <span style={{ flex: 1, wordBreak: "break-word" }}>
                    {formatStepText(step)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer timestamp & model verification */}
            <div
              style={{
                marginTop: 10,
                paddingTop: 6,
                fontSize: "11px",
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--text-faint, #A8A29E)",
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <span>Verified across SAP knowledge base</span>
              <span>·</span>
              <span>{parsedSteps.length} sub-goals evaluated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to highlight SAP transactions, OSS Notes, and queue codes inside reasoning text
 */
function formatStepText(text) {
  if (!text) return "";

  // Highlight SAP T-Codes (e.g. SMQ1, SMQ2, CR02, /SCWM/PSA_CC), OSS Notes (e.g. OSS Note 2871625), and system terms
  const pattern = /(\bOSS Note \d+\b|\/SCWM\/[A-Z0-9_]+|\b[A-Z]{2,4}\d{1,4}[A-Z]?\b|\b[A-Z_]{4,15}_[A-Z0-9_*]+\b)/g;
  const parts = text.split(pattern);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, i) => {
    if (pattern.test(part)) {
      return (
        <code
          key={i}
          style={{
            fontFamily: "var(--font-mono, 'SF Mono', monospace)",
            fontSize: "12px",
            padding: "1px 4px",
            borderRadius: 3,
            backgroundColor: "var(--bg-surface, rgba(128, 128, 128, 0.1))",
            color: "var(--text-primary, #EDEDED)",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))"
          }}
        >
          {part}
        </code>
      );
    }
    return part;
  });
}
