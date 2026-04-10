"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials.");
    } else {
      router.push("/admin");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <form onSubmit={handleSubmit} style={{ background: "var(--surface)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border)", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ color: "var(--gold)", marginBottom: "1.5rem", fontSize: "1.5rem" }}>Admin Gateway</h1>
        
        {error && <p style={{ color: "red", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}
        
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--fg-muted)" }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", borderRadius: "8px" }}
            required
          />
        </div>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--fg-muted)" }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", borderRadius: "8px" }}
            required
          />
        </div>

        <button type="submit" style={{ width: "100%", padding: "0.75rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
          Sign In
        </button>
      </form>
    </div>
  );
}
