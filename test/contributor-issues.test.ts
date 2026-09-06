import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLabel,
  matchIssueCategories,
  issueMatchesCategory,
  inferCategory,
  inferDifficulty,
  calculateReadinessScore,
  extractVerifiedTestCommands,
} from "../lib/contributor/issues.ts";
import type { GitTreeItemDto, KeyDocument } from "../lib/github/types.ts";

describe("Contributor Mode - Issues Engine & Scoring", () => {
  it("should normalize label names consistently", () => {
    assert.equal(normalizeLabel("Good-First-Issue"), "good first issue");
    assert.equal(normalizeLabel("help_wanted"), "help wanted");
    assert.equal(normalizeLabel("type:bug"), "type: bug");
    assert.equal(normalizeLabel("kind / bug"), "kind/bug");
    assert.equal(normalizeLabel("  area:   docs  "), "area: docs");
  });

  it("should infer issue category from labels", () => {
    assert.equal(inferCategory([{ name: "good first issue" }]), "good-first-issue");
    assert.equal(inferCategory([{ name: "help wanted" }]), "help-wanted");
    assert.equal(inferCategory([{ name: "bug" }]), "bug");
    assert.equal(inferCategory([{ name: "documentation" }]), "documentation");
    assert.equal(inferCategory([{ name: "enhancement" }]), "feature");
    assert.equal(inferCategory([{ name: "random-tag" }]), "all");
  });

  it("should accurately match categories for astral-sh/ruff labels (Regression Test)", () => {
    // astral-sh/ruff uses "help wanted", "good first issue", "docstring", "bug", "documentation"
    const ruffHelpWantedIssue = {
      labels: [{ name: "help wanted" }, { name: "linter" }, { name: "rules" }],
    };
    assert.ok(issueMatchesCategory(ruffHelpWantedIssue, "help-wanted"));
    assert.deepEqual(matchIssueCategories(ruffHelpWantedIssue.labels), ["help-wanted"]);

    const ruffGoodFirstIssue = {
      labels: [{ name: "good first issue" }, { name: "docstring" }],
    };
    assert.ok(issueMatchesCategory(ruffGoodFirstIssue, "good-first-issue"));
    assert.ok(issueMatchesCategory(ruffGoodFirstIssue, "documentation"));
    const gfiCategories = matchIssueCategories(ruffGoodFirstIssue.labels);
    assert.ok(gfiCategories.includes("good-first-issue"));
    assert.ok(gfiCategories.includes("documentation"));

    const ruffBugIssue = {
      labels: [{ name: "bug" }, { name: "formatter" }],
    };
    assert.ok(issueMatchesCategory(ruffBugIssue, "bug"));
    assert.ok(!issueMatchesCategory(ruffBugIssue, "help-wanted"));

    const ruffDocstringIssue = {
      labels: [{ name: "docstring" }],
    };
    assert.ok(issueMatchesCategory(ruffDocstringIssue, "documentation"));
  });

  it("should preserve strict matching and not match false positive substrings", () => {
    // "debug" should not match "bug"
    const debugIssue = { labels: [{ name: "debugger" }, { name: "debug-mode" }] };
    assert.ok(!issueMatchesCategory(debugIssue, "bug"));

    // "self-help" should not match "help wanted"
    const helpIssue = { labels: [{ name: "self-help-tool" }] };
    assert.ok(!issueMatchesCategory(helpIssue, "help-wanted"));
  });

  it("should infer difficulty based on explicit evidence", () => {
    // Beginner: explicit label
    const b1 = inferDifficulty({
      title: "Fix typo in README",
      body: "Minor typo",
      labels: [{ name: "good first issue" }],
    });
    assert.equal(b1.difficulty, "beginner");
    assert.ok(b1.reason.includes("good first"));

    // Beginner: documentation scope
    const b2 = inferDifficulty({
      title: "docs: update install instructions",
      body: "Need to update docs",
      labels: [{ name: "documentation" }],
    });
    assert.equal(b2.difficulty, "beginner");

    // Advanced: breaking change label
    const a1 = inferDifficulty({
      title: "Refactor core router pipeline",
      body: "This is a breaking change",
      labels: [{ name: "breaking-change" }],
    });
    assert.equal(a1.difficulty, "advanced");

    // Intermediate: standard enhancement
    const i1 = inferDifficulty({
      title: "Add support for custom headers",
      body: "Please add option for headers",
      labels: [{ name: "enhancement" }],
    });
    assert.equal(i1.difficulty, "intermediate");
  });

  it("should calculate Contribution Readiness Score deterministically", () => {
    const mockTree: GitTreeItemDto[] = [
      { path: "lib/router/index.js", mode: "100644", type: "blob", sha: "1", url: "" },
      { path: "test/router.js", mode: "100644", type: "blob", sha: "2", url: "" },
    ];
    const mockKeyDocs: KeyDocument[] = [
      { type: "contributing", name: "CONTRIBUTING.md", path: "CONTRIBUTING.md", label: "Contributing", badgeColor: "" },
      { type: "readme", name: "README.md", path: "README.md", label: "Readme", badgeColor: "" },
    ];

    // High readiness issue
    const readinessHigh = calculateReadinessScore(
      {
        title: "Router crash when calling next() with error in lib/router/index.js",
        body: "### Steps to reproduce:\n1. Run server\n2. Trigger endpoint\n\n```js\napp.use((req, res, next) => next(new Error('fail')));\n```\nExpected: error handler called\nActual: unhandled crash",
        labels: [{ name: "good first issue" }, { name: "bug" }],
        comments: 2,
        updated_at: new Date().toISOString(),
      },
      mockTree,
      mockKeyDocs
    );

    assert.ok(readinessHigh.totalScore >= 70, `Expected score >= 70, got ${readinessHigh.totalScore}`);
    assert.equal(readinessHigh.tier, "high");
    assert.equal(readinessHigh.signals.length, 5);
    assert.ok(readinessHigh.signals.find((s) => s.id === "clarity")?.passed);
    assert.ok(readinessHigh.signals.find((s) => s.id === "localization")?.passed);
  });

  it("should extract verified test commands from repository manifests", () => {
    const nodeManifest = {
      path: "package.json",
      content: JSON.stringify({
        scripts: {
          test: "mocha --reporter spec test/",
          "test:unit": "mocha test/unit",
        },
      }),
    };

    const rustManifest = {
      path: "Cargo.toml",
      content: "[package]\nname = 'my_crate'",
    };

    const pyManifest = {
      path: "pyproject.toml",
      content: "[tool.pytest.ini_options]\nminversion = '6.0'",
    };

    const commands = extractVerifiedTestCommands([nodeManifest, rustManifest, pyManifest]);

    assert.equal(commands.length, 4);
    assert.equal(commands[0].command, "npm test");
    assert.equal(commands[1].command, "npm run test:unit");
    assert.equal(commands[2].command, "cargo test");
    assert.equal(commands[3].command, "pytest");
  });
});
