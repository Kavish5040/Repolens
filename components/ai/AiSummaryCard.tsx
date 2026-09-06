"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessageItem } from "./ChatMessageItem.tsx";
import type { ChatMessage } from "@/lib/ai/types.ts";

interface AiSummaryCardProps {
  repoFullName: string;
  defaultBranch: string;
  onSelectFile?: (path: string) => void;
}

export function AiSummaryCard({
  repoFullName,
  defaultBranch,
  onSelectFile,
}: AiSummaryCardProps) {
  const [summaryText, setSummaryText] = useState<string>("");
  const [suppliedFiles, setSuppliedFiles] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSummary = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setError(null);
    setSummaryText("");
    setHasGenerated(true);

    try {
      const res = await fetch("/api/repo/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repoFullName,
          branch: defaultBranch,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMessage = `Error ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) errMessage = errData.error.message;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      // Extract supplied files header for citation validation
      const suppliedFilesHeader = res.headers.get("X-Supplied-Files");
      if (suppliedFilesHeader) {
        try {
          setSuppliedFiles(JSON.parse(suppliedFilesHeader));
        } catch {
          // ignore
        }
      }

      if (!res.body) {
        throw new Error("No response body received.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setSummaryText((prev) => prev + chunk);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to generate AI summary.");
    } finally {
      setIsStreaming(false);
    }
  }, [repoFullName, defaultBranch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const dummyMessage: ChatMessage = {
    id: "summary",
    role: "assistant",
    content: summaryText,
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
            ✨
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              AI Repository Summary
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Grounded architectural overview, key subsystems, and engineering observations
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isStreaming}
          onClick={fetchSummary}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5"
        >
          {isStreaming ? (
            <>
              <span className="animate-spin text-xs">⏳</span>
              <span>Analyzing...</span>
            </>
          ) : hasGenerated ? (
            <>
              <span>🔄</span>
              <span>Regenerate</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Generate Summary</span>
            </>
          )}
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 flex flex-col gap-4 min-h-[140px]">
        {error ? (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs flex flex-col gap-2">
            <span className="font-bold">Summary Generation Notice:</span>
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchSummary}
              className="self-start px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors mt-1 text-[11px]"
            >
              Try Again
            </button>
          </div>
        ) : isStreaming && !summaryText ? (
          <div className="flex flex-col gap-3 animate-pulse py-4">
            <div className="h-4 bg-zinc-200/70 dark:bg-zinc-800/60 rounded w-3/4" />
            <div className="h-4 bg-zinc-200/70 dark:bg-zinc-800/60 rounded w-full" />
            <div className="h-4 bg-zinc-200/70 dark:bg-zinc-800/60 rounded w-5/6" />
            <div className="h-4 bg-zinc-200/70 dark:bg-zinc-800/60 rounded w-2/3" />
          </div>
        ) : summaryText ? (
          <div className="flex flex-col gap-2">
            <ChatMessageItem
              message={dummyMessage}
              suppliedFiles={suppliedFiles}
              onSelectFile={onSelectFile}
            />
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1 align-middle" />
            )}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click <strong>Generate Summary</strong> to analyze this repository's architectural patterns and key engineering observations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
