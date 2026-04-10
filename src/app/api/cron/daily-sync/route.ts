import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function runSync(baseUrl: string, path: string, payload: unknown) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as unknown;
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, status: 0, data: { message: error instanceof Error ? error.message : "Unknown error" } };
  }
}

const TRUSTED_SOURCES = ["openai", "anthropic", "google-ai", "meta-ai", "mistral", "huggingface"];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = getBaseUrl(request);

  const fmhyResult = await runSync(baseUrl, "/api/integrations/fmhy/sync", { limit: 500 });
  const rssResult = await runSync(baseUrl, "/api/integrations/rss/sync", { limit: 50 });
  const skillsResult = await runSync(baseUrl, "/api/integrations/skills/sync", {});

  let autoPublished = 0;
  try {
    const drafts = await prisma.newsArticle.findMany({
      where: { status: "draft" },
      select: { id: true, tags: true, excerpt: true, content: true },
    });

    for (const draft of drafts) {
      let tags: string[] = [];
      try { tags = JSON.parse(draft.tags) as string[]; } catch { /* noop */ }

      const isTrustedSource = tags.some((t) => TRUSTED_SOURCES.includes(t));
      const hasContent = (draft.content?.length ?? 0) > 50 && (draft.excerpt?.length ?? 0) > 20;

      if (isTrustedSource && hasContent) {
        await prisma.newsArticle.update({
          where: { id: draft.id },
          data: { status: "published", publishedAt: new Date() },
        });
        autoPublished++;
      }
    }
  } catch (e) {
    console.error("Auto-publish failed:", e);
  }

  return NextResponse.json({
    success: true,
    message: "Daily sync completed.",
    results: {
      fmhy: fmhyResult,
      rss: rssResult,
      skills: skillsResult,
      autoPublished,
    },
    timestamp: new Date().toISOString(),
  });
}
