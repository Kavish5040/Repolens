"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { TreeNode } from "@/lib/github/types.ts";

interface TreeNodeItemProps {
  node: TreeNode;
  selectedPath: string | null;
  onSelectFile: (node: TreeNode) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  depth?: number;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(extension?: string, name?: string) {
  const ext = (extension || "").replace(/^\./, "").toLowerCase();
  const lowerName = (name || "").toLowerCase();

  if (lowerName === "dockerfile" || ext === "dockerfile") {
    return <span className="text-cyan-500 font-bold text-[10px]">🐳</span>;
  }
  if (lowerName === "package.json" || lowerName === "cargo.toml" || lowerName === "pyproject.toml" || lowerName === "go.mod") {
    return <span className="text-amber-500 font-bold text-[10px]">📦</span>;
  }

  switch (ext) {
    case "ts":
    case "tsx":
      return <span className="text-blue-500 font-bold text-[10px] bg-blue-100 dark:bg-blue-950/60 px-1 rounded">TS</span>;
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return <span className="text-yellow-600 dark:text-yellow-400 font-bold text-[10px] bg-yellow-100 dark:bg-yellow-950/60 px-1 rounded">JS</span>;
    case "py":
      return <span className="text-emerald-500 font-bold text-[10px]">🐍</span>;
    case "rs":
      return <span className="text-orange-500 font-bold text-[10px]">🦀</span>;
    case "go":
      return <span className="text-cyan-500 font-bold text-[10px]">🐹</span>;
    case "md":
    case "markdown":
    case "mdx":
      return <span className="text-purple-500 font-bold text-[10px]">📝</span>;
    case "json":
    case "yaml":
    case "yml":
    case "toml":
      return <span className="text-amber-500 font-bold text-[10px]">⚙️</span>;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <span className="text-pink-500 font-bold text-[10px]">🎨</span>;
    case "html":
      return <span className="text-orange-600 font-bold text-[10px]">🌐</span>;
    default:
      return (
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
}

export function TreeNodeItem({
  node,
  selectedPath,
  onSelectFile,
  expandedPaths,
  onToggleExpand,
  depth = 0,
}: TreeNodeItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const isDirectory = node.type === "directory";
  const isExpanded = isDirectory && expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      onToggleExpand(node.path);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <div className="flex flex-col select-none text-xs">
      <motion.div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        whileHover={shouldReduceMotion ? undefined : { x: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`group relative flex items-center justify-between py-1.5 pr-2.5 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? "bg-blue-600 text-white font-semibold shadow-xs"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Chevron for directories */}
          {isDirectory ? (
            <span
              className={`p-0.5 rounded text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-transform duration-200 ease-out ${
                isExpanded ? "rotate-90 text-zinc-600 dark:text-zinc-200" : ""
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          ) : (
            <span className="w-3" />
          )}

          {/* Icon */}
          <div className="flex items-center justify-center flex-shrink-0">
            {isDirectory ? (
              <svg
                className={`w-4 h-4 ${
                  isExpanded
                    ? "text-blue-500 fill-blue-500/20"
                    : "text-amber-500 fill-amber-500/20"
                }`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            ) : (
              getFileIcon(node.extension, node.name)
            )}
          </div>

          {/* Node Name */}
          <span className="truncate" title={node.path}>
            {node.name}
          </span>

          {/* Key Document Badge */}
          {node.isKeyDoc && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              }`}
            >
              {node.keyDocType}
            </span>
          )}
        </div>

        {/* Directory Count or File Size */}
        <div className="flex-shrink-0 text-[10px] pl-2">
          {isDirectory ? (
            <span
              className={`${
                isSelected ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {node.fileCount}
            </span>
          ) : (
            <span
              className={`${
                isSelected ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
      </motion.div>

      {/* Recursive Children Rendering with Smooth Height Animation */}
      <AnimatePresence initial={false}>
        {isDirectory && isExpanded && node.children && node.children.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                expandedPaths={expandedPaths}
                onToggleExpand={onToggleExpand}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
