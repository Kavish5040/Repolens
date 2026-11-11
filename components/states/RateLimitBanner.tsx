"use client";

import React, { useState, useEffect } from "react";

interface RateLimitBannerProps {
  resetAt: string | Date;
  limit?: number;
  remaining?: number;
  onRetry?: () => void;
  onOpenPatSettings?: () => void;
}

export function RateLimitBanner({
  resetAt,
  limit = 60,
  remaining = 0,
  onRetry,
  onOpenPatSettings,
}: RateLimitBannerProps) {
  const resetDate = typeof resetAt === "string" ? new Date(resetAt) : resetAt;
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diffMs = resetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("Quota reset! You can retry now.");
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setTimeLeft(`Resets in ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [resetDate]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-lg backdrop-blur-sm animate-fadeIn">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">
              GitHub API Rate Limit Reached
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
              {timeLeft}
            </span>
          </div>

          <p className="text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
            GitHub provides <strong>{limit} unauthenticated requests per hour</strong> per IP address. Your current quota ({remaining}/{limit}) has been exhausted.
          </p>

          <div className="mt-3 p-3.5 rounded-xl bg-amber-100/60 dark:bg-amber-900/40 text-xs text-amber-950 dark:text-amber-100 flex flex-col gap-2">
            <p className="font-semibold">💡 How to unlock 5,000 requests/hour:</p>
            <ul className="list-disc pl-4 space-y-1 text-amber-900/90 dark:text-amber-200/90">
              <li>
                <strong>Classic PAT (<code>ghp_...</code>)</strong>: Create a token with <code>public_repo</code> scope.
              </li>
              <li>
                <strong>Fine-grained PAT (<code>github_pat_...</code>)</strong>: Create a token with Public Repository access and <code>Contents: Read-only</code> (and default <code>Metadata: Read-only</code>).
              </li>
              <li>
                <strong>Server Deployment</strong>: Set <code>GITHUB_TOKEN=...</code> in <code>.env.local</code>.
              </li>
            </ul>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {onOpenPatSettings && (
              <button
                type="button"
                onClick={onOpenPatSettings}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
              >
                Configure GitHub Token
              </button>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
              >
                Check Quota & Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
