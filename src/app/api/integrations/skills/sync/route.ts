import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { searchGitHubRepos, fetchReadmeExcerpt } from "@/lib/github";

const CATEGORY_SLUG = "agent-skills";
const MAX_IMPORT = 30;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

export async function POST() {
  try {
    const repos = await searchGitHubRepos("topic:agent-skill OR topic:cursor-skill OR topic:claude-skill", {
      sort: "stars",
      perPage: 30,
    });

    const category = await prisma.category.upsert({
      where: { slug: CATEGORY_SLUG },
      update: {},
      create: { slug: CATEGORY_SLUG, name: "Agent Skills", color: "#C8A87C" },
    });

    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const repo of repos) {
      if (imported >= MAX_IMPORT) break;

      const displayName = repo.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const url = repo.html_url;
      const baseSlug = toSlug(repo.full_name);
      const repoDescription = repo.description || "";
      const stars = repo.stargazers_count;

      try {
        const existing = await prisma.tool.findFirst({ where: { url } });

        let readmeExcerpt: string | null = null;
        if (!existing || !existing.longDescription) {
          readmeExcerpt = await fetchReadmeExcerpt(repo.full_name, 280);
        }

        const description = repoDescription || readmeExcerpt || "An agent skill for AI-powered development workflows.";

        if (existing) {
          const updateData: Record<string, unknown> = {};
          if (!existing.longDescription && readmeExcerpt) {
            updateData.longDescription = readmeExcerpt;
            updateData.descriptionSource = "github-readme";
          }
          if (!existing.description || existing.description === "No description provided.") {
            updateData.description = description;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.tool.update({ where: { id: existing.id }, data: updateData });
            updated++;
          }

          await prisma.toolCategory.upsert({
            where: { toolId_categoryId: { toolId: existing.id, categoryId: category.id } },
            update: {},
            create: { toolId: existing.id, categoryId: category.id },
          });
        } else {
          let slug = baseSlug;
          const slugExists = await prisma.tool.findFirst({ where: { slug } });
          if (slugExists) slug = `${baseSlug}-skill`;

          const tool = await prisma.tool.create({
            data: {
              slug,
              name: displayName,
              url,
              description,
              longDescription: readmeExcerpt,
              descriptionSource: readmeExcerpt ? "github-readme" : "raw",
              githubUrl: url,
              status: "pending",
              source: "github-skills",
              verified: false,
              tags: JSON.stringify(repo.topics?.slice(0, 6) || []),
              ratingOverall: stars > 500 ? 4.5 : stars > 100 ? 4.0 : stars > 20 ? 3.5 : null,
            },
          });

          await prisma.toolCategory.upsert({
            where: { toolId_categoryId: { toolId: tool.id, categoryId: category.id } },
            update: {},
            create: { toolId: tool.id, categoryId: category.id },
          });

          imported++;
        }
      } catch (e) {
        errors.push(`${repo.full_name}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    await prisma.category.update({
      where: { slug: CATEGORY_SLUG },
      data: { toolCount: await prisma.toolCategory.count({ where: { categoryId: category.id } }) },
    });

    return NextResponse.json({
      success: true,
      message: `Skills sync: ${imported} new, ${updated} updated from ${repos.length} repos.`,
      meta: { imported, updated, reposScanned: repos.length, errors: errors.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Skills Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
