import React from "react";

export function LoadingSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-3/4 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md" />
          <div className="flex gap-2 pt-1">
            <div className="h-4 w-16 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full" />
            <div className="h-4 w-20 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full" />
            <div className="h-4 w-14 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
        ))}
      </div>

      {/* Language & Commit Skeleton */}
      <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-3">
          <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="flex gap-4 pt-1">
            <div className="h-3 w-20 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
            <div className="h-3 w-24 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
            <div className="h-3 w-16 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
          </div>
        </div>
        <div className="lg:w-80 h-28 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
      </div>
    </div>
  );
}
