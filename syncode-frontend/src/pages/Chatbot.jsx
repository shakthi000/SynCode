import React, { useState } from "react";
import axios from "axios";
import "./Chatbot.css";

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { role: "system", text: "Hello! I'm your coding assistant 🤖" },
  ]);
  const [input, setInput] = useState("");
  const token = localStorage.getItem("token");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const newMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    try {
      const res = await axios.post(
        "http://localhost:5000/chatbot/ask",
        { question: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, { role: "bot", text: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Error fetching AI response" },
      ]);
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbot-container">
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <strong>{msg.role === "bot" ? "AI" : "You"}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Syncode AI..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;
