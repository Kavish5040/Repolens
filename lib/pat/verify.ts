import type { RateLimitInfo } from "../github/types.ts";
import { extractRateLimitInfo } from "../github/client.ts";
import { getPatType, type PatType } from "./validation.ts";

export interface PatVerificationResult {
  valid: boolean;
  tokenType: PatType;
  code: "VALID" | "INVALID_PAT" | "FORBIDDEN" | "RATE_LIMITED" | "NETWORK_ERROR" | "API_ERROR";
  statusCode: number;
  message: string;
  rateLimit?: RateLimitInfo;
  scopes?: string[] | null;
  user?: {
    login: string;
    avatarUrl: string | null;
  } | null;
  expiresAt?: string | null;
  warning?: string;
  ssoUrl?: string;
}

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Validates a GitHub Personal Access Token against the GitHub API.
 * Uses `GET /rate_limit`, which:
 *   1. Costs 0 requests against the user's rate-limit quota.
 *   2. Does not require special user/admin scopes (works for both classic & fine-grained tokens).
 *   3. Returns 401 Unauthorized if the token is invalid, expired, or revoked.
 *   4. Returns rate limit and scope headers to confirm access level.
 *
 * Never prints, logs, or returns the raw token in output or errors.
 */
export async function verifyGitHubPat(token: string): Promise<PatVerificationResult> {
  const trimmed = token.trim();
  const tokenType = getPatType(trimmed);

  if (!trimmed) {
    return {
      valid: false,
      tokenType: "other",
      code: "INVALID_PAT",
      statusCode: 400,
      message: "Token cannot be empty.",
    };
  }

  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": "RepoLens-App",
    "X-GitHub-Api-Version": "2022-11-28",
    Authorization: `Bearer ${trimmed}`,
  });

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
      method: "GET",
      headers,
    });
  } catch (err) {
    return {
      valid: false,
      tokenType,
      code: "NETWORK_ERROR",
      statusCode: 500,
      message: `Network error connecting to GitHub API: ${err instanceof Error ? err.message : "fetch failed"}`,
    };
  }

  const rateLimit = extractRateLimitInfo(response.headers);

  if (response.status === 401) {
    return {
      valid: false,
      tokenType,
      code: "INVALID_PAT",
      statusCode: 401,
      message:
        "GitHub authentication failed (401 Unauthorized). The token is invalid, expired, or was revoked.",
    };
  }

  if (response.status === 403 || response.status === 429) {
    let errorBody: { message?: string } | null = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse failure
    }
    const message = errorBody?.message || response.statusText;

    if (rateLimit.remaining === 0 || message.toLowerCase().includes("rate limit")) {
      return {
        valid: true,
        tokenType,
        code: "RATE_LIMITED",
        statusCode: 403,
        message: "Token is authenticated, but your GitHub API rate limit has been exceeded.",
        rateLimit,
      };
    }

    let ssoUrl: string | undefined;
    const ssoHeader = response.headers.get("x-github-sso");
    if (ssoHeader) {
      const urlMatch = ssoHeader.match(/url=([^\s;]+)/i);
      if (urlMatch && urlMatch[1]) {
        try {
          const parsed = new URL(urlMatch[1]);
          if (parsed.protocol === "https:" && parsed.hostname.endsWith("github.com")) {
            ssoUrl = urlMatch[1];
          }
        } catch {
          // Ignore malformed URL
        }
      }
    }

    const forbiddenMsg = ssoUrl
      ? "Resource protected by organization SAML enforcement. You must authorize this personal access token for SAML SSO."
      : `GitHub API access forbidden (403): ${message}. The token may require SAML SSO authorization or lack basic access.`;

    return {
      valid: false,
      tokenType,
      code: "FORBIDDEN",
      statusCode: 403,
      message: forbiddenMsg,
      ssoUrl,
    };
  }

  if (!response.ok) {
    return {
      valid: false,
      tokenType,
      code: "API_ERROR",
      statusCode: response.status,
      message: `Unexpected GitHub API response (${response.status}): ${response.statusText}`,
    };
  }

  // 200 OK — Token is confirmed valid by GitHub
  const scopesHeader = response.headers.get("x-oauth-scopes");
  const scopes =
    scopesHeader !== null
      ? scopesHeader
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  const expiresAt = response.headers.get("github-authentication-token-expiration");

  let warning: string | undefined;
  if (tokenType === "classic" && scopes !== null) {
    const hasPublicRepo = scopes.includes("public_repo") || scopes.includes("repo");
    if (!hasPublicRepo) {
      warning =
        "This classic token does not have 'public_repo' or 'repo' scope. It may have limited access to public repositories.";
    }
  }

  // Optional: Attempt to fetch user identity for friendly UI display
  let user: { login: string; avatarUrl: string | null } | null = null;
  try {
    const userRes = await fetch(`${GITHUB_API_BASE}/user`, {
      method: "GET",
      headers,
    });
    if (userRes.ok) {
      const userData = (await userRes.json()) as { login?: string; avatar_url?: string };
      if (userData?.login) {
        user = {
          login: userData.login,
          avatarUrl: userData.avatar_url || null,
        };
      }
    }
    // If 403, this is normal for repository-scoped fine-grained tokens that lack user permissions
  } catch {
    // Non-fatal
  }

  return {
    valid: true,
    tokenType,
    code: "VALID",
    statusCode: 200,
    message: "GitHub token confirmed valid.",
    rateLimit,
    scopes,
    user,
    expiresAt: expiresAt || null,
    warning,
  };
}

