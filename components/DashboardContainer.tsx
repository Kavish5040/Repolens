"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header.tsx";
import { RepoSearchInput } from "@/components/RepoSearchInput.tsx";
import { QuickTryRepos } from "@/components/QuickTryRepos.tsx";
import { RepoOverviewCard } from "@/components/overview/RepoOverviewCard.tsx";
import { LoadingSkeleton } from "@/components/states/LoadingSkeleton.tsx";
import { ErrorBanner } from "@/components/states/ErrorBanner.tsx";
import { RateLimitBanner } from "@/components/states/RateLimitBanner.tsx";
import { EmptyState } from "@/components/states/EmptyState.tsx";
import type { RepoOverview, RateLimitInfo, ApiResponse } from "@/lib/github/types.ts";

export function DashboardContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const repoParam = searchParams.get("repo") || "";

  const [currentRepo, setCurrentRepo] = useState<string>(repoParam);
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

  // Fetch when URL repo param changes
  useEffect(() => {
    if (repoParam && repoParam !== currentRepo) {
      setCurrentRepo(repoParam);
      fetchRepoData(repoParam);
    } else if (repoParam && !overview && !isLoading && !errorState) {
      fetchRepoData(repoParam);
    }
  }, [repoParam, currentRepo, overview, isLoading, errorState, fetchRepoData]);

  const handleSelectRepo = (selectedRepo: string) => {
    setCurrentRepo(selectedRepo);
    startTransition(() => {
      router.push(`/?repo=${encodeURIComponent(selectedRepo)}`);
    });
    fetchRepoData(selectedRepo);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* App Header */}
      <Header rateLimit={rateLimit} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Search Hero Area */}
        <section className="flex flex-col gap-3 text-center pt-2 sm:pt-6">
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
            <RepoOverviewCard repo={overview} />
          ) : (
            <EmptyState />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>RepoLens &bull; AI-Powered GitHub Intelligence Dashboard</p>
      </footer>
    </div>
  );
}
