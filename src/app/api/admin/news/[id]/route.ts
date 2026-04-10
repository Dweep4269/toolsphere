import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type NewsPatchInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  status?: string;
  authorName?: string;
  readTime?: number;
};

const ALLOWED_STATUS = new Set(["draft", "published", "archived"]);
const ALLOWED_CATEGORY = new Set(["release", "guide", "analysis", "breaking", "opinion"]);

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 120);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  let body: NewsPatchInput = {};
  try {
    body = (await request.json()) as NewsPatchInput;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const updateData: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    status?: string;
    authorName?: string;
    readTime?: number;
    publishedAt?: Date | null;
  } = {};

  if (typeof body.title === "string" && body.title.trim()) updateData.title = body.title.trim();
  if (typeof body.slug === "string" && body.slug.trim()) updateData.slug = toSlug(body.slug);
  if (typeof body.excerpt === "string" && body.excerpt.trim()) updateData.excerpt = body.excerpt.trim();
  if (typeof body.content === "string" && body.content.trim()) updateData.content = body.content.trim();
  if (typeof body.authorName === "string" && body.authorName.trim()) updateData.authorName = body.authorName.trim();
  if (typeof body.readTime === "number" && body.readTime > 0) updateData.readTime = body.readTime;

  if (typeof body.category === "string") {
    const category = body.category.toLowerCase().trim();
    if (!ALLOWED_CATEGORY.has(category)) {
      return NextResponse.json({ success: false, message: "Invalid category." }, { status: 400 });
    }
    updateData.category = category;
  }

  if (typeof body.status === "string") {
    const status = body.status.toLowerCase().trim();
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ success: false, message: "Invalid status." }, { status: 400 });
    }
    updateData.status = status;

    if (status === "published") {
      updateData.publishedAt = new Date();
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, message: "No valid fields provided." }, { status: 400 });
  }

  try {
    const updated = await prisma.newsArticle.update({
      where: { id },
      data: updateData,
      select: { id: true, slug: true, title: true, status: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update article", error);
    return NextResponse.json({ success: false, message: "Failed to update article." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    await prisma.newsArticle.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Article deleted." });
  } catch (error) {
    console.error("Failed to delete article", error);
    return NextResponse.json({ success: false, message: "Failed to delete article." }, { status: 500 });
  }
}
