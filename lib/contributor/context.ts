import type { RepoOverview } from "../github/types.ts";
import type { RepoIntelligenceData } from "../github/intelligence-types.ts";
import type { ContributorIssue, VerifiedTestCommand } from "./types.ts";
import { createBoundedExcerpt } from "../ai/context.ts";

export interface ContributorContextBundle {
  systemContextText: string;
  userPromptText: string;
  suppliedFiles: string[];
}

const MAX_CONTRIBUTING_CHARS = 2500;
const MAX_FILE_EXCERPT_CHARS = 3500;
const MAX_CANDIDATE_FILES = 6;

/**
 * Builds a bounded context package for AI issue requirement analysis.
 */
export function buildContributorContext(
  overview: RepoOverview,
  issue: ContributorIssue,
  intelligence: RepoIntelligenceData,
  candidateFiles: Array<{ path: string; content: string }> = [],
  verifiedTestCommands: VerifiedTestCommand[] = [],
  contributingDoc: { path: string; content: string } | null = null
): ContributorContextBundle {
  const suppliedFilesSet = new Set<string>();

  // 1. Repository Core Overview
  let context = `REPOSITORY: ${overview.fullName}\n`;
  context += `DEFAULT BRANCH: ${overview.defaultBranch}\n`;
  context += `PRIMARY LANGUAGE: ${overview.primaryLanguage || "Unknown"}\n`;
  if (overview.description) {
    context += `DESCRIPTION: ${overview.description}\n`;
  }

  // 2. Detected Subsystems & Tech Signals
  if (intelligence.technologies && intelligence.technologies.length > 0) {
    context += `DETECTED TECHNOLOGIES: ${intelligence.technologies.map((t) => `${t.name} (${t.category})`).join(", ")}\n`;
  }
  if (intelligence.structure?.classifications && intelligence.structure.classifications.length > 0) {
    context += `KEY SUBSYSTEMS:\n`;
    for (const sub of intelligence.structure.classifications.slice(0, 6)) {
      context += `- ${sub.name} [${sub.path}] (${sub.role}): ${sub.fileCount} files\n`;
    }
  }

  // 3. Verified Test Commands
  if (verifiedTestCommands.length > 0) {
    context += `\nVERIFIED TEST COMMANDS (FROM REPO MANIFESTS):\n`;
    for (const tc of verifiedTestCommands) {
      context += `- \`${tc.command}\` (${tc.source}): ${tc.description}\n`;
    }
  } else {
    context += `\nVERIFIED TEST COMMANDS: None detected in standard manifests.\n`;
  }

  // 4. Contributing Guide
  if (contributingDoc && contributingDoc.content) {
    suppliedFilesSet.add(contributingDoc.path);
    const excerpt = createBoundedExcerpt(contributingDoc.path, contributingDoc.content).content;
    context += `\nCONTRIBUTING GUIDELINES EXCERPT [${contributingDoc.path}]:\n${excerpt}\n`;
  }

  // 5. Candidate Source Files (Bounded)
  const boundedFiles = candidateFiles.slice(0, MAX_CANDIDATE_FILES);
  for (const file of boundedFiles) {
    suppliedFilesSet.add(file.path);
  }

  const allSuppliedFiles = Array.from(suppliedFilesSet);
  if (allSuppliedFiles.length > 0) {
    context += `\nSUPPLIED REPOSITORY FILES FOR CITATION (YOU MAY ONLY CITE FILES FROM THIS LIST):\n`;
    for (const filePath of allSuppliedFiles) {
      context += `- [file:${filePath}]\n`;
    }
  } else {
    context += `\nSUPPLIED REPOSITORY FILES FOR CITATION: None. (No localized source files could be confirmed; you MUST explicitly state that repository context is insufficient rather than guessing files).\n`;
  }

  if (boundedFiles.length > 0) {
    context += `\nLOCALIZED FILE CONTENTS:\n`;
    for (const file of boundedFiles) {
      const excerpt = createBoundedExcerpt(file.path, file.content).content;
      context += `\n--- FILE: [file:${file.path}] ---\n${excerpt}\n`;
    }
  }

  // 6. User Prompt Text (Issue details)
  let userPrompt = `SELECTED GITHUB ISSUE #${issue.number}: ${issue.title}\n`;
  userPrompt += `STATE: ${issue.state}\n`;
  userPrompt += `AUTHOR: @${issue.author.login}\n`;
  if (issue.labels.length > 0) {
    userPrompt += `LABELS: ${issue.labels.map((l) => l.name).join(", ")}\n`;
  }
  userPrompt += `READINESS SCORE: ${issue.readiness.totalScore}/100 (${issue.readiness.tier})\n`;
  userPrompt += `DIFFICULTY: ${issue.difficulty} (${issue.difficultyReason})\n\n`;
  userPrompt += `ISSUE BODY / DESCRIPTION:\n${issue.body || "(No description provided in issue body)"}\n\n`;
  userPrompt += `TASK:\nAnalyze this issue against the repository context. Provide a clear problem breakdown, verifiable acceptance criteria, relevant localized files with [file:path] citations, verified test execution commands, and step-by-step contribution guidance.`;

  return {
    systemContextText: context,
    userPromptText: userPrompt,
    suppliedFiles: Array.from(suppliedFilesSet),
  };
}
