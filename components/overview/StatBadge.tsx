"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber.tsx";

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  href?: string;
}

export function StatBadge({ icon, label, value, subValue, href }: StatBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const isNumeric = typeof value === "number";

  const content = (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group/stat flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-850/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md hover:shadow-blue-500/5 transition-all"
    >
      <div className="text-zinc-500 dark:text-zinc-400 group-hover/stat:text-blue-500 transition-colors flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            {isNumeric ? (
              <AnimatedNumber value={value} duration={0.8} />
            ) : (
              value
            )}
          </p>
          {subValue && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
              {subValue}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        {content}
      </a>
    );
  }

  return content;
}
