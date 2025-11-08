import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css"; // We'll style it with CSS for dark blue theme

const Profile = () => {
  const userId = localStorage.getItem("userId");
  const [profile, setProfile] = useState({ username: "", email: "", avatar: "" });
  const [file, setFile] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [runHistory, setRunHistory] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchSnippets = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/snippets/${userId}`);
        setSnippets(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchRunHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/run-history/${userId}`);
        setRunHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchSnippets();
    fetchRunHistory();
  }, [userId]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("username", profile.username);
    formData.append("email", profile.email);
    if (file) formData.append("avatar", file);

    try {
      await axios.put(`http://localhost:5000/users/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Profile updated!");
      if (file) {
        const avatarUrl = URL.createObjectURL(file);
        setProfile({ ...profile, avatar: avatarUrl });
      }
    } catch (err) {
      alert("Error updating profile: " + err.message);
    }
  };

  return (
    <div className="profile-page">
      <h2>👤 My Profile</h2>

      <div className="profile-card">
        <div className="avatar-section">
          <img
            src={file ? URL.createObjectURL(file) : profile.avatar || "/default-avatar.png"}
            alt="avatar"
            className="avatar"
          />
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>

        <div className="profile-details">
          <input
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            placeholder="Username"
          />
          <input
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Email"
          />
          <button onClick={handleSave}>💾 Save</button>
        </div>
      </div>

      <div className="activity-section">
        <h3>📜 Snippets</h3>
        <table>
          <thead>
            <tr>
              <th>Language</th>
              <th>Created At</th>
              <th>Pinned</th>
            </tr>
          </thead>
          <tbody>
            {snippets.map((sn) => (
              <tr key={sn._id}>
                <td>{sn.language}</td>
                <td>{new Date(sn.createdAt).toLocaleString()}</td>
                <td>{sn.pinned ? "⭐" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>🖥 Run History</h3>
        <table>
          <thead>
            <tr>
              <th>Language</th>
              <th>Output</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {runHistory.map((run, index) => (
              <tr key={index}>
                <td>{run.language}</td>
                <td>
                  <pre>{run.output}</pre>
                </td>
                <td>{new Date(run.time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profile;
