"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const shouldReduceMotion = useReducedMotion();
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
        <motion.button
          key={`${matchStart}-${path}`}
          type="button"
          onClick={() => onSelectFile?.(path)}
          initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -1 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className={`inline-flex items-center gap-1.5 mx-1 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold align-baseline shadow-2xs group/chip transition-all ${
            isValid
              ? "bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/70 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white border border-blue-200/80 hover:border-blue-600 dark:border-blue-800/60 cursor-pointer"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
          }`}
          title={isValid ? `Click to open ${path} in File Explorer` : "Unverified path"}
        >
          <span className="text-[10px]">📄</span>
          <span>{path}</span>
          {citation?.lineRange && <span className="opacity-75 text-[10px]">:{citation.lineRange}</span>}
          {isValid && (
            <span className="text-[10px] opacity-0 group-hover/chip:opacity-100 transform -translate-x-1 group-hover/chip:translate-x-0 transition-all font-sans font-bold">
              &rarr;
            </span>
          )}
        </motion.button>
      );

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{elements}</div>;
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`flex items-start gap-3 w-full ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
          isUser
            ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
            : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20 shadow-md"
        }`}
      >
        {isUser ? "👤" : "✨"}
      </div>

      {/* Bubble */}
      <div
        className={`relative group max-w-[85%] rounded-2xl px-4 py-3 shadow-2xs border transition-shadow ${
          isUser
            ? "bg-blue-600 text-white border-blue-600 rounded-tr-xs shadow-blue-600/10"
            : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200/80 dark:border-zinc-800 rounded-tl-xs"
        }`}
      >
        {renderContentWithCitations(message.content)}

        {!isUser && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-[10px] transition-colors"
              title="Copy answer"
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
