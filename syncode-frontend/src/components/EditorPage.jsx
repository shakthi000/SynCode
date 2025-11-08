import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import io from "socket.io-client";
import "./editor.css";

const socket = io("http://localhost:5000");

const EditorPage = ({ code, setCode, language, setLanguage, output, setOutput, fetchSnippets, theme }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    socket.on("receive-code", (data) => setCode(data));
    return () => socket.off("receive-code");
  }, [setCode]);

  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit("code-change", value);
  };

  const runCode = async () => {
    if (!code.trim()) return setOutput("⚠️ Code is empty!");
    setIsRunning(true);
    setOutput("Running... ⏳");

    try {
      const languageMap = { python: "python", cpp: "c++", c: "c", java: "java", javascript: "javascript" };
      const res = await axios.post("http://localhost:5000/run", {
        language: languageMap[language],
        code,
      });
      setOutput(res.data.run.output || "No output");
    } catch (err) {
      setOutput("❌ Error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const saveSnippet = async () => {
    setIsSaving(true);
    try {
      await axios.post("http://localhost:5000/save", { language, code });
      setOutput("💾 Code saved successfully!");
      fetchSnippets();
    } catch (err) {
      setOutput("❌ Error saving snippet: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`editor-column ${theme}`}>
      <div className="editor-toolbar">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="python">🐍 Python</option>
          <option value="cpp">⚙️ C++</option>
          <option value="c">💡 C</option>
          <option value="java">☕ Java</option>
          <option value="javascript">⚡ JavaScript</option>
        </select>
        <div className="editor-buttons">
          <button onClick={runCode} disabled={isRunning}>
            {isRunning ? "🏃 Running..." : "Run ▶️"}
          </button>
          <button onClick={saveSnippet} disabled={isSaving}>
            {isSaving ? "💾 Saving..." : "Save"}
          </button>
        </div>
      </div>

      <Editor
        height="55vh"
        width="100%"
        theme={theme === "dark" ? "vs-dark" : "light"}
        language={language}
        value={code}
        onChange={handleCodeChange}
        options={{ fontSize: 16, minimap: { enabled: false }, scrollBeyondLastLine: false }}
      />

      <div className="output-box">
        <h4>🖥 Output Terminal</h4>
        <pre>{output}</pre>
      </div>
    </div>
  );
};

export default EditorPage;
