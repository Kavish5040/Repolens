import React from "react";
import type { StructuralInsight } from "@/lib/github/intelligence-types.ts";

interface StructuralInsightsBannerProps {
  insights: StructuralInsight[];
}

export function StructuralInsightsBanner({ insights }: StructuralInsightsBannerProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
      {insights.map((insight) => {
        const isPositive = insight.type === "positive";
        const isWarning = insight.type === "warning";

        return (
          <div
            key={insight.key}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
              isPositive
                ? "bg-emerald-50/40 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                : isWarning
                ? "bg-amber-50/50 border-amber-200/70 dark:bg-amber-950/20 dark:border-amber-800/40"
                : "bg-zinc-50/60 border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800/80"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                {insight.label}
              </span>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isPositive
                    ? "bg-emerald-500"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
              />
            </div>

            <p
              className={`text-sm font-bold truncate ${
                isPositive
                  ? "text-emerald-900 dark:text-emerald-200"
                  : isWarning
                  ? "text-amber-900 dark:text-amber-200"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {insight.value}
            </p>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-tight">
              {insight.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
