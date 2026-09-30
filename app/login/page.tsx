"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Boxes } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/login", { cache: "no-store" })
      .then(response => response.json())
      .then(result => setConfigured(Boolean((result as { configured?: boolean }).configured)))
      .catch(() => setConfigured(false));
  }, []);

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
      {configured === false ? <>
        <h1>Office Stock is almost ready</h1>
        <p>The team access password still needs to be set by the office admin. Once it is set, reload this page to sign in.</p>
      </> : <>
        <h1>Welcome back</h1>
        <p>Enter the team access password to manage office supplies.</p>
        <label htmlFor="access-password">Access password</label>
        <input id="access-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={configured !== true} />
        {error && <div className="error" role="alert">{error}</div>}
        <button className="primary-button" disabled={loading || configured !== true}>{configured === null ? "Checking access…" : loading ? "Signing in…" : "Sign in"}</button>
      </>}
    </form>
  </main>;
}

