import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl } from "@/lib/github/parser.ts";
import { fetchGitTree, fetchRepoMetadata } from "@/lib/github/client.ts";
import { analyzeRepositoryIntelligence } from "@/lib/github/intelligence.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  InvalidRepoUrlError,
  GitHubApiError,
} from "@/lib/github/errors.ts";
import type { ApiResponse } from "@/lib/github/types.ts";
import type { RepoIntelligenceData } from "@/lib/github/intelligence-types.ts";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<RepoIntelligenceData>>> {
  const { searchParams } = new URL(request.url);
  const repoQuery = searchParams.get("repo") || searchParams.get("url");
  let branch = searchParams.get("branch") || undefined;

  if (!repoQuery) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_PARAM",
          message: "Query parameter 'repo' or 'url' is required.",
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

    // If branch is not provided, fetch repo metadata to get default branch
    if (!branch) {
      const meta = await fetchRepoMetadata(owner, repo, { clientPat });
      branch = meta.data.default_branch || "HEAD";
    }

    const { tree: rawTree } = await fetchGitTree(owner, repo, branch, { clientPat });
    const intelligence = analyzeRepositoryIntelligence(`${owner}/${repo}`, branch, rawTree.tree);

    return NextResponse.json({
      success: true,
      data: intelligence,
    });
  } catch (error) {
    if (error instanceof InvalidRepoUrlError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            resetAt: error.resetAt.toISOString(),
            limit: error.limit,
            remaining: error.remaining,
          },
        },
        { status: 403 }
      );
    }

    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
