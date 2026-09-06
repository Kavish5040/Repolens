"use client";

import React, { useState, useEffect } from "react";

interface RateLimitBannerProps {
  resetAt: string | Date;
  limit?: number;
  remaining?: number;
  onRetry?: () => void;
}

export function RateLimitBanner({
  resetAt,
  limit = 60,
  remaining = 0,
  onRetry,
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

          <div className="mt-3 p-3 rounded-xl bg-amber-100/60 dark:bg-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-1">
            <p className="font-semibold">💡 How to get 5,000 requests/hour:</p>
            <p>
              <strong>Option A (browser):</strong> Click <strong>&ldquo;Add token&rdquo;</strong> in the header and enter your GitHub Personal Access Token with <code>public_repo</code> scope.
            </p>
            <p>
              <strong>Option B (server):</strong> Set <code>GITHUB_TOKEN=...</code> in <code>.env.local</code> (for self-hosted deployments).
            </p>
          </div>

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
              >
                Check Quota & Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
