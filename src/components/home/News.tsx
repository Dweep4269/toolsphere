"use client";

import { useEffect, useState } from "react";
import { NewsArticle } from "@prisma/client";
import Link from "next/link";

type NewsTab = "all" | "releases" | "guides" | "analysis";

function getTagClass(category: string) {
  if (category === "release") return "news-tag news-tag--release";
  if (category === "analysis") return "news-tag news-tag--analysis";
  if (category === "guide") return "news-tag news-tag--guide";
  if (category === "breaking") return "news-tag news-tag--breaking";
  return "news-tag news-tag--release";
}

export default function News({ articles = [] }: { articles?: NewsArticle[] }) {
  const [activeTab, setActiveTab] = useState<NewsTab>("all");
  const [apiArticles, setApiArticles] = useState<NewsArticle[]>(articles);

  useEffect(() => {
    if (articles.length > 0) {
      return;
    }

    let isMounted = true;

    fetch("/api/news?status=published&limit=6")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load news");
        }
        return response.json() as Promise<{ data?: NewsArticle[] }>;
      })
      .then((payload) => {
        if (isMounted) {
          setApiArticles(payload.data ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiArticles([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [articles]);

  const filteredArticles = apiArticles.filter((article) => {
    if (activeTab === "all") return true;
    if (activeTab === "releases") return article.category === "release" || article.category === "breaking";
    if (activeTab === "guides") return article.category === "guide";
    if (activeTab === "analysis") return article.category === "analysis";
    return true;
  });

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
          {filteredArticles.map((article, index) => (
            <article
              className={`news-card ${index === 0 ? "news-card--featured" : ""}`}
              id={`news-${article.id}`}
              key={article.id}
            >
              <Link href={`/news/${article.slug}`} className="news-link-wrapper">
                <div className={getTagClass(article.category)}>{article.category}</div>
                <h3 className="news-title">{article.title}</h3>
                <p className="news-excerpt">{article.excerpt}</p>
                <div className="news-meta">
                  <time className="news-date">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Unscheduled"}
                  </time>
                  <span className="news-read">{article.readTime} min read</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
