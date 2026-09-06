import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl } from "@/lib/github/parser.ts";
import {
  getRepoOverview,
  fetchGitTree,
  fetchFileContent,
} from "@/lib/github/client.ts";
import { analyzeRepositoryIntelligence } from "@/lib/github/intelligence.ts";
import { detectKeyDocuments } from "@/lib/github/tree.ts";
import { buildSummaryContext } from "@/lib/ai/context.ts";
import { REPO_SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts.ts";
import { streamAiCompletion, validateAiConfig } from "@/lib/ai/transport.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
  InvalidRepoUrlError,
  GitHubApiError,
} from "@/lib/github/errors.ts";
import type { RepoOverview } from "@/lib/github/types.ts";

export async function POST(request: NextRequest) {
  // Validate AI Gateway configuration
  const aiValidation = validateAiConfig();
  if (!aiValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_CONFIG_ERROR",
          message:
            aiValidation.error ||
            "AI gateway is not configured. Please ensure AI_BASE_URL and AI_MODEL are set in your .env.local file.",
        },
      },
      { status: 400 }
    );
  }

  let body: { repo?: string; branch?: string };
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

  const { repo: repoQuery, branch: inputBranch } = body;
  if (!repoQuery) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_PARAM",
          message: "Field 'repo' is required.",
        },
      },
      { status: 400 }
    );
  }

  const clientPat =
    request.headers.get("x-github-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    undefined;

  try {
    const { owner, repo } = parseGitHubUrl(repoQuery);

    // 1. Fetch Repository Overview Data
    const overview = await getRepoOverview(`${owner}/${repo}`, { clientPat });
    const defaultBranch = inputBranch || overview.defaultBranch || "main";

    // 2. Fetch Git Tree
    const { tree: rawTree } = await fetchGitTree(owner, repo, defaultBranch, { clientPat });

    // 3. Compute Deterministic Intelligence (Phase 3 Engine)
    const intelligence = analyzeRepositoryIntelligence(`${owner}/${repo}`, defaultBranch, rawTree.tree);

    // 4. Fetch Key Project Document Contents (README & primary manifest)
    const keyDocs = detectKeyDocuments(rawTree.tree);
    const keyFilesToFetch = keyDocs
      .filter((d) => d.type === "readme" || d.type === "manifest")
      .slice(0, 3);

    const fileContentPromises = keyFilesToFetch.map(async (doc) => {
      try {
        const fileData = await fetchFileContent(owner, repo, doc.path, { clientPat, branch: defaultBranch });
        return {
          path: doc.path,
          content: fileData.file.content,
        };
      } catch {
        return null;
      }
    });

    const fetchedFiles = (await Promise.all(fileContentPromises)).filter(
      (f): f is { path: string; content: string } => f !== null
    );

    // 5. Build Bounded Summary Context
    const contextBundle = buildSummaryContext(overview, rawTree.tree, intelligence, fetchedFiles);

    // 6. Stream AI Content via provider-agnostic gateway
    const stream = await streamAiCompletion({
      systemPrompt: REPO_SUMMARY_SYSTEM_PROMPT,
      contextText: contextBundle.systemContextText,
      userPrompt: `Generate a comprehensive, evidence-backed architectural summary for repository ${overview.fullName}.`,
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
    if (error instanceof GitHubAuthError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 401 });
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
