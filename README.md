<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

# ToolSphere

**The curated intelligence layer for the AI ecosystem.**

ToolSphere is a next-generation directory and discovery platform for AI tools, MCP servers, agent skills, LLM benchmarks, and industry news — powered by automated ingestion pipelines, NLP-driven search, and a hand-crafted dark editorial design system.

> Discover. Compare. Build smarter.

---

## Highlights

- **Automated multi-source ingestion** — Continuously syncs tools from GitHub, Hugging Face, FMHY, Product Hunt, RSS feeds, Hacker News, and Papers With Code
- **MCP & agent skill discovery** — Curated Model Context Protocol servers and agent skills sourced from GitHub with star-based quality ranking
- **NLP conversational search** — AI-powered chat interface backed by OpenRouter that understands natural language queries and recommends tools contextually
- **LLM benchmark tracker** — Sortable, filterable comparison tables for model evaluations across domains with pricing data
- **News aggregation** — Auto-synced industry news from AI company blogs, HN, and research papers with editorial review workflow
- **Admin control panel** — Full CRUD dashboard with ingestion queue review, batch LLM processing, sync orchestration, and description enrichment from GitHub READMEs
- **Chat history persistence** — Conversations saved client-side with session management for revisiting past searches
- **Newsletter system** — Email subscription with double opt-out token management
- **Dark editorial design** — "The Curated Archive" — a bespoke design system with grain textures, gold accents, and typographic hierarchy

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Home   │  │  Tools   │  │Benchmarks │  │    News     │  │
│  │  (NLP)  │  │Directory │  │  Tables   │  │  Articles   │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│       │            │              │               │          │
│  ┌────▼────────────▼──────────────▼───────────────▼───────┐  │
│  │                   API LAYER (Route Handlers)            │  │
│  │  /api/search/nlp    /api/benchmarks    /api/news       │  │
│  │  /api/admin/*       /api/integrations/*/sync           │  │
│  │  /api/cron/daily-sync                                  │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │              PRISMA ORM (PostgreSQL / Neon)             │  │
│  │  Tool · Category · BenchmarkModel · NewsArticle · User │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐          ┌────▼────┐
    │ GitHub  │         │OpenRouter│          │  RSS /  │
    │   API   │         │  (LLM)  │          │  HN /   │
    │         │         │         │          │  PwC    │
    └─────────┘         └─────────┘          └─────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16.2](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript 5 (strict mode) |
| **UI** | React 19, Tailwind CSS v4, custom CSS design system |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **ORM** | Prisma 5 with connection pooling (`directUrl` for migrations) |
| **Auth** | NextAuth v5 (JWT strategy, credentials provider) |
| **AI** | OpenRouter API for NLP search and batch tool processing |
| **Deployment** | Vercel (serverless functions, cron jobs, edge headers) |
| **Fonts** | DM Sans (body), Fraunces (display), JetBrains Mono (code) |

---

## Data Sources & Integrations

ToolSphere ingests data from **9 external sources** through automated sync pipelines:

| Source | Endpoint | What it syncs |
|--------|----------|---------------|
| **GitHub** | `/api/integrations/github/sync` | Top AI repositories by stars and topics |
| **GitHub (MCPs)** | `/api/integrations/mcp/sync` | MCP servers from curated lists + GitHub search |
| **GitHub (Skills)** | `/api/integrations/skills/sync` | Agent skills (`agent-skill`, `cursor-skill`, `claude-skill` topics) |
| **Hugging Face** | `/api/integrations/huggingface/sync` | Trending ML models |
| **FMHY** | `/api/integrations/fmhy/sync` | Free tools from the FMHY single-page API |
| **Product Hunt** | `/api/integrations/producthunt/sync` | Launched AI products (GraphQL API) |
| **RSS Feeds** | `/api/integrations/rss/sync` | Blog posts from OpenAI, Anthropic, Google AI, Meta, Mistral, HF |
| **Hacker News** | `/api/integrations/hackernews/sync` | Top AI stories via Algolia API |
| **Papers With Code** | `/api/integrations/paperswithcode/sync` | Latest ML research papers |

A **daily cron job** (`0 6 * * *`) orchestrates FMHY, RSS, and skills syncs automatically. Admins can trigger any sync manually from the dashboard.

---

## Database Schema

<details>
<summary><strong>8 models — click to expand</strong></summary>

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Tool** | AI tools, MCPs, skills | `name`, `slug`, `description`, `longDescription`, `pricingType`, `ratingOverall`, `tags`, `verified`, `source`, `githubUrl` |
| **Category** | Hierarchical tool categories | `name`, `slug`, `color`, `icon`, `toolCount`, `parentId` (self-relation) |
| **ToolCategory** | M:N join table | `toolId`, `categoryId` |
| **BenchmarkModel** | LLM evaluation data | `name`, `provider`, `contextWindow`, `pricingInput/Output`, `scores` (JSON) |
| **BenchmarkScoreHistory** | Score snapshots over time | `benchmarkId`, `capturedAt`, `scores`, `sourceUrls` |
| **NewsArticle** | Aggregated AI news | `title`, `slug`, `excerpt`, `content`, `category`, `status`, `sourceUrl` |
| **NewsletterSubscriber** | Email subscribers | `email`, `status`, `token`, `tokenExpires` |
| **User** | Admin & submitted users | `email`, `role`, `provider`, `providerId` |
| **ToolSubmission** | Community tool submissions | `toolData`, `submitterEmail`, `status`, `reviewNotes` |

</details>

---

## Getting Started

### Prerequisites

- **Node.js** 18.17+
- **PostgreSQL** database (or a free [Neon](https://neon.tech) instance)
- **OpenRouter API key** (for NLP search — optional for basic functionality)

### 1. Clone & install

```bash
git clone https://github.com/Dweep4269/toolsphere.git
cd toolsphere
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
DATABASE_URL="postgresql://user:password@host:5432/toolsphere?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@host:5432/toolsphere?sslmode=require"
AUTH_SECRET="generate-with: openssl rand -base64 32"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="your-secure-password"
CRON_SECRET="generate-with: openssl rand -hex 16"
OPENROUTER_API_KEY="sk-or-..."
GITHUB_TOKEN="ghp_..."
```

### 3. Initialize the database

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

ToolSphere is optimized for Vercel with serverless functions, cron jobs, and Neon Postgres integration.

### One-click setup

1. **Link project:**
   ```bash
   npm i -g vercel
   vercel link
   ```

2. **Provision Neon Postgres:**
   ```bash
   vercel integration add neon
   ```
   This automatically sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.

3. **Add remaining environment variables:**
   ```bash
   vercel env add AUTH_SECRET production preview
   vercel env add ADMIN_EMAIL production preview
   vercel env add ADMIN_PASSWORD production preview
   vercel env add CRON_SECRET production preview
   vercel env add OPENROUTER_API_KEY production preview
   vercel env add GITHUB_TOKEN production preview
   ```

4. **Push schema & deploy:**
   ```bash
   npx dotenv -e .env.local -- npx prisma db push
   vercel deploy --prod
   ```

### Vercel configuration

The included `vercel.json` configures:

- **Cron job**: Daily sync at 06:00 UTC (`/api/cron/daily-sync`)
- **Security headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` on all API routes
- **Function durations**: 60s for syncs, 120s for cron, 30s for NLP search

---

## Project Structure

```
toolsphere/
├── prisma/
│   ├── schema.prisma          # Database schema (9 models)
│   └── seed.ts                # Seed script for categories & benchmarks
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (fonts, navbar, grain overlay)
│   │   ├── page.tsx           # Homepage (NLP search + category grid)
│   │   ├── admin/             # Admin dashboard
│   │   ├── auth/login/        # Admin login page
│   │   ├── benchmarks/        # LLM benchmark tables
│   │   ├── categories/        # Category index + [slug] listings
│   │   ├── news/              # News index + [slug] articles
│   │   ├── tools/             # Tool directory + [slug] detail
│   │   └── api/
│   │       ├── admin/         # CRUD, sync orchestration, LLM batch
│   │       ├── auth/          # NextAuth route handler
│   │       ├── benchmarks/    # Benchmark API
│   │       ├── cron/          # Daily automated sync
│   │       ├── integrations/  # 9 external source sync endpoints
│   │       ├── news/          # Public news API
│   │       ├── newsletter/    # Email subscription
│   │       └── search/nlp/    # AI-powered search
│   ├── components/
│   │   ├── admin/             # AdminDashboardClient
│   │   ├── home/              # NlpSearch, Categories, Hero, etc.
│   │   ├── Navbar.tsx         # Server component with live tool count
│   │   ├── Footer.tsx         # Newsletter + links
│   │   ├── BenchmarkTable.tsx # Sortable benchmark comparison
│   │   └── ExternalLinkModal.tsx
│   ├── lib/
│   │   ├── db.ts              # Prisma singleton (serverless-safe)
│   │   ├── ai.ts              # OpenRouter client
│   │   ├── github.ts          # GitHub API helpers
│   │   ├── chat-store.ts      # Client-side chat persistence
│   │   └── admin-auth.ts      # API route auth guard
│   ├── auth.ts                # NextAuth v5 configuration
│   └── middleware.ts          # Route protection (/admin)
├── style.css                  # "The Curated Archive" design system
├── vercel.json                # Cron, headers, function config
├── next.config.ts             # Image domains, external packages
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | Yes | Direct connection for Prisma migrations |
| `AUTH_SECRET` | Yes | NextAuth session encryption secret |
| `AUTH_URL` | No | Public URL of the app (auto-detected on Vercel) |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `CRON_SECRET` | Yes | Bearer token for cron job authentication |
| `OPENROUTER_API_KEY` | Recommended | Powers NLP search and LLM batch processing |
| `GITHUB_TOKEN` | Recommended | Higher rate limits for GitHub API sync |
| `NEXT_PUBLIC_BASE_URL` | No | Public site URL for cron self-calls |
| `PRODUCTHUNT_TOKEN` | No | Product Hunt GraphQL API access |

---

## Available Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Generate Prisma client + Next.js build
npm run start        # Start production server
npm run lint         # ESLint

npm run db:push      # Push schema to database
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed categories & benchmark data
npm run db:studio    # Open Prisma Studio GUI
```

---

## Admin Dashboard

Access the admin panel at `/admin` after logging in at `/auth/login`.

**Capabilities:**
- Review and approve ingested tools from the sync queue
- Batch-process tools through LLM categorization
- Trigger any of the 9 integration syncs on demand
- Enrich tool descriptions from GitHub READMEs
- Manage news articles (draft → published workflow)
- View platform statistics (tool counts, news, drafts)

---

## Design System

ToolSphere uses **"The Curated Archive"** — a bespoke dark editorial design system built with CSS custom properties:

- **Palette**: Deep surfaces (`#0a0a0a` → `#1a1a1a`) with gold (`#c9a96e`), teal (`#6b9e9e`), and terracotta (`#b87a5e`) accents
- **Typography**: Fraunces (serif display), DM Sans (body), JetBrains Mono (code)
- **Textures**: Grain overlay via CSS `url()` noise pattern
- **Motion**: Reduced-motion-aware transitions at `200ms` ease
- **Layout**: Responsive grid system with `--nav-offset` spacing

---

## API Reference

<details>
<summary><strong>Public endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/benchmarks` | List benchmark models (filterable by provider, sortable) |
| `GET` | `/api/news` | Paginated published news articles |
| `POST` | `/api/search/nlp` | NLP conversational search |
| `POST` | `/api/newsletter/subscribe` | Subscribe to newsletter |

</details>

<details>
<summary><strong>Admin endpoints</strong> (require authentication)</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET/POST` | `/api/admin/tools` | List/create tools |
| `PATCH/DELETE` | `/api/admin/tools/[id]` | Update/delete tool |
| `GET/POST` | `/api/admin/news` | List/create news articles |
| `PATCH/DELETE` | `/api/admin/news/[id]` | Update/delete article |
| `POST` | `/api/admin/sync` | Orchestrate integration syncs |
| `POST` | `/api/admin/llm-batch` | Batch LLM processing |
| `POST` | `/api/admin/enrich-descriptions` | Enrich descriptions from GitHub |

</details>

<details>
<summary><strong>Integration sync endpoints</strong> (admin or cron)</summary>

| Method | Endpoint | Source |
|--------|----------|--------|
| `POST` | `/api/integrations/fmhy/sync` | FMHY |
| `POST` | `/api/integrations/github/sync` | GitHub repositories |
| `POST` | `/api/integrations/mcp/sync` | MCP servers |
| `POST` | `/api/integrations/skills/sync` | Agent skills |
| `POST` | `/api/integrations/huggingface/sync` | Hugging Face models |
| `POST` | `/api/integrations/producthunt/sync` | Product Hunt |
| `POST` | `/api/integrations/rss/sync` | AI company blogs |
| `POST` | `/api/integrations/hackernews/sync` | Hacker News |
| `POST` | `/api/integrations/paperswithcode/sync` | Papers With Code |

</details>

---

## Roadmap

- [ ] OAuth login for community tool submissions
- [ ] Tool comparison side-by-side view
- [ ] Webhook-based real-time sync triggers
- [ ] Public REST API with rate limiting
- [ ] Browser extension for quick tool lookups
- [ ] Email digest newsletter automation

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary. All rights reserved.

---

<p align="center">
  <sub>Built with love</sub>
</p>
