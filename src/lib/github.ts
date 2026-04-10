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

export async function fetchReadmeExcerpt(repoFullName: string, maxLen = 300): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/readme`,
      { headers: { ...getHeaders(), Accept: "application/vnd.github.v3.raw" } }
    );
    if (!res.ok) return null;

    const raw = await res.text();

    let cleaned = raw
      .replace(/^#[^\n]+\n*/gm, "")          // remove headings
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")   // remove images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
      .replace(/<[^>]+>/g, "")                 // strip HTML
      .replace(/```[\s\S]*?```/g, "")          // remove code blocks
      .replace(/`[^`]+`/g, "")                 // remove inline code
      .replace(/^\s*[-*>]\s*/gm, "")           // strip list markers
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

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${perPage}`,
    { headers: getHeaders() }
  );

  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  return data.items || [];
}
