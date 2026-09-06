/**
 * Custom Error Hierarchy for GitHub Operations
 *
 * Architectural Note:
 * Using custom error classes allows caller functions to use `instanceof` checks
 * or error codes to differentiate between:
 *   - 401 INVALID_PAT  — bad/expired GitHub credentials (user PAT or server token)
 *   - 404 NOT_FOUND    — repository not found or private
 *   - 403 RATE_LIMITED — GitHub API quota exceeded
 *   - 400 INVALID_URL  — malformed repository URL from user input
 *   - 5xx API_ERROR    — unexpected GitHub API or network failure
 */

export class GitHubError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = "GITHUB_ERROR", statusCode: number = 500) {
    super(message);
    this.name = "GitHubError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a GitHub repository is not found or is private (HTTP 404).
 */
export class GitHubNotFoundError extends GitHubError {
  constructor(owner: string, repo: string) {
    super(
      `Repository "${owner}/${repo}" was not found or is private.`,
      "NOT_FOUND",
      404
    );
    this.name = "GitHubNotFoundError";
  }
}

/**
 * Thrown when the GitHub API rate limit is exceeded (HTTP 403).
 * Contains telemetry on when the quota resets.
 */
export class GitHubRateLimitError extends GitHubError {
  public readonly resetAt: Date;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(resetAt: Date, limit: number, remaining: number = 0) {
    const formattedReset = resetAt.toLocaleTimeString();
    super(
      `GitHub API rate limit exceeded (${remaining}/${limit} requests remaining). Quota resets at ${formattedReset}.`,
      "RATE_LIMITED",
      403
    );
    this.name = "GitHubRateLimitError";
    this.resetAt = resetAt;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Thrown when GitHub returns 401 Unauthorized — the supplied PAT or server token
 * is invalid, expired, or lacks the required scope.
 *
 * The error message intentionally does NOT echo the token value.
 */
export class GitHubAuthError extends GitHubError {
  constructor() {
    super(
      "GitHub API authentication failed. Your personal access token may be invalid or expired. Please clear it and enter a new one.",
      "INVALID_PAT",
      401
    );
    this.name = "GitHubAuthError";
  }
}

/**
 * Thrown when the user supplies a malformed or non-GitHub repository string (HTTP 400).
 */
export class InvalidRepoUrlError extends GitHubError {
  constructor(message: string = "Invalid GitHub repository URL or format.") {
    super(message, "INVALID_URL", 400);
    this.name = "InvalidRepoUrlError";
  }
}

/**
 * Thrown on general GitHub API failures (5xx, unexpected responses).
 */
export class GitHubApiError extends GitHubError {
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message, "API_ERROR", statusCode);
    this.name = "GitHubApiError";
    this.details = details;
  }
}
