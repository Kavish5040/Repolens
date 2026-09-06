import type { GitTreeItemDto } from "./types.ts";
import type {
  RepoIntelligenceData,
  RepoStructureSummary,
  DirectoryClassification,
  DirectoryRole,
  TechnologySignal,
  EntryPointCandidate,
  EntryPointType,
  OnboardingStep,
  ReadingOrderItem,
  StructuralInsight,
  ConfidenceLevel,
} from "./intelligence-types.ts";
import { detectKeyDocuments } from "./tree.ts";

// ==========================================
// 1. Directory Role Heuristic Definitions
// ==========================================

interface DirectoryRule {
  role: DirectoryRole;
  label: string;
  pattern: RegExp;
  confidence: ConfidenceLevel;
  signalDescription: string;
}

const DIRECTORY_RULES: DirectoryRule[] = [
  {
    role: "application",
    label: "Application Routing & Views",
    pattern: /^(?:app|pages|views|routes|controllers|screens|scenes)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "Matches conventional application UI/routing directory pattern",
  },
  {
    role: "components",
    label: "UI Components & Widgets",
    pattern: /^(?:components|ui|widgets|elements|views\/components|src\/components)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "Matches UI component library/widget folder naming",
  },
  {
    role: "source",
    label: "Core Source Code",
    pattern: /^(?:src|lib|pkg|core|internal|packages(?:\/[^/]+)?\/src)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "Standard source code and library root directory",
  },
  {
    role: "library",
    label: "Utilities & Helpers",
    pattern: /^(?:utils|helpers|common|shared|services|modules|hooks)(?:\/|$)/i,
    confidence: "medium",
    signalDescription: "Common utility, service, or shared helper modules",
  },
  {
    role: "tests",
    label: "Test Suites & Specs",
    pattern: /^(?:tests?|specs?|__tests__|__specs__|e2e|cypress|playwright|fixtures)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "Standard unit, integration, or end-to-end testing folder",
  },
  {
    role: "documentation",
    label: "Documentation & Guides",
    pattern: /^(?:docs?|guides?|wiki|documentation|manual)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "Project documentation, guides, or specifications directory",
  },
  {
    role: "tooling",
    label: "Scripts & Development Tooling",
    pattern: /^(?:scripts?|tools?|tasks?|bin|generators?|codegen)(?:\/|$)/i,
    confidence: "medium",
    signalDescription: "Development tooling, build scripts, or automation utilities",
  },
  {
    role: "examples",
    label: "Examples & Playgrounds",
    pattern: /^(?:examples?|samples?|demos?|playgrounds?|sandbox|starters?)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "Demonstration, example usage, or starter project workspace",
  },
  {
    role: "infrastructure",
    label: "CI/CD & Infrastructure",
    pattern: /^(?:\.github|\.gitlab|\.circleci|k8s|kubernetes|terraform|deploy|deployment|docker|infra)(?:\/|$)/i,
    confidence: "high",
    signalDescription: "CI/CD workflow, container, or cloud infrastructure definitions",
  },
  {
    role: "config",
    label: "Configuration & Schema",
    pattern: /^(?:config|configs|settings|\.config)(?:\/|$)/i,
    confidence: "medium",
    signalDescription: "Environment, compiler, or application configuration directory",
  },
  {
    role: "build_output",
    label: "Generated Build Artifacts",
    pattern: /^(?:dist|build|out|\.next|target|coverage)(?:\/|$)/i,
    confidence: "low",
    signalDescription: "Detected build artifact or compilation output directory",
  },
  {
    role: "dependencies",
    label: "Third-Party Dependencies",
    pattern: /^(?:node_modules|vendor|third_party|bower_components)(?:\/|$)/i,
    confidence: "low",
    signalDescription: "Third-party vendor or package dependency directory",
  },
];

// ==========================================
// 2. Technology & Framework Detection Rules
// ==========================================

