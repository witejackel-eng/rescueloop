import { NextResponse } from "next/server";
import { getCompanyOverview } from "@/lib/company-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const overview = getCompanyOverview(companyId);

  return NextResponse.json({ data: overview });
}
