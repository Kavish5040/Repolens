import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeStructure,
  detectTechnologies,
  detectRankedEntryPoints,
  generateWhereToStart,
  analyzeRepositoryIntelligence,
} from "../lib/github/intelligence.ts";
import type { GitTreeItemDto } from "../lib/github/types.ts";

describe("Deterministic Repository Intelligence Engine", () => {
  // 1. Next.js App Router Tree Fixture
  const nextJsTree: GitTreeItemDto[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: "sha-readme", size: 2048, url: "" },
    { path: "package.json", mode: "100644", type: "blob", sha: "sha-pkg", size: 600, url: "" },
    { path: "tsconfig.json", mode: "100644", type: "blob", sha: "sha-tsc", size: 400, url: "" },
    { path: "next.config.ts", mode: "100644", type: "blob", sha: "sha-nextcfg", size: 200, url: "" },
    { path: "tailwind.config.ts", mode: "100644", type: "blob", sha: "sha-twcfg", size: 300, url: "" },
    { path: "app", mode: "040000", type: "tree", sha: "sha-app", url: "" },
    { path: "app/layout.tsx", mode: "100644", type: "blob", sha: "sha-layout", size: 800, url: "" },
    { path: "app/page.tsx", mode: "100644", type: "blob", sha: "sha-page", size: 1200, url: "" },
    { path: "app/api/hello/route.ts", mode: "100644", type: "blob", sha: "sha-route", size: 400, url: "" },
    { path: "components", mode: "040000", type: "tree", sha: "sha-cmp", url: "" },
    { path: "components/Header.tsx", mode: "100644", type: "blob", sha: "sha-hdr", size: 1500, url: "" },
    { path: "components/Button.tsx", mode: "100644", type: "blob", sha: "sha-btn", size: 700, url: "" },
    { path: "tests", mode: "040000", type: "tree", sha: "sha-test", url: "" },
    { path: "tests/home.test.ts", mode: "100644", type: "blob", sha: "sha-test1", size: 900, url: "" },
    { path: "jest.config.ts", mode: "100644", type: "blob", sha: "sha-jest", size: 350, url: "" },
    { path: ".github", mode: "040000", type: "tree", sha: "sha-gh", url: "" },
    { path: ".github/workflows/ci.yml", mode: "100644", type: "blob", sha: "sha-ci", size: 500, url: "" },
    { path: ".github/CONTRIBUTING.md", mode: "100644", type: "blob", sha: "sha-contrib", size: 2500, url: "" },
  ];

  it("should classify Next.js structure and detect framework signals", () => {
    const intel = analyzeRepositoryIntelligence("test-org/next-sample", "main", nextJsTree);

    // Structure classifications
    const appDir = intel.structure.classifications.find((c) => c.path === "app");
    assert.ok(appDir, "Should classify app directory");
    assert.equal(appDir.role, "application");

    const cmpDir = intel.structure.classifications.find((c) => c.path === "components");
    assert.ok(cmpDir, "Should classify components directory");
    assert.equal(cmpDir.role, "components");

    const testDir = intel.structure.classifications.find((c) => c.path === "tests");
    assert.ok(testDir, "Should classify tests directory");
    assert.equal(testDir.role, "tests");

    // Technology detection
    const techNames = intel.technologies.map((t) => t.name);
    assert.ok(techNames.includes("Next.js"), "Should detect Next.js");
    assert.ok(techNames.includes("React"), "Should detect React");
    assert.ok(techNames.includes("TypeScript"), "Should detect TypeScript");
    assert.ok(techNames.includes("Jest"), "Should detect Jest");
    assert.ok(techNames.includes("GitHub Actions"), "Should detect GitHub Actions");

    // Entry points
    assert.ok(intel.entryPoints.length > 0);
    assert.equal(intel.entryPoints[0].path, "app/page.tsx");
    assert.equal(intel.entryPoints[0].rank, 1);
    assert.equal(intel.entryPoints[0].confidence, "high");

    // Onboarding Path
    assert.ok(intel.whereToStart.length >= 4);
    assert.equal(intel.whereToStart[0].targetPath, "README.md");
    assert.equal(intel.whereToStart[1].targetPath, "package.json");
    assert.equal(intel.whereToStart[2].targetPath, "app/page.tsx");
  });

  // 2. Python FastAPI Tree Fixture
  const pythonTree: GitTreeItemDto[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: "sha-readme", size: 1000, url: "" },
    { path: "pyproject.toml", mode: "100644", type: "blob", sha: "sha-pyproj", size: 500, url: "" },
    { path: "app", mode: "040000", type: "tree", sha: "sha-app", url: "" },
    { path: "app/main.py", mode: "100644", type: "blob", sha: "sha-py-main", size: 1200, url: "" },
    { path: "app/routes.py", mode: "100644", type: "blob", sha: "sha-py-routes", size: 800, url: "" },
    { path: "tests", mode: "040000", type: "tree", sha: "sha-tests", url: "" },
    { path: "tests/test_main.py", mode: "100644", type: "blob", sha: "sha-py-test", size: 600, url: "" },
    { path: "Dockerfile", mode: "100644", type: "blob", sha: "sha-df", size: 400, url: "" },
  ];

  it("should detect Python and rank app/main.py as primary entry point", () => {
    const entryPoints = detectRankedEntryPoints(pythonTree);
    assert.ok(entryPoints.length > 0);
    assert.equal(entryPoints[0].path, "app/main.py");

    const techs = detectTechnologies(pythonTree).map((t) => t.name);
    assert.ok(techs.includes("Python"));
    assert.ok(techs.includes("Docker"));
  });

  // 3. Rust Cargo Monorepo Tree Fixture
  const rustMonorepoTree: GitTreeItemDto[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: "sha-rm", size: 1000, url: "" },
    { path: "Cargo.toml", mode: "100644", type: "blob", sha: "sha-cg", size: 400, url: "" },
    { path: "packages", mode: "040000", type: "tree", sha: "sha-pkgs", url: "" },
    { path: "packages/core", mode: "040000", type: "tree", sha: "sha-p1", url: "" },
    { path: "packages/core/src", mode: "040000", type: "tree", sha: "sha-p1-src", url: "" },
    { path: "packages/core/src/lib.rs", mode: "100644", type: "blob", sha: "sha-p1-lib", size: 2000, url: "" },
    { path: "src", mode: "040000", type: "tree", sha: "sha-src", url: "" },
    { path: "src/main.rs", mode: "100644", type: "blob", sha: "sha-main-rs", size: 1500, url: "" },
  ];

  it("should detect Rust Cargo workspace signals and main.rs entry point", () => {
    const structure = analyzeStructure(rustMonorepoTree);
    assert.ok(structure.hasMonorepoWorkspaces);
    assert.deepEqual(structure.workspacePatterns, ["packages/*"]);

    const entryPoints = detectRankedEntryPoints(rustMonorepoTree);
    assert.ok(entryPoints.length > 0);
    assert.equal(entryPoints[0].path, "src/main.rs");
  });

  // 4. Large Repository Scalability & Bounded Resource Test
  it("should process large repository trees (10,000+ files) quickly with bounded memory", () => {
    const largeTree: GitTreeItemDto[] = [];
    // Generate 10,000 synthetic tree items with varied depths and extensions
    for (let i = 0; i < 10000; i++) {
      largeTree.push({
        path: `packages/pkg-${i % 20}/src/components/item-${i}.tsx`,
        mode: "100644",
        type: "blob",
        sha: `sha-${i}`,
        size: 500 + (i % 1000),
        url: "",
      });
    }
    // Add manifests and entry points
    largeTree.push(
      { path: "README.md", mode: "100644", type: "blob", sha: "sha-rm", size: 1000, url: "" },
      { path: "package.json", mode: "100644", type: "blob", sha: "sha-pj", size: 500, url: "" },
      { path: "app/page.tsx", mode: "100644", type: "blob", sha: "sha-app-page", size: 1000, url: "" },
      { path: "src/index.ts", mode: "100644", type: "blob", sha: "sha-src-idx", size: 800, url: "" }
    );

    const startTime = performance.now();
    const intel = analyzeRepositoryIntelligence("large-org/large-repo", "main", largeTree);
    const durationMs = performance.now() - startTime;

    assert.ok(durationMs < 500, `Large repo analysis must complete under 500ms, took ${durationMs.toFixed(2)}ms`);
    assert.equal(intel.structure.totalAnalyzedFiles, 10004);
    assert.ok(intel.structure.classifications.length > 0);
    // Entry points ranked
    assert.equal(intel.entryPoints[0].path, "app/page.tsx");
    assert.equal(intel.entryPoints[0].rank, 1);
    assert.equal(intel.entryPoints[1].path, "src/index.ts");
    assert.equal(intel.entryPoints[1].rank, 2);

    // Evidence checks
    assert.ok(intel.entryPoints[0].signals.length > 0, "Candidate must include observable evidence");
    assert.ok(intel.whereToStart[0].evidence.length > 0, "Onboarding step must include observable evidence");
    assert.ok(intel.technologies[0].evidence.length > 0, "Technology signal must include observable evidence");
  });

  // 5. Empty & Edge Case Tree
  it("should handle empty repository gracefully without throwing", () => {
    const intel = analyzeRepositoryIntelligence("empty-org/empty-repo", "main", []);
    assert.equal(intel.structure.totalAnalyzedFiles, 0);
    assert.equal(intel.technologies.length, 0);
    assert.equal(intel.entryPoints.length, 0);
    assert.equal(intel.whereToStart.length, 0);
    assert.equal(intel.insights[0].key, "documentation_status");
    assert.equal(intel.insights[0].value, "Missing README");
  });
});
