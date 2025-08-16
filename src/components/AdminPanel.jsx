import React, { useState } from "react";

const API_URL = import.meta.env.VITE_BACKEND_URL; // Backend URL from env

export default function AdminPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [code, setCode] = useState(null);
  const [error, setError] = useState("");

  // ✅ Handle login
  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        setLoggedIn(true);
        setError("");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  }

  // ✅ Generate code
  async function generateCode() {
    try {
      const res = await fetch(`${API_URL}/api/admin/generate-code`);
      const data = await res.json();
      if (data.success) {
        setCode(data.code);
      }
    } catch (err) {
      setError("Failed to generate code.");
    }
  }

  return (
    <div>
      {!loggedIn ? (
        <form onSubmit={handleLogin}>
          <h2>Admin Login</h2>
          <p><b>Default username:</b> admin<br/><b>Password:</b> thesecret</p>
          <input
            type="text"
            placeholder="Username or ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      ) : (
        <div>
          <h2>Admin Panel</h2>
          <button onClick={generateCode}>Generate 5-Digit Code</button>
          {code && <h3>Your Code: {code}</h3>}
        </div>
      )}
    </div>
  );
}
