require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Categories
  const categories = [
    { name: "MCP Servers", slug: "mcps", color: "#4EC5D4", toolCount: 247 },
    { name: "Agent Skills", slug: "agent-skills", color: "#C8A87C", toolCount: 182 },
    { name: "Code & CLI", slug: "code-cli", color: "#5B9A42", toolCount: 156 },
    { name: "Agentic IDEs", slug: "agentic-ides", color: "#E8604A", toolCount: 24 },
    { name: "Audio & Voice", slug: "audio-voice", color: "#9472C4", toolCount: 89 },
    { name: "Writing & Docs", slug: "writing-docs", color: "#C49264", toolCount: 134 },
  ];

  const createdCategories: Record<string, any> = {};
  for (const cat of categories) {
    createdCategories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        toolCount: cat.toolCount,
      },
    });
  }

  // 2. Tools
  const tools = [
    {
      name: "Cursor",
      slug: "cursor",
      description: "The AI-first code editor built for pair programming.",
      url: "https://cursor.sh",
      pricingType: "freemium",
      pricingDetails: "$20/month",
      ratingOverall: 4.9,
      features: JSON.stringify(["Copilot", "Chat", "Codebase Knowledge"]),
      categoryId: createdCategories["agentic-ides"].id
    },
    {
      name: "Claude Code",
      slug: "claude-code",
      description: "An agentic coding companion that operates directly in your terminal.",
      url: "https://anthropic.com",
      pricingType: "paid",
      pricingDetails: "API usage pricing",
      ratingOverall: 4.8,
      features: JSON.stringify(["CLI", "Refactoring", "Testing"]),
      categoryId: createdCategories["code-cli"].id
    },
    {
      name: "ElevenLabs",
      slug: "elevenlabs",
      description: "The most realistic AI voice generator and text to speech software.",
      url: "https://elevenlabs.io",
      pricingType: "freemium",
      pricingDetails: "Starts free",
      ratingOverall: 4.9,
      features: JSON.stringify(["TTS", "Voice Cloning"]),
      categoryId: createdCategories["audio-voice"].id
    },
    {
      name: "Windsurf",
      slug: "windsurf",
      description: "A fast, collaborative agentic IDE by Codeium.",
      url: "https://codeium.com/windsurf",
      pricingType: "freemium",
      pricingDetails: "Pro $15/m",
      ratingOverall: 4.8,
      features: JSON.stringify(["Codeium integration", "Workspaces"]),
      categoryId: createdCategories["agentic-ides"].id
    },
    {
      name: "v0 by Vercel",
      slug: "v0",
      description: "Generate UI directly from text prompts.",
      url: "https://v0.dev",
      pricingType: "freemium",
      pricingDetails: "Credit based",
      ratingOverall: 4.8,
      features: JSON.stringify(["React", "Tailwind", "Shadcn"]),
      categoryId: createdCategories["code-cli"].id
    },
    {
      name: "Bolt.new",
      slug: "bolt-new",
      description: "Prompt, run, edit, and deploy full-stack web apps in the browser.",
      url: "https://bolt.new",
      pricingType: "freemium",
      pricingDetails: "Paid tier",
      ratingOverall: 4.7,
      features: JSON.stringify(["Fullstack", "WebContainers"]),
      categoryId: createdCategories["agent-skills"].id
    }
  ];

  for (const t of tools) {
    const { categoryId, ...toolData } = t;
    await prisma.tool.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        ...toolData,
        categories: {
          create: [{ categoryId: categoryId }]
        }
      }
    });
  }

  // 3. Benchmarks
  const benchmarks = [
    { name: "Claude 3.5 Sonnet", provider: "Anthropic", releaseDate: new Date("2024-06-20"), contextWindow: 200000, pricingInput: 3, pricingOutput: 15, scores: JSON.stringify({ overall: 94.2, coding: 92.0, reasoning: 91.5, creative: 89.0, multimodal: 88.0, math: 90.0, knowledge: 89.5 }) },
    { name: "GPT-4o", provider: "OpenAI", releaseDate: new Date("2024-05-13"), contextWindow: 128000, pricingInput: 5, pricingOutput: 15, scores: JSON.stringify({ overall: 93.8, coding: 90.2, reasoning: 92.0, creative: 91.5, multimodal: 93.0, math: 89.5, knowledge: 91.0 }) },
    { name: "Llama 3 (70B)", provider: "Meta", releaseDate: new Date("2024-04-18"), contextWindow: 8192, pricingInput: 0.5, pricingOutput: 0.5, scores: JSON.stringify({ overall: 89.5, coding: 84.5, reasoning: 86.2, creative: 85.0, multimodal: 0, math: 82.0, knowledge: 88.5 }) },
  ];

  for (const bm of benchmarks) {
    await prisma.benchmarkModel.upsert({
      where: { name: bm.name },
      update: {},
      create: bm
    });
  }

  // 4. News
  const news = [
    { title: "Anthropic Launches Claude Code", slug: "claude-code-launch", excerpt: "The new agentic CLI tool aims to replace standard terminal workflows.", content: "Full content here...", category: "release", authorName: "Emily Chen", readTime: 5 },
    { title: "The Rise of MCPs in Agent Architectures", slug: "rise-of-mcps", excerpt: "Model Context Protocol is becoming the standard for tool use.", content: "Content...", category: "analysis", authorName: "David Kim", readTime: 8 },
  ];

  for (const n of news) {
    await prisma.newsArticle.upsert({
      where: { slug: n.slug },
      update: {},
      create: n
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
