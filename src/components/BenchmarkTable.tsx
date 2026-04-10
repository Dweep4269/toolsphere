"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ScoreMap = {
  overall?: number;
  coding?: number;
  reasoning?: number;
  creative?: number;
  multimodal?: number;
  math?: number;
  knowledge?: number;
};

type BenchmarkItem = {
  id: string;
  name: string;
  provider: string;
  releaseDate: Date | string;
  contextWindow: number;
  pricingInput: number;
  pricingOutput: number;
  scores: string;
};

type SortField = "score" | "name" | "provider" | "context" | "price" | "release";
type ScoreDomain = "overall" | "coding" | "reasoning" | "creative" | "multimodal" | "math" | "knowledge";

const DOMAINS: { key: ScoreDomain; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "coding", label: "Coding" },
  { key: "reasoning", label: "Reasoning" },
  { key: "math", label: "Math" },
  { key: "creative", label: "Creative" },
  { key: "multimodal", label: "Multimodal" },
  { key: "knowledge", label: "Knowledge" },
];

function parseScores(raw: string): ScoreMap {
  try {
    return JSON.parse(raw) as ScoreMap;
  } catch {
    return {};
  }
}

function formatContext(ctx: number): string {
  if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(1)}M`;
  if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}K`;
  return String(ctx);
}

function formatPrice(input: number, output: number): string {
  if (input === 0 && output === 0) return "Open Source";
  return `$${input}/$${output}`;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

export default function BenchmarkTable({ benchmarks }: { benchmarks: BenchmarkItem[] }) {
  const [domain, setDomain] = useState<ScoreDomain>("overall");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [providerFilter, setProviderFilter] = useState("all");
  const [search, setSearch] = useState("");

  const providers = useMemo(() => {
    const set = new Set(benchmarks.map((b) => b.provider));
    return Array.from(set).sort();
  }, [benchmarks]);

  const sorted = useMemo(() => {
    let items = benchmarks.map((b) => {
      const scores = parseScores(b.scores);
      return { ...b, parsedScores: scores, domainScore: scores[domain] ?? 0 };
    });

    if (providerFilter !== "all") {
      items = items.filter((b) => b.provider === providerFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((b) => b.name.toLowerCase().includes(q) || b.provider.toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "score": cmp = a.domainScore - b.domainScore; break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "provider": cmp = a.provider.localeCompare(b.provider); break;
        case "context": cmp = a.contextWindow - b.contextWindow; break;
        case "price": cmp = a.pricingInput - b.pricingInput; break;
        case "release": cmp = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return items;
  }, [benchmarks, domain, sortField, sortAsc, providerFilter, search]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return "↕";
    return sortAsc ? "↑" : "↓";
  }

  const maxScore = Math.max(...sorted.map((b) => b.domainScore), 1);

  return (
    <div className="benchmark-full">
      <div className="benchmark-controls">
        <div className="benchmark-domain-tabs">
          {DOMAINS.map((d) => (
            <button
              key={d.key}
              className={`tab-btn ${domain === d.key ? "active" : ""}`}
              onClick={() => setDomain(d.key)}
              type="button"
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="benchmark-filters">
          <input
            className="admin-input"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "220px" }}
          />
          <select
            className="admin-input"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            style={{ maxWidth: "180px" }}
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="benchmark-table-wrap">
        <table className="benchmark-data-table">
          <thead>
            <tr>
              <th className="bm-th bm-th-rank">#</th>
              <th className="bm-th bm-th-model" onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                Model {sortIcon("name")}
              </th>
              <th className="bm-th bm-th-provider" onClick={() => handleSort("provider")} style={{ cursor: "pointer" }}>
                Provider {sortIcon("provider")}
              </th>
              <th className="bm-th bm-th-score" onClick={() => handleSort("score")} style={{ cursor: "pointer" }}>
                {DOMAINS.find((d) => d.key === domain)?.label} Score {sortIcon("score")}
              </th>
              <th className="bm-th bm-th-bar">Performance</th>
              <th className="bm-th bm-th-ctx" onClick={() => handleSort("context")} style={{ cursor: "pointer" }}>
                Context {sortIcon("context")}
              </th>
              <th className="bm-th bm-th-price" onClick={() => handleSort("price")} style={{ cursor: "pointer" }}>
                $/1M tokens {sortIcon("price")}
              </th>
              <th className="bm-th bm-th-date" onClick={() => handleSort("release")} style={{ cursor: "pointer" }}>
                Released {sortIcon("release")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => {
              const toolSlug = toSlug(item.name);
              const barWidth = maxScore > 0 ? (item.domainScore / maxScore) * 100 : 0;

              return (
                <tr
                  key={item.id}
                  className={`bm-data-row ${idx === 0 ? "bm-data-row--first" : ""}`}
                >
                  <td className="bm-td bm-td-rank">
                    <span className={idx < 3 ? "bm-rank-medal" : ""}>{idx + 1}</span>
                  </td>
                  <td className="bm-td bm-td-model">
                    <Link href={`/tools/${toolSlug}`} className="bm-model-link">
                      {item.name}
                    </Link>
                  </td>
                  <td className="bm-td bm-td-provider">{item.provider}</td>
                  <td className="bm-td bm-td-score">
                    <span className="bm-score-value">{item.domainScore > 0 ? item.domainScore.toFixed(1) : "N/A"}</span>
                  </td>
                  <td className="bm-td bm-td-bar">
                    <div className="bm-perf-bar">
                      <div
                        className={`bm-perf-fill ${idx === 0 ? "bm-perf-fill--gold" : ""}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="bm-td bm-td-ctx">{formatContext(item.contextWindow)}</td>
                  <td className="bm-td bm-td-price">{formatPrice(item.pricingInput, item.pricingOutput)}</td>
                  <td className="bm-td bm-td-date">
                    {new Date(item.releaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No models match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="benchmark-legend">
        <p>
          Scores are composite aggregates from MMLU-Pro, HumanEval, ARC, GPQA, and public evaluations. 
          Pricing shown as input/output per 1M tokens. Click a model name to view its tool page.
        </p>
        <div className="benchmark-ext-links">
          <a href="https://chat.lmsys.org/?leaderboard" target="_blank" rel="noopener noreferrer">LMSYS Arena</a>
          <a href="https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard" target="_blank" rel="noopener noreferrer">HuggingFace LLM</a>
          <a href="https://aider.chat/docs/leaderboards/" target="_blank" rel="noopener noreferrer">Aider Coding</a>
        </div>
      </div>
    </div>
  );
}
