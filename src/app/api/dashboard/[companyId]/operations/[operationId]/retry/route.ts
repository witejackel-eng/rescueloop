// POST /api/dashboard/[companyId]/operations/[operationId]/retry
//
// Retry a failed operation. Currently only supports retrying
// failed sync operations.
//
// In fixture mode, returns 404.
// In connected mode, verifies the operation is retryable,
// then dispatches a new sync via Inngest.
//
// TRUTHFULNESS INVARIANT:
//   retrying: true  ONLY if a retry job was genuinely accepted/dispatched.
//   If the job provider is unavailable or unconfigured:
//     - do NOT mutate the previous operation into a fake running state
//     - return HTTP 503 with retrying: false
//     - preserve the prior operation state
//     - return a useful customer-facing message
//
// FAIL-CLOSED: Uses requireCompanyAccess() — never takes action without auth.

import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getOperation } from "@/lib/operations/operation-read-model";
import { sendInngestEvent, EVENTS } from "@/server/jobs/client";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ route: "/api/dashboard/operations/retry" });

export async function POST(
  _req: Request,
  {
    params,
  }: { params: Promise<{ companyId: string; operationId: string }> },
) {
  const { companyId, operationId } = await params;

  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fixture mode has no real operations
  if (context.mode === "fixture") {
    return NextResponse.json(
      { error: "Operation not found" },
      { status: 404 },
    );
  }

  // Connected mode — verify operation is retryable
  try {
    const operation = await getOperation(context.organizationId, operationId);

    if (!operation) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 },
      );
    }

    // Only failed sync operations can be retried
    if (operation.type !== "sync") {
      return NextResponse.json(
        { error: "Only sync operations can be retried" },
        { status: 400 },
      );
    }

    if (operation.state !== "failed") {
      return NextResponse.json(
        { error: "Only failed operations can be retried" },
        { status: 400 },
      );
    }

    if (!operation.canRetry) {
      return NextResponse.json(
        { error: "This operation cannot be retried" },
        { status: 400 },
      );
    }

    // Dispatch a new sync via Inngest
    const dispatchResult = await sendInngestEvent(EVENTS.syncMemberships, {
      organizationId: context.organizationId,
      trigger: "manual",
    });

    // ─── TRUTHFULNESS: Handle dispatch result ───────────────
    if (dispatchResult.state === "unconfigured") {
      // Provider is not configured — CANNOT retry.
      // Return 503 with retrying: false and a clear message.
      // Do NOT mutate the operation into a fake running state.
      log.warn("Retry rejected — background processing is unconfigured", {
        action: "POST",
        organizationId: context.organizationId,
        operationId,
      });

      return NextResponse.json(
        {
          retrying: false,
          operationId,
          dispatchState: "unconfigured",
          message:
            "Retry could not be started. Background processing is currently unavailable.",
        },
        { status: 503 },
      );
    }

    if (dispatchResult.state === "failed") {
      // Provider rejected the event or network error.
      // Return 503 with retrying: false if not retryable, 502 if retryable.
      const status = dispatchResult.retryable ? 502 : 503;
      log.error("Retry dispatch failed", {
        action: "POST",
        organizationId: context.organizationId,
        operationId,
        errorCode: dispatchResult.errorCode,
        retryable: dispatchResult.retryable,
      });

      return NextResponse.json(
        {
          retrying: false,
          operationId,
          dispatchState: "failed",
          message: dispatchResult.retryable
            ? "Retry could not be started due to a temporary issue. Please try again."
            : "Retry could not be started. Background processing is currently unavailable.",
        },
        { status },
      );
    }

    // dispatchResult.state === "accepted" — job genuinely dispatched
    log.info("Retry sync dispatched", {
      action: "POST",
      organizationId: context.organizationId,
      operationId,
      dispatchState: dispatchResult.state,
    });

    return NextResponse.json({
      retrying: true,
      operationId,
      dispatchState: dispatchResult.state,
    });
  } catch (error) {
    log.error("Failed to retry operation", {
      action: "POST",
      operationId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to retry operation" },
      { status: 500 },
    );
  }
}
