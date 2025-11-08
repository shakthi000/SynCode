import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import io from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard";
import "./dashboard.css";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const Dashboard = () => {
  const username = localStorage.getItem("username") || "User";
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token"); // ✅ get JWT token
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [snippets, setSnippets] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Real-time collaboration
  useEffect(() => {
    socket.on("receive-code", (data) => setCode(data));
    return () => socket.off("receive-code");
  }, []);

  // Fetch snippets
  useEffect(() => {
    const fetchSnippets = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`http://localhost:5000/snippets/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnippets(res.data);
        setPinned(res.data.filter((s) => s.pinned));
      } catch (err) {
        console.error("Error fetching snippets:", err);
      }
    };
    fetchSnippets();
  }, [userId, token]);

  // Handle code change
  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit("code-change", value);
  };

  // Run code
  const runCode = async () => {
    if (!code.trim()) {
      setOutput("⚠️ Code is empty!");
      return;
    }
    setIsRunning(true);
    setOutput("Running...");
    try {
      const languageMap = {
        python: "python",
        cpp: "c++",
        c: "c",
        java: "java",
        javascript: "javascript",
      };
      const res = await axios.post(
        "http://localhost:5000/run",
        { language: languageMap[language], code },
        { headers: { Authorization: `Bearer ${token}` } } // ✅ send token
      );
      const result = res.data.run?.output || "No output";
      setOutput(result);
      setRunHistory((prev) => [
        { code, language, output: result, time: new Date() },
        ...prev,
      ]);
    } catch (err) {
      setOutput("❌ Error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  // Save snippet
  const saveSnippet = async () => {
    if (!code.trim()) return;
    setIsSaving(true);
    try {
      await axios.post(
        "http://localhost:5000/save",
        { language, code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get(`http://localhost:5000/snippets/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnippets(res.data);
      setPinned(res.data.filter((s) => s.pinned));
      alert("✅ Snippet saved!");
    } catch (err) {
      alert("Error saving snippet: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete snippet
  const deleteSnippet = async (id) => {
    if (!window.confirm("Delete this snippet?")) return;
    try {
      await axios.delete(`http://localhost:5000/snippets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnippets(snippets.filter((s) => s._id !== id));
      setPinned(pinned.filter((s) => s._id !== id));
    } catch (err) {
      alert("Error deleting snippet: " + err.message);
    }
  };

  // Pin / unpin snippet
  const togglePin = async (sn) => {
    try {
      const updated = { ...sn, pinned: !sn.pinned };
      await axios.put(`http://localhost:5000/snippets/${sn._id}`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedSnippets = snippets.map((s) => (s._id === sn._id ? updated : s));
      setSnippets(updatedSnippets);
      setPinned(updatedSnippets.filter((s) => s.pinned));
    } catch (err) {
      alert("Error updating pin: " + err.message);
    }
  };

  // Download snippet
  const downloadSnippet = (sn) => {
    const element = document.createElement("a");
    const file = new Blob([sn.code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `snippet.${sn.language === "cpp" ? "cpp" : sn.language}`;
    document.body.appendChild(element);
    element.click();
  };

  // Clear output
  const clearOutput = () => setOutput("");

  // Logout
  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.clear();
      window.location.reload();
    }, 500);
  };

  return (
    <div className={`dashboard-container ${loggingOut ? "fade-out" : ""}`}>
      <header className="dashboard-header">
        <h2>🚀 Welcome, {username}</h2>
        <button className="logout-btn" onClick={handleLogout}>
          🔒 Logout
        </button>
        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <FaUserCircle
            size={30}
            style={{ cursor: "pointer" }}
            title="My Profile"
            onClick={() => navigate("/profile")}
          />
        </div>
      </header>

      <div className="toolbar">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="python">🐍 Python</option>
          <option value="cpp">⚙️ C++</option>
          <option value="c">💡 C</option>
          <option value="java">☕ Java</option>
          <option value="javascript">⚡ JavaScript</option>
        </select>
        <div>
          <button onClick={runCode} disabled={isRunning}>
            {isRunning ? "Running..." : "Run ▶️"}
          </button>
          <button onClick={saveSnippet} disabled={isSaving}>
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={clearOutput}>🧹 Clear Output</button>
        </div>
      </div>

      <Editor
        height="55vh"
        width="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={handleCodeChange}
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          fontFamily: "JetBrains Mono, monospace",
          scrollBeyondLastLine: false,
        }}
      />

      <div className="output-container">
        <h3>🖥 Output</h3>
        <pre>{output}</pre>
      </div>

      <div className="snippets-section">
        <h3>📜 Your Snippets</h3>
        <ul>
          {[...pinned, ...snippets.filter((s) => !s.pinned)].map((sn) => (
            <li key={sn._id} className={sn.pinned ? "pinned-snippet" : ""}>
              <div
                className="snippet-item"
                onClick={() => {
                  setCode(sn.code);
                  setLanguage(sn.language);
                }}
              >
                <strong>{sn.language}</strong> {sn.pinned && "⭐"} —{" "}
                <span>{new Date(sn.createdAt).toLocaleString()}</span>
              </div>
              <div className="snippet-actions">
                <button onClick={() => downloadSnippet(sn)}>💾 Download</button>
                <button onClick={() => togglePin(sn)}>
                  {sn.pinned ? "📌 Unpin" : "📌 Pin"}
                </button>
                <button onClick={() => deleteSnippet(sn._id)}>🗑️ Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
