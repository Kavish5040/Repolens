"use client";

import React, { useState } from "react";
import type { ChatMessage } from "@/lib/ai/types.ts";
import { extractAndValidateCitations } from "@/lib/ai/citations.ts";

interface ChatMessageItemProps {
  message: ChatMessage;
  suppliedFiles?: string[];
  onSelectFile?: (path: string) => void;
}

export function ChatMessageItem({
  message,
  suppliedFiles = [],
  onSelectFile,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render text with clickable file citations
  const renderContentWithCitations = (text: string) => {
    const citations = extractAndValidateCitations(text, suppliedFiles);
    if (citations.length === 0) {
      return <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{text}</div>;
    }

    // Split text by [file:...] pattern
    const regex = /\[file:([^\]\s]+)\]/gi;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = regex.lastIndex;

      // Add text before citation
      if (matchStart > lastIndex) {
        elements.push(text.substring(lastIndex, matchStart));
      }

      const raw = match[0];
      const citation = citations.find((c) => c.raw.toLowerCase() === raw.toLowerCase());
      const path = citation?.path || match[1].trim();
      const isValid = citation ? citation.isValid : true;

      elements.push(
        <button
          key={`${matchStart}-${path}`}
          type="button"
          onClick={() => onSelectFile?.(path)}
          className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors align-baseline ${
            isValid
              ? "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
          }`}
          title={isValid ? `Click to inspect ${path} in File Explorer` : "Unverified path"}
        >
          <span>📄</span>
          <span>{path}</span>
          {citation?.lineRange && <span className="text-zinc-400 text-[10px]">:{citation.lineRange}</span>}
        </button>
      );

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{elements}</div>;
  };

  return (
    <div
      className={`flex items-start gap-3 w-full ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
          isUser
            ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
            : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
        }`}
      >
        {isUser ? "👤" : "✨"}
      </div>

      {/* Bubble */}
      <div
        className={`relative group max-w-[85%] rounded-2xl px-4 py-3 shadow-2xs border ${
          isUser
            ? "bg-blue-600 text-white border-blue-600 rounded-tr-xs"
            : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200/80 dark:border-zinc-800 rounded-tl-xs"
        }`}
      >
        {renderContentWithCitations(message.content)}

        {!isUser && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-[10px] transition-colors"
              title="Copy answer"
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
