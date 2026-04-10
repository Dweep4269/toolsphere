import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface HNItem {
  objectID: string;
  title: string;
  url?: string;
  points: number;
  num_comments: number;
  created_at: string;
  author: string;
}

async function fetchHN(query: string, minPoints: number = 10): Promise<HNItem[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>=${minPoints}&hitsPerPage=20`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.hits || [];
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
  const body = (await request.json().catch(() => ({}))) as { limit?: number; minPoints?: number };
  const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);
  const minPoints = body.minPoints ?? 10;

  const queries = [
    "AI model launch",
    "LLM release",
    "new AI tool",
    "GPT model",
    "Claude AI",
  ];

  const allItems: HNItem[] = [];
  for (const query of queries) {
    const items = await fetchHN(query, minPoints);
    allItems.push(...items);
  }

  const seen = new Set<string>();
  const uniqueItems: HNItem[] = [];
  for (const item of allItems) {
    if (!seen.has(item.url || item.objectID)) {
      seen.add(item.url || item.objectID);
      uniqueItems.push(item);
    }
  }

  uniqueItems.sort((a, b) => b.points - a.points);
  const toProcess = uniqueItems.slice(0, limit);

  const results = await Promise.all(
    toProcess.map(async (item) => {
      const title = item.title || "Untitled";
      const url = item.url || `https://news.ycombinator.com/item?id=${item.objectID}`;
      const slug = slugify(`hn-${item.objectID}`);

      const excerpt = `HN: ${item.num_comments} comments, ${item.points} points`;
      const content = `Source: Hacker News\nPoints: ${item.points}\nComments: ${item.num_comments}\n\n[View on HN](${url})`;

      try {
        const article = await prisma.newsArticle.upsert({
          where: { slug },
          update: {
            title,
            excerpt,
            content,
            sourceUrl: url,
            publishedAt: new Date(item.created_at),
          },
          create: {
            title,
            slug,
            excerpt,
            content,
            category: "release",
            tags: JSON.stringify(["hn", "community"]),
            status: "draft",
            publishedAt: new Date(item.created_at),
            authorName: item.author,
            readTime: estimateReadTime(content),
            sourceUrl: url,
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
    message: "Hacker News sync completed.",
    meta: {
      processed: toProcess.length,
      upserted: successful.length,
    },
    data: successful,
  });
}
