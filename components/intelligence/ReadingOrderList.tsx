"use client";

import React from "react";
import type { ReadingOrderItem } from "@/lib/github/intelligence-types.ts";

interface ReadingOrderListProps {
  items: ReadingOrderItem[];
  onSelectItem: (path: string) => void;
}

export function ReadingOrderList({ items, onSelectItem }: ReadingOrderListProps) {
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

      <div className="relative flex flex-col gap-2 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
        {items.map((item) => (
          <div
            key={item.order}
            onClick={() => onSelectItem(item.path)}
            className="relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors group"
          >
            {/* Order Node */}
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {item.order}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
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
          </div>
        ))}
      </div>
    </div>
  );
}
