import React, { useState } from "react";
import { API } from "../api";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      // Create new user
      await API.post("/signup", { username, email, password });

      // Auto-login after signup
      const loginRes = await API.post("/login", { email, password });
      localStorage.setItem("userId", loginRes.data.userId);
      localStorage.setItem("username", loginRes.data.username);
      localStorage.setItem("token", loginRes.data.token);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error creating account or logging in.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignup}>Signup</button>
      <p className="switch-auth">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Signup;
