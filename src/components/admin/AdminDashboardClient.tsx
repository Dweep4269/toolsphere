"use client";

import { useMemo, useState } from "react";
import { FMHY_SECTION_OPTIONS } from "@/lib/fmhySections";

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  source: string;
  ratingOverall: number | null;
  pricingType: string;
  verified: boolean;
  status: string;
  url?: string;
  description?: string;
  longDescription?: string | null;
  descriptionSource?: string;
  documentationUrl?: string | null;
  githubUrl?: string | null;
  pricingDetails?: string | null;
  fmhySection?: string | null;
  tags?: string;
  lastSyncedAt?: Date | null;
};

type DraftRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  authorName: string;
  readTime: number;
  publishedAt: Date | null;
};

type DashboardStats = { tools: number; newsTotal: number; drafts: number; published: number };
type SyncResult = { target: string; success: boolean; status: number; durationMs: number };

type Props = {
  initialTools: ToolRow[];
  initialDrafts: DraftRow[];
  initialStats: DashboardStats;
};

type QueueSort = "name" | "source" | "newest";

const SYNC_TARGETS = [
  { key: "fmhy", label: "FMHY (Ground Truth)" },
  { key: "mcp", label: "MCP Servers (GitHub)" },
  { key: "skills", label: "Agent Skills (GitHub)" },
  { key: "huggingface", label: "HuggingFace" },
  { key: "rss", label: "RSS" },
  { key: "hackernews", label: "HackerNews" },
  { key: "paperswithcode", label: "PapersWithCode" },
  { key: "enrich-descriptions", label: "Enrich README Descriptions" },
] as const;

const SUGGESTED_TAGS = [
  "Foundation Model", "MCP Server", "CLI Skill", "App", "Coding", "Image",
  "Voice", "Writing", "Data", "Automation", "Chatbot", "API", "Open Source",
  "Agent", "Multimodal", "Reasoning", "RAG", "Fine-tuning",
];

