import React from "react";

export default function LandscapeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "var(--bg-card, #FFFFFF)",
          borderRadius: 10,
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
          color: "var(--text-primary)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)", textTransform: "uppercase" }}>
              ENTERPRISE SYSTEM ARCHITECTURE
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              S/4HANA ⇄ SAP GTS ⇄ SAP EWM Integration Flow
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

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.5, marginBottom: 20 }}>
            In an enterprise SAP landscape, <strong>SAP GTS does not create commercial sales orders or warehouse picking tasks</strong>. Instead, GTS operates as a centralized compliance gatekeeper:
          </p>

          {/* Visual Architecture Flow */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {/* Step 1 */}
            <div style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.3)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }}>
                1. FEEDER SYSTEM CREATION
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                SAP S/4HANA (Client 100)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 2 }}>
                Sales Rep creates Sales Order (VA01) or Inbound Delivery (VL31N). Business Partner is verified in BUT000/ADRC.
              </div>
            </div>

            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>↓ qRFC Replication Layer (CIF / Plug-in)</div>

            {/* Step 2 */}
            <div style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(110,26,45,0.08)", border: "2px solid var(--orange, #6E1A2D)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                2. LEGAL COMPLIANCE ADJUDICATION
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                SAP GTS 2023 (Compliance Engine)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 2 }}>
                Executes Sanctioned Party List screening, Legal Control (EAR/ITAR), and Embargo checks. Sets status to <strong>BLOCKED</strong> or <strong>RELEASED</strong>.
              </div>
            </div>

            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>↓ Synced Status Return (RFC Callback)</div>

            {/* Step 3 */}
            <div style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.3)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }}>
                3. FEEDER LOCK OR RELEASE
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                SAP S/4HANA Status Synchronization
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 2 }}>
                If BLOCKED, sets delivery block <code>VBAK-LIFSK = '01'</code>. If RELEASED, clears block and authorizes downstream logistics.
              </div>
            </div>

            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>↓ Downstream Warehouse Trigger</div>

            {/* Step 4 */}
            <div style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#065F46" }}>
                4. PHYSICAL LOGISTICS EXECUTION
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                SAP EWM (Warehouse Management)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 2 }}>
                Generates Outbound Delivery Order (ODO), assigns wave picking, executes physical picking, packing, and Goods Issue (PGI).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              background: "var(--orange, #6E1A2D)",
              color: "#FFFFFF",
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Close Architecture Map
          </button>
        </div>
      </div>
    </div>
  );
}
