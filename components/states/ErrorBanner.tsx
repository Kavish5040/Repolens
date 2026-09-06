import React from "react";

interface ErrorBannerProps {
  code?: string;
  message: string;
  onRetry?: () => void;
  onClearPat?: () => void;
}

export function ErrorBanner({ code = "ERROR", message, onRetry, onClearPat }: ErrorBannerProps) {
  const is404 = code === "NOT_FOUND";
  const isInvalidPat = code === "INVALID_PAT";
  const isNetwork = code === "NETWORK_ERROR";

  const title = isInvalidPat
    ? "GitHub Token Invalid or Expired"
    : is404
    ? "Repository Not Found"
    : isNetwork
    ? "Network Error"
    : "Unable to Inspect Repository";

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-lg backdrop-blur-sm animate-fadeIn">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex-shrink-0">
          {isInvalidPat ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
              {title}
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
              {"\uD83D\uDCA1"} <strong>Tip:</strong> Ensure the repository is <strong>public</strong> and the URL is spelled correctly (e.g. <code>facebook/react</code> or <code>https://github.com/owner/repo</code>).
            </p>
          )}

          {isInvalidPat && (
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-2">
              {"\uD83D\uDD11"} <strong>Fix:</strong> Click <strong>&ldquo;Token active&rdquo;</strong> in the header, then <strong>Clear Token</strong> and enter a fresh{" "}
              <code>ghp_...</code> token with <code>public_repo</code> scope. Or remove the token to fall back to the server quota.
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {isInvalidPat && onClearPat && (
              <button
                id="error-banner-clear-pat-btn"
                type="button"
                onClick={onClearPat}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors"
              >
                Clear Token
              </button>
            )}
            {onRetry && (
              <button
                id="error-banner-retry-btn"
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
