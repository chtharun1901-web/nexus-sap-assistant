import React, { useState } from "react";
import { api } from "../api.js";
import InterviewChat from "../components/interview/InterviewChat.jsx";

export default function InterviewPrep() {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Send message through streamChat with interviewMode enabled
  const handleSendChat = async (text) => {
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const baseHistory = [...chatHistory, userMsg];
    const placeholderMsg = { role: "model", content: "" };
    setChatHistory([...baseHistory, placeholderMsg]);
    setLoading(true);

    try {
      const contents = baseHistory.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      let accumulated = "";
      await api.streamChat(
        {
          contents,
          interviewMode: true
        },
        (chunk, full) => {
          accumulated = full;
          setChatHistory([...baseHistory, { role: "model", content: full }]);
        }
      );

      setChatHistory([...baseHistory, { role: "model", content: accumulated || "Interview coaching analysis complete." }]);
    } catch (err) {
      setChatHistory([
        ...baseHistory,
        { role: "model", content: "⚠ Error contacting Nexus Interview Coach: " + err.message }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100%", width: "100%", background: "var(--bg-main)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <InterviewChat
        history={chatHistory}
        onSend={handleSendChat}
        loading={loading}
      />
    </div>
  );
}
