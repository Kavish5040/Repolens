import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl } from "@/lib/github/parser.ts";
import {
  getRepoOverview,
  fetchGitTree,
  fetchFileContent,
} from "@/lib/github/client.ts";
import { analyzeRepositoryIntelligence } from "@/lib/github/intelligence.ts";
import { detectKeyDocuments } from "@/lib/github/tree.ts";
import { buildChatContext, pruneChatHistory } from "@/lib/ai/context.ts";
import { REPO_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts.ts";
import { streamGeminiContent, isGeminiKeyConfigured } from "@/lib/ai/gemini.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  InvalidRepoUrlError,
  GitHubApiError,
} from "@/lib/github/errors.ts";
import type { RepoOverview } from "@/lib/github/types.ts";
import type { ChatMessage } from "@/lib/ai/types.ts";

export async function POST(request: NextRequest) {
  // Check API key configuration first
  if (!isGeminiKeyConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_API_KEY",
          message:
            "Gemini API key is not configured. Please add GEMINI_API_KEY=your_key to your .env.local file to enable AI chat.",
        },
      },
      { status: 400 }
    );
  }

  let body: {
    repo?: string;
    branch?: string;
    query?: string;
    activeFile?: string | null;
    messages?: ChatMessage[];
  };

  try {
    const rawBody = await request.text();
    if (rawBody.length > 32768) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "Request payload exceeds 32KB limit.",
          },
        },
        { status: 413 }
      );
    }
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  const { repo: repoQuery, branch: inputBranch, query, activeFile, messages } = body;

  if (!repoQuery) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_PARAM", message: "Field 'repo' is required." } },
      { status: 400 }
    );
  }

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_QUERY", message: "A non-empty query string is required." } },
      { status: 400 }
    );
  }

  if (query.length > 1000) {
    return NextResponse.json(
      { success: false, error: { code: "QUERY_TOO_LONG", message: "Query exceeds 1,000 characters." } },
      { status: 400 }
    );
  }

  const clientPat =
    request.headers.get("x-github-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    undefined;

  try {
    const { owner, repo } = parseGitHubUrl(repoQuery);

    // 1. Fetch Repository Metadata
    const overview = await getRepoOverview(`${owner}/${repo}`, { clientPat });
    const defaultBranch = inputBranch || overview.defaultBranch || "main";

    // 2. Fetch Git Tree
    const { tree: rawTree } = await fetchGitTree(owner, repo, defaultBranch, { clientPat });

    // 3. Compute Deterministic Intelligence
    const intelligence = analyzeRepositoryIntelligence(`${owner}/${repo}`, defaultBranch, rawTree.tree);

    // 4. Identify Question-Targeted Files
    const keyDocs = detectKeyDocuments(rawTree.tree);
    const keywords = query
      .toLowerCase()
      .replace(/[^a-z0-9_\-./]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    // Collect candidates to fetch
    const fileCandidates = new Set<string>();

    if (activeFile) {
      fileCandidates.add(activeFile);
    }

    // Include primary readme and manifest
    const readmeDoc = keyDocs.find((d) => d.type === "readme");
    if (readmeDoc) fileCandidates.add(readmeDoc.path);
    const manifestDoc = keyDocs.find((d) => d.type === "manifest");
    if (manifestDoc) fileCandidates.add(manifestDoc.path);

    // Match tree files by keywords (up to 3 files)
    const matchingTreeFiles = rawTree.tree
      .filter((item) => item.type === "blob" && keywords.some((kw) => item.path.toLowerCase().includes(kw)))
      .slice(0, 3);

    for (const match of matchingTreeFiles) {
      fileCandidates.add(match.path);
    }

    // Fetch candidate contents (bounded to max 6 files total)
    const filesToFetch = Array.from(fileCandidates).slice(0, 6);
    const fileFetchPromises = filesToFetch.map(async (filePath) => {
      try {
        const res = await fetchFileContent(owner, repo, filePath, { clientPat, branch: defaultBranch });
        return {
          path: filePath,
          content: res.file.content,
        };
      } catch {
        return null;
      }
    });

    const fetchedFiles = (await Promise.all(fileFetchPromises)).filter(
      (f): f is { path: string; content: string } => f !== null
    );

    // 5. Build Bounded Chat Context
    const contextBundle = buildChatContext(
      overview,
      rawTree.tree,
      intelligence,
      query,
      fetchedFiles,
      activeFile
    );

    // 6. Prune Conversation History to Max 6 Turns
    const prunedHistory = pruneChatHistory(messages || [], 6);

    // Append current user message if not already present
    const updatedMessages: ChatMessage[] = [
      ...prunedHistory,
      {
        id: `msg-${Date.now()}`,
        role: "user",
        content: query,
      },
    ];

    // 7. Stream Gemini Content
    const stream = await streamGeminiContent({
      systemPrompt: REPO_CHAT_SYSTEM_PROMPT,
      contextText: contextBundle.systemContextText,
      messages: updatedMessages,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Supplied-Files": JSON.stringify(contextBundle.suppliedFiles),
      },
    });
  } catch (error) {
    if (error instanceof InvalidRepoUrlError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 400 });
    }
    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 404 });
    }
    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 403 });
    }
    if (error instanceof GitHubApiError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: { code: "AI_ERROR", message } }, { status: 500 });
  }
}
