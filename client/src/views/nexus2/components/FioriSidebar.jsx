import React from "react";

export default function FioriSidebar({
  activeMenu,
  onSelectMenu,
  badgeCounts = {}
}) {
  const MENU_SECTIONS = [
    {
      title: "Compliance Management",
      icon: "🛡️",
      items: [
        { id: "source_registry", label: "Screening Source Registry", tcode: "INDIA/UN/OFAC", badge: "5 Feeds", badgeColor: "var(--blue, #2563EB)" },
        { id: "screening_sandbox", label: "Interactive SPL Match Simulator", tcode: "/SAPSLL/SPL_SIM", badge: "Live Test", badgeColor: "var(--orange, #6E1A2D)" },
        { id: "blocked_partners", label: "Manage Blocked Partners", tcode: "/SAPSLL/SPL_CHCK", badge: badgeCounts.blockedPartners },
        { id: "blocked_docs", label: "Manage Blocked Documents", tcode: "/SAPSLL/BL_DOCS", badge: badgeCounts.blockedDocs },
        { id: "custom_docs", label: "Display Custom Documents", tcode: "/SAPSLL/CUHD_DISP" },
        { id: "licenses", label: "Manage Licenses", tcode: "/SAPSLL/LIC_MGMT", badge: badgeCounts.licenses },
        { id: "screening_results", label: "Screening Results Log", tcode: "/SAPSLL/SPL_LOG" },
        { id: "audit_trail", label: "Compliance Audit Trail", tcode: "/SAPSLL/CHG_LOG" }
      ]
    },
    {
      title: "Customs Management",
      icon: "🚢",
      items: [
        { id: "export_declarations", label: "Manage Export Declarations", tcode: "/SAPSLL/CUPC_EXP", badge: badgeCounts.exportDecs },
        { id: "transit_declarations", label: "Manage Transit Declarations", tcode: "/SAPSLL/CUPC_TRN" },
        { id: "exit_overdue", label: "Display Exit Confirmation Overdue", tcode: "/SAPSLL/EXP_EXIT", badge: badgeCounts.exitOverdue, badgeColor: "var(--red, #EF4444)" },
        { id: "transit_overdue", label: "Display Transit Confirmation Overdue", tcode: "/SAPSLL/TRN_OVERDUE" },
        { id: "classify_products", label: "Classify Products (Tariff & HS)", tcode: "/SAPSLL/CL_PRD" }
      ]
    },
    {
      title: "Integration Monitoring",
      icon: "🔄",
      items: [
        { id: "replication_monitor", label: "Replication Monitor (CIF)", tcode: "/SAPSLL/PLUGIN_MON" },
        { id: "queue_monitor", label: "Queue Monitor (SMQ1 / SMQ2)", tcode: "SMQ2", badge: badgeCounts.queueErrors, badgeColor: "var(--amber, #D97706)" },
        { id: "app_log", label: "Application Log (SLG1)", tcode: "SLG1" },
        { id: "doc_flow_all", label: "End-to-End Document Flow", tcode: "/SAPSLL/DOC_FLOW" },
        { id: "interface_errors", label: "Interface Error Resolution", tcode: "/SAPSLL/ERR_RES" }
      ]
    },
    {
      title: "Learning Center",
      icon: "📚",
      items: [
        { id: "process_explanation", label: "Process Flow & System Ownership" },
        { id: "config_reference", label: "Configuration Reference (SPRO)" },
        { id: "interview_prep", label: "GTS Interview Preparation" },
        { id: "sap_help", label: "Official SAP Help & Regulations" }
      ]
    }
  ];

  return (
    <aside
      style={{
        width: 280,
        height: "100%",
        background: "var(--bg-surface, #EDE8E0)",
        borderRight: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        userSelect: "none",
        overflowY: "auto"
      }}
    >
      <div style={{ padding: "16px 14px" }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12
          }}
        >
          SAP GTS WORK CENTERS
        </div>

        {MENU_SECTIONS.map((sec, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
                paddingLeft: 6
              }}
            >
              <span>{sec.icon}</span>
              <span>{sec.title}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sec.items.map((item) => {
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMenu(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: isActive ? "var(--bg-card, #FAF8F5)" : "transparent",
                      color: isActive ? "var(--orange, #6E1A2D)" : "var(--text-primary)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 12.5,
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.1s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.label}
                      </span>
                      {item.tcode && (
                        <span style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {item.tcode}
                        </span>
                      )}
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          background: item.badgeColor || "var(--orange, #6E1A2D)",
                          color: "#FFFFFF",
                          padding: "1px 6px",
                          borderRadius: 10,
                          marginLeft: 6
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
