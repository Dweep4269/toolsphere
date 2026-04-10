import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type ToolPatchInput = {
  name?: string;
  slug?: string;
  description?: string;
  longDescription?: string | null;
  descriptionSource?: string;
  url?: string;
  documentationUrl?: string | null;
  githubUrl?: string | null;
  pricingType?: string;
  pricingDetails?: string | null;
  ratingOverall?: number | null;
  verified?: boolean;
  status?: string;
  tags?: string;
  fmhySection?: string | null;
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
  if (!input) return undefined;
  const value = input.toLowerCase();
  if (["free", "freemium", "paid", "opensource"].includes(value)) return value;
  return undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  let body: ToolPatchInput = {};
  try {
    body = (await request.json()) as ToolPatchInput;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const updateData: {
    name?: string;
    slug?: string;
    description?: string;
    longDescription?: string | null;
    descriptionSource?: string;
    url?: string;
    documentationUrl?: string | null;
    githubUrl?: string | null;
    pricingType?: string;
    pricingDetails?: string | null;
    ratingOverall?: number | null;
    verified?: boolean;
    status?: string;
    tags?: string;
    fmhySection?: string | null;
  } = {};

  if (typeof body.name === "string" && body.name.trim()) updateData.name = body.name.trim();
  if (typeof body.slug === "string" && body.slug.trim()) updateData.slug = toSlug(body.slug);
  if (typeof body.description === "string" && body.description.trim()) updateData.description = body.description.trim();
  if (typeof body.longDescription === "string") updateData.longDescription = body.longDescription.trim();
  if (body.longDescription === null) updateData.longDescription = null;
  if (typeof body.descriptionSource === "string" && body.descriptionSource.trim()) {
    const descriptionSource = body.descriptionSource.trim().toLowerCase();
    if (["raw", "manual", "ai-generated"].includes(descriptionSource)) {
      updateData.descriptionSource = descriptionSource;
    }
  }
  if (typeof body.url === "string" && body.url.trim()) updateData.url = body.url.trim();
  if (typeof body.documentationUrl === "string") updateData.documentationUrl = body.documentationUrl.trim();
  if (body.documentationUrl === null) updateData.documentationUrl = null;
  if (typeof body.githubUrl === "string") updateData.githubUrl = body.githubUrl.trim();
  if (body.githubUrl === null) updateData.githubUrl = null;
  if (typeof body.pricingDetails === "string") updateData.pricingDetails = body.pricingDetails.trim();
  if (body.pricingDetails === null) updateData.pricingDetails = null;
  if (typeof body.ratingOverall === "number" || body.ratingOverall === null) {
    updateData.ratingOverall = body.ratingOverall;
  }
  if (typeof body.verified === "boolean") updateData.verified = body.verified;
  if (typeof body.status === "string" && body.status.trim()) {
    const status = body.status.trim().toLowerCase();
    if (["active", "hidden", "pending"].includes(status)) {
      updateData.status = status;
    }
  }
  if (typeof body.tags === "string") updateData.tags = body.tags;
  if (typeof body.fmhySection === "string") updateData.fmhySection = body.fmhySection;
  if (body.fmhySection === null) updateData.fmhySection = null;

  const pricingType = sanitizePricingType(body.pricingType);
  if (pricingType) updateData.pricingType = pricingType;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, message: "No valid fields provided." }, { status: 400 });
  }

  try {
    const updated = await prisma.tool.update({
      where: { id },
      data: updateData,
      select: { id: true, slug: true, name: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update tool", error);
    return NextResponse.json({ success: false, message: "Failed to update tool." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    await prisma.tool.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Tool deleted." });
  } catch (error) {
    console.error("Failed to delete tool", error);
    return NextResponse.json({ success: false, message: "Failed to delete tool." }, { status: 500 });
  }
}
