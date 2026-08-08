// /dashboard/[companyId]/settings/marketplace
//
// Marketplace listing preview page. Shows the RescueLoop Whop marketplace
// listing as it would appear to creators, including:
//   - Listing copy (name, tagline, description, trust line, bullets)
//   - Permissions with justifications
//   - Data lifecycle (retention, export, deletion, pause, uninstall)
//   - Pilot workflow instructions
//   - Analytics allowlist (14 allowlisted events)
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MARKETPLACE_LISTING,
} from "@/lib/whop/marketplace-listing";
import {
  APP_PERMISSIONS,
  getRequiredPermissions,
  getOptionalPermissions,
} from "@/lib/whop/app-permissions";
import type { OnboardingEventType } from "@/lib/onboarding/analytics";
import { Shield, Lock, Download, Trash2, Pause, X, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Analytics allowlist (14 events) ──────────────────────────────
// These are the 14 allowlisted OnboardingEventType values that may be
// sent to PostHog. No other events are sent. This list is shown to
// creators on the marketplace listing page for transparency.

const ANALYTICS_ALLOWLIST: OnboardingEventType[] = [
  "onboarding_started",
  "access_verified",
  "permission_missing",
  "mapping_viewed",
  "mapping_saved",
  "sync_started",
  "sync_stage_completed",
  "sync_failed",
  "threshold_previewed",
  "threshold_saved",
  "candidate_previewed",
  "first_value_reached",
  "zero_candidate_completed",
  "onboarding_abandoned",
];

// ─── Page component ───────────────────────────────────────────────

export default async function MarketplaceSettingsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  try {
    await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  const listing = MARKETPLACE_LISTING;
  const requiredPerms = getRequiredPermissions();
  const optionalPerms = getOptionalPermissions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <CompanyPageHeader
        title="Marketplace Listing"
        description="Preview of how RescueLoop appears in the Whop marketplace."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          Marketplace
        </Badge>
      </CompanyPageHeader>

      {/* ── Listing Preview ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{listing.name}</CardTitle>
          <p className="text-[15px] font-medium text-[var(--ink-secondary)]">
            {listing.tagline}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            {listing.shortDescription}
          </p>

          <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
            <p className="text-[14px] font-semibold text-[var(--ink-primary)]">
              {listing.trustLine}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-[16px] font-semibold text-[var(--ink-primary)]">
              What it does
            </h3>
            <ul className="space-y-2">
              {listing.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-[var(--ink-muted)]">•</span>
                  <span>
                    <strong className="text-[var(--ink-primary)]">
                      {bullet.heading}:
                    </strong>{" "}
                    <span className="text-[var(--ink-secondary)]">
                      {bullet.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-[16px] font-semibold text-[var(--ink-primary)]">
              What it does not do
            </h3>
            <ul className="space-y-1">
              {listing.doesNot.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-[13px] leading-relaxed text-[var(--ink-muted)]"
                >
                  <span className="mt-0.5 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ── Permissions ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5" />
            Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-[var(--ink-primary)]">
              Required
            </h3>
            {requiredPerms.map((perm) => (
              <PermissionCard key={perm.key} perm={perm} />
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-[var(--ink-primary)]">
              Optional
            </h3>
            {optionalPerms.map((perm) => (
              <PermissionCard key={perm.key} perm={perm} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Data Lifecycle ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="size-5" />
            Data Lifecycle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <h4 className="flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
                <Lock className="size-4" /> Retention
              </h4>
              <p>
                Data is retained for the duration of your active subscription plus 90 days.
                Student response data is retained as attribution evidence. Audit logs are
                retained indefinitely for compliance.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
                <Download className="size-4" /> Export
              </h4>
              <p>
                You can request a complete export of all your organisation&apos;s data at any time
                via Settings → Data Export. The export is generated asynchronously and provided
                as structured JSON.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
                <Trash2 className="size-4" /> Deletion
              </h4>
              <p>
                Request deletion of all organisation data at any time. A 24-hour grace period
                allows cancellation. After deletion, the organisation record is suspended (not
                dropped) and webhook payloads are redacted. Student data is fully removed.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
                <Pause className="size-4" /> Pause
              </h4>
              <p>
                Pause RescueLoop at any time. While paused, webhooks continue to be received
                and stored but no new interventions are created or delivered. Resume when
                ready — all queued data is processed on resume.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <h4 className="flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
              <X className="size-4" /> Uninstall
            </h4>
            <p>
              Uninstalling RescueLoop from your Whop dashboard stops webhook delivery. Your
              data remains for 90 days per the retention policy. To delete immediately,
              request data deletion before or after uninstalling.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Pilot Workflow ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pilot Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              <strong className="text-[var(--ink-primary)]">Install</strong> — Add
              RescueLoop from the Whop marketplace. Grant the requested permissions.
            </li>
            <li>
              <strong className="text-[var(--ink-primary)]">Map courses</strong> —
              Select which courses to monitor during the onboarding wizard.
            </li>
            <li>
              <strong className="text-[var(--ink-primary)]">First sync</strong> —
              RescueLoop pulls membership and progress data from Whop. This may take a
              few minutes for large courses.
            </li>
            <li>
              <strong className="text-[var(--ink-primary)]">Set thresholds</strong> —
              Choose what counts as &ldquo;needing help&rdquo;: never started, stalled, or
              at risk of churn.
            </li>
            <li>
              <strong className="text-[var(--ink-primary)]">Review candidates</strong> —
              See the first batch of students matching your criteria, with evidence for each.
            </li>
            <li>
              <strong className="text-[var(--ink-primary)]">Approve a message</strong> —
              Review the drafted support message, edit if needed, and approve. The message is
              sent only after your explicit approval.
            </li>
            <li>
              <strong className="text-[var(--ink-primary)]">Observe outcomes</strong> —
              Track whether the student responded, resumed the course, or remained inactive.
              Attribution is evidence-based.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* ── Analytics Allowlist ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="size-5" />
            Analytics Allowlist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          <p>
            RescueLoop sends a limited set of allowlisted analytics events to understand
            onboarding progress and surface permission issues. No message content, student
            free text, or secrets are ever included. Only these {ANALYTICS_ALLOWLIST.length}{" "}
            events may be tracked:
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {ANALYTICS_ALLOWLIST.map((event) => (
              <div
                key={event}
                className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2.5 py-1.5 font-mono text-[12px] text-[var(--ink-secondary)]"
              >
                {event}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[var(--ink-muted)]">
            Events are prefixed with <code className="font-mono text-[12px]">organization.</code>{" "}
            in PostHog. Metadata is sanitized to remove PII, secrets, and long strings
            before sending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Permission sub-component ─────────────────────────────────────

function PermissionCard({
  perm,
}: {
  perm: (typeof APP_PERMISSIONS)[number];
}) {
  return (
    <div className="rounded-md border border-[var(--hairline)] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-semibold text-[var(--ink-primary)]">
          {perm.name}
        </span>
        <Badge
          variant={perm.required ? "default" : "outline"}
          className="font-mono text-[10px]"
        >
          {perm.required ? "required" : "optional"}
        </Badge>
      </div>

      <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
        {perm.description}
      </p>

      <div className="space-y-1 text-[13px] text-[var(--ink-muted)]">
        <p>
          <strong className="text-[var(--ink-secondary)]">Used by:</strong>{" "}
          {perm.usedBy}
        </p>
        <p>
          <strong className="text-[var(--ink-secondary)]">Justification:</strong>{" "}
          {perm.justification}
        </p>
        <p>
          <strong className="text-[var(--ink-secondary)]">If declined:</strong>{" "}
          {perm.declineFallback}
        </p>
        <p>
          <strong className="text-[var(--ink-secondary)]">On re-approval:</strong>{" "}
          {perm.reapprovalBehavior}
        </p>
      </div>
    </div>
  );
}
