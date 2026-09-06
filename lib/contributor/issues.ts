import type { GitTreeItemDto, KeyDocument, RateLimitInfo } from "../github/types.ts";
import type { RepoIntelligenceData } from "../github/intelligence-types.ts";
import type {
  GitHubIssueDto,
  GitHubLabelDto,
  ContributorIssue,
  IssueDifficulty,
  IssueCategory,
  ReadinessBreakdown,
  ReadinessSignalItem,
  LocalizedFileCandidate,
  VerifiedTestCommand,
} from "./types.ts";
import { fetchGitHub, type FetchGitHubOptions } from "../github/client.ts";

/**
 * Normalizes label names for classification matching.
 */
export function normalizeLabel(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");
}

/**
 * Exact canonical label patterns for each category to prevent broad substring false positives.
 */
export const CATEGORY_LABEL_PATTERNS: Record<Exclude<IssueCategory, "all">, Set<string>> = {
  "good-first-issue": new Set([
    "good first issue",
    "good first bug",
    "good first pr",
    "beginner",
    "beginner friendly",
    "easy",
    "starter",
    "starter bug",
    "first timers only",
    "first timer",
    "up for grabs: beginner",
    "e easy",
    "difficulty: easy",
    "difficulty: starter",
  ]),
  "help-wanted": new Set([
    "help wanted",
    "help wanted: easy",
    "help wanted: medium",
    "help wanted: hard",
    "up for grabs",
    "contributions welcome",
    "community help",
    "accepting prs",
    "needs help",
    "status: help wanted",
    "help",
  ]),
  "bug": new Set([
    "bug",
    "bugs",
    "defect",
    "bugfix",
    "type: bug",
    "type/bug",
    "kind/bug",
    "kind: bug",
    "c: bug",
    "t: bug",
  ]),
  "documentation": new Set([
    "documentation",
    "docs",
    "doc",
    "docstring",
    "type: documentation",
    "type/documentation",
    "type: docs",
    "type/docs",
    "kind/documentation",
    "kind/docs",
    "area: documentation",
    "area: docs",
    "d: docs",
    "typo",
  ]),
  "feature": new Set([
    "enhancement",
    "feature",
    "feature request",
    "type: enhancement",
    "type/enhancement",
    "type: feature",
    "type/feature",
    "kind/feature",
    "kind/enhancement",
    "proposal",
  ]),
};

export const CATEGORY_GITHUB_LABELS: Record<Exclude<IssueCategory, "all">, string[]> = {
  "good-first-issue": ["good first issue", "good-first-issue", "beginner"],
  "help-wanted": ["help wanted", "help-wanted", "up-for-grabs"],
  "bug": ["bug", "defect", "type: bug", "kind/bug"],
  "documentation": ["documentation", "docs", "docstring"],
  "feature": ["enhancement", "feature"],
};

/**
 * Returns all matching categories for a given set of labels.
 */
export function matchIssueCategories(labels: Array<{ name: string }>): IssueCategory[] {
  const matched = new Set<IssueCategory>();

  for (const label of labels) {
    const norm = normalizeLabel(label.name);
    for (const [cat, patterns] of Object.entries(CATEGORY_LABEL_PATTERNS) as [Exclude<IssueCategory, "all">, Set<string>][]) {
      if (patterns.has(norm)) {
        matched.add(cat);
      } else {
        for (const pattern of patterns) {
          if (
            norm === pattern ||
            norm === `${pattern}s` ||
            norm.startsWith(`${pattern}:`) ||
            norm.startsWith(`${pattern}/`) ||
            norm.endsWith(`: ${pattern}`) ||
            norm.endsWith(`/${pattern}`)
          ) {
            matched.add(cat);
          }
        }
      }
    }
  }

  return Array.from(matched);
}

/**
 * Determines primary issue category based on explicit labels.
 */
export function inferCategory(labels: Array<{ name: string }>): IssueCategory {
  const matched = matchIssueCategories(labels);
  if (matched.includes("good-first-issue")) return "good-first-issue";
  if (matched.includes("help-wanted")) return "help-wanted";
  if (matched.includes("bug")) return "bug";
  if (matched.includes("documentation")) return "documentation";
  if (matched.includes("feature")) return "feature";
  return "all";
}

/**
 * Checks if an issue matches a specific filter category.
 */
