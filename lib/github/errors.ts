/**
 * Custom Error Hierarchy for GitHub Operations
 *
 * Architectural Note:
 * Using custom error classes allows caller functions to use `instanceof` checks
 * or error codes to differentiate between:
 *   - 401 INVALID_PAT  — bad/expired GitHub credentials (user PAT or server token)
 *   - 403 FORBIDDEN    — token lacks required permissions (Contents, Metadata) or repo access
 *   - 403 RATE_LIMITED — GitHub API quota exceeded
 *   - 404 NOT_FOUND    — repository not found or private/inaccessible
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
 * Thrown when a GitHub repository is not found or is private/inaccessible (HTTP 404).
 * Acknowledges that GitHub returns 404 both when a repository does not exist
 * and when it is private/inaccessible to the current token.
 */
export class GitHubNotFoundError extends GitHubError {
  constructor(owner: string, repo: string) {
    super(
      `Repository "${owner}/${repo}" was not found. If this repository exists, it may be private or your token may lack access to it.`,
      "NOT_FOUND",
      404
    );
    this.name = "GitHubNotFoundError";
  }
}

/**
 * Thrown when the GitHub API rate limit is exceeded (HTTP 403 or 429).
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
 * is invalid, expired, revoked, or malformed.
 *
 * The error message intentionally does NOT echo the token value.
 */
export class GitHubAuthError extends GitHubError {
  constructor(
    message: string = "GitHub API authentication failed (401 Unauthorized). Your token may be invalid, revoked, or expired. Please verify, clear, or replace your token."
  ) {
    super(message, "INVALID_PAT", 401);
    this.name = "GitHubAuthError";
  }
}

/**
 * Thrown when GitHub returns 403 Forbidden for permission or access boundary reasons
 * (not due to rate limiting).
 *
 * Examples:
 * - Fine-grained PAT is scoped to "Only select repositories" and lacks this repository.
 * - Fine-grained PAT lacks the "Contents: Read-only" permission.
 * - Organization enforces SAML SSO authorization or approval for fine-grained PATs.
 * - Token lacks access to organization-owned private assets.
 */
export class GitHubForbiddenError extends GitHubError {
  public readonly details?: unknown;
  public readonly ssoUrl?: string;

  constructor(
    message: string = "GitHub API access forbidden (403 Forbidden). Your token may lack the required permissions (e.g. 'Contents: Read-only') or repository access, or require SAML SSO authorization.",
    details?: unknown,
    ssoUrl?: string
  ) {
    super(message, "FORBIDDEN", 403);
    this.name = "GitHubForbiddenError";
    this.details = details;
    this.ssoUrl = ssoUrl;
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
