// Whop webhook ingestion endpoint.
// POST /api/webhooks/whop
//
// Uses the official @whop/sdk Standard Webhooks implementation.
// Returns 503 if Whop is not configured, 401 if signature is invalid.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWhopClient, isWhopReady } from "@/lib/whop/client";
import { sendInngestEvent } from "@/server/jobs/client";
import { ConfigurationError } from "@/lib/env/server";
import { createHash } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Check Whop configuration before anything else
  if (!isWhopReady()) {
    return NextResponse.json(
      { error: { code: "WHOP_NOT_CONFIGURED", message: "Whop integration is not configured for this environment." } },
      { status: 503 },
    );
  }

  const rawBody = await req.text();

  const headersObject: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObject[key.toLowerCase()] = value;
  });

  // Verify and unwrap the webhook using the official SDK
  let event;
  try {
    const client = getWhopClient();
    event = client.webhooks.unwrap(rawBody, { headers: headersObject });
  } catch (error) {
    console.warn("[webhook] Signature verification failed", {
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE", message: "Webhook signature verification failed" } },
      { status: 401 },
    );
  }

  const eventId = event.id;
  const eventType = event.type;
  const companyId = event.company_id ?? null;

  if (!companyId) {
    return NextResponse.json(
      { received: true, processed: false, reason: "no_company_id" },
      { status: 200 },
    );
  }

  const installation = await db.whopInstallation.findUnique({
    where: { whopCompanyId: companyId },
    select: { organizationId: true },
  });

  if (!installation) {
    return NextResponse.json(
      { received: true, processed: false, reason: "not_installed" },
      { status: 200 },
    );
  }

  // Idempotency: check if we've already received this event
  const existing = await db.webhookReceipt.findUnique({
    where: { whopEventId: eventId },
  });

  if (existing) {
    return NextResponse.json(
      { received: true, processed: false, reason: "duplicate" },
      { status: 200 },
    );
  }

  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  const receipt = await db.webhookReceipt.create({
    data: {
      organizationId: installation.organizationId,
      whopEventId: eventId,
      eventType,
      payloadHash,
      status: "received",
      payloadJson: event as any,
    },
  });

  // Enqueue async processing via Inngest (graceful degradation if not configured)
  await sendInngestEvent("whop/webhook.received", {
    receiptId: receipt.id,
    eventId,
    eventType,
    organizationId: installation.organizationId,
  });

  return NextResponse.json(
    { received: true, receiptId: receipt.id },
    { status: 202 },
  );
}
