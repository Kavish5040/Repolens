"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { ContributorIssue, IssueCategory } from "@/lib/contributor/types.ts";
import type { ApiResponse } from "@/lib/github/types.ts";
import { IssueCard } from "./IssueCard.tsx";
import { IssueAnalysisView } from "./IssueAnalysisView.tsx";
import { loadPat } from "@/lib/pat/storage.ts";

interface ContributorDashboardProps {
  repoFullName: string;
  defaultBranch: string;
  initialIssueNumber?: number | null;
  onSelectFile: (filePath: string) => void;
  pat?: string | null;
}

export function ContributorDashboard({
  repoFullName,
  defaultBranch,
  initialIssueNumber,
  onSelectFile,
}: ContributorDashboardProps) {
  const [issues, setIssues] = useState<ContributorIssue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<IssueCategory>("good-first-issue");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"readiness" | "recent" | "comments">("readiness");
  const [selectedIssue, setSelectedIssue] = useState<ContributorIssue | null>(null);
  const [page, setPage] = useState<number>(1);

  const fetchIssues = useCallback(
    async (category: IssueCategory, targetPage: number = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          repo: repoFullName,
          branch: defaultBranch,
          category,
          page: String(targetPage),
          perPage: "30",
        });

        const headers: HeadersInit = {};
        const currentPat = loadPat();
        if (currentPat) headers["x-github-token"] = currentPat;

        const res = await fetch(`/api/repo/issues?${params.toString()}`, { headers });
        const body: ApiResponse<{ issues: ContributorIssue[]; totalOpenCount: number }> =
          await res.json();

        if (body.success) {
          const loadedIssues = body.data.issues || [];
          setIssues(loadedIssues);
          if (loadedIssues.length > 0) {
            if (initialIssueNumber) {
              const matched = loadedIssues.find((i: ContributorIssue) => i.number === initialIssueNumber);
              setSelectedIssue(matched || loadedIssues[0]);
            } else {
              setSelectedIssue((current) => {
                if (current && loadedIssues.some((i: ContributorIssue) => i.id === current.id)) {
                  return current;
                }
                return loadedIssues[0];
              });
            }
          } else {
            setSelectedIssue(null);
          }
        } else {
          setError(body.error?.message || "Failed to load repository issues.");
          setIssues([]);
          setSelectedIssue(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repository issues.");
        setIssues([]);
        setSelectedIssue(null);
      } finally {
        setIsLoading(false);
      }
    },
    [repoFullName, defaultBranch, initialIssueNumber]
  );

  useEffect(() => {
    fetchIssues(activeCategory, page);
  }, [activeCategory, page, fetchIssues]);

  const handleCategoryChange = (category: IssueCategory) => {
    setActiveCategory(category);
    setPage(1);
  };

  // Filter & sort in memory for fast user interactions
  const filteredIssues = issues
    .filter((issue) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.body.toLowerCase().includes(q) ||
        issue.labels.some((l) => l.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "readiness") {
        return b.readiness.totalScore - a.readiness.totalScore;
      }
      if (sortBy === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === "comments") {
        return b.commentsCount - a.commentsCount;
      }
      return 0;
    });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Pillar D Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/20">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Pillar D
            </span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Open Source Contributor Mode
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Find newcomer-ready issues, inspect transparent readiness scores, and follow guided contribution pathways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono">
            {searchQuery.trim()
              ? `${filteredIssues.length} of ${issues.length} issues`
              : `${filteredIssues.length} issues loaded`}
          </span>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "good-first-issue", label: "Good First Issue", badge: "Beginner" },
            { id: "help-wanted", label: "Help Wanted" },
            { id: "bug", label: "Bugs" },
            { id: "documentation", label: "Docs" },
            { id: "feature", label: "Features" },
            { id: "all", label: "All Open Issues" },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as IssueCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span>{cat.label}</span>
                {cat.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="readiness">Highest Readiness</option>
            <option value="recent">Most Recent</option>
            <option value="comments">Most Comments</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Issue List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse flex flex-col gap-2.5">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              {error}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center flex flex-col items-center justify-center gap-3">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No issues found matching category &quot;{activeCategory}&quot;.
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Try exploring other categories or clearing your search filter:
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("help-wanted")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  Help Wanted
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange("documentation")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  Docs
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange("bug")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  Bugs
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-medium transition-colors"
                >
                  All Open Issues
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isSelected={selectedIssue?.id === issue.id}
                  onSelect={(selected) => setSelectedIssue(selected)}
                />
              ))}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-40"
                >
                  &larr; Previous
                </button>
                <span className="text-xs font-mono text-zinc-400">Page {page}</span>
                <button
                  type="button"
                  disabled={issues.length < 30}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-40"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Issue Analysis & Contribution Guide (7 cols) */}
        <div className="lg:col-span-7 sticky top-6">
          {selectedIssue ? (
            <IssueAnalysisView
              repoFullName={repoFullName}
              defaultBranch={defaultBranch}
              issue={selectedIssue}
              onSelectFile={onSelectFile}
            />
          ) : (
            <div className="p-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center flex flex-col items-center justify-center gap-3 text-zinc-400">
              <svg className="w-12 h-12 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Select an issue on the left to inspect requirement breakdown and contribution guide.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
