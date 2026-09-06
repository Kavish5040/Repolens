import type { RepoOverview, GitTreeItemDto, KeyDocument } from "../github/types.ts";
import type { RepoIntelligenceData } from "../github/intelligence-types.ts";
import type { ContextBundle, ContextFileExcerpt, ChatMessage } from "./types.ts";

export const MAX_TOTAL_CHARS = 96000;      // ~24,000 tokens (4 chars / token)
export const MAX_FILE_COUNT = 10;
export const MAX_EXCERPT_CHARS = 4000;
export const MAX_CHAT_HISTORY_TURNS = 6;    // 3 user + 3 assistant pairs

/**
 * Creates a bounded file excerpt preserving beginning and ending sections if truncated.
 */
export function createBoundedExcerpt(path: string, content: string): ContextFileExcerpt {
  const byteSize = new TextEncoder().encode(content).length;

  if (content.length <= MAX_EXCERPT_CHARS) {
    return {
      path,
      content,
      isTruncated: false,
      byteSize,
    };
  }

  // Keep head and tail with a clear truncation boundary
  const headSize = Math.floor(MAX_EXCERPT_CHARS * 0.7);
  const tailSize = Math.floor(MAX_EXCERPT_CHARS * 0.25);

  const head = content.substring(0, headSize);
  const tail = content.substring(content.length - tailSize);
  const truncatedContent = `${head}\n\n[... content truncated: ${content.length - headSize - tailSize} characters omitted ...]\n\n${tail}`;

  return {
    path,
    content: truncatedContent,
    isTruncated: true,
    byteSize,
  };
}

/**
 * Builds the repository-wide context bundle for AI Summary generation.
 */
export function buildSummaryContext(
  overview: RepoOverview,
  treeItems: GitTreeItemDto[],
  intelligence: RepoIntelligenceData,
  keyFileContents: Array<{ path: string; content: string }> = []
): ContextBundle {
  const suppliedFiles = new Set<string>();
  const sections: string[] = [];

  // 1. Repository Identity & Metrics
  sections.push(`=== REPOSITORY OVERVIEW ===
Repository: ${overview.fullName}
Description: ${overview.description || "No description provided."}
Default Branch: ${overview.defaultBranch}
Stars: ${overview.stars.toLocaleString()} | Forks: ${overview.forks.toLocaleString()} | Open Issues: ${overview.openIssues.toLocaleString()}
License: ${overview.license || "None specified"}
Primary Languages: ${overview.languages.map((l) => `${l.name} (${l.percentage}%)`).join(", ")}
Last Commit: ${overview.latestCommit?.message?.split("\n")[0] || "N/A"} (${overview.latestCommit?.authorName || "N/A"})`);

  // 2. Deterministic Intelligence & Architecture (Phase 3 Engine)
  const techList = intelligence.technologies.map((t) => `- ${t.name} (${t.category}, ${t.confidence} confidence): ${t.evidence.join("; ")}`).join("\n");
  const entryList = intelligence.entryPoints.map((e) => `- #${e.rank} ${e.path} (${e.label}): ${e.description}`).join("\n");
  const topologyList = intelligence.structure.classifications.slice(0, 15).map((c) => `- ${c.path}/ [${c.label}]: ${c.fileCount} files`).join("\n");
  const readingList = intelligence.readingOrder.map((r) => `${r.order}. [file:${r.path}] - ${r.explanation}`).join("\n");

  sections.push(`=== ARCHITECTURAL TOPOLOGY & INTELLIGENCE (DETERMINISTIC) ===
Detected Technologies & Frameworks:
${techList || "None detected"}

Ranked Entry Points:
${entryList || "None detected"}

Structural Regions (Directory Roles):
${topologyList || "None detected"}

Recommended Onboarding Sequence:
${readingList || "None computed"}`);

  // 3. Top Directory Tree Structure (Skeleton)
  const topTreePaths = treeItems
    .slice(0, 60)
    .map((item) => `${item.type === "tree" ? "📁" : "📄"} ${item.path}`)
    .join("\n");

  sections.push(`=== REPOSITORY DIRECTORY SKELETON (SAMPLE) ===
${topTreePaths}`);

  // 4. Bounded Key File Contents (README, Manifests)
  if (keyFileContents.length > 0) {
    sections.push(`=== KEY PROJECT FILE EXCERPTS ===`);
    const boundedFiles = keyFileContents.slice(0, MAX_FILE_COUNT);

    for (const file of boundedFiles) {
      const excerpt = createBoundedExcerpt(file.path, file.content);
      suppliedFiles.add(file.path);
      sections.push(`--- FILE: [file:${excerpt.path}] (Size: ${excerpt.byteSize} bytes${excerpt.isTruncated ? ", TRUNCATED" : ""}) ---
${excerpt.content}
--- END FILE: [file:${excerpt.path}] ---`);
    }
  }

  // Combine and enforce hard character ceiling
  let combined = sections.join("\n\n");
  if (combined.length > MAX_TOTAL_CHARS) {
    combined = combined.substring(0, MAX_TOTAL_CHARS) + "\n\n[... Context truncated to hard budget ...]";
  }

  return {
    repoFullName: overview.fullName,
    defaultBranch: overview.defaultBranch,
    systemContextText: combined,
    suppliedFiles: Array.from(suppliedFiles),
    estimatedTokenCount: Math.ceil(combined.length / 4),
  };
}

