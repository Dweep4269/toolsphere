"use client";

import { useEffect, useRef, useState } from "react";
import { BenchmarkModel } from "@prisma/client";
import Link from "next/link";

type BenchmarkTab = "overall" | "coding" | "reasoning" | "creative";

type ScoreMap = {
  overall?: number;
  coding?: number;
  reasoning?: number;
  creative?: number;
};

function parseScores(raw: string): ScoreMap {
  try {
    const parsed = JSON.parse(raw) as ScoreMap;
    return parsed;
  } catch {
    return {};
  }
}

export default function Benchmarks({ benchmarks = [] }: { benchmarks?: BenchmarkModel[] }) {
  const [activeTab, setActiveTab] = useState<BenchmarkTab>("overall");
  const tableRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [apiBenchmarks, setApiBenchmarks] = useState<BenchmarkModel[]>(benchmarks);

  useEffect(() => {
    if (benchmarks.length > 0) {
      return;
    }

    let isMounted = true;

    fetch("/api/benchmarks")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load benchmarks");
        }
        return response.json() as Promise<{ data?: BenchmarkModel[] }>;
      })
      .then((payload) => {
        if (isMounted) {
          setApiBenchmarks(payload.data ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiBenchmarks([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [benchmarks]);

  const rankedBenchmarks = [...apiBenchmarks]
    .map((item) => {
      const scores = parseScores(item.scores);
      return {
        ...item,
        activeScore: scores[activeTab] ?? 0,
      };
    })
    .sort((a, b) => b.activeScore - a.activeScore)
    .slice(0, 6);

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
          
          {rankedBenchmarks.map((item, index) => (
            <div
              key={item.id}
              className={`benchmark-row ${index === 0 ? "benchmark-row--gold" : ""}`}
              id={`rank-${index + 1}`}
            >
              <span className="bm-rank">#{index + 1}</span>
              <Link href={`/tools/${item.name.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-")}`} className="bm-model" style={{ color: "inherit", textDecoration: "none" }}>{item.name}</Link>
              <span className="bm-provider">{item.provider}</span>
              <span className="bm-score">{item.activeScore.toFixed(1)}</span>
              <div className="bm-bar">
                <div 
                  className="bm-bar-fill" 
                  style={{ 
                    width: isVisible ? `${item.activeScore}%` : "0%",
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
