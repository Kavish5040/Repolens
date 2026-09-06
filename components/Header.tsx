"use client";

import React, { useState, useEffect, useRef } from "react";
import type { RateLimitInfo } from "@/lib/github/types.ts";
import {
  loadPat,
  savePat,
  clearPat,
  maskPat,
  validatePatFormat,
} from "@/lib/pat/storage.ts";

interface HeaderProps {
  rateLimit?: RateLimitInfo | null;
  onPatChange?: (pat: string | null) => void;
}

export function Header({ rateLimit, onPatChange }: HeaderProps) {
  const [storedPat, setStoredPat] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load PAT from localStorage on mount (client-only)
  useEffect(() => {
    setStoredPat(loadPat());
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!showPanel) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
        setValidationError(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPanel]);

  // Focus input when panel opens
  useEffect(() => {
    if (showPanel && !storedPat) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showPanel, storedPat]);

  const handleSave = () => {
    const result = validatePatFormat(inputValue);
    if (!result.valid) {
      setValidationError(result.reason ?? "Invalid token format.");
      return;
    }
    savePat(inputValue);
    const saved = loadPat();
    setStoredPat(saved);
    setInputValue("");
    setValidationError(null);
    setShowPanel(false);
    onPatChange?.(saved);
  };

  const handleClear = () => {
    clearPat();
    setStoredPat(null);
    setInputValue("");
    setValidationError(null);
    setShowPanel(false);
    onPatChange?.(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setShowPanel(false);
      setValidationError(null);
    }
  };

  return (
    <header className="w-full border-b border-zinc-200 bg-white/70 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/70 sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
              />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
              Repo<span className="text-blue-600 dark:text-blue-400">Lens</span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              AI Intelligence
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Rate Limit Badge */}
          {rateLimit && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                rateLimit.remaining > 15
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                  : rateLimit.remaining > 0
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
              }`}
              title={`Resets at ${new Date(rateLimit.resetAt).toLocaleTimeString()}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  rateLimit.remaining > 15
                    ? "bg-emerald-500 animate-pulse"
                    : rateLimit.remaining > 0
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
              />
              <span>
                API Quota: <strong>{rateLimit.remaining}</strong>/{rateLimit.limit}
              </span>
            </div>
          )}

          {/* PAT Settings Button */}
          <div className="relative" ref={panelRef}>
            <button
              id="pat-settings-btn"
              type="button"
              onClick={() => {
                setShowPanel((v) => !v);
                setValidationError(null);
              }}
              title={storedPat ? "GitHub token configured — click to manage" : "Set GitHub Personal Access Token"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                storedPat
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 dark:hover:bg-emerald-950/60"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="hidden sm:inline">{storedPat ? "Token active" : "Add token"}</span>
            </button>

            {/* PAT Panel */}
            {showPanel && (
              <div
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl shadow-zinc-900/10 dark:shadow-zinc-900/50 p-4 z-50"
                role="dialog"
                aria-label="GitHub Personal Access Token settings"
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    GitHub Personal Access Token
                  </h3>
                </div>

                {storedPat ? (
                  /* Token is set — show masked display */
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <code className="text-xs text-emerald-700 dark:text-emerald-300 font-mono truncate">
                        {maskPat(storedPat)}
                      </code>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Token is active. GitHub API requests use your 5,000 req/hr quota.
                    </p>
                    <button
                      id="pat-clear-btn"
                      type="button"
                      onClick={handleClear}
                      className="w-full text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg px-3 py-2 transition-colors"
                    >
                      Clear Token
                    </button>
                  </div>
                ) : (
                  /* No token set — show input form */
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <input
                        id="pat-input"
                        ref={inputRef}
                        type="password"
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          setValidationError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="ghp_..."
                        autoComplete="off"
                        spellCheck={false}
                        className={`w-full text-xs font-mono px-3 py-2 rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                          validationError
                            ? "border-rose-400 focus:ring-rose-500/30"
                            : "border-zinc-300 dark:border-zinc-600 focus:ring-blue-500/30 focus:border-blue-400"
                        }`}
                      />
                      {validationError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">{validationError}</p>
                      )}
                    </div>
                    <button
                      id="pat-save-btn"
                      type="button"
                      onClick={handleSave}
                      disabled={!inputValue.trim()}
                      className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-white rounded-lg px-3 py-2 transition-colors"
                    >
                      Save Token
                    </button>
                    {/* Security disclosure */}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1">
                      <p>
                        <strong className="text-zinc-700 dark:text-zinc-300">🔒 Privacy:</strong>{" "}
                        Stored only in <em>this browser</em> (localStorage). Never sent to the AI service.
                      </p>
                      <p>
                        <strong className="text-zinc-700 dark:text-zinc-300">📈 Benefit:</strong>{" "}
                        Increases your GitHub API limit from 60 to 5,000 requests/hour.
                      </p>
                      <p>
                        <strong className="text-zinc-700 dark:text-zinc-300">🔑 Scope:</strong>{" "}
                        Only <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">public_repo</code> (read-only) is needed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
