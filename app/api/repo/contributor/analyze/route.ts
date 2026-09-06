import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl } from "@/lib/github/parser.ts";
import {
  getRepoOverview,
  fetchGitTree,
  fetchFileContent,
} from "@/lib/github/client.ts";
import { analyzeRepositoryIntelligence } from "@/lib/github/intelligence.ts";
import { detectKeyDocuments } from "@/lib/github/tree.ts";
import {
  localizeFiles,
  extractVerifiedTestCommands,
} from "@/lib/contributor/issues.ts";
import { buildContributorContext } from "@/lib/contributor/context.ts";
import { CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT } from "@/lib/contributor/prompts.ts";
import { streamAiCompletion, validateAiConfig } from "@/lib/ai/transport.ts";
import type { ContributorIssue } from "@/lib/contributor/types.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
  InvalidRepoUrlError,
  GitHubApiError,
} from "@/lib/github/errors.ts";

export async function POST(request: NextRequest) {
  const aiValidation = validateAiConfig();
  if (!aiValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_CONFIG_ERROR",
          message:
            aiValidation.error ||
            "AI gateway is not configured. Please ensure OMNIROUTE_BASE_URL and OMNIROUTE_MODEL are set in your .env.local file.",
        },
      },
      { status: 400 }
    );
  }

  let body: {
    repo?: string;
    branch?: string;
    issue?: ContributorIssue;
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

  const { repo: repoQuery, branch: inputBranch, issue } = body;

  if (!repoQuery || !issue) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_PARAM",
          message: "Fields 'repo' and 'issue' are required.",
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

    // 1. Fetch Overview & Git Tree
    const overview = await getRepoOverview(`${owner}/${repo}`, { clientPat });
    const defaultBranch = inputBranch || overview.defaultBranch || "main";
    const { tree: rawTree } = await fetchGitTree(owner, repo, defaultBranch, { clientPat });

    // 2. Compute Deterministic Intelligence
    const intelligence = analyzeRepositoryIntelligence(`${owner}/${repo}`, defaultBranch, rawTree.tree);

    // 3. Localize Candidate Files
    const candidateRankings = localizeFiles(issue, rawTree.tree, intelligence);
    const candidatePaths = candidateRankings.slice(0, 5).map((c) => c.path);

    // 4. Identify Manifests and Contributing Document
    const keyDocs = detectKeyDocuments(rawTree.tree);
    const contributingDocMeta = keyDocs.find((d) => d.type === "contributing");
    const manifestDocsMeta = keyDocs.filter((d) => d.type === "manifest").slice(0, 2);

    const filesToFetch = Array.from(
      new Set([
        ...candidatePaths,
        ...(contributingDocMeta ? [contributingDocMeta.path] : []),
        ...manifestDocsMeta.map((m) => m.path),
      ])
    );

    // Fetch contents concurrently
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

    // Extract manifest files for verified test commands
    const manifestContents = fetchedFiles.filter((f) =>
      manifestDocsMeta.some((m) => m.path === f.path)
    );
    const verifiedTestCommands = extractVerifiedTestCommands(manifestContents);

    // Find contributing file content
    const contributingDocContent = contributingDocMeta
      ? fetchedFiles.find((f) => f.path === contributingDocMeta.path) || null
      : null;

    // Filter candidate source files
    const candidateFileContents = fetchedFiles.filter(
      (f) =>
        candidatePaths.includes(f.path) &&
        f.path !== contributingDocMeta?.path
    );

    // 5. Build Bounded Context Bundle
    const contextBundle = buildContributorContext(
      overview,
      issue,
      intelligence,
      candidateFileContents,
      verifiedTestCommands,
      contributingDocContent
    );

    // 6. Stream AI Completion via provider-agnostic gateway
    const stream = await streamAiCompletion({
      systemPrompt: CONTRIBUTOR_ANALYSIS_SYSTEM_PROMPT,
      contextText: contextBundle.systemContextText,
      userPrompt: contextBundle.userPromptText,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Supplied-Files": JSON.stringify(contextBundle.suppliedFiles),
        "X-Localized-Candidates": JSON.stringify(candidateRankings),
        "X-Verified-Commands": JSON.stringify(verifiedTestCommands),
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
