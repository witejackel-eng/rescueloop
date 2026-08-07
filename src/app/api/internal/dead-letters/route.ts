import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const letters = await db.deadLetterEvent.findMany({
        select: {
          id: true,
          organizationId: true,
          eventType: true,
          errorMessage: true,
          attemptCount: true,
          deadLetteredAt: true,
        },
        orderBy: { deadLetteredAt: "desc" },
        take: 100,
      });

      return NextResponse.json(
        letters.map((l) => ({
          ...l,
          deadLetteredAt: l.deadLetteredAt.toISOString(),
        })),
      );
    } catch (err) {
      console.error("[internal/dead-letters] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, id, reason } = body;

      if (action !== "requeue" || !id || !reason) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      const deadLetter = await db.deadLetterEvent.findUnique({ where: { id } });
      if (!deadLetter) {
        return NextResponse.json({ error: "Dead letter not found" }, { status: 404 });
      }

      // Re-queue as a fresh outbox event
      await db.outboxEvent.create({
        data: {
          organizationId: deadLetter.organizationId,
          eventType: deadLetter.eventType,
          payloadJson: deadLetter.payloadJson as Prisma.InputJsonValue,
          state: "pending",
          idempotencyKey: `requeue-${deadLetter.id}-${Date.now()}`,
        },
      });

      // Delete the dead letter
      await db.deadLetterEvent.delete({ where: { id } });

      await recordInternalAudit({
        actorId,
        action: "dead-letter.requeue",
        objectType: "dead_letter_event",
        objectId: id,
        tenantScope: deadLetter.organizationId,
        previousState: "dead_letter",
        newState: "pending",
        reason,
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/dead-letters] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
