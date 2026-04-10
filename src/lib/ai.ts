import { env } from "process";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function processToolWithAI(
  toolName: string,
  toolDescription: string,
  toolUrl: string
): Promise<{ longDescription: string; llmCategory: string }> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set. Please provide it in the .env file.");
  }

  const prompt = `You are a helpful, beginner-friendly assistant curating an AI tools library.
Your goal is to write extremely simple, beginner-friendly copy. Explain what the tool does like you are explaining it to a junior developer or a non-technical enthusiast. Use 2 short sentences.

Then, you must strictly assign the tool to one of these 4 exact categories based on its type:
1. "Foundation Model" (if it is an AI model like Llama, GPT, etc.)
2. "MCP Server" (if it is a Model Context Protocol server/bridge)
3. "CLI Skill" (if it is a terminal script, CLI tool, or local script)
4. "App" (if it is a web app, desktop app, code editor, UI, or SaaS)

Tool Name: ${toolName}
Raw Description: ${toolDescription}
URL: ${toolUrl}

Respond in the following JSON format strictly:
{
  "longDescription": "Your highly accessible, simple 2-sentence description.",
  "llmCategory": "One of the 4 strict categories above"
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "ToolSphere",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "z-ai/glm-4.5-air:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  try {
    const result = JSON.parse(data.choices[0].message.content);
    return {
      longDescription: result.longDescription || toolDescription,
      llmCategory: result.llmCategory || "Specialized AI"
    };
  } catch (err) {
    return { longDescription: toolDescription, llmCategory: "Specialized AI" };
  }
}
