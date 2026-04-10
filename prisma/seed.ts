import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const categories = [
    { name: "MCP Servers", slug: "mcps", color: "#4EC5D4", toolCount: 247 },
    { name: "Agent Skills", slug: "agent-skills", color: "#C8A87C", toolCount: 182 },
    { name: "Code & CLI", slug: "code-cli", color: "#5B9A42", toolCount: 156 },
    { name: "Agentic IDEs", slug: "agentic-ides", color: "#E8604A", toolCount: 24 },
    { name: "Audio & Voice", slug: "audio-voice", color: "#9472C4", toolCount: 89 },
    { name: "Writing & Docs", slug: "writing-docs", color: "#C49264", toolCount: 134 },
    { name: "Image & Video", slug: "image-video", color: "#D4A574", toolCount: 95 },
    { name: "Foundation Models", slug: "foundation-models", color: "#6B8DD6", toolCount: 18 },
  ];

  const createdCategories: Record<string, { id: string }> = {};
  for (const cat of categories) {
    createdCategories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { toolCount: cat.toolCount },
      create: {
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        toolCount: cat.toolCount,
      },
    });
  }

  const tools = [
    { name: "Cursor", slug: "cursor", description: "The AI-first code editor built for pair programming with intelligent autocomplete and chat.", url: "https://cursor.sh", pricingType: "freemium", pricingDetails: "$20/month Pro", ratingOverall: 4.9, features: JSON.stringify(["Copilot++", "Chat", "Codebase Knowledge", "Multi-file editing"]), categoryId: createdCategories["agentic-ides"].id },
    { name: "Claude Code", slug: "claude-code", description: "An agentic coding companion by Anthropic that operates directly in your terminal.", url: "https://anthropic.com", pricingType: "paid", pricingDetails: "API usage pricing", ratingOverall: 4.8, features: JSON.stringify(["CLI", "Refactoring", "Testing", "Git integration"]), categoryId: createdCategories["code-cli"].id },
    { name: "ElevenLabs", slug: "elevenlabs", description: "The most realistic AI voice generator and text to speech software available.", url: "https://elevenlabs.io", pricingType: "freemium", pricingDetails: "Starts free", ratingOverall: 4.9, features: JSON.stringify(["TTS", "Voice Cloning", "Dubbing"]), categoryId: createdCategories["audio-voice"].id },
    { name: "Windsurf", slug: "windsurf", description: "A fast, collaborative agentic IDE by Codeium with deep AI integration.", url: "https://codeium.com/windsurf", pricingType: "freemium", pricingDetails: "Pro $15/m", ratingOverall: 4.8, features: JSON.stringify(["Codeium integration", "Workspaces", "Cascade AI"]), categoryId: createdCategories["agentic-ides"].id },
    { name: "v0 by Vercel", slug: "v0", description: "Generate production-quality UI directly from text prompts and screenshots.", url: "https://v0.dev", pricingType: "freemium", pricingDetails: "Credit based", ratingOverall: 4.8, features: JSON.stringify(["React", "Tailwind", "Shadcn", "Screenshot to code"]), categoryId: createdCategories["code-cli"].id },
    { name: "Bolt.new", slug: "bolt-new", description: "Prompt, run, edit, and deploy full-stack web apps in the browser.", url: "https://bolt.new", pricingType: "freemium", pricingDetails: "Paid tier", ratingOverall: 4.7, features: JSON.stringify(["Fullstack", "WebContainers", "One-click deploy"]), categoryId: createdCategories["code-cli"].id },
  ];

  for (const t of tools) {
    const { categoryId, ...toolData } = t;
    await prisma.tool.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        ...toolData,
        verified: true,
        categories: { create: [{ categoryId }] },
      },
    });
  }

  const benchmarks = [
    { name: "Claude 4 Opus", provider: "Anthropic", releaseDate: new Date("2025-09-15"), contextWindow: 200000, pricingInput: 15, pricingOutput: 75, scores: JSON.stringify({ overall: 96.8, coding: 95.2, reasoning: 97.1, creative: 94.5, multimodal: 93.0, math: 96.0, knowledge: 95.5 }) },
    { name: "GPT-4.5", provider: "OpenAI", releaseDate: new Date("2025-08-20"), contextWindow: 128000, pricingInput: 10, pricingOutput: 30, scores: JSON.stringify({ overall: 95.4, coding: 93.8, reasoning: 95.0, creative: 93.2, multimodal: 96.0, math: 94.5, knowledge: 94.0 }) },
    { name: "Gemini 2.5 Pro", provider: "Google", releaseDate: new Date("2025-12-10"), contextWindow: 2000000, pricingInput: 2.5, pricingOutput: 10, scores: JSON.stringify({ overall: 95.9, coding: 94.5, reasoning: 96.2, creative: 92.8, multimodal: 97.5, math: 95.8, knowledge: 95.0 }) },
    { name: "Claude 3.5 Sonnet", provider: "Anthropic", releaseDate: new Date("2024-06-20"), contextWindow: 200000, pricingInput: 3, pricingOutput: 15, scores: JSON.stringify({ overall: 92.1, coding: 90.5, reasoning: 91.5, creative: 89.0, multimodal: 88.0, math: 90.0, knowledge: 89.5 }) },
    { name: "GPT-4o", provider: "OpenAI", releaseDate: new Date("2024-05-13"), contextWindow: 128000, pricingInput: 5, pricingOutput: 15, scores: JSON.stringify({ overall: 91.8, coding: 88.2, reasoning: 92.0, creative: 91.5, multimodal: 93.0, math: 89.5, knowledge: 91.0 }) },
    { name: "Llama 4 Maverick", provider: "Meta", releaseDate: new Date("2025-04-05"), contextWindow: 1000000, pricingInput: 0.2, pricingOutput: 0.6, scores: JSON.stringify({ overall: 93.5, coding: 91.0, reasoning: 92.8, creative: 90.5, multimodal: 91.0, math: 91.5, knowledge: 92.0 }) },
    { name: "DeepSeek R1", provider: "DeepSeek", releaseDate: new Date("2025-01-20"), contextWindow: 128000, pricingInput: 0.55, pricingOutput: 2.19, scores: JSON.stringify({ overall: 92.8, coding: 93.5, reasoning: 94.0, creative: 86.0, multimodal: 0, math: 95.2, knowledge: 90.0 }) },
    { name: "Grok 3", provider: "xAI", releaseDate: new Date("2025-02-18"), contextWindow: 128000, pricingInput: 3, pricingOutput: 15, scores: JSON.stringify({ overall: 93.0, coding: 91.5, reasoning: 93.5, creative: 89.0, multimodal: 90.5, math: 93.0, knowledge: 91.0 }) },
    { name: "Mistral Large 2", provider: "Mistral", releaseDate: new Date("2024-11-18"), contextWindow: 128000, pricingInput: 2, pricingOutput: 6, scores: JSON.stringify({ overall: 89.5, coding: 87.0, reasoning: 88.5, creative: 87.0, multimodal: 85.0, math: 87.5, knowledge: 88.0 }) },
    { name: "Llama 3.1 405B", provider: "Meta", releaseDate: new Date("2024-07-23"), contextWindow: 128000, pricingInput: 0, pricingOutput: 0, scores: JSON.stringify({ overall: 88.0, coding: 85.5, reasoning: 87.0, creative: 84.0, multimodal: 0, math: 86.0, knowledge: 89.5 }) },
    { name: "Command R+", provider: "Cohere", releaseDate: new Date("2024-04-04"), contextWindow: 128000, pricingInput: 2.5, pricingOutput: 10, scores: JSON.stringify({ overall: 85.0, coding: 80.5, reasoning: 84.0, creative: 83.0, multimodal: 0, math: 81.0, knowledge: 87.5 }) },
    { name: "Qwen 2.5 72B", provider: "Alibaba", releaseDate: new Date("2025-01-15"), contextWindow: 128000, pricingInput: 0.4, pricingOutput: 1.2, scores: JSON.stringify({ overall: 90.2, coding: 89.0, reasoning: 89.5, creative: 85.0, multimodal: 86.0, math: 90.0, knowledge: 88.5 }) },
  ];

  for (const bm of benchmarks) {
    await prisma.benchmarkModel.upsert({
      where: { name: bm.name },
      update: { scores: bm.scores, pricingInput: bm.pricingInput, pricingOutput: bm.pricingOutput },
      create: bm,
    });
  }

  const news = [
    { title: "Anthropic Launches Claude Code", slug: "claude-code-launch", excerpt: "The new agentic CLI tool aims to replace standard terminal workflows with AI-powered development.", content: "Anthropic has released Claude Code, a terminal-based AI coding companion...", category: "release", authorName: "Emily Chen", readTime: 5, status: "published", publishedAt: new Date("2025-03-15") },
    { title: "The Rise of MCPs in Agent Architectures", slug: "rise-of-mcps", excerpt: "Model Context Protocol is becoming the standard for tool use in AI agent systems.", content: "The Model Context Protocol (MCP) has rapidly gained adoption...", category: "analysis", authorName: "David Kim", readTime: 8, status: "published", publishedAt: new Date("2025-04-01") },
    { title: "DeepSeek R1 Challenges Frontier Models", slug: "deepseek-r1-release", excerpt: "Open-weight reasoning model matches GPT-4 class performance at a fraction of the cost.", content: "DeepSeek has released R1, their latest reasoning-focused model...", category: "release", authorName: "Sarah Walsh", readTime: 6, status: "published", publishedAt: new Date("2025-01-22") },
    { title: "Llama 4 Maverick: Meta Goes Multimodal", slug: "llama-4-maverick", excerpt: "Meta's latest open model brings native multimodal capabilities to the Llama family.", content: "Meta has released Llama 4 Maverick with 400B parameters...", category: "release", authorName: "ToolSphere", readTime: 5, status: "published", publishedAt: new Date("2025-04-06") },
  ];

  for (const n of news) {
    await prisma.newsArticle.upsert({
      where: { slug: n.slug },
      update: {},
      create: { ...n, tags: "[]" },
    });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
