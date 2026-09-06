"use client";

import React from "react";
import { AiSummaryCard } from "./AiSummaryCard.tsx";
import { AskRepoLensChat } from "./AskRepoLensChat.tsx";

interface AiDashboardProps {
  repoFullName: string;
  defaultBranch: string;
  detectedTechnologies?: string[];
  activeFilePath?: string | null;
  onSelectFile?: (path: string) => void;
  pat?: string | null;
}

export function AiDashboard({
  repoFullName,
  defaultBranch,
  detectedTechnologies = [],
  activeFilePath,
  onSelectFile,
}: AiDashboardProps) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Grounded AI Summary */}
      <AiSummaryCard
        repoFullName={repoFullName}
        defaultBranch={defaultBranch}
        onSelectFile={onSelectFile}
      />

      {/* 2. Interactive Conversational Q&A */}
      <AskRepoLensChat
        repoFullName={repoFullName}
        defaultBranch={defaultBranch}
        detectedTechnologies={detectedTechnologies}
        activeFilePath={activeFilePath}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}
