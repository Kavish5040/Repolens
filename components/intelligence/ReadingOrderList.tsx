"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReadingOrderItem } from "@/lib/github/intelligence-types.ts";

interface ReadingOrderListProps {
  items: ReadingOrderItem[];
  onSelectItem: (path: string) => void;
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
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 400, damping: 26 },
  },
};

export function ReadingOrderList({ items, onSelectItem }: ReadingOrderListProps) {
  const shouldReduceMotion = useReducedMotion();
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>📖</span>
          <span>Recommended Reading Order</span>
        </h4>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
          Sequential path
        </span>
      </div>

      <div className="relative flex flex-col gap-2">
        {/* Connecting line */}
        <motion.div
          initial={shouldReduceMotion ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ originY: 0 }}
          className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500/80 via-blue-400/50 to-transparent pointer-events-none rounded-full"
        />

        <motion.div
          variants={shouldReduceMotion ? undefined : listContainerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="flex flex-col gap-1.5 relative z-10"
        >
          {items.map((item) => (
            <motion.div
              key={item.order}
              variants={shouldReduceMotion ? undefined : itemVariants}
              whileHover={shouldReduceMotion ? undefined : { x: 3, scale: 1.01 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onSelectItem(item.path)}
              className="relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850/70 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60 cursor-pointer transition-all group"
            >
              {/* Order Node */}
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all">
                {item.order}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate">
                    {item.path}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {item.explanation}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
