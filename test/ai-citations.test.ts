import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractAndValidateCitations,
  sanitizeCitations,
} from "../lib/ai/citations.ts";

describe("AI Citation Extractor & Validator", () => {
  const suppliedFiles = ["package.json", "app/page.tsx", "src/lib/utils.ts", "README.md"];

  it("should extract valid file citations matching supplied files", () => {
    const text = "The main page is configured in [file:app/page.tsx] and dependencies in [file:package.json].";
    const citations = extractAndValidateCitations(text, suppliedFiles);

    assert.equal(citations.length, 2);
    assert.equal(citations[0].path, "app/page.tsx");
    assert.equal(citations[0].isValid, true);
    assert.equal(citations[1].path, "package.json");
    assert.equal(citations[1].isValid, true);
  });

  it("should parse line ranges in citations", () => {
    const text = "See the helper function at [file:src/lib/utils.ts#L15-L30] and [file:app/page.tsx:L50-L75].";
    const citations = extractAndValidateCitations(text, suppliedFiles);

    assert.equal(citations.length, 2);
    assert.equal(citations[0].path, "src/lib/utils.ts");
    assert.equal(citations[0].lineRange, "L15-L30");
    assert.equal(citations[0].isValid, true);

    assert.equal(citations[1].path, "app/page.tsx");
    assert.equal(citations[1].lineRange, "L50-L75");
    assert.equal(citations[1].isValid, true);
  });

  it("should flag hallucinated / unsupplied files as invalid", () => {
    const text = "The database schema is defined in [file:prisma/schema.prisma] and [file:package.json].";
    const citations = extractAndValidateCitations(text, suppliedFiles);

    assert.equal(citations.length, 2);
    assert.equal(citations[0].path, "prisma/schema.prisma");
    assert.equal(citations[0].isValid, false);
    assert.equal(citations[1].path, "package.json");
    assert.equal(citations[1].isValid, true);
  });

  it("should sanitize invalid citations to backticked code", () => {
    const text = "Config in [file:package.json] and nonexistent [file:fake/config.yaml].";
    const sanitized = sanitizeCitations(text, suppliedFiles);

    assert.equal(sanitized, "Config in [file:package.json] and nonexistent `fake/config.yaml`.");
  });
});
