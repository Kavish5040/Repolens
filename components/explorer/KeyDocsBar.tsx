"use client";

import React from "react";
import type { KeyDocument } from "@/lib/github/types.ts";

interface KeyDocsBarProps {
  keyDocuments: KeyDocument[];
  activeFilePath: string | null;
  onSelectDoc: (path: string) => void;
}

const BADGE_COLOR_MAP: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/80 dark:border-blue-800/50",
    activeBg: "bg-blue-600 text-white",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-800/50",
    activeBg: "bg-emerald-600 text-white",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200/80 dark:border-purple-800/50",
    activeBg: "bg-purple-600 text-white",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/50",
    activeBg: "bg-amber-600 text-white",
  },
  zinc: {
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
    activeBg: "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200/80 dark:border-pink-800/50",
    activeBg: "bg-pink-600 text-white",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/50",
    activeBg: "bg-rose-600 text-white",
  },
};

export function KeyDocsBar({
  keyDocuments,
  activeFilePath,
  onSelectDoc,
}: KeyDocsBarProps) {
  if (!keyDocuments || keyDocuments.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex-shrink-0 flex items-center gap-1 pl-1">
        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Key Docs:
      </span>

      {keyDocuments.map((doc) => {
        const isActive = activeFilePath === doc.path;
        const colorStyle = BADGE_COLOR_MAP[doc.badgeColor] || BADGE_COLOR_MAP.blue;

        return (
          <button
            key={doc.path}
            type="button"
            onClick={() => onSelectDoc(doc.path)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
              isActive
                ? `${colorStyle.activeBg} font-semibold shadow-sm`
                : `${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} hover:opacity-85`
            }`}
            title={`View ${doc.path}`}
          >
            <span>{doc.label}</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({doc.name})
            </span>
          </button>
        );
      })}
    </div>
  );
}
