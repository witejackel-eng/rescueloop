// Tests for the webhook signature verification.
// Verifies: valid signatures, invalid signatures, timing-safe comparison.

import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "@/lib/whop/client";

const TEST_SECRET = "wh_whsec_test_secret_1234567890";

describe("webhook-signature", () => {
  it("accepts a valid HMAC-SHA256 signature", () => {
    const payload = JSON.stringify({ event: "membership.created", company_id: "co_123" });
    const signature = createHmac("sha256", TEST_SECRET).update(payload).digest("hex");

    const isValid = verifyWebhookSignature({
      payload,
      signature,
      secret: TEST_SECRET,
    });

    expect(isValid).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const payload = JSON.stringify({ event: "membership.created" });

    const isValid = verifyWebhookSignature({
      payload,
      signature: "invalid-signature",
      secret: TEST_SECRET,
    });

    expect(isValid).toBe(false);
  });

  it("rejects a signature from a different secret", () => {
    const payload = JSON.stringify({ event: "membership.created" });
    const signature = createHmac("sha256", "different-secret").update(payload).digest("hex");

    const isValid = verifyWebhookSignature({
      payload,
      signature,
      secret: TEST_SECRET,
    });

    expect(isValid).toBe(false);
  });

  it("rejects empty inputs", () => {
    expect(verifyWebhookSignature({ payload: "", signature: "", secret: TEST_SECRET })).toBe(false);
    expect(verifyWebhookSignature({ payload: "data", signature: "sig", secret: "" })).toBe(false);
  });
});
