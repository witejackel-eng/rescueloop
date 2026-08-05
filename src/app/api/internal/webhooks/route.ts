import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const webhooks = await db.webhookReceipt.findMany({
        where: { status: "failed" },
        select: {
          id: true,
          organizationId: true,
          eventType: true,
          status: true,
          lastError: true,
          attemptCount: true,
          receivedAt: true,
        },
        orderBy: { receivedAt: "desc" },
        take: 100,
      });

      return NextResponse.json(
        webhooks.map((w) => ({
          ...w,
          receivedAt: w.receivedAt.toISOString(),
        })),
      );
    } catch (err) {
      console.error("[internal/webhooks] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, id, reason } = body;

      if (action !== "retry" || !id || !reason) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      const webhook = await db.webhookReceipt.findUnique({ where: { id } });
      if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
      }

      const previousState = webhook.status;

      // Reset for retry
      await db.webhookReceipt.update({
        where: { id },
        data: {
          status: "received",
          attemptCount: 0,
          lastError: null,
        },
      });

      await recordInternalAudit({
        actorId,
        action: "webhooks.retry",
        objectType: "webhook_receipt",
        objectId: id,
        tenantScope: webhook.organizationId,
        previousState,
        newState: "received",
        reason,
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/webhooks] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
