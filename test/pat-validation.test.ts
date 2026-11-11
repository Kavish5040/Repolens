import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validatePatFormat,
  getPatType,
  maskPat,
  PAT_DOCUMENTATION,
} from "../lib/pat/validation.ts";

describe("GitHub PAT Format Validation", () => {
  const validClassic = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"; // 40 chars
  const validFineGrained =
    "github_pat_11AABBCCDDEEFFGGHHIIJJKK_0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl"; // 93 chars

  it("should validate a proper Classic PAT format", () => {
    const result = validatePatFormat(validClassic);
    assert.equal(result.valid, true);
    assert.equal(result.type, "classic");
    assert.equal(getPatType(validClassic), "classic");
  });

  it("should validate a proper Fine-grained PAT format", () => {
    const result = validatePatFormat(validFineGrained);
    assert.equal(result.valid, true);
    assert.equal(result.type, "fine-grained");
    assert.equal(getPatType(validFineGrained), "fine-grained");
  });

  it("should reject an empty token or whitespace-only token", () => {
    const emptyResult = validatePatFormat("");
    assert.equal(emptyResult.valid, false);
    assert.match(emptyResult.reason || "", /empty/i);

    const spaceResult = validatePatFormat("    ");
    assert.equal(spaceResult.valid, false);
    assert.match(spaceResult.reason || "", /empty/i);
  });

  it("should reject tokens with embedded whitespace", () => {
    const spaceResult = validatePatFormat("ghp_1234 567890abcdefghijklmnopqrstuvw");
    assert.equal(spaceResult.valid, false);
    assert.match(spaceResult.reason || "", /whitespace/i);
  });

  it("should reject Classic tokens that are too short", () => {
    // 24 characters: passes generic min length 20, but fails classic requirement (~40 chars)
    const shortClassic = "ghp_12345678901234567890";
    const result = validatePatFormat(shortClassic);
    assert.equal(result.valid, false);
    assert.match(result.reason || "", /Classic PAT format/i);
  });

  it("should reject Fine-grained tokens that are too short", () => {
    const shortFineGrained = "github_pat_tooshorttoken";
    const result = validatePatFormat(shortFineGrained);
    assert.equal(result.valid, false);
    assert.match(result.reason || "", /Fine-grained PAT format/i);
  });

  it("should reject tokens with invalid special characters", () => {
    const invalidChars = "ghp_1234567890!@#$%^&*()_+{}|:<>?";
    const result = validatePatFormat(invalidChars);
    assert.equal(result.valid, false);
    assert.match(result.reason || "", /invalid characters/i);
  });

  it("should reject unknown prefixes", () => {
    const unknownToken = "my_custom_secret_key_123456789012345";
    const result = validatePatFormat(unknownToken);
    assert.equal(result.valid, false);
    assert.match(result.reason || "", /recognized GitHub PAT/i);
  });

  it("should support other recognized GitHub tokens (e.g. gho_ oauth tokens)", () => {
    const oauthToken = "gho_1234567890abcdefghijklmnopqrstuvwxyz";
    const result = validatePatFormat(oauthToken);
    assert.equal(result.valid, true);
    assert.equal(result.type, "other");
  });

  it("should mask Classic tokens safely without exposing secret entropy", () => {
    const masked = maskPat(validClassic);
    assert.equal(masked.startsWith("ghp_****..."), true);
    assert.equal(masked.endsWith(validClassic.slice(-4)), true);
    assert.equal(masked.includes(validClassic.slice(4, 20)), false);
  });

  it("should mask Fine-grained tokens safely without exposing secret entropy", () => {
    const masked = maskPat(validFineGrained);
    assert.equal(masked.startsWith("github_pat_****..."), true);
    assert.equal(masked.endsWith(validFineGrained.slice(-4)), true);
    assert.equal(masked.includes(validFineGrained.slice(15, 40)), false);
  });

  it("should provide documentation metadata for Classic and Fine-grained tokens", () => {
    assert.equal(PAT_DOCUMENTATION.classic.requiredScope, "public_repo");
    assert.equal(
      PAT_DOCUMENTATION.fineGrained.permissions.some(
        (p) => p.name === "Contents" && p.level === "Read-only" && p.required === true
      ),
      true
    );
    assert.equal(
      PAT_DOCUMENTATION.fineGrained.permissions.some(
        (p) => p.name === "Metadata" && p.level === "Read-only" && p.required === true
      ),
      true
    );
  });
});
