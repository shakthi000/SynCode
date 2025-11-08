import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaEdit, FaUser, FaCode, FaChartBar, FaSignOutAlt } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [usersRes, snippetsRes] = await Promise.all([
          axios.get("http://localhost:5000/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/snippets", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setUsers(usersRes.data);
        setSnippets(snippetsRes.data);
      } catch (err) {
        console.error(err);
        alert("Error fetching data. Make sure you are logged in as admin.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats
  const totalUsers = users.length;
  const totalSnippets = snippets.length;
  const snippetsPerLanguage = snippets.reduce((acc, s) => {
    const lang = s.language || "Unknown";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(snippetsPerLanguage),
    datasets: [
      {
        label: "Snippets per Language",
        data: Object.values(snippetsPerLanguage),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  if (loading) return <div className="loading">Loading admin panel...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f1c2f", color: "white" }}>
      {/* Sidebar */}
      <aside style={{ width: "250px", background: "#1a2a47", padding: "1rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Admin</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{ background: "transparent", border: "none", color: "white", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: activeTab === "dashboard" ? "bold" : "normal" }}
          >
            <FaChartBar /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            style={{ background: "transparent", border: "none", color: "white", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: activeTab === "users" ? "bold" : "normal" }}
          >
            <FaUser /> Users
          </button>
          <button
            onClick={() => setActiveTab("snippets")}
            style={{ background: "transparent", border: "none", color: "white", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: activeTab === "snippets" ? "bold" : "normal" }}
          >
            <FaCode /> Snippets
          </button>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ background: "transparent", border: "none", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem" }}>
        {activeTab === "dashboard" && (
          <>
            <h1 style={{ marginBottom: "1.5rem" }}>SynCode Dashboard 👩‍💻</h1>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "#1a2a47", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                <h3>Total Users</h3>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalUsers}</p>
              </div>
              <div style={{ flex: 1, background: "#1a2a47", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                <h3>Total Snippets</h3>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalSnippets}</p>
              </div>
            </div>
            <div style={{ background: "#1a2a47", padding: "1rem", borderRadius: "8px" }}>
              <h3>Snippets per Language</h3>
              <Bar data={chartData} />
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div>
            <h2>Users</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead style={{ background: "#1a2a47" }}>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid #27406f" }}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <button style={{ marginRight: "0.5rem" }}><FaEdit /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "snippets" && (
          <div>
            <h2>Snippets</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead style={{ background: "#1a2a47" }}>
                <tr>
                  <th>Username</th>
                  <th>Language</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {snippets.map((s) => (
                  <tr key={s._id} style={{ borderBottom: "1px solid #27406f" }}>
                    <td>{s.userId?.username || "Unknown"}</td>
                    <td>{s.language}</td>
                    <td><pre style={{ whiteSpace: "pre-wrap", maxHeight: "100px", overflowY: "auto" }}>{s.code}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
