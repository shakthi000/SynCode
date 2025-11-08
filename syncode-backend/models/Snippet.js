const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  language: String,
  code: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Snippet", snippetSchema);