interface TechRule {
  name: string;
  category: TechnologySignal["category"];
  pattern: RegExp;
  confidence: ConfidenceLevel;
  evidenceTemplate: (match: string) => string;
}

const TECH_RULES: TechRule[] = [
  // Frameworks
  {
    name: "Next.js",
    category: "framework",
    pattern: /^(?:next\.config\.(?:ts|js|mjs)|app\/(?:layout|page)\.(?:tsx|jsx)|pages\/_app\.(?:tsx|jsx))$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Next.js configuration or root layout at '${match}'`,
  },
  {
    name: "React",
    category: "framework",
    pattern: /\.(?:jsx|tsx)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found JSX/TSX React components (e.g. '${match}')`,
  },
  {
    name: "FastAPI",
    category: "framework",
    pattern: /^(?:.*fastapi.*\.py|main\.py|app\/main\.py)$/i,
    confidence: "medium",
    evidenceTemplate: (match) => `Found Python API application entry point at '${match}'`,
  },
  {
    name: "Django",
    category: "framework",
    pattern: /^(?:manage\.py|wsgi\.py|asgi\.py|.*settings\.py)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Django management/entry file at '${match}'`,
  },
  {
    name: "Vite",
    category: "build_tool",
    pattern: /^vite\.config\.(?:ts|js|mjs)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Vite configuration at '${match}'`,
  },
  {
    name: "Tailwind CSS",
    category: "framework",
    pattern: /^(?:tailwind\.config\.(?:ts|js|mjs|cjs)|.*globals\.css)$/i,
    confidence: "medium",
    evidenceTemplate: (match) => `Found Tailwind styling signals in '${match}'`,
  },

  // Languages & Runtimes
  {
    name: "TypeScript",
    category: "language",
    pattern: /^(?:tsconfig(?:\.[^/]+)?\.json|.*\.tsx?)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found TypeScript configuration or source file at '${match}'`,
  },
  {
    name: "Rust (Cargo)",
    category: "language",
    pattern: /^(?:Cargo\.toml|src\/(?:main|lib)\.rs)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Rust Cargo manifest or crate root at '${match}'`,
  },
  {
    name: "Python",
    category: "language",
    pattern: /^(?:pyproject\.toml|requirements\.txt|setup\.py|Pipfile|.*\.py)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Python project manifest or source file at '${match}'`,
  },
  {
    name: "Go",
    category: "language",
    pattern: /^(?:go\.mod|go\.sum|.*\.go)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Go module manifest or source file at '${match}'`,
  },
  {
    name: "Java / JVM",
    category: "language",
    pattern: /^(?:pom\.xml|build\.gradle(?:\.kts)?|.*\.java)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Maven/Gradle manifest or Java source file at '${match}'`,
  },

  // Testing Frameworks
  {
    name: "Jest",
    category: "testing",
    pattern: /^jest\.config\.(?:ts|js|mjs|json)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Jest test runner configuration at '${match}'`,
  },
  {
    name: "Vitest",
    category: "testing",
    pattern: /^vitest\.config\.(?:ts|js|mjs)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Vitest configuration at '${match}'`,
  },
  {
    name: "Playwright",
    category: "testing",
    pattern: /^playwright\.config\.(?:ts|js|mjs)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Playwright E2E test configuration at '${match}'`,
  },
  {
    name: "Pytest",
    category: "testing",
    pattern: /^(?:pytest\.ini|conftest\.py|\.pytest_cache)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Pytest configuration or test harness at '${match}'`,
  },

  // CI/CD & Containers
  {
    name: "GitHub Actions",
    category: "infrastructure",
    pattern: /^\.github\/workflows\/.*\.ya?ml$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found GitHub Actions workflow definition at '${match}'`,
  },
  {
    name: "Docker",
    category: "infrastructure",
    pattern: /^(?:Dockerfile(?:\.[^/]+)?|docker-compose(?:\.[^/]+)?\.ya?ml|\.dockerignore)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Docker containerization definition at '${match}'`,
  },

  // Linters & Formatters
  {
    name: "ESLint",
    category: "linter_formatter",
    pattern: /^(?:eslint\.config\.(?:mjs|js|ts)|\.eslintrc(?:\.[^/]+)?)$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found ESLint configuration at '${match}'`,
  },
  {
    name: "Prettier",
    category: "linter_formatter",
    pattern: /^\.prettierrc(?:\.[^/]+)?$/i,
    confidence: "high",
    evidenceTemplate: (match) => `Found Prettier configuration at '${match}'`,
  },
];

