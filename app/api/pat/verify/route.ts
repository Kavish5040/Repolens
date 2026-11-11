import { NextRequest, NextResponse } from "next/server";
import { validatePatFormat } from "@/lib/pat/validation.ts";
import { verifyGitHubPat } from "@/lib/pat/verify.ts";
import type { ApiResponse } from "@/lib/github/types.ts";
import type { PatVerificationResult } from "@/lib/pat/verify.ts";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PatVerificationResult>>> {
  let token =
    request.headers.get("x-github-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!token) {
    try {
      const body = (await request.json()) as { token?: string };
      if (body?.token) {
        token = body.token;
      }
    } catch {
      // Body is optional if header is provided
    }
  }

  const trimmed = token.trim();

  if (!trimmed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "A GitHub token must be provided via 'x-github-token' header or request body.",
        },
      },
      { status: 400 }
    );
  }

  // 1. Client/syntactic format pre-validation
  const formatResult = validatePatFormat(trimmed);
  if (!formatResult.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_FORMAT",
          message: formatResult.reason || "Invalid GitHub token format.",
        },
      },
      { status: 400 }
    );
  }

  // 2. Runtime validation against GitHub API endpoint (GET /rate_limit)
  const result = await verifyGitHubPat(trimmed);

  if (!result.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.code,
          message: result.message,
        },
        data: result,
      },
      { status: result.statusCode }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}