export function issueMatchesCategory(issue: { labels: Array<{ name: string }> }, category: IssueCategory): boolean {
  if (category === "all") return true;
  const matched = matchIssueCategories(issue.labels);
  return matched.includes(category);
}

/**
 * Transparent, evidence-based difficulty classification.
 */
export function inferDifficulty(issue: {
  title: string;
  body?: string | null;
  labels: Array<{ name: string }>;
}): { difficulty: IssueDifficulty; reason: string } {
  const normLabels = issue.labels.map((l) => normalizeLabel(l.name));
  const fullText = `${issue.title} ${issue.body || ""}`.toLowerCase();

  // 1. Beginner signals (Explicit triage labels or pure doc/typo scope)
  const beginnerLabelMatch = normLabels.find(
    (n) =>
      n.includes("good first") ||
      n.includes("beginner") ||
      n.includes("first timer") ||
      n.includes("easy") ||
      n.includes("starter")
  );
  if (beginnerLabelMatch) {
    return {
      difficulty: "beginner",
      reason: `Tagged with beginner label '${beginnerLabelMatch}' by maintainers.`,
    };
  }

  if (
    normLabels.some((n) => n.includes("documentation") || n.includes("typo") || n.includes("docs")) ||
    issue.title.toLowerCase().startsWith("docs:") ||
    issue.title.toLowerCase().startsWith("doc:")
  ) {
    return {
      difficulty: "beginner",
      reason: "Focused on documentation, copywriting, or typo correction.",
    };
  }

  // 2. Advanced signals (Architecture, breaking changes, core refactoring, security)
  const advancedLabelMatch = normLabels.find(
    (n) =>
      n.includes("breaking") ||
      n.includes("architecture") ||
      n.includes("core") ||
      n.includes("performance") ||
      n.includes("security") ||
      n.includes("rfc")
  );
  if (advancedLabelMatch) {
    return {
      difficulty: "advanced",
      reason: `Flagged with high-impact label '${advancedLabelMatch}'.`,
    };
  }

  if (
    fullText.includes("breaking change") ||
    fullText.includes("architectural change") ||
    fullText.includes("database migration") ||
    fullText.includes("concurrency issue") ||
    fullText.includes("memory leak")
  ) {
    return {
      difficulty: "advanced",
      reason: "Contains indicators of architectural redesign, breaking changes, or memory/concurrency complexity.",
    };
  }

  // 3. Intermediate fallback (Standard bug fix, feature, enhancement)
  const intermediateLabelMatch = normLabels.find(
    (n) =>
      n.includes("help wanted") ||
      n.includes("enhancement") ||
      n.includes("feature") ||
      n.includes("bug")
  );
  if (intermediateLabelMatch) {
    return {
      difficulty: "intermediate",
      reason: `Standard task with maintainer label '${intermediateLabelMatch}'.`,
    };
  }

  return {
    difficulty: "intermediate",
    reason: "Standard codebase task with moderate subsystem scope.",
  };
}

/**
 * Computes the deterministic Contribution Readiness Score (0-100).
 */
