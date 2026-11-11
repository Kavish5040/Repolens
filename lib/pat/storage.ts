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

import {
  validatePatFormat,
  getPatType,
  maskPat,
  type PatType,
  type PatValidationResult,
  PAT_DOCUMENTATION,
} from "./validation.ts";

export {
  validatePatFormat,
  getPatType,
  maskPat,
  type PatType,
  type PatValidationResult,
  PAT_DOCUMENTATION,
};

export const PAT_STORAGE_KEY = "rl_github_pat";

export interface StorageOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Checks whether browser localStorage is accessible and writable.
 * Safely returns false if cookies/storage are disabled or in a locked-down mode.
 */
export function isStorageAvailable(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const testKey = "__rl_test_storage__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves a GitHub PAT to localStorage.
 * Trims whitespace before saving. Does not log the token.
 * Protected against browser SecurityError or QuotaExceededError in restricted modes.
 */
export function savePat(token: string): StorageOperationResult {
  if (typeof localStorage === "undefined") {
    return {
      success: false,
      error: "Browser localStorage is not available in this environment.",
    };
  }
  const trimmed = token.trim();
  if (!trimmed) {
    return {
      success: false,
      error: "Token cannot be empty.",
    };
  }
  try {
    localStorage.setItem(PAT_STORAGE_KEY, trimmed);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        "Unable to save token to browser storage (localStorage may be disabled, blocked in private browsing, or quota exceeded).",
    };
  }
}

/**
 * Loads the stored GitHub PAT from localStorage.
 * Returns null if no PAT has been saved or if localStorage is unavailable.
 */
export function loadPat(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(PAT_STORAGE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Clears the stored GitHub PAT from localStorage.
 */
export function clearPat(): StorageOperationResult {
  if (typeof localStorage === "undefined") {
    return {
      success: false,
      error: "Browser localStorage is not available in this environment.",
    };
  }
  try {
    localStorage.removeItem(PAT_STORAGE_KEY);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: "Unable to clear token from browser storage.",
    };
  }
}
