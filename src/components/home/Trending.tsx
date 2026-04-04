"use client";

import { useState } from "react";
import { Tool } from "@prisma/client";

export default function Trending({ tools = [] }: { tools?: Tool[] }) {
  const [activeTab, setActiveTab] = useState<"today" | "week" | "month">("today");

  // Fallback to hardcoded array if DB fails/is empty for demo purposes
  const displayTools = tools.length > 0 ? tools : [
    {
      id: "fallback-1",
      name: "Cursor",
      description: "AI-first code editor with multi-model support and agentic workflows. Built on VS Code.",
      ratingOverall: 4.8,
      pricingDetails: "Free tier"
    },
    // Adding just one fallback ensures UI doesn't break entirely if DB is empty
  ];

  return (
    <section className="section section--alt" id="discover">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">What&apos;s trending</h2>
          <div className="tab-group" id="trending-tabs">
            <button
              className={`tab-btn ${activeTab === "today" ? "active" : ""}`}
              onClick={() => setActiveTab("today")}
            >
              Today
            </button>
            <button
              className={`tab-btn ${activeTab === "week" ? "active" : ""}`}
              onClick={() => setActiveTab("week")}
            >
              This Week
            </button>
            <button
              className={`tab-btn ${activeTab === "month" ? "active" : ""}`}
              onClick={() => setActiveTab("month")}
            >
              This Month
            </button>
          </div>
        </div>
        <div className="tool-grid" id="trending-grid">
          {displayTools.map((tool) => (
            <article className="tool-card" id={`tool-${tool.id}`} key={tool.id}>
              <div className="tool-card-header">
                <div className="tool-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                  </svg>
                </div>
                {/* Dynamically grabbing category based on relation if needed. For now, simple tag. */}
                <span className="tool-category-tag tag--ide">Tool</span>
              </div>
              <h3 className="tool-name">{tool.name}</h3>
              <p className="tool-desc">{tool.description}</p>
              <div className="tool-meta">
                <span className="tool-rating">
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="#C8A87C">
                    <path d="M8 .5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.3 3.8 13.5l.8-4.7L1.2 5.5l4.7-.7L8 .5z" />
                  </svg>{" "}
                  {tool.ratingOverall?.toFixed(1) || "N/A"}
                </span>
                <span className="tool-pricing">{tool.pricingDetails || "Unknown"}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
