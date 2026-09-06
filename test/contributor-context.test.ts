import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContributorContext } from "../lib/contributor/context.ts";
import { CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT } from "../lib/contributor/prompts.ts";
import type { RepoOverview } from "../lib/github/types.ts";
import type { RepoIntelligenceData } from "../lib/github/intelligence-types.ts";
import type { ContributorIssue } from "../lib/contributor/types.ts";

describe("Contributor Mode - Context Packager & Prompts", () => {
  const mockOverview: RepoOverview = {
    id: 1,
    name: "express",
    fullName: "expressjs/express",
    owner: { login: "expressjs", avatarUrl: "", url: "", type: "Organization" },
    description: "Fast, unopinionated, minimalist web framework for node.",
    url: "https://github.com/expressjs/express",
    homepage: "https://expressjs.com",
    defaultBranch: "master",
    stars: 65000,
    forks: 12000,
    watchers: 65000,
    openIssues: 15,
    topics: ["express", "framework", "node"],
    license: { name: "MIT", spdxId: "MIT" },
    createdAt: "2010-12-29T19:38:25Z",
    updatedAt: "2026-09-01T00:00:00Z",
    pushedAt: "2026-09-01T00:00:00Z",
    primaryLanguage: "JavaScript",
    languages: [{ name: "JavaScript", bytes: 100000, percentage: 100 }],
    latestCommit: null,
    rateLimit: { limit: 60, remaining: 60, resetAt: new Date(), used: 0 },
  };

  const mockIntelligence: RepoIntelligenceData = {
    repoFullName: "expressjs/express",
    defaultBranch: "master",
    structure: {
      classifications: [
        {
          path: "lib",
          name: "lib",
          role: "application",
          label: "Application Core",
          confidence: "high",
          signals: [],
          fileCount: 10,
          totalSize: 50000,
          depth: 1,
          sampleFiles: ["lib/router/index.js"],
        },
      ],
      totalAnalyzedFiles: 20,
      totalAnalyzedDirectories: 4,
      rootFileCount: 5,
      maxTreeDepth: 3,
      hasMonorepoWorkspaces: false,
    },
    technologies: [{ name: "Node.js", category: "runtime", confidence: "high", evidence: [] }],
    entryPoints: [],
    whereToStart: [],
    readingOrder: [],
    insights: [],
    generatedAt: new Date().toISOString(),
  };

  const mockIssue: ContributorIssue = {
    id: 101,
    number: 5040,
    title: "TypeError when router next() called without handler",
    body: "Calling next() when no handler is registered throws an unhandled error.",
    htmlUrl: "https://github.com/expressjs/express/issues/5040",
    state: "open",
    author: { login: "octocat", avatarUrl: "", url: "" },
    labels: [{ name: "bug", color: "d73a4a", description: null }],
    commentsCount: 3,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-05T00:00:00Z",
    difficulty: "intermediate",
    difficultyReason: "Standard task with maintainer label 'bug'.",
    category: "bug",
    categories: ["bug"],
    readiness: {
      totalScore: 75,
      tier: "high",
      signals: [],
      summary: "High readiness",
    },
  };

  it("should pack bounded contributor context within budget", () => {
    const bundle = buildContributorContext(
      mockOverview,
      mockIssue,
      mockIntelligence,
      [{ path: "lib/router/index.js", content: "function Router() {}" }],
      [{ command: "npm test", source: "package.json", description: "Runs mocha test suite" }],
      { path: "CONTRIBUTING.md", content: "## How to contribute\nRun tests before PR." }
    );

    assert.ok(bundle.systemContextText.includes("REPOSITORY: expressjs/express"));
    assert.ok(bundle.systemContextText.includes("VERIFIED TEST COMMANDS"));
    assert.ok(bundle.systemContextText.includes("npm test"));
    assert.ok(bundle.systemContextText.includes("CONTRIBUTING GUIDELINES"));
    assert.ok(bundle.systemContextText.includes("[file:lib/router/index.js]"));
    assert.ok(bundle.userPromptText.includes("SELECTED GITHUB ISSUE #5040"));
    assert.deepEqual(bundle.suppliedFiles, ["CONTRIBUTING.md", "lib/router/index.js"]);
  });

  it("should verify strict system prompt instructions", () => {
    assert.ok(CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT.includes("STRICT GROUNDING & NO HYPOTHETICAL PATHS"));
    assert.ok(CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT.includes("VERIFIED TEST COMMANDS"));
    assert.ok(CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT.includes("[file:path/to/file.ext]"));
    assert.ok(CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT.includes("Acceptance Criteria Checklist"));
  });
});
