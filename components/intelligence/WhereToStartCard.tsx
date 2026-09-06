"use client";

import React from "react";
import type { OnboardingStep } from "@/lib/github/intelligence-types.ts";

interface WhereToStartCardProps {
  steps: OnboardingStep[];
  onNavigateToTarget: (path: string) => void;
}

const CATEGORY_STYLES: Record<
  OnboardingStep["category"],
  { label: string; bg: string; text: string; border: string }
> = {
  overview: {
    label: "Overview",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  manifest: {
    label: "Manifest",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  entry_point: {
    label: "Entry Point",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  core_architecture: {
    label: "Architecture",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  testing: {
    label: "Testing",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  tooling: {
    label: "Tooling",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
  },
  contribution: {
    label: "Contribution",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
};

export function WhereToStartCard({
  steps,
  onNavigateToTarget,
}: WhereToStartCardProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        No onboarding pathway could be computed for this repository.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
            🎯
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Where Should I Start?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Deterministic, evidence-backed onboarding sequence for new developers
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
          {steps.length} Recommended Steps
        </span>
      </div>

      {/* Steps List */}
      <div className="p-6 flex flex-col gap-4">
        {steps.map((step) => {
          const catStyle = CATEGORY_STYLES[step.category] || CATEGORY_STYLES.overview;

          return (
            <div
              key={step.stepNumber}
              className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Step Number Circle */}
                <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  {step.stepNumber}
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {catStyle.label}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Target: <code>{step.targetPath}</code>
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {step.reason}
                  </p>

                  {/* Key Points to Inspect */}
                  {step.keyPointsToInspect.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Focus on:</span>
                      {step.keyPointsToInspect.map((point, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span className="text-blue-500">&bull;</span>
                          {point}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Observable Evidence */}
                  {step.evidence.length > 0 && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic mt-0.5">
                      Signal: {step.evidence.join("; ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Action: 1-Click Navigate */}
              <div className="self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateToTarget(step.targetPath)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-blue-600 text-zinc-800 hover:text-white dark:bg-zinc-800 dark:hover:bg-blue-600 dark:text-zinc-200 dark:hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Inspect {step.targetType === "directory" ? "Folder" : "File"}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
