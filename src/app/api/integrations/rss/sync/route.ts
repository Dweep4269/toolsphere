import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface FeedItem {
  title?: string;
  link?: string;
  content?: string | null;
  contentSnippet?: string | null;
  pubDate?: string | null;
  isoDate?: string | null;
  creator?: string | null;
}

const RSS_FEEDS = [
  { name: "openai", url: "https://openai.com/news/rss.xml" },
  { name: "anthropic", url: "https://anthropic.com/rss.xml" },
  { name: "google-ai", url: "https://blog.google/technology/ai/rss" },
  { name: "meta-ai", url: "https://ai.meta.com/blog/feed" },
  { name: "mistral", url: "https://mistral.ai/news/rss" },
  { name: "huggingface", url: "https://huggingface.co/blog/feed.xml" },
];

async function fetchFeed(url: string): Promise<FeedItem[]> {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch {
    return [];
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 120);
}

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(body.limit ?? 20, 1), 100);
  const allItems: Array<FeedItem & { source: string }> = [];

  for (const feed of RSS_FEEDS) {
    const items = await fetchFeed(feed.url);
    for (const item of items) {
      allItems.push({ ...item, source: feed.name });
    }
  }

  allItems.sort((a, b) => {
    const dateA = a.isoDate || a.pubDate || "";
    const dateB = b.isoDate || b.pubDate || "";
    return dateB.localeCompare(dateA);
  });

  const toProcess = allItems.slice(0, limit);

  const results = await Promise.all(
    toProcess.map(async (item) => {
      const title = item.title || "Untitled";
      const slug = slugify(`${title}-${item.source}`);

      const content = item.content || item.contentSnippet || "";
      const excerpt = content.slice(0, 200).replace(/<[^>]*>/g, "").trim();
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
      const sourceUrl = item.link?.trim() || null;

      try {
        const article = await prisma.newsArticle.upsert({
          where: { slug },
          update: {
            title,
            excerpt,
            content,
            sourceUrl,
            publishedAt: new Date(publishedAt),
          },
          create: {
            title,
            slug,
            excerpt,
            content,
            category: "release",
            tags: JSON.stringify([item.source]),
            status: "draft",
            publishedAt: new Date(publishedAt),
            authorName: item.creator || item.source,
            readTime: estimateReadTime(content),
            sourceUrl,
          },
          select: { id: true, slug: true, title: true },
        });
        return article;
      } catch {
        return null;
      }
    })
  );

  const successful = results.filter(Boolean);

  return NextResponse.json({
    success: true,
    message: "RSS feed sync completed.",
    meta: {
      fetched: allItems.length,
      processed: toProcess.length,
      upserted: successful.length,
    },
    data: successful,
  });
}
