"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { ContributorIssue } from "@/lib/contributor/types.ts";
import { ReadinessScoreWidget } from "./ReadinessScoreWidget.tsx";

interface IssueCardProps {
  issue: ContributorIssue;
  isSelected: boolean;
  onSelect: (issue: ContributorIssue) => void;
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

export function IssueCard({ issue, isSelected, onSelect }: IssueCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const difficultyBadge = {
    beginner: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    intermediate: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    advanced: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
  }[issue.difficulty];

  const difficultyLabel = {
    beginner: "Beginner Friendly",
    intermediate: "Intermediate Scope",
    advanced: "Advanced / Core",
  }[issue.difficulty];

  return (
    <motion.div
      onClick={() => onSelect(issue)}
      whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.006 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 shadow-2xs hover:shadow-md hover:shadow-blue-500/5 ${
        isSelected
          ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm ring-1 ring-blue-500/20"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50"
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
            #{issue.number}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${difficultyBadge}`}
            title={issue.difficultyReason}
          >
            {difficultyLabel}
          </span>
        </div>

        <ReadinessScoreWidget readiness={issue.readiness} compact />
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
        {issue.title}
      </h4>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {issue.labels.slice(0, 4).map((label) => (
            <span
              key={label.name}
              className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            >
              {label.name}
            </span>
          ))}
          {issue.labels.length > 4 && (
            <span className="text-[10px] text-zinc-400 font-mono">
              +{issue.labels.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <Image
            src={issue.author.avatarUrl}
            alt={issue.author.login}
            width={16}
            height={16}
            unoptimized
            className="w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-700"
          />
          <span className="truncate max-w-[120px]">@{issue.author.login}</span>
          <span>&bull;</span>
          <span>{formatRelativeTime(issue.updatedAt)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title={`${issue.commentsCount} comments`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-mono">{issue.commentsCount}</span>
          </div>

          <a
            href={issue.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Open issue on GitHub"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
