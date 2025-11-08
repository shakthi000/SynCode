// routes/chatbot.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { protect } = require("../middleware/auth");
const { addSnippet, querySnippet } = require("../utils/vectorStore");
const ChatLog = require("../models/ChatLog"); // New model for storing activity

// Path to your snippets JSON
const snippetsPath = path.join(__dirname, "../snippets.json");
let snippets = [];

// Load snippets from JSON on server start
try {
  const rawData = fs.readFileSync(snippetsPath, "utf8");
  snippets = JSON.parse(rawData);
  snippets.forEach(s => addSnippet(s.id, s.text));
  console.log(`Loaded ${snippets.length} snippets into vector store.`);
} catch (err) {
  console.error("Error loading snippets:", err);
}

// Chatbot endpoint (offline)
router.post("/ask", protect, async (req, res) => {
  const { question } = req.body;

  try {
    // Query relevant snippets
    const relevant = querySnippet(question, 3);

    const answer = relevant.length
      ? relevant.map((s, i) => `Snippet ${i + 1}:\n${s.text}`).join("\n\n")
      : "Sorry, I don't have any relevant snippets right now.";

    // Store chat activity in MongoDB
    await ChatLog.create({
      user: req.user.id,          // Added by `protect` middleware
      question,
      answer,
      snippetsReturned: relevant
    });

    res.json({ answer });
  } catch (err) {
    console.error("Error in chatbot:", err.message);
    res.status(500).json({ error: "Error generating answer" });
  }
});

module.exports = router;
