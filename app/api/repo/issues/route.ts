import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl } from "@/lib/github/parser.ts";
import { fetchGitTree } from "@/lib/github/client.ts";
import { detectKeyDocuments } from "@/lib/github/tree.ts";
import { fetchRepoIssues } from "@/lib/contributor/issues.ts";
import type { IssueCategory } from "@/lib/contributor/types.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
  InvalidRepoUrlError,
  GitHubApiError,
} from "@/lib/github/errors.ts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoQuery = searchParams.get("repo");
  const branchParam = searchParams.get("branch") || "HEAD";
  const categoryParam = (searchParams.get("category") as IssueCategory) || "all";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const perPageParam = parseInt(searchParams.get("perPage") || "30", 10);

  if (!repoQuery) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_PARAM",
          message: "Query parameter 'repo' is required.",
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

    // 1. Fetch Git Tree to enable localized readiness scoring
    let treeItems: any[] = [];
    let keyDocs: any[] = [];
    try {
      const { tree: rawTree } = await fetchGitTree(owner, repo, branchParam, { clientPat });
      treeItems = rawTree.tree || [];
      keyDocs = detectKeyDocuments(treeItems);
    } catch {
      // Tree fetch failure shouldn't block issue listing
    }

    // 2. Fetch & Enrich Issues
    const { issues, totalOpenCount, rateLimit } = await fetchRepoIssues(owner, repo, {
      clientPat,
      page: pageParam,
      perPage: perPageParam,
      category: categoryParam,
      tree: treeItems,
      keyDocs,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          issues,
          totalOpenCount,
          page: pageParam,
          perPage: perPageParam,
          category: categoryParam,
          rateLimit,
        },
      },
      {
        status: 200,
        headers: {
          "x-ratelimit-limit": String(rateLimit.limit),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(Math.floor(rateLimit.resetAt.getTime() / 1000)),
        },
      }
    );
  } catch (error) {
    if (error instanceof InvalidRepoUrlError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    if (error instanceof GitHubAuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 401 }
      );
    }
    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
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
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