// ==========================================
// 3. Entry Point Candidate Rules (Ranked)
// ==========================================

interface EntryPointRule {
  type: EntryPointType;
  label: string;
  pattern: RegExp;
  baseScore: number;
  confidence: ConfidenceLevel;
  description: string;
  signalExplanation: (path: string) => string;
}

const ENTRY_POINT_RULES: EntryPointRule[] = [
  {
    type: "app_root",
    label: "Next.js App Router Page",
    pattern: /^app\/page\.(?:tsx|jsx|js|ts)$/i,
    baseScore: 100,
    confidence: "high",
    description: "Primary landing route and UI root component in Next.js App Router",
    signalExplanation: (p) => `Detected App Router entry page at '${p}'`,
  },
  {
    type: "app_root",
    label: "Next.js Pages Router Root",
    pattern: /^pages\/index\.(?:tsx|jsx|js|ts)$/i,
    baseScore: 95,
    confidence: "high",
    description: "Primary landing route in Next.js Pages Router",
    signalExplanation: (p) => `Detected Pages Router index at '${p}'`,
  },
  {
    type: "main_module",
    label: "Main Application Source Entry",
    pattern: /^src\/(?:index|main|app)\.(?:ts|tsx|js|jsx)$/i,
    baseScore: 90,
    confidence: "high",
    description: "Primary application or library bootstrap file under 'src/'",
    signalExplanation: (p) => `Standard main entry point under source directory at '${p}'`,
  },
  {
    type: "main_module",
    label: "Rust Crate Root (Binary / Library)",
    pattern: /^src\/(?:main|lib)\.rs$/i,
    baseScore: 90,
    confidence: "high",
    description: "Rust root source file (main.rs executable or lib.rs library crate)",
    signalExplanation: (p) => `Rust crate entry point detected at '${p}'`,
  },
  {
    type: "main_module",
    label: "Go Application Entry",
    pattern: /^(?:main\.go|cmd\/[^/]+\/main\.go)$/i,
    baseScore: 90,
    confidence: "high",
    description: "Go main package entry point",
    signalExplanation: (p) => `Go executable main package detected at '${p}'`,
  },
  {
    type: "main_module",
    label: "Python Main Script",
    pattern: /^(?:main\.py|app\.py|src\/main\.py|src\/app\.py|app\/main\.py|app\/app\.py)$/i,
    baseScore: 85,
    confidence: "high",
    description: "Python application bootstrap script",
    signalExplanation: (p) => `Python main application module detected at '${p}'`,
  },
  {
    type: "app_root",
    label: "Root Entry Point",
    pattern: /^(?:index|main|app)\.(?:ts|tsx|js|jsx)$/i,
    baseScore: 80,
    confidence: "medium",
    description: "Root directory JavaScript/TypeScript entry point",
    signalExplanation: (p) => `Top-level module file detected at '${p}'`,
  },
  {
    type: "cli_entry",
    label: "CLI Executable Entry",
    pattern: /^(?:bin\/[^/]+|src\/cli\.(?:ts|js))$/i,
    baseScore: 75,
    confidence: "medium",
    description: "Command-line interface binary/executable script",
    signalExplanation: (p) => `Command line interface executable detected at '${p}'`,
  },
  {
    type: "server_entry",
    label: "Server / Backend Bootstrap",
    pattern: /^(?:server\.(?:ts|js)|src\/server\.(?:ts|js))$/i,
    baseScore: 75,
    confidence: "medium",
    description: "Backend HTTP server bootstrap file",
    signalExplanation: (p) => `Dedicated server entry point detected at '${p}'`,
  },
  {
    type: "library_export",
    label: "Monorepo Package Entry",
    pattern: /^packages\/[^/]+\/src\/index\.(?:ts|tsx|js)$/i,
    baseScore: 70,
    confidence: "medium",
    description: "Export entry point for a monorepo workspace package",
    signalExplanation: (p) => `Workspace package entry module detected at '${p}'`,
  },
];

