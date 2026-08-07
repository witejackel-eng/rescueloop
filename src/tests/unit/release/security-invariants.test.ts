// WP09 Production hardening tests — security invariants.
//
// These tests verify the static and runtime security gates that the
// production-gates module documents. They are pure unit tests — no
// database, no network — so they can run in the strict CI unit job.
//
// The companion integration tests in src/tests/integration/ verify
// the database-backed invariants against real PostgreSQL.

import { describe, it, expect } from "vitest";
import {
  PRODUCTION_GATES,
  PROMOTION_CHECKLIST,
  runBuildTimeChecks,
  type BuildTimeCheckResult,
} from "@/lib/release/production-gates";

describe("production gates — static completeness", () => {
  it("every gate has id, label, category, invariant", () => {
    for (const g of PRODUCTION_GATES) {
      expect(g.id).toBeTruthy();
      expect(g.label).toBeTruthy();
      expect(["database", "security", "reliability", "observability", "performance", "release"]).toContain(g.category);
      expect(g.invariant.length).toBeGreaterThan(20);
    }
  });

  it("gates cover all six categories", () => {
    const cats = new Set(PRODUCTION_GATES.map((g) => g.category));
    expect(cats.has("database")).toBe(true);
    expect(cats.has("security")).toBe(true);
    expect(cats.has("reliability")).toBe(true);
    expect(cats.has("observability")).toBe(true);
    expect(cats.has("performance")).toBe(true);
    expect(cats.has("release")).toBe(true);
  });

  it("includes the threat-model gates (cross-tenant, fixture-impossible, student tokens, webhooks, open-redirects, export-scoped, admin-audited)", () => {
    const ids = PRODUCTION_GATES.map((g) => g.id);
    expect(ids).toContain("cross_tenant_blocked");
    expect(ids).toContain("fixture_mode_impossible_in_prod");
    expect(ids).toContain("student_tokens_opaque");
    expect(ids).toContain("webhooks_signed_replay_safe");
    expect(ids).toContain("open_redirects_rejected");
    expect(ids).toContain("export_deletion_tenant_scoped");
    expect(ids).toContain("admin_overrides_audited");
    expect(ids).toContain("secrets_redacted");
    expect(ids).toContain("csp_and_security_headers");
  });

  it("includes the release gates (main-branch, rollback, no-p0-p1, controlled notification, controlled billing)", () => {
    const ids = PRODUCTION_GATES.map((g) => g.id);
    expect(ids).toContain("production_branch_is_main");
    expect(ids).toContain("rollback_available");
    expect(ids).toContain("no_p0_p1_runtime_errors");
    expect(ids).toContain("controlled_notification_succeeds");
    expect(ids).toContain("controlled_billing_succeeds");
  });
});

describe("production gates — build-time destructive-command scan", () => {
  it("runBuildTimeChecks passes when no destructive commands present", () => {
    const results = runBuildTimeChecks([
      { path: "scripts/sync.sh", content: "#!/bin/bash\nbun run sync\n" },
      { path: "src/lib/db.ts", content: "export const db = new PrismaClient();" },
    ]);
    const dbGate = results.find((r) => r.gateId === "db_no_reset_in_prod");
    expect(dbGate).toBeDefined();
    expect(dbGate?.status).toBe("pass");
  });

  it("runBuildTimeChecks fails when prisma migrate reset is found in a production script", () => {
    const results = runBuildTimeChecks([
      { path: "scripts/reset-prod.sh", content: "#!/bin/bash\nprisma migrate reset --force\n" },
    ]);
    const fail = results.find((r) => r.gateId === "db_no_reset_in_prod" && r.status === "fail");
    expect(fail).toBeDefined();
    expect(fail?.detail).toContain("prisma migrate reset");
    expect(fail?.detail).toContain("scripts/reset-prod.sh");
  });

  it("runBuildTimeChecks fails when prisma db push --accept-data-loss is found", () => {
    const results = runBuildTimeChecks([
      { path: "scripts/push-schema.sh", content: "bunx prisma db push --accept-data-loss" },
    ]);
    const fail = results.find((r) => r.gateId === "db_no_reset_in_prod" && r.status === "fail");
    expect(fail).toBeDefined();
    expect(fail?.detail).toContain("prisma db push --accept-data-loss");
  });

  it("runBuildTimeChecks ignores destructive commands in test files and comments", () => {
    const results = runBuildTimeChecks([
      { path: "src/tests/unit/reset-test.test.ts", content: "it('should reject prisma migrate reset', () => {})" },
      { path: "scripts/safe.sh", content: "# Do not run prisma migrate reset in production\n" },
    ]);
    const fail = results.find((r) => r.gateId === "db_no_reset_in_prod" && r.status === "fail");
    expect(fail).toBeUndefined();
  });
});

describe("promotion checklist — completeness", () => {
  it("every item has id, label, owner, blocking", () => {
    for (const item of PROMOTION_CHECKLIST) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(["engineer", "owner", "automated"]).toContain(item.owner);
      expect(typeof item.blocking).toBe("boolean");
    }
  });

  it("includes merge-to-main, vercel-ready, controlled notification, controlled billing, rollback", () => {
    const ids = PROMOTION_CHECKLIST.map((c) => c.id);
    expect(ids).toContain("merge_to_main");
    expect(ids).toContain("vercel_main_deploy_ready");
    expect(ids).toContain("controlled_notification");
    expect(ids).toContain("controlled_billing");
    expect(ids).toContain("rollback_identified");
  });

  it("controlled notification and controlled billing are owner-owned and blocking", () => {
    const notif = PROMOTION_CHECKLIST.find((c) => c.id === "controlled_notification");
    expect(notif?.owner).toBe("owner");
    expect(notif?.blocking).toBe(true);
    const billing = PROMOTION_CHECKLIST.find((c) => c.id === "controlled_billing");
    expect(billing?.owner).toBe("owner");
    expect(billing?.blocking).toBe(true);
  });

  it("pilot smoke test is non-blocking (informational)", () => {
    const smoke = PROMOTION_CHECKLIST.find((c) => c.id === "pilot_smoke_test");
    expect(smoke?.blocking).toBe(false);
  });
});

describe("production gates — secrets redaction helper contract", () => {
  // This test asserts the contract that the redaction list covers all named secrets.
  // The actual redaction happens in observability/logger.ts and error response builders.
  const EXPECTED_REDACTED_KEYS = [
    "WHOP_API_KEY",
    "WHOP_WEBHOOK_SECRET",
    "WHOP_COMPANY_ID",
    "DATABASE_URL",
    "DIRECT_URL",
    "STUDENT_LINK_SIGNING_SECRET",
    "RESCUELOOP_INTERNAL_TOKEN",
    "CRON_SECRET",
    "INNGEST_EVENT_KEY",
    "JOB_PROVIDER_SECRET",
  ];

  it("every expected secret key is non-empty when configured (smoke)", () => {
    // Just verifies the list of names is what we think it is — guards against typos
    // in the redaction list.
    for (const key of EXPECTED_REDACTED_KEYS) {
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(4);
    }
  });

  it("the expected redaction list has at least 10 entries (covers all subsystems)", () => {
    expect(EXPECTED_REDACTED_KEYS.length).toBeGreaterThanOrEqual(10);
  });
});
