/**
 * GitHub API Data Transfer Objects (DTOs) & Internal Domain Models
 *
 * Architectural Note:
 * We decouple raw GitHub API schemas (DTOs) from our application's domain models (RepoOverview).
 * This protects the application from upstream API shape changes and allows us to compute
 * clean, presentation-ready metrics (such as language percentages and normalized timestamps).
 */

// ==========================================
// 1. Raw GitHub API DTOs (Data Transfer Objects)
// ==========================================

export interface GitHubOwnerDto {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GitHubLicenseDto {
  key: string;
  name: string;
  spdx_id: string;
  url: string | null;
}

export interface GitHubRepoDto {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwnerDto;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  license: GitHubLicenseDto | null;
  subscribers_count?: number;
}

/**
 * Raw language breakdown from GitHub API:
 * Record of Language Name -> Byte Count (e.g. { "TypeScript": 154200, "CSS": 3400 })
 */
export type GitHubLanguagesDto = Record<string, number>;

export interface GitHubCommitAuthorDto {
  name: string;
  email: string;
  date: string;
}

export interface GitHubCommitDto {
  sha: string;
  html_url: string;
  commit: {
    author: GitHubCommitAuthorDto;
    committer: GitHubCommitAuthorDto;
    message: string;
  };
  author: GitHubOwnerDto | null;
}

// ==========================================
// 2. Application Domain Models
// ==========================================

export interface LanguageBreakdown {
  name: string;
  bytes: number;
  percentage: number;
  color?: string;
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorAvatarUrl: string | null;
  date: string;
  url: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  used: number;
}

export interface RepoOverview {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
    url: string;
    type: string;
  };
  description: string | null;
  url: string;
  homepage: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  topics: string[];
  license: {
    name: string;
    spdxId: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  primaryLanguage: string | null;
  languages: LanguageBreakdown[];
  latestCommit: CommitInfo | null;
  rateLimit: RateLimitInfo;
}

// ==========================================
// 3. API Response Envelope
// ==========================================

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    resetAt?: string;
    limit?: number;
    remaining?: number;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
