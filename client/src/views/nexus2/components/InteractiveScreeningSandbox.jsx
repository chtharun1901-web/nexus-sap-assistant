import React, { useState } from "react";
import { screenParty } from "../engine/sanctionsMatcher.js";

const PRESET_QUERIES = [
  { label: "Abu Tair Mohammed (Non-SDN Alias Test)", name: "Abu Tair Mohammed", country: "Palestine", city: "Gaza", threshold: 75 },
  { label: "Gedo Hamdan Ahmed (UN Consolidated Exact)", name: "GEDO HAMDAN AHMED", country: "Sudan", threshold: 80 },
  { label: "AeroTech Components (False-Positive Scenario)", name: "AeroTech Components Ltd", country: "GB", city: "Farnborough", threshold: 70 },
  { label: "Al-Sham Global Trading (OFAC SDN Match)", name: "Al-Sham Global Trading", country: "AE", city: "Dubai", threshold: 75 }
];

export default function InteractiveScreeningSandbox({ onOpenActionDialog }) {
  const [name, setName] = useState("Abu Tair Mohammed");
  const [altName, setAltName] = useState("");
  const [country, setCountry] = useState("Palestine");
  const [city, setCity] = useState("Gaza");
  const [threshold, setThreshold] = useState(70);

  const [screeningResult, setScreeningResult] = useState(() => screenParty({
    name: "Abu Tair Mohammed",
    country: "Palestine",
    city: "Gaza",
    threshold: 70
  }));

  const handleRunScreening = (e) => {
    if (e) e.preventDefault();
    const result = screenParty({
      name,
      alternateName: altName,
      country,
      city,
      threshold
    });
    setScreeningResult(result);
  };

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setAltName(preset.altName || "");
    setCountry(preset.country || "");
    setCity(preset.city || "");
    setThreshold(preset.threshold || 70);

    const result = screenParty({
      name: preset.name,
      alternateName: preset.altName || "",
      country: preset.country || "",
      city: preset.city || "",
      threshold: preset.threshold || 70
    });
    setScreeningResult(result);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", padding: "20px 24px", background: "var(--bg-main)" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          Interactive Sanctioned-Party Screening Sandbox
        </h2>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          Evaluate any entity, customer, or vendor against live UN Consolidated & OFAC lists using transparent multi-token matching.
        </div>
      </div>

      {/* Preset Quick-Load Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          PRESET AUDIT TEST CASES:
        </span>
        {PRESET_QUERIES.map((pq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleApplyPreset(pq)}
            style={{
              padding: "4px 10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 4,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--text-primary)"
            }}
          >
            {pq.label}
          </button>
        ))}
      </div>

      {/* Input Parameters Box */}
      <form onSubmit={handleRunScreening} style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
              LEGAL BUSINESS / INDIVIDUAL NAME:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Abu Tair Mohammed or AeroTech Components"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
              COUNTRY (ISO / NAME):
            </label>
            <input
              type="text"
              placeholder="e.g. Palestine, GB, US, Sudan"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
              CITY / POSTAL:
            </label>
            <input
              type="text"
              placeholder="e.g. Gaza or Farnborough"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none"
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "8px 14px",
                background: "var(--orange, #6E1A2D)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(110,26,45,0.25)"
              }}
            >
              Execute Screening Check ⚡
            </button>
          </div>
        </div>

        {/* Sensitivity Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            MATCH SENSITIVITY THRESHOLD: {threshold}%
          </span>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ width: 160, cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            (Higher threshold = stricter match requirements; 70-75% is standard SAP GTS default)
          </span>
        </div>
      </form>

      {/* Screening Output Section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            Screening Evaluation Results ({screeningResult.totalMatches} matches found)
          </h3>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Evaluated {screeningResult.totalEvaluated} records across UN & OFAC databases
          </span>
        </div>

        <div style={{ fontSize: 11, color: "var(--amber, #D97706)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          ⚠️ {screeningResult.disclaimer}
        </div>
      </div>

      {screeningResult.matches.length === 0 ? (
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: 24 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#065F46", marginTop: 4 }}>
            CLEARED — No Sanctioned Entity Match
          </div>
          <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 2 }}>
            Input query "{name}" scored below the {threshold}% similarity threshold against all registered UN, OFAC, and Indian sanctions records.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {screeningResult.matches.map((m, idx) => {
            const isHighScore = m.matchScore >= 85;
            return (
              <div
                key={idx}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${isHighScore ? "rgba(239,68,68,0.4)" : "var(--border-subtle)"}`,
                  borderRadius: 8,
                  padding: 18,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                {/* Result Card Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                        {m.matchedEntity}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          background: isHighScore ? "rgba(239,68,68,0.12)" : "rgba(217,119,6,0.12)",
                          color: isHighScore ? "#DC2626" : "#D97706",
                          border: isHighScore ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(217,119,6,0.3)"
                        }}
                      >
                        MATCH CONFIDENCE: {m.matchScore}%
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Source List: <strong>{m.sourceList}</strong> ({m.program}) | Entity Ref: <code>{m.entityId}</code>
                    </div>
                  </div>

                  {/* Officer Action Trigger Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onOpenActionDialog && onOpenActionDialog("RELEASE", {
                        id: m.entityId,
                        partnerNumber: m.entityId,
                        name: m.matchedEntity,
                        blockReason: `Audited Match (${m.matchScore}%)`,
                        matchScore: m.matchScore
                      }, "partner")}
                      style={{
                        padding: "5px 12px",
                        background: "var(--green, #10B981)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      False Positive — Release ✓
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenActionDialog && onOpenActionDialog("CONFIRM_BLOCK", {
                        id: m.entityId,
                        partnerNumber: m.entityId,
                        name: m.matchedEntity,
                        blockReason: `High-Risk Sanctions Hit (${m.matchScore}%)`,
                        matchScore: m.matchScore
                      }, "partner")}
                      style={{
                        padding: "5px 12px",
                        background: "var(--red, #EF4444)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Confirmed Match — Block ✕
                    </button>
                  </div>
                </div>

                {/* Structured Match Explanation (per user specification) */}
                <div style={{ background: "var(--bg-surface)", padding: 12, borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><span style={{ color: "var(--text-muted)" }}>Input Name:</span> <strong>{name}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Matched Alias / Name:</span> <strong style={{ color: "var(--orange, #6E1A2D)" }}>{m.matchedAlias}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Source List:</span> {m.sourceList}</div>
                    <div><span style={{ color: "var(--text-muted)" }}>Match Basis:</span> {m.matchBasis}</div>
                    <div><span style={{ color: "var(--text-muted)" }}>Evaluated Status:</span> <strong style={{ color: isHighScore ? "#DC2626" : "#D97706" }}>{m.riskStatus}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Snapshot Reference:</span> {m.snapshotDate} (Official Source Pack)</div>
                  </div>
                </div>

                {/* Evidence Panel: Aliases & Addresses */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11.5 }}>
                  {/* Aliases */}
                  <div style={{ background: "var(--bg-surface)", padding: 10, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                      RECORDED ALIASES / AKAs ({m.aliases.length}):
                    </div>
                    {m.aliases.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {m.aliases.map((al, aIdx) => (
                          <span key={aIdx} style={{ background: "var(--bg-card)", padding: "2px 6px", borderRadius: 3, border: "1px solid var(--border-subtle)" }}>
                            {al}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>No additional aliases on record.</span>
                    )}
                  </div>

                  {/* Addresses */}
                  <div style={{ background: "var(--bg-surface)", padding: 10, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                      REGISTERED ADDRESSES ({m.addresses.length}):
                    </div>
                    {m.addresses.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {m.addresses.map((ad, adIdx) => (
                          <div key={adIdx} style={{ color: "var(--text-body)" }}>
                            • {ad}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>No specific address records on file.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
