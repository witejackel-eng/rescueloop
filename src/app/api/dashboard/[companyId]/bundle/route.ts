import { NextResponse } from "next/server";
import { getCompanyDataBundle } from "@/lib/company-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const bundle = getCompanyDataBundle(companyId);

  if (!bundle) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: bundle });
}
