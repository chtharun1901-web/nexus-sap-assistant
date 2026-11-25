import React, { useState, useEffect, useCallback, useRef } from "react";

export function triggerToast(message, type = "success", duration = 2600) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("nexus-toast", {
      detail: { message, type, duration }
    })
  );
}

const TOAST_STYLES = {
  success: {
    icon: "✓",
    iconBg: "#ECFDF5",
    iconColor: "#15803D",
    iconBorder: "1px solid #BBF7D0",
    accentBar: "#16A34A"
  },
  info: {
    icon: "✦",
    iconBg: "rgba(212, 98, 43, 0.1)",
    iconColor: "#D4622B",
    iconBorder: "1px solid rgba(212, 98, 43, 0.25)",
    accentBar: "#D4622B"
  },
  warning: {
    icon: "!",
    iconBg: "#FFFBEB",
    iconColor: "#B45309",
    iconBorder: "1px solid #FDE68A",
    accentBar: "#D97706"
  },
  error: {
    icon: "✕",
    iconBg: "#FEF2F2",
    iconColor: "#B91C1C",
    iconBorder: "1px solid #FECACA",
    accentBar: "#DC2626"
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (e) => {
      const detail = e?.detail || {};
      const message = typeof detail === "string" ? detail : detail.message;
      if (!message) return;

      const type = TOAST_STYLES[detail.type] ? detail.type : "success";
      const duration = typeof detail.duration === "number" ? detail.duration : 2600;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    };

    window.addEventListener("nexus-toast", handleToast);
    return () => {
      window.removeEventListener("nexus-toast", handleToast);
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes nexusToastSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100001,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
          maxWidth: "calc(100vw - 32px)"
        }}
      >
        {toasts.map((toast) => {
          const palette = TOAST_STYLES[toast.type] || TOAST_STYLES.success;
          return (
            <div
              key={toast.id}
              role="status"
              onClick={() => dismissToast(toast.id)}
              title="Click to dismiss"
              style={{
                pointerEvents: "auto",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 260,
                maxWidth: 440,
                padding: "10px 14px",
                background: "#FFFFFF",
                color: "#1C1917",
                border: "1px solid #E5E5DF",
                borderRadius: 10,
                boxShadow:
                  "0 10px 28px -6px rgba(28, 25, 23, 0.12), 0 4px 10px -2px rgba(28, 25, 23, 0.06)",
                fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                animation: "nexusToastSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  background: palette.iconBg,
                  color: palette.iconColor,
                  border: palette.iconBorder
                }}
              >
                {palette.icon}
              </span>
              <span style={{ flex: 1, wordBreak: "break-word" }}>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
