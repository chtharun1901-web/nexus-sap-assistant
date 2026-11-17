import React, { useState } from "react";
import { api } from "../api.js";

const TOOL_ICONS = {
  checkDeliveryStatus: "📦",
  inspectHandlingUnit: "🏷️",
  queryBinStock: "🏢",
  checkQrfcQueue: "⚡",
  inspectEnqueueLocks: "🔒",
  clearQrfcQueue: "🧹",
  executePostingChange: "🔄",
  repackHandlingUnit: "🚚"
};

const TOOL_LABELS = {
  checkDeliveryStatus: "Check Delivery Status (/SCWM/PRDO)",
  inspectHandlingUnit: "Inspect Handling Unit (/SCWM/HUHDR)",
  queryBinStock: "Query Bin Stock (/SCWM/AQUA)",
  checkQrfcQueue: "Inspect qRFC Monitor (SMQ2)",
  inspectEnqueueLocks: "Inspect Enqueue Locks (SM12)",
  clearQrfcQueue: "Clear & Reset qRFC Queue (SMQ2)",
  executePostingChange: "Execute Posting Change (/SCWM/POST)",
  repackHandlingUnit: "Repack Handling Unit (/SCWM/PACK)"
};

export default function SapActionTimelineCard({
  agentData,
  onActionExecuted,
  style = {}
}) {
  if (!agentData) return null;

  const {
    timeline = [],
    pendingApprovalAction,
    modelUsed = "gemini-3.5-flash-lite",
    turnsExecuted = 0
  } = agentData;

  const [expandedSteps, setExpandedSteps] = useState(() => {
    const init = {};
    timeline.forEach((_, idx) => {
      init[idx] = true; // start expanded for instant operational visibility
    });
    return init;
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  const toggleStep = (idx) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleApproveAndExecute = async () => {
    if (!pendingApprovalAction || isExecuting) return;
    setIsExecuting(true);
    setExecutionError(null);

    try {
      const res = await api.sapExecuteAction({
        actionType: pendingApprovalAction.actionType,
        parameters: pendingApprovalAction.parameters || {}
      });

      if (res && res.ok) {
        setExecutionResult(res);
        if (typeof onActionExecuted === "function") {
          onActionExecuted(res);
        }
      } else {
        setExecutionError(res?.error || "Execution failed in SAP system");
      }
    } catch (err) {
      setExecutionError(err.message || "Failed to execute approved action");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className="sap-agent-timeline-card"
      style={{
        margin: "18px 0",
        padding: "20px 22px",
        background: "var(--bg-card, #1A1917)",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        ...style
      }}
    >
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          marginBottom: 18
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20
            }}
          >
            🤖
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary, #FAF8F5)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>Nexus Autonomous SAP Tool Agent</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "rgba(99, 102, 241, 0.18)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  color: "#818CF8",
                  padding: "2px 8px",
                  borderRadius: 12
                }}
              >
                Function Calling
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary, #A8967A)", marginTop: 2 }}>
              Multi-step chained tool execution across EWM, ERP & RF Gun layers
            </div>
          </div>
        </div>

        {/* Model & Turn Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              color: "var(--text-muted, #9CA3AF)",
              padding: "4px 10px",
              borderRadius: 6
            }}
          >
            Model: <span style={{ color: "#FDE68A", fontWeight: 600 }}>{modelUsed}</span>
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34D399",
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            {timeline.length} Tools Executed
          </div>
        </div>
      </div>

      {/* ── Chained Investigation Timeline ─────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted, #9CA3AF)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span>⛓️</span>
          <span>Autonomous Diagnostic Sequence ({timeline.length} steps)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {timeline.map((stepItem, idx) => {
            const isExpanded = !!expandedSteps[idx];
            const icon = TOOL_ICONS[stepItem.toolName] || "⚙️";
            const label = TOOL_LABELS[stepItem.toolName] || stepItem.toolName;

            return (
              <div
                key={idx}
                style={{
                  background: "var(--bg-card-hover, rgba(255,255,255,0.025))",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "all 0.15s ease"
                }}
              >
                {/* Step Item Header */}
                <div
                  onClick={() => toggleStep(idx)}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    cursor: "pointer",
                    userSelect: "none",
                    background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono, monospace)",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.35)",
                        color: "#A5B4FC",
                        padding: "2px 7px",
                        borderRadius: 4
                      }}
                    >
                      Step {stepItem.step || idx + 1}
                    </span>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary, #EDEDED)",
                        fontFamily: "var(--font-mono, monospace)"
                      }}
                    >
                      {stepItem.toolName}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-muted, #73736C)",
                        display: "none"
                      }}
                      className="sap-step-desc"
                    >
                      · {label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Args pill snippet */}
                    {stepItem.args && Object.keys(stepItem.args).length > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-mono, monospace)",
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                          color: "#FDE68A",
                          padding: "2px 8px",
                          borderRadius: 4,
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {Object.entries(stepItem.args)
                          .map(([k, v]) => `${k}:${v}`)
                          .join(", ")}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted, #9CA3AF)",
                        transition: "transform 0.15s ease",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* Step Item Collapsible Body */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "10px 14px 14px",
                      borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.05))",
                      background: "rgba(0,0,0,0.18)"
                    }}
                  >
                    {/* Call Arguments */}
                    <div style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "var(--text-muted, #9CA3AF)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: 4
                        }}
                      >
                        Input Arguments
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#93C5FD",
                          overflowX: "auto"
                        }}
                      >
                        {JSON.stringify(stepItem.args, null, 2)}
                      </pre>
                    </div>

                    {/* SAP Tool Output */}
                    <div>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "var(--text-muted, #9CA3AF)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: 4
                        }}
                      >
                        SAP System Response
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#A7F3D0",
                          overflowX: "auto",
                          maxHeight: 220
                        }}
                      >
                        {JSON.stringify(stepItem.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending Approval Card (Human-in-the-Loop) ─────────────────────── */}
      {pendingApprovalAction && !executionResult && (
        <div
          style={{
            background: "linear-gradient(180deg, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)",
            border: "1px solid rgba(217, 119, 6, 0.4)",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 0 25px rgba(217, 119, 6, 0.08)",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#FBBF24",
                  background: "rgba(217, 119, 6, 0.2)",
                  border: "1px solid rgba(217, 119, 6, 0.5)",
                  padding: "3px 9px",
                  borderRadius: 12
                }}
              >
                Human-in-the-Loop Approval Required
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "#FDE68A", fontWeight: 600 }}>
              Action Type: <code style={{ color: "#FFF" }}>{pendingApprovalAction.actionType}</code>
            </span>
          </div>

          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: 15.5,
              fontWeight: 700,
              color: "#FAF8F5"
            }}
          >
            {pendingApprovalAction.title}
          </h4>

          <p
            style={{
              margin: "0 0 14px 0",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#E5E7EB"
            }}
          >
            {pendingApprovalAction.description}
          </p>

          {/* Action Parameters Table */}
          {pendingApprovalAction.parameters && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16
              }}
            >
              {Object.entries(pendingApprovalAction.parameters).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    fontSize: 11.5,
                    fontFamily: "var(--font-mono, monospace)",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(217, 119, 6, 0.3)",
                    padding: "4px 9px",
                    borderRadius: 6,
                    color: "#FEF08A"
                  }}
                >
                  <strong style={{ color: "#FBBF24" }}>{key}:</strong> {String(val)}
                </div>
              ))}
            </div>
          )}

          {/* Execution Error Notice */}
          {executionError && (
            <div
              style={{
                marginBottom: 14,
                padding: "8px 12px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: 6,
                fontSize: 12.5,
                color: "#FCA5A5"
              }}
            >
              ⚠️ {executionError}
            </div>
          )}

          {/* Big Green Execution Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={isExecuting}
              onClick={handleApproveAndExecute}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: isExecuting
                  ? "rgba(16, 185, 129, 0.4)"
                  : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                border: "none",
                borderRadius: 8,
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: isExecuting ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                if (!isExecuting) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                if (!isExecuting) e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {isExecuting ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #FFF",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "nexusSpinner 0.8s linear infinite"
                    }}
                  />
                  <span>Executing SAP Fix in Production...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Approve & Execute SAP Fix</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Executed Success Confirmation Card ─────────────────────────────── */}
      {executionResult && (
        <div
          style={{
            background: "linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 0 25px rgba(16, 185, 129, 0.1)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#34D399",
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(16, 185, 129, 0.5)",
                  padding: "3px 9px",
                  borderRadius: 12
                }}
              >
                SAP Fix Committed & Verified
              </span>
            </div>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "#A7F3D0" }}>
              {executionResult.timestamp || new Date().toISOString()}
            </span>
          </div>

          <p
            style={{
              margin: "0 0 14px 0",
              fontSize: 13.5,
              fontWeight: 600,
              color: "#FAF8F5",
              lineHeight: 1.55
            }}
          >
            {executionResult.message}
          </p>

          {/* Details pills */}
          {executionResult.details && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8
              }}
            >
              {Object.entries(executionResult.details).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    fontSize: 11.5,
                    fontFamily: "var(--font-mono, monospace)",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "4px 9px",
                    borderRadius: 6,
                    color: "#D1FAE5"
                  }}
                >
                  <strong style={{ color: "#34D399" }}>{key}:</strong> {Array.isArray(val) ? val.join(", ") : String(val)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
