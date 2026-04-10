import type { Metadata } from "next";
import prisma from "@/lib/db";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | ToolSphere",
  description: "Manage tools, drafts, and data sync operations.",
};

export default async function AdminPage() {
  const [tools, drafts, stats] = await Promise.all([
    prisma.tool.findMany({
      take: 1000,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        source: true,
        ratingOverall: true,
        pricingType: true,
        verified: true,
        status: true,
        url: true,
        description: true,
        longDescription: true,
        descriptionSource: true,
        documentationUrl: true,
        githubUrl: true,
        pricingDetails: true,
        fmhySection: true,
        tags: true,
        lastSyncedAt: true,
      },
    }),
    prisma.newsArticle.findMany({
      where: { status: "draft" },
      take: 20,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        status: true,
        authorName: true,
        readTime: true,
        publishedAt: true,
      },
    }),
    Promise.all([
      prisma.tool.count(),
      prisma.newsArticle.count(),
      prisma.newsArticle.count({ where: { status: "draft" } }),
      prisma.newsArticle.count({ where: { status: "published" } }),
    ]),
  ]);

  return (
    <section className="section" id="admin-dashboard">
      <div className="section-inner">
        <div className="section-header">
          <h1 className="section-title">Admin dashboard</h1>
          <p className="section-subtitle">Base-level management for tools, drafts, and ingestion syncs.</p>
        </div>

        <AdminDashboardClient
          initialTools={tools}
          initialDrafts={drafts}
          initialStats={{
            tools: stats[0],
            newsTotal: stats[1],
            drafts: stats[2],
            published: stats[3],
          }}
        />
      </div>
    </section>
  );
}
