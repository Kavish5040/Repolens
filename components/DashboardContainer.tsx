"use client";

import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AmbientSpotlight } from "@/components/ui/AmbientSpotlight.tsx";
import { Header } from "@/components/Header.tsx";
// import { ErrorBoundary } from "@/components/ErrorBoundary.tsx"; // Unused import removed
// useRef imported via React import above

import { RepoSearchInput } from "@/components/RepoSearchInput.tsx";
import { QuickTryRepos } from "@/components/QuickTryRepos.tsx";
import { RepoOverviewCard } from "@/components/overview/RepoOverviewCard.tsx";
import { RepoExplorer } from "@/components/explorer/RepoExplorer.tsx";
import { IntelligenceDashboard } from "@/components/intelligence/IntelligenceDashboard.tsx";
import { AiDashboard } from "@/components/ai/AiDashboard.tsx";
import { ContributorDashboard } from "@/components/contributor/ContributorDashboard.tsx";
import { LoadingSkeleton } from "@/components/states/LoadingSkeleton.tsx";
import { ErrorBanner } from "@/components/states/ErrorBanner.tsx";
import { RateLimitBanner } from "@/components/states/RateLimitBanner.tsx";
import { EmptyState } from "@/components/states/EmptyState.tsx";
import { FerrofluidBackground } from "@/components/landing/FerrofluidBackground.tsx";
import { RepoLensHero } from "@/components/landing/RepoLensHero.tsx";
import type { RepoOverview, RateLimitInfo, ApiResponse } from "@/lib/github/types.ts";
import { loadPat, clearPat } from "@/lib/pat/storage.ts";

type ActiveTab = "overview" | "intelligence" | "ai" | "contributor" | "explorer";

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: { text: string; className: string };
  isEmerald?: boolean;
}

const TABS: TabItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "intelligence",
    label: "Repository Intelligence",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    badge: {
      text: "Pillar B",
      className: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
    },
  },
  {
    id: "ai",
    label: "Ask RepoLens (AI)",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    badge: {
      text: "Pillar C",
      className: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
    },
  },
  {
    id: "contributor",
    label: "Contributor Mode",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    badge: {
      text: "Pillar D",
      className: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300",
    },
    isEmerald: true,
  },
  {
    id: "explorer",
    label: "File Explorer & Docs",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
];

/**
 * Returns the current PAT from localStorage and a setter that re-reads it.
 * Safe to call during SSR — localStorage access is guarded.
 */
function usePat() {
  const [pat, setPat] = useState<string | null>(loadPat());
  const refresh = useCallback((next: string | null) => setPat(next), []);
  return { pat, refresh };
}