// ==========================================
// 4. Intelligence Engine Core Implementation
// ==========================================

/**
 * Analyzes repository tree structure and categorizes top-level and meaningful subdirectories.
 */
export function analyzeStructure(items: GitTreeItemDto[]): RepoStructureSummary {
  let rootFileCount = 0;
  let maxTreeDepth = 0;
  let hasMonorepoWorkspaces = false;
  const workspacePatterns: string[] = [];

  // Track folder stats: path -> { fileCount, totalSize, sampleFiles: string[] }
  const folderStats = new Map<string, { fileCount: number; totalSize: number; sampleFiles: string[]; depth: number }>();
  let totalFiles = 0;
  let totalDirectories = 0;

  for (const item of items) {
    const isFile = item.type === "blob";
    if (isFile) {
      totalFiles++;
    } else {
      totalDirectories++;
    }

    const segments = item.path.split("/");
    const depth = segments.length;
    if (depth > maxTreeDepth) {
      maxTreeDepth = depth;
    }

    if (depth === 1 && isFile) {
      rootFileCount++;
    }

    // Check monorepo workspace indicators
    if (
      item.path === "pnpm-workspace.yaml" ||
      item.path === "lerna.json" ||
      item.path.startsWith("packages/") ||
      item.path.startsWith("apps/")
    ) {
      hasMonorepoWorkspaces = true;
      if (item.path.startsWith("packages/") && !workspacePatterns.includes("packages/*")) {
        workspacePatterns.push("packages/*");
      }
      if (item.path.startsWith("apps/") && !workspacePatterns.includes("apps/*")) {
        workspacePatterns.push("apps/*");
      }
    }

    // Accumulate folder stats for directories (up to depth 4 for structural classification)
    if (depth > 1) {
      const maxDirDepth = Math.min(segments.length - 1, 4);
      for (let i = 1; i <= maxDirDepth; i++) {
        const dirPath = segments.slice(0, i).join("/");
        const current = folderStats.get(dirPath) || {
          fileCount: 0,
          totalSize: 0,
          sampleFiles: [],
          depth: i,
        };
        if (isFile) {
          current.fileCount += 1;
          current.totalSize += item.size || 0;
          if (current.sampleFiles.length < 3) {
            current.sampleFiles.push(item.path);
          }
        }
        folderStats.set(dirPath, current);
      }
    }
  }

  // Classify discovered directories
  const classifications: DirectoryClassification[] = [];
  const seenClassifiedPaths = new Set<string>();

  for (const [dirPath, stats] of folderStats.entries()) {
    if (stats.fileCount === 0) continue;

    for (const rule of DIRECTORY_RULES) {
      if (rule.pattern.test(dirPath) && !seenClassifiedPaths.has(dirPath)) {
        seenClassifiedPaths.add(dirPath);
        classifications.push({
          path: dirPath,
          name: dirPath.split("/").pop() || dirPath,
          role: rule.role,
          label: rule.label,
          confidence: rule.confidence,
          signals: [rule.signalDescription, `Contains ${stats.fileCount} files (${(stats.totalSize / 1024).toFixed(1)} KB)`],
          fileCount: stats.fileCount,
          totalSize: stats.totalSize,
          depth: stats.depth,
          sampleFiles: stats.sampleFiles,
        });
        break;
      }
    }
  }

  // Sort classifications: top-level first, then by file count descending
  classifications.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return b.fileCount - a.fileCount;
  });

  return {
    classifications,
    totalAnalyzedFiles: totalFiles,
    totalAnalyzedDirectories: totalDirectories,
    rootFileCount,
    maxTreeDepth,
    hasMonorepoWorkspaces,
    workspacePatterns: workspacePatterns.length > 0 ? workspacePatterns : undefined,
  };
}

