import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";
import ToolIcon from "@/components/ToolIcon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tools | ToolSphere",
  description: "Browse and discover verified AI tools across coding, MCPs, voice, writing, and more.",
};

type ToolsPageProps = {
  searchParams: Promise<{ q?: string; tag?: string }>;
};

const POPULAR_TAGS = ["Foundation Model", "MCP Server", "Agent Skills", "CLI Skill", "App", "Coding", "Image", "Voice"];

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const { q, tag } = await searchParams;
  const query = q?.trim() ?? "";
  const selectedTag = tag?.trim() ?? "";

  const where = {
    verified: true, // Strict Security Enforcement
    status: { not: "hidden" },
    ...(query
      ? {
          OR: [{ name: { contains: query } }, { description: { contains: query } }, { longDescription: { contains: query } }],
        }
      : {}),
    ...(selectedTag
      ? {
          OR: [
            { fmhySection: { contains: selectedTag } },
            { tags: { contains: selectedTag } }
          ]
        }
      : {})
  };

  const tools = await prisma.tool.findMany({
    where,
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
    orderBy: [{ ratingOverall: "desc" }, { createdAt: "desc" }],
    take: 48,
  });

  return (
    <>
      <section className="section" id="tools-index">
        <div className="section-inner">
          <div className="section-header">
            <h1 className="section-title">Verified Library</h1>
            <p className="section-subtitle">
              {query
                ? `Search results for "${query}"`
                : "Browse our hand-curated library of premium AI utilities."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
             <Link 
               href="/tools"
               className={`admin-chip ${!selectedTag ? "active" : ""}`}
             >
               All
             </Link>
             {POPULAR_TAGS.map(t => (
               <Link 
                 key={t}
                 href={`/tools?tag=${encodeURIComponent(t)}`} 
                 className={`admin-chip ${selectedTag === t ? "active" : ""}`}
               >
                 {t}
               </Link>
             ))}
          </div>

          <div className="tool-grid">
            {tools.map((tool) => {
              const tagsStr = (tool as any).tags || "[]";
              const parsedTags = (() => {
                 try { return JSON.parse(tagsStr) as string[] } catch { return tagsStr.split(',').map((s: string)=>s.trim()) }
              })();
              const displayTags = [(tool as any).fmhySection, ...parsedTags].filter(Boolean);

              return (
                <article className="tool-card" key={tool.id} id={`tool-list-${tool.id}`}>
                  <div className="tool-card-header">
                    <div className="tool-icon" aria-hidden="true">
                      <ToolIcon name={tool.name} url={tool.url} size={28} />
                    </div>
                    <span className="tool-category-tag tag--ide">
                      {tool.categories[0]?.category.name ?? tool.fmhySection ?? "Tool"}
                    </span>
                  </div>

                  {tool.verified ? (
                    <span className="tool-badge tool-badge--verified">✓ Verified</span>
                  ) : null}

                  <h2 className="tool-name">
                    <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                  </h2>
                  <p className="tool-desc">{tool.description}</p>

                  {displayTags.length > 0 && (
                    <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                       {displayTags.slice(0, 3).map((t, idx) => (
                         <span key={idx} style={{ fontSize: "11px", backgroundColor: "var(--surface)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-faint)" }}>
                            {t}
                         </span>
                       ))}
                    </div>
                  )}

                  <div className="tool-meta" style={{ marginTop: "0.5rem" }}>
                    <span className="tool-rating">{tool.ratingOverall?.toFixed(1) ?? "N/A"}</span>
                    <span className="tool-pricing">{tool.pricingDetails ?? tool.pricingType}</span>
                  </div>
                </article>
              );
            })}
            
            {tools.length === 0 && (
               <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
                 No verified tools found for this combination.
               </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
