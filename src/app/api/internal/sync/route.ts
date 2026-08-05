import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";
import {
  checkRateLimitOrReject,
  getClientIp,
  RATE_LIMITS,
  RateLimiter,
} from "@/lib/rate-limit/rate-limiter";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const failures = await db.outboxEvent.findMany({
        where: { state: "failed" },
        select: {
          id: true,
          organizationId: true,
          eventType: true,
          lastError: true,
          attemptCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });

      return NextResponse.json(
        failures.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
      );
    } catch (err) {
      console.error("[internal/sync] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  // ─── Rate limiting (20 req/min per IP for internal retries) ───
  const ip = getClientIp(request);
  const rateLimitKey = RateLimiter.buildKey("internal-retry", ip);
  const rateLimitRejection = await checkRateLimitOrReject(
    rateLimitKey,
    RATE_LIMITS.internalRetry,
  );
  if (rateLimitRejection) return rateLimitRejection;

  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, id, reason } = body;

      if (action !== "retry" || !id || !reason) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      const event = await db.outboxEvent.findUnique({ where: { id } });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const previousState = event.state;

      // Reset the event for retry
      await db.outboxEvent.update({
        where: { id },
        data: {
          state: "pending",
          attemptCount: 0,
          lastError: null,
          nextAttemptAt: new Date(),
        },
      });

      await recordInternalAudit({
        actorId,
        action: "sync.retry",
        objectType: "outbox_event",
        objectId: id,
        tenantScope: event.organizationId,
        previousState,
        newState: "pending",
        reason,
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/sync] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
