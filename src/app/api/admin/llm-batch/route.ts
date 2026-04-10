import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { processToolWithAI } from "@/lib/ai";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 5), 10);

    // Fetch up to {limit} pending tools
    const pendingTools = await prisma.tool.findMany({
      where: {
        llmProcessed: false,
        status: "pending",
        source: "fmhy"
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        url: true
      }
    });

    if (pendingTools.length === 0) {
      return NextResponse.json({ success: true, message: "No pending tools to process.", processed: 0 });
    }

    const results = [];

    // Process each sequentially to avoid rate-limiting spikes
    for (const tool of pendingTools) {
      try {
        const aiResult = await processToolWithAI(tool.name, tool.description, tool.url);
        
        const updated = await prisma.tool.update({
          where: { id: tool.id },
          data: {
            longDescription: aiResult.longDescription,
            llmCategory: aiResult.llmCategory,
            llmProcessed: true,
            status: "active",
            descriptionSource: "ai-generated"
          }
        });
        
        results.push({ id: tool.id, status: "success", aiResult });
      } catch (err: any) {
        console.error(`Failed to process ${tool.name}:`, err);
        results.push({ id: tool.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} tools.`,
      processed: results.length,
      results
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error during LLM batch processing" }, { status: 500 });
  }
}
