"use client";

import { useState } from "react";

export default function News() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="section section--news" id="news">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Latest in AI tools</h2>
          <div className="tab-group">
            <button 
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >All</button>
            <button 
              className={`tab-btn ${activeTab === "releases" ? "active" : ""}`}
              onClick={() => setActiveTab("releases")}
            >Releases</button>
            <button 
              className={`tab-btn ${activeTab === "guides" ? "active" : ""}`}
              onClick={() => setActiveTab("guides")}
            >Guides</button>
            <button 
              className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
              onClick={() => setActiveTab("analysis")}
            >Analysis</button>
          </div>
        </div>
        <div className="news-grid">
          <article className="news-card news-card--featured" id="news-1">
            <div className="news-tag news-tag--breaking">Breaking</div>
            <h3 className="news-title">Claude Code gets multi-agent orchestration with subagent dispatching</h3>
            <p className="news-excerpt">Anthropic&apos;s terminal-based coding tool gets a major upgrade with parallel task execution, autonomous workflows, and skill-based extensibility.</p>
            <div className="news-meta">
              <time className="news-date">2 hours ago</time>
              <span className="news-read">4 min read</span>
            </div>
          </article>
          <article className="news-card" id="news-2">
            <div className="news-tag news-tag--release">New Release</div>
            <h3 className="news-title">Gemini 2.5 Flash achieves near-Pro performance at 1/10th cost</h3>
            <p className="news-excerpt">Google&apos;s efficient model closes the gap with its flagship while maintaining blazing speeds.</p>
            <div className="news-meta">
              <time className="news-date">6 hours ago</time>
              <span className="news-read">3 min read</span>
            </div>
          </article>
          <article className="news-card" id="news-3">
            <div className="news-tag news-tag--guide">Guide</div>
            <h3 className="news-title">The complete guide to MCP servers in 2026</h3>
            <p className="news-excerpt">Everything about Model Context Protocol — from basics to building your own server.</p>
            <div className="news-meta">
              <time className="news-date">1 day ago</time>
              <span className="news-read">12 min read</span>
            </div>
          </article>
          <article className="news-card" id="news-4">
            <div className="news-tag news-tag--analysis">Analysis</div>
            <h3 className="news-title">Cursor vs Windsurf vs Claude Code: which agentic coding tool is right for you?</h3>
            <p className="news-excerpt">An in-depth comparison of the three leading AI coding tools for different workflows.</p>
            <div className="news-meta">
              <time className="news-date">2 days ago</time>
              <span className="news-read">8 min read</span>
            </div>
          </article>
          <article className="news-card" id="news-5">
            <div className="news-tag news-tag--release">New Tool</div>
            <h3 className="news-title">Suno v4.5 brings studio-quality mixing to AI music</h3>
            <p className="news-excerpt">The latest update adds multi-track editing, stem separation, and mastering tools.</p>
            <div className="news-meta">
              <time className="news-date">3 days ago</time>
              <span className="news-read">5 min read</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
