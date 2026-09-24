import React from "react";
import sourceData from "../data/sourceRegisterData.json";

export default function ScreeningSourceRegistry() {
  const { sources, fiuUpdates, snapshotTimestamp } = sourceData;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", padding: "20px 24px", background: "var(--bg-main)" }}>
      {/* Safeguard Alert Header */}
      <div style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--amber, #D97706)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              COMPLIANCE SAFEGUARD & SNAPSHOT NOTICE
            </div>
            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, marginTop: 2 }}>
              Training simulation dataset snapshot as of {snapshotTimestamp}. Not a live real-time government feed.
            </div>
            <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 4 }}>
              This registry represents official Indian (FIU-India / DGFT) and international (UN / OFAC) sanctions source feeds. Production use requires current official API subscriptions and verified legal counsel review. SCOMET product controls are maintained as a separate export-control dimension.
            </div>
          </div>
        </div>
      </div>

      {/* 1. Official Source Register Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Official Sanctions & Export-Control Source Register
            </h2>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Active source feeds ingested into Nexus 2.0 GTS compliance screening engine.
            </div>
          </div>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {sources.length} Registered Authorities
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <th style={{ padding: "8px 10px" }}>ID</th>
              <th style={{ padding: "8px 10px" }}>JURISDICTION / AUTHORITY</th>
              <th style={{ padding: "8px 10px" }}>LIST / FEED</th>
              <th style={{ padding: "8px 10px" }}>USE IN GTS MODULE</th>
              <th style={{ padding: "8px 10px" }}>CADENCE / STATUS</th>
              <th style={{ padding: "8px 10px" }}>OFFICIAL SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, idx) => {
              const isScomet = s["Source ID"] === "IN-02";
              return (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)" }}>
                    {s["Source ID"]}
                  </td>
                  <td style={{ padding: "10px", fontWeight: 600 }}>
                    {s["Jurisdiction / Authority"]}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <div>{s["List / Feed"]}</div>
                    {isScomet && (
                      <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontFamily: "var(--font-mono)", background: "rgba(217,119,6,0.15)", color: "#92400E", padding: "1px 6px", borderRadius: 3 }}>
                        PRODUCT CONTROL ONLY (NOT DENIED PARTY)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px", color: "var(--text-body)", fontSize: 11.5 }}>
                    {s["Use in GTS module"]}
                  </td>
                  <td style={{ padding: "10px", fontSize: 11.5 }}>
                    <div>{s["Latest page notice observed"]}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 10.5 }}>{s["Status / caveat"]}</div>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <a
                      href={s["Official URL"]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--blue, #2563EB)", textDecoration: "underline", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span>Visit Authority</span>
                      <span>↗</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. FIU-India Sanctions Update History */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
          Financial Intelligence Unit (FIU-India) Update History
        </h3>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          Statutory notification tracking under Section 51A of Unlawful Activities (Prevention) Act, 1967.
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <th style={{ padding: "8px 10px" }}>NOTICE DATE</th>
              <th style={{ padding: "8px 10px" }}>REGULATORY ACTION</th>
              <th style={{ padding: "8px 10px" }}>SANCTIONS COMMITTEE</th>
              <th style={{ padding: "8px 10px" }}>OFFICIAL NOTIFICATION</th>
            </tr>
          </thead>
          <tbody>
            {fiuUpdates.map((u, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {u["Notice Date"]}
                </td>
                <td style={{ padding: "8px 10px", color: u["Action"].includes("Removed") ? "#059669" : "#DC2626", fontWeight: 600 }}>
                  {u["Action"]}
                </td>
                <td style={{ padding: "8px 10px" }}>{u["Sanctions Committee"]}</td>
                <td style={{ padding: "8px 10px" }}>
                  <a
                    href={u["Official notice PDF"]}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--blue, #2563EB)", textDecoration: "underline", fontSize: 11.5 }}
                  >
                    View Official Order (PDF) ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
