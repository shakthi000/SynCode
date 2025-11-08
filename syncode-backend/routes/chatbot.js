// routes/chatbot.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { protect } = require("../middleware/auth");
const { addSnippet, querySnippet } = require("../utils/vectorStore");

// Load snippets from JSON file dynamically
const snippetsPath = path.join(__dirname, "../snippets.json");
let snippets = [];

// Read snippets once on server start
try {
  const rawData = fs.readFileSync(snippetsPath, "utf8");
  snippets = JSON.parse(rawData);
  // Add all snippets to your vector store
  snippets.forEach(s => addSnippet(s.id, s.text));
  console.log(`Loaded ${snippets.length} snippets into vector store.`);
} catch (err) {
  console.error("Error loading snippets:", err);
}

// Chatbot endpoint (fully offline)
router.post("/ask", protect, async (req, res) => {
  const { question } = req.body;
  try {
    const relevant = querySnippet(question, 3);

    const answer = relevant.length
      ? relevant.map((s, i) => `Snippet ${i + 1}:\n${s.text}`).join("\n\n")
      : "Sorry, I don't have any relevant snippets right now.";

    res.json({ answer });
  } catch (err) {
    console.error("Error in chatbot:", err.message);
    res.status(500).json({ error: "Error generating answer" });
  }
});

module.exports = router;
