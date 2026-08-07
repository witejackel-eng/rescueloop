import { NextResponse } from "next/server";
import {
  DEMO_EXCEPTION_SUMMARY,
  DEMO_EXCEPTIONS,
  DEMO_AUDIT_LOG,
} from "@/lib/demo-operations-data";

export async function GET() {
  return NextResponse.json({
    summary: DEMO_EXCEPTION_SUMMARY,
    exceptions: DEMO_EXCEPTIONS,
    auditLog: DEMO_AUDIT_LOG,
  });
}
