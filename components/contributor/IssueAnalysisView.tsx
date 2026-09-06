"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type {
  ContributorIssue,
  LocalizedFileCandidate,
  VerifiedTestCommand,
} from "@/lib/contributor/types.ts";
import { ReadinessScoreWidget } from "./ReadinessScoreWidget.tsx";

interface IssueAnalysisViewProps {
  repoFullName: string;
  defaultBranch: string;
  issue: ContributorIssue;
  onSelectFile: (filePath: string) => void;
}

export function IssueAnalysisView({
  repoFullName,
  defaultBranch,
  issue,
  onSelectFile,
}: IssueAnalysisViewProps) {
  const [analysisText, setAnalysisText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliedFiles, setSuppliedFiles] = useState<string[]>([]);
  const [localizedCandidates, setLocalizedCandidates] = useState<LocalizedFileCandidate[]>([]);
  const [verifiedCommands, setVerifiedCommands] = useState<VerifiedTestCommand[]>([]);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-trigger analysis when issue changes
  useEffect(() => {
    setAnalysisText("");
    setError(null);
    setSuppliedFiles([]);
    setLocalizedCandidates([]);
    setVerifiedCommands([]);

    handleStartAnalysis();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue.number, repoFullName]);

  const handleStartAnalysis = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setError(null);
    setAnalysisText("");

    try {
      const response = await fetch("/api/repo/contributor/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: repoFullName,
          branch: defaultBranch,
          issue,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMsg = `Failed to generate analysis (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errMsg = errData.error.message;
          }
        } catch {}
        throw new Error(errMsg);
      }

      // Read response headers for grounded context metadata
      const suppliedFilesHeader = response.headers.get("X-Supplied-Files");
      if (suppliedFilesHeader) {
        try {
          setSuppliedFiles(JSON.parse(suppliedFilesHeader));
        } catch {}
      }

      const candidatesHeader = response.headers.get("X-Localized-Candidates");
      if (candidatesHeader) {
        try {
          setLocalizedCandidates(JSON.parse(candidatesHeader));
        } catch {}
      }

      const verifiedCommandsHeader = response.headers.get("X-Verified-Commands");
      if (verifiedCommandsHeader) {
        try {
          setVerifiedCommands(JSON.parse(verifiedCommandsHeader));
        } catch {}
      }

      if (!response.body) {
        throw new Error("Response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        streamBuffer += textChunk;
        setAnalysisText(streamBuffer);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      // If we already received substantial streamed text, keep it visible
      setError((prev) => (!analysisText ? (err instanceof Error ? err.message : "Analysis stream failed.") : prev));
    } finally {
      setIsStreaming(false);
    }
  };

  const copyToClipboard = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  // Render text with clickable [file:path] citation pills for verified supplied files only
  const renderFormattedAnalysis = (text: string) => {
    const parts = text.split(/(\[file:[a-zA-Z0-9_\-./]+\])/g);

    return parts.map((part, idx) => {
      const match = part.match(/^\[file:([a-zA-Z0-9_\-./]+)\]$/);
      if (match) {
        const filePath = match[1];
        const isSupplied = suppliedFiles.includes(filePath);

        if (isSupplied) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectFile(filePath)}
              className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/70 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 transition-colors"
              title={`Click to open ${filePath} in File Explorer`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{filePath}</span>
            </button>
          );
        }

        // Sanitize unverified/hallucinated citation to monospace text
        return (
          <code key={idx} className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filePath}
          </code>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
      {/* Header Info */}
      <div className="flex flex-col gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-zinc-500 dark:text-zinc-400">
                #{issue.number}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  issue.state === "open"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                }`}
              >
                {issue.state.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400">&bull;</span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Image
                  src={issue.author.avatarUrl}
                  alt={issue.author.login}
                  width={16}
                  height={16}
                  unoptimized
                  className="w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-700"
                />
                <span>@{issue.author.login}</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {issue.title}
            </h3>
          </div>

          <a
            href={issue.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors shrink-0"
          >
            <span>GitHub</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Readiness Score Breakdown */}
        <ReadinessScoreWidget readiness={issue.readiness} />
      </div>

      {/* Localized Candidate Files Section */}
      {localizedCandidates.length > 0 && (
        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Localized Codebase Files ({localizedCandidates.length})
            </span>
            <span className="text-[11px] text-zinc-400">Click to inspect in File Explorer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {localizedCandidates.map((candidate) => {
              const badge = {
                high: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300",
                medium: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300",
                low: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300",
              }[candidate.confidence];

              return (
                <button
                  key={candidate.path}
                  type="button"
                  onClick={() => onSelectFile(candidate.path)}
                  className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 text-left flex flex-col gap-1 transition-all group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline truncate">
                      {candidate.path}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold border ${badge}`}>
                      {candidate.confidence.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {candidate.reason}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Test Commands Section */}
      {verifiedCommands.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Test Runner Commands
            </span>
            <span className="text-[11px] text-purple-700/80 dark:text-purple-400/80">Extracted from repository manifests</span>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {verifiedCommands.map((cmd) => (
              <div
                key={cmd.command}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {cmd.command}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {cmd.description} ({cmd.source})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(cmd.command)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  {copiedCommand === cmd.command ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Contribution Guide Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              AI Contribution Pathway & Requirement Guide
            </h4>
          </div>

          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={isStreaming}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {isStreaming ? "Streaming..." : "Regenerate Guide"}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Content Box */}
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
          {analysisText ? (
            renderFormattedAnalysis(analysisText)
          ) : isStreaming ? (
            <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 py-4">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>Analyzing issue context against repository architecture & guidelines...</span>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">No analysis generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
