import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { localizeFiles } from "../lib/contributor/issues.ts";
import type { GitTreeItemDto } from "../lib/github/types.ts";
import type { RepoIntelligenceData } from "../lib/github/intelligence-types.ts";

describe("Contributor Mode - File Localization Engine", () => {
  const mockTree: GitTreeItemDto[] = [
    { path: "lib/router/index.js", mode: "100644", type: "blob", sha: "1", url: "" },
    { path: "lib/router/route.js", mode: "100644", type: "blob", sha: "2", url: "" },
    { path: "lib/application.js", mode: "100644", type: "blob", sha: "3", url: "" },
    { path: "test/Route.js", mode: "100644", type: "blob", sha: "4", url: "" },
    { path: "test/Router.js", mode: "100644", type: "blob", sha: "5", url: "" },
    { path: "docs/routing.md", mode: "100644", type: "blob", sha: "6", url: "" },
  ];

  const mockIntelligence: RepoIntelligenceData = {
    repoFullName: "expressjs/express",
    defaultBranch: "master",
    structure: {
      classifications: [
        {
          path: "lib",
          name: "lib",
          role: "application",
          label: "Application",
          confidence: "high",
          signals: [],
          fileCount: 3,
          totalSize: 10000,
          depth: 1,
          sampleFiles: ["lib/router/index.js"],
        },
        {
          path: "test",
          name: "test",
          role: "tests",
          label: "Tests",
          confidence: "high",
          signals: [],
          fileCount: 2,
          totalSize: 5000,
          depth: 1,
          sampleFiles: ["test/Route.js"],
        },
      ],
      totalAnalyzedFiles: 6,
      totalAnalyzedDirectories: 3,
      rootFileCount: 2,
      maxTreeDepth: 2,
      hasMonorepoWorkspaces: false,
    },
    technologies: [],
    entryPoints: [],
    whereToStart: [],
    readingOrder: [],
    insights: [],
    generatedAt: new Date().toISOString(),
  };

  it("should rank exact file path matches with high confidence", () => {
    const candidates = localizeFiles(
      {
        title: "Bug in lib/router/route.js dispatching",
        body: "Stack trace points to lib/router/route.js line 45",
      },
      mockTree,
      mockIntelligence
    );

    assert.ok(candidates.length > 0);
    const highMatch = candidates.find((c) => c.path === "lib/router/route.js");
    assert.ok(highMatch);
    assert.equal(highMatch.confidence, "high");
    assert.ok(highMatch.reason.includes("Explicitly referenced"));
  });

  it("should rank subsystem keyword matches with medium confidence", () => {
    const candidates = localizeFiles(
      {
        title: "Add error handling for router middleware",
        body: "The router should catch async errors properly",
      },
      mockTree,
      mockIntelligence
    );

    assert.ok(candidates.length > 0);
    const routerMatch = candidates.find((c) => c.path.includes("router"));
    assert.ok(routerMatch);
    assert.ok(routerMatch.confidence === "high" || routerMatch.confidence === "medium");
  });

  it("should ignore common stop-words and avoid false positive dotfile matches", () => {
    const treeWithDotfiles: GitTreeItemDto[] = [
      ...mockTree,
      { path: ".github/workflows/ci.yaml", mode: "100644", type: "blob", sha: "7", url: "" },
      { path: ".claude/settings.json", mode: "100644", type: "blob", sha: "8", url: "" },
    ];

    const candidates = localizeFiles(
      {
        title: "Use the indent setting for and with option",
        body: "General feature request",
      },
      treeWithDotfiles,
      mockIntelligence
    );

    // Common stop-words like 'for', 'and', 'the', 'with', 'setting', 'option' should not match .claude/settings.json or workflows
    const matchedDotfile = candidates.find((c) => c.path.startsWith("."));
    assert.equal(matchedDotfile, undefined);
  });
});
