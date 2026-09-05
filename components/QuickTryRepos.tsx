"use client";

import React from "react";

interface QuickTryReposProps {
  onSelect: (repo: string) => void;
  currentRepo?: string | null;
}

const SAMPLE_REPOS = [
  { label: "React", repo: "facebook/react", tech: "TypeScript" },
  { label: "Next.js", repo: "vercel/next.js", tech: "TypeScript" },
  { label: "Tailwind CSS", repo: "tailwindlabs/tailwindcss", tech: "Rust/TS" },
  { label: "shadcn/ui", repo: "shadcn/ui", tech: "TypeScript" },
  { label: "FastAPI", repo: "fastapi/fastapi", tech: "Python" },
  { label: "Linux", repo: "torvalds/linux", tech: "C" },
];

export function QuickTryRepos({ onSelect, currentRepo }: QuickTryReposProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto pt-2">
      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
        Quick Try:
      </span>
      {SAMPLE_REPOS.map(({ label, repo, tech }) => {
        const isSelected = currentRepo?.toLowerCase() === repo.toLowerCase();
        return (
          <button
            key={repo}
            type="button"
            onClick={() => onSelect(repo)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 border ${
              isSelected
                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700"
                : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200/60 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800"
            }`}
          >
            <span>{label}</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              ({tech})
            </span>
          </button>
        );
      })}
    </div>
  );
}
