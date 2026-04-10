import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Categories from "@/components/home/Categories";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";
import ToolIcon from "@/components/ToolIcon";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) {
    return {
      title: "Category Not Found | ToolSphere",
    };
  }

  const description =
    category.description ?? `Browse ${category.name} tools and discover top AI products in this category.`;

  return {
    title: `${category.name} Tools | ToolSphere`,
    description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category, categories, tools] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.tool.findMany({
      where: {
        verified: true,
        categories: {
          some: {
            category: {
              slug,
            },
          },
        },
      },
      orderBy: [{ ratingOverall: "desc" }, { createdAt: "desc" }],
      take: 300,
    }),
  ]);

  if (!category) {
    notFound();
  }

  const visibleTools = tools.filter((tool) => (tool as { status?: string }).status !== "hidden");

  return (
    <>
      <section className="section" id="category-hero">
        <div className="section-inner">
          <div className="section-header">
            <h1 className="section-title">{category.name}</h1>
            <p className="section-subtitle">
              {category.description ?? "Explore top-rated tools in this category."}
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt" id="category-tools">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Tools in {category.name}</h2>
            <p className="section-subtitle">Showing {visibleTools.length} results.</p>
          </div>
          <div className="tool-grid">
            {visibleTools.map((tool) => (
              <article className="tool-card" key={tool.id}>
                <div className="tool-card-header">
                  <div className="tool-icon" aria-hidden="true" style={{ marginBottom: "0.5rem" }}>
                    <ToolIcon name={tool.name} url={tool.url} size={28} />
                  </div>
                  <span className="tool-category-tag tag--ide">{category.name}</span>
                </div>
                <h3 className="tool-name">
                  <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                </h3>
                <p className="tool-desc">{tool.longDescription || tool.description}</p>
                <div className="tool-meta" style={{ marginTop: "0.5rem" }}>
                  <span className="tool-rating">{tool.ratingOverall?.toFixed(1) ?? "N/A"}</span>
                  <span className="tool-pricing">{tool.pricingType}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Categories categories={categories} />
      <Footer />
    </>
  );
}
