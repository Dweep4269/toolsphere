import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/db";
import { fetchReadmeExcerpt } from "@/lib/github";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit ?? 15), 30);

  const tools = await prisma.tool.findMany({
    where: {
      githubUrl: { not: null },
      OR: [
        { longDescription: null },
        { longDescription: "" },
        { descriptionSource: "raw" },
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, githubUrl: true },
  });

  let enriched = 0;
  const results: { name: string; status: string }[] = [];

  for (const tool of tools) {
    if (!tool.githubUrl) continue;

    const match = tool.githubUrl.match(/github\.com\/([^/?#]+\/[^/?#]+)/);
    if (!match) {
      results.push({ name: tool.name, status: "skip:no-repo-path" });
      continue;
    }

    const fullName = match[1];
    const excerpt = await fetchReadmeExcerpt(fullName, 280);

    if (excerpt) {
      await prisma.tool.update({
        where: { id: tool.id },
        data: { longDescription: excerpt, descriptionSource: "github-readme" },
      });
      enriched++;
      results.push({ name: tool.name, status: "enriched" });
    } else {
      results.push({ name: tool.name, status: "skip:no-readme" });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Enriched ${enriched}/${tools.length} tools with README descriptions.`,
    results,
  });
}
