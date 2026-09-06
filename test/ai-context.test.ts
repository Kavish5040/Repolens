import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createBoundedExcerpt,
  buildSummaryContext,
  buildChatContext,
  pruneChatHistory,
  MAX_TOTAL_CHARS,
  MAX_EXCERPT_CHARS,
} from "../lib/ai/context.ts";
import type { RepoOverview, GitTreeItemDto } from "../lib/github/types.ts";
import type { RepoIntelligenceData } from "../lib/github/intelligence-types.ts";
import type { ChatMessage } from "../lib/ai/types.ts";

describe("AI Context Packager & Budget Enforcer", () => {
  const dummyOverview: RepoOverview = {
    id: 12345,
    name: "test-repo",
    fullName: "test-org/test-repo",
    owner: { login: "test-org", avatarUrl: "", url: "", type: "User" },
    description: "A test repository for unit testing.",
    url: "https://github.com/test-org/test-repo",
    homepage: null,
    defaultBranch: "main",
    stars: 100,
    forks: 20,
    watchers: 5,
    openIssues: 2,
    topics: ["test"],
    license: { name: "MIT License", spdxId: "MIT" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    pushedAt: "2026-01-03T00:00:00Z",
    primaryLanguage: "TypeScript",
    languages: [{ name: "TypeScript", bytes: 1000, percentage: 100, color: "#3b82f6" }],
    latestCommit: null,
    rateLimit: { limit: 60, remaining: 59, resetAt: new Date(), used: 1 },
  };

  const dummyIntelligence: RepoIntelligenceData = {
    repoFullName: "test-org/test-repo",
    defaultBranch: "main",
    structure: {
      classifications: [
        {
          path: "src",
          name: "src",
          role: "source",
          label: "Core Source Code",
          confidence: "high",
          signals: ["Matches src folder"],
          fileCount: 10,
          totalSize: 5000,
          depth: 1,
          sampleFiles: ["src/index.ts"],
        },
      ],
      totalAnalyzedFiles: 10,
      totalAnalyzedDirectories: 2,
      rootFileCount: 2,
      maxTreeDepth: 2,
      hasMonorepoWorkspaces: false,
    },
    technologies: [
      {
        name: "Next.js",
        category: "framework",
        confidence: "high",
        evidence: ["Found next.config.ts"],
      },
    ],
    entryPoints: [
      {
        path: "src/index.ts",
        name: "index.ts",
        type: "main_module",
        label: "Main Module",
        rank: 1,
        confidence: "high",
        signals: ["Standard src entry"],
        description: "Source bootstrap file",
      },
    ],
    whereToStart: [
      {
        stepNumber: 1,
        title: "Start with Documentation",
        targetPath: "README.md",
        targetType: "file",
        category: "overview",
        reason: "Explains project",
        signalStrength: "primary",
        keyPointsToInspect: ["Overview"],
        evidence: ["Found README.md"],
      },
    ],
    readingOrder: [
      {
        order: 1,
        path: "README.md",
        name: "README.md",
        type: "file",
        role: "Documentation",
        explanation: "Overview",
        evidence: "Found README.md",
      },
    ],
    insights: [],
    generatedAt: new Date().toISOString(),
  };

  const dummyTree: GitTreeItemDto[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: "sha1", size: 500, url: "" },
    { path: "package.json", mode: "100644", type: "blob", sha: "sha2", size: 300, url: "" },
    { path: "src", mode: "040000", type: "tree", sha: "sha3", url: "" },
    { path: "src/index.ts", mode: "100644", type: "blob", sha: "sha4", size: 400, url: "" },
  ];

  it("should truncate oversized file excerpts with head/tail preservation", () => {
    const hugeText = "START_SECTION_MARKER " + "x".repeat(10000) + " END_SECTION_MARKER";
    const excerpt = createBoundedExcerpt("huge.txt", hugeText);

    assert.equal(excerpt.isTruncated, true);
    assert.ok(excerpt.content.length <= MAX_EXCERPT_CHARS + 200);
    assert.ok(excerpt.content.includes("START_SECTION_MARKER"));
    assert.ok(excerpt.content.includes("END_SECTION_MARKER"));
    assert.ok(excerpt.content.includes("[... content truncated"));
  });

  it("should build summary context within hard character budgets", () => {
    const keyFiles = [
      { path: "README.md", content: "# Test Repo\nThis is a sample project." },
      { path: "package.json", content: JSON.stringify({ name: "test-repo", dependencies: {} }) },
    ];

    const bundle = buildSummaryContext(dummyOverview, dummyTree, dummyIntelligence, keyFiles);

    assert.ok(bundle.systemContextText.length <= MAX_TOTAL_CHARS);
    assert.ok(bundle.suppliedFiles.includes("README.md"));
    assert.ok(bundle.suppliedFiles.includes("package.json"));
    assert.ok(bundle.estimatedTokenCount > 0);
  });

  it("should build query-targeted chat context prioritizing matching files", () => {
    const keyFiles = [
      { path: "README.md", content: "# Readme documentation" },
      { path: "package.json", content: "{ name: 'pkg' }" },
      { path: "src/auth.ts", content: "export function authenticate() {}" },
      { path: "src/db.ts", content: "export function connectDatabase() {}" },
    ];

    const bundle = buildChatContext(
      dummyOverview,
      dummyTree,
      dummyIntelligence,
      "How does user authentication work?",
      keyFiles
    );

    assert.ok(bundle.systemContextText.length <= MAX_TOTAL_CHARS);
    assert.ok(bundle.suppliedFiles.includes("src/auth.ts"));
  });

  it("should prune chat history to the last 6 turns", () => {
    const messages: ChatMessage[] = Array.from({ length: 12 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));

    const pruned = pruneChatHistory(messages, 6);
    assert.equal(pruned.length, 6);
    assert.equal(pruned[0].id, "msg-6");
    assert.equal(pruned[5].id, "msg-11");
  });
});
