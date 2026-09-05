import React from "react";
import Image from "next/image";
import type { RepoOverview } from "@/lib/github/types.ts";
import { StatBadge } from "./StatBadge.tsx";
import { LanguageBar } from "./LanguageBar.tsx";

interface RepoOverviewCardProps {
  repo: RepoOverview;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

export function RepoOverviewCard({ repo }: RepoOverviewCardProps) {
  return (
    <div className="w-full bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm transition-all">
      {/* Header Section */}
      <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Owner Avatar */}
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-zinc-200 dark:ring-zinc-700 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={repo.owner.avatarUrl}
                alt={repo.owner.login}
                width={56}
                height={56}
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Repo Title & Details */}
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={repo.owner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:underline"
                >
                  {repo.owner.login}
                </a>
                <span className="text-zinc-400 dark:text-zinc-600">/</span>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {repo.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Public
                </span>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed max-w-3xl">
                {repo.description || (
                  <span className="italic text-zinc-400">
                    No description provided for this repository.
                  </span>
                )}
              </p>

              {/* Homepage Link if available */}
              {repo.homepage && (
                <div className="flex items-center gap-1.5 mt-2">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <a
                    href={repo.homepage.startsWith("http") ? repo.homepage : `https://${repo.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate max-w-md"
                  >
                    {repo.homepage}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* GitHub External Button */}
          <div className="flex items-center gap-2 self-start">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>View on GitHub</span>
            </a>
          </div>
        </div>

        {/* Topics / Tags */}
        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {repo.topics.map((topic) => (
              <span
                key={topic}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-950/20">
        <StatBadge
          label="Stars"
          value={repo.stars}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />
        <StatBadge
          label="Forks"
          value={repo.forks}
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          }
        />
        <StatBadge
          label="Watchers"
          value={repo.watchers}
          icon={
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatBadge
          label="Open Issues"
          value={repo.openIssues}
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatBadge
          label="License"
          value={repo.license?.spdxId || "No License"}
          icon={
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatBadge
          label="Branch"
          value={repo.defaultBranch}
          icon={
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          }
        />
      </div>

      {/* Languages & Latest Activity Section */}
      <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
        {/* Language Breakdown */}
        <div className="flex-1">
          <LanguageBar languages={repo.languages} />
        </div>

        {/* Latest Activity / Commit */}
        {repo.latestCommit && (
          <div className="lg:w-80 flex flex-col gap-2 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Latest Commit
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                {formatRelativeTime(repo.latestCommit.date)}
              </span>
            </div>

            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
              {repo.latestCommit.message}
            </p>

            <div className="flex items-center justify-between pt-2 mt-auto border-t border-zinc-200/50 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {repo.latestCommit.authorAvatarUrl ? (
                  <Image
                    src={repo.latestCommit.authorAvatarUrl}
                    alt={repo.latestCommit.authorName}
                    width={18}
                    height={18}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
                )}
                <span className="truncate max-w-[110px]">
                  {repo.latestCommit.authorName}
                </span>
              </div>

              <a
                href={repo.latestCommit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-blue-500 transition-colors"
                title="View commit on GitHub"
              >
                {repo.latestCommit.shortSha}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
