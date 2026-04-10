import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { env } from "process";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Extremely basic stop-words for our naive text search
const STOP_WORDS = new Set(["with", "that", "this", "need", "have", "want", "find", "some", "like", "tool", "tools", "help", "best", "good"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, message: "No messages provided." }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        message: "API Key missing. Setup OPENROUTER_API_KEY in backend." 
      }, { status: 500 });
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
    
    // 1. extract keywords
    const keywords = lastUserMsg
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    // 2. Query DB
    let toolsContext = "";
    try {
      const orConditions = keywords.flatMap(kw => [
        { name: { contains: kw } },
        { description: { contains: kw } },
        { longDescription: { contains: kw } },
      ]);

      const foundTools = await prisma.tool.findMany({
        where: {
          verified: true,
          ...(orConditions.length > 0 ? { OR: orConditions } : {})
        },
        take: 15,
        orderBy: { ratingOverall: "desc" },
        select: { name: true, slug: true, description: true, longDescription: true, pricingType: true }
      });

      if (foundTools.length === 0 && orConditions.length > 0) {
        // Fallback if keywords are too specific
        const fallbackTools = await prisma.tool.findMany({
          where: { verified: true },
          take: 10,
          orderBy: { ratingOverall: "desc" },
          select: { name: true, slug: true, description: true, longDescription: true, pricingType: true }
        });
        toolsContext = fallbackTools.map(t => `- [${t.name}](/tools/${t.slug}): ${t.longDescription || t.description} (${t.pricingType})`).join("\n");
      } else {
        toolsContext = foundTools.map(t => `- [${t.name}](/tools/${t.slug}): ${t.longDescription || t.description} (${t.pricingType})`).join("\n");
      }
    } catch (dbErr) {
      console.error("DB Search error", dbErr);
    }

    const systemPrompt = `You are the ToolSphere Discovery Assistant, an elite librarian for AI tools. Your ultimate objective is to route users strictly to the highest quality, open-source, or developer-first AI tools currently available in your database.

CRITICAL DIRECTIVES:
1. TOOL SELECTION BIAS: We strongly favor tools that are Open Source, locally hostable, Developer-first (MCPs, CLIs, libraries), or completely free over commercial SaaS platform wrappers. Stand by this bias unapologetically. You are a curator, not just a search engine.
2. NO EXTERNAL HALLUCINATIONS: You MUST ONLY recommend tools that physically exist in the "AVAILABLE TOOLS IN DATABASE" list below. If a user asks for something we don't have, politely inform them that you do not index those yet.
3. ABSOLUTE LINKING: You must ONLY hyperlink using exact markdown format corresponding strictly to the slug provided, e.g. [Tool Name](/tools/slug). Do NOT put arbitrary links. 
4. CONCISE TONE: Do not hallucinate long conversational chat or code snippets. Your job is purely discovery and recommendation. Respond concisely.

AVAILABLE TOOLS IN DATABASE (Highly relevant to the user query):
${toolsContext || "No highly relevant tools found. Ask the user for more details, or suggest checking out the categories directly."}

You must ALWAYS respond in JSON containing these exactly two keys:
{
  "type": "question" | "recommendation",
  "text": "Your crisp curated response (use Markdown links for tools!)",
  "items": ["Brief standout feature 1", "Brief standout feature 2"]
}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ToolSphere Search",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "z-ai/glm-4.5-air:free",
        messages: apiMessages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("NLP Search Error:", error);
    return NextResponse.json({ success: false, message: "Server error during search." }, { status: 500 });
  }
}
