import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News | ToolSphere",
  description: "Read the latest AI tool news, updates, and analysis.",
};

export default async function NewsPage() {
  const [articles, verifiedTools] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.tool.findMany({
      where: { verified: true, status: { not: "hidden" } },
      select: { name: true, slug: true },
    }),
  ]);

  const toolLookup = new Map(verifiedTools.map((t) => [t.name.toLowerCase(), t.slug]));

  function findRelatedToolSlug(title: string): string | null {
    for (const [name, slug] of toolLookup) {
      if (title.toLowerCase().includes(name)) return slug;
    }
    return null;
  }

  return (
    <>
      <section className="section" id="news-index">
        <div className="section-inner">
          <div className="section-header">
            <h1 className="section-title">News</h1>
            <p className="section-subtitle">Latest updates in AI tools and ecosystems.</p>
          </div>
          <div className="news-grid">
            {articles.map((article) => {
              const relatedSlug = findRelatedToolSlug(article.title);
              return (
                <article key={article.id} className="news-card">
                  <Link href={`/news/${article.slug}`} className="news-link-wrapper">
                    <div className="news-tag news-tag--release">{article.category}</div>
                    <h3 className="news-title">{article.title}</h3>
                    <p className="news-excerpt">{article.excerpt}</p>
                    <div className="news-meta">
                      <time className="news-date">
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Unscheduled"}
                      </time>
                      <span className="news-read">{article.readTime} min read</span>
                    </div>
                  </Link>
                  {relatedSlug && (
                    <Link
                      href={`/tools/${relatedSlug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "var(--space-2)",
                        fontSize: "0.75rem",
                        color: "var(--teal)",
                        fontWeight: "500",
                        transition: "color 200ms ease",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      View tool page &rarr;
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
