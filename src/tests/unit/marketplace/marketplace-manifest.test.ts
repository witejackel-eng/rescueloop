// Marketplace module contract tests — WP08
//
// Verifies the listing manifest satisfies:
//   - Truth-language guard (no forbidden claims)
//   - Permissions are minimal, justified, with required/optional + fallback
//   - Iframe policy is correct for embedded vs student routes
//   - Pilot analytics allowlist forbids student free-text keys
//   - Data lifecycle actions cover pause/uninstall/export/delete/opt-out

import { describe, it, expect } from "vitest";
import {
  MARKETPLACE_LISTING,
  PERMISSIONS,
  APP_VIEWS,
  assertNoForbiddenClaims,
  LISTING_READINESS_STATIC,
} from "@/lib/marketplace/manifest";
import { decideIframePolicy } from "@/lib/marketplace/iframe-policy";
import {
  PILOT_EVENT_ALLOWLIST,
  sanitizePilotEvent,
  type PilotEvent,
} from "@/lib/marketplace/pilot-analytics";
import { DATA_LIFECYCLE_ACTIONS } from "@/lib/marketplace/data-lifecycle-manifest";

describe("marketplace listing — truth language", () => {
  it("tagline is under 80 chars", () => {
    expect(MARKETPLACE_LISTING.tagline.length).toBeLessThanOrEqual(80);
  });

  it("short description is under 200 chars", () => {
    expect(MARKETPLACE_LISTING.shortDescription.length).toBeLessThanOrEqual(200);
  });

  it("forbidden claims list is non-empty", () => {
    expect(MARKETPLACE_LISTING.forbiddenClaims.length).toBeGreaterThan(0);
  });

  it("assertNoForbiddenClaims throws on a forbidden phrase", () => {
    expect(() => assertNoForbiddenClaims("guaranteed retention!")).toThrow();
    expect(() => assertNoForbiddenClaims("recovered revenue")).toThrow();
    expect(() => assertNoForbiddenClaims("autonomous saves")).toThrow();
  });

  it("assertNoForbiddenClaims passes on approved copy", () => {
    expect(() => assertNoForbiddenClaims(MARKETPLACE_LISTING.tagline)).not.toThrow();
    expect(() => assertNoForbiddenClaims(MARKETPLACE_LISTING.shortDescription)).not.toThrow();
    expect(() => assertNoForbiddenClaims(MARKETPLACE_LISTING.trust)).not.toThrow();
    for (const b of MARKETPLACE_LISTING.coreBullets) {
      expect(() => assertNoForbiddenClaims(b)).not.toThrow();
    }
  });
});

describe("marketplace permissions — minimal and justified", () => {
  it("every permission has id, label, justification, usedBy, required, declineFallback", () => {
    for (const p of PERMISSIONS) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.justification.length).toBeGreaterThan(20);
      expect(p.usedBy).toBeTruthy();
      expect(typeof p.required).toBe("boolean");
      expect(p.declineFallback.length).toBeGreaterThan(10);
    }
  });

  it("send_notification_to_member is required and re-approval is mandatory on scope change", () => {
    const send = PERMISSIONS.find((p) => p.id === "send_notification_to_member");
    expect(send).toBeDefined();
    expect(send?.required).toBe(true);
    expect(send?.reapprovalOnScopeChange).toBe(true);
  });

  it("manage_webhooks is required (entitlements depend on it)", () => {
    const webhooks = PERMISSIONS.find((p) => p.id === "manage_webhooks");
    expect(webhooks).toBeDefined();
    expect(webhooks?.required).toBe(true);
  });

  it("at most 6 permissions requested (minimal scope)", () => {
    expect(PERMISSIONS.length).toBeLessThanOrEqual(6);
  });
});

describe("marketplace app views — embedded vs standalone", () => {
  it("every view has path, label, surface, iframeEmbedded", () => {
    for (const v of APP_VIEWS) {
      expect(v.path).toBeTruthy();
      expect(v.label).toBeTruthy();
      expect(["creator_dashboard", "student_experience", "marketing"]).toContain(v.surface);
      expect(typeof v.iframeEmbedded).toBe("boolean");
    }
  });

  it("student experience route is NOT iframe-embedded (opaque token link)", () => {
    const student = APP_VIEWS.find((v) => v.surface === "student_experience");
    expect(student).toBeDefined();
    expect(student?.iframeEmbedded).toBe(false);
  });

  it("creator dashboard views ARE iframe-embedded", () => {
    const dashboards = APP_VIEWS.filter((v) => v.surface === "creator_dashboard");
    expect(dashboards.length).toBeGreaterThan(0);
    for (const d of dashboards) {
      expect(d.iframeEmbedded).toBe(true);
    }
  });
});

