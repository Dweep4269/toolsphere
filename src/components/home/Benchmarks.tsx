"use client";

import { useEffect, useRef, useState } from "react";

export default function Benchmarks() {
  const [activeTab, setActiveTab] = useState<"overall" | "coding" | "reasoning" | "creative">("overall");
  const tableRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (tableRef.current) {
      observer.observe(tableRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section section--benchmarks" id="benchmarks">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Model rankings</h2>
          <div className="section-header-right">
            <div className="tab-group" id="benchmark-tabs">
              <button 
                className={`tab-btn ${activeTab === "overall" ? "active" : ""}`}
                onClick={() => setActiveTab("overall")}
              >Overall</button>
              <button 
                className={`tab-btn ${activeTab === "coding" ? "active" : ""}`}
                onClick={() => setActiveTab("coding")}
              >Coding</button>
              <button 
                className={`tab-btn ${activeTab === "reasoning" ? "active" : ""}`}
                onClick={() => setActiveTab("reasoning")}
              >Reasoning</button>
              <button 
                className={`tab-btn ${activeTab === "creative" ? "active" : ""}`}
                onClick={() => setActiveTab("creative")}
              >Creative</button>
            </div>
            <a href="/benchmarks" className="section-link">Full rankings &rarr;</a>
          </div>
        </div>
        <div className="benchmark-table" id="benchmark-table" ref={tableRef}>
          <div className="benchmark-header-row">
            <span className="bm-rank">Rank</span>
            <span className="bm-model">Model</span>
            <span className="bm-provider">Provider</span>
            <span className="bm-score">Score</span>
            <span className="bm-bar"></span>
          </div>
          
          {[
            { rank: 1, model: "Claude Opus 4", provider: "Anthropic", score: 94.2, color: "gold" },
            { rank: 2, model: "Gemini 2.5 Pro", provider: "Google", score: 93.1 },
            { rank: 3, model: "GPT-5", provider: "OpenAI", score: 91.8 },
            { rank: 4, model: "Grok 3", provider: "xAI", score: 89.4 },
            { rank: 5, model: "DeepSeek R2", provider: "DeepSeek", score: 88.7 },
            { rank: 6, model: "Llama 4 Maverick", provider: "Meta", score: 86.3 },
          ].map((item, index) => (
            <div key={item.rank} className={`benchmark-row ${item.color === 'gold' ? 'benchmark-row--gold' : ''}`} id={`rank-${item.rank}`}>
              <span className="bm-rank">#{item.rank}</span>
              <span className="bm-model">{item.model}</span>
              <span className="bm-provider">{item.provider}</span>
              <span className="bm-score">{item.score}</span>
              <div className="bm-bar">
                <div 
                  className="bm-bar-fill" 
                  style={{ 
                    width: isVisible ? `${item.score}%` : "0%",
                    transitionDelay: `${index * 100}ms`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <p className="benchmark-note">Composite scores across MMLU-Pro, HumanEval, ARC, GPQA. Updated weekly. <a href="#" style={{ color: "var(--teal)" }}>Methodology →</a></p>
      </div>
    </section>
  );
}
