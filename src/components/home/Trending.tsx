"use client";

import { useState } from "react";
import { Tool } from "@prisma/client";
import Link from "next/link";
import ToolIcon from "@/components/ToolIcon";

export default function Trending({ tools = [] }: { tools?: any[] }) {
  const [activeTab, setActiveTab] = useState<"featured" | "verified" | "new">("featured");

  // Fallback to hardcoded array if DB fails/is empty for demo purposes
  const displayTools = tools.length > 0 ? tools : [
    {
      id: "fallback-1",
      slug: "cursor",
      name: "Cursor",
      description: "AI-first code editor with multi-model support and agentic workflows. Built on VS Code.",
      ratingOverall: 4.8,
      pricingDetails: "Free tier",
      verified: false,
    },
    // Adding just one fallback ensures UI doesn't break entirely if DB is empty
  ];

  const sortedTools = [...displayTools].sort((a, b) => {
    if (activeTab === "verified") {
      return Number(Boolean(b.verified)) - Number(Boolean(a.verified));
    }
    if (activeTab === "new") {
      const bDate = "createdAt" in b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aDate = "createdAt" in a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bDate - aDate;
    }
    return (b.ratingOverall || 0) - (a.ratingOverall || 0);
  });

  return (
    <section className="section section--alt" id="discover">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Popular picks</h2>
          <div className="tab-group" id="trending-tabs">
            <button
              className={`tab-btn ${activeTab === "featured" ? "active" : ""}`}
              onClick={() => setActiveTab("featured")}
            >
              Featured
            </button>
            <button
              className={`tab-btn ${activeTab === "verified" ? "active" : ""}`}
              onClick={() => setActiveTab("verified")}
            >
              Verified
            </button>
            <button
              className={`tab-btn ${activeTab === "new" ? "active" : ""}`}
              onClick={() => setActiveTab("new")}
            >
              New
            </button>
          </div>
        </div>
        <div className="tool-grid" id="trending-grid">
          {sortedTools.map((tool) => (
            <Link href={`/tools/${tool.slug}`} className="tool-card" id={`tool-${tool.id}`} key={tool.id}>
              <div className="tool-card-header">
                <div className="tool-icon">
                  <ToolIcon name={tool.name} url={tool.url} size={28} />
                </div>
                <span className="tool-category-tag tag--ide">{tool.fmhySection || "Tool"}</span>
              </div>
              <h3 className="tool-name">{tool.name}</h3>
              <p className="tool-desc">{tool.description}</p>
              {tool.verified ? (
                <span className="tool-badge tool-badge--verified">✓ Verified</span>
              ) : (
                <span className="tool-badge tool-badge--unverified">Unverified</span>
              )}
              <div className="tool-meta">
                <span className="tool-rating">
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="#C8A87C">
                    <path d="M8 .5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.3 3.8 13.5l.8-4.7L1.2 5.5l4.7-.7L8 .5z" />
                  </svg>{" "}
                  {tool.ratingOverall?.toFixed(1) || "N/A"}
                </span>
                <span className="tool-pricing">{tool.pricingDetails || "Unknown"}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
