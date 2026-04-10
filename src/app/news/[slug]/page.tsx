import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

type NewsDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });

  if (!article) {
    return { title: "News Not Found | ToolSphere" };
  }

  return {
    title: `${article.title} | ToolSphere News`,
    description: article.excerpt,
  };
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { slug } = await params;

  const article = await prisma.newsArticle.findUnique({
    where: { slug },
  });

  if (!article) {
    notFound();
  }

  if (!article.content?.trim() && article.sourceUrl) {
    redirect(article.sourceUrl);
  }

  return (
    <>
      <section className="section" id="news-detail">
        <div className="section-inner">
          <div className="section-header">
            <h1 className="section-title">{article.title}</h1>
            <p className="section-subtitle">{article.excerpt}</p>
          </div>
          <div className="tool-status">
            <span className="tool-badge tool-badge--source">{article.category}</span>
            <span className="tool-badge tool-badge--source">{article.readTime} min read</span>
            {article.sourceUrl ? (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Open original source
              </a>
            ) : null}
          </div>
          <article className="admin-section" style={{ marginTop: "1rem" }}>
            <div style={{ whiteSpace: "pre-wrap" }}>{article.content}</div>
          </article>
        </div>
      </section>
      <Footer />
    </>
  );
}
