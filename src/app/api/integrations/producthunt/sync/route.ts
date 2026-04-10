import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveToolImage } from "@/lib/toolImages";

type ProductHuntPost = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votesCount: number;
  topics: {
    edges: Array<{ node: { name: string } }>;
  };
};

type ProductHuntResponse = {
  data?: {
    posts?: {
      edges?: Array<{ node: ProductHuntPost }>;
    };
  };
  errors?: Array<{ message: string }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 120);
}

function ratingFromVotes(votes: number) {
  if (votes >= 1000) return 4.9;
  if (votes >= 500) return 4.8;
  if (votes >= 200) return 4.6;
  if (votes >= 100) return 4.4;
  if (votes >= 50) return 4.2;
  return 4.0;
}

function mapCategorySlugs(topics: string[]) {
  const text = topics.join(" ").toLowerCase();
  const slugs = new Set<string>(["agent-skills"]);

  if (text.includes("developer") || text.includes("coding") || text.includes("programming")) {
    slugs.add("code-cli");
  }

  if (text.includes("audio") || text.includes("voice") || text.includes("speech")) {
    slugs.add("audio-voice");
  }

  if (text.includes("mcp") || text.includes("agent")) {
    slugs.add("mcps");
  }

  return [...slugs];
}

const query = `
query TopAiPosts($first: Int!) {
  posts(order: VOTES, topic: "artificial-intelligence", first: $first) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        topics {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
}
`;

export async function POST(request: Request) {
  const token = process.env.PRODUCTHUNT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Missing PRODUCTHUNT_TOKEN in environment." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(body.limit ?? 20, 1), 100);

  try {
    const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { first: limit },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { success: false, message: `ProductHunt API failed: ${response.status}`, details: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as ProductHuntResponse;
    if (payload.errors?.length) {
      return NextResponse.json(
        { success: false, message: payload.errors[0]?.message || "ProductHunt query failed." },
        { status: 502 }
      );
    }

    const posts = payload.data?.posts?.edges?.map((edge) => edge.node) ?? [];

    const categories = await prisma.category.findMany({
      where: { slug: { in: ["agent-skills", "code-cli", "audio-voice", "mcps"] } },
      select: { id: true, slug: true },
    });
    const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));

    const results = await Promise.all(
      posts.map(async (post) => {
        const topicNames = post.topics.edges.map((item) => item.node.name);
        const slug = `ph-${slugify(post.name)}-${post.id.toLowerCase()}`;
        const description = post.description?.trim() || post.tagline?.trim() || `ProductHunt launch: ${post.name}`;
        const image = await resolveToolImage(post.name, post.url);

        const tool = await prisma.tool.upsert({
          where: { slug },
          update: {
            name: post.name,
            description,
            url: post.url,
            pricingType: "freemium",
            pricingDetails: "ProductHunt launch",
            ratingOverall: ratingFromVotes(post.votesCount),
            features: JSON.stringify(topicNames),
            source: "api",
            sourceUrl: post.url,
            iconUrl: image.iconUrl,
          },
          create: {
            slug,
            name: post.name,
            description,
            url: post.url,
            pricingType: "freemium",
            pricingDetails: "ProductHunt launch",
            ratingOverall: ratingFromVotes(post.votesCount),
            features: JSON.stringify(topicNames),
            source: "api",
            sourceUrl: post.url,
            iconUrl: image.iconUrl,
            verified: false,
          },
          select: { id: true, slug: true, name: true },
        });

        for (const slug of mapCategorySlugs(topicNames)) {
          const categoryId = categoryMap.get(slug);
          if (!categoryId) continue;

          await prisma.toolCategory.upsert({
            where: {
              toolId_categoryId: {
                toolId: tool.id,
                categoryId,
              },
            },
            update: {},
            create: { toolId: tool.id, categoryId },
          });
        }

        return tool;
      })
    );

    return NextResponse.json({
      success: true,
      message: "ProductHunt sync completed.",
      meta: {
        fetched: posts.length,
        upserted: results.length,
      },
      data: results,
    });
  } catch (error) {
    console.error("ProductHunt sync failed", error);
    return NextResponse.json({ success: false, message: "ProductHunt sync failed." }, { status: 500 });
  }
}
