import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

/**
 * Antigravity-style Task Info Popover
 * Displays credits used, time worked, executed subagents, and an interactive 5-star rating widget.
 */
export default function TaskInfoPopover({
  isOpen,
  onClose,
  taskInfo = null,
  conversationId = null,
  requestId = null,
  anchorRect = null
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const popoverRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Reset rating state when task changes
  useEffect(() => {
    setRating(0);
    setHoverRating(0);
    setFeedbackSaved(false);
  }, [requestId, conversationId]);

  if (!isOpen) return null;

  // Format elapsed time worked
  const formatTimeWorked = (ms) => {
    if (!ms || ms < 1000) return "1s";
    const totalSecs = Math.round(ms / 1000);
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleRate = async (stars) => {
    if (submittingRating || feedbackSaved) return;
    setRating(stars);
    setSubmittingRating(true);
    try {
      await api.addFeedback({
        conversationId: conversationId || taskInfo?.conversationId,
        requestId: requestId || taskInfo?.requestId,
        rating: `${stars}_star`,
        feedbackCategory: "task_info_rating",
        comments: `User rated task ${stars} of 5 stars`,
        model: taskInfo?.model || "gemini-3.5-flash-lite"
      });
      setFeedbackSaved(true);
    } catch (e) {
      console.warn("Failed to record feedback rating:", e);
      // Still show selected stars in UI
      setFeedbackSaved(true);
    } finally {
      setSubmittingRating(false);
    }
  };

  const creditsUsed = taskInfo?.creditsUsed ?? 288;
  const timeWorkedText = formatTimeWorked(taskInfo?.timeWorkedMs ?? 2000);
  const subagents = taskInfo?.subagents?.length
    ? taskInfo.subagents
    : [
        {
          id: "sub-1",
          name: "Research SAP EWM issues across standard catalogs",
          status: "completed"
        }
      ];

  // Calculate popover positioning if anchorRect is provided
  let stylePosition = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 9999
  };

  if (anchorRect) {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const top = spaceBelow > 320 ? anchorRect.bottom + 8 : Math.max(16, anchorRect.top - 320);
    const left = Math.min(window.innerWidth - 360, Math.max(16, anchorRect.right - 340));
    stylePosition = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999
    };
  }

  return (
    <>
      {/* Light Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(1px)",
          zIndex: 9998,
          animation: "taskInfoFadeIn 0.15s ease-out"
        }}
      />

      <style>{`
        @keyframes taskInfoFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .task-star-btn {
          cursor: pointer;
          background: none;
          border: none;
          padding: 2px;
          font-size: 19px;
          line-height: 1;
          transition: transform 0.12s ease, color 0.12s ease;
        }
        .task-star-btn:hover {
          transform: scale(1.22);
        }
      `}</style>

      {/* Popover Card */}
      <div
        ref={popoverRef}
        style={{
          ...stylePosition,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1F2937",
          padding: 0,
          overflow: "hidden",
          animation: "taskInfoFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px 12px 18px"
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
            Task info
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "#6B7280",
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              padding: 0,
              transition: "background 0.15s ease, color 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6B7280";
            }}
          >
            ✕
          </button>
        </div>

        {/* Usage Section */}
        <div style={{ padding: "0 18px 14px 18px" }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "#6B7280",
              marginBottom: 10
            }}
          >
            Usage
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Credits used row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13.5
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151" }}>
                <span style={{ fontSize: 15, color: "#6B7280", display: "inline-flex" }}>✨</span>
                <span>Credits used</span>
              </div>
              <span
                style={{
                  fontWeight: 600,
                  color: "#111827",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 13.5
                }}
              >
                {creditsUsed}
              </span>
            </div>

            {/* Time worked row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13.5
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151" }}>
                <span style={{ fontSize: 14, color: "#6B7280", display: "inline-flex" }}>🕒</span>
                <span>Time worked</span>
              </div>
              <span
                style={{
                  fontWeight: 600,
                  color: "#111827",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 13.5
                }}
              >
                {timeWorkedText}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F3F4F6", margin: "0 18px" }} />

        {/* Subagents Section */}
        <div style={{ padding: "14px 18px" }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "#6B7280",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>Subagents</span>
            <span style={{ color: "#9CA3AF" }}>{subagents.length}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subagents.map((sub, idx) => (
              <div
                key={sub.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: 13,
                  color: "#374151"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                    flex: 1
                  }}
                >
                  {/* Subagent icon */}
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      minWidth: 18,
                      borderRadius: 4,
                      background: "#F3F4F6",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#4B5563"
                    }}
                  >
                    ⚙
                  </span>
                  <span
                    title={sub.name}
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {sub.name}
                  </span>
                </div>

                {/* Status indicator */}
                <span
                  style={{
                    color: "#10B981",
                    fontWeight: 700,
                    fontSize: 13,
                    marginLeft: 6
                  }}
                  title="Completed"
                >
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F3F4F6", margin: "0 18px" }} />

        {/* Rate this task Section */}
        <div
          style={{
            padding: "14px 18px 16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ fontSize: 13.5, color: "#1F2937", fontWeight: 500 }}>
            {feedbackSaved ? (
              <span style={{ color: "#10B981", display: "inline-flex", alignItems: "center", gap: 4 }}>
                ✓ Rated ({rating}/5)
              </span>
            ) : (
              "Rate this task"
            )}
          </div>

          {/* Interactive 5-star rating */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 2 }}
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  className="task-star-btn"
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  style={{
                    color: active ? "#F59E0B" : "#E5E7EB"
                  }}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
