import { NextResponse } from "next/server";
import prisma from "@/lib/db";

type DomainKey = "overall" | "coding" | "reasoning" | "creative";

function scoreForDomain(scoresRaw: string, domain: DomainKey) {
  try {
    const scores = JSON.parse(scoresRaw) as Partial<Record<DomainKey, number>>;
    return scores[domain] ?? 0;
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider")?.trim();
  const domain = (searchParams.get("domain") as DomainKey | null) ?? "overall";
  const sort = searchParams.get("sort") ?? "score";

  if (!["overall", "coding", "reasoning", "creative"].includes(domain)) {
    return NextResponse.json({ success: false, message: "Invalid domain." }, { status: 400 });
  }

  try {
    const benchmarks = await prisma.benchmarkModel.findMany({
      where: provider ? { provider } : undefined,
      orderBy: { releaseDate: "desc" },
    });

    const normalized = benchmarks.map((item) => ({
      ...item,
      domainScore: scoreForDomain(item.scores, domain),
    }));

    const sorted = [...normalized].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "release") return b.releaseDate.getTime() - a.releaseDate.getTime();
      return b.domainScore - a.domainScore;
    });

    return NextResponse.json({
      success: true,
      meta: {
        domain,
        sort,
        count: sorted.length,
      },
      data: sorted,
    });
  } catch (error) {
    console.error("Failed to fetch benchmarks", error);
    return NextResponse.json({ success: false, message: "Failed to fetch benchmarks." }, { status: 500 });
  }
}
