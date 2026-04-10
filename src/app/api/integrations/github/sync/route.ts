import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveToolImage } from "@/lib/toolImages";

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  topics: string[];
};

type GitHubSearchResponse = {
  items: GitHubRepo[];
};

function slugifyFromRepo(fullName: string) {
  return fullName.toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-/]/g, "").replace("/", "-");
}

function mapRatingFromStars(stars: number) {
  if (stars >= 10000) return 5.0;
  if (stars >= 5000) return 4.8;
  if (stars >= 1000) return 4.6;
  if (stars >= 300) return 4.4;
  if (stars >= 100) return 4.2;
  return 4.0;
}

function categorySlugsForTopics(topics: string[]) {
  const lowered = topics.map((item) => item.toLowerCase());
  const hasAgentSignal = lowered.some((topic) =>
    ["agent", "agentic", "mcp", "skill", "copilot"].some((signal) => topic.includes(signal))
  );

  const slugs = ["code-cli"];
  if (hasAgentSignal) {
    slugs.push("agent-skills");
  }

  return slugs;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(body.limit ?? 20, 1), 100);

  const githubQuery = encodeURIComponent("topic:ai topic:llm stars:>100");
  const url = `https://api.github.com/search/repositories?q=${githubQuery}&sort=stars&order=desc&per_page=${limit}`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ToolSphere-Sync",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { success: false, message: `GitHub API request failed: ${response.status}`, details: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as GitHubSearchResponse;
    const repos = payload.items ?? [];

    const categories = await prisma.category.findMany({
      where: { slug: { in: ["code-cli", "agent-skills"] } },
      select: { id: true, slug: true },
    });

    const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

    const results = await Promise.all(
      repos.map(async (repo) => {
        const slug = slugifyFromRepo(repo.full_name);
        const description = repo.description?.trim() || `${repo.name} from GitHub AI ecosystem`;
        const image = await resolveToolImage(repo.name, repo.html_url);

        const tool = await prisma.tool.upsert({
          where: { slug },
          update: {
            name: repo.name,
            description,
            url: repo.html_url,
            githubUrl: repo.html_url,
            pricingType: "opensource",
            pricingDetails: "Open source",
            ratingOverall: mapRatingFromStars(repo.stargazers_count),
            features: JSON.stringify(repo.topics || []),
            source: "api",
            sourceUrl: repo.html_url,
            iconUrl: image.iconUrl,
          },
          create: {
            slug,
            name: repo.name,
            description,
            url: repo.html_url,
            githubUrl: repo.html_url,
            pricingType: "opensource",
            pricingDetails: "Open source",
            ratingOverall: mapRatingFromStars(repo.stargazers_count),
            features: JSON.stringify(repo.topics || []),
            source: "api",
            sourceUrl: repo.html_url,
            iconUrl: image.iconUrl,
            verified: false,
          },
          select: { id: true, slug: true, name: true },
        });

        const desiredSlugs = categorySlugsForTopics(repo.topics || []);
        for (const categorySlug of desiredSlugs) {
          const categoryId = categoryBySlug.get(categorySlug);
          if (!categoryId) continue;

          await prisma.toolCategory.upsert({
            where: {
              toolId_categoryId: {
                toolId: tool.id,
                categoryId,
              },
            },
            update: {},
            create: {
              toolId: tool.id,
              categoryId,
            },
          });
        }

        return tool;
      })
    );

    return NextResponse.json({
      success: true,
      message: "GitHub sync completed.",
      meta: {
        fetched: repos.length,
        upserted: results.length,
      },
      data: results,
    });
  } catch (error) {
    console.error("GitHub sync failed", error);
    return NextResponse.json({ success: false, message: "GitHub sync failed." }, { status: 500 });
  }
}
