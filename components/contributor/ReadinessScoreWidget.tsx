"use client";

import React, { useState } from "react";
import type { ReadinessBreakdown } from "@/lib/contributor/types.ts";

interface ReadinessScoreWidgetProps {
  readiness: ReadinessBreakdown;
  compact?: boolean;
}

export function ReadinessScoreWidget({ readiness, compact = false }: ReadinessScoreWidgetProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const tierColors = {
    high: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    moderate: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
    "needs-clarification": "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
  }[readiness.tier];

  const tierLabel = {
    high: "High Readiness",
    moderate: "Moderate Readiness",
    "needs-clarification": "Needs Clarification",
  }[readiness.tier];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tierColors}`}
        title={`Contribution Readiness: ${readiness.totalScore}/100 (${tierLabel})`}
      >
        <span className="w-2 h-2 rounded-full bg-current"></span>
        <span>{readiness.totalScore}/100</span>
        <span className="opacity-80 text-[10px]">Readiness</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 ${tierColors}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-current"></div>
          <span className="text-sm font-bold tracking-tight">Contribution Readiness: {readiness.totalScore}/100</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-current/10 font-semibold">
            {tierLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium underline opacity-90 hover:opacity-100 flex items-center gap-1"
        >
          {isExpanded ? "Hide Breakdown" : "View Breakdown"}
          <svg
            className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Score Progress Bar */}
      <div className="w-full bg-current/10 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-current rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(5, readiness.totalScore))}%` }}
        />
      </div>

      <p className="text-xs opacity-90 leading-relaxed">{readiness.summary}</p>

      {/* Expanded Signal Breakdown */}
      {isExpanded && (
        <div className="mt-2 pt-3 border-t border-current/20 flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
            Transparent Readiness Evaluation:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {readiness.signals.map((sig) => (
              <div
                key={sig.id}
                className="p-2.5 rounded-lg bg-white/60 dark:bg-black/30 border border-current/10 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {sig.passed ? (
                      <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={2} />
                      </svg>
                    )}
                    {sig.label}
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px]">
                    {sig.score}/{sig.maxScore} pts
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                  {sig.explanation}
                </p>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
            * Note: This score measures observable issue clarity and repository grounding — it does not evaluate personal developer skill.
          </div>
        </div>
      )}
    </div>
  );
}
