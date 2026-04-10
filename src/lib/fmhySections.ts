export type FmhySectionConfig = {
  key: string;
  label: string;
  pattern: RegExp;
  slug: string;
  category: string;
};

export const FMHY_SECTION_OPTIONS: FmhySectionConfig[] = [
  {
    key: "official-model-sites",
    label: "Official Model Sites",
    pattern: /Official\s+Model\s+Sites/i,
    slug: "official-model-sites",
    category: "agent-skills",
  },
  {
    key: "multiple-model-sites",
    label: "Multiple Model Sites",
    pattern: /Multiple\s+Model\s+Sites/i,
    slug: "multiple-model-sites",
    category: "agent-skills",
  },
  {
    key: "specialized-chatbots",
    label: "Specialized Chatbots",
    pattern: /Specialized\s+Chatbots/i,
    slug: "specialized-chatbots",
    category: "agent-skills",
  },
  {
    key: "ai-tools",
    label: "AI Tools",
    pattern: /AI\s+Tools/i,
    slug: "ai-tools",
    category: "agent-skills",
  },
  {
    key: "ai-indexes",
    label: "AI Indexes",
    pattern: /AI\s+Indexes/i,
    slug: "ai-indexes",
    category: "agent-skills",
  },
  {
    key: "ai-benchmarks",
    label: "AI Benchmarks",
    pattern: /AI\s+Benchmarks/i,
    slug: "ai-benchmarks",
    category: "agent-skills",
  },
  {
    key: "coding-benchmarks",
    label: "Coding Benchmarks",
    pattern: /Coding\s+Benchmarks/i,
    slug: "coding-benchmarks",
    category: "code-cli",
  },
];
