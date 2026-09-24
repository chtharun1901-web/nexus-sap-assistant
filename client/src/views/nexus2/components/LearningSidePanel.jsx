import React from "react";

export default function LearningSidePanel({
  activeMenu,
  selectedItem,
  itemType,
  activeRole
}) {
  const isDoc = itemType === "document";

  return (
    <aside
      style={{
        width: 360,
        height: "100%",
        background: "var(--bg-card, #FAF8F5)",
        borderLeft: "1px solid var(--border-subtle, rgba(0,0,0,0.1))",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
        padding: "18px 20px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--orange, #6E1A2D)" }}>
          SAP Consultant Learning View
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 12.5, lineHeight: 1.5 }}>
        {/* 1. What this function does */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            1. What This Function Does
          </div>
          <div style={{ color: "var(--text-primary)", marginTop: 4, fontWeight: 500 }}>
            {selectedItem ? (
              isDoc ? (
                <>Document <strong>{selectedItem.docNumber}</strong> is evaluated against trade compliance rules. In SAP GTS, this corresponds to transaction <code>/SAPSLL/BL_DOCS</code>, where blocked customs documents are investigated.</>
              ) : (
                <>Partner <strong>{selectedItem.partnerNumber}</strong> was screened against denied party lists. This corresponds to transaction <code>/SAPSLL/SPL_CHCK</code> for manual partner clearance.</>
              )
            ) : (
              <>This worklist aggregates all active transactional blocks across the enterprise. Compliance officers use this cockpit to prevent illegal exports while avoiding supply chain bottlenecks.</>
            )}
          </div>
        </div>

        {/* 2. Why the officer performs this */}
        <div style={{ background: "var(--bg-surface)", padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            2. Why The Officer Performs This Action
          </div>
          <div style={{ color: "var(--text-body)", marginTop: 4 }}>
            Under international trade compliance regulations (such as US BIS EAR and OFAC 31 CFR), companies face criminal liability if goods ship to prohibited entities. Automated screening flags potential matches, but <strong>human legal review is legally required</strong> to document due diligence before any document can be cleared.
          </div>
        </div>

        {/* 3. System Ownership Matrix */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            3. System Ownership (Who Controls What?)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, fontSize: 12 }}>
            <div style={{ borderLeft: "3px solid #2563EB", paddingLeft: 8 }}>
              <strong>SAP S/4HANA (Feeder):</strong> Owns the commercial transaction (Sales Order, Delivery, PO). Sets delivery/billing block flag (<code>VBAK-LIFSK</code>).
            </div>
            <div style={{ borderLeft: "3px solid #6E1A2D", paddingLeft: 8 }}>
              <strong>SAP GTS (Compliance Engine):</strong> Owns the legal decision. Determines whether the transaction is allowed, blocked, or requires an export license.
            </div>
            <div style={{ borderLeft: "3px solid #10B981", paddingLeft: 8 }}>
              <strong>SAP EWM (Warehouse):</strong> Reads the feeder status. Completely halts warehouse wave generation and picking tasks while the GTS block is active.
            </div>
          </div>
        </div>

        {/* 4. Configuration Reference (SPRO) */}
        <div style={{ background: "rgba(110,26,45,0.04)", border: "1px solid rgba(110,26,45,0.15)", padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--orange, #6E1A2D)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            4. Configuration Reference (SPRO)
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-body)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
            SPRO &gt; SAP Global Trade Services &gt; Compliance Management &gt; 'Sanctioned Party List Screening' &gt; Define Control Settings for 'SPL Screening'
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            Here you configure algorithm parameters: Search algorithm (Comparison Index), Percentage threshold (e.g. 75%), and exclusion words (e.g., Ltd, Inc, Corp).
          </div>
        </div>

        {/* 5. Interview Explanation */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            5. How to Answer in an SAP Interview 🎯
          </div>
          <div style={{ fontStyle: "italic", color: "var(--text-body)", background: "var(--bg-surface)", padding: 10, borderRadius: 6, marginTop: 4, fontSize: 12 }}>
            "When a sales order is created in S/4HANA, CIF replication dispatches an RFC queue to GTS. GTS executes SPL screening and legal control. If a block occurs, GTS returns a status update to S/4HANA via RFC, locking delivery creation. Downstream EWM cannot generate picking tasks until a compliance officer releases the document in GTS with a mandatory reason code and audit trail."
          </div>
        </div>

        {/* 6. Official Regulatory Citations */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            6. Official Regulatory Citations
          </div>
          <ul style={{ paddingLeft: 16, margin: "4px 0", color: "var(--text-muted)", fontSize: 11.5 }}>
            <li>15 CFR Part 736 — General Prohibitions (US EAR)</li>
            <li>31 CFR Part 500 — Office of Foreign Assets Control (OFAC)</li>
            <li>EU Regulation 2021/821 — Dual-Use Export Control Regime</li>
            <li>SAP Note 2918844 — GTS S/4HANA Replication Best Practices</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
