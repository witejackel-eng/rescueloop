import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const company = getCompanyContext(companyId);

  if (!company) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: company });
}
