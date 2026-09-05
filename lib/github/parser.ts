import { InvalidRepoUrlError } from "./errors.ts";

export interface ParsedRepoTarget {
  owner: string;
  repo: string;
}

/**
 * Validates and normalizes any GitHub repository reference into { owner, repo }.
 *
 * Supported formats:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 * - "http://github.com/owner/repo/"
 * - "github.com/owner/repo"
 * - "https://github.com/owner/repo.git"
 * - "https://github.com/owner/repo/tree/main/src"
 * - "https://github.com/owner/repo?tab=readme#license"
 * - "git@github.com:owner/repo.git"
 *
 * @param input Raw user string
 * @returns ParsedRepoTarget containing normalized owner and repo names
 * @throws InvalidRepoUrlError if input is malformed or not a valid GitHub repository
 */
export function parseGitHubUrl(input: string): ParsedRepoTarget {
  if (!input || typeof input !== "string") {
    throw new InvalidRepoUrlError("Repository URL or name is required.");
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new InvalidRepoUrlError("Repository URL cannot be empty.");
  }

  // 1. Remove hash fragment and query parameters
  const withoutQueryOrHash = trimmed.split("#")[0].split("?")[0].trim();

  // 2. Handle SSH format (e.g. git@github.com:owner/repo.git)
  let cleanPath = withoutQueryOrHash;
  if (cleanPath.startsWith("git@github.com:")) {
    cleanPath = cleanPath.slice("git@github.com:".length);
  } else {
    // 3. Strip protocols (http://, https://, git://)
    cleanPath = cleanPath.replace(/^(?:https?|git):\/\//i, "");

    // 4. Check domain if present
    const slashIndex = cleanPath.indexOf("/");
    if (slashIndex !== -1) {
      const potentialDomain = cleanPath.slice(0, slashIndex).toLowerCase();
      if (potentialDomain.includes(".") && !potentialDomain.endsWith("github.com")) {
        throw new InvalidRepoUrlError(
          `Only GitHub repositories are supported. Found domain: "${potentialDomain}".`
        );
      }
      if (potentialDomain.endsWith("github.com")) {
        cleanPath = cleanPath.slice(slashIndex + 1);
      }
    }
  }

  // 5. Clean up leading/trailing slashes and .git suffix
  cleanPath = cleanPath.replace(/^\/+|\/+$/g, "");
  if (cleanPath.endsWith(".git")) {
    cleanPath = cleanPath.slice(0, -4);
  }

  // 6. Split segments
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new InvalidRepoUrlError(
      `Invalid repository format "${input}". Expected "owner/repo" or a full GitHub URL.`
    );
  }

  const [rawOwner, rawRepo] = segments;

  // 7. Validate GitHub naming conventions
  // GitHub usernames: 1-39 alphanumeric chars or single hyphens, cannot start/end with hyphen
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  // GitHub repo names: 1-100 alphanumeric chars, hyphens, underscores, or periods
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;

  if (!ownerRegex.test(rawOwner)) {
    throw new InvalidRepoUrlError(
      `Invalid GitHub owner/organization name: "${rawOwner}".`
    );
  }

  if (!repoRegex.test(rawRepo)) {
    throw new InvalidRepoUrlError(
      `Invalid GitHub repository name: "${rawRepo}".`
    );
  }

  return {
    owner: rawOwner,
    repo: rawRepo,
  };
}
