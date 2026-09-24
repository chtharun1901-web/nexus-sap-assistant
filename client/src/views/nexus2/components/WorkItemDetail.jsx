import React, { useState } from "react";

export default function WorkItemDetail({
  item,
  type = "document", // "document" or "partner"
  onBack,
  onOpenActionDialog
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!item) return null;

  const isDoc = type === "document";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--bg-main)" }}>
      {/* Officer Header Card */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)", padding: "16px 24px" }}>
        {/* Back and Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              ← Back to Worklist
            </button>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              {isDoc ? `SAP GTS /SAPSLL/BL_DOCS > ${item.docNumber}` : `SAP GTS /SAPSLL/SPL_CHCK > BP ${item.partnerNumber}`}
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {item.status !== "RELEASED" && (
              <button
                type="button"
                onClick={() => onOpenActionDialog("RELEASE", item, type)}
                style={{
                  background: "var(--green, #10B981)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(16,185,129,0.3)"
                }}
              >
                <span>✓</span>
                <span>Release {isDoc ? "Document" : "Partner"}</span>
              </button>
            )}

            {item.status !== "CONFIRMED_BLOCK" && (
              <button
                type="button"
                onClick={() => onOpenActionDialog("CONFIRM_BLOCK", item, type)}
                style={{
                  background: "var(--red, #EF4444)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>✕</span>
                <span>Confirm Block</span>
              </button>
            )}

            {isDoc && item.complianceCards?.legalControl?.status === "BLOCKED" && (
              <button
                type="button"
                onClick={() => onOpenActionDialog("ASSIGN_LICENSE", item, type)}
                style={{
                  background: "var(--orange, #6E1A2D)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Assign Export License
              </button>
            )}
          </div>
        </div>

        {/* Title & Core KPIs */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {isDoc ? item.docNumber : item.partnerNumber}
              </h2>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  background: item.status === "RELEASED" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  color: item.status === "RELEASED" ? "#059669" : "#DC2626",
                  border: item.status === "RELEASED" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)"
                }}
              >
                {item.status}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {isDoc ? item.docType : item.role}
              </span>
            </div>

            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
              {isDoc ? item.customerName : item.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {isDoc ? `Destination: ${item.country} | Feeder: ${item.feederSystem}` : `Address: ${item.street}, ${item.city}, ${item.country}`}
            </div>
          </div>

          {/* Facets Box */}
          <div style={{ display: "flex", gap: 20 }}>
            {isDoc ? (
              <>
                <div style={{ borderLeft: "2px solid var(--border-subtle)", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>Net Value</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {item.netValue} {item.currency}
                  </div>
                </div>
                <div style={{ borderLeft: "2px solid var(--border-subtle)", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>Priority</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.priority === "HIGH" ? "#DC2626" : "var(--text-primary)" }}>
                    {item.priority}
                  </div>
                </div>
                <div style={{ borderLeft: "2px solid var(--border-subtle)", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>Assigned Officer</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.owner}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ borderLeft: "2px solid var(--border-subtle)", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>Match Score</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.matchScore > 85 ? "#DC2626" : "#D97706", fontFamily: "var(--font-mono)" }}>
                    {item.matchScore}%
                  </div>
                </div>
                <div style={{ borderLeft: "2px solid var(--border-subtle)", paddingLeft: 12 }}>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>Recommended</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.recommendedAction === "RELEASE" ? "#059669" : "#DC2626" }}>
                    {item.recommendedAction}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Tabs Header */}
        <div style={{ display: "flex", gap: 4, marginTop: 18, borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
          {[
            { id: "overview", label: "Overview & Master Data" },
            { id: "compliance", label: "Compliance Results & Evidence" },
            ...(isDoc ? [{ id: "flow", label: "End-to-End Document Flow" }] : []),
            { id: "audit", label: `Audit Trail (${item.auditTrail?.length || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "var(--bg-surface)" : "transparent",
                color: activeTab === tab.id ? "var(--orange, #6E1A2D)" : "var(--text-muted)",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--orange, #6E1A2D)" : "2px solid transparent",
                padding: "6px 14px",
                fontSize: 12.5,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                borderRadius: "4px 4px 0 0"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
            {/* Scenario Banner */}
            <div style={{ background: "rgba(110,26,45,0.06)", border: "1px solid rgba(110,26,45,0.2)", borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--orange, #6E1A2D)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                TRAINING SCENARIO CONTEXT
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                {item.scenario}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-body)", marginTop: 4, lineHeight: 1.5 }}>
                {item.scenarioDesc}
              </div>
            </div>

            {/* Downstream Impact Alert (for docs) */}
            {isDoc && item.downstreamImpact && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, textTransform: "uppercase" }}>
                  Connected Systems Status (S/4HANA & EWM)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "var(--bg-surface)", padding: 12, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      SAP S/4HANA Feeder
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-primary)", marginTop: 4, fontWeight: 600 }}>
                      {item.downstreamImpact.s4Status}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", padding: 12, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      SAP EWM Logistics
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-primary)", marginTop: 4, fontWeight: 600 }}>
                      {item.downstreamImpact.ewmStatus}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Master Data Grid */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, textTransform: "uppercase" }}>
                {isDoc ? "Sales Document & Material Master Data" : "Business Partner Master (BUT000 / ADRC)"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, fontSize: 12.5 }}>
                {isDoc ? (
                  <>
                    <div><span style={{ color: "var(--text-muted)" }}>Sales Organization:</span> <strong style={{ display: "block" }}>{item.salesOrg}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Material:</span> <strong style={{ display: "block" }}>{item.material}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>ECCN Classification:</span> <strong style={{ display: "block", fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>{item.eccn}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Incoterms:</span> <strong style={{ display: "block" }}>{item.incoterms}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Currency:</span> <strong style={{ display: "block" }}>{item.currency}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Last Changed:</span> <strong style={{ display: "block" }}>{item.lastChanged}</strong></div>
                  </>
                ) : (
                  <>
                    <div><span style={{ color: "var(--text-muted)" }}>Partner Role:</span> <strong style={{ display: "block" }}>{item.role}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Postal Code / City:</span> <strong style={{ display: "block" }}>{item.postalCode} {item.city}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Country Key:</span> <strong style={{ display: "block" }}>{item.country}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Screening List:</span> <strong style={{ display: "block" }}>{item.screeningList}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Validity Window:</span> <strong style={{ display: "block", fontFamily: "var(--font-mono)" }}>{item.validityStart} to {item.validityEnd}</strong></div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Compliance Results */}
        {activeTab === "compliance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
            {/* If Document, show 4 check cards */}
            {isDoc && item.complianceCards && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(item.complianceCards).map(([key, card]) => {
                  const isBlocked = card.status === "BLOCKED";
                  const isPassed = card.status === "PASSED";
                  return (
                    <div
                      key={key}
                      style={{
                        background: "var(--bg-card)",
                        border: `1px solid ${isBlocked ? "rgba(239,68,68,0.4)" : "var(--border-subtle)"}`,
                        borderRadius: 8,
                        padding: 16
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{isBlocked ? "🚫" : isPassed ? "✅" : "⏳"}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>
                            {key === "spl" && "Sanctioned Party List (SPL) Screening"}
                            {key === "legalControl" && "Legal Control & Export Authorization"}
                            {key === "embargo" && "Country & Route Embargo Screening"}
                            {key === "completeness" && "Customs Document Completeness Check"}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            background: isBlocked ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                            color: isBlocked ? "#DC2626" : "#059669"
                          }}
                        >
                          {card.status}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginTop: 8 }}>
                        <div><span style={{ color: "var(--text-muted)" }}>Evaluated Rule:</span> <div>{card.rule}</div></div>
                        <div><span style={{ color: "var(--text-muted)" }}>Input Data:</span> <div style={{ fontFamily: "var(--font-mono)" }}>{card.input}</div></div>
                        <div><span style={{ color: "var(--text-muted)" }}>Result Evaluation:</span> <strong>{card.result}</strong></div>
                        <div><span style={{ color: "var(--text-muted)" }}>Finding / Reason:</span> <div style={{ color: isBlocked ? "#DC2626" : "var(--text-body)" }}>{card.reason}</div></div>
                      </div>

                      {card.nextAction && card.nextAction !== "None" && (
                        <div style={{ marginTop: 10, padding: "6px 10px", background: "var(--bg-surface)", borderRadius: 4, fontSize: 11.5 }}>
                          <strong style={{ color: "var(--orange, #6E1A2D)" }}>Recommended Next Action:</strong> {card.nextAction}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* If Partner, show comparison evidence table */}
            {!isDoc && item.evidence && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, textTransform: "uppercase" }}>
                  Side-by-Side Match Analysis (Feeder Customer vs. Official Sanctions Entity)
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", textAlign: "left", fontFamily: "var(--font-mono)" }}>
                      <th style={{ padding: 8 }}>FIELD / DIMENSION</th>
                      <th style={{ padding: 8 }}>CUSTOMER RECORD (ADRC)</th>
                      <th style={{ padding: 8 }}>SANCTIONED RECORD (/SAPSLL/SPLST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.evidence.map((ev, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{ev.field}</td>
                        <td style={{ padding: "8px 10px", color: "var(--text-primary)" }}>{ev.customerValue}</td>
                        <td style={{ padding: "8px 10px", color: "#DC2626", fontWeight: 600 }}>{ev.sanctionsValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Document Flow */}
        {activeTab === "flow" && isDoc && item.documentFlow && (
          <div style={{ maxWidth: 800, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase" }}>
              End-to-End System Process Flow (S/4HANA ➔ GTS ➔ EWM)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {item.documentFlow.map((step, sIdx) => {
                const isStepCompleted = step.status === "COMPLETED";
                const isStepBlocked = step.status === "BLOCKED";
                return (
                  <div key={sIdx} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isStepCompleted ? "var(--green, #10B981)" : isStepBlocked ? "var(--red, #EF4444)" : "var(--bg-surface)",
                          color: isStepCompleted || isStepBlocked ? "#FFFFFF" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        {isStepCompleted ? "✓" : isStepBlocked ? "✕" : sIdx + 1}
                      </div>
                      {sIdx < item.documentFlow.length - 1 && (
                        <div style={{ width: 2, height: 28, background: "var(--border-subtle)", marginTop: 4 }} />
                      )}
                    </div>

                    <div style={{ flex: 1, paddingBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{step.step}</span>
                        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "1px 6px", borderRadius: 4, background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                          {step.system}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 2 }}>{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Audit Trail */}
        {activeTab === "audit" && item.auditTrail && (
          <div style={{ maxWidth: 850, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, textTransform: "uppercase" }}>
              Official Compliance Audit Log (/SAPSLL/CHG_LOG)
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", textAlign: "left", fontFamily: "var(--font-mono)" }}>
                  <th style={{ padding: 8 }}>TIMESTAMP</th>
                  <th style={{ padding: 8 }}>USER / SYSTEM</th>
                  <th style={{ padding: 8 }}>ACTION</th>
                  <th style={{ padding: 8 }}>PREV STATUS</th>
                  <th style={{ padding: 8 }}>NEW STATUS</th>
                  <th style={{ padding: 8 }}>AUDIT COMMENT</th>
                </tr>
              </thead>
              <tbody>
                {item.auditTrail.map((log, lIdx) => (
                  <tr key={lIdx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}>{log.timestamp}</td>
                    <td style={{ padding: 8, fontWeight: 600 }}>{log.user}</td>
                    <td style={{ padding: 8, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)", fontWeight: 700 }}>{log.action}</td>
                    <td style={{ padding: 8 }}>{log.oldStatus}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{log.newStatus}</td>
                    <td style={{ padding: 8, color: "var(--text-body)" }}>{log.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
