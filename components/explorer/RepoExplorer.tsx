"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  TreeNode,
  KeyDocument,
  FileContentData,
  RepoTreeData,
  ApiResponse,
} from "@/lib/github/types.ts";
import { FileTree } from "./FileTree.tsx";
import { KeyDocsBar } from "./KeyDocsBar.tsx";
import { DocumentViewer } from "./DocumentViewer.tsx";
import { CodeViewer } from "./CodeViewer.tsx";
import { ErrorBanner } from "@/components/states/ErrorBanner.tsx";
import { loadPat } from "@/lib/pat/storage.ts";

interface RepoExplorerProps {
  repoFullName: string;
  defaultBranch?: string;
  initialFilePath?: string | null;
  onFileSelect?: (path: string) => void;
  pat?: string | null;
}

export function RepoExplorer({
  repoFullName,
  defaultBranch,
  initialFilePath,
  onFileSelect,
}: RepoExplorerProps) {
  // Tree state
  const [treeData, setTreeData] = useState<RepoTreeData | null>(null);
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  // File content state
  const [selectedPath, setSelectedPath] = useState<string | null>(initialFilePath || null);
  const [fileContent, setFileContent] = useState<FileContentData | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Mobile drawer toggle
  const [isMobileTreeOpen, setIsMobileTreeOpen] = useState(false);

  // Fetch Tree
  const fetchTree = useCallback(async () => {
    setIsTreeLoading(true);
    setTreeError(null);

    try {
      const branchQuery = defaultBranch ? `&branch=${encodeURIComponent(defaultBranch)}` : "";
      const headers: HeadersInit = {};
      const currentPat = loadPat();
      if (currentPat) headers["x-github-token"] = currentPat;
      const res = await fetch(`/api/repo/tree?repo=${encodeURIComponent(repoFullName)}${branchQuery}`, { headers });
      const body: ApiResponse<RepoTreeData> = await res.json();

      if (body.success) {
        setTreeData(body.data);
        // Default to README or first key doc if no initial file is selected
        if (!selectedPath && body.data.keyDocuments.length > 0) {
          const defaultDoc = body.data.keyDocuments[0].path;
          setSelectedPath(defaultDoc);
          if (onFileSelect) onFileSelect(defaultDoc);
        }
      } else {
        setTreeError(body.error.message);
      }
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : "Failed to load repository tree.");
    } finally {
      setIsTreeLoading(false);
    }
  }, [repoFullName, defaultBranch, selectedPath, onFileSelect]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Fetch File Content
  const loadFileContent = useCallback(
    async (path: string) => {
      setIsFileLoading(true);
      setFileError(null);

      try {
        const branchQuery = defaultBranch ? `&branch=${encodeURIComponent(defaultBranch)}` : "";
        const headers: HeadersInit = {};
        const currentPat = loadPat();
        if (currentPat) headers["x-github-token"] = currentPat;
        const res = await fetch(
          `/api/repo/content?repo=${encodeURIComponent(repoFullName)}&path=${encodeURIComponent(path)}${branchQuery}`,
          { headers }
        );
        const body: ApiResponse<FileContentData> = await res.json();

        if (body.success) {
          setFileContent(body.data);
        } else {
          setFileError(body.error.message);
        }
      } catch (err) {
        setFileError(err instanceof Error ? err.message : "Failed to load file content.");
      } finally {
        setIsFileLoading(false);
      }
    },
    [repoFullName, defaultBranch]
  );

  useEffect(() => {
    if (selectedPath) {
      loadFileContent(selectedPath);
    }
  }, [selectedPath, loadFileContent]);

  const handleSelectFileNode = (node: TreeNode) => {
    if (node.type === "file") {
      setSelectedPath(node.path);
      if (onFileSelect) onFileSelect(node.path);
      setIsMobileTreeOpen(false);
    }
  };

  const handleSelectDoc = (path: string) => {
    setSelectedPath(path);
    if (onFileSelect) onFileSelect(path);
  };

  if (isTreeLoading) {
    return (
      <div className="w-full h-[650px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Fetching repository tree...</span>
        </div>
      </div>
    );
  }

  if (treeError || !treeData) {
    return (
      <ErrorBanner
        code="TREE_ERROR"
        message={treeError || "Unable to load repository directory tree."}
        onRetry={fetchTree}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* Top Section: Key Documents Bar */}
      {treeData.keyDocuments.length > 0 && (
        <div className="px-1">
          <KeyDocsBar
            keyDocuments={treeData.keyDocuments}
            activeFilePath={selectedPath}
            onSelectDoc={handleSelectDoc}
          />
        </div>
      )}

      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between p-2 rounded-xl bg-zinc-100 dark:bg-zinc-850 text-xs font-semibold">
        <span className="truncate text-zinc-700 dark:text-zinc-300">
          {selectedPath || "Select a file to inspect"}
        </span>
        <button
          type="button"
          onClick={() => setIsMobileTreeOpen(!isMobileTreeOpen)}
          className="px-3 py-1 rounded-lg bg-blue-600 text-white font-medium"
        >
          {isMobileTreeOpen ? "Hide Tree" : "Browse Files"}
        </button>
      </div>

      {/* Split-Pane Explorer Layout */}
      <div className="w-full h-[700px] flex flex-col md:flex-row gap-4">
        {/* Left Pane: File Tree */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full flex-shrink-0 transition-all ${
            isMobileTreeOpen ? "block" : "hidden md:block"
          }`}
        >
          <FileTree
            rootNodes={treeData.rootNodes}
            selectedPath={selectedPath}
            onSelectFile={handleSelectFileNode}
            totalFiles={treeData.totalFiles}
            totalDirectories={treeData.totalDirectories}
          />
        </div>

        {/* Right Pane: Document / Code Viewer */}
        <div className="flex-1 h-full min-w-0">
          {isFileLoading ? (
            <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-8 flex items-center justify-center animate-pulse">
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs">Loading {selectedPath}...</span>
              </div>
            </div>
          ) : fileError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ErrorBanner
                code="FILE_ERROR"
                message={fileError}
                onRetry={() => selectedPath && loadFileContent(selectedPath)}
              />
            </div>
          ) : fileContent ? (
            fileContent.isMarkdown ? (
              <DocumentViewer
                content={fileContent.content}
                fileName={fileContent.name}
                path={fileContent.path}
              />
            ) : (
              <CodeViewer file={fileContent} />
            )
          ) : (
            <div className="w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-zinc-500">
              <svg className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Select a file from the tree to preview its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
