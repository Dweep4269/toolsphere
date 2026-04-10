import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type ToolInput = {
  name?: string;
  slug?: string;
  description?: string;
  url?: string;
  pricingType?: string;
  pricingDetails?: string;
  ratingOverall?: number;
  source?: string;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 120);
}

function sanitizePricingType(input?: string) {
  const value = (input || "freemium").toLowerCase();
  if (["free", "freemium", "paid", "opensource"].includes(value)) return value;
  return "freemium";
}

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 100);

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ success: false, message: "Invalid page." }, { status: 400 });
  }

  const where = query
    ? {
        OR: [{ name: { contains: query } }, { description: { contains: query } }, { slug: { contains: query } }],
      }
    : undefined;

  const skip = (page - 1) * limit;

  try {
    const [items, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          categories: {
            include: { category: true },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.tool.count({ where }),
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
    console.error("Failed to fetch admin tools", error);
    return NextResponse.json({ success: false, message: "Failed to fetch tools." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: ToolInput = {};

  try {
    body = (await request.json()) as ToolInput;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const name = body.name?.trim();
  const description = body.description?.trim();
  const url = body.url?.trim();
  const slug = toSlug(body.slug?.trim() || name || "");

  if (!name || !description || !url || !slug) {
    return NextResponse.json(
      { success: false, message: "name, description, and url are required." },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.tool.create({
      data: {
        name,
        slug,
        description,
        descriptionSource: "manual",
        url,
        pricingType: sanitizePricingType(body.pricingType),
        pricingDetails: body.pricingDetails?.trim() || null,
        ratingOverall: typeof body.ratingOverall === "number" ? body.ratingOverall : null,
        source: body.source?.trim() || "manual",
        status: "active",
        features: "[]",
      },
      select: { id: true, slug: true, name: true },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create tool", error);
    return NextResponse.json({ success: false, message: "Failed to create tool." }, { status: 500 });
  }
}
