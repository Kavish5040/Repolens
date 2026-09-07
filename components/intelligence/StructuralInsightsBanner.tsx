"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { StructuralInsight } from "@/lib/github/intelligence-types.ts";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber.tsx";

interface StructuralInsightsBannerProps {
  insights: StructuralInsight[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 26 },
  },
};

function renderInsightValue(val: string | number) {
  if (typeof val === "number") {
    return <AnimatedNumber value={val} />;
  }
  const str = String(val);
  const match = str.match(/^([\d,]+)(\s*.*)$/);
  if (match) {
    const rawNum = parseInt(match[1].replace(/,/g, ""), 10);
    if (!isNaN(rawNum)) {
      return (
        <>
          <AnimatedNumber value={rawNum} />
          {match[2]}
        </>
      );
    }
  }
  return str;
}

export function StructuralInsightsBanner({ insights }: StructuralInsightsBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  if (!insights || insights.length === 0) return null;

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : containerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full"
    >
      {insights.map((insight) => {
        const isPositive = insight.type === "positive";
        const isWarning = insight.type === "warning";

        return (
          <motion.div
            key={insight.key}
            variants={shouldReduceMotion ? undefined : cardVariants}
            whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-md hover:shadow-blue-500/5 ${
              isPositive
                ? "bg-emerald-50/40 border-emerald-200/70 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:hover:border-emerald-700"
                : isWarning
                ? "bg-amber-50/50 border-amber-200/70 hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/40 dark:hover:border-amber-700"
                : "bg-zinc-50/60 border-zinc-200/80 hover:border-zinc-300 dark:bg-zinc-900/40 dark:border-zinc-800/80 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                {insight.label}
              </span>
              <div className="relative flex items-center justify-center">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isPositive
                      ? "bg-emerald-500"
                      : isWarning
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />
                {!shouldReduceMotion && isPositive && (
                  <span className="absolute w-3 h-3 rounded-full bg-emerald-500/40 animate-ping" />
                )}
              </div>
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
              {renderInsightValue(insight.value)}
            </p>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-tight">
              {insight.description}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
