"use client";

import React, { useState } from "react";

interface DocumentViewerProps {
  content: string;
  fileName: string;
  path: string;
}

/**
 * Parses and renders Markdown text with GitHub-flavored styling.
 */
export function DocumentViewer({ content, fileName, path }: DocumentViewerProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Pre-process markdown into blocks
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  let i = 0;
  let codeBlockCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block: ```language
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      const fullCode = codeLines.join("\n");
      const blockId = codeBlockCounter++;
      const isCopied = copiedCodeIndex === blockId;

      blocks.push(
        <div key={`code-${i}-${blockId}`} className="my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-black text-zinc-100 shadow-md">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 dark:bg-zinc-900 border-b border-zinc-700/60 text-xs text-zinc-400 font-mono">
            <span>{lang}</span>
            <button
              type="button"
              onClick={() => handleCopyCode(fullCode, blockId)}
              className="hover:text-white transition-colors flex items-center gap-1 text-[11px]"
            >
              {isCopied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-zinc-200">
            <code>{fullCode}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={`h1-${i}`} className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pb-2 mb-4 mt-6 border-b border-zinc-200 dark:border-zinc-800">
          {renderInlineFormatting(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${i}`} className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pb-1.5 mb-3 mt-5 border-b border-zinc-100 dark:border-zinc-850">
          {renderInlineFormatting(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-4">
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3">
          {renderInlineFormatting(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote & Alerts
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }

      const firstQuoteLine = quoteLines[0].trim();
      let alertType: "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION" | null = null;
      if (firstQuoteLine.startsWith("[!NOTE]")) alertType = "NOTE";
      else if (firstQuoteLine.startsWith("[!TIP]")) alertType = "TIP";
      else if (firstQuoteLine.startsWith("[!IMPORTANT]")) alertType = "IMPORTANT";
      else if (firstQuoteLine.startsWith("[!WARNING]")) alertType = "WARNING";
      else if (firstQuoteLine.startsWith("[!CAUTION]")) alertType = "CAUTION";

      const alertContent = alertType ? quoteLines.slice(1).join(" ") : quoteLines.join(" ");

      if (alertType) {
        const alertStyles = {
          NOTE: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200",
          TIP: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200",
          IMPORTANT: "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200",
          WARNING: "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200",
          CAUTION: "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200",
        }[alertType];

        blocks.push(
          <div key={`alert-${i}`} className={`my-3 p-3.5 rounded-xl border-l-4 text-xs leading-relaxed ${alertStyles}`}>
            <span className="font-bold uppercase tracking-wider block mb-1">{alertType}</span>
            {renderInlineFormatting(alertContent)}
          </div>
        );
      } else {
        blocks.push(
          <blockquote key={`quote-${i}`} className="my-3 pl-4 border-l-3 border-zinc-300 dark:border-zinc-700 italic text-zinc-600 dark:text-zinc-400 text-sm">
            {renderInlineFormatting(quoteLines.join(" "))}
          </blockquote>
        );
      }
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      blocks.push(<hr key={`hr-${i}`} className="my-6 border-zinc-200 dark:border-zinc-800" />);
      i++;
      continue;
    }

    // List item (Unordered: -, *, +)
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1.5 pl-5 list-disc text-sm text-zinc-700 dark:text-zinc-300">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // List item (Ordered: 1., 2.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1.5 pl-5 list-decimal text-sm text-zinc-700 dark:text-zinc-300">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular Paragraph
    if (line.trim()) {
      blocks.push(
        <p key={`p-${i}`} className="my-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {renderInlineFormatting(line)}
        </p>
      );
    }

    i++;
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Document Header Bar */}
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 truncate">
          <span className="p-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
            MD
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {fileName}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600 truncate text-[11px]">
            ({path})
          </span>
        </div>
      </div>

      {/* Rendered Markdown Body */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 max-w-4xl">
        {blocks}
      </div>
    </div>
  );
}

/**
 * Helper to parse bold (**), italic (* or _), code (`code`), and links ([text](url)) in a single line.
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Regex to match code `...`, bold **...**, links [...](...), and badges
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[0.85em] text-blue-600 dark:text-blue-400 font-semibold"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
