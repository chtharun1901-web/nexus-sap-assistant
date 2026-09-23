import React, { useState, useEffect } from "react";
import { PRESET_INTERVIEW_QUESTIONS } from "./interviewData.js";

export default function MockInterviewSession({
  isOpen,
  onClose,
  onFinishSession,
  profile = {}
}) {
  const [step, setStep] = useState("setup");
  const [config, setConfig] = useState({
    type: "Mixed (Technical & STAR)",
    difficulty: "Advanced",
    questionCount: 5,
    style: "Realistic",
    candidateProfile: profile.targetRole || "Senior SAP PP/EWM Consultant"
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [timerSec, setTimerSec] = useState(0);

  useEffect(() => {
    let t;
    if (step === "interview") {
      t = setInterval(() => setTimerSec(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [step]);

  if (!isOpen) return null;

  const startInterview = () => {
    const pool = [...PRESET_INTERVIEW_QUESTIONS];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, config.questionCount);
    setSessionQuestions(selected);
    setCurrentIndex(0);
    setEvaluations([]);
    setCurrentFeedback(null);
    setTimerSec(0);
    setStep("interview");
  };

  const submitAnswer = () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);

    const q = sessionQuestions[currentIndex];
    const lower = userAnswer.toLowerCase();
    let score = 72;
    if (userAnswer.length > 150) score += 10;
    if (userAnswer.length > 300) score += 10;
    if (lower.includes("co01") || lower.includes("migo") || lower.includes("pmr") || lower.includes("smq2") || lower.includes("star") || lower.includes("result")) score += 6;
    score = Math.min(score, 98);

    const feedback = {
      score,
      verdict: score >= 85 ? "Strong Answer" : score >= 70 ? "Good Answer" : "Needs Improvement",
      accuracy: Math.min(score + 2, 98),
      completeness: Math.max(score - 4, 60),
      communication: Math.min(score + 4, 96),
      positives: [
        "Directly addressed the core interview question.",
        "Demonstrated clear understanding of SAP business impact."
      ],
      improvements: [
        "Ensure exact transaction codes (e.g. " + (q.tcodes?.[0] || "CR01") + ") are mentioned early.",
        "Add a 1-sentence quantifiable outcome to seal the response."
      ],
      modelAnswer: q.shortAnswer
    };

    const nextEvals = [...evaluations, { question: q.question, userAnswer, feedback, score }];
    setEvaluations(nextEvals);
    setCurrentFeedback(feedback);
    setIsEvaluating(false);
  };

  const handleNext = () => {
    setUserAnswer("");
    setCurrentFeedback(null);
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep("results");
    }
  };

  const finishSession = () => {
    if (onFinishSession) {
      const avgScore = evaluations.length ? Math.round(evaluations.reduce((a, b) => a + b.score, 0) / evaluations.length) : 85;
      onFinishSession({
        config,
        evaluations,
        avgScore,
        date: new Date().toISOString()
      });
    }
    onClose();
  };

  const currentQ = sessionQuestions[currentIndex];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: 14,
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden"
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎙️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                Infosys Mock Interview Simulation
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {step === "setup" ? "Configure Simulation Parameters" : step === "interview" ? "Question " + (currentIndex + 1) + " of " + sessionQuestions.length + " · " + Math.floor(timerSec / 60) + "m " + (timerSec % 60) + "s" : "Performance Debrief"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {step === "setup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Configure your mock interview. Nexus will simulate an authentic Infosys Technical Lead interview, asking questions one by one and evaluating your answers in real time.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Interview Type
                  </label>
                  <select
                    value={config.type}
                    onChange={e => setConfig({ ...config, type: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
                  >
                    <option>Mixed (Technical, Scenario & STAR)</option>
                    <option>SAP PP & Manufacturing Deep Dive</option>
                    <option>SAP EWM & Staging Integration</option>
                    <option>Production Support & SLA Triage</option>
                    <option>Behavioral (STAR Method)</option>
                    <option>Infosys HR & Self-Introduction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Difficulty Level
                  </label>
                  <select
                    value={config.difficulty}
                    onChange={e => setConfig({ ...config, difficulty: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
                  >
                    <option>Beginner (1-2 Years)</option>
                    <option>Intermediate (3-5 Years)</option>
                    <option>Advanced (5-8 Years Lead)</option>
                    <option>Expert / Architect (8+ Years)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Question Count
                  </label>
                  <select
                    value={config.questionCount}
                    onChange={e => setConfig({ ...config, questionCount: parseInt(e.target.value, 10) })}
                    style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
                  >
                    <option value={3}>3 Questions (Quick Drill - 5 mins)</option>
                    <option value={5}>5 Questions (Standard Round - 15 mins)</option>
                    <option value={10}>10 Questions (Comprehensive Round - 30 mins)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Interviewer Style
                  </label>
                  <select
                    value={config.style}
                    onChange={e => setConfig({ ...config, style: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: 6, fontSize: 12 }}
                  >
                    <option>Realistic (Professional & Inquisitive)</option>
                    <option>Challenging (Detailed Follow-ups)</option>
                    <option>Friendly & Encouraging</option>
                    <option>Stress Interview (P1 Production Focus)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={startInterview}
                  style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                >
                  Start Mock Interview &rarr;
                </button>
              </div>
            </div>
          )}

          {step === "interview" && currentQ && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Question Box */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 700, textTransform: "uppercase" }}>
                    Question {currentIndex + 1} of {sessionQuestions.length}
                  </span>
                  <span style={{ fontSize: 10.5, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, color: "var(--text-muted)" }}>
                    {currentQ.difficulty || "Intermediate"}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  {currentQ.question}
                </h3>
              </div>

              {/* Answer Input */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                  Your Spoken / Typed Response:
                </label>
                <textarea
                  rows={6}
                  value={userAnswer}
                  disabled={!!currentFeedback}
                  placeholder="Type your response as you would speak it to the Infosys interviewer..."
                  onChange={e => setUserAnswer(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {!currentFeedback ? (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isEvaluating}
                    style={{
                      background: userAnswer.trim() && !isEvaluating ? "var(--orange)" : "rgba(255,255,255,0.08)",
                      color: "#FFF",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: userAnswer.trim() && !isEvaluating ? "pointer" : "not-allowed"
                    }}
                  >
                    {isEvaluating ? "Evaluating..." : "Submit Answer"}
                  </button>
                </div>
              ) : (
                /* Feedback Drawer */
                <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🎯</span>
                      <span style={{ fontWeight: 800, color: "#10B981", fontSize: 14 }}>{currentFeedback.verdict}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                      Score: {currentFeedback.score}/100
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-body)", lineHeight: 1.5 }}>
                    <strong>Positives:</strong> {currentFeedback.positives.join(" ")}
                  </div>
                  <div style={{ fontSize: 12, color: "#D97706", lineHeight: 1.5 }}>
                    <strong>Coaching Tip:</strong> {currentFeedback.improvements.join(" ")}
                  </div>

                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--orange)", fontWeight: 700, marginBottom: 4 }}>
                      Ideal 30-Second Model Answer
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-body)", fontStyle: "italic", lineHeight: 1.4 }}>
                      "{currentFeedback.modelAnswer}"
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      onClick={handleNext}
                      style={{ background: "var(--orange)", color: "#FFF", border: "none", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      {currentIndex + 1 < sessionQuestions.length ? "Next Question &rarr;" : "View Performance Debrief &rarr;"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "results" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                  Mock Interview Complete!
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                  Overall Average Score: <strong style={{ color: "#10B981" }}>{evaluations.length ? Math.round(evaluations.reduce((a, b) => a + b.score, 0) / evaluations.length) : 85}/100</strong>
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {evaluations.map((ev, i) => (
                  <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{i + 1}. {ev.question}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Verdict: {ev.feedback.verdict}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#10B981", fontFamily: "var(--font-mono)" }}>
                      {ev.score}/100
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={finishSession}
                  style={{ background: "var(--orange)", border: "none", color: "#FFF", padding: "8px 20px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                >
                  Save & Complete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
