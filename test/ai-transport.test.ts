import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatOpenAiMessages,
  getAiConfig,
  validateAiConfig,
} from "../lib/ai/transport.ts";

describe("Provider-Agnostic AI Transport Layer", () => {
  it("should format OpenAI-compatible messages for summary prompts", () => {
    const messages = formatOpenAiMessages({
      systemPrompt: "You are an AI analyst.",
      contextText: "Repository: sample/repo\nFiles: 10",
      userPrompt: "Generate a summary.",
    });

    assert.equal(messages.length, 2);
    assert.equal(messages[0].role, "system");
    assert.equal(messages[0].content, "You are an AI analyst.");
    assert.equal(messages[1].role, "user");
    assert.ok(messages[1].content.includes("[REPOSITORY CONTEXT]"));
    assert.ok(messages[1].content.includes("Repository: sample/repo"));
    assert.ok(messages[1].content.includes("[TASK / PROMPT]"));
    assert.ok(messages[1].content.includes("Generate a summary."));
  });

  it("should format OpenAI-compatible multi-turn messages and inject context into first turn", () => {
    const messages = formatOpenAiMessages({
      systemPrompt: "You are a pair programmer.",
      contextText: "Detected Stack: Next.js",
      messages: [
        { id: "1", role: "user", content: "What is this repo?" },
        { id: "2", role: "assistant", content: "This is a Next.js app." },
        { id: "3", role: "user", content: "Where are the routes?" },
      ],
    });

    assert.equal(messages.length, 4);
    assert.equal(messages[0].role, "system");
    // First user message has context injected
    assert.equal(messages[1].role, "user");
    assert.ok(messages[1].content.includes("[REPOSITORY CONTEXT]"));
    assert.ok(messages[1].content.includes("Detected Stack: Next.js"));
    assert.ok(messages[1].content.includes("What is this repo?"));
    // Subsequent messages are untouched
    assert.equal(messages[2].role, "assistant");
    assert.equal(messages[2].content, "This is a Next.js app.");
    assert.equal(messages[3].role, "user");
    assert.equal(messages[3].content, "Where are the routes?");
  });

  it("should resolve AI config with sensible fallbacks and OMNIROUTE vars", () => {
    const config = getAiConfig();
    assert.ok(config.baseUrl.length > 0);
    assert.ok(config.model.length > 0);
    assert.equal(config.timeoutMs, 180000);
  });

  it("should validate AI config presence", () => {
    const validation = validateAiConfig();
    assert.equal(validation.valid, true);
  });
});
