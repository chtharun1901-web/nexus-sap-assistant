import { useState, useEffect } from "react";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";

const P = {
  background: "var(--bg-main)",
  color: "var(--text-primary)",
  height: "100%",
  overflowY: "auto",
  padding: "32px 40px 60px"
};
const CARD = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  padding: "20px 24px"
};

const SUGGESTED_TOPICS = [
  { label: "SMQ2 Queue Jam", query: "SMQ2" },
  { label: "Production Material Request (PMR)", query: "PMR" },
  { label: "bgRFC vs qRFC", query: "bgRFC" },
  { label: "Production Supply Area (PSA)", query: "PSA" },
  { label: "OSS Note 2871625", query: "2871625" },
  { label: "Staging Bins", query: "staging" }
];

const CATEGORY_STYLES = {
  "Official SAP Help": { bg: "var(--blue-light)", border: "var(--blue-border)", text: "var(--blue-text)" },
  "Official SAP OSS Note": { bg: "var(--green-light)", border: "var(--green-border)", text: "var(--green-text)" },
  "Investigation": { bg: "var(--amber-light)", border: "var(--amber-border)", text: "var(--amber-text)" },
  "Template": { bg: "rgba(255,85,0,0.12)", border: "rgba(255,85,0,0.3)", text: "var(--orange)" },
  "Conversation": { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.3)", text: "var(--cyan)" },
  "Document": { bg: "var(--green-light)", border: "var(--green-border)", text: "var(--green-text)" },
  "Knowledge": { bg: "var(--amber-light)", border: "var(--amber-border)", text: "var(--amber-text)" },
};

