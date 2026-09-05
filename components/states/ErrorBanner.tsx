import React from "react";

interface ErrorBannerProps {
  code?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ code = "ERROR", message, onRetry }: ErrorBannerProps) {
  const is404 = code === "NOT_FOUND";

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-lg backdrop-blur-sm animate-fadeIn">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
              {is404 ? "Repository Not Found" : "Unable to Inspect Repository"}
            </h3>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-200/70 dark:bg-rose-900/70 text-rose-800 dark:text-rose-300">
              {code}
            </span>
          </div>

          <p className="text-sm text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
            {message}
          </p>

          {is404 && (
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-2">
              💡 <strong>Tip:</strong> Ensure the repository is <strong>public</strong> and the URL is spelled correctly (e.g. <code>facebook/react</code> or <code>https://github.com/owner/repo</code>).
            </p>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
