import { NextRequest, NextResponse } from "next/server";
import { getRepoOverview } from "@/lib/github/client.ts";
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
  InvalidRepoUrlError,
  GitHubApiError,
} from "@/lib/github/errors.ts";
import type { ApiResponse, RepoOverview } from "@/lib/github/types.ts";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<RepoOverview>>> {
  const { searchParams } = new URL(request.url);
  const repoQuery = searchParams.get("repo") || searchParams.get("url");

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

  // Extract optional client-provided PAT for higher rate limits
  const clientPat =
    request.headers.get("x-github-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    undefined;

  try {
    const overview = await getRepoOverview(repoQuery, { clientPat });
    return NextResponse.json({
      success: true,
      data: overview,
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

    if (error instanceof GitHubAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 401 }
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
