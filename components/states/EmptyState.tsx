import React from "react";

export function EmptyState() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center py-12 px-4 animate-fadeIn">
      {/* Visual Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-6 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Understand any codebase in seconds
      </div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight max-w-2xl leading-tight">
        Deep Repository Intelligence for Developers
      </h2>

      <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 max-w-xl leading-relaxed">
        Paste any public GitHub repository URL above to inspect architecture, explore directory topologies, and discover where to start reading the code.
      </p>

      {/* 4 Feature Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 w-full text-left">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:border-blue-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
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
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:border-indigo-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
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
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:border-cyan-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
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
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:border-purple-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
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
      </div>
    </div>
  );
}
