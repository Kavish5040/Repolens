import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseGitHubUrl } from "../lib/github/parser.ts";
import { InvalidRepoUrlError } from "../lib/github/errors.ts";

describe("GitHub URL Parser", () => {
  it("should parse standard owner/repo format", () => {
    const result = parseGitHubUrl("facebook/react");
    assert.deepEqual(result, { owner: "facebook", repo: "react" });
  });

  it("should parse HTTPS full URL", () => {
    const result = parseGitHubUrl("https://github.com/vercel/next.js");
    assert.deepEqual(result, { owner: "vercel", repo: "next.js" });
  });

  it("should parse HTTP full URL with trailing slash", () => {
    const result = parseGitHubUrl("http://github.com/tailwindlabs/tailwindcss/");
    assert.deepEqual(result, { owner: "tailwindlabs", repo: "tailwindcss" });
  });

  it("should parse domain-only prefix without protocol", () => {
    const result = parseGitHubUrl("github.com/torvalds/linux");
    assert.deepEqual(result, { owner: "torvalds", repo: "linux" });
  });

  it("should strip .git suffix", () => {
    const result = parseGitHubUrl("https://github.com/expressjs/express.git");
    assert.deepEqual(result, { owner: "expressjs", repo: "express" });
  });

  it("should handle deep tree/blob URLs", () => {
    const result = parseGitHubUrl(
      "https://github.com/facebook/react/tree/main/packages/react-dom"
    );
    assert.deepEqual(result, { owner: "facebook", repo: "react" });
  });

  it("should handle URLs with query parameters and hash fragments", () => {
    const result = parseGitHubUrl(
      "https://github.com/shadcn/ui?tab=readme-ov-file#installation"
    );
    assert.deepEqual(result, { owner: "shadcn", repo: "ui" });
  });

  it("should parse SSH format", () => {
    const result = parseGitHubUrl("git@github.com:facebook/react.git");
    assert.deepEqual(result, { owner: "facebook", repo: "react" });
  });

  it("should reject non-GitHub domains", () => {
    assert.throws(
      () => parseGitHubUrl("https://gitlab.com/gitlab-org/gitlab"),
      InvalidRepoUrlError
    );
  });

  it("should reject empty strings or whitespace", () => {
    assert.throws(() => parseGitHubUrl(""), InvalidRepoUrlError);
    assert.throws(() => parseGitHubUrl("   "), InvalidRepoUrlError);
  });

  it("should reject single word inputs", () => {
    assert.throws(() => parseGitHubUrl("react"), InvalidRepoUrlError);
  });

  it("should reject invalid owner characters", () => {
    assert.throws(() => parseGitHubUrl("-invalid/repo"), InvalidRepoUrlError);
  });
});
