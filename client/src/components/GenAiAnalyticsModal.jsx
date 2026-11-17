import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function GenAiAnalyticsModal({ isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, digestRes] = await Promise.all([
        api.getAiAnalytics(),
        api.getPersonalNewsDigest().catch(() => ({ digest: null }))
      ]);
      setAnalytics(analyticsRes.analytics || null);
      setDigest(digestRes.digest || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDigest = async () => {
    setLoadingDigest(true);
    try {
      const res = await api.getPersonalNewsDigest();
      if (res.digest) setDigest(res.digest);
    } catch (e) {
      alert("Failed to refresh digest: " + e.message);
    } finally {
      setLoadingDigest(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          color: "#c9d1d9",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #30363d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0d1117"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f6fc" }}>
                Personal AI Analytics & Intelligence Digest
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b949e" }}>
                Operational telemetry, query distributions, and your curated weekly SAP release briefing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b949e",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {error && <div style={{ color: "#ff7b72" }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#8b949e" }}>Compiling AI metrics and intelligence digest...</div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: "14px 18px", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", fontWeight: 600 }}>Total Investigations</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#f0f6fc", marginTop: 4 }}>
                    {analytics?.totalConversations || 0}
                  </div>
                </div>

                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: "14px 18px", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", fontWeight: 600 }}>Triage Messages</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#58a6ff", marginTop: 4 }}>
                    {analytics?.totalMessages || 0}
                  </div>
                </div>

                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: "14px 18px", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", fontWeight: 600 }}>Pinned Insights</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#3fb950", marginTop: 4 }}>
                    {analytics?.bookmarkCount || 0}
                  </div>
                </div>

                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: "14px 18px", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", fontWeight: 600 }}>Quiz Mastery</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#f0883e", marginTop: 4 }}>
                    {analytics?.quizStats?.averageScorePercent || 0}%
                  </div>
                </div>
              </div>

              {/* Module Distribution */}
              <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f6fc", marginBottom: 12 }}>
                  Module Inquiry Focus & Activity
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {Object.entries(analytics?.moduleDistribution || {}).map(([mod, count]) => (
                    <div key={mod} style={{ background: "#161b22", padding: "8px 12px", borderRadius: 6, border: "1px solid #21262d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#c9d1d9" }}>{mod}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? "#58a6ff" : "#6e7681" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Intelligence Digest */}
              <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📰</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#f0f6fc" }}>
                      Weekly Curated SAP Intelligence Digest
                    </span>
                  </div>
                  <button
                    onClick={handleRefreshDigest}
                    disabled={loadingDigest}
                    style={{
                      padding: "4px 12px",
                      background: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: 4,
                      color: "#c9d1d9",
                      fontSize: 12,
                      cursor: loadingDigest ? "not-allowed" : "pointer"
                    }}
                  >
                    {loadingDigest ? "Generating..." : "↻ Refresh Digest"}
                  </button>
                </div>

                {digest ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 15, color: "#58a6ff", fontWeight: 700 }}>
                      {digest.headline}
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#c9d1d9" }}>
                      {digest.executiveSummary}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                      {(digest.topStories || []).map((story, sIdx) => (
                        <div key={sIdx} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 6, padding: "10px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f6fc" }}>{story.title}</span>
                            <span style={{ fontSize: 11, background: "rgba(56,139,253,0.1)", color: "#58a6ff", padding: "1px 6px", borderRadius: 4 }}>
                              {story.module}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0", fontSize: 12, color: "#8b949e", lineHeight: 1.4 }}>
                            {story.takeaway}
                          </p>
                          {story.editionAvailability && (
                            <div style={{ fontSize: 11, color: "#3fb950", marginTop: 4 }}>
                              ✓ Availability: {story.editionAvailability}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {digest.recommendedAction && (
                      <div style={{ background: "rgba(35,134,54,0.1)", border: "1px solid rgba(46,160,67,0.3)", borderRadius: 6, padding: "10px 14px", marginTop: 6, fontSize: 12, color: "#3fb950" }}>
                        <strong>Recommended Strategic Action:</strong> {digest.recommendedAction}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "#8b949e", fontSize: 13 }}>Click Refresh to synthesize your weekly briefing.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
