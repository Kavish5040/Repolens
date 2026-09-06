import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  REPO_SUMMARY_SYSTEM_PROMPT,
  REPO_CHAT_SYSTEM_PROMPT,
} from "../lib/ai/prompts.ts";

describe("AI System Prompts & Guardrails", () => {
  it("should contain strict citation formatting instructions", () => {
    assert.ok(REPO_SUMMARY_SYSTEM_PROMPT.includes("[file:path/to/file.ext]"));
    assert.ok(REPO_CHAT_SYSTEM_PROMPT.includes("[file:path/to/file.ext]"));
  });

  it("should contain explicit uncertainty behavior instructions", () => {
    assert.ok(REPO_SUMMARY_SYSTEM_PROMPT.includes("Explicit Uncertainty"));
    assert.ok(REPO_CHAT_SYSTEM_PROMPT.includes("insufficient evidence in the codebase to determine"));
  });

  it("should explicitly forbid hallucination or fabrication", () => {
    assert.ok(REPO_SUMMARY_SYSTEM_PROMPT.includes("No Hallucination"));
    assert.ok(REPO_CHAT_SYSTEM_PROMPT.includes("Zero Fabrication"));
  });
});
