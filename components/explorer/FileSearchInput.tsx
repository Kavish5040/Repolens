"use client";

import React from "react";

interface FileSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  matchCount?: number;
  totalFiles?: number;
}

export function FileSearchInput({
  value,
  onChange,
  matchCount,
  totalFiles,
}: FileSearchInputProps) {
  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter files by path or name..."
        className="w-full pl-9 pr-16 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200/80 dark:border-zinc-700/60 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        aria-label="Filter files"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Clear search"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {value && matchCount !== undefined && (
        <span className="absolute right-7 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          {matchCount} {matchCount === 1 ? "match" : "matches"}
        </span>
      )}
    </div>
  );
}
