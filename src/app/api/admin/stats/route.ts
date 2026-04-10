import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const [tools, newsTotal, drafts, published] = await Promise.all([
      prisma.tool.count(),
      prisma.newsArticle.count(),
      prisma.newsArticle.count({ where: { status: "draft" } }),
      prisma.newsArticle.count({ where: { status: "published" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { tools, newsTotal, drafts, published },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats." },
      { status: 500 }
    );
  }
}
