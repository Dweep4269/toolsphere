import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type NewsInput = {
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

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "draft";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 100);

  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ success: false, message: "Invalid status." }, { status: 400 });
  }

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ success: false, message: "Invalid page." }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  try {
    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where: { status },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.newsArticle.count({ where: { status } }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin news", error);
    return NextResponse.json({ success: false, message: "Failed to fetch news." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: NewsInput = {};
  try {
    body = (await request.json()) as NewsInput;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim();
  const content = body.content?.trim();
  const slug = toSlug(body.slug?.trim() || title || "");
  const category = body.category?.trim().toLowerCase() || "release";
  const status = body.status?.trim().toLowerCase() || "draft";
  const authorName = body.authorName?.trim() || "ToolSphere";
  const readTime = typeof body.readTime === "number" ? body.readTime : 4;

  if (!title || !excerpt || !content || !slug) {
    return NextResponse.json(
      { success: false, message: "title, excerpt, and content are required." },
      { status: 400 }
    );
  }

  if (!ALLOWED_CATEGORY.has(category) || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ success: false, message: "Invalid category or status." }, { status: 400 });
  }

  try {
    const created = await prisma.newsArticle.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        status,
        authorName,
        readTime,
        tags: "[]",
        publishedAt: status === "published" ? new Date() : null,
      },
      select: { id: true, slug: true, title: true, status: true },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create article", error);
    return NextResponse.json({ success: false, message: "Failed to create article." }, { status: 500 });
  }
}
