# ToolSphere

ToolSphere is a next-generation curated directory for AI tools, agentic workflows, MCPs, and benchmarks. Built with Next.js 15, React 19, and Tailwind CSS v4.

## Features

- **Dynamic Curated Directory**: Browse trending AI tools and agentic IDEs.
- **Benchmarks**: Track the latest LLM evaluations and scores.
- **Fast Search**: Keyboard-first interactive navigation.
- **Design System**: A meticulously crafted dark-editorial aesthetic.

## Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4
- Database: Prisma ORM (SQLite for local dev, PostgreSQL ready)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Push the Prisma schema and seed the database:
   ```bash
   npx prisma db push
   npm install dotenv -D # (if required locally for seeding)
   npx tsx prisma/seed.ts
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.
