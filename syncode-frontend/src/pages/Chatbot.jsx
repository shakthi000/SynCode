import React, { useState } from "react";
import './Chatbot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { role: "system", text: "Hello! I'm your coding assistant 🤖" },
  ]);
  const [input, setInput] = useState("");

  // Hardcoded realistic AI responses
  const aiResponses = [
    {
      match: /hello|hi|hey/i,
      answer: "Hello there! 👋 How can I assist you with coding today?"
    },
    {
      match: /javascript|js/i,
      answer: "JavaScript is super versatile! Do you want a quick snippet example?"
    },
    {
      match: /python/i,
      answer: "Python is perfect for AI, web, and automation. Want a sample function?"
    },
    {
      match: /react/i,
      answer: "React helps you build interactive UIs efficiently. Need a component example?"
    },
    {
      match: /node|express/i,
      answer: "Node.js is great for backend work. Should I show a simple server setup?"
    },
    {
      match: /html/i,
      answer: "HTML is the backbone of the web. Want a simple template?"
    },
    {
      match: /css/i,
      answer: "CSS styles your webpages. Should I show a gradient or flexbox example?"
    },
    {
      match: /git/i,
      answer: "Git helps track code changes. Need basic commands or workflow tips?"
    },
    {
      match: /error|bug/i,
      answer: "Oh no! Can you give me the exact error message so I can help debug?"
    },
  ];

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    // Find AI response based on regex matching
    const found = aiResponses.find(r => r.match.test(input));
    const botMsg = {
      role: "bot",
      text: found ? found.answer : "Hmm 🤔 I don't have an answer for that yet, but I can try!"
    };

    // Simulate typing delay
    setTimeout(() => setMessages(prev => [...prev, botMsg]), 600);

    setInput("");
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