export default function Home({ onNavigate }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [convs, setConvs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [convSearch, setConvSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");

  useEffect(() => {
    api.homeSummary().then((d) => setStats(d.summary || {})).catch(() => {});
    api.getConversations().then((d) => setConvs(d.conversations || [])).catch(() => {});
    api.getTemplates().then((d) => setTemplates(d.templates || [])).catch(() => {});
    api.getInvestigations().then((d) => setInvestigations(d.investigations || [])).catch(() => {});
  }, []);

  const executeSearch = async (searchTerm) => {
    const q = (searchTerm || query).trim();
    if (!q) return;
    setLoading(true);
    setResults(null);
    try {
      const d = await api.omniSearch({ query: q });
      setResults(d);
    } catch (err) {
      setResults({ error: err.message || "Search query failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handlePillClick = (item) => {
    // Navigate straight to workspace with that topic generated!
    if (onNavigate) {
      onNavigate("workspace", item.query || item.label);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const searchItems = Array.isArray(results?.results)
    ? results.results
    : Array.isArray(results?.flatResults)
    ? results.flatResults
    : Array.isArray(results?.results?.all)
    ? results.results.all
    : [];

  return (
    <div style={P}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Hero Banner */}
        <div
          id="tour-hero-banner"
          style={{
            background: "linear-gradient(135deg,#1C1917 0%,#292524 100%)",
            border: "1px solid rgba(255,85,0,0.35)",
            borderRadius: 12,
            padding: "26px 30px",
            color: "#EDEDED",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  background: "rgba(255,85,0,0.2)",
                  color: "#FF9966",
                  border: "1px solid rgba(255,85,0,0.4)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)"
                }}
              >
                {user?.role || "SAP Consultant"}
              </span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#A1A1AA" }}>
                S/4HANA 2023 FPS02 · Plant 1000
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
              {greeting()}, {user?.display_name?.split(" ")[0] || "SAP Specialist"}
            </h1>
            <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.5, maxWidth: 620 }}>
              Personalized enterprise workspace for root-cause diagnostics, queue monitoring, verified knowledge curation, and grounded reasoning.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate && onNavigate("workspace", "SMQ2 Queue Jam")}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>⚡ Active Case: NX-2025-0847</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate("cases")}
              className="btn-secondary"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#EDEDED" }}
            >
              📂 Incidents
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div id="tour-stats-row" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { n: investigations.length, l: "Investigations" },
            { n: convs.length, l: "Sessions" },
            { n: templates.length || 10, l: "Playbooks" },
            { n: "Read-Only", l: "Trust Mode", g: true }
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "14px 20px",
                flex: 1,
                minWidth: 120,
                textAlign: "center"
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: s.g ? "var(--green-text)" : "var(--orange)",
                  fontFamily: "var(--font-mono)"
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Omni Search Box */}
        <div id="tour-search-card" style={{ ...CARD, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
              Search Sanjaya Enterprise Knowledge
            </h2>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Official Help · OSS Notes · Runbooks · Playbooks
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics (e.g. SMQ2, PMR, bgRFC, OSS 2871625, production staging)..."
              style={{
                flex: 1,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13.5,
                color: "var(--text-primary)",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: "10px 24px", fontSize: 13.5, whiteSpace: "nowrap" }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
            {query && (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("workspace", query)}
                className="btn-secondary"
                style={{ padding: "10px 16px", color: "var(--orange)", borderColor: "var(--orange)", fontWeight: 600, whiteSpace: "nowrap" }}
                title="Generate and open in Investigation Workspace"
              >
                ⚡ Open in Workspace →
              </button>
            )}
          </form>

          {/* Quick topic suggestion pills */}
          <div id="tour-quick-topics" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Quick Topics:</span>
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic.label}
                type="button"
                onClick={() => handlePillClick(topic)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 9999,
                  padding: "4px 12px",
                  fontSize: 11.5,
                  color: "var(--text-body)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
                title={`Click to open ${topic.label} in Investigation Workspace`}
              >
                <span>{topic.label}</span>
                <span style={{ color: "var(--orange)", fontSize: 10 }}>↗</span>
              </button>
            ))}
          </div>

          {/* Results Area */}
          {results && (
            <div style={{ marginTop: 20, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
              {results.error && (
                <div style={{ background: "var(--red-light)", color: "var(--red-text)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                  ⚠ {results.error}
                </div>
              )}

              {!results.error && searchItems.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>No exact matches in saved items for "{results.query || query}"</div>
                  <div style={{ fontSize: 12, marginTop: 4, marginBottom: 12 }}>
                    Would you like to generate an investigation case for this topic in the Workspace?
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate("workspace", results.query || query)}
                    className="btn-primary"
                    style={{ padding: "8px 20px" }}
                  >
                    ⚡ Generate "{results.query || query}" in Workspace →
                  </button>
                </div>
              )}

              {!results.error && searchItems.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                      Found {searchItems.length} Result{searchItems.length > 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate("workspace", query || searchItems[0]?.title)}
                      style={{ background: "none", border: "none", color: "var(--orange)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      ⚡ Open All in Investigation Workspace →
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {searchItems.map((r, i) => {
                      const catStyle = CATEGORY_STYLES[r.category] || { bg: "var(--bg-surface)", border: "var(--border-subtle)", text: "var(--text-primary)" };
                      return (
                        <div
                          key={r.id || i}
                          style={{
                            background: "var(--bg-surface)",
                            borderRadius: 8,
                            padding: "14px 18px",
                            border: "1px solid var(--border-subtle)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 700,
                                  background: catStyle.bg,
                                  border: `1px solid ${catStyle.border}`,
                                  color: catStyle.text,
                                  padding: "2px 8px",
                                  borderRadius: 4
                                }}
                              >
                                {r.category || "SAP Knowledge"}
                              </span>
                              {r.citationId && (
                                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 700 }}>
                                  [{r.citationId}]
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              {r.url && (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize: 11, color: "var(--blue-text)", textDecoration: "none", fontFamily: "var(--font-mono)" }}
                                >
                                  Official Link ↗
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => onNavigate && onNavigate("workspace", r.title || r.citationId || query)}
                                style={{
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border-subtle)",
                                  borderRadius: 4,
                                  padding: "3px 10px",
                                  fontSize: 11,
                                  color: "var(--orange)",
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Open in Workspace →
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                            {r.title}
                          </div>

                          <div style={{ fontSize: 12.5, color: "var(--text-body)", lineHeight: 1.6 }}>
                            {r.excerpt}
                          </div>

                          {r.provenance && (
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
                              Source: {r.provenance}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Split: Recent Investigations & Conversations */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Card 1: Investigations */}
          <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Recent Investigations</h2>
                <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 700, background: "var(--bg-surface)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                  {investigations.length} cases
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("cases")}
                style={{ background: "none", border: "none", color: "var(--orange)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <span>View all</span>
                <span>→</span>
              </button>
            </div>

            <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column" }}>
              {investigations.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "10px 0" }}>No investigations yet.</p>
              ) : (
                investigations.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onNavigate && onNavigate("workspace", inv.title || inv.case_id)}
                    style={{
                      padding: "9px 10px",
                      borderBottom: "1px solid var(--border-subtle)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      borderRadius: 6,
                      transition: "all 0.15s ease",
                      marginBottom: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface)";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{inv.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {inv.case_id || inv.id?.substring(0, 8)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        background: "var(--amber-light)",
                        color: "var(--amber-text)",
                        padding: "2px 8px",
                        borderRadius: 9999,
                        border: "1px solid var(--amber-border)"
                      }}
                    >
                      {inv.status || "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Recent Conversations with Live Search & Full Scroll List */}
          <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Recent Conversations</h2>
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    background: "rgba(255,85,0,0.12)",
                    color: "var(--orange)",
                    padding: "2px 8px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,85,0,0.25)"
                  }}
                >
                  {convSearch ? `${convs.filter(c => (c.title||"").toLowerCase().includes(convSearch.toLowerCase()) || (c.last_message||"").toLowerCase().includes(convSearch.toLowerCase())).length} of ${convs.length}` : `${convs.length} total`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("workspace")}
                style={{ background: "none", border: "none", color: "var(--orange)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <span>Open chat</span>
                <span>→</span>
              </button>
            </div>

            {/* Real-time Search Filter Bar */}
            {convs.length > 0 && (
              <div style={{ position: "relative", marginBottom: 10 }}>
                <input
                  type="text"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder={`Search ${convs.length} sessions (title, topic, question)... `}
                  style={{
                    width: "100%",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    padding: "7px 30px 7px 28px",
                    fontSize: 12.5,
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--orange)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,85,0,0.25)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    pointerEvents: "none"
                  }}
                >
                  🔍
                </span>
                {convSearch && (
                  <button
                    type="button"
                    onClick={() => setConvSearch("")}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: 2,
                      fontWeight: "bold"
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Scrollable List showing ALL Conversations */}
            <div
              style={{
                maxHeight: 340,
                overflowY: "auto",
                paddingRight: 4,
                display: "flex",
                flexDirection: "column"
              }}
            >
              {convs.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "10px 0" }}>
                  No conversations yet. Open the Workspace to start chatting.
                </p>
              ) : (() => {
                const filtered = convs.filter(c => {
                  if (!convSearch.trim()) return true;
                  const term = convSearch.toLowerCase();
                  return (c.title || "").toLowerCase().includes(term) || (c.last_message || "").toLowerCase().includes(term);
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 13, marginBottom: 8 }}>No sessions match "{convSearch}"</div>
                      <button
                        type="button"
                        onClick={() => setConvSearch("")}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--orange)",
                          padding: "4px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        Clear search
                      </button>
                    </div>
                  );
                }

                return filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate && onNavigate("workspace", c.title)}
                    style={{
                      padding: "9px 10px",
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      borderRadius: 6,
                      transition: "all 0.15s ease",
                      marginBottom: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface)";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, flex: 1 }}>
                        {c.title}
                      </div>
                      <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {new Date(c.updated_at).toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {c.message_count > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          💬 {c.message_count} {c.message_count === 1 ? "turn" : "turns"}
                        </span>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
