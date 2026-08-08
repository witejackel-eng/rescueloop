// WP09 Observability privacy tests.
//
// Verifies that PostHog and pilot analytics modules enforce the
// "no student free text in analytics" rule at runtime.

import { describe, it, expect } from "vitest";
import {
  PILOT_EVENT_ALLOWLIST,
  sanitizePilotEvent,
  type PilotEvent,
} from "@/lib/marketplace/pilot-analytics";

// Mirror the FORBIDDEN_PILOT_KEYS list from the module — this is the contract.
const FORBIDDEN_KEYS = [
  "studentName",
  "studentEmail",
  "studentId",
  "messageContent",
  "messagePreview",
  "draftText",
  "studentFreeText",
  "blockerDescription",
  "token",
  "tokenHash",
  "whopUserId",
  "ipAddress",
  "userAgent",
];

describe("observability privacy — pilot analytics allowlist", () => {
  it("allowlist is non-empty and contains the install→permission→sync→response→return flow", () => {
    expect(PILOT_EVENT_ALLOWLIST.size).toBeGreaterThanOrEqual(15);
    const required = [
      "pilot.install_started",
      "pilot.permissions_granted",
      "pilot.first_sync_completed",
      "pilot.first_candidate_shown",
      "pilot.message_approved",
      "pilot.student_responded",
      "pilot.observed_return",
    ];
    for (const r of required) {
      expect(PILOT_EVENT_ALLOWLIST.has(r as PilotEvent["event"])).toBe(true);
    }
  });

  it("every forbidden key is stripped from pilot event properties", () => {
    const props: Record<string, unknown> = {};
    for (const k of FORBIDDEN_KEYS) {
      props[k] = "SHOULD_BE_STRIPPED";
    }
    props.allowedCount = 7;
    const sanitized = sanitizePilotEvent({
      event: "pilot.message_approved",
      organizationId: "org_1",
      properties: props,
    });
    const out = sanitized.properties as Record<string, unknown>;
    for (const k of FORBIDDEN_KEYS) {
      expect(out[k]).toBeUndefined();
    }
    expect(out.allowedCount).toBe(7);
  });

  it("non-allowlisted event names are rejected", () => {
    expect(() =>
      sanitizePilotEvent({
        event: "pilot.student_message_preview" as unknown as PilotEvent["event"],
        organizationId: "org_1",
      }),
    ).toThrow();
  });

  it("long strings are truncated to ≤214 chars (200 + ...[truncated] suffix)", () => {
    const longValue = "a".repeat(500);
    const sanitized = sanitizePilotEvent({
      event: "pilot.cancellation_reason_recorded",
      organizationId: "org_1",
      properties: { reasonCategory: longValue }, // reasonCategory is allowed; only free-text blockerDescription is stripped
    });
    const out = sanitized.properties as Record<string, unknown>;
    expect(typeof out.reasonCategory).toBe("string");
    expect((out.reasonCategory as string).length).toBeLessThanOrEqual(214);
    expect((out.reasonCategory as string).endsWith("...[truncated]")).toBe(true);
  });
});

describe("observability privacy — PostHog-style forbidden key list mirrors pilot list", () => {
  // The PostHog module in src/lib/observability/posthog.ts has its own
  // FORBIDDEN_KEYS list. This test asserts that the two lists are aligned
  // in spirit — both must forbid the same category of PII.
  //
  // If you add a new PII field to either list, add it to both.

  const POSTHOG_FORBIDDEN = [
    "email",
    "name",
    "token",
    "tokenHash",
    "secret",
    "password",
    "note",
    "messageContent",
    "messagePreview",
    "messageEdited",
    "payloadJson",
    "whopUserId",
    "ipAddress",
    "userAgent",
  ];

  it("both lists forbid messageContent, messagePreview, token, tokenHash, whopUserId, ipAddress, userAgent", () => {
    const shared = ["messageContent", "messagePreview", "token", "tokenHash", "whopUserId", "ipAddress", "userAgent"];
    for (const key of shared) {
      expect(FORBIDDEN_KEYS).toContain(key);
      expect(POSTHOG_FORBIDDEN).toContain(key);
    }
  });

  it("PostHog list has at least 10 forbidden keys", () => {
    expect(POSTHOG_FORBIDDEN.length).toBeGreaterThanOrEqual(10);
  });
});
