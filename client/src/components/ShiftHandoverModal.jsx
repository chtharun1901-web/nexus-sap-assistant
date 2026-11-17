import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

/**
 * ShiftHandoverModal
 * Feature #23: Audio Shift Handover Processor (Voice Memo to SOP)
 *
 * Ingests 2-5 minute shift voice memos from warehouse leads/supervisors,
 * extracts operational metrics (pending dispatches, damaged items, SMQ2 blockers,
 * queue tickets, B2/F2 postings), generates an executive SOP, and saves it
 * as a persistent Nexus Doc in SQLite.
 */
export default function ShiftHandoverModal({
  isOpen,
  onClose,
  onOpenDoc
}) {
  const [shift, setShift] = useState("Shift 2 (14:00-22:00)");
  const [plant, setPlant] = useState("TN03 / Mattress");
  const [supervisor, setSupervisor] = useState("Floor Lead");

  const [activeTab, setActiveTab] = useState("record"); // 'record' | 'upload'
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioFileSize, setAudioFileSize] = useState("");
  const [mimeType, setMimeType] = useState("audio/webm");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [error, setError] = useState(null);

  const [report, setReport] = useState(null);
  const [createdDoc, setCreatedDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const stageIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Clean up object URLs and recording streams on unmount or close
  useEffect(() => {
    return () => {
      cleanupMedia();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isProcessing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing]);

  function cleanupMedia() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (stageIntervalRef.current) {
      clearInterval(stageIntervalRef.current);
      stageIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      audioStreamRef.current = null;
    }
  }

  function handleClose() {
    if (isProcessing) return; // Prevent closing while API call in flight
    cleanupMedia();
    setIsRecording(false);
    onClose?.();
  }

  function resetState() {
    cleanupMedia();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBase64(null);
    setAudioFileName("");
    setAudioFileSize("");
    setRecordDuration(0);
    setError(null);
    setReport(null);
    setCreatedDoc(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Start Live Mic Recording
  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported by your browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let chosenMime = "audio/webm";
      if (window.MediaRecorder) {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          chosenMime = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          chosenMime = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          chosenMime = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType: chosenMime });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }

        const rawMime = recorder.mimeType || chosenMime || "audio/webm";
        const cleanMime = rawMime.split(";")[0].trim().toLowerCase();
        const blob = new Blob(audioChunksRef.current, { type: rawMime });
        audioChunksRef.current = [];

        if (blob.size < 200) {
          setError("Recorded voice audio was empty or too short. Please try again.");
          return;
        }

        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setMimeType(cleanMime);
        setAudioFileName(`voice_shift_handover_${Date.now()}.webm`);
        setAudioFileSize((blob.size / 1024).toFixed(1) + " KB");

        // Convert Blob to Base64
        try {
          const b64 = await blobToBase64(blob);
          setAudioBase64(b64);
        } catch (b64Err) {
          setError("Failed to process recorded audio data: " + b64Err.message);
        }
      };

      recorder.start(250); // Slice data every 250ms
      setIsRecording(true);
      setRecordDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (micErr) {
      setError("Microphone permission denied or audio device not found: " + micErr.message);
      setIsRecording(false);
    }
  }

  // Stop Live Mic Recording
  function stopRecording() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
  }

  // File Upload Handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validExtensions = [".mp3", ".wav", ".webm", ".m4a", ".ogg", ".aac"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext) && !file.type.startsWith("audio/")) {
      setError("Please select a supported audio file (.mp3, .wav, .webm, .m4a)");
      return;
    }

    try {
      const cleanMime = (file.type || "audio/webm").split(";")[0].trim().toLowerCase();
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      setMimeType(cleanMime);
      setAudioFileName(file.name);
      setAudioFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

      const b64 = await blobToBase64(file);
      setAudioBase64(b64);
    } catch (readErr) {
      setError("Failed to read audio file: " + readErr.message);
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64);
        } else {
          reject(new Error("FileReader did not return a base64 string"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Process Handover with Gemini 3.5 Multimodal
  async function handleProcess() {
    if (!audioBase64) {
      setError("Please record or upload a voice memo audio file first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStage("Ingesting warehouse audio stream with Gemini 3.5 Multimodal...");

    const stages = [
      "Transcribing supervisor operational telemetry & audio notes...",
      "Extracting stuck deliveries, dock doors & pending dispatches...",
      "Identifying open SMQ2 queues, handling units & lock table blockers...",
      "Auditing quality exceptions & B2-to-F2 posting change requirements...",
      "Formulating prioritized immediate action checklist for incoming shift...",
      "Persisting authoritative Shift Handover SOP into SQLite Nexus Docs..."
    ];
    let stageIdx = 0;
    stageIntervalRef.current = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setProcessingStage(stages[stageIdx]);
    }, 2400);

    try {
      const res = await api.processShiftHandover({
        audioBase64,
        mimeType: mimeType || "audio/webm",
        shift,
        supervisor: supervisor || "Floor Lead",
        plant: plant || "TN03 / Mattress"
      });

      if (res?.ok && res.report) {
        setReport(res.report);
        setCreatedDoc(res.doc || null);
      } else {
        throw new Error(res?.error || "Failed to process audio handover report");
      }
    } catch (procErr) {
      setError(procErr.message || "An unexpected error occurred during handover processing.");
    } finally {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
      setIsProcessing(false);
    }
  }

  function handleCopyReport() {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDuration(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          handleClose();
        }
      }}
    >
      <style>{`
        @keyframes shiftWaveBar {
          0%, 100% { height: 8px; opacity: 0.35; transform: scaleY(0.7); }
          50% { height: 38px; opacity: 1; transform: scaleY(1.1); }
        }
        @keyframes micPulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
          70% { box-shadow: 0 0 0 14px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes nexusSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          backgroundColor: "var(--bg-card, #1A1A1A)",
          border: "1px solid var(--border-strong, #333333)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          color: "var(--text-primary, #EDEDED)"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(138, 36, 53, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "linear-gradient(135deg, #8A2435 0%, #6E1A2D 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "0 4px 12px rgba(138, 36, 53, 0.3)"
              }}
            >
              🎧
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary, #FFFFFF)",
                  letterSpacing: "-0.01em"
                }}
              >
                Shift Handover Audio Processor
              </h2>
              <p
                style={{
                  margin: "3px 0 0 0",
                  fontSize: 12.5,
                  color: "var(--text-muted, #9CA3AF)"
                }}
              >
                Ingest floor supervisor voice memos into executive SOP & persistent Nexus Docs
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isProcessing}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted, #9CA3AF)",
              fontSize: 20,
              cursor: isProcessing ? "not-allowed" : "pointer",
              padding: "6px 10px",
              borderRadius: 8,
              lineHeight: 1
            }}
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body Container */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#EF4444",
                fontSize: 13,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#EF4444",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Mode 1: Initial Form & Audio Ingestion View */}
          {!report && !isProcessing && (
            <div>
              {/* Shift & Perimeter Metadata Selectors */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 14,
                  marginBottom: 20
                }}
              >
                {/* Shift Selector */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted, #9CA3AF)",
                      marginBottom: 6
                    }}
                  >
                    Shift Schedule
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      backgroundColor: "var(--bg-surface, #242424)",
                      border: "1px solid var(--border-subtle, #3A3A3A)",
                      color: "var(--text-primary, #EDEDED)",
                      fontSize: 13,
                      outline: "none"
                    }}
                  >
                    <option value="Shift 1 (06:00-14:00)">Shift 1 (06:00-14:00)</option>
                    <option value="Shift 2 (14:00-22:00)">Shift 2 (14:00-22:00)</option>
                    <option value="Shift 3 (22:00-06:00)">Shift 3 (22:00-06:00)</option>
                  </select>
                </div>

                {/* Plant Selector */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted, #9CA3AF)",
                      marginBottom: 6
                    }}
                  >
                    Plant / Warehouse
                  </label>
                  <select
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      backgroundColor: "var(--bg-surface, #242424)",
                      border: "1px solid var(--border-subtle, #3A3A3A)",
                      color: "var(--text-primary, #EDEDED)",
                      fontSize: 13,
                      outline: "none"
                    }}
                  >
                    <option value="TN03 / Mattress">TN03 / Mattress</option>
                    <option value="TN10 / Central Distribution">TN10 / Central Distribution</option>
                  </select>
                </div>

                {/* Supervisor Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted, #9CA3AF)",
                      marginBottom: 6
                    }}
                  >
                    Outgoing Supervisor
                  </label>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="Floor Lead / Supervisor Name"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "9px 12px",
                      borderRadius: 8,
                      backgroundColor: "var(--bg-surface, #242424)",
                      border: "1px solid var(--border-subtle, #3A3A3A)",
                      color: "var(--text-primary, #EDEDED)",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Ingestion Method Tabs: Live Mic vs File Upload */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  marginBottom: 16,
                  gap: 8
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("record")}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "record" ? "2px solid #8A2435" : "2px solid transparent",
                    color: activeTab === "record" ? "var(--text-primary, #FFF)" : "var(--text-muted, #9CA3AF)",
                    fontWeight: activeTab === "record" ? 600 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>🎙️</span>
                  <span>Live Mic Recording</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "upload" ? "2px solid #8A2435" : "2px solid transparent",
                    color: activeTab === "upload" ? "var(--text-primary, #FFF)" : "var(--text-muted, #9CA3AF)",
                    fontWeight: activeTab === "upload" ? 600 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>📁</span>
                  <span>Upload Audio File</span>
                </button>
              </div>

              {/* Tab 1: Live Mic Recording */}
              {activeTab === "record" && (
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 12,
                    backgroundColor: "var(--bg-surface, #212121)",
                    border: "1px dashed var(--border-subtle, #3A3A3A)",
                    textAlign: "center"
                  }}
                >
                  {!isRecording && !audioBase64 && (
                    <div>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          backgroundColor: "rgba(138, 36, 53, 0.15)",
                          color: "#8A2435",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 28,
                          margin: "0 auto 14px auto"
                        }}
                      >
                        🎙️
                      </div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 600 }}>
                        Record 2-5 Minute Shift Voice Memo
                      </h4>
                      <p
                        style={{
                          margin: "0 auto 18px auto",
                          fontSize: 12.5,
                          color: "var(--text-muted, #9CA3AF)",
                          maxWidth: 480,
                          lineHeight: 1.5
                        }}
                      >
                        Summarize warehouse orders, stuck deliveries at dock doors, SMQ2 queue locks,
                        damaged mattresses, and top priorities for incoming shift leads.
                      </p>
                      <button
                        type="button"
                        onClick={startRecording}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 8,
                          backgroundColor: "#8A2435",
                          border: "none",
                          color: "#FFFFFF",
                          fontSize: 13.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          boxShadow: "0 4px 14px rgba(138, 36, 53, 0.3)"
                        }}
                      >
                        <span>🔴</span>
                        <span>Start Recording</span>
                      </button>
                    </div>
                  )}

                  {/* Recording in progress */}
                  {isRecording && (
                    <div style={{ padding: "10px 0" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor: "rgba(220, 38, 38, 0.12)",
                          border: "1px solid rgba(220, 38, 38, 0.3)",
                          padding: "6px 14px",
                          borderRadius: 20,
                          marginBottom: 16
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: "#DC2626",
                            animation: "micPulseGlow 1.5s infinite"
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>
                          RECORDING LIVE MEMO: {formatDuration(recordDuration)}
                        </span>
                      </div>

                      {/* Live Waveform Preview */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          height: 48,
                          marginBottom: 20
                        }}
                      >
                        {Array.from({ length: 18 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 4,
                              borderRadius: 3,
                              background: "linear-gradient(180deg, #8A2435 0%, #D97706 100%)",
                              animation: `shiftWaveBar 0.9s ease-in-out infinite alternate`,
                              animationDelay: `${(i * 0.08).toFixed(2)}s`
                            }}
                          />
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                        <button
                          type="button"
                          onClick={stopRecording}
                          style={{
                            padding: "10px 22px",
                            borderRadius: 8,
                            backgroundColor: "#DC2626",
                            border: "none",
                            color: "#FFFFFF",
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <span>⏹️</span>
                          <span>Stop & Attach Recording</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopRecording();
                            resetState();
                          }}
                          style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            backgroundColor: "transparent",
                            border: "1px solid var(--border-subtle, #444)",
                            color: "var(--text-muted, #9CA3AF)",
                            fontSize: 13,
                            cursor: "pointer"
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Audio Recorded Preview */}
                  {!isRecording && audioBase64 && (
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>🎙️</span>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary, #FFF)" }}>
                              Recorded Voice Handover
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-muted, #9CA3AF)" }}>
                              {audioFileSize || "Audio clip"} · {mimeType}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={resetState}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#EF4444",
                            fontSize: 12.5,
                            cursor: "pointer",
                            textDecoration: "underline"
                          }}
                        >
                          Re-record
                        </button>
                      </div>

                      {audioUrl && (
                        <audio
                          controls
                          src={audioUrl}
                          style={{ width: "100%", height: 38, outline: "none", borderRadius: 6 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Upload Audio File */}
              {activeTab === "upload" && (
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 12,
                    backgroundColor: "var(--bg-surface, #212121)",
                    border: "1px dashed var(--border-subtle, #3A3A3A)",
                    textAlign: "center"
                  }}
                >
                  {!audioBase64 ? (
                    <div>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          backgroundColor: "rgba(59, 130, 246, 0.12)",
                          color: "#3B82F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 26,
                          margin: "0 auto 12px auto"
                        }}
                      >
                        📁
                      </div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 600 }}>
                        Upload Audio Voice Recording
                      </h4>
                      <p
                        style={{
                          margin: "0 auto 16px auto",
                          fontSize: 12.5,
                          color: "var(--text-muted, #9CA3AF)",
                          maxWidth: 440
                        }}
                      >
                        Supported formats: .mp3, .wav, .webm, .m4a (up to 25 MB)
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.webm,.m4a,.ogg,.aac,audio/*"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: "9px 22px",
                          borderRadius: 8,
                          backgroundColor: "#3B82F6",
                          border: "none",
                          color: "#FFFFFF",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8
                        }}
                      >
                        <span>📂</span>
                        <span>Browse Audio File</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>🎵</span>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary, #FFF)" }}>
                              {audioFileName || "Attached Audio File"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-muted, #9CA3AF)" }}>
                              {audioFileSize} · {mimeType}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={resetState}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#EF4444",
                            fontSize: 12.5,
                            cursor: "pointer",
                            textDecoration: "underline"
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      {audioUrl && (
                        <audio
                          controls
                          src={audioUrl}
                          style={{ width: "100%", height: 38, outline: "none", borderRadius: 6 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 24
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-subtle, #444)",
                    color: "var(--text-muted, #9CA3AF)",
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!audioBase64}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    background: audioBase64
                      ? "linear-gradient(135deg, #8A2435 0%, #6E1A2D 100%)"
                      : "var(--bg-surface, #2E2E2E)",
                    border: "none",
                    color: audioBase64 ? "#FFFFFF" : "var(--text-muted, #666)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: audioBase64 ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: audioBase64 ? "0 4px 16px rgba(138, 36, 53, 0.35)" : "none"
                  }}
                >
                  <span>⚡</span>
                  <span>Process Handover SOP</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Processing State with Pulsing Audio Waveform Animation */}
          {isProcessing && (
            <div
              style={{
                padding: "44px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {/* Pulsing Audio Waveform Animation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  height: 60,
                  marginBottom: 24
                }}
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      borderRadius: 4,
                      background: "linear-gradient(180deg, #8A2435 0%, #EAB308 50%, #10B981 100%)",
                      animation: "shiftWaveBar 0.85s ease-in-out infinite alternate",
                      animationDelay: `${(i * 0.05).toFixed(2)}s`
                    }}
                  />
                ))}
              </div>

              <h3 style={{ margin: "0 0 8px 0", fontSize: 17, fontWeight: 700 }}>
                Synthesizing Shift Handover SOP
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: 13.5,
                  color: "var(--orange, #D97706)",
                  fontFamily: "var(--font-mono, monospace)"
                }}
              >
                {processingStage}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: 12,
                  color: "var(--text-muted, #9CA3AF)",
                  marginTop: 8
                }}
              >
                <span>🏢 {plant}</span>
                <span>•</span>
                <span>⏱️ {shift}</span>
                <span>•</span>
                <span>👤 {supervisor}</span>
              </div>
            </div>
          )}

          {/* Mode 3: Generated Result View & Preview */}
          {report && !isProcessing && (
            <div>
              {/* Success Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 10,
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#10B981" }}>
                      Shift Handover SOP Generated & Saved
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted, #9CA3AF)" }}>
                      Persisted to Nexus Docs as "Shift Handover: {shift}"
                    </div>
                  </div>
                </div>

                {createdDoc?.id && (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontFamily: "var(--font-mono, monospace)",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      color: "var(--text-muted, #AAA)"
                    }}
                  >
                    Doc #{createdDoc.id.slice(0, 8)}
                  </span>
                )}
              </div>

              {/* Handover Report Preview Scrollable Box */}
              <div
                style={{
                  backgroundColor: "var(--bg-surface, #181818)",
                  border: "1px solid var(--border-subtle, #333)",
                  borderRadius: 10,
                  padding: "18px 20px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  fontFamily: "var(--font-sans, system-ui, sans-serif)",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "var(--text-primary, #EDEDED)",
                  whiteSpace: "pre-wrap",
                  marginBottom: 20
                }}
              >
                {report}
              </div>

              {/* Result Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      backgroundColor: "var(--bg-surface, #242424)",
                      border: "1px solid var(--border-subtle, #3A3A3A)",
                      color: "var(--text-primary, #FFF)",
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>{copied ? "✓" : "📋"}</span>
                    <span>{copied ? "Copied to Clipboard!" : "Copy Report"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetState}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      backgroundColor: "transparent",
                      border: "1px solid var(--border-subtle, #3A3A3A)",
                      color: "var(--text-muted, #9CA3AF)",
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>🔄</span>
                    <span>Ingest Another Memo</span>
                  </button>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 8,
                      backgroundColor: "transparent",
                      border: "1px solid var(--border-subtle, #444)",
                      color: "var(--text-muted, #9CA3AF)",
                      fontSize: 13,
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (createdDoc && onOpenDoc) {
                        onOpenDoc(createdDoc);
                      }
                      handleClose();
                    }}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 8,
                      backgroundColor: "#8A2435",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(138, 36, 53, 0.35)"
                    }}
                  >
                    <span>📄</span>
                    <span>Open in Nexus Docs Canvas</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
