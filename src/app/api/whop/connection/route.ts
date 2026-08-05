import { NextResponse } from "next/server";

import { getConfiguredWhopCompanyId, whopsdk } from "@/lib/whop-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const companyId = getConfiguredWhopCompanyId();

    let courseCount = 0;
    for await (const _course of whopsdk.courses.list({
      company_id: companyId,
      first: 100,
    })) {
      courseCount += 1;
    }

    let membershipCount = 0;
    for await (const _membership of whopsdk.memberships.list({
      company_id: companyId,
      first: 100,
    })) {
      membershipCount += 1;
    }

    return NextResponse.json({
      connected: true,
      companyId,
      courseCount,
      membershipCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Whop error";

    console.error("Whop connection test failed", error);

    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
