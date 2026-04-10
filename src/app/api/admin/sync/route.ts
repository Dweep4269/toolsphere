import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const SYNC_ENDPOINTS: Record<string, string> = {
  fmhy: "/api/integrations/fmhy/sync",
  mcp: "/api/integrations/mcp/sync",
  skills: "/api/integrations/skills/sync",
  huggingface: "/api/integrations/huggingface/sync",
  rss: "/api/integrations/rss/sync",
  hackernews: "/api/integrations/hackernews/sync",
  paperswithcode: "/api/integrations/paperswithcode/sync",
  "enrich-descriptions": "/api/admin/enrich-descriptions",
};

type SyncRequestBody = {
  targets?: string[];
  limit?: number;
  fmhySections?: string[];
};

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: SyncRequestBody = {};

  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const requestedTargets = body.targets?.length ? body.targets : Object.keys(SYNC_ENDPOINTS);
  const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 100);

  const targets = requestedTargets.filter((target) => SYNC_ENDPOINTS[target]);
  if (targets.length === 0) {
    return NextResponse.json({ success: false, message: "No valid sync targets provided." }, { status: 400 });
  }

  const baseUrl = getBaseUrl(request);

  const results = await Promise.all(
    targets.map(async (target) => {
      const startedAt = Date.now();
      try {
        const response = await fetch(`${baseUrl}${SYNC_ENDPOINTS[target]}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            target === "fmhy"
              ? { limit, sections: body.fmhySections ?? [] }
              : { limit }
          ),
          cache: "no-store",
        });

        const durationMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => ({}))) as unknown;

        return {
          target,
          success: response.ok,
          status: response.status,
          durationMs,
          payload,
        };
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        return {
          target,
          success: false,
          status: 0,
          durationMs,
          payload: {
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    })
  );

  const successCount = results.filter((result) => result.success).length;

  return NextResponse.json({
    success: successCount > 0,
    meta: {
      requested: targets.length,
      succeeded: successCount,
      failed: targets.length - successCount,
    },
    data: results,
  });
}
