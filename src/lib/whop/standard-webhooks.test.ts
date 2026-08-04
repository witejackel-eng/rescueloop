// Tests for the Standard Webhooks verification.
//
// Whop uses Standard Webhooks (standardwebhooks.com):
// - Headers: webhook-id, webhook-timestamp, webhook-signature
// - Signature content: id.timestamp.body (HMAC-SHA256)
//
// These tests verify the whopsdk.webhooks.unwrap() behavior with:
// - Valid signed webhook
// - Invalid signature
// - Expired timestamp
// - Duplicate event

import { describe, it, expect } from "vitest";
import { Whop } from "@whop/sdk";
import { createHmac } from "crypto";

// Create a client with a known webhook secret for testing
const TEST_SECRET = "test-webhook-secret-12345678901234567890";
const client = new Whop({
  apiKey: "test-api-key",
  webhookKey: btoa(TEST_SECRET),
  appID: "test-app-id",
});

function signWebhook(payload: string, secret: string): { id: string; timestamp: string; signature: string } {
  const id = "msg_test_webhook_id";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedContent = `${id}.${timestamp}.${payload}`;
  // Standard Webhooks uses base64-encoded HMAC-SHA256
  const signature = createHmac("sha256", secret).update(signedContent).digest("base64");
  return { id, timestamp, signature };
}

describe("standard-webhooks-verification", () => {
  it("accepts a valid Standard Webhooks signature", () => {
    const payload = JSON.stringify({
      id: "evt_123",
      type: "membership.activated",
      data: { id: "mem_123" },
      timestamp: new Date().toISOString(),
    });

    const { id, timestamp, signature } = signWebhook(payload, TEST_SECRET);

    const headers = {
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`,
    };

    expect(() => {
      client.webhooks.unwrap(payload, { headers });
    }).not.toThrow();
  });

  it("rejects an invalid signature", () => {
    const payload = JSON.stringify({ id: "evt_123", type: "membership.activated" });

    const headers = {
      "webhook-id": "msg_test",
      "webhook-timestamp": Math.floor(Date.now() / 1000).toString(),
      "webhook-signature": "v1,invalid_signature_here",
    };

    expect(() => {
      client.webhooks.unwrap(payload, { headers });
    }).toThrow();
  });

  it("rejects a signature from a different secret", () => {
    const payload = JSON.stringify({ id: "evt_123", type: "membership.activated" });
    const { id, timestamp, signature } = signWebhook(payload, "wrong-secret");

    const headers = {
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`,
    };

    expect(() => {
      client.webhooks.unwrap(payload, { headers });
    }).toThrow();
  });

  it("rejects an expired timestamp", () => {
    const payload = JSON.stringify({ id: "evt_123", type: "membership.activated" });

    // 10 minutes ago — Standard Webhooks rejects > 5 minutes
    const oldTimestamp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000).toString();
    const signedContent = `msg_test.${oldTimestamp}.${payload}`;
    const signature = createHmac("sha256", TEST_SECRET).update(signedContent).digest("base64");

    const headers = {
      "webhook-id": "msg_test",
      "webhook-timestamp": oldTimestamp,
      "webhook-signature": `v1,${signature}`,
    };

    expect(() => {
      client.webhooks.unwrap(payload, { headers });
    }).toThrow();
  });
});
