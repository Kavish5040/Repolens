/**
 * GitHub Personal Access Token — browser localStorage utility.
 *
 * Security model:
 * - Token is stored ONLY in the browser's localStorage under a namespaced key.
 * - The token is NEVER sent to the AI service (OmniRoute).
 * - The token is NEVER logged, printed, or reflected in error messages.
 * - It is forwarded as the `x-github-token` HTTP header exclusively to
 *   server-side GitHub proxy routes (`/api/repo/*`), where it takes
 *   precedence over the server's `GITHUB_TOKEN` env variable.
 * - This file is safe to import in client components only.
 *   Do NOT import in server-side code or API routes.
 */

const PAT_STORAGE_KEY = "rl_github_pat";

/** Known GitHub PAT prefixes (as of 2022+ fine-grained and classic tokens). */
const KNOWN_PREFIXES = ["ghp_", "github_pat_", "gho_", "ghu_", "ghs_", "ghr_"];

/** Minimum sensible token length (prefix + entropy). */
const MIN_TOKEN_LENGTH = 20;

export interface PatValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates the format of a GitHub PAT without making any network request.
 * Returns { valid: true } when the format looks plausible.
 * Returns { valid: false, reason } when the format is clearly wrong.
 */
export function validatePatFormat(token: string): PatValidationResult {
  const trimmed = token.trim();

  if (!trimmed) {
    return { valid: false, reason: "Token cannot be empty." };
  }

  if (trimmed.length < MIN_TOKEN_LENGTH) {
    return {
      valid: false,
      reason: `Token is too short (minimum ${MIN_TOKEN_LENGTH} characters).`,
    };
  }

  const hasKnownPrefix = KNOWN_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix)
  );
  if (!hasKnownPrefix) {
    return {
      valid: false,
      reason:
        "Token does not look like a GitHub PAT. It should start with ghp_, github_pat_, or similar.",
    };
  }

  // Reject tokens with whitespace characters embedded inside
  if (/\s/.test(trimmed)) {
    return { valid: false, reason: "Token must not contain whitespace." };
  }

  return { valid: true };
}

/**
 * Saves a GitHub PAT to localStorage.
 * Trims whitespace before saving. Does not log the token.
 *
 * Only call this after validatePatFormat() returns { valid: true }.
 */
export function savePat(token: string): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = token.trim();
  if (!trimmed) return;
  localStorage.setItem(PAT_STORAGE_KEY, trimmed);
}

/**
 * Loads the stored GitHub PAT from localStorage.
 * Returns null if no PAT has been saved or if localStorage is unavailable.
 */
export function loadPat(): string | null {
  if (typeof localStorage === "undefined") return null;
  const value = localStorage.getItem(PAT_STORAGE_KEY);
  return value && value.trim() ? value.trim() : null;
}

/**
 * Clears the stored GitHub PAT from localStorage.
 */
export function clearPat(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(PAT_STORAGE_KEY);
}

/**
 * Returns a masked display string for the token suitable for UI display.
 * E.g. "ghp_****...AbCd"
 * Never returns the full token.
 */
export function maskPat(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "****";
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}****...${suffix}`;
}
