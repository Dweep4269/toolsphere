import type { Metadata } from "next";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";
import BenchmarkTable from "@/components/BenchmarkTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Model Benchmarks | ToolSphere",
  description: "Compare AI model performance across coding, reasoning, creative, and multimodal tasks. Live rankings with pricing data.",
};

export default async function BenchmarksPage() {
  let benchmarks: Array<{
    id: string;
    name: string;
    provider: string;
    releaseDate: Date;
    contextWindow: number;
    pricingInput: number;
    pricingOutput: number;
    scores: string;
  }> = [];

  try {
    benchmarks = await prisma.benchmarkModel.findMany({
      orderBy: { releaseDate: "desc" },
      select: {
        id: true,
        name: true,
        provider: true,
        releaseDate: true,
        contextWindow: true,
        pricingInput: true,
        pricingOutput: true,
        scores: true,
      },
    });
  } catch (e) {
    console.error("Failed to fetch benchmarks:", e);
  }

  return (
    <>
      <section className="section" id="benchmarks-full">
        <div className="section-inner">
          <div className="section-header">
            <h1 className="section-title">AI Model Benchmarks</h1>
            <p className="section-subtitle">
              Compare foundation model performance across coding, reasoning, math, and multimodal tasks.
              Scores are composite aggregates from MMLU-Pro, HumanEval, ARC, GPQA, and internal evaluations.
            </p>
          </div>
          <BenchmarkTable benchmarks={benchmarks} />
        </div>
      </section>
      <Footer />
    </>
  );
}
