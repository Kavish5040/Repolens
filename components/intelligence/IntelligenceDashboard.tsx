"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { StructuralInsightsBanner } from "./StructuralInsightsBanner.tsx";
import { WhereToStartCard } from "./WhereToStartCard.tsx";
import { ReadingOrderList } from "./ReadingOrderList.tsx";
import { TechSignalsCard } from "./TechSignalsCard.tsx";
import { EntryPointsList } from "./EntryPointsList.tsx";
import { DirectoryTopologyGrid } from "./DirectoryTopologyGrid.tsx";
import type { RepoIntelligenceData } from "@/lib/github/intelligence-types.ts";
import type { ApiResponse } from "@/lib/github/types.ts";
import { loadPat } from "@/lib/pat/storage.ts";

const dashboardVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

interface IntelligenceDashboardProps {
  repoFullName: string;
  defaultBranch: string;
  onNavigateToFile?: (path: string) => void;
  onNavigateToFolder?: (path: string) => void;
  pat?: string | null;
}

export function IntelligenceDashboard({
  repoFullName,
  defaultBranch,
  onNavigateToFile,
  onNavigateToFolder,
}: IntelligenceDashboardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [intelligence, setIntelligence] = useState<RepoIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {};
      const currentPat = loadPat();
      if (currentPat) headers["x-github-token"] = currentPat;
      const res = await fetch(
        `/api/repo/intelligence?repo=${encodeURIComponent(repoFullName)}&branch=${encodeURIComponent(defaultBranch)}`,
        { headers }
      );
      const data: ApiResponse<RepoIntelligenceData> = await res.json();

      if (data.success) {
        setIntelligence(data.data);
      } else {
        setError(data.error.message || "Failed to analyze repository intelligence.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence data.");
    } finally {
      setIsLoading(false);
    }
  }, [repoFullName, defaultBranch]);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  const handleTargetNavigation = (path: string) => {
    // Check if target is a file or folder (or has an extension)
    const isLikelyFile = path.includes(".") || !path.includes("/");
    if (isLikelyFile) {
      onNavigateToFile?.(path);
    } else {
      onNavigateToFolder?.(path);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        {/* Insights skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-2xl" />
          ))}
        </div>

        {/* Where to start skeleton */}
        <div className="h-80 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-2xl" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-2xl" />
          <div className="h-64 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !intelligence) {
    return (
      <div className="w-full p-8 rounded-2xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20 text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
          ⚠️
        </div>
        <h4 className="text-base font-bold text-rose-900 dark:text-rose-200">
          Intelligence Analysis Failed
        </h4>
        <p className="text-xs text-rose-700 dark:text-rose-400 max-w-md">
          {error || "Unable to generate intelligence report for this repository."}
        </p>
        <button
          type="button"
          onClick={fetchIntelligence}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : dashboardVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      className="flex flex-col gap-6 w-full"
    >
      {/* 1. Structural Highlights Banner */}
      <motion.div variants={shouldReduceMotion ? undefined : sectionVariants}>
        <StructuralInsightsBanner insights={intelligence.insights} />
      </motion.div>

      {/* 2. Where Should I Start? (Primary Guided Pathway) */}
      <motion.div variants={shouldReduceMotion ? undefined : sectionVariants}>
        <WhereToStartCard
          steps={intelligence.whereToStart}
          onNavigateToTarget={handleTargetNavigation}
        />
      </motion.div>

      {/* 3. Tech Stack Signals & Application Entry Points */}
      <motion.div
        variants={shouldReduceMotion ? undefined : sectionVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        {/* Left Column: Tech Signals & Reading Order */}
        <div className="flex flex-col gap-6 w-full">
          <TechSignalsCard technologies={intelligence.technologies} />
          <ReadingOrderList
            items={intelligence.readingOrder}
            onSelectItem={(path) => onNavigateToFile?.(path)}
          />
        </div>

        {/* Right Column: Entry Points & Directory Topology */}
        <div className="flex flex-col gap-6 w-full">
          <EntryPointsList
            entryPoints={intelligence.entryPoints}
            onSelectEntry={(path) => onNavigateToFile?.(path)}
          />
          <DirectoryTopologyGrid
            classifications={intelligence.structure.classifications}
            onSelectDirectory={(path) => onNavigateToFolder?.(path)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