export default function AdminDashboardClient({ initialTools, initialDrafts, initialStats }: Props) {
  const [tools, setTools] = useState<ToolRow[]>(initialTools);
  const [drafts, setDrafts] = useState<DraftRow[]>(initialDrafts);
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  const [toolSearch, setToolSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [newsFilter, setNewsFilter] = useState<"all" | "draft" | "published">("all");
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<Partial<ToolRow>>({});
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<DraftRow>>({});

  const [newTool, setNewTool] = useState({ name: "", slug: "", description: "", url: "", pricingType: "freemium", pricingDetails: "" });
  const [newArticle, setNewArticle] = useState({ title: "", slug: "", excerpt: "", content: "", category: "release", status: "draft", authorName: "ToolSphere" });

  const [isCreatingTool, setIsCreatingTool] = useState(false);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSyncTargets, setSelectedSyncTargets] = useState<string[]>(SYNC_TARGETS.map((t) => t.key));
  const [selectedFmhySections, setSelectedFmhySections] = useState<string[]>(FMHY_SECTION_OPTIONS.map((item) => item.key));
  const [message, setMessage] = useState("");
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [statsUpdated, setStatsUpdated] = useState(false);

  // Multiselect state for review queue
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queueSort, setQueueSort] = useState<QueueSort>("newest");
  const [queueSourceFilter, setQueueSourceFilter] = useState("all");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const filteredTools = useMemo(() => {
    let result = tools;
    if (sourceFilter !== "all") result = result.filter((t) => t.source === sourceFilter);
    const q = toolSearch.trim().toLowerCase();
    if (!q) return result;
    return result.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || t.source.toLowerCase().includes(q));
  }, [tools, toolSearch, sourceFilter]);

  const filteredDrafts = useMemo(() => {
    if (newsFilter === "all") return drafts;
    return drafts.filter((item) => item.status === newsFilter);
  }, [drafts, newsFilter]);

  const ingestionReviewQueue = useMemo(() => {
    let queue = tools.filter((t) => t.source !== "manual" && !t.verified && t.status !== "hidden");

    if (queueSourceFilter !== "all") queue = queue.filter((t) => t.source === queueSourceFilter);

    queue.sort((a, b) => {
      if (queueSort === "name") return a.name.localeCompare(b.name);
      if (queueSort === "source") return a.source.localeCompare(b.source);
      return 0;
    });

    return queue;
  }, [tools, queueSort, queueSourceFilter]);

  const queueSources = useMemo(() => {
    const set = new Set(tools.filter((t) => t.source !== "manual" && !t.verified && t.status !== "hidden").map((t) => t.source));
    return Array.from(set).sort();
  }, [tools]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === ingestionReviewQueue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ingestionReviewQueue.map((t) => t.id)));
    }
  }

  async function bulkVerify() {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    setMessage("");
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/tools/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified: true, status: "active" }),
        });
        if (res.ok) successCount++;
      } catch { /* continue */ }
    }

    setTools((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, verified: true, status: "active" } : t));
    setSelectedIds(new Set());
    setMessage(`Verified ${successCount} tools.`);
    setIsBulkProcessing(false);
  }

  async function bulkReject() {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    setMessage("");
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/tools/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "hidden" }),
        });
        if (res.ok) successCount++;
      } catch { /* continue */ }
    }

    setTools((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, status: "hidden" } : t));
    setSelectedIds(new Set());
    setMessage(`Rejected ${successCount} tools.`);
    setIsBulkProcessing(false);
  }

  async function createTool() {
    setIsCreatingTool(true); setMessage("");
    try {
      const response = await fetch("/api/admin/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTool) });
      const payload = (await response.json()) as { success: boolean; data?: ToolRow; message?: string };
      if (!response.ok || !payload.success || !payload.data) { setMessage(payload.message || "Failed to create tool."); return; }
      setTools((prev) => [payload.data as ToolRow, ...prev]);
      setStats((prev) => ({ ...prev, tools: prev.tools + 1 }));
      setNewTool({ name: "", slug: "", description: "", url: "", pricingType: "freemium", pricingDetails: "" });
      setMessage("Tool created.");
    } catch { setMessage("Failed to create tool."); }
    finally { setIsCreatingTool(false); }
  }

  async function createArticle() {
    setIsCreatingArticle(true); setMessage("");
    try {
      const response = await fetch("/api/admin/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newArticle) });
      const payload = (await response.json()) as { success: boolean; data?: DraftRow; message?: string };
      if (!response.ok || !payload.success || !payload.data) { setMessage(payload.message || "Failed to create article."); return; }
      setDrafts((prev) => [payload.data as DraftRow, ...prev]);
      setStats((prev) => ({ ...prev, newsTotal: prev.newsTotal + 1, drafts: payload.data?.status === "draft" ? prev.drafts + 1 : prev.drafts, published: payload.data?.status === "published" ? prev.published + 1 : prev.published }));
      setNewArticle({ title: "", slug: "", excerpt: "", content: "", category: "release", status: "draft", authorName: "ToolSphere" });
      setMessage("Article created.");
    } catch { setMessage("Failed to create article."); }
    finally { setIsCreatingArticle(false); }
  }

  async function toggleToolVerification(tool: ToolRow) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tools/${tool.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: !tool.verified }) });
      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) { setMessage(payload.message || "Failed to update tool."); return; }
      setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, verified: !item.verified } : item)));
      setMessage("Tool updated.");
    } catch { setMessage("Failed to update tool."); }
  }

  function startToolEdit(tool: ToolRow) { setEditingToolId(tool.id); setEditingTool({ ...tool }); }
  function cancelToolEdit() { setEditingToolId(null); setEditingTool({}); }

  async function saveToolEdit(toolId: string) {
    if (!editingTool) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingTool) });
      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) { setMessage(payload.message || "Failed to update tool."); return; }
      setTools((prev) => prev.map((item) => (item.id === toolId ? ({ ...item, ...editingTool } as ToolRow) : item)));
      setEditingToolId(null); setEditingTool({});
      setMessage("Tool saved.");
    } catch { setMessage("Failed to update tool."); }
  }

  async function deleteTool(toolId: string) {
    if (!confirm("Are you sure you want to delete this tool?")) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, { method: "DELETE" });
      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) { setMessage(payload.message || "Failed to delete tool."); return; }
      setTools((prev) => prev.filter((t) => t.id !== toolId));
      setStats((prev) => ({ ...prev, tools: Math.max(0, prev.tools - 1) }));
      if (editingToolId === toolId) cancelToolEdit();
      setMessage("Tool deleted.");
    } catch { setMessage("Failed to delete tool."); }
  }

  function startDraftEdit(draft: DraftRow) { setEditingDraftId(draft.id); setEditingDraft({ ...draft }); }
  function cancelDraftEdit() { setEditingDraftId(null); setEditingDraft({}); }

  async function saveDraftEdit(draftId: string) {
    if (!editingDraft) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/news/${draftId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingDraft) });
      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) { setMessage(payload.message || "Failed to update article."); return; }
      setDrafts((prev) => prev.map((item) => (item.id === draftId ? ({ ...item, ...editingDraft } as DraftRow) : item)));
      setEditingDraftId(null); setEditingDraft({});
      setMessage("Article saved.");
    } catch { setMessage("Failed to update article."); }
  }

  async function deleteDraft(draftId: string) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/news/${draftId}`, { method: "DELETE" });
      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) { setMessage(payload.message || "Failed to delete article."); return; }
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      setStats((prev) => ({ ...prev, newsTotal: Math.max(0, prev.newsTotal - 1) }));
      if (editingDraftId === draftId) cancelDraftEdit();
      setMessage("Article deleted.");
    } catch { setMessage("Failed to delete article."); }
  }

  async function publishDraft(draft: DraftRow) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/news/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published" }) });
      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) { setMessage(payload.message || "Failed to publish article."); return; }
      setDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, status: "published" } : item)));
      setStats((prev) => ({ ...prev, drafts: Math.max(0, prev.drafts - 1), published: prev.published + 1 }));
      setMessage("Article published.");
    } catch { setMessage("Failed to publish article."); }
  }

  async function runSync() {
    setIsSyncing(true); setMessage("");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targets: selectedSyncTargets, limit: 10, fmhySections: selectedFmhySections }) });
      const payload = (await res.json()) as { success: boolean; meta?: { succeeded?: number; failed?: number }; data?: SyncResult[]; message?: string };
      if (!res.ok) { setMessage(payload.message || "Sync failed."); return; }
      setMessage(`Sync finished: ${payload.meta?.succeeded ?? 0} succeeded, ${payload.meta?.failed ?? 0} failed.`);
      setSyncHistory(payload.data ?? []);
      try {
        const countRes = await fetch("/api/admin/stats");
        if (countRes.ok) {
          const countData = (await countRes.json()) as { success: boolean; data?: DashboardStats };
          if (countData.success && countData.data) { setStats(countData.data); setStatsUpdated(true); setTimeout(() => setStatsUpdated(false), 1000); }
        }
      } catch { /* graceful */ }
    } catch { setMessage("Sync failed."); }
    finally { setIsSyncing(false); }
  }

  function sourceBadgeClass(source: string) {
    if (source === "fmhy") return "admin-source-badge admin-source-badge--fmhy";
    if (source === "api") return "admin-source-badge admin-source-badge--api";
    return "admin-source-badge admin-source-badge--manual";
  }

  function addSuggestedTag(tag: string) {
    const currentTags = editingTool.tags || "[]";
    try {
      const arr = JSON.parse(currentTags) as string[];
      if (!arr.includes(tag)) {
        setEditingTool((prev) => ({ ...prev, tags: JSON.stringify([...arr, tag]) }));
      }
    } catch {
      setEditingTool((prev) => ({ ...prev, tags: JSON.stringify([tag]) }));
    }
  }

  function removeTag(tag: string) {
    const currentTags = editingTool.tags || "[]";
    try {
      const arr = (JSON.parse(currentTags) as string[]).filter((t) => t !== tag);
      setEditingTool((prev) => ({ ...prev, tags: JSON.stringify(arr) }));
    } catch { /* noop */ }
  }

  function getEditingTags(): string[] {
    try { return JSON.parse(editingTool.tags || "[]") as string[]; } catch { return []; }
  }

  return (
    <div className="admin-panel">
      <div className="admin-stats">
        <article className={`admin-stat-card ${statsUpdated ? "admin-stat-card--updated" : ""}`}>
          <h3>Total tools</h3><p>{stats.tools}</p>
        </article>
        <article className={`admin-stat-card ${statsUpdated ? "admin-stat-card--updated" : ""}`}>
          <h3>News total</h3><p>{stats.newsTotal}</p>
        </article>
        <article className={`admin-stat-card ${statsUpdated ? "admin-stat-card--updated" : ""}`}>
          <h3>Drafts</h3><p>{stats.drafts}</p>
        </article>
        <article className={`admin-stat-card ${statsUpdated ? "admin-stat-card--updated" : ""}`}>
          <h3>Published</h3><p>{stats.published}</p>
        </article>
      </div>

      {/* Sync Controls */}
      <div className="admin-section">
        <div className="section-header">
          <h2 className="section-title">Sync controls</h2>
          <p className="section-subtitle">Trigger ingestion endpoints manually before deployment.</p>
        </div>
        <div className="admin-chip-group">
          {SYNC_TARGETS.map((target) => (
            <button key={target.key} className={`admin-chip ${selectedSyncTargets.includes(target.key) ? "active" : ""}`} onClick={() => setSelectedSyncTargets((prev) => prev.includes(target.key) ? prev.filter((i) => i !== target.key) : [...prev, target.key])} type="button">{target.label}</button>
          ))}
        </div>
        {selectedSyncTargets.includes("fmhy") && (
          <div className="admin-section" style={{ padding: "0.75rem" }}>
            <p className="section-subtitle">FMHY sections</p>
            <div className="admin-chip-group">
              {FMHY_SECTION_OPTIONS.map((section) => (
                <button key={section.key} className={`admin-chip ${selectedFmhySections.includes(section.key) ? "active" : ""}`} onClick={() => setSelectedFmhySections((prev) => prev.includes(section.key) ? prev.filter((i) => i !== section.key) : [...prev, section.key])} type="button">{section.label}</button>
              ))}
            </div>
          </div>
        )}
        <button className={`nav-cta ${isSyncing ? "admin-sync-active" : ""}`} type="button" onClick={runSync} disabled={isSyncing || selectedSyncTargets.length === 0 || (selectedSyncTargets.includes("fmhy") && selectedFmhySections.length === 0)}>
          {isSyncing && <span className="admin-sync-indicator admin-sync-indicator--active" />}
          {isSyncing ? "Running sync..." : "Run selected syncs"}
        </button>
        {syncHistory.length > 0 && (
          <div className="admin-list">
            {syncHistory.map((item) => (
              <article key={`${item.target}-${item.status}-${item.durationMs}`} className="admin-list-row">
                <div><h3>{item.target}</h3><p>status: {item.status} &bull; duration: {item.durationMs}ms</p></div>
                <span className={item.success ? "admin-verified-badge" : "admin-unverified-badge"}>{item.success ? "ok" : "failed"}</span>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Ingestion Review Queue - Enhanced */}
      <div className="admin-section">
        <div className="section-header">
          <h2 className="section-title">Ingestion review queue</h2>
          <p className="section-subtitle">{ingestionReviewQueue.length} pending items</p>
        </div>

        <div className="admin-filter-row" style={{ marginBottom: "0.75rem" }}>
          <select className="admin-input" value={queueSort} onChange={(e) => setQueueSort(e.target.value as QueueSort)} style={{ maxWidth: "160px" }}>
            <option value="newest">Newest first</option>
            <option value="name">Sort by name</option>
            <option value="source">Sort by source</option>
          </select>
          <select className="admin-input" value={queueSourceFilter} onChange={(e) => setQueueSourceFilter(e.target.value)} style={{ maxWidth: "160px" }}>
            <option value="all">All sources</option>
            {queueSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {selectedIds.size > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
              <button className="nav-cta" type="button" onClick={bulkVerify} disabled={isBulkProcessing} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                {isBulkProcessing ? "Processing..." : `Verify ${selectedIds.size} selected`}
              </button>
              <button className="admin-inline-btn" type="button" onClick={bulkReject} disabled={isBulkProcessing} style={{ color: "#e55" }}>
                Reject {selectedIds.size}
              </button>
            </div>
          )}
        </div>

        <div className="admin-table-container" style={{ maxHeight: "600px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              <tr>
                <th style={{ padding: "0.75rem", width: "40px" }}>
                  <input type="checkbox" checked={selectedIds.size === ingestionReviewQueue.length && ingestionReviewQueue.length > 0} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                </th>
                <th style={{ padding: "0.75rem", fontWeight: "600" }}>Name</th>
                <th style={{ padding: "0.75rem", fontWeight: "600" }}>Source</th>
                <th style={{ padding: "0.75rem", fontWeight: "600" }}>Category / Tags</th>
                <th style={{ padding: "0.75rem", fontWeight: "600", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingestionReviewQueue.map((tool) => (
                <tr key={tool.id} style={{ borderBottom: "1px solid var(--border)", background: selectedIds.has(tool.id) ? "rgba(200,168,124,0.06)" : "var(--surface)" }}>
                  <td style={{ padding: "0.75rem" }}>
                    <input type="checkbox" checked={selectedIds.has(tool.id)} onChange={() => toggleSelect(tool.id)} style={{ cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ fontWeight: "500", color: "var(--text)" }}>
                      {tool.name}
                      {tool.url && <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "0.5rem", color: "var(--teal)", fontSize: "0.7rem" }}>visit</a>}
                    </div>
                    {(tool.longDescription || tool.description) && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "2px", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(tool.longDescription || tool.description || "").slice(0, 100)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span className={sourceBadgeClass(tool.source)}>{tool.source}</span>
                    {tool.descriptionSource === "github-readme" && <span className="admin-description-badge" style={{ marginLeft: "4px" }}>README</span>}
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{tool.fmhySection || "general"}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    <button className="admin-inline-btn" type="button" onClick={() => startToolEdit(tool)}>Review</button>
                  </td>
                </tr>
              ))}
              {ingestionReviewQueue.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>No pending imported tools.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Create Tool */}
        <div className="admin-section">
          <div className="section-header"><h2 className="section-title">Create tool</h2></div>
          <div className="admin-form-grid">
            <input className="admin-input" placeholder="Name" value={newTool.name} onChange={(e) => setNewTool((p) => ({ ...p, name: e.target.value }))} />
            <input className="admin-input" placeholder="Slug (optional)" value={newTool.slug} onChange={(e) => setNewTool((p) => ({ ...p, slug: e.target.value }))} />
            <input className="admin-input" placeholder="URL" value={newTool.url} onChange={(e) => setNewTool((p) => ({ ...p, url: e.target.value }))} />
            <select className="admin-input" value={newTool.pricingType} onChange={(e) => setNewTool((p) => ({ ...p, pricingType: e.target.value }))}>
              <option value="free">free</option><option value="freemium">freemium</option><option value="paid">paid</option><option value="opensource">opensource</option>
            </select>
            <input className="admin-input" placeholder="Pricing details" value={newTool.pricingDetails} onChange={(e) => setNewTool((p) => ({ ...p, pricingDetails: e.target.value }))} />
            <textarea className="admin-input admin-textarea" placeholder="Description" value={newTool.description} onChange={(e) => setNewTool((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <button className="nav-cta" type="button" onClick={createTool} disabled={isCreatingTool}>{isCreatingTool ? "Creating..." : "Create tool"}</button>
        </div>

        {/* Create Article */}
        <div className="admin-section">
          <div className="section-header"><h2 className="section-title">Create article</h2></div>
          <div className="admin-form-grid">
            <input className="admin-input" placeholder="Title" value={newArticle.title} onChange={(e) => setNewArticle((p) => ({ ...p, title: e.target.value }))} />
            <input className="admin-input" placeholder="Slug (optional)" value={newArticle.slug} onChange={(e) => setNewArticle((p) => ({ ...p, slug: e.target.value }))} />
            <select className="admin-input" value={newArticle.category} onChange={(e) => setNewArticle((p) => ({ ...p, category: e.target.value }))}>
              <option value="release">release</option><option value="guide">guide</option><option value="analysis">analysis</option><option value="breaking">breaking</option><option value="opinion">opinion</option>
            </select>
            <select className="admin-input" value={newArticle.status} onChange={(e) => setNewArticle((p) => ({ ...p, status: e.target.value }))}>
              <option value="draft">draft</option><option value="published">published</option>
            </select>
            <input className="admin-input" placeholder="Author" value={newArticle.authorName} onChange={(e) => setNewArticle((p) => ({ ...p, authorName: e.target.value }))} />
            <textarea className="admin-input admin-textarea" placeholder="Excerpt" value={newArticle.excerpt} onChange={(e) => setNewArticle((p) => ({ ...p, excerpt: e.target.value }))} />
            <textarea className="admin-input admin-textarea" placeholder="Content (markdown)" value={newArticle.content} onChange={(e) => setNewArticle((p) => ({ ...p, content: e.target.value }))} />
          </div>
          <button className="nav-cta" type="button" onClick={createArticle} disabled={isCreatingArticle}>{isCreatingArticle ? "Creating..." : "Create article"}</button>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Tools List */}
        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">Tools</h2>
            <div className="admin-filter-row">
              <input className="admin-input" placeholder="Search tools" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} />
              <select className="admin-input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="all">all sources</option><option value="manual">manual</option><option value="api">api</option><option value="fmhy">fmhy</option><option value="github-skills">github-skills</option><option value="github-mcp">github-mcp</option>
              </select>
            </div>
          </div>
          <div className="admin-list">
            {filteredTools.map((tool) => (
              <div key={tool.id} className="admin-list-item-wrap">
                <article className="admin-list-row">
                  <div>
                    <h3>{tool.name}</h3>
                    <p>
                      {tool.slug} &bull; {tool.pricingType}
                      <span className={sourceBadgeClass(tool.source)}>{tool.source}</span>
                      <span className={tool.verified ? "admin-verified-badge" : "admin-unverified-badge"}>{tool.verified ? "verified" : "unverified"}</span>
                      <span className="admin-description-badge">{tool.descriptionSource || "raw"}</span>
                    </p>
                  </div>
                  <div className="admin-inline-actions">
                    <button className="admin-inline-btn" type="button" onClick={() => toggleToolVerification(tool)}>{tool.verified ? "Unverify" : "Verify"}</button>
                    <button className="admin-inline-btn" type="button" onClick={() => startToolEdit(tool)}>Edit</button>
                    <button className="admin-inline-btn" type="button" onClick={() => deleteTool(tool.id)}>Delete</button>
                  </div>
                </article>

                {editingToolId === tool.id && (
                  <div className="admin-editor">
                    <div className="admin-form-grid">
                      <input className="admin-input" placeholder="name" value={editingTool.name || ""} onChange={(e) => setEditingTool((p) => ({ ...p, name: e.target.value }))} />
                      <textarea className="admin-input admin-textarea" placeholder="Short Description (raw)" value={editingTool.description || ""} onChange={(e) => setEditingTool((p) => ({ ...p, description: e.target.value }))} />
                      <textarea className="admin-input admin-textarea" placeholder="Curated Description" value={editingTool.longDescription || ""} onChange={(e) => setEditingTool((p) => ({ ...p, longDescription: e.target.value }))} />

                      <div className="admin-radio-group">
                        <label><input type="radio" checked={editingTool.descriptionSource === "raw"} onChange={() => setEditingTool((p) => ({ ...p, descriptionSource: "raw", longDescription: "" }))} /> Use raw description</label>
                        <label><input type="radio" checked={editingTool.descriptionSource === "github-readme"} onChange={() => setEditingTool((p) => ({ ...p, descriptionSource: "github-readme" }))} /> From GitHub README</label>
                        <label><input type="radio" checked={editingTool.descriptionSource === "manual"} onChange={() => setEditingTool((p) => ({ ...p, descriptionSource: "manual" }))} /> Write custom description</label>
                      </div>

                      <input className="admin-input" placeholder="url" value={editingTool.url || ""} onChange={(e) => setEditingTool((p) => ({ ...p, url: e.target.value }))} />
                      <input className="admin-input" placeholder="documentationUrl" value={editingTool.documentationUrl || ""} onChange={(e) => setEditingTool((p) => ({ ...p, documentationUrl: e.target.value || null }))} />
                      <input className="admin-input" placeholder="githubUrl" value={editingTool.githubUrl || ""} onChange={(e) => setEditingTool((p) => ({ ...p, githubUrl: e.target.value || null }))} />
                      <select className="admin-input" value={editingTool.pricingType || "freemium"} onChange={(e) => setEditingTool((p) => ({ ...p, pricingType: e.target.value }))}>
                        <option value="free">free</option><option value="freemium">freemium</option><option value="paid">paid</option><option value="opensource">opensource</option>
                      </select>
                      <input className="admin-input" placeholder="pricing details" value={editingTool.pricingDetails || ""} onChange={(e) => setEditingTool((p) => ({ ...p, pricingDetails: e.target.value || null }))} />

                      {/* Autotagging Section */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "600" }}>Tags (click to add)</p>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                          {getEditingTags().map((tag) => (
                            <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", background: "var(--gold)", color: "var(--gold-on)", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }} onClick={() => removeTag(tag)}>
                              {tag} &times;
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {SUGGESTED_TAGS.filter((t) => !getEditingTags().includes(t)).map((tag) => (
                            <button key={tag} type="button" className="admin-chip" onClick={() => addSuggestedTag(tag)} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>{tag}</button>
                          ))}
                        </div>
                      </div>

                      <select className="admin-input" value={editingTool.fmhySection || ""} onChange={(e) => setEditingTool((p) => ({ ...p, fmhySection: e.target.value || null }))}>
                        <option value="">No Category</option>
                        <option value="Foundation Model">Foundation Model</option>
                        <option value="MCP Server">MCP Server</option>
                        <option value="CLI Skill">CLI Skill</option>
                        <option value="App">App</option>
                      </select>
                      <input className="admin-input" type="number" step="0.1" placeholder="rating" value={editingTool.ratingOverall ?? ""} onChange={(e) => setEditingTool((p) => ({ ...p, ratingOverall: e.target.value ? Number(e.target.value) : null }))} />
                      <label className="admin-inline-check"><input type="checkbox" checked={Boolean(editingTool.verified)} onChange={(e) => setEditingTool((p) => ({ ...p, verified: e.target.checked }))} /> verified</label>
                      <select className="admin-input" value={editingTool.status || "active"} onChange={(e) => setEditingTool((p) => ({ ...p, status: e.target.value }))}>
                        <option value="active">active</option><option value="hidden">hidden</option><option value="pending">pending</option>
                      </select>
                    </div>
                    <div className="admin-inline-actions">
                      <button className="admin-inline-btn" type="button" onClick={() => saveToolEdit(tool.id)}>Save</button>
                      <button className="admin-inline-btn" type="button" onClick={cancelToolEdit}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredTools.length === 0 && <p className="admin-empty">No tools found.</p>}
          </div>
        </div>

        {/* News Moderation */}
        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">News moderation</h2>
            <select className="admin-input" value={newsFilter} onChange={(e) => setNewsFilter(e.target.value as "all" | "draft" | "published")}>
              <option value="all">all</option><option value="draft">draft</option><option value="published">published</option>
            </select>
          </div>
          <div className="admin-list">
            {filteredDrafts.map((draft) => (
              <div key={draft.id} className="admin-list-item-wrap">
                <article className="admin-list-row">
                  <div><h3>{draft.title}</h3><p>{draft.category} &bull; {draft.status} &bull; {draft.authorName}</p></div>
                  <div className="admin-inline-actions">
                    {draft.status === "draft" && <button className="admin-inline-btn" type="button" onClick={() => publishDraft(draft)}>Publish</button>}
                    <button className="admin-inline-btn" type="button" onClick={() => startDraftEdit(draft)}>Edit</button>
                    <button className="admin-inline-btn" type="button" onClick={() => deleteDraft(draft.id)}>Delete</button>
                  </div>
                </article>
                {editingDraftId === draft.id && (
                  <div className="admin-editor">
                    <div className="admin-form-grid">
                      <input className="admin-input" placeholder="title" value={editingDraft.title || ""} onChange={(e) => setEditingDraft((p) => ({ ...p, title: e.target.value }))} />
                      <input className="admin-input" placeholder="slug" value={editingDraft.slug || ""} onChange={(e) => setEditingDraft((p) => ({ ...p, slug: e.target.value }))} />
                      <textarea className="admin-input admin-textarea" placeholder="excerpt" value={editingDraft.excerpt || ""} onChange={(e) => setEditingDraft((p) => ({ ...p, excerpt: e.target.value }))} />
                      <textarea className="admin-input admin-textarea" placeholder="content" value={editingDraft.content || ""} onChange={(e) => setEditingDraft((p) => ({ ...p, content: e.target.value }))} />
                      <select className="admin-input" value={editingDraft.category || "release"} onChange={(e) => setEditingDraft((p) => ({ ...p, category: e.target.value }))}>
                        <option value="release">release</option><option value="guide">guide</option><option value="analysis">analysis</option><option value="breaking">breaking</option><option value="opinion">opinion</option>
                      </select>
                      <select className="admin-input" value={editingDraft.status || "draft"} onChange={(e) => setEditingDraft((p) => ({ ...p, status: e.target.value }))}>
                        <option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option>
                      </select>
                      <input className="admin-input" placeholder="author" value={editingDraft.authorName || ""} onChange={(e) => setEditingDraft((p) => ({ ...p, authorName: e.target.value }))} />
                      <input className="admin-input" type="number" min="1" placeholder="readTime" value={editingDraft.readTime ?? ""} onChange={(e) => setEditingDraft((p) => ({ ...p, readTime: e.target.value ? Number(e.target.value) : p?.readTime }))} />
                    </div>
                    <div className="admin-inline-actions">
                      <button className="admin-inline-btn" type="button" onClick={() => saveDraftEdit(draft.id)}>Save</button>
                      <button className="admin-inline-btn" type="button" onClick={cancelDraftEdit}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredDrafts.length === 0 && <p className="admin-empty">No articles found.</p>}
          </div>
        </div>
      </div>

      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