/**
 * Builds a query-targeted context bundle for interactive "Ask RepoLens" Conversational Q&A.
 */
export function buildChatContext(
  overview: RepoOverview,
  treeItems: GitTreeItemDto[],
  intelligence: RepoIntelligenceData,
  query: string,
  keyFileContents: Array<{ path: string; content: string }> = [],
  activeFilePath?: string | null
): ContextBundle {
  const suppliedFiles = new Set<string>();
  const sections: string[] = [];

  // 1. Basic Identity
  sections.push(`=== REPOSITORY CONTEXT ===
Repository: ${overview.fullName} (${overview.defaultBranch})
Description: ${overview.description || "No description"}
Primary Languages: ${overview.languages.map((l) => l.name).join(", ")}
Detected Stack: ${intelligence.technologies.map((t) => t.name).join(", ")}`);

  // 2. Structural Highlights
  const entryList = intelligence.entryPoints.slice(0, 5).map((e) => `- #${e.rank} [file:${e.path}] (${e.label})`).join("\n");
  const topologyList = intelligence.structure.classifications.slice(0, 10).map((c) => `- ${c.path}/ (${c.label})`).join("\n");

  sections.push(`=== ARCHITECTURAL SIGNALS ===
Entry Points:
${entryList || "None"}
Main Subsystems:
${topologyList || "None"}`);

  // 3. Question-Targeted File Selection
  // Extract query keywords (words >= 3 chars)
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9_\-./]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  // Score available files by keyword relevance in path
  const scoredFiles = keyFileContents.map((file) => {
    let score = 0;
    const lowerPath = file.path.toLowerCase();
    for (const kw of keywords) {
      if (lowerPath.includes(kw)) score += 5;
    }
    if (activeFilePath && file.path === activeFilePath) {
      score += 10;
    }
    // Boost manifests and readmes
    if (file.path.toLowerCase().includes("readme")) score += 2;
    if (file.path.toLowerCase().includes("package.json") || file.path.toLowerCase().includes("cargo.toml")) score += 3;
    return { ...file, score };
  });

  scoredFiles.sort((a, b) => b.score - a.score);

  const selectedFiles = scoredFiles.slice(0, MAX_FILE_COUNT);

  if (selectedFiles.length > 0) {
    sections.push(`=== GROUNDING FILE EXCERPTS (SUPPLIED FOR CONTEXT) ===`);
    for (const file of selectedFiles) {
      const excerpt = createBoundedExcerpt(file.path, file.content);
      suppliedFiles.add(file.path);
      sections.push(`--- FILE: [file:${excerpt.path}] ---
${excerpt.content}
--- END FILE: [file:${excerpt.path}] ---`);
    }
  }

  // 4. Relevant Tree Paths (matching keywords)
  const matchedPaths = treeItems
    .filter((item) => keywords.some((kw) => item.path.toLowerCase().includes(kw)))
    .slice(0, 30)
    .map((item) => item.path);

  if (matchedPaths.length > 0) {
    sections.push(`=== MATCHING REPOSITORY PATHS (FOR CONTEXT) ===
${matchedPaths.map((p) => `- ${p}`).join("\n")}`);
  }

  let combined = sections.join("\n\n");
  if (combined.length > MAX_TOTAL_CHARS) {
    combined = combined.substring(0, MAX_TOTAL_CHARS) + "\n\n[... Context truncated to hard budget ...]";
  }

  return {
    repoFullName: overview.fullName,
    defaultBranch: overview.defaultBranch,
    systemContextText: combined,
    suppliedFiles: Array.from(suppliedFiles),
    estimatedTokenCount: Math.ceil(combined.length / 4),
  };
}

/**
 * Prunes conversation history to keep only the last N turns.
 */
export function pruneChatHistory(history: ChatMessage[], maxTurns = MAX_CHAT_HISTORY_TURNS): ChatMessage[] {
  if (!history || history.length <= maxTurns) return history || [];
  return history.slice(history.length - maxTurns);
}
