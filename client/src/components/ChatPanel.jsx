import { useState, useRef, useEffect } from "react";
import { api } from "../api.js";
import { FormattedText } from "../views/Workspace.jsx";

export default function ChatPanel({ convId, history, onHistory, currentTopic, onGenerateTopic }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat");
  const [mentorMode, setMentorMode] = useState(false);
  const [docs, setDocs] = useState([]);
  const [citations, setCitations] = useState([]);
  const bottomRef = useRef(null);
  const chatInputRef = useRef(null);

  const autoResizeTextarea = (el, minH = 38, maxH = 140) => {
    if (!el) return;
    el.style.height = "auto";
    const newH = Math.min(Math.max(el.scrollHeight, minH), maxH);
    el.style.height = `${newH}px`;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const send = async (explicitText) => {
    const text = (explicitText || input).trim();
    if (!text || loading) return;
    if (!explicitText) {
      setInput("");
      if (chatInputRef.current) chatInputRef.current.style.height = "38px";
    }
    setLoading(true);

    // Update the middle document canvas to match the topic being discussed
    if (onGenerateTopic) {
      onGenerateTopic(text);
    }

    const userMsg = { role: "user", content: text };
    const baseHistory = [...history, userMsg];
    // Placeholder model message that will stream
    const placeholderMsg = { role: "model", content: "", citations: [] };
    onHistory([...baseHistory, placeholderMsg]);

    try {
      const contents = baseHistory.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      let accumulatedText = "";
      let retrievedCitations = [];

      await api.streamChat(
        {
          conversationId: convId,
          contents,
          mentorMode,
          uploadedDocs: docs
        },
        (chunk, full) => {
          accumulatedText = full;
          onHistory([
            ...baseHistory,
            { role: "model", content: full, citations: retrievedCitations }
          ]);
        },
        (sources) => {
          retrievedCitations = sources || [];
          setCitations((prev) => {
            const existingIds = new Set(prev.map((c) => c.citationId || c.id));
            const newOnes = retrievedCitations.filter((c) => !existingIds.has(c.citationId || c.id));
            return [...prev, ...newOnes];
          });
        }
      );

      // Final update with citations
      onHistory([
        ...baseHistory,
        { role: "model", content: accumulatedText || "Analysis complete.", citations: retrievedCitations }
      ]);
    } catch (err) {
      onHistory([
        ...baseHistory,
        { role: "model", content: "⚠ Error: " + (err.message || "Failed to contact Nexus reasoning agent.") }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("document", file);
    try {
      const d = await api.upload(fd);
      if (d.document) setDocs((prev) => [...prev, d.document]);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0D0D0D", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: "linear-gradient(135deg,var(--orange),#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#fff" }}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#EDEDED" }}>Sanjaya AI Reasoning</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setMentorMode((m) => !m)}
            style={{
              background: mentorMode ? "rgba(255,85,0,0.15)" : "rgba(255,255,255,0.06)",
              border: "1px solid " + (mentorMode ? "rgba(255,85,0,0.4)" : "rgba(255,255,255,0.1)"),
              color: mentorMode ? "var(--orange)" : "#A1A1AA",
              fontSize: 10.5,
              fontWeight: 600,
              padding: "3px 7px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            🎓 Mentor: {mentorMode ? "ON" : "OFF"}
          </button>
          <div style={{ display: "flex", gap: 2 }}>
            {["chat", "evidence"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "rgba(255,255,255,0.1)" : "transparent",
                  border: "1px solid " + (tab === t ? "rgba(255,255,255,0.2)" : "transparent"),
                  color: tab === t ? "#EDEDED" : "#71717A",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  textTransform: "capitalize",
                  cursor: "pointer"
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: tab === "chat" ? "flex" : "none", flexDirection: "column", gap: 14 }}>
        {history.length === 0 && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#EDEDED", fontFamily: "var(--font-mono)" }}>SANJAYA AI (सञ्जय)</span>
            </div>
            <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.6 }}>
              I am Sanjaya, your divine-vision SAP Operations copilot. Ask me about any queue, T-code, or symptom (e.g. <strong style={{ color: "var(--orange)" }}>SMQ1</strong>, <strong style={{ color: "var(--orange)" }}>SMQ2</strong>, <strong style={{ color: "var(--orange)" }}>PMR</strong>, <strong style={{ color: "var(--orange)" }}>bgRFC</strong>).
            </p>
          </div>
        )}

        {history.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "user" ? (
              <div style={{ background: "rgba(255,85,0,0.14)", border: "1px solid rgba(255,85,0,0.3)", borderRadius: "10px 10px 2px 10px", padding: "8px 12px", maxWidth: "85%", fontSize: 13, color: "#EDEDED", lineHeight: 1.5 }}>
                {m.content}
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px 10px 10px 10px", padding: "12px 14px", maxWidth: "94%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", fontFamily: "var(--font-mono)" }}>SANJAYA (सञ्जय)</span>
                </div>
                <div style={{ fontSize: 13, color: "#D6D6D6", lineHeight: 1.65 }}>
                  {m.content ? (
                    <FormattedText text={m.content} />
                  ) : (
                    loading && i === history.length - 1 ? "Reasoning with grounded SAP knowledge..." : ""
                  )}
                </div>
                {m.citations && m.citations.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {m.citations.map((c, ci) => (
                      <a
                        key={ci}
                        href={c.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "rgba(37,99,235,0.12)",
                          border: "1px solid rgba(147,197,253,0.35)",
                          color: "#93C5FD",
                          padding: "2px 8px",
                          borderRadius: 9999,
                          fontSize: 10.5,
                          fontFamily: "var(--font-mono)",
                          textDecoration: "none"
                        }}
                      >
                        [{c.citationId || c.id || "Ref"}] ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--orange)", opacity: 0.8 }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Evidence tab */}
      {tab === "evidence" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#EDEDED", marginBottom: 10 }}>Grounded Citations & Evidence</div>
          {citations.length === 0 ? (
            <p style={{ fontSize: 12, color: "#71717A" }}>No citations retrieved yet. Ask a question to trigger grounded retrieval.</p>
          ) : (
            citations.map((c, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--orange)", marginBottom: 4 }}>{c.citationId || c.id}</div>
                <div style={{ fontSize: 12.5, color: "#EDEDED", fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "#71717A", marginBottom: 6 }}>{c.tier}</div>
                <div style={{ fontSize: 11.5, color: "#A1A1AA", lineHeight: 1.5, marginBottom: 6 }}>{c.excerpt}</div>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#93C5FD", fontFamily: "var(--font-mono)" }}>
                    View official source ↗
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Input dock */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        {docs.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {docs.map((d, i) => (
              <span key={i} style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(110,231,183,0.3)", color: "var(--green-text)", padding: "2px 8px", borderRadius: 9999 }}>
                📄 {d.filename}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          <label style={{ cursor: "pointer", color: "#71717A", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, height: 38, width: 34, boxSizing: "border-box" }} title="Upload document">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <input type="file" style={{ display: "none" }} accept=".pdf,.txt,.md,.docx" onChange={handleFile} />
          </label>
          <textarea
            ref={chatInputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResizeTextarea(e.target, 38, 140);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask follow-up or diagnose symptoms... (Enter to send, Shift+Enter for newline)"
            style={{
              flex: 1,
              minHeight: 38,
              maxHeight: 140,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "8px 12px",
              color: "#EDEDED",
              fontSize: 13,
              outline: "none",
              resize: "none",
              lineHeight: "20px",
              boxSizing: "border-box",
              overflowY: "auto",
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading}
            style={{ background: loading ? "rgba(255,255,255,0.06)" : "var(--orange)", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, height: 38, alignSelf: "flex-end" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
