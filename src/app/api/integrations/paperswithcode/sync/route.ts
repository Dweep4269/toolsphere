import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published: string;
  url: string;
  abstract_pdf: string | null;
  authors: Array<{ name: string }>;
  venue: string | null;
  topics: Array<{ name: string }>;
}

interface PapersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Paper[];
}

async function fetchPapers(query: string): Promise<Paper[]> {
  try {
    const url = `https://paperswithcode.com/api/v1/papers/?ordering=-published&q=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn("PapersWithCode API returned non-JSON response");
      return [];
    }
    const data: PapersResponse = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Error fetching papers:", err);
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
  try {
    const body = (await request.json().catch(() => ({}))) as { limit?: number };
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);

    const queries = ["language model", "multimodal", "LLM", "transformer"];

    const allPapers: Paper[] = [];
    for (const query of queries) {
      const papers = await fetchPapers(query);
      allPapers.push(...papers);
    }

    const seen = new Set<string>();
    const uniquePapers: Paper[] = [];
    for (const paper of allPapers) {
      if (!seen.has(paper.url)) {
        seen.add(paper.url);
        uniquePapers.push(paper);
      }
    }

    uniquePapers.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    const toProcess = uniquePapers.slice(0, limit);

    const results = await Promise.all(
      toProcess.map(async (paper) => {
        const title = paper.title || "Untitled";
        const slug = slugify(`pwc-${paper.id}`);

        const excerpt = paper.abstract?.slice(0, 200).trim() || "";
        const authorNames = paper.authors?.slice(0, 3).map((a) => a.name).join(", ") || "Unknown";
        const content = `**Authors:** ${authorNames}\n\n**Venue:** ${paper.venue || "N/A"}\n\n**Abstract:**\n${paper.abstract || ""}\n\n[View Paper](${paper.url})`;

        try {
          const article = await prisma.newsArticle.upsert({
            where: { slug },
          update: {
            title,
            excerpt,
            content,
            sourceUrl: paper.url,
            publishedAt: new Date(paper.published),
          },
          create: {
            title,
            slug,
            excerpt,
            content,
            category: "release",
            tags: JSON.stringify(paper.topics?.map((t) => t.name) || ["paper"]),
            status: "draft",
            publishedAt: new Date(paper.published),
            authorName: authorNames,
            readTime: estimateReadTime(content),
            sourceUrl: paper.url,
          },
            select: { id: true, slug: true, title: true },
          });
          return article;
        } catch (err) {
          console.error("Error upserting paper:", err);
          return null;
        }
      })
    );

    const successful = results.filter(Boolean);

    return NextResponse.json({
      success: true,
      message: "Papers With Code sync completed.",
      meta: {
        processed: toProcess.length,
        upserted: successful.length,
      },
      data: successful,
    });
  } catch (error) {
    console.error("PapersWithCode sync failed:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
