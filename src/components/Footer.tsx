"use client";

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("submitting");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "footer" }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      setStatus("success");
      setEmail("");
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch {
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="nav-logo">
              <svg className="logo-icon" viewBox="0 0 36 36" width="24" height="24" fill="none" stroke="#C8A87C" strokeWidth="1.2">
                <circle cx="18" cy="18" r="14" />
                <ellipse cx="18" cy="18" rx="8" ry="14" />
                <ellipse cx="18" cy="18" rx="14" ry="8" transform="rotate(90 18 18)" />
                <line x1="4" y1="18" x2="32" y2="18" strokeOpacity="0.5" />
              </svg>
              <span className="logo-text">ToolSphere</span>
            </Link>
            <p className="footer-tagline">Navigate the AI landscape with clarity.</p>
          </div>
          <div className="footer-newsletter">
            <h4 className="footer-newsletter-title">Stay in the loop</h4>
            <p className="footer-newsletter-desc">Weekly digest of the best new AI tools, no spam.</p>
            <form className="newsletter-form" id="newsletter-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                className="newsletter-input"
                id="newsletter-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting" || status === "success"}
              />
              <button
                type="submit" 
                className="newsletter-btn" 
                id="newsletter-submit"
                disabled={status === "submitting" || status === "success" || status === "error"}
                style={status === "success" ? { background: "var(--olive)" } : {}}
              >
                {status === "success" ? "Subscribed ✓" : status === "error" ? "Try again" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h5 className="footer-col-title">Discover</h5>
            <Link href="/tools" className="footer-link">All Tools</Link>
            <Link href="/categories/mcps" className="footer-link">MCPs</Link>
            <Link href="/categories/agent-skills" className="footer-link">Agent Skills</Link>
            <Link href="/categories/agentic-ides" className="footer-link">Agentic IDEs</Link>
          </div>
          <div className="footer-col">
            <h5 className="footer-col-title">Resources</h5>
            <Link href="/benchmarks" className="footer-link">Benchmarks</Link>
            <Link href="/tools" className="footer-link">Comparisons</Link>
            <Link href="/news" className="footer-link">News</Link>
            <Link href="/news" className="footer-link">Guides</Link>
          </div>
          <div className="footer-col">
            <h5 className="footer-col-title">Community</h5>
            <Link href="/tools" className="footer-link">Browse All Tools</Link>
            <a href="https://github.com/toolsphere" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
            <a href="https://discord.gg/toolsphere" target="_blank" rel="noopener noreferrer" className="footer-link">Discord</a>
            <a href="https://x.com/toolsphere" target="_blank" rel="noopener noreferrer" className="footer-link">Twitter / X</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copyright">&copy; 2026 ToolSphere. Built for the AI community.</span>
        </div>
      </div>
    </footer>
  );
}
