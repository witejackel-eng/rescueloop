// Whop API connection test endpoint.
// GET /api/whop-test
//
// Verifies that Whop credentials are configured and the API is reachable.
// Uses the official @whop/sdk client (not raw fetch) so the test exercises
// the same code path as production webhook ingestion and data fetching.
//
// Requires WHOP_COMPANY_ID to be set for a full connectivity test.
// Returns a detailed diagnostic even on failure so the caller can
// distinguish configuration errors from network/API errors.

import { NextResponse } from "next/server";
import { getWhopClient, isWhopReady } from "@/lib/whop/client";
import { getWhopEnv } from "@/lib/env/server";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  // ─── Configuration check ────────────────────────────────────
  if (!isWhopReady()) {
    return NextResponse.json(
      {
        connected: false,
        stage: "configuration",
        missing: {
          WHOP_API_KEY: !process.env.WHOP_API_KEY,
          WHOP_WEBHOOK_SECRET: !process.env.WHOP_WEBHOOK_SECRET,
          NEXT_PUBLIC_WHOP_APP_ID: !process.env.NEXT_PUBLIC_WHOP_APP_ID,
          WHOP_COMPANY_ID: !process.env.WHOP_COMPANY_ID,
        },
      },
      { status: 503 },
    );
  }

  const env = getWhopEnv();
  const companyId = env.WHOP_COMPANY_ID;

  if (!companyId) {
    // Core credentials are present but no company ID for a full test.
    return NextResponse.json({
      connected: true,
      stage: "configured",
      note: "WHOP_COMPANY_ID not set — skipping API connectivity test. Set it to verify end-to-end Whop access.",
      appId: env.NEXT_PUBLIC_WHOP_APP_ID,
    });
  }

  // ─── API connectivity check ─────────────────────────────────
  try {
    const client = getWhopClient();
    const page = await client.courses.list({ company_id: companyId });

    const courseCount = Array.isArray(page?.data) ? page.data.length : 0;

    return NextResponse.json({
      connected: true,
      companyId,
      appId: env.NEXT_PUBLIC_WHOP_APP_ID,
      courseCount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        connected: false,
        stage: "whop-api",
        companyId,
        appId: env.NEXT_PUBLIC_WHOP_APP_ID,
        error: message,
      },
      { status: 502 },
    );
  }
}
