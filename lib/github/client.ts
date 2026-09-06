import type {
  GitHubRepoDto,
  GitHubLanguagesDto,
  GitHubCommitDto,
  GitTreeDto,
  GitHubContentDto,
  RepoOverview,
  LanguageBreakdown,
  CommitInfo,
  RateLimitInfo,
  FileContentData,
} from "./types.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
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

// Common binary file extensions to prevent text decoding crashes
const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "ico", "webp", "bmp", "tiff", "svgz",
  "zip", "tar", "gz", "tgz", "bz2", "xz", "7z", "rar",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "exe", "dll", "so", "dylib", "bin", "wasm", "node", "pyc", "class", "o", "a",
  "woff", "woff2", "ttf", "eot", "otf",
  "mp3", "mp4", "wav", "ogg", "flac", "webm", "avi", "mov",
  "lockb", "db", "sqlite", "sqlite3"
]);

/**
 * Maps a file path or extension to a human-readable language identifier.
 */
export function getFileLanguage(filePath: string): { language: string; isMarkdown: boolean; isBinary: boolean } {
  const fileName = filePath.split("/").pop() || filePath;
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "";

  if (BINARY_EXTENSIONS.has(ext)) {
    return { language: "Binary", isMarkdown: false, isBinary: true };
  }

  if (ext === "md" || ext === "markdown" || ext === "mdx" || fileName.toLowerCase() === "readme" || fileName.toLowerCase() === "contributing") {
    return { language: "Markdown", isMarkdown: true, isBinary: false };
  }

  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript (React)",
    js: "JavaScript",
    jsx: "JavaScript (React)",
    mjs: "JavaScript",
    cjs: "JavaScript",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    py: "Python",
    rs: "Rust",
    go: "Go",
    java: "Java",
    c: "C",
    h: "C Header",
    cpp: "C++",
    hpp: "C++ Header",
    cc: "C++",
    cs: "C#",
    rb: "Ruby",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    kts: "Kotlin",
    html: "HTML",
    htm: "HTML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    less: "Less",
    vue: "Vue",
    svelte: "Svelte",
    sh: "Shell",
    bash: "Shell",
    zsh: "Shell",
    sql: "SQL",
    graphql: "GraphQL",
    gql: "GraphQL",
    dockerfile: "Dockerfile",
    env: "Config",
    gitignore: "Git Config",
    txt: "Plain Text",
  };

  if (fileName.toLowerCase() === "dockerfile") {
    return { language: "Dockerfile", isMarkdown: false, isBinary: false };
  }

  const language = map[ext] || (ext ? ext.toUpperCase() : "Plain Text");
  return { language, isMarkdown: false, isBinary: false };
}

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

    if (response.status === 401) {
      throw new GitHubAuthError();
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
 * Fetches full recursive Git tree metadata for a repository.
 */
export async function fetchGitTree(
  owner: string,
  repo: string,
  treeSha: string = "HEAD",
  options?: FetchGitHubOptions
): Promise<{ tree: GitTreeDto; rateLimit: RateLimitInfo }> {
  const { data: tree, rateLimit } = await fetchGitHub<GitTreeDto>(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`,
    options
  );

  return { tree, rateLimit };
}

/**
 * Fetches and decodes file content safely with size guardrails and binary detection.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  options: FetchGitHubOptions & { branch?: string } = {}
): Promise<{ file: FileContentData; rateLimit: RateLimitInfo }> {
  const cleanPath = path.replace(/^\/+/, "");
  const branchQuery = options.branch ? `?ref=${encodeURIComponent(options.branch)}` : "";

  const { data: contentDto, rateLimit } = await fetchGitHub<GitHubContentDto>(
    `/repos/${owner}/${repo}/contents/${cleanPath.split("/").map(encodeURIComponent).join("/")}${branchQuery}`,
    options
  );

  const fileName = contentDto.name || cleanPath.split("/").pop() || cleanPath;
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
  const { language, isMarkdown, isBinary } = getFileLanguage(cleanPath);

  // Maximum allowed size for in-app text rendering (1.5 MB)
  const MAX_FILE_SIZE = 1.5 * 1024 * 1024;
  const isTruncated = contentDto.size > MAX_FILE_SIZE;

  let decodedContent = "";

  if (isBinary) {
    decodedContent = `[Binary file: ${contentDto.size} bytes. Binary previews are not supported in text viewer.]`;
  } else if (isTruncated) {
    decodedContent = `[File size exceeds 1.5 MB limit (${contentDto.size} bytes). Direct viewing is disabled to protect client performance.]`;
  } else if (contentDto.content && contentDto.encoding === "base64") {
    // Remove newlines and decode base64
    const cleanBase64 = contentDto.content.replace(/\s/g, "");
    try {
      decodedContent = Buffer.from(cleanBase64, "base64").toString("utf-8");
    } catch {
      decodedContent = "[Error decoding file content as UTF-8.]";
    }
  } else if (contentDto.download_url) {
    // For files >1MB without embedded base64, fetch raw
    try {
      const rawRes = await fetch(contentDto.download_url);
      if (rawRes.ok) {
        decodedContent = await rawRes.text();
      } else {
        decodedContent = `[Failed to download file content: ${rawRes.statusText}]`;
      }
    } catch {
      decodedContent = "[Error downloading raw file content.]";
    }
  }

  const file: FileContentData = {
    path: cleanPath,
    name: fileName,
    content: decodedContent,
    size: contentDto.size,
    extension,
    language,
    isMarkdown,
    isBinary,
    isTruncated,
    url: contentDto.html_url,
  };

  return { file, rateLimit };
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
