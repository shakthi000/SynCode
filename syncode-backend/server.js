const express = require("express");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("./models/User");
const Snippet = require("./models/Snippet");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["*"],
  credentials: true
}));
app.use(express.json());

// 🧠 MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// ==========================
// 🔑 Middleware
// ==========================

// Protect routes (JWT authentication)
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid", error: err.message });
  }
};

// Role-based access
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  }
  next();
};

// ==========================
// 🔗 Piston API Helper
// ==========================
const getLatestVersion = async (language) => {
  try {
    const res = await axios.get("https://emkc.org/api/v2/piston/runtimes");
    const runtimes = res.data;
    const runtime = runtimes.find(
      r => r.language === language || r.aliases?.includes(language)
    );
    if (!runtime) throw new Error(`No runtime found for language: ${language}`);
    return runtime.version;
  } catch (err) {
    console.error("Error fetching runtime version:", err.message);
    return null;
  }
};

// ==========================
// 🔐 Auth Routes
// ==========================

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ username, email, password, role: role || "user" });
    await newUser.save();
    res.status(201).json({ message: "Signup successful! Please login." });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Error creating account", error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
  { id: user._id, role: user.role }, // ✅ include role in token
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.json({ 
  token, 
  username: user.username, 
  userId: user._id,
  role: user.role // ✅ send role to frontend
});
});


// ==========================
// 💬 Real-time collaboration
// ==========================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("code-change", (data) => socket.broadcast.emit("receive-code", data));
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// ==========================
// ▶️ Code Execution
// ==========================
app.post("/run", async (req, res) => {
  const { language, code } = req.body;
  if (!code || !code.trim()) return res.status(400).json({ message: "Code cannot be empty" });

  try {
    const version = await getLatestVersion(language);
    if (!version) return res.status(500).json({ error: "Could not find valid runtime version" });

    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version,
      files: [{ content: code }],
    });

    res.json(response.data);
  } catch (err) {
    console.error("Piston API Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ==========================
// 📝 Snippet Routes
// ==========================

// Save snippet (protected)
app.post("/save", protect, async (req, res) => {
  const { language, code } = req.body;
  try {
    const snippet = new Snippet({ userId: req.user._id, language, code });
    await snippet.save();
    res.status(201).json({ message: "Saved successfully", snippet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all snippets (admin only)
app.get("/snippets", protect, authorize("admin"), async (req, res) => {
  try {
    const snippets = await Snippet.find().sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get snippets of a user
app.get("/snippets/:userId", protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const snippets = await Snippet.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete snippet
app.delete("/snippets/:id", protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });
    if (snippet.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await snippet.deleteOne();
    res.json({ message: "Snippet deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update snippet
app.put("/snippets/:id", protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });
    if (snippet.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { code, language } = req.body;
    snippet.code = code || snippet.code;
    snippet.language = language || snippet.language;
    await snippet.save();

    res.json({ message: "Snippet updated successfully", snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
app.put("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, newPassword, currentPassword } = req.body;

    if (username) user.username = username;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password required" });
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });
      user.password = newPassword; // bcrypt handled in pre-save
    }

    await user.save();
    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

// ==========================
// 🚀 Server
// ==========================
server.listen(5000, () => console.log("🚀 Server running on port 5000"));
