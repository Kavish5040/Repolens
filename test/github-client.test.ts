import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { extractRateLimitInfo, fetchGitHub } from "../lib/github/client.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
  GitHubForbiddenError,
  GitHubApiError,
} from "../lib/github/errors.ts";

describe("GitHub API Client Telemetry & Errors", () => {
  it("should parse rate-limit headers correctly", () => {
    const headers = new Headers({
      "x-ratelimit-limit": "60",
      "x-ratelimit-remaining": "45",
      "x-ratelimit-reset": "1772900000",
      "x-ratelimit-used": "15",
    });

    const info = extractRateLimitInfo(headers);
    assert.equal(info.limit, 60);
    assert.equal(info.remaining, 45);
    assert.equal(info.used, 15);
    assert.equal(info.resetAt.getTime(), 1772900000 * 1000);
  });

  it("should create GitHubNotFoundError with correct status and code", () => {
    const error = new GitHubNotFoundError("octocat", "hello-world");
    assert.equal(error.code, "NOT_FOUND");
    assert.equal(error.statusCode, 404);
    assert.match(error.message, /octocat\/hello-world/);
  });

  it("should create GitHubRateLimitError with reset timestamp", () => {
    const reset = new Date(Date.now() + 600000);
    const error = new GitHubRateLimitError(reset, 60, 0);
    assert.equal(error.code, "RATE_LIMITED");
    assert.equal(error.statusCode, 403);
    assert.equal(error.remaining, 0);
    assert.equal(error.limit, 60);
    assert.equal(error.resetAt.getTime(), reset.getTime());
  });

  it("should create GitHubAuthError for 401 Unauthorized without echoing token", () => {
    const error = new GitHubAuthError();
    assert.equal(error.code, "INVALID_PAT");
    assert.equal(error.statusCode, 401);
    assert.match(error.message, /401 Unauthorized/);
    assert.equal(error.message.includes("ghp_"), false);
    assert.equal(error.message.includes("github_pat_"), false);
  });

  it("should create GitHubForbiddenError for 403 Forbidden with permission details", () => {
    const error = new GitHubForbiddenError("Resource not accessible by personal access token");
    assert.equal(error.code, "FORBIDDEN");
    assert.equal(error.statusCode, 403);
    assert.match(error.message, /Resource not accessible/i);

    const defaultError = new GitHubForbiddenError();
    assert.match(defaultError.message, /forbidden/i);
  });

  it("should create generic GitHubApiError", () => {
    const error = new GitHubApiError("Service Unavailable", 503);
    assert.equal(error.code, "API_ERROR");
    assert.equal(error.statusCode, 503);
  });

  it("should support public repository access without any token (no auth header)", async () => {
    const originalFetch = globalThis.fetch;
    const originalEnv = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;

    let capturedHeaders: Headers | undefined;
    const mockFetch = mock.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ name: "react" }), {
        status: 200,
        headers: {
          "x-ratelimit-limit": "60",
          "x-ratelimit-remaining": "59",
          "x-ratelimit-reset": "1772900000",
        },
      });
    });

    globalThis.fetch = mockFetch;
    try {
      const res = await fetchGitHub<{ name: string }>("/repos/facebook/react");
      assert.equal(res.data.name, "react");
      assert.equal(res.rateLimit.limit, 60);
      assert.ok(capturedHeaders !== undefined);
      assert.equal((capturedHeaders as Headers).has("Authorization"), false);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalEnv) process.env.GITHUB_TOKEN = originalEnv;
    }
  });

  it("should attach Bearer token when client PAT is provided", async () => {
    const originalFetch = globalThis.fetch;
    const testPat = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";

    let capturedAuth: string | null = null;
    const mockFetch = mock.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      capturedAuth = h.get("Authorization");
      return new Response(JSON.stringify({ name: "react" }), {
        status: 200,
        headers: {
          "x-ratelimit-limit": "5000",
          "x-ratelimit-remaining": "4999",
          "x-ratelimit-reset": "1772900000",
        },
      });
    });

    globalThis.fetch = mockFetch;
    try {
      const res = await fetchGitHub<{ name: string }>("/repos/facebook/react", {
        clientPat: testPat,
      });
      assert.equal(res.data.name, "react");
      assert.equal(res.rateLimit.limit, 5000);
      assert.equal(capturedAuth, `Bearer ${testPat}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should prioritize clientPat over server env GITHUB_TOKEN", async () => {
    const originalFetch = globalThis.fetch;
    const originalEnv = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = "ghp_servertoken12345678901234567890";
    const clientToken = "github_pat_clienttoken1234567890abcdefghijklmnopqrstuvwxyz0123456789";

    let capturedAuth: string | null = null;
    const mockFetch = mock.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      capturedAuth = h.get("Authorization");
      return new Response(JSON.stringify({ name: "react" }), {
        status: 200,
      });
    });

    globalThis.fetch = mockFetch;
    try {
      await fetchGitHub("/repos/facebook/react", { clientPat: clientToken });
      assert.equal(capturedAuth, `Bearer ${clientToken}`);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalEnv) {
        process.env.GITHUB_TOKEN = originalEnv;
      } else {
        delete process.env.GITHUB_TOKEN;
      }
    }
  });

  it("should throw GitHubForbiddenError on 403 when not rate limited", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({ message: "Resource not accessible by personal access token" }),
        {
          status: 403,
          headers: {
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "4999",
          },
        }
      );
    });

    globalThis.fetch = mockFetch;
    try {
      await assert.rejects(
        async () => {
          await fetchGitHub("/repos/facebook/react");
        },
        (err: unknown) => {
          return err instanceof GitHubForbiddenError && err.code === "FORBIDDEN" && err.statusCode === 403;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
