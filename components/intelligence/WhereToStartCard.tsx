"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
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

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, x: -14, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 27 },
  },
};

export function WhereToStartCard({
  steps,
  onNavigateToTarget,
}: WhereToStartCardProps) {
  const shouldReduceMotion = useReducedMotion();

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
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-xs">
            🎯
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Where Should I Start?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Deterministic, evidence-backed onboarding pathway for developers
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
          {steps.length} Sequenced Steps
        </span>
      </div>

      {/* Steps Visual Journey */}
      <div className="relative p-6">
        {/* Animated Connecting Line */}
        <motion.div
          initial={shouldReduceMotion ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ originY: 0 }}
          className="absolute left-[38px] sm:left-[40px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-400/50 hidden sm:block pointer-events-none rounded-full"
        />

        {/* Steps List */}
        <motion.div
          variants={shouldReduceMotion ? undefined : listContainerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="flex flex-col gap-4 relative z-10"
        >
          {steps.map((step) => {
            const catStyle = CATEGORY_STYLES[step.category] || CATEGORY_STYLES.overview;
            const formattedStepNum = String(step.stepNumber).padStart(2, "0");

            return (
              <motion.div
                key={step.stepNumber}
                variants={shouldReduceMotion ? undefined : stepVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.008 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => onNavigateToTarget(step.targetPath)}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900/90 hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group cursor-pointer"
                title={`Click to inspect ${step.targetPath}`}
              >
                {/* Left Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Step Number Circle with Glow Ring */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs shadow-sm ring-2 ring-blue-500/20 group-hover:ring-blue-500/60 group-hover:scale-105 transition-all">
                      {formattedStepNum}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {step.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {catStyle.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1">
                        <span className="text-zinc-400">Target:</span>
                        <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors">
                          {step.targetPath}
                        </code>
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
                  <div className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 group-hover:bg-blue-600 text-zinc-800 group-hover:text-white dark:bg-zinc-800 dark:group-hover:bg-blue-600 dark:text-zinc-200 dark:group-hover:text-white transition-all shadow-xs flex items-center gap-1.5">
                    <span>Inspect {step.targetType === "directory" ? "Folder" : "File"}</span>
                    <svg
                      className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
