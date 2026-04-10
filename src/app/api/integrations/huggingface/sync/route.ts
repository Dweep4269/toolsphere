import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

const CATEGORY_SLUG = "foundation-models";

export async function POST() {
  try {
    const response = await fetch("https://huggingface.co/api/models?sort=likes&direction=-1&limit=50", {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Hugging Face API returned ${response.status}` },
        { status: 502 }
      );
    }

    const models = await response.json();

    const category = await prisma.category.upsert({
      where: { slug: CATEGORY_SLUG },
      update: {},
      create: { slug: CATEGORY_SLUG, name: "Foundation Models", color: "#9e6b9e" },
    });

    let createCount = 0;
    let skipCount = 0;
    const errors: string[] = [];

    for (const model of models) {
      const name = model.id as string;
      const url = `https://huggingface.co/${model.id}`;
      const slug = slugify(name);

      try {
        const exists = await prisma.tool.findUnique({ where: { slug } });
        if (exists) {
          skipCount++;
          continue;
        }

        const pipelineTag = (model.pipeline_tag as string) || "";
        const downloads = (model.downloads as number) || 0;
        const likes = (model.likes as number) || 0;

        const description = pipelineTag
          ? `${pipelineTag.replace(/-/g, " ")} model with ${downloads.toLocaleString()} downloads`
          : `Trending Hugging Face model with ${downloads.toLocaleString()} downloads`;

        const tool = await prisma.tool.create({
          data: {
            slug,
            name,
            description,
            descriptionSource: "raw",
            url,
            source: "huggingface",
            sourceUrl: url,
            status: "active",
            llmProcessed: false,
            llmCategory: "Foundation Model",
            verified: true,
            pricingType: "opensource",
            features: JSON.stringify(model.tags?.slice(0, 8) || []),
            tags: JSON.stringify([pipelineTag, "huggingface", "model"].filter(Boolean)),
            ratingOverall: likes > 1000 ? 4.5 : likes > 100 ? 4.0 : likes > 10 ? 3.5 : 3.0,
          },
        });

        await prisma.toolCategory.upsert({
          where: { toolId_categoryId: { toolId: tool.id, categoryId: category.id } },
          update: {},
          create: { toolId: tool.id, categoryId: category.id },
        });

        createCount++;
      } catch (e) {
        errors.push(`${name}: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }

    await prisma.category.update({
      where: { slug: CATEGORY_SLUG },
      data: {
        toolCount: await prisma.toolCategory.count({ where: { categoryId: category.id } }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Hugging Face sync: ${createCount} new, ${skipCount} existing from ${models.length} models.`,
      meta: { created: createCount, skipped: skipCount, total: models.length, errors: errors.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("HF Sync Error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "HF Sync failed" },
      { status: 500 }
    );
  }
}
