/**
 * GitHub Personal Access Token (PAT) format validation and metadata utilities.
 *
 * Supports both GitHub Classic Personal Access Tokens (ghp_...)
 * and Fine-grained Personal Access Tokens (github_pat_...).
 *
 * Pure utilities with no DOM or localStorage dependencies — safe to use
 * in both client and server environments.
 */

export type PatType = "classic" | "fine-grained" | "other";

export interface PatValidationResult {
  valid: boolean;
  type?: PatType;
  reason?: string;
}

/** Minimum sensible token length (prefix + entropy). */
export const MIN_TOKEN_LENGTH = 20;

/** Expected character regex for GitHub tokens (alphanumeric and underscores). */
const VALID_TOKEN_CHARS = /^[a-zA-Z0-9_]+$/;

/** Regex matching legacy 40-hex personal access tokens (pre-2021 unprefixed tokens). */
const LEGACY_HEX_TOKEN_REGEX = /^[0-9a-fA-F]{40}$/;

/**
 * Returns the classification of a GitHub PAT based on its prefix or format.
 */
export function getPatType(token: string): PatType {
  const trimmed = token.trim();
  if (trimmed.startsWith("ghp_") || LEGACY_HEX_TOKEN_REGEX.test(trimmed)) {
    return "classic";
  }
  if (trimmed.startsWith("github_pat_")) {
    return "fine-grained";
  }
  return "other";
}

/**
 * Validates the format of a GitHub Personal Access Token.
 * Accepts Classic tokens (ghp_... or legacy 40-hex) and Fine-grained tokens (github_pat_...).
 *
 * Uses safe minimum boundary checks and avoids rigid upper limits so that
 * future GitHub token variations or enterprise tokens are not prematurely rejected.
 * Full credential validation is delegated to the GitHub API.
 */
export function validatePatFormat(token: string): PatValidationResult {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Token cannot be empty." };
  }

  const trimmed = token.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: "Token cannot be empty." };
  }

  // Reject embedded whitespace
  if (/\s/.test(trimmed)) {
    return { valid: false, reason: "Token must not contain whitespace." };
  }

  if (trimmed.length < MIN_TOKEN_LENGTH) {
    return {
      valid: false,
      reason: `Token is too short (minimum ${MIN_TOKEN_LENGTH} characters).`,
    };
  }

  if (!VALID_TOKEN_CHARS.test(trimmed)) {
    return {
      valid: false,
      reason: "Token contains invalid characters. GitHub tokens only contain alphanumeric characters and underscores.",
    };
  }

  // Check for legacy 40-hex token
  if (LEGACY_HEX_TOKEN_REGEX.test(trimmed)) {
    return { valid: true, type: "classic" };
  }

  const tokenType = getPatType(trimmed);

  if (tokenType === "classic") {
    // Classic tokens (ghp_...) require at least 35 characters
    if (trimmed.length < 35) {
      return {
        valid: false,
        reason: `Classic PAT format appears invalid (expected at least 35 characters starting with ghp_, got ${trimmed.length}).`,
      };
    }
    return { valid: true, type: "classic" };
  }

  if (tokenType === "fine-grained") {
    // Fine-grained tokens (github_pat_...) require at least 70 characters
    if (trimmed.length < 70) {
      return {
        valid: false,
        reason: `Fine-grained PAT format appears invalid (expected at least 70 characters starting with github_pat_, got ${trimmed.length}).`,
      };
    }
    return { valid: true, type: "fine-grained" };
  }

  // Check other known GitHub token prefixes: gho_ (oauth), ghu_ (user-to-server), ghs_ (server-to-server), ghr_ (refresh)
  const isOtherKnownPrefix = ["gho_", "ghu_", "ghs_", "ghr_"].some((p) =>
    trimmed.startsWith(p)
  );

  if (isOtherKnownPrefix) {
    return { valid: true, type: "other" };
  }

  return {
    valid: false,
    reason:
      "Token does not match a recognized GitHub PAT format. It should start with 'ghp_' (Classic) or 'github_pat_' (Fine-grained).",
  };
}

/**
 * Returns a masked display string for the token suitable for UI display.
 * Never exposes the full secret token.
 *
 * Examples:
 *   "ghp_1234567890abcdef" -> "ghp_****...cdef"
 *   "github_pat_11AB...XYZ" -> "github_pat_****...XYZ"
 */
export function maskPat(token: string): string {
  if (!token || typeof token !== "string") return "****";
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "****";

  const suffix = trimmed.slice(-4);

  if (trimmed.startsWith("github_pat_")) {
    return `github_pat_****...${suffix}`;
  }

  if (trimmed.startsWith("ghp_")) {
    return `ghp_****...${suffix}`;
  }

  const prefix = trimmed.slice(0, 4);
  return `${prefix}****...${suffix}`;
}

/**
 * Guidelines and required scopes/permissions for documentation and UI tooltips.
 */
export const PAT_DOCUMENTATION = {
  classic: {
    name: "GitHub Classic Personal Access Token",
    prefix: "ghp_",
    length: "40 characters",
    requiredScope: "public_repo",
    description: "Read-only access to public repositories.",
    createUrl: "https://github.com/settings/tokens/new?scopes=public_repo&description=RepoLens",
  },
  fineGrained: {
    name: "GitHub Fine-Grained Personal Access Token",
    prefix: "github_pat_",
    length: "93 characters",
    repositoryAccess: "Public Repositories (read-only) or Selected repositories",
    permissions: [
      { name: "Contents", level: "Read-only", required: true, note: "Required to read code, directory trees, and commit info." },
      { name: "Metadata", level: "Read-only", required: true, note: "Required to inspect repository metadata (GitHub includes this automatically)." },
      { name: "Issues", level: "Read-only", required: false, note: "Optional — only needed for Contributor Mode / issues analysis." },
    ],
    userPermissions: "None (do not grant user permissions)",
    createUrl: "https://github.com/settings/personal-access-tokens/new",
  },
} as const;

