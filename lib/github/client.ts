import type {
  GitHubRepoDto,
  GitHubLanguagesDto,
  GitHubCommitDto,
  RepoOverview,
  LanguageBreakdown,
  CommitInfo,
  RateLimitInfo,
} from "./types.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubApiError,
} from "./errors.ts";
import { parseGitHubUrl } from "./parser.ts";

const GITHUB_API_BASE = "https://api.github.com";

// Curated colors for primary GitHub languages
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Lua: "#000080",
};

/**
 * Extracts GitHub rate limit telemetry from response headers.
 */
export function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  const limit = parseInt(headers.get("x-ratelimit-limit") || "60", 10);
  const remaining = parseInt(headers.get("x-ratelimit-remaining") || "0", 10);
  const resetEpoch = parseInt(
    headers.get("x-ratelimit-reset") || String(Math.floor(Date.now() / 1000) + 3600),
    10
  );
  const used = parseInt(headers.get("x-ratelimit-used") || String(limit - remaining), 10);

  return {
    limit,
    remaining,
    resetAt: new Date(resetEpoch * 1000),
    used,
  };
}

export interface FetchGitHubOptions {
  clientPat?: string;
  revalidateSeconds?: number;
}

/**
 * Low-level GitHub API fetch wrapper with rate-limit and error parsing.
 */
export async function fetchGitHub<T>(
  path: string,
  options: FetchGitHubOptions = {}
): Promise<{ data: T; rateLimit: RateLimitInfo }> {
  const url = path.startsWith("http") ? path : `${GITHUB_API_BASE}${path}`;

  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": "RepoLens-App",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  // Attach token: client PAT takes precedence, fallback to server env GITHUB_TOKEN
  const token = options.clientPat || process.env.GITHUB_TOKEN;
  if (token) {
    headers.set("Authorization", `Bearer ${token.trim()}`);
  }

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    method: "GET",
    headers,
  };

  if (typeof options.revalidateSeconds === "number") {
    fetchOptions.next = { revalidate: options.revalidateSeconds };
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    throw new GitHubApiError(
      `Network error connecting to GitHub API: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
      error
    );
  }

  const rateLimit = extractRateLimitInfo(response.headers);

  if (!response.ok) {
    let errorBody: { message?: string } | null = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse failure on raw error responses
    }

    const message = errorBody?.message || response.statusText;

    if (response.status === 404) {
      const match = path.match(/\/repos\/([^/]+)\/([^/]+)/);
      const owner = match ? match[1] : "unknown";
      const repo = match ? match[2] : "unknown";
      throw new GitHubNotFoundError(owner, repo);
    }

    if (response.status === 403 || response.status === 429) {
      if (rateLimit.remaining === 0 || message.toLowerCase().includes("rate limit")) {
        throw new GitHubRateLimitError(rateLimit.resetAt, rateLimit.limit, rateLimit.remaining);
      }
    }

    throw new GitHubApiError(
      `GitHub API error (${response.status}): ${message}`,
      response.status,
      errorBody
    );
  }

  const data = (await response.json()) as T;
  return { data, rateLimit };
}

/**
 * Fetches repository metadata from GitHub.
 */
export async function fetchRepoMetadata(
  owner: string,
  repo: string,
  options?: FetchGitHubOptions
): Promise<{ data: GitHubRepoDto; rateLimit: RateLimitInfo }> {
  return fetchGitHub<GitHubRepoDto>(`/repos/${owner}/${repo}`, options);
}

/**
 * Fetches language breakdown and calculates percentages.
 */
export async function fetchRepoLanguages(
  owner: string,
  repo: string,
  options?: FetchGitHubOptions
): Promise<{ languages: LanguageBreakdown[]; rateLimit: RateLimitInfo }> {
  const { data: rawLanguages, rateLimit } = await fetchGitHub<GitHubLanguagesDto>(
    `/repos/${owner}/${repo}/languages`,
    options
  );

  const totalBytes = Object.values(rawLanguages).reduce((sum, bytes) => sum + bytes, 0);

  const languages: LanguageBreakdown[] = Object.entries(rawLanguages)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? parseFloat(((bytes / totalBytes) * 100).toFixed(1)) : 0,
      color: LANGUAGE_COLORS[name] || "#6b7280",
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return { languages, rateLimit };
}

/**
 * Fetches latest commit information.
 */
export async function fetchLatestCommit(
  owner: string,
  repo: string,
  options?: FetchGitHubOptions
): Promise<{ commit: CommitInfo | null; rateLimit: RateLimitInfo }> {
  try {
    const { data: commits, rateLimit } = await fetchGitHub<GitHubCommitDto[]>(
      `/repos/${owner}/${repo}/commits?per_page=1`,
      options
    );

    if (!commits || commits.length === 0) {
      return { commit: null, rateLimit };
    }

    const first = commits[0];
    const commit: CommitInfo = {
      sha: first.sha,
      shortSha: first.sha.slice(0, 7),
      message: first.commit.message.split("\n")[0], // First line of commit message
      authorName: first.commit.author.name,
      authorAvatarUrl: first.author?.avatar_url || null,
      date: first.commit.author.date,
      url: first.html_url,
    };

    return { commit, rateLimit };
  } catch (error) {
    // If commits are unavailable (e.g. empty repo), gracefully return null without breaking the whole overview
    if (error instanceof GitHubNotFoundError) {
      return {
        commit: null,
        rateLimit: { limit: 60, remaining: 60, resetAt: new Date(), used: 0 },
      };
    }
    throw error;
  }
}

/**
 * High-level service function that parses a repository target and fetches
 * its overview data concurrently.
 *
 * @param input Full GitHub URL or "owner/repo" string
 * @param options Optional client PAT or caching options
 */
export async function getRepoOverview(
  input: string,
  options: FetchGitHubOptions = { revalidateSeconds: 60 }
): Promise<RepoOverview> {
  const { owner, repo } = parseGitHubUrl(input);

  // Concurrently fetch metadata, languages, and latest commit
  const [metaResult, langResult, commitResult] = await Promise.all([
    fetchRepoMetadata(owner, repo, options),
    fetchRepoLanguages(owner, repo, options),
    fetchLatestCommit(owner, repo, options),
  ]);

  const rawMeta = metaResult.data;

  // Use the most up-to-date rate limit snapshot
  const rateLimit = metaResult.rateLimit;

  return {
    id: rawMeta.id,
    name: rawMeta.name,
    fullName: rawMeta.full_name,
    owner: {
      login: rawMeta.owner.login,
      avatarUrl: rawMeta.owner.avatar_url,
      url: rawMeta.owner.html_url,
      type: rawMeta.owner.type,
    },
    description: rawMeta.description,
    url: rawMeta.html_url,
    homepage: rawMeta.homepage,
    defaultBranch: rawMeta.default_branch,
    stars: rawMeta.stargazers_count,
    forks: rawMeta.forks_count,
    watchers: rawMeta.watchers_count,
    openIssues: rawMeta.open_issues_count,
    topics: rawMeta.topics || [],
    license: rawMeta.license
      ? {
          name: rawMeta.license.name,
          spdxId: rawMeta.license.spdx_id,
        }
      : null,
    createdAt: rawMeta.created_at,
    updatedAt: rawMeta.updated_at,
    pushedAt: rawMeta.pushed_at,
    primaryLanguage: rawMeta.language,
    languages: langResult.languages,
    latestCommit: commitResult.commit,
    rateLimit,
  };
}
