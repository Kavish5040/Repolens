"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { TreeNode } from "@/lib/github/types.ts";
import { FileSearchInput } from "./FileSearchInput.tsx";
import { TreeNodeItem } from "./TreeNodeItem.tsx";

interface FileTreeProps {
  rootNodes: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (node: TreeNode) => void;
  totalFiles: number;
  totalDirectories: number;
  defaultExpandedFolders?: string[];
}

export function FileTree({
  rootNodes,
  selectedPath,
  onSelectFile,
  totalFiles,
  totalDirectories,
  defaultExpandedFolders = [],
}: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>(defaultExpandedFolders);
    // Expand root level directories by default if <5
    for (const node of rootNodes) {
      if (node.type === "directory" && rootNodes.length <= 8) {
        initial.add(node.path);
      }
    }
    return initial;
  });

  // Collect all directory paths for Expand All
  const allDirectoryPaths = useMemo(() => {
    const paths = new Set<string>();
    function traverse(node: TreeNode) {
      if (node.type === "directory") {
        paths.add(node.path);
        if (node.children) {
          node.children.forEach(traverse);
        }
      }
    }
    rootNodes.forEach(traverse);
    return paths;
  }, [rootNodes]);

  // Flattened search matching & auto-expand calculation
  const { filteredNodes, matchCount, autoExpandPaths } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredNodes: rootNodes, matchCount: totalFiles, autoExpandPaths: new Set<string>() };
    }

    const query = searchQuery.toLowerCase().trim();
    let count = 0;
    const requiredExpands = new Set<string>();

    function filterNode(node: TreeNode): TreeNode | null {
      if (node.type === "file") {
        const matches =
          node.name.toLowerCase().includes(query) ||
          node.path.toLowerCase().includes(query);
        if (matches) {
          count++;
          return node;
        }
        return null;
      }

      // Directory
      const matchedChildren: TreeNode[] = [];
      if (node.children) {
        for (const child of node.children) {
          const filteredChild = filterNode(child);
          if (filteredChild) {
            matchedChildren.push(filteredChild);
          }
        }
      }

      if (matchedChildren.length > 0) {
        requiredExpands.add(node.path);
        return {
          ...node,
          children: matchedChildren,
          fileCount: matchedChildren.reduce(
            (acc, c) => acc + (c.type === "file" ? 1 : (c.fileCount || 0)),
            0
          ),
        };
      }

      return null;
    }

    const filtered: TreeNode[] = [];
    for (const rootNode of rootNodes) {
      const filteredRoot = filterNode(rootNode);
      if (filteredRoot) {
        filtered.push(filteredRoot);
      }
    }

    return { filteredNodes: filtered, matchCount: count, autoExpandPaths: requiredExpands };
  }, [rootNodes, searchQuery, totalFiles]);

  // If search query changes, auto-expand matching directories
  useEffect(() => {
    if (searchQuery.trim() && autoExpandPaths.size > 0) {
      setExpandedPaths((prev) => new Set([...prev, ...autoExpandPaths]));
    }
  }, [searchQuery, autoExpandPaths]);

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedPaths(new Set(allDirectoryPaths));
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set());
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-2.5">
        <FileSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          matchCount={searchQuery ? matchCount : undefined}
          totalFiles={totalFiles}
        />

        <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 px-1">
          <span>
            {totalFiles} files &bull; {totalDirectories} folders
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Expand all
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        {filteredNodes.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No files matched &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredNodes.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              expandedPaths={expandedPaths}
              onToggleExpand={handleToggleExpand}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}
