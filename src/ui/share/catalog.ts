import { normalizeResumeSlug } from "./mode";

export type SharedResumeEntry = {
  fileName: string;
  source: string;
  aliases: string[];
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function buildResumeAliases(fileName: string): string[] {
  const stem = fileName.replace(/\.mdx$/i, "");
  const slug = normalizeResumeSlug(stem);
  const compact = slug.replace(/-/g, "");
  const aliases = [slug];

  if (compact && compact !== slug) aliases.push(compact);
  if (slug.startsWith("my-")) aliases.push(slug.slice(3));
  if (compact.startsWith("my") && compact.length > 2) aliases.push(compact.slice(2));

  return unique(aliases);
}

export function buildSharedResumeCatalog(files: Record<string, string>): SharedResumeEntry[] {
  const entries = Object.entries(files)
    .map(([source, text]) => {
      const fileName = source.split("/").at(-1);
      if (!fileName) return null;
      return {
        fileName,
        source: text,
        aliases: buildResumeAliases(fileName),
      };
    })
    .filter((entry): entry is SharedResumeEntry => entry !== null)
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  if (entries.length === 1 && !entries[0]?.aliases.includes("resume")) {
    entries[0]?.aliases.push("resume");
  }

  return entries;
}

export function findSharedResume(
  entries: SharedResumeEntry[],
  requestedSlug: string,
): SharedResumeEntry | null {
  const slug = normalizeResumeSlug(requestedSlug);
  if (!slug) return null;

  const exact = entries.find((entry) => entry.aliases.includes(slug));
  if (exact) return exact;

  if (slug === "resume") {
    const defaultEntry = entries.find((entry) => entry.aliases.includes("resume")) ?? entries[0] ?? null;
    return defaultEntry;
  }

  return null;
}