export function DashboardContainer() {
  // Abort controller for in‑flight GitHub requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Monotonically increasing request identifier to discard stale responses
  const requestIdRef = useRef(0);

  // Cleanup any pending request when the component unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const { pat, refresh: refreshPat } = usePat();

  const repoParam = searchParams.get("repo") || "";
  const tabParam = (searchParams.get("tab") as ActiveTab) || "overview";
  const fileParam = searchParams.get("file") || null;

  const [currentRepo, setCurrentRepo] = useState<string>(repoParam);
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabParam);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(fileParam);
  const [overview, setOverview] = useState<RepoOverview | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{
    code: string;
    message: string;
    resetAt?: string;
    limit?: number;
    remaining?: number;
  } | null>(null);

  const fetchRepoData = useCallback(async (targetRepo: string) => {
  // Abort any previous request and start a new one
  abortControllerRef.current?.abort();
  const controller = new AbortController();
  abortControllerRef.current = controller;
  const requestId = ++requestIdRef.current;
  const isStale = () => requestId !== requestIdRef.current;

  if (!targetRepo) {
    // Reset state for empty repository and invalidate pending IDs by incrementing requestId
    abortControllerRef.current?.abort();
    requestIdRef.current++;
    setOverview(null);
    setErrorState(null);
    setRateLimit(null);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  setErrorState(null);

  try {
    const headers: HeadersInit = {};
    const currentPat = loadPat();
    if (currentPat) headers["x-github-token"] = currentPat;

    const res = await fetch(`/api/repo/overview?repo=${encodeURIComponent(targetRepo)}`, {
      headers,
      signal: controller.signal,
    });
    const body: ApiResponse<RepoOverview> = await res.json();

    if (isStale()) return; // discard stale response

    if (body.success) {
      setOverview(body.data);
      setRateLimit(body.data.rateLimit);
      setErrorState(null);
    } else {
      // Attempt unauthenticated fallback when token is invalid or lacks permission
      if (currentPat && (body.error.code === "INVALID_PAT" || body.error.code === "FORBIDDEN")) {
        try {
          const fallbackRes = await fetch(`/api/repo/overview?repo=${encodeURIComponent(targetRepo)}`, {
            signal: controller.signal,
          });
          const fallbackBody: ApiResponse<RepoOverview> = await fallbackRes.json();
          if (isStale()) return;
          if (fallbackBody.success) {
            setOverview(fallbackBody.data);
            setRateLimit(fallbackBody.data.rateLimit);
            setErrorState({
              code: body.error.code === "INVALID_PAT" ? "INVALID_PAT_FALLBACK" : "FORBIDDEN_FALLBACK",
              message:
                body.error.code === "INVALID_PAT"
                  ? "Your configured GitHub token is invalid or expired. Loaded public repository using unauthenticated quota. Please update or clear your token."
                  : `Your token lacks permission for this repository (${body.error.message}). Loaded using unauthenticated public quota.`,
            });
            return;
          }
        } catch {
          // ignore fallback errors
        }
      }

      // Preserve existing overview on auth errors, otherwise clear
      setOverview((prev) => (body.error.code === "INVALID_PAT" || body.error.code === "FORBIDDEN" ? prev : null));
      setErrorState(body.error);
      if (body.error.limit !== undefined && body.error.remaining !== undefined) {
        setRateLimit({
          limit: body.error.limit,
          remaining: body.error.remaining,
          resetAt: body.error.resetAt ? new Date(body.error.resetAt) : new Date(),
          used: body.error.limit - body.error.remaining,
        });
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === "AbortError") {
      // Intentional abort – do not set error state
      return;
    }
    // Preserve existing overview on network failures
    setOverview((prev) => prev);
    setErrorState({
      code: "NETWORK_ERROR",
      message: error.message,
    });
  } finally {
    // Only clear loading if this is the latest request
    if (!isStale()) {
      setIsLoading(false);
    }
  }
}, []);

  const handleOpenPatSettings = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-pat-settings"));
  }, []);

  const handleClearPat = useCallback(() => {
    clearPat();
    refreshPat(null);
    if (currentRepo) {
      fetchRepoData(currentRepo);
    }
  }, [currentRepo, fetchRepoData, refreshPat]);

  const handleUsePublicAccess = useCallback(async () => {
    if (!currentRepo) return;
    setIsLoading(true);
    setErrorState(null);
    try {
      const res = await fetch(
        `/api/repo/overview?repo=${encodeURIComponent(currentRepo)}`
      );
      const body: ApiResponse<RepoOverview> = await res.json();
      if (body.success) {
        setOverview(body.data);
        setRateLimit(body.data.rateLimit);
        setErrorState(null);
      } else {
        setErrorState(body.error);
      }
    } catch (err) {
      setErrorState({
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Failed to load public repository.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentRepo]);

  // Sync state when URL params change
  useEffect(() => {
    if (repoParam && repoParam !== currentRepo) {
      setTimeout(() => setCurrentRepo(repoParam), 0);
      setTimeout(() => fetchRepoData(repoParam), 0);
    } else if (repoParam && !overview && !isLoading && !errorState) {
      setTimeout(() => fetchRepoData(repoParam), 0);
    }
  }, [repoParam, currentRepo, overview, isLoading, errorState, fetchRepoData]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const updateUrl = (repo: string, tab: ActiveTab, file: string | null = null) => {
    const params = new URLSearchParams();
    params.set("repo", repo);
    if (tab !== "overview") params.set("tab", tab);
    if (file) params.set("file", file);

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleSelectRepo = (selectedRepo: string) => {
    setCurrentRepo(selectedRepo);
    setActiveFilePath(null);
    updateUrl(selectedRepo, activeTab, null);
    fetchRepoData(selectedRepo);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (currentRepo) {
      updateUrl(currentRepo, tab, activeFilePath);
    }
  };

  const handleFileSelect = (filePath: string) => {
    setActiveFilePath(filePath);
    if (currentRepo) {
      updateUrl(currentRepo, activeTab, filePath);
    }
  };

  const handleNavigateFromIntelligence = (targetPath: string) => {
    setActiveFilePath(targetPath);
    setActiveTab("explorer");
    if (currentRepo) {
      updateUrl(currentRepo, "explorer", targetPath);
    }
  };

  const isLandingState = !overview && !isLoading && !errorState;

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      {/* Ambient Radial Spotlight */}
      <AmbientSpotlight />

      {/* Ferrofluid Ambient Intelligence Background - Landing State Only */}
      <AnimatePresence>
        {isLandingState && (
          <motion.div
            key="landing-ferrofluid-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          >
            <FerrofluidBackground />
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Header */}
      <Header rateLimit={rateLimit} onPatChange={refreshPat} />

      {/* Main Content Area */}
      <motion.main
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8"
      >
        <AnimatePresence mode="wait">
          {isLandingState ? (
            <motion.div
              key="landing-hero-view"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <RepoLensHero
                currentRepo={currentRepo}
                isLoading={isLoading || isPending}
                onSearch={handleSelectRepo}
              />
            </motion.div>
          ) : (
            <motion.div
              key="active-repo-view"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col gap-8"
            >
              {/* Search Hero Area */}
              <section className="flex flex-col gap-3 text-center pt-2 sm:pt-4">
                <RepoSearchInput
                  initialValue={currentRepo}
                  isLoading={isLoading || isPending}
                  onSearch={handleSelectRepo}
                />
                <QuickTryRepos
                  onSelect={handleSelectRepo}
                  currentRepo={currentRepo}
                />
              </section>

              {/* Dynamic Display Area */}
              <section className="w-full flex flex-col gap-6">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : errorState && !overview ? (
                  errorState.code === "RATE_LIMITED" && errorState.resetAt ? (
                    <RateLimitBanner
                      resetAt={errorState.resetAt}
                      limit={errorState.limit}
                      remaining={errorState.remaining}
                      onRetry={() => fetchRepoData(currentRepo)}
                      onOpenPatSettings={handleOpenPatSettings}
                    />
                  ) : (
                    <ErrorBanner
                      code={errorState.code}
                      message={errorState.message}
                      onRetry={() => fetchRepoData(currentRepo)}
                      onClearPat={handleClearPat}
                      onOpenPatSettings={handleOpenPatSettings}
                      onUsePublicAccess={handleUsePublicAccess}
                    />
                  )
                ) : overview ? (
                  <div className="flex flex-col gap-6">
                    {/* Preserved repository view alert banner */}
                    {errorState && (
                      <div className="w-full">
                        {errorState.code === "RATE_LIMITED" && errorState.resetAt ? (
                          <RateLimitBanner
                            resetAt={errorState.resetAt}
                            limit={errorState.limit}
                            remaining={errorState.remaining}
                            onRetry={() => fetchRepoData(currentRepo)}
                            onOpenPatSettings={handleOpenPatSettings}
                          />
                        ) : (
                          <ErrorBanner
                            code={errorState.code}
                            message={errorState.message}
                            onRetry={() => fetchRepoData(currentRepo)}
                            onClearPat={handleClearPat}
                            onOpenPatSettings={handleOpenPatSettings}
                            onUsePublicAccess={handleUsePublicAccess}
                          />
                        )}
                      </div>
                    )}
                    {/* Tab Navigation Controls */}
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {TABS.map((tab) => {
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => handleTabChange(tab.id)}
                              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                                isActive
                                  ? "text-white"
                                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeTabIndicator"
                                  className={`absolute inset-0 rounded-xl shadow-md ${
                                    tab.isEmerald ? "bg-emerald-600 shadow-emerald-600/20" : "bg-blue-600 shadow-blue-600/25"
                                  }`}
                                  transition={
                                    shouldReduceMotion
                                      ? { duration: 0 }
                                      : { type: "spring", stiffness: 450, damping: 35 }
                                  }
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-2">
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.badge && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : tab.badge.className
                                    }`}
                                  >
                                    {tab.badge.text}
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
                        branch: {overview.defaultBranch}
                      </span>
                    </div>

                    {/* Tab Content with smooth responsive transition */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeTab}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Tab 1: Overview Dashboard */}
                        {activeTab === "overview" && <RepoOverviewCard repo={overview} />}

                        {/* Tab 2: Repository Intelligence & Where Should I Start? */}
                        {activeTab === "intelligence" && (
                          <IntelligenceDashboard
                            repoFullName={overview.fullName}
                            defaultBranch={overview.defaultBranch}
                            onNavigateToFile={handleNavigateFromIntelligence}
                            onNavigateToFolder={handleNavigateFromIntelligence}
                            pat={pat}
                          />
                        )}

                        {/* Tab 3: Ask RepoLens (AI Q&A & Summary) */}
                        {activeTab === "ai" && (
                          <AiDashboard
                            repoFullName={overview.fullName}
                            defaultBranch={overview.defaultBranch}
                            detectedTechnologies={overview.languages.map((l) => l.name)}
                            activeFilePath={activeFilePath}
                            onSelectFile={handleNavigateFromIntelligence}
                            pat={pat}
                          />
                        )}

                        {/* Tab 4: Contributor Mode (Pillar D) */}
                        {activeTab === "contributor" && (
                          <ContributorDashboard
                            repoFullName={overview.fullName}
                            defaultBranch={overview.defaultBranch}
                            onSelectFile={handleNavigateFromIntelligence}
                            pat={pat}
                          />
                        )}

                        {/* Tab 5: File Explorer & Key Documents */}
                        {activeTab === "explorer" && (
                          <RepoExplorer
                            repoFullName={overview.fullName}
                            defaultBranch={overview.defaultBranch}
                            initialFilePath={activeFilePath}
                            onFileSelect={handleFileSelect}
                            pat={pat}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>RepoLens &bull; AI-Powered GitHub Intelligence & Exploration Platform</p>
      </footer>
    </div>
  );
}
