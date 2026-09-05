"use client";

import React, { useState, useEffect } from "react";
import { parseGitHubUrl } from "@/lib/github/parser.ts";

interface RepoSearchInputProps {
  initialValue?: string;
  isLoading?: boolean;
  onSearch: (repo: string) => void;
}

export function RepoSearchInput({
  initialValue = "",
  isLoading = false,
  onSearch,
}: RepoSearchInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setValidationError("Please enter a GitHub repository URL or owner/repo format.");
      return;
    }

    try {
      const parsed = parseGitHubUrl(trimmed);
      setValidationError(null);
      onSearch(`${parsed.owner}/${parsed.repo}`);
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : "Invalid format. Try 'facebook/react' or full GitHub URL."
      );
    }
  };

  const handleClear = () => {
    setQuery("");
    setValidationError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
        <div className="relative flex items-center shadow-lg rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          {/* GitHub Icon Prefix */}
          <div className="pl-4 pr-2 text-zinc-400 dark:text-zinc-500 pointer-events-none">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Input Field */}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Paste GitHub URL or owner/repo (e.g. vercel/next.js)"
            disabled={isLoading}
            className="w-full py-3.5 pr-28 text-sm sm:text-base text-zinc-900 dark:text-zinc-50 bg-transparent placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            aria-label="GitHub repository search"
          />

          {/* Clear Button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-24 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Clear input"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-0.5 w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing</span>
              </>
            ) : (
              <span>Inspect</span>
            )}
          </button>
        </div>

        {/* Real-time Inline Validation Message */}
        {validationError && (
          <p className="text-xs text-rose-500 dark:text-rose-400 px-2 font-medium flex items-center gap-1.5 animate-fadeIn">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{validationError}</span>
          </p>
        )}
      </form>
    </div>
  );
}
