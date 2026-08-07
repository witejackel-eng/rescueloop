import { NextResponse } from "next/server";
import { DEMO_ORG_360 } from "@/lib/demo-operations-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  if (orgId) {
    const org = DEMO_ORG_360.find((o) => o.orgId === orgId);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json(org);
  }

  // Return all orgs summary
  const orgs = DEMO_ORG_360.map((o) => ({
    orgId: o.orgId,
    orgName: o.orgName,
    healthStatus: o.healthStatus,
    memberCount: o.memberCount,
    signalCount: o.signals.length,
  }));

  return NextResponse.json({ orgs });
}
