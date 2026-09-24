import React, { useState } from "react";
import { REASON_CODES } from "../data/initialData.js";

export default function OfficerActionDialog({
  isOpen,
  actionType = "RELEASE", // "RELEASE", "CONFIRM_BLOCK", "ASSIGN_LICENSE"
  item,
  itemType = "document", // "document" or "partner"
  licenses = [],
  onClose,
  onConfirm
}) {
  const [selectedReason, setSelectedReason] = useState(REASON_CODES[0].code);
  const [comment, setComment] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [selectedLicense, setSelectedLicense] = useState(licenses[0]?.id || "");
  const [fourEyesVerified, setFourEyesVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !item) return null;

  const isDoc = itemType === "document";
  const title = actionType === "RELEASE" 
    ? `Compliance Release Decision: ${isDoc ? item.docNumber : item.partnerNumber}`
    : actionType === "CONFIRM_BLOCK"
    ? `Confirm Trade Compliance Block: ${isDoc ? item.docNumber : item.partnerNumber}`
    : `Assign Validated Export License to ${item.docNumber}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actionType !== "ASSIGN_LICENSE" && !comment.trim()) {
      setErrorMsg("A detailed audit comment is mandatory for legal audit compliance.");
      return;
    }

    if (actionType === "RELEASE" && item.matchScore && item.matchScore > 80 && !fourEyesVerified) {
      setErrorMsg("Dual-Control (4-Eyes Principle) verification is mandatory for match scores exceeding 80%.");
      return;
    }

    setErrorMsg("");
    onConfirm({
      actionType,
      reasonCode: selectedReason,
      comment: comment.trim(),
      refNumber: refNumber.trim(),
      licenseId: selectedLicense,
      fourEyes: fourEyesVerified
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          background: "var(--bg-card, #FFFFFF)",
          borderRadius: 10,
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
          color: "var(--text-primary)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)", textTransform: "uppercase" }}>
              OFFICIAL COMPLIANCE ADJUDICATION
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "18px 20px" }}>
          {/* Target Summary Box */}
          <div style={{ background: "var(--bg-surface)", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Target Subject:</span>
              <strong>{isDoc ? `${item.customerName} (${item.country})` : `${item.name} (${item.country})`}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ color: "var(--text-muted)" }}>Active Block Trigger:</span>
              <span style={{ color: "#DC2626", fontWeight: 600 }}>{item.blockReason}</span>
            </div>
          </div>

          {/* Action 1: Assign License */}
          {actionType === "ASSIGN_LICENSE" ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Select Active Export License:
              </label>
              <select
                value={selectedLicense}
                onChange={(e) => setSelectedLicense(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none"
                }}
              >
                {licenses.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.licenseNumber} — {l.type} (Rem: {l.remainingValue} {l.currency})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              {/* Action 2: Reason Code Dropdown */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Resolution Reason Code (Mandatory):
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: 12.5,
                    outline: "none"
                  }}
                >
                  {REASON_CODES.map(rc => (
                    <option key={rc.code} value={rc.code}>
                      {rc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Justification Comment */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Compliance Officer Audit Commentary:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the documentary evidence used (e.g. verified company registration number, checked passport, confirmed NLR exception)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: 12.5,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "var(--font-sans)"
                  }}
                />
              </div>

              {/* Attachment / Reference ID */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  External Evidence Reference / Dossier ID (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. DOC-VERIF-2026-992 or BIS-STA-CONSENT"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    outline: "none"
                  }}
                />
              </div>

              {/* 4-Eyes Principle Checkbox */}
              {actionType === "RELEASE" && (
                <div style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: 6, padding: "10px 12px", marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={fourEyesVerified}
                      onChange={(e) => setFourEyesVerified(e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>Dual-Control (4-Eyes Principle) Verification</strong>
                      <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
                        I certify that this release has been peer-reviewed or meets automated thresholds under Compliance Operating Procedure SOP-GTS-04.
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </>
          )}

          {errorMsg && (
            <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid var(--border-strong)",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12.5,
                cursor: "pointer",
                color: "var(--text-muted)"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: actionType === "RELEASE" ? "var(--green, #10B981)" : actionType === "CONFIRM_BLOCK" ? "var(--red, #EF4444)" : "var(--orange, #6E1A2D)",
                color: "#FFFFFF",
                border: "none",
                padding: "7px 18px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
              }}
            >
              Confirm & Propagate to Systems →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