export function calculateReadinessScore(
  issue: {
    title: string;
    body?: string | null;
    labels: Array<{ name: string }>;
    comments: number;
    updated_at: string;
  },
  tree: GitTreeItemDto[] = [],
  keyDocs: KeyDocument[] = []
): ReadinessBreakdown {
  const signals: ReadinessSignalItem[] = [];
  const body = issue.body || "";
  const lowerBody = body.toLowerCase();
  const lowerTitle = issue.title.toLowerCase();

  // 1. Issue Clarity & Reproduction (Max 30 pts)
  let clarityScore = 0;
  const hasCodeBlock = body.includes("```");
  const hasStepsToReproduce =
    lowerBody.includes("steps to reproduce") ||
    lowerBody.includes("how to reproduce") ||
    lowerBody.includes("to reproduce") ||
    lowerBody.includes("reproduction:");
  const hasExpectedVsActual =
    (lowerBody.includes("expected") && lowerBody.includes("actual")) ||
    lowerBody.includes("behavior:");
  const hasStackOrUrl =
    lowerBody.includes("error:") ||
    lowerBody.includes("stack trace") ||
    body.includes("http://") ||
    body.includes("https://");

  if (hasStepsToReproduce) clarityScore += 12;
  if (hasExpectedVsActual) clarityScore += 10;
  if (hasCodeBlock) clarityScore += 5;
  if (hasStackOrUrl) clarityScore += 3;
  clarityScore = Math.min(30, clarityScore);

  signals.push({
    id: "clarity",
    label: "Reproduction & Clarity",
    score: clarityScore,
    maxScore: 30,
    passed: clarityScore >= 15,
    explanation:
      clarityScore >= 20
        ? "Detailed description with reproduction steps or expected behavior."
        : clarityScore >= 10
        ? "Basic issue description provided with code or error details."
        : "Missing structured reproduction steps or expected behavior details.",
  });

  // 2. Maintainer Triage & Labels (Max 25 pts)
  let triageScore = 0;
  const normLabels = issue.labels.map((l) => normalizeLabel(l.name));
  const hasGoodFirst = normLabels.some((n) => n.includes("good first") || n.includes("beginner"));
  const hasHelpWanted = normLabels.some((n) => n.includes("help wanted"));
  const hasTypeLabel = normLabels.some(
    (n) => n.includes("bug") || n.includes("feature") || n.includes("doc") || n.includes("enhancement")
  );
  const hasAreaLabel = normLabels.some((n) => n.includes("area:") || n.includes("pkg/") || n.includes("subsystem"));

  if (hasGoodFirst) triageScore += 15;
  else if (hasHelpWanted) triageScore += 10;
  if (hasTypeLabel) triageScore += 8;
  if (hasAreaLabel) triageScore += 7;
  triageScore = Math.min(25, triageScore);

  signals.push({
    id: "triage",
    label: "Maintainer Triage",
    score: triageScore,
    maxScore: 25,
    passed: triageScore >= 15,
    explanation:
      triageScore >= 20
        ? "Triaged with newcomer-friendly and categorized labels."
        : triageScore >= 10
        ? "Categorized with standard issue labels."
        : "Untriaged or lacking specific issue classification labels.",
  });

  // 3. Repository Localization (Max 25 pts)
  let localizationScore = 0;
  // Check if issue references actual files in tree
  const treePaths = new Set(tree.map((t) => t.path.toLowerCase()));
  const treeFileNames = new Set(tree.map((t) => (t.path.split("/").pop() || "").toLowerCase()));

  // Extract candidate tokens
  const words = `${lowerTitle} ${lowerBody}`.match(/[a-z0-9_\-./]+\.[a-z0-9]+/g) || [];
  let foundDirectFile = false;
  for (const word of words) {
    const clean = word.replace(/^[(`'"]+/, "").replace(/[)`'",.]+$/, "");
    if (treePaths.has(clean) || treeFileNames.has(clean)) {
      foundDirectFile = true;
      break;
    }
  }

  if (foundDirectFile) {
    localizationScore = 25;
  } else {
    // Check keyword overlap with directory names
    const dirWords = ["router", "api", "client", "server", "auth", "middleware", "test", "docs", "types"];
    const matchedDirs = dirWords.filter((w) => lowerTitle.includes(w) || lowerBody.includes(w));
    localizationScore = Math.min(18, matchedDirs.length * 6);
  }

  signals.push({
    id: "localization",
    label: "Codebase Localization",
    score: localizationScore,
    maxScore: 25,
    passed: localizationScore >= 15,
    explanation:
      localizationScore >= 20
        ? "Explicit files or symbols mentioned matching repository structure."
        : localizationScore >= 10
        ? "Subsystem keywords match known repository directories."
        : "No direct file paths or subsystem hints identified.",
  });

  // 4. Contribution Documentation (Max 10 pts)
  const hasContributing = keyDocs.some((d) => d.type === "contributing");
  const hasReadme = keyDocs.some((d) => d.type === "readme");
  const docScore = hasContributing ? 10 : hasReadme ? 6 : 0;

  signals.push({
    id: "docs",
    label: "Contribution Guides",
    score: docScore,
    maxScore: 10,
    passed: docScore >= 6,
    explanation: hasContributing
      ? "Repository includes CONTRIBUTING.md guidelines."
      : hasReadme
      ? "Repository includes a README file with setup instructions."
      : "No contributing or setup guides detected in repository.",
  });

  // 5. Discussion Activity & Freshness (Max 10 pts)
  let activityScore = 5;
  const updatedDate = new Date(issue.updated_at).getTime();
  const daysAgo = (Date.now() - updatedDate) / (1000 * 60 * 60 * 24);
  if (daysAgo < 30) activityScore += 5;
  else if (daysAgo < 180) activityScore += 3;

  signals.push({
    id: "activity",
    label: "Activity & Freshness",
    score: activityScore,
    maxScore: 10,
    passed: activityScore >= 6,
    explanation:
      daysAgo < 30
        ? "Active within the last 30 days."
        : daysAgo < 180
        ? "Updated within the last 6 months."
        : "Older issue with no recent activity.",
  });

  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
  const tier = totalScore >= 70 ? "high" : totalScore >= 45 ? "moderate" : "needs-clarification";

  const summary =
    tier === "high"
      ? "High contribution readiness. Clear issue description, observable codebase alignment, and verified guidelines."
      : tier === "moderate"
      ? "Moderate readiness. Actionable task, though some investigation into reproduction or files may be needed."
      : "Needs clarification. Requires additional reproduction details or maintainer feedback before coding.";

  return {
    totalScore,
    tier,
    signals,
    summary,
  };
}

const COMMON_STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "over", "after",
  "before", "about", "above", "under", "below", "between", "through", "during",
  "without", "again", "further", "then", "once", "here", "there", "when", "where",
  "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
  "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
  "too", "very", "can", "will", "just", "should", "now", "use", "using", "uses",
  "used", "add", "adding", "adds", "added", "fix", "fixes", "fixed", "fixing",
  "issue", "problem", "error", "bug", "support", "make", "makes", "making",
  "allow", "allows", "allowing", "allowed", "setting", "settings", "option", "options"
]);

/**
 * Deterministically ranks candidate files matching the issue.
 */
export function localizeFiles(
  issue: { title: string; body?: string | null },
  tree: GitTreeItemDto[] = [],
  intelligence?: RepoIntelligenceData
): LocalizedFileCandidate[] {
  const fullText = `${issue.title} ${issue.body || ""}`;
  const lowerText = fullText.toLowerCase();

  const candidates: LocalizedFileCandidate[] = [];
  const seenPaths = new Set<string>();

  // Extract explicit file path references (e.g. `src/utils.ts`, `lib/router/index.js`)
  const pathMatches = fullText.match(/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+/g) || [];
  const treeMap = new Map<string, GitTreeItemDto>();
  for (const item of tree) {
    if (item.type === "blob") {
      treeMap.set(item.path.toLowerCase(), item);
    }
  }

  // 1. High confidence: exact path match in tree
  for (const rawToken of pathMatches) {
    const clean = rawToken.replace(/^[(`'"]+/, "").replace(/[)`'",.]+$/, "");
    const lowerClean = clean.toLowerCase();

    // Check exact path match
    if (treeMap.has(lowerClean)) {
      const matched = treeMap.get(lowerClean)!;
      if (!seenPaths.has(matched.path)) {
        seenPaths.add(matched.path);
        candidates.push({
          path: matched.path,
          confidence: "high",
          reason: `Explicitly referenced in issue text (${clean}).`,
        });
      }
    } else {
      // Check file name match (e.g. `Router.js` matches `lib/router/index.js` or `test/Router.js`)
      const fileName = lowerClean.split("/").pop() || "";
      if (fileName.length > 3) {
        for (const [tPath, item] of treeMap.entries()) {
          const tFileName = tPath.split("/").pop() || "";
          if (tFileName === fileName && !seenPaths.has(item.path)) {
            seenPaths.add(item.path);
            candidates.push({
              path: item.path,
              confidence: "high",
              reason: `File name '${fileName}' explicitly mentioned in issue.`,
            });
            break;
          }
        }
      }
    }
  }

  // 2. Medium confidence: Subsystem & keyword matching
  const rawKeywords = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9_\-./]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const keywords = rawKeywords.filter((w) => !COMMON_STOP_WORDS.has(w));

  if (keywords.length > 0 && intelligence?.structure?.classifications) {
    for (const sub of intelligence.structure.classifications) {
      const subNameLower = sub.name.toLowerCase();
      if (keywords.some((kw) => subNameLower.includes(kw) || kw.includes(subNameLower))) {
        // Find top source files in this subsystem
        const subFiles = tree.filter(
          (t) =>
            t.type === "blob" &&
            !t.path.startsWith(".") &&
            t.path.toLowerCase().startsWith(sub.path.toLowerCase()) &&
            /\.(ts|tsx|js|jsx|rs|py|go|java|c|cpp|h|hpp|rb|php|swift|kt)$/i.test(t.path)
        );
        for (const file of subFiles.slice(0, 2)) {
          if (!seenPaths.has(file.path)) {
            seenPaths.add(file.path);
            candidates.push({
              path: file.path,
              confidence: "medium",
              reason: `Located inside relevant subsystem '${sub.name}' (${sub.role}).`,
              subsystemRole: sub.role,
            });
          }
        }
      }
    }
  }

  // Match files in tree by keywords (excluding hidden dotfiles)
  if (keywords.length > 0) {
    for (const item of tree) {
      if (item.type !== "blob") continue;
      if (item.path.startsWith(".")) continue;
      if (seenPaths.has(item.path)) continue;

      const lowerPath = item.path.toLowerCase();
      const matchCount = keywords.filter((kw) => lowerPath.includes(kw)).length;
      const isSourceFile = /\.(ts|tsx|js|jsx|rs|py|go|java|c|cpp|h|hpp|rb|php|swift|kt)$/i.test(lowerPath);
      const isCoreSubsystem =
        lowerPath.startsWith("src/") ||
        lowerPath.startsWith("lib/") ||
        lowerPath.startsWith("app/") ||
        lowerPath.startsWith("crates/") ||
        lowerPath.startsWith("packages/") ||
        lowerPath.startsWith("test/") ||
        lowerPath.startsWith("tests/");

      if (matchCount >= 2 || (matchCount >= 1 && isSourceFile && isCoreSubsystem)) {
        seenPaths.add(item.path);
        candidates.push({
          path: item.path,
          confidence: "medium",
          reason: `Matches keyword(s) in core code structure (${keywords.filter((kw) => lowerPath.includes(kw)).join(", ")}).`,
        });
      } else if (matchCount === 1 && candidates.length < 5) {
        seenPaths.add(item.path);
        candidates.push({
          path: item.path,
          confidence: "low",
          reason: `Matches keyword in path.`,
        });
      }

      if (candidates.length >= 6) break;
    }
  }

  return candidates;
}

/**
 * Extracts verified test commands strictly from repository manifests.
 */
export function extractVerifiedTestCommands(
  manifestFiles: Array<{ path: string; content: string }>
): VerifiedTestCommand[] {
  const verified: VerifiedTestCommand[] = [];

  for (const file of manifestFiles) {
    const fileName = file.path.split("/").pop()?.toLowerCase() || "";

    // Node / package.json
    if (fileName === "package.json") {
      try {
        const pkg = JSON.parse(file.content);
        if (pkg.scripts && typeof pkg.scripts === "object") {
          if (pkg.scripts.test) {
            verified.push({
              command: "npm test",
              source: "package.json scripts.test",
              description: `Runs test script: "${pkg.scripts.test}"`,
            });
          }
          if (pkg.scripts["test:unit"]) {
            verified.push({
              command: "npm run test:unit",
              source: "package.json scripts.test:unit",
              description: `Runs unit tests: "${pkg.scripts["test:unit"]}"`,
            });
          }
          if (pkg.scripts["test:ci"]) {
            verified.push({
              command: "npm run test:ci",
              source: "package.json scripts.test:ci",
              description: `Runs CI test suite: "${pkg.scripts["test:ci"]}"`,
            });
          }
        }
      } catch {
        // Ignore invalid JSON
      }
    }

    // Rust / Cargo.toml
    if (fileName === "cargo.toml") {
      verified.push({
        command: "cargo test",
        source: "Cargo.toml",
        description: "Executes standard Rust test runner.",
      });
    }

    // Python / pyproject.toml / pytest.ini
    if (fileName === "pyproject.toml" || fileName === "pytest.ini" || fileName === "setup.cfg") {
      verified.push({
        command: "pytest",
        source: fileName,
        description: "Executes Pytest suite.",
      });
    }

    // Go / go.mod
    if (fileName === "go.mod") {
      verified.push({
        command: "go test ./...",
        source: "go.mod",
        description: "Executes standard Go test suite.",
      });
    }

    // Makefile
    if (fileName === "makefile") {
      if (file.content.includes("test:")) {
        verified.push({
          command: "make test",
          source: "Makefile target",
          description: "Runs make test target.",
        });
      }
    }
  }

  return verified;
}

/**
 * Fetches open issues from GitHub API and enriches them with classification & readiness.
 */
export async function fetchRepoIssues(
  owner: string,
  repo: string,
  options: FetchGitHubOptions & {
    page?: number;
    perPage?: number;
    category?: IssueCategory;
    tree?: GitTreeItemDto[];
    keyDocs?: KeyDocument[];
  } = {}
): Promise<{
  issues: ContributorIssue[];
  totalOpenCount: number;
  rateLimit: RateLimitInfo;
}> {
  const page = options.page || 1;
  const perPage = Math.min(options.perPage || 30, 50);

  // Fetch up to 100 items from GitHub per page to ensure adequate pure issues after PR filtering
  const githubPerPage = Math.min(Math.max(perPage * 2, 50), 100);
  const params = new URLSearchParams({
    state: "open",
    per_page: String(githubPerPage),
    page: String(page),
    sort: "updated",
    direction: "desc",
  });

  const category = options.category;
  let rawIssues: GitHubIssueDto[] = [];
  let rateLimit: RateLimitInfo | undefined;

  if (category && category !== "all") {
    const candidateLabels = CATEGORY_GITHUB_LABELS[category] || [];
    let fetched = false;

    for (const labelCandidate of candidateLabels) {
      const queryParams = new URLSearchParams(params);
      queryParams.set("labels", labelCandidate);

      const res = await fetchGitHub<GitHubIssueDto[]>(
        `/repos/${owner}/${repo}/issues?${queryParams.toString()}`,
        options
      );
      rateLimit = res.rateLimit;

      const nonPrs = res.data.filter((item) => !item.pull_request);
      if (nonPrs.length > 0) {
        rawIssues = nonPrs;
        fetched = true;
        break;
      }
    }

    if (!fetched) {
      // Fallback: fetch general open issues without label filter
      const res = await fetchGitHub<GitHubIssueDto[]>(
        `/repos/${owner}/${repo}/issues?${params.toString()}`,
        options
      );
      rawIssues = res.data.filter((item) => !item.pull_request);
      rateLimit = res.rateLimit;
    }
  } else {
    const res = await fetchGitHub<GitHubIssueDto[]>(
      `/repos/${owner}/${repo}/issues?${params.toString()}`,
      options
    );
    rawIssues = res.data.filter((item) => !item.pull_request);
    rateLimit = res.rateLimit;
  }

  // Pure issues limited to requested perPage
  const pureIssues = rawIssues.slice(0, perPage);

  const normalizedIssues: ContributorIssue[] = pureIssues.map((dto) => {
    const rawLabels: Array<{ name: string; color: string; description: string | null }> = (
      dto.labels || []
    ).map((l) => (typeof l === "string" ? { name: l, color: "6b7280", description: null } : l));

    const categories = matchIssueCategories(rawLabels);
    const primaryCategory = inferCategory(rawLabels);
    const { difficulty, reason: difficultyReason } = inferDifficulty({
      title: dto.title,
      body: dto.body,
      labels: rawLabels,
    });

    const readiness = calculateReadinessScore(
      {
        title: dto.title,
        body: dto.body,
        labels: rawLabels,
        comments: dto.comments || 0,
        updated_at: dto.updated_at,
      },
      options.tree || [],
      options.keyDocs || []
    );

    return {
      id: dto.id,
      number: dto.number,
      title: dto.title,
      body: dto.body || "",
      htmlUrl: dto.html_url,
      state: dto.state,
      author: {
        login: dto.user?.login || "anonymous",
        avatarUrl: dto.user?.avatar_url || "https://github.com/ghost.png",
        url: dto.user?.html_url || "https://github.com",
      },
      labels: rawLabels,
      commentsCount: dto.comments || 0,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      difficulty,
      difficultyReason,
      category: primaryCategory,
      categories,
      readiness,
    };
  });

  // Filter by category if requested
  const filteredIssues =
    options.category && options.category !== "all"
      ? normalizedIssues.filter((i) => issueMatchesCategory(i, options.category!))
      : normalizedIssues;

  return {
    issues: filteredIssues,
    totalOpenCount: filteredIssues.length,
    rateLimit: rateLimit!,
  };
}
