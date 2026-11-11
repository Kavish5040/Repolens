import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { verifyGitHubPat } from "../lib/pat/verify.ts";

describe("GitHub PAT Verification Service (GET /rate_limit validation)", () => {
  const classicToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
  const fineGrainedToken =
    "github_pat_11AABBCCDDEEFFGGHHIIJJKK_0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl";

  it("should confirm valid Classic PAT with scopes and user identity", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/rate_limit")) {
        return new Response(
          JSON.stringify({
            resources: {
              core: { limit: 5000, remaining: 4990, reset: 1772900000, used: 10 },
            },
            rate: { limit: 5000, remaining: 4990, reset: 1772900000, used: 10 },
          }),
          {
            status: 200,
            headers: {
              "x-ratelimit-limit": "5000",
              "x-ratelimit-remaining": "4990",
              "x-ratelimit-reset": "1772900000",
              "x-oauth-scopes": "public_repo, read:user",
            },
          }
        );
      }
      if (urlStr.includes("/user")) {
        return new Response(JSON.stringify({ login: "octocat", avatar_url: "https://github.com/avatar.png" }), {
          status: 200,
        });
      }
      return new Response("Not Found", { status: 404 });
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(classicToken);
      assert.equal(result.valid, true);
      assert.equal(result.tokenType, "classic");
      assert.equal(result.code, "VALID");
      assert.equal(result.rateLimit?.limit, 5000);
      assert.equal(result.rateLimit?.remaining, 4990);
      assert.deepEqual(result.scopes, ["public_repo", "read:user"]);
      assert.equal(result.user?.login, "octocat");
      assert.equal(result.warning, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should confirm valid Fine-grained PAT even when /user returns 403", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/rate_limit")) {
        return new Response(
          JSON.stringify({
            resources: {
              core: { limit: 5000, remaining: 4999, reset: 1772900000, used: 1 },
            },
            rate: { limit: 5000, remaining: 4999, reset: 1772900000, used: 1 },
          }),
          {
            status: 200,
            headers: {
              "x-ratelimit-limit": "5000",
              "x-ratelimit-remaining": "4999",
              "x-ratelimit-reset": "1772900000",
              // Fine-grained tokens do not return x-oauth-scopes header
            },
          }
        );
      }
      if (urlStr.includes("/user")) {
        // Repository-scoped fine-grained tokens return 403 on /user
        return new Response(
          JSON.stringify({ message: "Resource not accessible by personal access token" }),
          { status: 403 }
        );
      }
      return new Response("Not Found", { status: 404 });
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(fineGrainedToken);
      assert.equal(result.valid, true);
      assert.equal(result.tokenType, "fine-grained");
      assert.equal(result.code, "VALID");
      assert.equal(result.rateLimit?.limit, 5000);
      assert.equal(result.rateLimit?.remaining, 4999);
      assert.equal(result.scopes, null);
      assert.equal(result.user, null); // User is null, but token is still completely valid!
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should reject invalid or bad token with 401 INVALID_PAT", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async () => {
      return new Response(JSON.stringify({ message: "Bad credentials" }), {
        status: 401,
      });
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(classicToken);
      assert.equal(result.valid, false);
      assert.equal(result.code, "INVALID_PAT");
      assert.equal(result.statusCode, 401);
      assert.match(result.message, /401 Unauthorized/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should reject expired or revoked token with 401 INVALID_PAT", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({ message: "This personal access token has expired." }),
        { status: 401 }
      );
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(fineGrainedToken);
      assert.equal(result.valid, false);
      assert.equal(result.code, "INVALID_PAT");
      assert.equal(result.statusCode, 401);
      assert.match(result.message, /invalid, expired, or was revoked/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should identify 403 Forbidden with insufficient permissions or SAML block", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({ message: "Resource protected by organization SAML enforcement." }),
        {
          status: 403,
          headers: {
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "4950",
            "x-ratelimit-reset": "1772900000",
          },
        }
      );
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(fineGrainedToken);
      assert.equal(result.valid, false);
      assert.equal(result.code, "FORBIDDEN");
      assert.equal(result.statusCode, 403);
      assert.match(result.message, /forbidden/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should detect rate-limited token when status is 403 and remaining is 0", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({ message: "API rate limit exceeded" }),
        {
          status: 403,
          headers: {
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1772900000",
          },
        }
      );
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(classicToken);
      assert.equal(result.valid, true);
      assert.equal(result.code, "RATE_LIMITED");
      assert.equal(result.rateLimit?.remaining, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should handle empty or whitespace token without network request", async () => {
    const result = await verifyGitHubPat("   ");
    assert.equal(result.valid, false);
    assert.equal(result.code, "INVALID_PAT");
    assert.equal(result.statusCode, 400);
  });

  it("should handle network errors gracefully without crashing", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async () => {
      throw new Error("getaddrinfo ENOTFOUND api.github.com");
    });

    globalThis.fetch = mockFetch;
    try {
      const result = await verifyGitHubPat(classicToken);
      assert.equal(result.valid, false);
      assert.equal(result.code, "NETWORK_ERROR");
      assert.equal(result.statusCode, 500);
      assert.match(result.message, /Network error/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

