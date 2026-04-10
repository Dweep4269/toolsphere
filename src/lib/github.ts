const GITHUB_HEADERS: Record<string, string> = {
  "User-Agent": "ToolSphere-Sync-Bot",
  Accept: "application/vnd.github.v3+json",
};

function getHeaders(): Record<string, string> {
  const h = { ...GITHUB_HEADERS };
  if (process.env.GITHUB_TOKEN) {
    h["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

let rateLimitRemaining = 30;
let rateLimitReset = 0;

function updateRateLimit(res: Response) {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  if (remaining) rateLimitRemaining = parseInt(remaining, 10);
  if (reset) rateLimitReset = parseInt(reset, 10);
}

async function waitForRateLimit(): Promise<void> {
  if (rateLimitRemaining > 2) return;
  const now = Math.floor(Date.now() / 1000);
  const waitSec = Math.max(rateLimitReset - now + 1, 1);
  if (waitSec > 30) return;
  await new Promise((r) => setTimeout(r, waitSec * 1000));
}

export async function fetchReadmeExcerpt(repoFullName: string, maxLen = 300): Promise<string | null> {
  try {
    await waitForRateLimit();
    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/readme`,
      { headers: { ...getHeaders(), Accept: "application/vnd.github.v3.raw" } }
    );
    updateRateLimit(res);
    if (!res.ok) return null;

    const raw = await res.text();

    let cleaned = raw
      .replace(/^#[^\n]+\n*/gm, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/^\s*[-*>]\s*/gm, "")
      .replace(/\n{2,}/g, "\n")
      .trim();

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.length > 15);
    let excerpt = "";
    for (const s of sentences) {
      if ((excerpt + " " + s).length > maxLen) break;
      excerpt = excerpt ? excerpt + " " + s : s;
    }

    return excerpt.trim() || cleaned.slice(0, maxLen).trim() || null;
  } catch {
    return null;
  }
}

export async function searchGitHubRepos(
  query: string,
  opts: { sort?: string; perPage?: number } = {}
): Promise<Array<{
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  topics: string[];
}>> {
  const sort = opts.sort ?? "stars";
  const perPage = opts.perPage ?? 30;

  await waitForRateLimit();
  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${perPage}`,
    { headers: getHeaders() }
  );
  updateRateLimit(res);

  if (res.status === 403 || res.status === 429) {
    console.error(`GitHub rate limit hit (${rateLimitRemaining} remaining, resets at ${rateLimitReset})`);
    return [];
  }

  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  return data.items || [];
}
