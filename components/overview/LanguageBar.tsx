import React from "react";
import type { LanguageBreakdown } from "@/lib/github/types.ts";

interface LanguageBarProps {
  languages: LanguageBreakdown[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LanguageBar({ languages }: LanguageBarProps) {
  if (!languages || languages.length === 0) {
    return null;
  }

  // Show top 6 languages individually, group remainder into "Other"
  const topLanguages = languages.slice(0, 6);
  const otherLanguages = languages.slice(6);
  const otherBytes = otherLanguages.reduce((sum, l) => sum + l.bytes, 0);
  const otherPercentage = otherLanguages.reduce((sum, l) => sum + l.percentage, 0);

  const displayList: LanguageBreakdown[] = [...topLanguages];
  if (otherLanguages.length > 0) {
    displayList.push({
      name: "Other",
      bytes: otherBytes,
      percentage: parseFloat(otherPercentage.toFixed(1)),
      color: "#9ca3af",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        <span>Languages Breakdown</span>
        <span className="text-zinc-400 dark:text-zinc-500 font-normal">
          {languages.length} total {languages.length === 1 ? "language" : "languages"}
        </span>
      </div>

      {/* Segmented Proportional Bar */}
      <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800 shadow-inner">
        {displayList.map((lang) => (
          <div
            key={lang.name}
            style={{
              width: `${Math.max(lang.percentage, 0.5)}%`,
              backgroundColor: lang.color || "#6b7280",
            }}
            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:opacity-85"
            title={`${lang.name}: ${lang.percentage}% (${formatBytes(lang.bytes)})`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
        {displayList.map((lang) => (
          <div key={lang.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: lang.color || "#6b7280" }}
            />
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {lang.name}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {lang.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
