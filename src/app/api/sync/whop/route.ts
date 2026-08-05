import { NextRequest } from "next/server";

import { syncWhopCompany } from "@/lib/whop/sync-company";
import { WhopApiError } from "@/lib/whop/api";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.SYNC_SECRET?.trim();
  if (!configuredSecret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${configuredSecret}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncWhopCompany();
    return Response.json(result);
  } catch (error) {
    if (error instanceof WhopApiError) {
      return Response.json(
        {
          connected: false,
          stage: "whop-api",
          status: error.status,
          error: error.responseBody,
        },
        { status: error.status },
      );
    }

    return Response.json(
      {
        connected: false,
        stage: "sync",
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 },
    );
  }
}
