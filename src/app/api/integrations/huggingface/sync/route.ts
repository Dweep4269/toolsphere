import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveToolImage } from "@/lib/toolImages";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(request: Request) {
  try {
    const response = await fetch("https://huggingface.co/api/models?sort=trending&limit=50", { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ success: false, message: "Failed to fetch from Hugging Face" }, { status: 502 });
    }

    const models = await response.json();
    let createCount = 0;
    
    for (const model of models) {
      const name = model.id;
      const url = `https://huggingface.co/${model.id}`;
      const slug = slugify(name);
      
      const exists = await prisma.tool.findUnique({ where: { slug } });
      if (!exists) {
        await prisma.tool.create({
          data: {
            slug,
            name,
            description: model.pipeline_tag ? `${model.pipeline_tag} model` : "Hugging Face Model",
            descriptionSource: "raw",
            url,
            source: "huggingface",
            sourceUrl: url,
            status: "pending",
            llmProcessed: false,
            verified: false,
            pricingType: "opensource",
            features: JSON.stringify(model.tags?.slice(0, 5) || []),
            iconUrl: (await resolveToolImage(name, url)).iconUrl,
          }
        });
        createCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Hugging Face sync completed.",
      meta: {
        entriesFound: models.length,
        created: createCount
      }
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: "HF Sync failed" }, { status: 500 });
  }
}
