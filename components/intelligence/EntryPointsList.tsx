"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { EntryPointCandidate } from "@/lib/github/intelligence-types.ts";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber.tsx";

interface EntryPointsListProps {
  entryPoints: EntryPointCandidate[];
  onSelectEntry: (path: string) => void;
}

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 26 },
  },
};

export function EntryPointsList({ entryPoints, onSelectEntry }: EntryPointsListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!entryPoints || entryPoints.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        No obvious application entry points detected from standard conventions.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <span>🚀</span>
          <span>Likely Application Entry Points</span>
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          <AnimatedNumber value={entryPoints.length} /> candidate{entryPoints.length === 1 ? "" : "s"}
        </span>
      </div>

      <motion.div
        variants={shouldReduceMotion ? undefined : listContainerVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        className="flex flex-col gap-2.5"
      >
        {entryPoints.map((entry) => (
          <motion.div
            key={entry.path}
            variants={shouldReduceMotion ? undefined : itemVariants}
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.008 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20 hover:border-blue-500/40 hover:bg-white dark:hover:bg-zinc-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs hover:shadow-md hover:shadow-blue-500/5"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                #{entry.rank}
              </div>

              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {entry.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {entry.path}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    {entry.label}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-tight">
                  {entry.description}
                </p>

                {entry.signals.length > 0 && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                    Evidence: {entry.signals.join("; ")}
                  </p>
                )}
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => onSelectEntry(entry.path)}
              className="self-end sm:self-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 group-hover:bg-blue-600 text-zinc-800 group-hover:text-white dark:bg-zinc-800 dark:group-hover:bg-blue-600 dark:text-zinc-200 dark:group-hover:text-white transition-colors shadow-2xs flex items-center gap-1.5 flex-shrink-0"
            >
              <span>View Code</span>
              <svg
                className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
