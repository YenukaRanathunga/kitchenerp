"use client";

import { useState, type FormEvent } from "react";
import { Boxes } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-shell">
    <form className="login-card" onSubmit={submit}>
      <div className="brand"><span className="brand-mark"><Boxes size={22}/></span><div><strong>Office Stock</strong><small>Shared inventory</small></div></div>
      <h1>Welcome back</h1>
      <p>Enter the team access password to manage office supplies.</p>
      <label htmlFor="access-password">Access password</label>
      <input id="access-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
      {error && <div className="error" role="alert">{error}</div>}
      <button className="primary-button" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
