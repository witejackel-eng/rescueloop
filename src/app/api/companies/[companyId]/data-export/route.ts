// POST /api/companies/[companyId]/data-export
//
// Request a full data export for the organisation.
// Creates a DataExportRequest with a time-limited download token.
// The actual export is processed by a durable job.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import { sendInngestEvent } from "@/server/jobs/client";

/**
 * Generate a cryptographically random download token.
 */
function generateDownloadToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // Check for an existing in-progress export
  const existing = await db.dataExportRequest.findFirst({
    where: {
      organizationId: ctx.organizationId,
      status: { in: ["Requested", "Processing"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: "An export is already in progress",
        requestId: existing.id,
        status: existing.status,
      },
      { status: 409 },
    );
  }

  // Create the export request with a time-limited download token
  const downloadToken = generateDownloadToken();
  const downloadExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const exportRequest = await db.dataExportRequest.create({
    data: {
      organizationId: ctx.organizationId,
      requestedById: ctx.internalUserId ?? ctx.whopUserId,
      downloadToken,
      downloadExpiresAt,
    },
  });

  // Dispatch durable job for export processing
  await sendInngestEvent("export/data.requested", {
    exportRequestId: exportRequest.id,
    organizationId: ctx.organizationId,
  });

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "created",
    objectType: "data_export_request",
    objectId: exportRequest.id,
  });

  return NextResponse.json(
    {
      ok: true,
      requestId: exportRequest.id,
      status: exportRequest.status,
      // The download token is NOT returned here — it will be
      // delivered via a separate notification once the export is complete.
    },
    { status: 202 },
  );
}
