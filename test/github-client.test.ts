import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractRateLimitInfo } from "../lib/github/client.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
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

  it("should create generic GitHubApiError", () => {
    const error = new GitHubApiError("Service Unavailable", 503);
    assert.equal(error.code, "API_ERROR");
    assert.equal(error.statusCode, 503);
  });
});
