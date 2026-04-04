"use client";

import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("submitting");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }, 1000);
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="/" className="nav-logo">
              <svg className="logo-icon" viewBox="0 0 36 36" width="24" height="24" fill="none" stroke="#C8A87C" strokeWidth="1.2">
                <circle cx="18" cy="18" r="14" />
                <ellipse cx="18" cy="18" rx="8" ry="14" />
                <ellipse cx="18" cy="18" rx="14" ry="8" transform="rotate(90 18 18)" />
                <line x1="4" y1="18" x2="32" y2="18" strokeOpacity="0.5" />
              </svg>
              <span className="logo-text">ToolSphere</span>
            </a>
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
                disabled={status === "submitting" || status === "success"}
                style={status === "success" ? { background: "var(--olive)" } : {}}
              >
                {status === "success" ? "Subscribed ✓" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h5 className="footer-col-title">Discover</h5>
            <a href="#" className="footer-link">All Tools</a>
            <a href="#" className="footer-link">MCPs</a>
            <a href="#" className="footer-link">Agent Skills</a>
            <a href="#" className="footer-link">Agentic IDEs</a>
          </div>
          <div className="footer-col">
            <h5 className="footer-col-title">Resources</h5>
            <a href="/benchmarks" className="footer-link">Benchmarks</a>
            <a href="#" className="footer-link">Comparisons</a>
            <a href="#" className="footer-link">News</a>
            <a href="#" className="footer-link">Guides</a>
          </div>
          <div className="footer-col">
            <h5 className="footer-col-title">Community</h5>
            <a href="#" className="footer-link">Submit a Tool</a>
            <a href="#" className="footer-link">GitHub</a>
            <a href="#" className="footer-link">Discord</a>
            <a href="#" className="footer-link">Twitter / X</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copyright">&copy; 2026 ToolSphere. Built for the AI community.</span>
        </div>
      </div>
    </footer>
  );
}