describe("marketplace iframe policy — runtime decisions", () => {
  it("dashboard route is allowed to embed with frame-ancestors", () => {
    const d = decideIframePolicy("/dashboard/co_123");
    expect(d.allowEmbed).toBe(true);
    expect(d.denyFrame).toBe(false);
    expect(d.frameAncestors).toContain("whop.com");
  });

  it("dashboard sub-route is allowed (e.g. /dashboard/co_123/rescue-queue)", () => {
    const d = decideIframePolicy("/dashboard/co_123/rescue-queue");
    expect(d.allowEmbed).toBe(true);
    expect(d.frameAncestors).toContain("whop.com");
  });

  it("onboarding is allowed (iframe-embedded onboarding)", () => {
    const d = decideIframePolicy("/onboarding");
    expect(d.allowEmbed).toBe(true);
  });

  it("student experience route is DENIED iframe", () => {
    const d = decideIframePolicy("/experiences/exp_abc/rescue/abc123token");
    expect(d.allowEmbed).toBe(false);
    expect(d.denyFrame).toBe(true);
  });

  it("student-rescue route is DENIED iframe", () => {
    const d = decideIframePolicy("/student-rescue");
    expect(d.allowEmbed).toBe(false);
    expect(d.denyFrame).toBe(true);
  });

  it("student-rescue/blocker is DENIED iframe", () => {
    const d = decideIframePolicy("/student-rescue/blocker");
    expect(d.allowEmbed).toBe(false);
    expect(d.denyFrame).toBe(true);
  });

  it("internal routes are DENIED iframe", () => {
    const d = decideIframePolicy("/internal");
    expect(d.allowEmbed).toBe(false);
    expect(d.denyFrame).toBe(true);
  });

  it("api routes are DENIED iframe by default", () => {
    const d = decideIframePolicy("/api/dashboard/co_123/rescue-queue");
    expect(d.allowEmbed).toBe(false);
    expect(d.denyFrame).toBe(true);
  });

  it("marketing root is DENIED iframe (not embedded)", () => {
    const d = decideIframePolicy("/");
    expect(d.allowEmbed).toBe(false);
    expect(d.denyFrame).toBe(true);
  });
});

describe("marketplace pilot analytics — allowlist + PII guard", () => {
  it("allowlist contains install → permissions → sync → candidate → approve → student-response events", () => {
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.install_started")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.permissions_granted")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.first_sync_completed")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.first_candidate_shown")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.message_approved")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.student_responded")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.observed_return")).toBe(true);
    expect(PILOT_EVENT_ALLOWLIST.has("pilot.cancellation_reason_recorded")).toBe(true);
  });

  it("sanitizePilotEvent throws on non-allowlisted event", () => {
    expect(() =>
      sanitizePilotEvent({
        event: "pilot.raw_student_message" as unknown as PilotEvent["event"],
        organizationId: "org_1",
      }),
    ).toThrow();
  });

  it("sanitizePilotEvent strips forbidden keys (student name, email, message content, token)", () => {
    const sanitized = sanitizePilotEvent({
      event: "pilot.message_approved",
      organizationId: "org_1",
      properties: {
        studentName: "Maya Chen",     // forbidden
        studentEmail: "maya@x.com",   // forbidden
        messageContent: "Hi Maya!",   // forbidden
        token: "tok_abc",             // forbidden
        // Allowed:
        interventionCount: 3,
        planTier: "rescue",
      },
    });
    expect(sanitized.properties).toBeDefined();
    const props = sanitized.properties as Record<string, unknown>;
    expect(props.studentName).toBeUndefined();
    expect(props.studentEmail).toBeUndefined();
    expect(props.messageContent).toBeUndefined();
    expect(props.token).toBeUndefined();
    expect(props.interventionCount).toBe(3);
    expect(props.planTier).toBe("rescue");
  });

  it("sanitizePilotEvent truncates long string values to 200 + suffix", () => {
    const longString = "x".repeat(500);
    const sanitized = sanitizePilotEvent({
      event: "pilot.permissions_granted",
      organizationId: "org_1",
      properties: { note: longString },
    });
    const props = sanitized.properties as Record<string, unknown>;
    expect(typeof props.note).toBe("string");
    expect((props.note as string).length).toBeLessThan(longString.length);
    expect((props.note as string).endsWith("...[truncated]")).toBe(true);
  });
});

describe("marketplace data lifecycle — actions cover pause/uninstall/export/delete/opt-out", () => {
  const requiredIds = ["pause", "uninstall", "export", "delete", "student_opt_out"];
  it("all required action ids are present", () => {
    const ids = DATA_LIFECYCLE_ACTIONS.map((a) => a.id);
    for (const id of requiredIds) {
      expect(ids).toContain(id);
    }
  });

  it("every action documents immediate, scheduled, retention, reversible", () => {
    for (const action of DATA_LIFECYCLE_ACTIONS) {
      expect(action.immediate.length).toBeGreaterThan(10);
      expect(action.scheduled.length).toBeGreaterThan(10);
      expect(action.retention.length).toBeGreaterThan(5);
      expect(typeof action.reversible).toBe("boolean");
    }
  });

  it("student_opt_out is irreversible (we honour the request forever)", () => {
    const optOut = DATA_LIFECYCLE_ACTIONS.find((a) => a.id === "student_opt_out");
    expect(optOut).toBeDefined();
    expect(optOut?.reversible).toBe(false);
  });

  it("uninstall includes a grace period (reversible)", () => {
    const uninstall = DATA_LIFECYCLE_ACTIONS.find((a) => a.id === "uninstall");
    expect(uninstall).toBeDefined();
    expect(uninstall?.reversible).toBe(true);
    expect(uninstall?.retention.toLowerCase()).toContain("grace");
  });
});

describe("marketplace listing readiness — static checklist", () => {
  it("checklist includes screenshots, video, legal, permissions, iframe, p0/p1 free", () => {
    const ids = LISTING_READINESS_STATIC.map((c) => c.id);
    expect(ids).toContain("screenshots");
    expect(ids).toContain("video");
    expect(ids).toContain("legal_pages");
    expect(ids).toContain("permissions_minimal");
    expect(ids).toContain("iframe_policy");
    expect(ids).toContain("p0_p1_free");
  });

  it("every check has id, label, status, rationale", () => {
    for (const c of LISTING_READINESS_STATIC) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(["ready", "blocked", "pending"]).toContain(c.status);
      expect(c.rationale.length).toBeGreaterThan(10);
    }
  });
});
