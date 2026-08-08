import "server-only";
// Production Gates — WP09
//
// Encodes the non-negotiable invariants that must hold before promotion to main.
// These are runtime-checked at startup AND unit-tested.
//
// Mirrors FINAL_DEFINITION_OF_DONE.md and ACCEPTANCE.md for WP-09.

export interface ProductionGate {
  id: string;
  label: string;
  category: "database" | "security" | "reliability" | "observability" | "performance" | "release";
  /** Whether the gate can be checked at build time vs requires runtime. */
  checkableAt: "build" | "runtime";
  /** The invariant this gate enforces. */
  invariant: string;
}

export const PRODUCTION_GATES: readonly ProductionGate[] = [
  // ── Database ─────────────────────────────────────────────
  {
    id: "db_migration_rehearsal_passed",
    label: "Migration rehearsal passes on production-like clone",
    category: "database",
    checkableAt: "runtime",
    invariant:
      "All pending Prisma migrations apply cleanly to a Neon branch cloned from production, " +
      "and the resulting schema matches `prisma/schema.prisma` exactly. No `prisma migrate reset` " +
      "or `prisma db push --accept-data-loss` is permitted against production.",
  },
  {
    id: "db_backup_taken",
    label: "Neon backup taken before migration",
    category: "database",
    checkableAt: "runtime",
    invariant:
      "A Neon branch named `pre-migration-<sha>` exists and a `pg_dump` was exported before any " +
      "migration runs against production. Recovery point is recorded in the operations ledger.",
  },
  {
    id: "db_no_reset_in_prod",
    label: "No migrate reset / db push against production",
    category: "database",
    checkableAt: "build",
    invariant:
      "Scripts and CI never invoke `prisma migrate reset` or `prisma db push --accept-data-loss` " +
      "with DATABASE_URL pointing at production.",
  },

  // ── Security / Tenancy ───────────────────────────────────
  {
    id: "cross_tenant_blocked",
    label: "Cross-tenant read/write blocked",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Every query that reads or writes organization-scoped data must include `organizationId` " +
      "in the WHERE clause. Direct-ID attacks return null. Verified by tenant-isolation integration tests.",
  },
  {
    id: "fixture_mode_impossible_in_prod",
    label: "Fixture mode impossible in production",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "When VERCEL_ENV=production, RESCUELOOP_FIXTURE_MODE=true throws immediately. Provider " +
      "mode is forced to 'whop' or 'unconfigured'. Connected mode never falls through to fixture data.",
  },
  {
    id: "internal_routes_protected",
    label: "Internal routes require internal token",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Every /api/internal/* route calls requireInternalAuth(). The token must be ≥32 chars. " +
      "Failures return 401 and an audit record.",
  },
  {
    id: "student_tokens_opaque",
    label: "Student tokens are opaque and non-enumerable",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Student access tokens are HMAC-signed, scoped to one intervention, expire after a fixed " +
      "window, and never appear in URLs/logs/analytics. Only the SHA-256 hash is stored.",
  },
  {
    id: "webhooks_signed_replay_safe",
    label: "Webhooks are signed and replay-safe",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Whop webhooks are verified using Standard Webhooks signatures, deduplicated by event id, " +
      "and timestamps older than 5 minutes are rejected.",
  },
  {
    id: "open_redirects_rejected",
    label: "Open redirects rejected at the edge",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Middleware rejects any ?next= or ?redirect= param that is not a same-origin relative path. " +
      "Protocol-relative (//evil.com) and absolute URLs are blocked.",
  },
  {
    id: "export_deletion_tenant_scoped",
    label: "Export and deletion are tenant-scoped",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Data export and deletion endpoints filter by the authenticated organizationId. " +
      "An org admin cannot export or delete another org's data.",
  },
  {
    id: "admin_overrides_audited",
    label: "Admin overrides are audited",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Every internal override (pilot grant, plan override, manual retry) writes an audit record " +
      "with actor, reason, previous state, new state, and tenant scope.",
  },
  {
    id: "secrets_redacted",
    label: "Secrets redacted from logs and error responses",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "WHOP_API_KEY, WHOP_WEBHOOK_SECRET, DATABASE_URL, STUDENT_LINK_SIGNING_SECRET, " +
      "RESCUELOOP_INTERNAL_TOKEN, CRON_SECRET never appear in any log line or error response.",
  },
  {
    id: "csp_and_security_headers",
    label: "CSP and security headers present",
    category: "security",
    checkableAt: "runtime",
    invariant:
      "Responses include frame-ancestors CSP (whop.com only on embedded routes; 'none' elsewhere), " +
      "X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.",
  },

  // ── Reliability ──────────────────────────────────────────
  {
    id: "outbox_durable_idempotent",
    label: "Outbox is durable and idempotent",
    category: "reliability",
    checkableAt: "runtime",
    invariant:
      "Outbox events use idempotency keys; dispatcher retries with bounded exponential backoff; " +
      "exhausted retries move to dead-letter. Verified by outbox-integrity integration tests.",
  },
  {
    id: "webhook_out_of_order_safe",
    label: "Webhook processing is out-of-order safe",
    category: "reliability",
    checkableAt: "runtime",
    invariant:
      "Webhook handlers dedupe by event id and use the event timestamp to determine the latest " +
      "state. A late-arriving event does not overwrite a newer state.",
  },
  {
    id: "sync_checkpointed",
    label: "Sync is checkpointed and resumable",
    category: "reliability",
    checkableAt: "runtime",
    invariant:
      "Sync writes checkpoints per page; on resume it continues from the last checkpoint. " +
      "Stale runs are detected by run id and aborted.",
  },
  {
    id: "emergency_pause_operable",
    label: "Emergency pause remains operable",
    category: "reliability",
    checkableAt: "runtime",
    invariant:
      "The pause flag is checked at submission time. A paused organization's pending " +
      "notifications are not submitted; new candidates are not surfaced until resumed.",
  },

  // ── Observability ────────────────────────────────────────
  {
    id: "sentry_env_separated",
    label: "Sentry environment is set correctly per Vercel env",
    category: "observability",
    checkableAt: "runtime",
    invariant:
      "Sentry environment tag is 'production' for VERCEL_ENV=production, 'preview' for previews, " +
      "'development' locally. Source maps are uploaded with the matching release.",
  },
  {
    id: "posthog_allowlist_enforced",
    label: "PostHog allowlist enforced",
    category: "observability",
    checkableAt: "runtime",
    invariant:
      "Only events on the explicit allowlist are sent to PostHog. Student free-text, names, " +
      "emails, tokens, and IPs are stripped by sanitizeProperties().",
  },
  {
    id: "no_student_free_text_in_analytics",
    label: "No student free text in analytics",
    category: "observability",
    checkableAt: "runtime",
    invariant:
      "Pilot event properties and PostHog properties never include student message content, " +
      "blocker descriptions, or any free-text field. Enforced by sanitizePilotEvent() and " +
      "sanitizeProperties().",
  },

  // ── Performance / Iframe ─────────────────────────────────
  {
    id: "iframe_widths_supported",
    label: "Common Whop iframe widths render without overflow",
    category: "performance",
    checkableAt: "runtime",
    invariant:
      "Layouts are tested at 360px, 768px, 1024px, 1280px, and 1440px widths. Common Whop " +
      "iframe widths (typically 1024–1280px) show no horizontal scroll.",
  },
  {
    id: "no_huge_hydration_payloads",
    label: "No huge hydration payloads",
    category: "performance",
    checkableAt: "build",
    invariant:
      "Server components pass only serializable primitives to client components. Lists over " +
      "100 items are paginated or virtualized.",
  },

  // ── Release ──────────────────────────────────────────────
  {
    id: "production_branch_is_main",
    label: "Production Vercel source branch is main",
    category: "release",
    checkableAt: "runtime",
    invariant:
      "Vercel production deployment is triggered from the `main` branch, not from " +
      "`integration/rescueloop-v1` or any `agent/*` branch.",
  },
  {
    id: "rollback_available",
    label: "Rollback procedure documented and tested",
    category: "release",
    checkableAt: "runtime",
    invariant:
      "A previous READY Vercel deployment is identified before promotion. Code rollback uses " +
      "Vercel's instant rollback. Database rollback follows the migration recovery plan " +
      "(never blind reversal).",
  },
  {
    id: "no_p0_p1_runtime_errors",
    label: "No unexplained P0/P1 runtime errors",
    category: "release",
    checkableAt: "runtime",
    invariant:
      "After production deploy, Sentry shows zero unexplained P0/P1 errors in the first hour. " +
      "Any error that does appear is either fixed, rolled back, or documented as known debt.",
  },
  {
    id: "controlled_notification_succeeds",
    label: "Controlled notification succeeds with accepted semantics",
    category: "release",
    checkableAt: "runtime",
    invariant:
      "A single owner-controlled test notification is submitted to Whop and the response is " +
      "'accepted' (queued) — not 'delivered'. The accepted state is recorded in the value ledger.",
  },
  {
    id: "controlled_billing_succeeds",
    label: "Controlled billing succeeds with server-confirmed entitlement",
    category: "release",
    checkableAt: "runtime",
    invariant:
      "A single owner-controlled test checkout completes and the webhook updates the " +
      "SubscriptionEntitlement row. The entitlement engine returns the upgraded plan tier. " +
      "Client checkout callback does NOT grant access.",
  },
] as const;

// ─── Build-time static checks ──────────────────────────────

export interface BuildTimeCheckResult {
  gateId: string;
  status: "pass" | "fail";
  detail: string;
}

/**
 * Run build-time static checks against the codebase.
 * This function is called from a unit test — it does NOT execute the codebase.
 * It checks that no destructive db scripts target production.
 */
export function runBuildTimeChecks(sourceFiles: ReadonlyArray<{ path: string; content: string }>): BuildTimeCheckResult[] {
  const results: BuildTimeCheckResult[] = [];

  // Check: no migrate reset or db push --accept-data-loss in tracked scripts
  const destructivePatterns = [
    { pattern: /prisma\s+migrate\s+reset/, label: "prisma migrate reset" },
    { pattern: /prisma\s+db\s+push\s+--accept-data-loss/, label: "prisma db push --accept-data-loss" },
  ];

  for (const file of sourceFiles) {
    for (const { pattern, label } of destructivePatterns) {
      // Test files are exempt — they may reference destructive commands in assertions
      const isTest = file.path.includes(".test.") || file.path.includes("/tests/");
      if (isTest) continue;
      // Walk lines; if a match is on a code line (not a comment), fail
      const lines = file.content.split("\n");
      let foundInCode = false;
      for (const line of lines) {
        if (pattern.test(line)) {
          const trimmed = line.trim();
          // Skip shell-style comments (# ...) and JS-style comments (// ...)
          if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
          // Skip lines that are entirely a comment block (/* ... */) — naive check
          if (trimmed.startsWith("/*") && trimmed.endsWith("*/")) continue;
          foundInCode = true;
          break;
        }
      }
      if (foundInCode) {
        results.push({
          gateId: "db_no_reset_in_prod",
          status: "fail",
          detail: `Destructive command "${label}" found in ${file.path}`,
        });
      }
    }
  }

  // If no failures recorded, the gate passes
  if (!results.some((r) => r.gateId === "db_no_reset_in_prod" && r.status === "fail")) {
    results.push({
      gateId: "db_no_reset_in_prod",
      status: "pass",
      detail: "No destructive Prisma commands in production source.",
    });
  }

  return results;
}

// ─── Production promotion checklist ────────────────────────

export interface PromotionChecklistItem {
  id: string;
  label: string;
  /** Who must perform this step. */
  owner: "engineer" | "owner" | "automated";
  /** Whether the step is blocking. */
  blocking: boolean;
}

export const PROMOTION_CHECKLIST: readonly PromotionChecklistItem[] = [
  { id: "merge_to_main", label: "Merge integration/rescueloop-v1 → main (normal merge, no force-push)", owner: "engineer", blocking: true },
  { id: "vercel_main_deploy_ready", label: "Vercel production deploy from main reaches READY", owner: "automated", blocking: true },
  { id: "runtime_logs_inspected", label: "Inspect Vercel runtime logs — no unexplained errors", owner: "engineer", blocking: true },
  { id: "sentry_env_verified", label: "Sentry environment tag = production; source maps uploaded", owner: "engineer", blocking: true },
  { id: "posthog_env_verified", label: "PostHog environment = production; allowlist events arriving", owner: "engineer", blocking: true },
  { id: "webhook_endpoint_live", label: "POST /api/webhooks/whop returns 200 on signed ping", owner: "engineer", blocking: true },
  { id: "billing_endpoint_live", label: "POST /api/dashboard/[companyId]/billing/checkout returns checkout URL", owner: "engineer", blocking: true },
  { id: "controlled_notification", label: "Send one owner-controlled test notification; confirm Whop 'accepted'", owner: "owner", blocking: true },
  { id: "controlled_billing", label: "Complete one owner-controlled test checkout; confirm entitlement upgrades server-side", owner: "owner", blocking: true },
  { id: "rollback_identified", label: "Identify previous READY deployment ID for instant rollback", owner: "engineer", blocking: true },
  { id: "pilot_smoke_test", label: "Pilot creator completes: install → sync → candidate → approve → response → observed return", owner: "owner", blocking: false },
] as const;
