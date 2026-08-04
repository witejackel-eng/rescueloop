// Whop webhook ingestion endpoint.
// POST /api/webhooks/whop
//
// Requirements:
// - Read the raw request body
// - Verify webhook signature with the Whop SDK
// - Reject invalid signatures
// - Extract a stable webhook ID
// - Store the receipt before processing (idempotent)
// - Return quickly
// - Process the event asynchronously via Inngest

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/whop/client";
import { inngest } from "@/server/jobs/client";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  // Read the raw body
  const rawBody = await req.text();

  // Get the signature header
  const signature = req.headers.get("x-whop-signature") ?? "";
  const eventId = req.headers.get("x-whop-event-id") ?? "";
  const eventType = req.headers.get("x-whop-event-type") ?? "";

  if (!signature || !eventId) {
    return NextResponse.json(
      { error: "Missing signature or event ID" },
      { status: 400 },
    );
  }

  // Get the webhook secret
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("WHOP_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verify the signature
  const isValid = verifyWebhookSignature({
    payload: rawBody,
    signature,
    secret,
  });

  if (!isValid) {
    console.warn("Webhook signature verification failed", { eventId });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  // Parse the payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // Extract the company ID from the payload
  const companyId = (payload.company_id as string) ?? "";
  if (!companyId) {
    return NextResponse.json(
      { error: "Missing company_id in payload" },
      { status: 400 },
    );
  }

  // Find the organization for this Whop company
  const installation = await db.whopInstallation.findUnique({
    where: { whopCompanyId: companyId },
    select: { organizationId: true },
  });

  if (!installation) {
    return NextResponse.json({ received: true, processed: false, reason: "not_installed" });
  }

  // Compute payload hash for deduplication
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  // Idempotency: check if we've already received this event
  const existing = await db.webhookReceipt.findUnique({
    where: { whopEventId: eventId },
  });

  if (existing) {
    return NextResponse.json({ received: true, processed: false, reason: "duplicate" });
  }

  // Store the receipt BEFORE processing
  const receipt = await db.webhookReceipt.create({
    data: {
      organizationId: installation.organizationId,
      whopEventId: eventId,
      eventType,
      payloadHash,
      status: "received",
      payloadJson: payload as any,
    },
  });

  // Enqueue async processing via Inngest
  await inngest.send({
    name: "whop.webhook.received",
    data: {
      receiptId: receipt.id,
      eventId,
      eventType,
      organizationId: installation.organizationId,
    },
  });

  return NextResponse.json(
    { received: true, receiptId: receipt.id },
    { status: 202 },
  );
}
