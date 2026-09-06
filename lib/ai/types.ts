export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  citations?: CitationMatch[];
}

export interface CitationMatch {
  raw: string;            // e.g. "[file:package.json]" or "[file:app/page.tsx:L10-L25]"
  path: string;           // e.g. "package.json" or "app/page.tsx"
  lineRange?: string;     // e.g. "L10-L25"
  isValid: boolean;       // true if path was in the prompt context supplied to the model
}

export interface ContextFileExcerpt {
  path: string;
  content: string;
  isTruncated: boolean;
  byteSize: number;
}

export interface ContextBundle {
  repoFullName: string;
  defaultBranch: string;
  systemContextText: string;
  suppliedFiles: string[]; // List of file paths included in the context bundle
  estimatedTokenCount: number;
}

export interface AiSummaryData {
  overview: string;
  architecturalPatterns: string[];
  keyModules: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  engineeringObservations: string[];
  caveatsAndRisks: string[];
  citations: CitationMatch[];
}

export interface StreamEvent {
  type: "chunk" | "done" | "error";
  text?: string;
  error?: {
    code: string;
    message: string;
  };
}
