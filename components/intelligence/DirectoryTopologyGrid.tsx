"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { DirectoryClassification, DirectoryRole } from "@/lib/github/intelligence-types.ts";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber.tsx";

interface DirectoryTopologyGridProps {
  classifications: DirectoryClassification[];
  onSelectDirectory: (path: string) => void;
}

const ROLE_ICONS: Record<DirectoryRole, string> = {
  application: "📱",
  components: "🧩",
  source: "💻",
  library: "📦",
  tests: "🧪",
  documentation: "📚",
  tooling: "🛠️",
  examples: "💡",
  infrastructure: "☁️",
  config: "⚙️",
  build_output: "🏗️",
  dependencies: "📁",
  unknown: "📁",
};

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 26 },
  },
};

export function DirectoryTopologyGrid({
  classifications,
  onSelectDirectory,
}: DirectoryTopologyGridProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!classifications || classifications.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        No directory structures detected.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <span>🏛️</span>
          <span>Repository Structural Topology</span>
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          <AnimatedNumber value={classifications.length} /> structural regions
        </span>
      </div>

      <motion.div
        variants={shouldReduceMotion ? undefined : gridContainerVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {classifications.map((dir) => {
          const icon = ROLE_ICONS[dir.role] || "📁";

          return (
            <motion.div
              key={dir.path}
              variants={shouldReduceMotion ? undefined : gridItemVariants}
              whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.015 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onSelectDirectory(dir.path)}
              className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20 hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-850/70 cursor-pointer transition-all flex flex-col justify-between gap-3 group shadow-2xs hover:shadow-md hover:shadow-blue-500/5"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base group-hover:scale-110 transition-transform">{icon}</span>
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                      {dir.name}/
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <AnimatedNumber value={dir.fileCount} /> {dir.fileCount === 1 ? "file" : "files"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-400 truncate">
                    {dir.path}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    {dir.label}
                  </span>
                </div>

                {dir.signals.length > 0 && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {dir.signals[0]}
                  </p>
                )}
              </div>

              {dir.sampleFiles.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Sample Files:
                  </span>
                  <div className="flex flex-col gap-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                    {dir.sampleFiles.slice(0, 2).map((sf, idx) => (
                      <span key={idx} className="truncate">
                        &bull; {sf}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
