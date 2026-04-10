import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const ALLOWED_STATUSES = ["draft", "published", "archived"] as const;
const ALLOWED_CATEGORIES = ["release", "guide", "analysis", "breaking", "opinion"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") ?? "published";
  const category = searchParams.get("category");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);

  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ success: false, message: "Invalid status." }, { status: 400 });
  }

  if (category && !ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
    return NextResponse.json({ success: false, message: "Invalid category." }, { status: 400 });
  }

  if (!Number.isFinite(page) || page < 1 || !Number.isFinite(limit) || limit < 1) {
    return NextResponse.json({ success: false, message: "Invalid pagination params." }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  try {
    const where = {
      status,
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.newsArticle.count({ where }),
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
    console.error("Failed to fetch news", error);
    return NextResponse.json({ success: false, message: "Failed to fetch news." }, { status: 500 });
  }
}
