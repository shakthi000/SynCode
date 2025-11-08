import React from "react";

const ChatMessage = ({ message }) => {
  const isBot = message.role === "bot";
  return (
    <div className={`chat-message ${isBot ? "bot" : "user"}`}>
      <span>{message.text}</span>
    </div>
  );
};

export default ChatMessage;
