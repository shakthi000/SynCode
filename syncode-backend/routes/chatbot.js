const express = require("express");
const router = express.Router();
const axios = require("axios");
const multer = require("multer");
const { protect } = require("../middleware/auth");

const upload = multer(); // for parsing multipart/form-data

// Ask chatbot (RAG)
router.post("/ask", protect, async (req, res) => {
  const { question } = req.body;
  try {
    const response = await axios.post(
      "http://localhost:8000/api/rag/chat",
      { question, userId: req.user._id },
      { headers: { Authorization: req.headers.authorization } } // optional
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error calling RAG:", err.message);
    res.status(500).json({ error: "Error generating answer from RAG" });
  }
});

// Upload document to RAG
router.post("/uploadDoc", protect, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "File missing" });

    const formData = new FormData();
    formData.append("file", file.buffer, file.originalname);

    const response = await axios.post("http://localhost:8000/api/rag/uploadDocument", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: req.headers.authorization,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error uploading document:", err.message);
    res.status(500).json({ message: "Error uploading document", error: err.message });
  }
});

// Optional: add saved code snippet to RAG
router.post("/addSnippet", protect, async (req, res) => {
  const { snippetId, code } = req.body;
  try {
    const response = await axios.post(
      "http://localhost:8000/api/rag/uploadDocument",
      { file: code, name: `snippet-${snippetId}.txt` }, // simple way to send snippet
      { headers: { Authorization: req.headers.authorization } }
    );
    res.json({ message: "Snippet added to RAG", data: response.data });
  } catch (err) {
    console.error("Error adding snippet to RAG:", err.message);
    res.status(500).json({ error: "Failed to add snippet to RAG" });
  }
});

module.exports = router;
