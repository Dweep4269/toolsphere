import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveToolImage } from "@/lib/toolImages";

type ParsedEntry = {
  name: string;
  url: string;
  description: string;
  isStarred: boolean;
  githubUrl?: string;
  docsUrl?: string;
  sectionSlug: string;
  categorySlug?: string | null;
};

const ENTRY_REGEX = /^\*\s+(?:⭐\s+)?\*?\*?\[([^\]]+)\]\(([^)]+)\)\*?\*?\s*[-–—]\s*(.+)$/;

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 120);
}

function determinePricingType(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("open source") || lower.includes("open-source") || lower.includes("foss")) return "opensource";
  if (lower.includes("no sign-up") || lower.includes("free") || lower.includes("unlimited")) return "free";
  if (lower.includes("paid") || lower.includes("subscription")) return "paid";
  return "freemium";
}

function sanitizeDescription(input: string) {
  return input.replace(/\s*\/\s*\[[^\]]+\]\([^)]+\)/g, "").trim();
}

function extractTags(entry: ParsedEntry) {
  const tokens = `${entry.sectionSlug} ${entry.description}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return [...new Set(tokens)].slice(0, 12);
}

function parseEntries(
  markdown: string,
  limitPerSection: number
): { entries: ParsedEntry[]; processedSections: string[] } {
  const lines = markdown.split("\n");
  const processedSections = new Set<string>();
  const entries: ParsedEntry[] = [];

  const VALID_MAJOR_SECTIONS = new Set([
    "AI Chatbots",
    "AI Tools",
    "AI Writing Tools",
    "Video Generation",
    "Image Generation",
    "Audio Generation"
  ]);

  const CATEGORY_MAP: Record<string, string> = {
    "Audio Generation": "audio-voice",
    "AI Writing Tools": "writing-docs",
    "Roleplaying Chatbots": "writing-docs",
    "Coding Agents / Extensions": "agentic-ides"
  };

  let parseActive = false;
  let currentMajorSection = "";
  let currentSubSection = "";
  const sectionCounts = new Map<string, number>();

  for (const line of lines) {
    const majorMatch = line.match(/^# ►\s*(.+)$/);
    if (majorMatch) {
      // Clean up markdown links in header if present, e.g. [AI Coding Tools](...)
      let title = majorMatch[1].trim();
      if (title.startsWith("[") && title.includes("](")) {
        title = title.split("](")[0].replace("[", "").trim();
      } else {
        // Strip out bold formatting if accidentally included
        title = title.replace(/\*+/g, "").trim(); 
      }
      
      if (VALID_MAJOR_SECTIONS.has(title)) {
        parseActive = true;
      } else {
        parseActive = false;
      }
      currentMajorSection = title;
      currentSubSection = "";
      continue;
    }

    const subMatch = line.match(/^## ▷\s*(.+)$/);
    if (subMatch) {
      // Clean up links in sub header just in case
      let subTitle = subMatch[1].trim();
      if (subTitle.startsWith("[") && subTitle.includes("](")) {
        subTitle = subTitle.split("](")[0].replace("[", "").trim();
      } else {
        subTitle = subTitle.replace(/\*+/g, "").trim(); 
      }
      currentSubSection = subTitle;
      continue;
    }

    if (!parseActive) continue;

    const match = line.match(ENTRY_REGEX);
    if (!match) continue;

    const [, nameRaw, urlRaw, descriptionRaw] = match;
    const url = urlRaw.trim();
    const name = nameRaw.trim();
    const description = descriptionRaw.trim();

    if (!name || !url || !description) continue;

    const fmhySection = currentSubSection || currentMajorSection;
    const count = sectionCounts.get(fmhySection) || 0;
    
    if (count >= limitPerSection) continue;
    
    sectionCounts.set(fmhySection, count + 1);
    processedSections.add(fmhySection);

    let categorySlug = null;
    if (CATEGORY_MAP[currentSubSection]) categorySlug = CATEGORY_MAP[currentSubSection];
    else if (CATEGORY_MAP[currentMajorSection]) categorySlug = CATEGORY_MAP[currentMajorSection];

    entries.push({
      name,
      url,
      description,
      isStarred: line.includes("⭐"),
      githubUrl: description.match(/\[GitHub\]\(([^)]+)\)/i)?.[1],
      docsUrl: description.match(/\[Docs?\]\(([^)]+)\)/i)?.[1],
      sectionSlug: fmhySection,
      categorySlug
    });
  }

  return { entries, processedSections: [...processedSections] };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { limitPerSection?: number };
  const limitPerSection = Math.min(Math.max(Number(body.limitPerSection ?? 15), 1), 100);

  try {
    const response = await fetch("https://api.fmhy.net/single-page", { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `FMHY request failed: ${response.status}` },
        { status: 502 }
      );
    }

    const markdown = await response.text();
    const { entries, processedSections } = parseEntries(markdown, limitPerSection);

    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

    let createCount = 0;
    let mergeCount = 0;
    const results: Array<{ id: string; slug: string; name: string; mode: "created" | "merged" }> = [];

    for (const entry of entries) {
      const normalizedUrl = normalizeUrl(entry.url);
      const expectedSlug = slugify(entry.name);
      const cleanDescription = sanitizeDescription(entry.description);
      let hostname = "";
      try {
        hostname = new URL(entry.url).hostname.replace(/^www\./, "");
      } catch {
        hostname = "";
      }

      const candidates = await prisma.tool.findMany({
        where: {
          OR: [
            { slug: expectedSlug },
            ...(hostname ? [{ url: { contains: hostname } }] : []),
          ],
        },
        select: { id: true, slug: true, url: true, descriptionSource: true, ratingOverall: true, description: true },
      });

      const existingTool =
        candidates.find((candidate) => normalizeUrl(candidate.url) === normalizedUrl) ||
        candidates.find((candidate) => candidate.slug === expectedSlug) ||
        null;

      if (existingTool) {
        const image = await resolveToolImage(entry.name, entry.url);
        const updated = await prisma.tool.update({
          where: { id: existingTool.id },
          data: {
            url: entry.url,
            githubUrl: entry.githubUrl,
            documentationUrl: entry.docsUrl,
            source: "fmhy",
            sourceUrl: entry.url,
            iconUrl: image.iconUrl,
            fmhySection: entry.sectionSlug,
            lastSyncedAt: new Date(),
            ratingOverall: entry.isStarred ? 4.9 : (existingTool.ratingOverall ?? 4.5),
            description: existingTool.descriptionSource === "raw" ? cleanDescription : existingTool.description,
          },
          select: { id: true, slug: true, name: true },
        });

        if (entry.categorySlug) {
          const categoryId = categoryMap.get(entry.categorySlug);
          if (categoryId) {
            await prisma.toolCategory.upsert({
              where: { toolId_categoryId: { toolId: existingTool.id, categoryId } },
              update: {},
              create: { toolId: existingTool.id, categoryId },
            });
          }
        }

        mergeCount += 1;
        results.push({ ...updated, mode: "merged" });
        continue;
      }

      const created = await prisma.tool.create({
        data: {
          slug: expectedSlug,
          name: entry.name,
          description: cleanDescription,
          descriptionSource: "raw",
          url: entry.url,
          githubUrl: entry.githubUrl || null,
          documentationUrl: entry.docsUrl || null,
          pricingType: determinePricingType(cleanDescription),
          ratingOverall: entry.isStarred ? 4.9 : 4.5,
          features: JSON.stringify(extractTags(entry)),
          source: "fmhy",
          sourceUrl: entry.url,
          iconUrl: (await resolveToolImage(entry.name, entry.url)).iconUrl,
          fmhySection: entry.sectionSlug,
          lastSyncedAt: new Date(),
          verified: false,
          status: "pending",
          llmProcessed: false,
        },
        select: { id: true, slug: true, name: true },
      });

      if (entry.categorySlug) {
        const categoryId = categoryMap.get(entry.categorySlug);
        if (categoryId) {
          await prisma.toolCategory.upsert({
            where: { toolId_categoryId: { toolId: created.id, categoryId } },
            update: {},
            create: { toolId: created.id, categoryId },
          });
        }
      }

      createCount += 1;
      results.push({ ...created, mode: "created" });
    }

    return NextResponse.json({
      success: true,
      message: "FMHY sync completed.",
      meta: {
        sectionsProcessed: processedSections.length,
        entriesFound: entries.length,
        created: createCount,
        merged: mergeCount,
      },
      data: results,
    });
  } catch (error) {
    console.error("FMHY sync failed", error);
    return NextResponse.json({ success: false, message: "FMHY sync failed." }, { status: 500 });
  }
}
