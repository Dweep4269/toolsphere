import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ExternalLinkModal from "@/components/ExternalLinkModal";
import ToolIcon from "@/components/ToolIcon";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;

  const tool = await prisma.tool.findFirst({
    where: { slug, verified: true },
    select: {
      name: true,
      description: true,
      longDescription: true,
    },
  });

  if (!tool) {
    return {
      title: "Tool Not Found | ToolSphere",
    };
  }

  return {
    title: `${tool.name} | ToolSphere`,
    description: tool.longDescription || tool.description,
    openGraph: {
      title: `${tool.name} — ToolSphere`,
      description: tool.longDescription || tool.description,
      type: "article",
      siteName: "ToolSphere",
    },
  };
}

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { slug } = await params;

  const tool = await prisma.tool.findFirst({
    where: { slug, verified: true },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!tool) {
    notFound();
  }

  if (tool.status === "hidden") {
    notFound();
  }

  const displayDescription = tool.longDescription?.trim() || tool.description;
  const descriptionSourceLabel =
    tool.descriptionSource === "manual"
      ? "Curated by admin"
      : tool.descriptionSource === "ai-generated"
        ? "AI-generated"
        : tool.source === "fmhy"
          ? "Auto-imported from FMHY"
          : "Auto-imported";

  const features = (() => {
    try {
      const parsed = JSON.parse(tool.features) as string[];
      return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 16) : [];
    } catch {
      return [];
    }
  })();

  const tags = (() => {
    try {
      const parsed = JSON.parse(tool.tags) as string[];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return tool.tags ? tool.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    }
  })();

  // Fetch benchmark data if this tool has a matching model
  const benchmark = await prisma.benchmarkModel.findFirst({
    where: {
      OR: [
        { name: { contains: tool.name } },
        { name: { contains: tool.name.split(" ")[0] } },
      ],
    },
    select: { id: true, name: true, provider: true, scores: true, contextWindow: true, pricingInput: true, pricingOutput: true },
  });

  let benchmarkScores: Record<string, number> = {};
  if (benchmark) {
    try { benchmarkScores = JSON.parse(benchmark.scores) as Record<string, number>; } catch { /* noop */ }
  }

  // Fetch similar tools from same categories
  const categoryIds = tool.categories.map((c) => c.categoryId);
  let relatedTools: { id: string; name: string; slug: string; description: string; url: string; pricingType: string }[] = [];

  if (categoryIds.length > 0) {
    relatedTools = await prisma.tool.findMany({
      where: {
        verified: true,
        status: { not: "hidden" },
        id: { not: tool.id },
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        url: true,
        pricingType: true,
      },
      take: 6,
      orderBy: { ratingOverall: "desc" },
    });
  }

  return (
    <>
      <section className="section" id="tool-detail">
        <div className="section-inner">
          {/* Breadcrumb */}
          <nav style={{ marginBottom: "var(--space-6)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-faint)" }}>
              <Link href="/tools" style={{ color: "var(--text-muted)", transition: "color 200ms" }}>Tools</Link>
              {" / "}
              {tool.categories[0] && (
                <>
                  <Link href={`/categories/${tool.categories[0].category.slug}`} style={{ color: "var(--text-muted)", transition: "color 200ms" }}>
                    {tool.categories[0].category.name}
                  </Link>
                  {" / "}
                </>
              )}
              <span style={{ color: "var(--text-secondary)" }}>{tool.name}</span>
            </span>
          </nav>

          {/* Hero */}
          <div className="tool-detail-hero">
            <div className="tool-detail-icon">
              <ToolIcon name={tool.name} url={tool.url} size={72} />
            </div>
            <div className="tool-detail-header">
              <h1>{tool.name}</h1>
              <p className="tool-detail-desc">{displayDescription}</p>
              <div className="tool-detail-badges">
                {tool.verified && (
                  <span className="tool-badge tool-badge--verified">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    &nbsp;Verified
                  </span>
                )}
                <span className="tool-badge tool-badge--source">
                  Source: {tool.source === "fmhy" ? "FMHY" : tool.source.toUpperCase()}
                </span>
                <span className="tool-badge tool-badge--source">
                  {descriptionSourceLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="tool-detail-grid">
            {/* Left Column - Content */}
            <div>
              {/* Actions */}
              <div className="tool-action-row">
                <ExternalLinkModal url={tool.url} toolName={tool.name} className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  &nbsp;Visit official site
                </ExternalLinkModal>
                {tool.documentationUrl && (
                  <ExternalLinkModal url={tool.documentationUrl} toolName={tool.name} className="btn btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                    &nbsp;Documentation
                  </ExternalLinkModal>
                )}
                {tool.githubUrl && (
                  <ExternalLinkModal url={tool.githubUrl} toolName={tool.name} className="btn btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    &nbsp;GitHub
                  </ExternalLinkModal>
                )}
              </div>

              {/* Features */}
              {features.length > 0 && (
                <>
                  <hr className="tool-section-divider" />
                  <h2 className="section-title" style={{ fontSize: "1.25rem", marginBottom: "0" }}>Features</h2>
                  <div className="tool-features-grid">
                    {features.map((feature) => (
                      <div key={feature} className="tool-feature-item">
                        <svg className="tool-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Benchmark Scores */}
              {benchmark && Object.keys(benchmarkScores).length > 0 && (
                <>
                  <hr className="tool-section-divider" />
                  <h2 className="section-title" style={{ fontSize: "1.25rem", marginBottom: "var(--space-2)" }}>Benchmark Performance</h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
                    Matched: <strong style={{ color: "var(--text-secondary)" }}>{benchmark.name}</strong> by {benchmark.provider}
                    {" "}&bull;{" "}Context: {benchmark.contextWindow >= 1000000 ? `${(benchmark.contextWindow / 1000000).toFixed(1)}M` : `${(benchmark.contextWindow / 1000).toFixed(0)}K`} tokens
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
                    {Object.entries(benchmarkScores).filter(([, v]) => v > 0).map(([key, value]) => (
                      <div key={key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "var(--space-3)", textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: "700", color: value >= 90 ? "var(--gold)" : "var(--text)" }}>{value.toFixed(1)}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", textTransform: "capitalize", marginTop: "2px" }}>{key}</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/benchmarks" style={{ display: "inline-block", marginTop: "var(--space-3)", fontSize: "0.8rem", color: "var(--teal)" }}>
                    View full benchmark rankings &rarr;
                  </Link>
                </>
              )}

              {/* Categories & Tags */}
              {(tool.categories.length > 0 || tags.length > 0) && (
                <>
                  <hr className="tool-section-divider" />
                  <h2 className="section-title" style={{ fontSize: "1.25rem", marginBottom: "0" }}>Categories &amp; Tags</h2>
                  <div className="tool-category-chips">
                    {tool.categories.map(({ category }) => (
                      <Link key={category.id} href={`/categories/${category.slug}`} className="hero-tag" style={{ borderColor: category.color }}>
                        {category.name}
                      </Link>
                    ))}
                    {tags.map((tag) => (
                      <span key={tag} className="hero-tag">{tag}</span>
                    ))}
                    {tool.fmhySection && (
                      <span className="hero-tag" style={{ borderColor: "var(--teal)" }}>{tool.fmhySection}</span>
                    )}
                  </div>
                </>
              )}

              {/* Related Tools */}
              {relatedTools.length > 0 && (
                <>
                  <hr className="tool-section-divider" />
                  <h2 className="section-title" style={{ fontSize: "1.25rem", marginBottom: "var(--space-4)" }}>Similar Tools</h2>
                  <div className="tool-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                    {relatedTools.map((related) => (
                      <Link key={related.id} href={`/tools/${related.slug}`} className="tool-card" id={`related-${related.id}`}>
                        <div className="tool-card-header">
                          <div className="tool-icon" aria-hidden="true">
                            <ToolIcon name={related.name} url={related.url} size={28} />
                          </div>
                          <span className="tool-category-tag tag--ide">{related.pricingType}</span>
                        </div>
                        <h3 className="tool-name">{related.name}</h3>
                        <p className="tool-desc">{related.description}</p>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Info Panel */}
            <div>
              <div className="tool-info-panel">
                <div className="tool-info-panel-title">Tool Information</div>
                <div className="tool-info-rows">
                  <div className="tool-info-row">
                    <span className="tool-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      Rating
                    </span>
                    <span className="tool-info-value">{tool.ratingOverall?.toFixed(1) ?? "N/A"}</span>
                  </div>
                  <div className="tool-info-row">
                    <span className="tool-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                      Pricing
                    </span>
                    <span className="tool-info-value">{tool.pricingDetails || tool.pricingType}</span>
                  </div>
                  <div className="tool-info-row">
                    <span className="tool-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      Verified
                    </span>
                    <span className="tool-info-value">{tool.verified ? "Yes" : "No"}</span>
                  </div>
                  <div className="tool-info-row">
                    <span className="tool-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      Source
                    </span>
                    <span className="tool-info-value">{tool.source === "fmhy" ? "FMHY" : tool.source}</span>
                  </div>
                  <div className="tool-info-row">
                    <span className="tool-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      Added
                    </span>
                    <span className="tool-info-value">{new Date(tool.createdAt).toLocaleDateString()}</span>
                  </div>
                  {tool.ratingCount > 0 && (
                    <div className="tool-info-row">
                      <span className="tool-info-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                        Reviews
                      </span>
                      <span className="tool-info-value">{tool.ratingCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links Panel */}
              <div className="tool-info-panel" style={{ marginTop: "var(--space-4)" }}>
                <div className="tool-info-panel-title">Quick Links</div>
                <div className="tool-info-rows">
                  <div className="tool-info-row">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tool-info-label"
                      style={{ color: "var(--gold)", cursor: "pointer" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      Website
                    </a>
                  </div>
                  {tool.documentationUrl && (
                    <div className="tool-info-row">
                      <a
                        href={tool.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tool-info-label"
                        style={{ color: "var(--teal)", cursor: "pointer" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                        Docs
                      </a>
                    </div>
                  )}
                  {tool.githubUrl && (
                    <div className="tool-info-row">
                      <a
                        href={tool.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tool-info-label"
                        style={{ color: "var(--text-secondary)", cursor: "pointer" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        GitHub
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
