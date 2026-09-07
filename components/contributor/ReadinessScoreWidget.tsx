"use client";

import React, { useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReadinessBreakdown } from "@/lib/contributor/types.ts";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber.tsx";

interface ReadinessScoreWidgetProps {
  readiness: ReadinessBreakdown;
  compact?: boolean;
}

const signalsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const signalCardVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 25 },
  },
};

export function ReadinessScoreWidget({ readiness, compact = false }: ReadinessScoreWidgetProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const shouldReduceMotion = useReducedMotion();

  const tierColors = {
    high: {
      card: "text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60",
      ring: "stroke-emerald-600 dark:stroke-emerald-400",
      badge: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
      glow: "shadow-emerald-500/10",
    },
    moderate: {
      card: "text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60",
      ring: "stroke-blue-600 dark:stroke-blue-400",
      badge: "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      glow: "shadow-blue-500/10",
    },
    "needs-clarification": {
      card: "text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60",
      ring: "stroke-amber-600 dark:stroke-amber-400",
      badge: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
      glow: "shadow-amber-500/10",
    },
  }[readiness.tier];

  const tierLabel = {
    high: "High Readiness",
    moderate: "Moderate Readiness",
    "needs-clarification": "Needs Clarification",
  }[readiness.tier];

  // Circular gauge calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * Math.min(100, Math.max(0, readiness.totalScore))) / 100;

  if (compact) {
    return (
      <motion.div
        whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tierColors.card}`}
        title={`Contribution Readiness: ${readiness.totalScore}/100 (${tierLabel})`}
      >
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span className="font-mono font-bold">
          <AnimatedNumber value={readiness.totalScore} duration={0.8} />/100
        </span>
        <span className="opacity-80 text-[10px]">Readiness</span>
      </motion.div>
    );
  }

  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-4 shadow-sm ${tierColors.glow} ${tierColors.card} transition-all`}>
      {/* Top Header with Radial Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Radial Progress Ring */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 72 72">
              {/* Background Track */}
              <circle
                cx="36"
                cy="36"
                r={radius}
                className="stroke-current opacity-15"
                strokeWidth="5"
                fill="transparent"
              />
              {/* Animated Progress Arc */}
              <motion.circle
                cx="36"
                cy="36"
                r={radius}
                className={tierColors.ring}
                strokeWidth="5"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                initial={shouldReduceMotion ? false : { strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            {/* Centered Number Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono font-black text-lg sm:text-xl leading-none tracking-tight">
                <AnimatedNumber value={readiness.totalScore} duration={1.1} />
              </span>
              <span className="text-[9px] font-bold opacity-75 leading-none mt-0.5">
                /100
              </span>
            </div>
          </div>

          {/* Title and Tier Badge */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Contribution Readiness
              </span>
              <motion.span
                initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 25 }}
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shadow-2xs ${tierColors.badge}`}
              >
                {tierLabel}
              </motion.span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed max-w-xl">
              {readiness.summary}
            </p>
          </div>
        </div>

        {/* Breakdown Toggle Button */}
        <motion.button
          type="button"
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/60 dark:bg-zinc-850/60 hover:bg-white dark:hover:bg-zinc-800 border border-current/20 flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>{isExpanded ? "Hide Evaluation" : "View Transparent Evaluation"}</span>
          <svg
            className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>
      </div>

      {/* Expanded Transparent Signals with Staggered Entrance */}
      {isExpanded && (
        <div className="pt-3 border-t border-current/20 flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider opacity-80">
            <span>Transparent Readiness Evaluation:</span>
            <span className="font-mono text-[10px] font-normal">
              {readiness.signals.filter((s) => s.passed).length}/{readiness.signals.length} criteria satisfied
            </span>
          </div>

          <motion.div
            variants={shouldReduceMotion ? undefined : signalsContainerVariants}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {readiness.signals.map((sig) => (
              <motion.div
                key={sig.id}
                variants={shouldReduceMotion ? undefined : signalCardVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-current/15 flex flex-col gap-1 text-xs shadow-2xs hover:border-current/30 transition-colors"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {sig.passed ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="8" strokeWidth={2} />
                        </svg>
                      </span>
                    )}
                    <span>{sig.label}</span>
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800">
                    <AnimatedNumber value={sig.score} duration={0.9} />/{sig.maxScore} pts
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug pl-5.5">
                  {sig.explanation}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic mt-0.5">
            * Note: This score measures observable issue clarity and repository grounding — it does not evaluate personal developer skill.
          </p>
        </div>
      )}
    </div>
  );
}
