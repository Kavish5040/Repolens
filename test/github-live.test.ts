import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRepoOverview } from "../lib/github/client.ts";

describe("GitHub API Live Integration", () => {
  it("should fetch and normalize live repository overview for a public repo", async () => {
    try {
      const overview = await getRepoOverview("facebook/react");
      assert.equal(overview.name, "react");
      assert.equal(overview.fullName, "facebook/react");
      assert.equal(overview.owner.login, "facebook");
      assert.ok(overview.stars > 100000, "Stars should be over 100k");
      assert.ok(overview.languages.length > 0, "Should have language breakdown");
      assert.ok(overview.rateLimit.limit > 0, "Should have rate limit info");
    } catch (error: unknown) {
      // If CI or local machine is currently rate limited by GitHub unauthenticated quota, pass gracefully
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "RATE_LIMITED"
      ) {
        console.warn("Live test skipped due to GitHub unauthenticated rate limit.");
        return;
      }
      throw error;
    }
  });
});
