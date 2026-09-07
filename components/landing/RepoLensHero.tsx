'use client';

import React from 'react';
import { motion } from 'motion/react';
import { RepoLensWarpHeading } from './RepoLensWarpHeading';
import { RepoSearchInput } from '@/components/RepoSearchInput';
import { QuickTryRepos } from '@/components/QuickTryRepos';

interface RepoLensHeroProps {
  currentRepo: string;
  isLoading: boolean;
  onSearch: (repo: string) => void;
}

export function RepoLensHero({ currentRepo, isLoading, onSearch }: RepoLensHeroProps) {
  return (
    <div className="w-full flex flex-col items-center text-center py-6 sm:py-10 px-4 relative z-10">
      {/* Atmospheric Purpose Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3 shadow-sm backdrop-blur-sm"
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Understand any codebase in seconds
      </motion.div>

      {/* Signature Warp Text Headline */}
      <RepoLensWarpHeading />

      {/* Core Purpose Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed"
      >
        Paste any public GitHub repository URL below to inspect architecture, explore directory topologies, and discover where to start reading the code.
      </motion.p>

      {/* Interactive Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="w-full max-w-2xl mt-8 flex flex-col gap-3"
      >
        <RepoSearchInput
          initialValue={currentRepo}
          isLoading={isLoading}
          onSearch={onSearch}
        />
        <QuickTryRepos
          onSelect={onSearch}
          currentRepo={currentRepo}
        />
      </motion.div>

      {/* 4 Feature Intelligence Pillars Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 w-full max-w-5xl text-left"
      >
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:border-blue-500/40 hover:bg-white/90 dark:hover:bg-zinc-900/80 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            1. Repository Overview
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Live metadata, language distributions, recent commits, and health telemetry at a glance.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:border-indigo-500/40 hover:bg-white/90 dark:hover:bg-zinc-900/80 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            2. Live Git Tree
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Recursive directory navigation and formatted previews for READMEs and package manifests.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:border-cyan-500/40 hover:bg-white/90 dark:hover:bg-zinc-900/80 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-cyan-100/80 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            3. Where to Start
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Automated newcomer reading order, key entry points, and architectural piece connections.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:border-purple-500/40 hover:bg-white/90 dark:hover:bg-zinc-900/80 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-100/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            4. Ask the Repo
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            AI-powered conversational Q&A grounded in the actual codebase structure and code logic.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RepoLensHero;
