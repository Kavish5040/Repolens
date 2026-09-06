"use client";

import React, { useState } from "react";
import type { FileContentData } from "@/lib/github/types.ts";

interface CodeViewerProps {
  file: FileContentData;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CodeViewer({ file }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const lines = file.content.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Code Header Bar */}
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/50 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {file.name}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px] truncate">
            {file.path}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {file.language}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
            {lines.length} {lines.length === 1 ? "line" : "lines"} &bull; {formatFileSize(file.size)}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            disabled={file.isBinary}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {copied ? (
              <>
                <span className="text-emerald-500">✓</span>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>

          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              title="Open raw file on GitHub"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Code Text Content */}
      <div className="flex-1 overflow-auto bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed p-4 scrollbar-thin scrollbar-thumb-zinc-700">
        {file.isBinary ? (
          <div className="p-8 text-center text-zinc-400">
            <p className="text-sm font-semibold mb-1">Binary File</p>
            <p className="text-xs">Binary file previews are not supported in the code viewer.</p>
          </div>
        ) : file.isTruncated ? (
          <div className="p-8 text-center text-amber-400">
            <p className="text-sm font-semibold mb-1">File Too Large ({formatFileSize(file.size)})</p>
            <p className="text-xs text-zinc-400">Direct viewing is disabled to prevent browser freezing.</p>
          </div>
        ) : (
          <div className="flex min-w-full">
            {/* Line Numbers */}
            <div className="flex flex-col text-right pr-4 text-zinc-600 select-none font-mono text-[11px] border-r border-zinc-800/80 mr-4">
              {lines.map((_, i) => (
                <span key={i} className="leading-6">
                  {i + 1}
                </span>
              ))}
            </div>

            {/* Code Lines */}
            <pre className="flex-1 overflow-x-auto text-zinc-200 font-mono text-[11px]">
              {lines.map((line, i) => (
                <div key={i} className="leading-6 hover:bg-zinc-900/60 px-1 rounded">
                  {line || " "}
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
