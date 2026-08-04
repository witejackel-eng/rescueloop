// Whop webhook ingestion endpoint.
// POST /api/webhooks/whop
//
// Uses the official @whop/sdk Standard Webhooks implementation:
//   const event = whopsdk.webhooks.unwrap(rawBody, { headers })
//
// Whop uses Standard Webhooks (standardwebhooks.com):
// - Headers: webhook-id, webhook-timestamp, webhook-signature
// - Signature content: id.timestamp.body (HMAC-SHA256)
// - The SDK verifies all of this automatically.
//
// Idempotency: webhook-id is the deduplication key.
// Return 2xx quickly after verification + durable enqueueing.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { whopsdk } from "@/lib/whop/client";
import { inngest } from "@/server/jobs/client";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  // Read the raw body (required for signature verification)
  const rawBody = await req.text();

  // Build a plain headers object for the SDK
  const headersObject: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObject[key.toLowerCase()] = value;
  });

  // Verify and unwrap the webhook using the official SDK
  let event;
  try {
    event = whopsdk.webhooks.unwrap(rawBody, { headers: headersObject });
  } catch (error) {
    console.warn("[webhook] Signature verification failed", {
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 401 },
    );
  }

  // The event ID is the stable deduplication key (from webhook-id header)
  const eventId = event.id;
  const eventType = event.type;
  const companyId = event.company_id ?? null;

  if (!companyId) {
    // Some events may not have a company_id — acknowledge but don't process
    return NextResponse.json(
      { received: true, processed: false, reason: "no_company_id" },
      { status: 200 },
    );
  }

  // Find the organization for this Whop company
  const installation = await db.whopInstallation.findUnique({
    where: { whopCompanyId: companyId },
    select: { organizationId: true },
  });

  if (!installation) {
    // Not installed — acknowledge but don't process
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

  // Compute payload hash for audit
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  // Store the receipt BEFORE processing
  const receipt = await db.webhookReceipt.create({
    data: {
      organizationId: installation.organizationId,
      whopEventId: eventId,
      eventType,
      payloadHash,
      status: "received",
      // Store the verified event data (already verified by the SDK)
      payloadJson: event as any,
    },
  });

  // Enqueue async processing via Inngest
  await inngest.send({
    name: "whop/webhook.received",
    data: {
      receiptId: receipt.id,
      eventId,
      eventType,
      organizationId: installation.organizationId,
    },
  });

  // Return 202 Accepted — processing will happen asynchronously
  return NextResponse.json(
    { received: true, receiptId: receipt.id },
    { status: 202 },
  );
}
