import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function GenAiQuizModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("play"); // "play", "generate", "history"
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Playback state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Generate form state
  const [genTopic, setGenTopic] = useState("S/4HANA Sales Pricing & Condition Technique");
  const [genModule, setGenModule] = useState("SD");
  const [genDifficulty, setGenDifficulty] = useState("intermediate");
  const [genCount, setGenCount] = useState(5);

  const MODULES = ["SD", "MM", "PP", "EWM", "GTS", "FI/CO", "General", "AI / Joule"];

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.getQuizzes(),
        api.getQuizStats()
      ]);
      setQuizzes(listRes.quizzes || []);
      setStats(statsRes.stats || null);

      // If no quiz loaded yet and quizzes exist, load first quiz
      if (!currentQuiz && listRes.quizzes && listRes.quizzes.length > 0) {
        loadSpecificQuiz(listRes.quizzes[0].id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificQuiz = async (quizId) => {
    setLoading(true);
    try {
      const res = await api.getQuiz(quizId);
      if (res.quiz) {
        setCurrentQuiz(res.quiz);
        setCurrentQIndex(0);
        setSelectedAnswers({});
        setShowExplanation(false);
        setQuizFinished(false);
        setActiveTab("play");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuizzes();
    }
  }, [isOpen]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generateQuiz({
        topic: genTopic,
        module: genModule,
        difficulty: genDifficulty,
        count: parseInt(genCount, 10) || 5
      });
      if (res.quiz) {
        setCurrentQuiz(res.quiz);
        setCurrentQIndex(0);
        setSelectedAnswers({});
        setShowExplanation(false);
        setQuizFinished(false);
        setActiveTab("play");
        loadQuizzes();
      }
    } catch (err) {
      setError("Generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    if (showExplanation || quizFinished) return;
    setSelectedAnswers({ ...selectedAnswers, [qIndex]: optionIndex });
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (!currentQuiz?.questions) return;
    if (currentQIndex + 1 < currentQuiz.questions.length) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Calculate score & submit attempt
      let correct = 0;
      currentQuiz.questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) correct++;
      });
      setFinalScore(correct);
      setQuizFinished(true);

      api.submitQuizAttempt(currentQuiz.id, {
        score: correct,
        totalQuestions: currentQuiz.questions.length,
        answers: selectedAnswers
      }).then(() => loadQuizzes()).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const currentQ = currentQuiz?.questions?.[currentQIndex];

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
          maxWidth: 820,
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
            <span style={{ fontSize: 22 }}>🎯</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f6fc" }}>
                SAP Certification & Knowledge Quiz Generator
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b949e" }}>
                Test your mastery with realistic S/4HANA enterprise scenarios, tcodes, and official explanations.
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

        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid #21262d", background: "#0d1117", padding: "0 24px" }}>
          <button
            onClick={() => setActiveTab("play")}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "play" ? "2px solid #58a6ff" : "2px solid transparent",
              color: activeTab === "play" ? "#58a6ff" : "#8b949e",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            🎮 Active Quiz {currentQuiz ? `(${currentQuiz.topic})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "generate" ? "2px solid #58a6ff" : "2px solid transparent",
              color: activeTab === "generate" ? "#58a6ff" : "#8b949e",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            ✨ Generate New Topic
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "history" ? "2px solid #58a6ff" : "2px solid transparent",
              color: activeTab === "history" ? "#58a6ff" : "#8b949e",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            📊 History & Scores {stats ? `(${stats.averageScorePercent}% Avg)` : ""}
          </button>
        </div>

        {/* Tab 1: Play Quiz */}
        {activeTab === "play" && (
          <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <div style={{ color: "#ff7b72" }}>{error}</div>}

            {!currentQuiz ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8b949e" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#c9d1d9", marginBottom: 6 }}>No Quiz Selected</div>
                <p style={{ fontSize: 13, maxWidth: 400, margin: "0 auto 16px" }}>
                  Generate an AI assessment tailored to your preferred SAP module or select a past topic.
                </p>
                <button
                  onClick={() => setActiveTab("generate")}
                  style={{
                    padding: "8px 20px",
                    background: "#1f6feb",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Generate Practice Quiz →
                </button>
              </div>
            ) : quizFinished ? (
              <div style={{ textAlign: "center", padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <h3 style={{ margin: 0, fontSize: 22, color: "#f0f6fc" }}>Quiz Completed!</h3>
                <div style={{ fontSize: 16, color: "#8b949e" }}>
                  Topic: <strong style={{ color: "#c9d1d9" }}>{currentQuiz.topic}</strong>
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: finalScore >= (currentQuiz.questions.length * 0.7) ? "#3fb950" : "#d29922",
                    background: "#0d1117",
                    padding: "16px 32px",
                    borderRadius: 12,
                    border: "1px solid #30363d"
                  }}
                >
                  Score: {finalScore} / {currentQuiz.questions.length} (
                  {Math.round((finalScore / currentQuiz.questions.length) * 100)}%)
                </div>
                <p style={{ fontSize: 13, color: "#8b949e", maxWidth: 450 }}>
                  {finalScore >= (currentQuiz.questions.length * 0.7)
                    ? "Excellent understanding! You demonstrate strong competency in standard SAP behaviors and configuration safeguards."
                    : "Good attempt! Review the question explanations and standard transaction codes to solidify your understanding."}
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <button
                    onClick={() => {
                      setCurrentQIndex(0);
                      setSelectedAnswers({});
                      setShowExplanation(false);
                      setQuizFinished(false);
                    }}
                    style={{
                      padding: "8px 18px",
                      background: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      color: "#c9d1d9",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab("generate")}
                    style={{
                      padding: "8px 18px",
                      background: "#1f6feb",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Generate Another Topic →
                  </button>
                </div>
              </div>
            ) : currentQ ? (
              <>
                {/* Progress bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#8b949e" }}>
                  <span>Question {currentQIndex + 1} of {currentQuiz.questions.length}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: "#21262d", color: "#58a6ff", fontSize: 11 }}>
                      {currentQuiz.module}
                    </span>
                    <span style={{ textTransform: "capitalize" }}>{currentQuiz.difficulty}</span>
                  </div>
                </div>

                <div style={{ height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${((currentQIndex + 1) / currentQuiz.questions.length) * 100}%`,
                      background: "#1f6feb",
                      transition: "width 0.2s ease"
                    }}
                  />
                </div>

                {/* Question */}
                <h4 style={{ margin: "10px 0 6px", fontSize: 16, lineHeight: 1.5, color: "#f0f6fc", fontWeight: 600 }}>
                  {currentQ.question}
                </h4>

                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQIndex] === optIdx;
                    const isCorrect = optIdx === currentQ.correctIndex;
                    let bg = "#0d1117";
                    let borderColor = "#30363d";
                    let textColor = "#c9d1d9";

                    if (showExplanation) {
                      if (isCorrect) {
                        bg = "rgba(46, 160, 67, 0.15)";
                        borderColor = "#2ea043";
                        textColor = "#3fb950";
                      } else if (isSelected) {
                        bg = "rgba(248, 81, 73, 0.15)";
                        borderColor = "#f85149";
                        textColor = "#ff7b72";
                      }
                    } else if (isSelected) {
                      bg = "#21262d";
                      borderColor = "#58a6ff";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQIndex, optIdx)}
                        disabled={showExplanation}
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          borderRadius: 8,
                          background: bg,
                          border: `1px solid ${borderColor}`,
                          color: textColor,
                          fontSize: 14,
                          lineHeight: 1.4,
                          cursor: showExplanation ? "default" : "pointer",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "#161b22",
                            border: "1px solid #30363d",
                            fontSize: 12,
                            flexShrink: 0
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {showExplanation && (
                  <div
                    style={{
                      background: "#0d1117",
                      border: "1px solid #238636",
                      borderRadius: 8,
                      padding: "14px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      animation: "fadeIn 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#3fb950" }}>
                        ✓ Official SAP Explanation
                      </span>
                      {currentQ.tcode && (
                        <span style={{ fontSize: 11, background: "#21262d", color: "#79c0ff", padding: "2px 8px", borderRadius: 4 }}>
                          T-Code: {currentQ.tcode}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#c9d1d9" }}>
                      {currentQ.explanation}
                    </p>
                    {currentQ.docRef && (
                      <div style={{ fontSize: 11, color: "#8b949e" }}>
                        Ref: <em>{currentQ.docRef}</em>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Controls */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  {showExplanation && (
                    <button
                      onClick={handleNextQuestion}
                      style={{
                        padding: "8px 24px",
                        background: "#1f6feb",
                        border: "none",
                        borderRadius: 6,
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(31,111,235,0.3)"
                      }}
                    >
                      {currentQIndex + 1 < currentQuiz.questions.length ? "Next Question →" : "Finish & View Score 🏆"}
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tab 2: Generate New Quiz */}
        {activeTab === "generate" && (
          <form onSubmit={handleGenerate} style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 6, textTransform: "uppercase" }}>
                Target Topic / Process
              </label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g. S/4HANA Sales Condition Technique, EWM Wave Management, qRFC Debugging..."
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#f0f6fc",
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 6, textTransform: "uppercase" }}>
                  SAP Module
                </label>
                <select
                  value={genModule}
                  onChange={(e) => setGenModule(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#f0f6fc",
                    fontSize: 13
                  }}
                >
                  {MODULES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 6, textTransform: "uppercase" }}>
                  Difficulty Level
                </label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#f0f6fc",
                    fontSize: 13
                  }}
                >
                  <option value="beginner">Associate / Fundamentals</option>
                  <option value="intermediate">Specialist / Consultant</option>
                  <option value="advanced">Principal / Enterprise Architect</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 6, textTransform: "uppercase" }}>
                  Question Count
                </label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#f0f6fc",
                    fontSize: 13
                  }}
                >
                  <option value={3}>3 Questions (Quick Sprint)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Full Assessment)</option>
                </select>
              </div>
            </div>

            <div style={{ background: "#0d1117", padding: 16, borderRadius: 8, border: "1px solid #21262d", fontSize: 13, color: "#8b949e", lineHeight: 1.5 }}>
              💡 <strong>AI Assessment Engine:</strong> Nexus generates questions evaluating realistic business exceptions, IMG customizing paths, and integration touchpoints between core ERP, decentralized warehouses, and cloud services.
            </div>

            <button
              type="submit"
              disabled={generating}
              style={{
                padding: "12px",
                background: generating ? "#21262d" : "#238636",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: generating ? "not-allowed" : "pointer",
                marginTop: 10,
                boxShadow: "0 2px 8px rgba(35,134,54,0.3)"
              }}
            >
              {generating ? "Synthesizing Practice Exam via Gemini..." : "⚡ Generate Practice Exam"}
            </button>
          </form>
        )}

        {/* Tab 3: History & Past Quizzes */}
        {activeTab === "history" && (
          <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Quick Stats banner */}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: 14, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#58a6ff" }}>{stats.totalAttempts}</div>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase" }}>Attempts Recorded</div>
                </div>
                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: 14, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#3fb950" }}>{stats.averageScorePercent}%</div>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase" }}>Average Mastery</div>
                </div>
                <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: 14, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#f0883e" }}>{stats.totalQuizzesGenerated}</div>
                  <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase" }}>Topics Explored</div>
                </div>
              </div>
            )}

            <h4 style={{ margin: "10px 0 4px", fontSize: 14, color: "#f0f6fc" }}>Past Quizzes</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f6fc" }}>{q.topic}</span>
                      <span style={{ padding: "1px 6px", borderRadius: 4, background: "#21262d", color: "#58a6ff", fontSize: 11 }}>
                        {q.module}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>
                      {q.questionCount} Questions • {q.attemptCount} Attempt(s) • Best Score: {q.highestScore !== null ? q.highestScore : "Not attempted"}
                    </div>
                  </div>
                  <button
                    onClick={() => loadSpecificQuiz(q.id)}
                    style={{
                      padding: "6px 14px",
                      background: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      color: "#c9d1d9",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Play →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
