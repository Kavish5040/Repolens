import React from "react";

interface ErrorBannerProps {
  code?: string;
  message: string;
  ssoUrl?: string;
  onRetry?: () => void;
  onClearPat?: () => void;
  onOpenPatSettings?: () => void;
  onUsePublicAccess?: () => void;
}

export function ErrorBanner({
  code = "ERROR",
  message,
  ssoUrl,
  onRetry,
  onClearPat,
  onOpenPatSettings,
  onUsePublicAccess,
}: ErrorBannerProps) {
  const is404 = code === "NOT_FOUND";
  const isInvalidPat = code === "INVALID_PAT" || code === "INVALID_PAT_FALLBACK";
  const isForbidden = code === "FORBIDDEN" || code === "FORBIDDEN_FALLBACK";
  const isNetwork = code === "NETWORK_ERROR";
  const isFallbackWarning = code.endsWith("_FALLBACK");

  const title = isInvalidPat
    ? isFallbackWarning
      ? "Using Public Quota (Token Expired or Invalid)"
      : "GitHub Token Invalid or Expired"
    : isForbidden
    ? isFallbackWarning
      ? "Using Public Quota (Token Lacks Repository Permission)"
      : ssoUrl
      ? "Organization SAML SSO Authorization Required"
      : "Access Forbidden / Insufficient Permissions"
    : is404
    ? "Repository Not Found or Inaccessible"
    : isNetwork
    ? "Network Connection Error"
    : "Unable to Inspect Repository";

  const bannerColorClass = isFallbackWarning
    ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
    : "border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";

  const iconBgClass = isFallbackWarning
    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
    : "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400";

  return (
    <div
      className={`w-full max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl border ${bannerColorClass} shadow-lg backdrop-blur-sm animate-fadeIn transition-colors`}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl ${iconBgClass} flex-shrink-0 mt-0.5`}>
          {isInvalidPat || isForbidden ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {code}
            </span>
          </div>

          <p className="text-sm mt-1.5 leading-relaxed opacity-95">
            {message}
          </p>

          {is404 && (
            <div className="text-xs mt-3 p-3.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 space-y-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Possible reasons for this error:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Repository Name or Spelling:</strong> The repository URL may be mistyped, moved, or deleted. Check the owner and repository spelling (e.g. <code>facebook/react</code>).
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Private Repository / Access Ambiguity:</strong> GitHub intentionally returns HTTP 404 for private repositories to protect their confidentiality. If this is a private repository:
                  <ul className="list-circle pl-4 mt-1 space-y-1">
                    <li>With a <em>Fine-grained PAT</em>, verify the token includes this repository under <em>Repository access</em>.</li>
                    <li>With a <em>Classic PAT</em>, ensure the token has full <code className="font-mono bg-zinc-200/60 dark:bg-zinc-800 px-1 rounded">repo</code> scope (not just <code>public_repo</code>).</li>
                    <li>Without a token configured, private repositories cannot be viewed.</li>
                  </ul>
                </li>
              </ul>
            </div>
          )}

          {isInvalidPat && (
            <div className="text-xs mt-3 p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 space-y-1.5">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                🔑 Supported Token Options:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Classic PAT (<code>ghp_...</code>)</strong>: Requires only the <code className="px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 font-mono">public_repo</code> scope.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Fine-grained PAT (<code>github_pat_...</code>)</strong>: Requires Repository Access set to <em>Public Repositories</em> (or select this repo) and <code className="px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 font-mono">Contents: Read-only</code> + <code className="px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 font-mono">Metadata: Read-only</code>.
                </li>
              </ul>
            </div>
          )}

          {isForbidden && (
            <div className="text-xs mt-3 p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 space-y-1.5">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                🛡️ Permission Checklist:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                {ssoUrl ? (
                  <li>
                    <strong className="text-zinc-800 dark:text-zinc-200">SAML SSO Required:</strong> This repository belongs to an organization enforcing Single Sign-On. Click the authorization button below to authorize your token.
                  </li>
                ) : (
                  <li>
                    <strong>Fine-grained PAT:</strong> Verify that the token includes this repository under <em>Repository access</em> and has <em>Contents: Read-only</em> enabled.
                  </li>
                )}
                <li>
                  <strong>Organization Policy:</strong> If the repository is under an organization, ensure your token has been approved by an org administrator.
                </li>
                <li>
                  <strong>Public Access:</strong> If you are inspecting an open-source public repository, you can switch to unauthenticated public access.
                </li>
              </ul>
            </div>
          )}

          {/* Actionable Recovery Controls */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {ssoUrl && (
              <a
                id="error-banner-sso-btn"
                href={ssoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <span>Authorize with Organization SAML SSO &rarr;</span>
              </a>
            )}

            {onUsePublicAccess && (isInvalidPat || isForbidden) && (
              <button
                id="error-banner-public-access-btn"
                type="button"
                onClick={onUsePublicAccess}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
              >
                Use Public Access (No Token)
              </button>
            )}

            {onOpenPatSettings && (
              <button
                id="error-banner-update-pat-btn"
                type="button"
                onClick={onOpenPatSettings}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-200 dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-colors"
              >
                Manage / Update Token
              </button>
            )}

            {onClearPat && (isInvalidPat || isForbidden) && (
              <button
                id="error-banner-clear-pat-btn"
                type="button"
                onClick={onClearPat}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-colors"
              >
                Clear Token
              </button>
            )}

            {onRetry && (
              <button
                id="error-banner-retry-btn"
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition-colors"
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
