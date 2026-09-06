import type { RateLimitInfo } from "../github/types.ts";

export type IssueDifficulty = "beginner" | "intermediate" | "advanced";

export type IssueCategory =
  | "all"
  | "good-first-issue"
  | "help-wanted"
  | "bug"
  | "feature"
  | "documentation";

export interface GitHubLabelDto {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubIssueUserDto {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubIssueDto {
  id: number;
  number: number;
  title: string;
  user: GitHubIssueUserDto | null;
  labels: (GitHubLabelDto | string)[];
  state: "open" | "closed";
  locked: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body: string | null;
  html_url: string;
  pull_request?: Record<string, unknown>;
}

export interface ReadinessSignalItem {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  passed: boolean;
  explanation: string;
}

export interface ReadinessBreakdown {
  totalScore: number;
  tier: "high" | "moderate" | "needs-clarification";
  signals: ReadinessSignalItem[];
  summary: string;
}

export interface LocalizedFileCandidate {
  path: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  subsystemRole?: string;
}

export interface VerifiedTestCommand {
  command: string;
  source: string;
  description: string;
}

export interface ContributorIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  htmlUrl: string;
  state: "open" | "closed";
  author: {
    login: string;
    avatarUrl: string;
    url: string;
  };
  labels: Array<{
    name: string;
    color: string;
    description: string | null;
  }>;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  difficulty: IssueDifficulty;
  difficultyReason: string;
  category: IssueCategory;
  categories: IssueCategory[];
  readiness: ReadinessBreakdown;
}

export interface RepoIssuesResult {
  issues: ContributorIssue[];
  totalOpenCount: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  rateLimit: RateLimitInfo;
}
