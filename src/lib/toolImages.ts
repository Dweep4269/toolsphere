export type ToolImageResult = {
  iconUrl: string | null;
  source: "placeholder";
};

export async function resolveToolImage(name: string, url: string): Promise<ToolImageResult> {
  // SVG logic shifted to frontend ToolIcon.tsx to prevent huge DB bloat.
  return { iconUrl: null, source: "placeholder" };
}
