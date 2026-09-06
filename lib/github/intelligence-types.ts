/**
 * Domain types for Deterministic Repository Intelligence & Onboarding Guidance (Pillar B)
 *
 * Architectural Note:
 * These domain models are kept strictly separate from raw GitHub API transport DTOs.
 * Every heuristic classification, technology signal, entry-point candidate, and onboarding step
 * is designed to carry observable evidence (e.g., file paths, directory naming patterns,
 * manifest keywords) to ensure transparent, evidence-backed explanations.
 */

export type ConfidenceLevel = "high" | "medium" | "low";

export type DirectoryRole =
  | "source"
  | "application"
  | "components"
  | "library"
  | "config"
  | "tests"
  | "documentation"
  | "tooling"
  | "examples"
  | "infrastructure"
  | "build_output"
  | "dependencies"
  | "unknown";

export interface DirectoryClassification {
  path: string;
  name: string;
  role: DirectoryRole;
  label: string;
  confidence: ConfidenceLevel;
  signals: string[];
  fileCount: number;
  totalSize: number;
  depth: number;
  sampleFiles: string[];
}

export type TechCategory =
  | "language"
  | "framework"
  | "runtime"
  | "build_tool"
  | "testing"
  | "infrastructure"
  | "linter_formatter";

export interface TechnologySignal {
  name: string;
  category: TechCategory;
  confidence: ConfidenceLevel;
  evidence: string[];
  description?: string;
  icon?: string;
}

export type EntryPointType =
  | "app_root"
  | "main_module"
  | "cli_entry"
  | "server_entry"
  | "library_export"
  | "config_root";

export interface EntryPointCandidate {
  path: string;
  name: string;
  type: EntryPointType;
  label: string;
  rank: number;
  confidence: ConfidenceLevel;
  signals: string[];
  description: string;
}

export type OnboardingCategory =
  | "overview"
  | "manifest"
  | "entry_point"
  | "core_architecture"
  | "testing"
  | "tooling"
  | "contribution";

export interface OnboardingStep {
  stepNumber: number;
  title: string;
  targetPath: string;
  targetType: "file" | "directory";
  category: OnboardingCategory;
  reason: string;
  signalStrength: "primary" | "secondary" | "supplementary";
  keyPointsToInspect: string[];
  evidence: string[];
}

export interface ReadingOrderItem {
  order: number;
  path: string;
  name: string;
  type: "file" | "directory";
  role: string;
  explanation: string;
  evidence: string;
}

export interface StructuralInsight {
  key: string;
  label: string;
  value: string | number;
  description: string;
  type: "positive" | "neutral" | "warning";
  evidence?: string;
}

export interface RepoStructureSummary {
  classifications: DirectoryClassification[];
  totalAnalyzedFiles: number;
  totalAnalyzedDirectories: number;
  rootFileCount: number;
  maxTreeDepth: number;
  hasMonorepoWorkspaces: boolean;
  workspacePatterns?: string[];
}

export interface RepoIntelligenceData {
  repoFullName: string;
  defaultBranch: string;
  structure: RepoStructureSummary;
  technologies: TechnologySignal[];
  entryPoints: EntryPointCandidate[];
  whereToStart: OnboardingStep[];
  readingOrder: ReadingOrderItem[];
  insights: StructuralInsight[];
  generatedAt: string;
}