/**
 * Deterministically detects technologies, frameworks, testing tools, and infrastructure signals.
 */
export function detectTechnologies(items: GitTreeItemDto[]): TechnologySignal[] {
  const signalMap = new Map<string, { rule: TechRule; evidence: Set<string> }>();

  for (const item of items) {
    for (const rule of TECH_RULES) {
      if (rule.pattern.test(item.path)) {
        const existing = signalMap.get(rule.name);
        const evidenceText = rule.evidenceTemplate(item.path);
        if (existing) {
          if (existing.evidence.size < 3) {
            existing.evidence.add(evidenceText);
          }
        } else {
          signalMap.set(rule.name, {
            rule,
            evidence: new Set([evidenceText]),
          });
        }
      }
    }
  }

  const result: TechnologySignal[] = [];
  for (const [name, { rule, evidence }] of signalMap.entries()) {
    result.push({
      name,
      category: rule.category,
      confidence: rule.confidence,
      evidence: Array.from(evidence),
    });
  }

  // Sort by category priority then confidence
  const categoryOrder: Record<TechnologySignal["category"], number> = {
    framework: 1,
    language: 2,
    runtime: 3,
    build_tool: 4,
    testing: 5,
    infrastructure: 6,
    linter_formatter: 7,
  };

  return result.sort((a, b) => {
    const catDiff = (categoryOrder[a.category] || 9) - (categoryOrder[b.category] || 9);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Finds and ranks potential application entry points.
 */
export function detectRankedEntryPoints(items: GitTreeItemDto[]): EntryPointCandidate[] {
  const candidates: (EntryPointCandidate & { score: number })[] = [];
  const seenPaths = new Set<string>();

  for (const item of items) {
    if (item.type !== "blob") continue;

    for (const rule of ENTRY_POINT_RULES) {
      if (rule.pattern.test(item.path) && !seenPaths.has(item.path)) {
        seenPaths.add(item.path);
        candidates.push({
          path: item.path,
          name: item.path.split("/").pop() || item.path,
          type: rule.type,
          label: rule.label,
          rank: 0,
          confidence: rule.confidence,
          signals: [rule.signalExplanation(item.path)],
          description: rule.description,
          score: rule.baseScore,
        });
        break;
      }
    }
  }

  // Sort by score descending and assign 1-based rank
  candidates.sort((a, b) => b.score - a.score);

  return candidates.map((c, index) => ({
    path: c.path,
    name: c.name,
    type: c.type,
    label: c.label,
    rank: index + 1,
    confidence: c.confidence,
    signals: c.signals,
    description: c.description,
  }));
}

/**
 * Constructs a prioritized 4-to-7 step deterministic onboarding pathway for developers new to the repository.
 */
export function generateWhereToStart(
  items: GitTreeItemDto[],
  structure: RepoStructureSummary,
  entryPoints: EntryPointCandidate[]
): OnboardingStep[] {
  const steps: OnboardingStep[] = [];
  const keyDocs = detectKeyDocuments(items);
  let stepCounter = 1;

  // Step 1: README / Primary Documentation
  const readmeDoc = keyDocs.find((d) => d.type === "readme");
  if (readmeDoc) {
    steps.push({
      stepNumber: stepCounter++,
      title: "Start with Project Documentation",
      targetPath: readmeDoc.path,
      targetType: "file",
      category: "overview",
      reason: "Establishes project purpose, architectural intent, and quick-start instructions.",
      signalStrength: "primary",
      keyPointsToInspect: ["Project goals and mission", "Local development prerequisites", "High-level architecture overview"],
      evidence: [`Detected primary documentation file at '${readmeDoc.path}'`],
    });
  }

  // Step 2: Project Manifest / Dependencies
  const manifestDoc = keyDocs.find((d) => d.type === "manifest");
  if (manifestDoc) {
    steps.push({
      stepNumber: stepCounter++,
      title: "Inspect Package Manifest & Scripts",
      targetPath: manifestDoc.path,
      targetType: "file",
      category: "manifest",
      reason: "Reveals runtime dependencies, build commands, test scripts, and workspace configuration.",
      signalStrength: "primary",
      keyPointsToInspect: ["Core dependencies and versions", "npm/cargo/pip build scripts", "Exported package binaries or entry points"],
      evidence: [`Detected project manifest at '${manifestDoc.path}'`],
    });
  }

  // Step 3: Top-Ranked Application Entry Point
  if (entryPoints.length > 0) {
    const topEntry = entryPoints[0];
    steps.push({
      stepNumber: stepCounter++,
      title: `Explore Primary Entry Point (${topEntry.label})`,
      targetPath: topEntry.path,
      targetType: "file",
      category: "entry_point",
      reason: topEntry.description,
      signalStrength: "primary",
      keyPointsToInspect: ["Initial bootstrap logic", "Route definitions or main dispatch loop", "Global state or context providers"],
      evidence: topEntry.signals,
    });
  }

  // Step 4: Core Source / Application Subsystem Directory
  const primarySourceDir = structure.classifications.find(
    (c) => c.role === "source" || c.role === "application" || c.role === "components"
  );
  if (primarySourceDir) {
    steps.push({
      stepNumber: stepCounter++,
      title: `Examine Core Subsystem ('${primarySourceDir.path}')`,
      targetPath: primarySourceDir.path,
      targetType: "directory",
      category: "core_architecture",
      reason: `Hosts the main business logic and components (${primarySourceDir.fileCount} files).`,
      signalStrength: "secondary",
      keyPointsToInspect: ["Module organization and naming patterns", "Shared utility interfaces", "Component hierarchy"],
      evidence: primarySourceDir.signals,
    });
  }

  // Step 5: Test Suite / Verification
  const testDir = structure.classifications.find((c) => c.role === "tests");
  if (testDir) {
    steps.push({
      stepNumber: stepCounter++,
      title: `Review Test Suite ('${testDir.path}')`,
      targetPath: testDir.path,
      targetType: "directory",
      category: "testing",
      reason: "Provides concrete code examples, edge-case contracts, and expected behavior.",
      signalStrength: "secondary",
      keyPointsToInspect: ["Unit test patterns", "Mocking conventions", "Integration test coverage"],
      evidence: testDir.signals,
    });
  }

  // Step 6: Contribution Guidelines
  const contribDoc = keyDocs.find((d) => d.type === "contributing");
  if (contribDoc) {
    steps.push({
      stepNumber: stepCounter++,
      title: "Review Contribution & PR Guidelines",
      targetPath: contribDoc.path,
      targetType: "file",
      category: "contribution",
      reason: "Details code style requirements, PR templates, and local testing instructions.",
      signalStrength: "supplementary",
      keyPointsToInspect: ["Branching and PR workflow", "Linter and test requirements before commit", "Code style conventions"],
      evidence: [`Detected contributor guidelines at '${contribDoc.path}'`],
    });
  }

  return steps;
}

/**
 * Converts onboarding steps into a reading sequence list.
 */
export function generateReadingOrder(steps: OnboardingStep[]): ReadingOrderItem[] {
  return steps.map((step) => ({
    order: step.stepNumber,
    path: step.targetPath,
    name: step.targetPath.split("/").pop() || step.targetPath,
    type: step.targetType,
    role: step.title,
    explanation: step.reason,
    evidence: step.evidence.join("; "),
  }));
}

/**
 * Generates structural insights (monorepo, CI/CD, test presence, complexity).
 */
export function generateStructuralInsights(
  items: GitTreeItemDto[],
  structure: RepoStructureSummary,
  technologies: TechnologySignal[]
): StructuralInsight[] {
  const insights: StructuralInsight[] = [];
  const keyDocs = detectKeyDocuments(items);

  // 1. Documentation Presence
  const hasReadme = keyDocs.some((d) => d.type === "readme");
  insights.push({
    key: "documentation_status",
    label: "Documentation Status",
    value: hasReadme ? "Present" : "Missing README",
    description: hasReadme ? "Repository includes root or docs/ documentation." : "No standard README.md detected in the repository.",
    type: hasReadme ? "positive" : "warning",
    evidence: hasReadme ? "Found README documentation file" : "Absence of README.md file",
  });

  // 2. Test Suite Presence
  const hasTests = structure.classifications.some((c) => c.role === "tests") || technologies.some((t) => t.category === "testing");
  insights.push({
    key: "test_suite_status",
    label: "Automated Testing",
    value: hasTests ? "Configured" : "No Tests Detected",
    description: hasTests ? "Dedicated test directories or test framework configs found." : "No standard test directory (e.g. test/, tests/) detected.",
    type: hasTests ? "positive" : "neutral",
    evidence: hasTests ? "Detected test folder or test runner config" : "No test files detected",
  });

  // 3. CI/CD Integration
  const hasCI = technologies.some((t) => t.name === "GitHub Actions") || structure.classifications.some((c) => c.role === "infrastructure");
  insights.push({
    key: "cicd_status",
    label: "CI/CD Automation",
    value: hasCI ? "Active" : "Not Detected",
    description: hasCI ? "Continuous integration workflows or container configs are present." : "No CI/CD pipeline definitions detected in standard locations.",
    type: hasCI ? "positive" : "neutral",
    evidence: hasCI ? "Found .github/workflows or Docker infrastructure" : "No workflow YAML found",
  });

  // 4. Monorepo Architecture
  if (structure.hasMonorepoWorkspaces) {
    insights.push({
      key: "monorepo_status",
      label: "Repository Architecture",
      value: "Monorepo Workspace",
      description: `Contains multiple packages/apps (${structure.workspacePatterns?.join(", ")}).`,
      type: "neutral",
      evidence: `Found workspace structure at ${structure.workspacePatterns?.join(", ")}`,
    });
  }

  // 5. Codebase Scale Indicator
  insights.push({
    key: "scale_indicator",
    label: "Codebase Scale",
    value: `${structure.totalAnalyzedFiles} files`,
    description: `Spans ${structure.totalAnalyzedDirectories} directories with max folder depth of ${structure.maxTreeDepth}.`,
    type: "neutral",
  });

  return insights;
}

/**
 * Main pure entry point that orchestrates deterministic repository intelligence analysis.
 */
export function analyzeRepositoryIntelligence(
  repoFullName: string,
  defaultBranch: string,
  items: GitTreeItemDto[]
): RepoIntelligenceData {
  const structure = analyzeStructure(items);
  const technologies = detectTechnologies(items);
  const entryPoints = detectRankedEntryPoints(items);
  const whereToStart = generateWhereToStart(items, structure, entryPoints);
  const readingOrder = generateReadingOrder(whereToStart);
  const insights = generateStructuralInsights(items, structure, technologies);

  return {
    repoFullName,
    defaultBranch,
    structure,
    technologies,
    entryPoints,
    whereToStart,
    readingOrder,
    insights,
    generatedAt: new Date().toISOString(),
  };
}
