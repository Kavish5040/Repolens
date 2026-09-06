"use client";

import React from "react";

interface PromptSuggestionsProps {
  technologies: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function PromptSuggestions({
  technologies,
  onSelectPrompt,
  disabled,
}: PromptSuggestionsProps) {
  const isNext = technologies.some((t) => t.toLowerCase().includes("next"));
  const isReact = technologies.some((t) => t.toLowerCase().includes("react"));
  const isPython = technologies.some((t) => t.toLowerCase().includes("python") || t.toLowerCase().includes("django") || t.toLowerCase().includes("fastapi"));
  const isRust = technologies.some((t) => t.toLowerCase().includes("rust"));

  const suggestions = [
    "Where is the main entry point and how does initialization work?",
    isNext
      ? "How does page routing and server/client component splitting work?"
      : isReact
      ? "How is state management and component structure organized?"
      : isPython
      ? "What is the application module layout and entry dispatch loop?"
      : isRust
      ? "How are the crates, modules, and error handling organized?"
      : "What is the high-level architecture and data flow?",
    "What testing frameworks are configured and where are test suites located?",
    "What are the critical dependencies and external services used?",
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span>💡</span>
        <span>Suggested Questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(s)}
            className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all text-left shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
