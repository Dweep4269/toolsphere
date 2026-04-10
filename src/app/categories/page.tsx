import type { Metadata } from "next";
import Categories from "@/components/home/Categories";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories | ToolSphere",
  description: "Browse ToolSphere categories and jump into the AI tool space you care about most.",
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <section className="section" id="categories-index">
        <div className="section-inner">
          <div className="section-header">
            <h1 className="section-title">All categories</h1>
            <p className="section-subtitle">Explore AI tools by workflow, capability, and use case.</p>
          </div>
        </div>
      </section>
      <Categories categories={categories} />
      <Footer />
    </>
  );
}
