"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header.tsx";
import { RepoSearchInput } from "@/components/RepoSearchInput.tsx";
import { QuickTryRepos } from "@/components/QuickTryRepos.tsx";
import { RepoOverviewCard } from "@/components/overview/RepoOverviewCard.tsx";
import { RepoExplorer } from "@/components/explorer/RepoExplorer.tsx";
import { LoadingSkeleton } from "@/components/states/LoadingSkeleton.tsx";
import { ErrorBanner } from "@/components/states/ErrorBanner.tsx";
import { RateLimitBanner } from "@/components/states/RateLimitBanner.tsx";
import { EmptyState } from "@/components/states/EmptyState.tsx";
import type { RepoOverview, RateLimitInfo, ApiResponse } from "@/lib/github/types.ts";

type ActiveTab = "overview" | "explorer";

export function DashboardContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    if (!targetRepo) {
      setOverview(null);
      setErrorState(null);
      return;
    }

    setIsLoading(true);
    setErrorState(null);

    try {
      const res = await fetch(`/api/repo/overview?repo=${encodeURIComponent(targetRepo)}`);
      const body: ApiResponse<RepoOverview> = await res.json();

      if (body.success) {
        setOverview(body.data);
        setRateLimit(body.data.rateLimit);
        setErrorState(null);
      } else {
        setOverview(null);
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
    } catch (err) {
      setOverview(null);
      setErrorState({
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch repository information.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync state when URL params change
  useEffect(() => {
    if (repoParam && repoParam !== currentRepo) {
      setCurrentRepo(repoParam);
      fetchRepoData(repoParam);
    } else if (repoParam && !overview && !isLoading && !errorState) {
      fetchRepoData(repoParam);
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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* App Header */}
      <Header rateLimit={rateLimit} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
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
          ) : errorState ? (
            errorState.code === "RATE_LIMITED" && errorState.resetAt ? (
              <RateLimitBanner
                resetAt={errorState.resetAt}
                limit={errorState.limit}
                remaining={errorState.remaining}
                onRetry={() => fetchRepoData(currentRepo)}
              />
            ) : (
              <ErrorBanner
                code={errorState.code}
                message={errorState.message}
                onRetry={() => fetchRepoData(currentRepo)}
              />
            )
          ) : overview ? (
            <div className="flex flex-col gap-6">
              {/* Tab Navigation Controls */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange("overview")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === "overview"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("explorer")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === "explorer"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>File Explorer & Docs</span>
                  </button>
                </div>

                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
                  branch: {overview.defaultBranch}
                </span>
              </div>

              {/* Tab 1: Overview Dashboard */}
              {activeTab === "overview" && <RepoOverviewCard repo={overview} />}

              {/* Tab 2: File Explorer & Key Documents */}
              {activeTab === "explorer" && (
                <RepoExplorer
                  repoFullName={overview.fullName}
                  defaultBranch={overview.defaultBranch}
                  initialFilePath={activeFilePath}
                  onFileSelect={handleFileSelect}
                />
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>RepoLens &bull; AI-Powered GitHub Intelligence & Exploration Platform</p>
      </footer>
    </div>
  );
}
