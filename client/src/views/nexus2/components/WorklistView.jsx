import React, { useState, useMemo } from "react";

export default function WorklistView({
  activeMenu,
  partners = [],
  documents = [],
  licenses = [],
  declarations = [],
  queues = [],
  onSelectRecord,
  onOpenActionDialog,
  selectedId
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");

  // Determine which dataset to display based on activeMenu
  const isDocWorklist = activeMenu === "blocked_docs" || activeMenu === "custom_docs" || activeMenu === "doc_flow_all";
  const isPartnerWorklist = activeMenu === "blocked_partners" || activeMenu === "screening_results";
  const isLicenseWorklist = activeMenu === "licenses";
  const isCustomsWorklist = activeMenu === "export_declarations" || activeMenu === "transit_declarations" || activeMenu === "exit_overdue";
  const isQueueWorklist = activeMenu === "queue_monitor" || activeMenu === "replication_monitor";

  // Filter logic for documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const matchSearch = searchTerm === "" || 
        d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.blockReason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || d.priority === priorityFilter;
      const matchCountry = countryFilter === "ALL" || d.country === countryFilter;
      return matchSearch && matchStatus && matchPriority && matchCountry;
    });
  }, [documents, searchTerm, statusFilter, priorityFilter, countryFilter]);

  // Filter logic for partners
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchSearch = searchTerm === "" ||
        p.partnerNumber.includes(searchTerm) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.blockReason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchCountry = countryFilter === "ALL" || p.country === countryFilter;
      return matchSearch && matchStatus && matchCountry;
    });
  }, [partners, searchTerm, statusFilter, countryFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "BLOCKED":
        return { bg: "rgba(239,68,68,0.12)", color: "#DC2626", border: "rgba(239,68,68,0.3)", label: "BLOCKED" };
      case "UNDER_REVIEW":
        return { bg: "rgba(217,119,6,0.12)", color: "#D97706", border: "rgba(217,119,6,0.3)", label: "IN REVIEW" };
      case "RELEASED":
        return { bg: "rgba(16,185,129,0.12)", color: "#059669", border: "rgba(16,185,129,0.3)", label: "RELEASED" };
      case "CONFIRMED_BLOCK":
        return { bg: "rgba(17,24,39,0.12)", color: "#1F2937", border: "rgba(17,24,39,0.3)", label: "CONFIRMED BLOCK" };
      case "EXIT_OVERDUE":
        return { bg: "rgba(239,68,68,0.15)", color: "#991B1B", border: "#FCA5A5", label: "OVERDUE (8d)" };
      case "CLEARED":
        return { bg: "rgba(16,185,129,0.12)", color: "#059669", border: "rgba(16,185,129,0.3)", label: "CLEARED" };
      default:
        return { bg: "var(--bg-surface)", color: "var(--text-muted)", border: "var(--border-subtle)", label: status };
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Worklist Title & Description */}
      <div style={{ padding: "16px 20px 10px 20px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {isDocWorklist && "Manage Blocked Documents (/SAPSLL/BL_DOCS)"}
              {isPartnerWorklist && "Manage Blocked Partners (/SAPSLL/SPL_CHCK)"}
              {isLicenseWorklist && "Manage Export / Import Licenses (/SAPSLL/LIC_MGMT)"}
              {isCustomsWorklist && "Customs Declarations & Overdue Monitor (/SAPSLL/CUPC)"}
              {isQueueWorklist && "qRFC Inbound/Outbound Monitor (SMQ1 / SMQ2)"}
            </h1>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {isDocWorklist && "Transactional sales and delivery documents halted by compliance, SPL screening, or license quota checks."}
              {isPartnerWorklist && "Business partners screened against sanctions lists (OFAC, EU, UN) requiring compliance adjudication."}
              {isLicenseWorklist && "Government authorizations and value depreciation tracking across business documents."}
              {isCustomsWorklist && "Electronic customs filing confirmations and movement reference number (MRN) exit monitoring."}
              {isQueueWorklist && "Integration layer queue health between S/4HANA Feeder and SAP GTS compliance engine."}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              {isDocWorklist && `${filteredDocuments.length} items`}
              {isPartnerWorklist && `${filteredPartners.length} partners`}
            </span>
          </div>
        </div>

        {/* Smart Filter Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by ID, Name, Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--border-strong)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              minWidth: 240,
              outline: "none"
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--border-strong)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              cursor: "pointer"
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="BLOCKED">Blocked</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RELEASED">Released</option>
            <option value="CONFIRMED_BLOCK">Confirmed Block</option>
          </select>

          {isDocWorklist && (
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          )}

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--border-strong)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              cursor: "pointer"
            }}
          >
            <option value="ALL">All Countries</option>
            <option value="GB">United Kingdom (GB)</option>
            <option value="US">United States (US)</option>
            <option value="DE">Germany (DE)</option>
            <option value="AE">United Arab Emirates (AE)</option>
          </select>
        </div>
      </div>

      {/* Main Table Area */}
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-main)" }}>
        {/* Table: Blocked Documents */}
        {isDocWorklist && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <th style={{ padding: "10px 14px", width: 120 }}>STATUS</th>
                <th style={{ padding: "10px 14px", width: 110 }}>DOCUMENT</th>
                <th style={{ padding: "10px 14px", width: 130 }}>DOC TYPE</th>
                <th style={{ padding: "10px 14px" }}>PARTNER / CUSTOMER</th>
                <th style={{ padding: "10px 14px", width: 60 }}>DEST</th>
                <th style={{ padding: "10px 14px" }}>BLOCK REASON</th>
                <th style={{ padding: "10px 14px", width: 80 }}>PRIORITY</th>
                <th style={{ padding: "10px 14px", width: 110 }}>OWNER</th>
                <th style={{ padding: "10px 14px", width: 100 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => {
                const badge = getStatusBadge(doc.status);
                const isSelected = selectedId === doc.id;
                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectRecord(doc, "document")}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected ? "var(--burgundy-light, rgba(110,26,45,0.06))" : "var(--bg-card)",
                      cursor: "pointer",
                      transition: "background 0.1s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--bg-card-hover, rgba(0,0,0,0.02))";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--bg-card)";
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                      {doc.docNumber}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-body)" }}>{doc.docType}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{doc.customerName}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{doc.country}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-body)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.blockReason}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        color: doc.priority === "HIGH" ? "#DC2626" : "var(--text-muted)",
                        fontWeight: doc.priority === "HIGH" ? 700 : 500,
                        fontSize: 11
                      }}>
                        {doc.priority}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 11 }}>{doc.owner}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(doc, "document");
                        }}
                        style={{
                          padding: "3px 8px",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--text-primary)"
                        }}
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table: Blocked Partners */}
        {isPartnerWorklist && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <th style={{ padding: "10px 14px", width: 120 }}>STATUS</th>
                <th style={{ padding: "10px 14px", width: 100 }}>BP NUMBER</th>
                <th style={{ padding: "10px 14px" }}>BUSINESS PARTNER NAME</th>
                <th style={{ padding: "10px 14px", width: 60 }}>COUNTRY</th>
                <th style={{ padding: "10px 14px", width: 100 }}>MATCH SCORE</th>
                <th style={{ padding: "10px 14px" }}>SCREENING LIST</th>
                <th style={{ padding: "10px 14px", width: 100 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => {
                const badge = getStatusBadge(partner.status);
                const isSelected = selectedId === partner.id;
                return (
                  <tr
                    key={partner.id}
                    onClick={() => onSelectRecord(partner, "partner")}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected ? "var(--burgundy-light, rgba(110,26,45,0.06))" : "var(--bg-card)",
                      cursor: "pointer"
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                      {partner.partnerNumber}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{partner.name}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{partner.country}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 44, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                          <div style={{
                            width: `${partner.matchScore}%`,
                            height: "100%",
                            background: partner.matchScore > 85 ? "#DC2626" : "#D97706"
                          }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>
                          {partner.matchScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-body)", fontSize: 11.5 }}>
                      {partner.screeningList}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(partner, "partner");
                        }}
                        style={{
                          padding: "3px 8px",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--text-primary)"
                        }}
                      >
                        Inspect Match →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table: Licenses */}
        {isLicenseWorklist && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <th style={{ padding: "10px 14px" }}>STATUS</th>
                <th style={{ padding: "10px 14px" }}>LICENSE NUMBER</th>
                <th style={{ padding: "10px 14px" }}>TYPE & REGULATION</th>
                <th style={{ padding: "10px 14px" }}>VALIDITY</th>
                <th style={{ padding: "10px 14px" }}>TOTAL QUOTA</th>
                <th style={{ padding: "10px 14px" }}>REMAINING QUOTA</th>
                <th style={{ padding: "10px 14px" }}>ASSIGNED DOCS</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((lic) => (
                <tr key={lic.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: lic.status === "ACTIVE" ? "rgba(16,185,129,0.12)" : "rgba(217,119,6,0.12)",
                      color: lic.status === "ACTIVE" ? "#059669" : "#D97706"
                    }}>
                      {lic.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                    {lic.licenseNumber}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{lic.type}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{lic.legalRegulation}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                    {lic.validFrom} to {lic.validTo}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>
                    {lic.allocatedValue} {lic.currency}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--green, #10B981)" }}>
                    {lic.remainingValue} {lic.currency}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>
                    {lic.assignedDocuments.length} documents
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Table: Customs Declarations */}
        {isCustomsWorklist && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <th style={{ padding: "10px 14px" }}>STATUS</th>
                <th style={{ padding: "10px 14px" }}>DECLARATION NO</th>
                <th style={{ padding: "10px 14px" }}>CUSTOMS OFFICE</th>
                <th style={{ padding: "10px 14px" }}>EXPORTER / CONSIGNEE</th>
                <th style={{ padding: "10px 14px" }}>MOVEMENT REF (MRN)</th>
                <th style={{ padding: "10px 14px" }}>CUSTOMS VALUE</th>
              </tr>
            </thead>
            <tbody>
              {declarations.map((dec) => {
                const badge = getStatusBadge(dec.status);
                return (
                  <tr key={dec.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                      {dec.declarationNumber}
                    </td>
                    <td style={{ padding: "12px 14px" }}>{dec.customsOffice}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600 }}>{dec.exporter}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>→ {dec.consignee}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{dec.mrn}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{dec.customsValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table: Integration Queues */}
        {isQueueWorklist && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <th style={{ padding: "10px 14px" }}>QUEUE NAME</th>
                <th style={{ padding: "10px 14px" }}>DIRECTION</th>
                <th style={{ padding: "10px 14px" }}>STATUS</th>
                <th style={{ padding: "10px 14px" }}>REFERENCE</th>
                <th style={{ padding: "10px 14px" }}>LAST ERROR DETAIL</th>
                <th style={{ padding: "10px 14px" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                    {q.queueName}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{q.direction}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: q.status === "STOPPED" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                      color: q.status === "STOPPED" ? "#DC2626" : "#059669"
                    }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{q.docRef}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-body)", fontSize: 11.5 }}>{q.lastError}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "3px 8px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer"
                      }}
                    >
                      Restart Queue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
