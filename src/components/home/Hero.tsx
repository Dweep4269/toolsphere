"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="hero" id="hero">
      <div className="hero-inner">
        <h1 className="hero-title">
          discover the <em className="hero-accent">right</em> AI tool
        </h1>
        <p className="hero-subtitle">
          Navigate the AI landscape with clarity. Find tools, compare
          alternatives, and make informed decisions — whether you&apos;re just
          getting started or building production systems.
        </p>
        <div className="search-container" id="search-container">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            id="search-input"
            placeholder="Search tools — try 'code editor', 'MCP server', 'voice clone'..."
            autoComplete="off"
          />
          <kbd className="search-kbd">/</kbd>
        </div>
        <div className="hero-tags">
          {[
            "MCPs",
            "Agent Skills",
            "Code & CLI",
            "Agentic IDEs",
            "Image Gen",
            "Audio & TTS",
            "Video",
            "Writing",
            "Research",
          ].map((tag) => (
            <span key={tag} className="hero-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
