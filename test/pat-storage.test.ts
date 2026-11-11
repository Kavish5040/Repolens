import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { savePat, loadPat, clearPat } from "../lib/pat/storage.ts";

describe("GitHub PAT Client Storage & Lifecycle", () => {
  // In-memory localStorage mock for node test runner
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, value);
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
    clear: () => {
      storageMap.clear();
    },
  };

  beforeEach(() => {
    storageMap.clear();
    // @ts-expect-error polyfill localStorage in node environment
    globalThis.localStorage = mockLocalStorage;
  });

  it("should return null when no token is configured", () => {
    const token = loadPat();
    assert.equal(token, null);
  });

  it("should save and retrieve a Classic PAT correctly", () => {
    const classic = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
    savePat(classic);
    const loaded = loadPat();
    assert.equal(loaded, classic);
  });

  it("should save and retrieve a Fine-grained PAT correctly", () => {
    const fineGrained =
      "github_pat_11AABBCCDDEEFFGGHHIIJJKK_0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijkl";
    savePat(fineGrained);
    const loaded = loadPat();
    assert.equal(loaded, fineGrained);
  });

  it("should trim surrounding whitespace when saving a token", () => {
    const raw = "   ghp_1234567890abcdefghijklmnopqrstuvwxyz   ";
    savePat(raw);
    const loaded = loadPat();
    assert.equal(loaded, raw.trim());
  });

  it("should support replacing an existing token with a new token", () => {
    const initial = "ghp_initialtoken1234567890abcdefghijklmn";
    const replacement = "github_pat_replacementtoken1234567890abcdefghijklmnopqrstuvwxyz0123456789";

    savePat(initial);
    assert.equal(loadPat(), initial);

    // Replace
    savePat(replacement);
    assert.equal(loadPat(), replacement);
  });

  it("should clear the stored token completely", () => {
    const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
    savePat(token);
    assert.equal(loadPat(), token);

    clearPat();
    assert.equal(loadPat(), null);
  });
});

