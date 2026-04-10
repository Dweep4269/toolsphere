import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { searchGitHubRepos, fetchReadmeExcerpt } from "@/lib/github";

const CATEGORY_SLUG = "mcps";
const MAX_IMPORT = 50;

const CURATED_MCP_REPOS = [
  "modelcontextprotocol/servers",
  "punkpeye/awesome-mcp-servers",
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

async function fetchCuratedListUrls(): Promise<Set<string>> {
  const urls = new Set<string>();
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md"
    );
    if (res.ok) {
      const md = await res.text();
      const linkRe = /\[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)/g;
      let m;
      while ((m = linkRe.exec(md)) !== null) {
        urls.add(m[2].replace(/\/+$/, ""));
      }
    }
  } catch {}
  return urls;
}

export async function POST() {
  try {
    const category = await prisma.category.upsert({
      where: { slug: CATEGORY_SLUG },
      update: {},
      create: { slug: CATEGORY_SLUG, name: "MCP Servers", color: "#C8A87C" },
    });

    const curatedUrls = await fetchCuratedListUrls();

    const repos = await searchGitHubRepos(
      "topic:mcp-server OR topic:model-context-protocol stars:>5",
      { sort: "stars", perPage: 50 }
    );

    let imported = 0;
    let updated = 0;
    let readmeFetches = 0;
    const MAX_README_FETCHES = 10;
    const errors: string[] = [];

    for (const repo of repos) {
      if (imported >= MAX_IMPORT) break;
      if (CURATED_MCP_REPOS.includes(repo.full_name)) continue;

      const displayName = repo.name
        .replace(/^mcp[-_]?server[-_]?/i, "")
        .replace(/[-_]mcp$/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();

      const finalName = displayName ? `${displayName} MCP` : repo.name;
      const url = repo.html_url;
      const baseSlug = toSlug(`mcp-${repo.name}`);
      const repoDescription = repo.description || "";
      const stars = repo.stargazers_count;
      const isCurated = curatedUrls.has(url.replace(/\/+$/, ""));

      try {
        const existing = await prisma.tool.findFirst({ where: { url } });

        let readmeExcerpt: string | null = null;
        if ((!existing || !existing.longDescription) && readmeFetches < MAX_README_FETCHES) {
          readmeExcerpt = await fetchReadmeExcerpt(repo.full_name, 280);
          readmeFetches++;
        }

        const description =
          repoDescription || readmeExcerpt || "A Model Context Protocol server.";

        if (existing) {
          const up: Record<string, unknown> = {};
          if (!existing.longDescription && readmeExcerpt) {
            up.longDescription = readmeExcerpt;
            up.descriptionSource = "github-readme";
          }
          if (!existing.description || existing.description === "No description provided.") {
            up.description = description;
          }
          if (Object.keys(up).length > 0) {
            await prisma.tool.update({ where: { id: existing.id }, data: up });
            updated++;
          }

          await prisma.toolCategory.upsert({
            where: {
              toolId_categoryId: { toolId: existing.id, categoryId: category.id },
            },
            update: {},
            create: { toolId: existing.id, categoryId: category.id },
          });
        } else {
          let slug = baseSlug;
          const slugExists = await prisma.tool.findFirst({ where: { slug } });
          if (slugExists) slug = `${baseSlug}-mcp`;

          const tool = await prisma.tool.create({
            data: {
              slug,
              name: finalName,
              url,
              description,
              longDescription: readmeExcerpt,
              descriptionSource: readmeExcerpt ? "github-readme" : "raw",
              githubUrl: url,
              status: "active",
              source: "github-mcp",
              verified: true,
              llmCategory: "MCP Server",
              llmProcessed: true,
              tags: JSON.stringify(repo.topics?.slice(0, 6) || []),
              ratingOverall: isCurated
                ? 4.5
                : stars > 500
                  ? 4.5
                  : stars > 100
                    ? 4.0
                    : stars > 20
                      ? 3.5
                      : 3.0,
            },
          });

          await prisma.toolCategory.upsert({
            where: {
              toolId_categoryId: { toolId: tool.id, categoryId: category.id },
            },
            update: {},
            create: { toolId: tool.id, categoryId: category.id },
          });

          imported++;
        }
      } catch (e) {
        errors.push(
          `${repo.full_name}: ${e instanceof Error ? e.message : "Unknown"}`
        );
      }
    }

    await prisma.category.update({
      where: { slug: CATEGORY_SLUG },
      data: {
        toolCount: await prisma.toolCategory.count({
          where: { categoryId: category.id },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `MCP sync: ${imported} new, ${updated} updated from ${repos.length} repos (${curatedUrls.size} curated references).`,
      meta: { imported, updated, reposScanned: repos.length, curatedRefs: curatedUrls.size, errors: errors.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("MCP Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
