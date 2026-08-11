// /dashboard/[companyId]/settings
//
// Real v1 settings. Only shows settings backed by real data/models.
// No dead toggles, no placeholder cards.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { isWhopConfigured } from "@/lib/env/server";
import {
  CompanyPageHeader,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  let ctx;
  try {
    ctx = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  const organizationId = ctx.organizationId;
  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;
  const whopReady = isWhopConfigured();

  // ─── Fetch org + installation ────────────────────────────────
  let org, installation, lastWebhook;
  try {
    [org, installation, lastWebhook] = await Promise.all([
      db.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          status: true,
          isPaused: true,
          planTier: true,
          entitlementState: true,
          billingGracePeriodEnds: true,
          billingManageUrl: true,
        },
      }),
      db.whopInstallation.findUnique({
        where: { whopCompanyId: companyId },
        select: { status: true, installedAt: true },
      }),
      db.webhookReceipt.findFirst({
        where: { organizationId },
        orderBy: { receivedAt: "desc" },
        select: { receivedAt: true, status: true },
      }),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-5xl">
        <CompanyPageHeader title="Settings" description="Organisation settings, safety rules, and Whop sync health." />
        <Card className="border-[var(--critical)]/30">
          <CardContent className="py-8 text-center text-[13px] text-[var(--ink-secondary)]">
            Unable to load settings. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-5xl">
        <CompanyPageHeader title="Settings" description="Organisation settings, safety rules, and Whop sync health." />
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-[13px] text-[var(--ink-secondary)]">
            Organisation not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Settings"
        description="Organisation settings, safety rules, and Whop sync health."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {org.planTier}
        </Badge>
      </CompanyPageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Organisation identity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Settings className="size-4 text-[var(--ink-muted)]" />
              Organisation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row label="Name" value={org.name} />
            <Row
              label="Status"
              value={
                <Badge variant="outline" className={`font-mono text-[11px] ${org.status === "active" ? "text-[#27966A]" : "text-[var(--ink-muted)]"}`}>
                  {org.status}
                </Badge>
              }
            />
            <Row label="Plan tier" value={org.planTier} mono />
            <Row
              label="Entitlement"
              value={
                <Badge variant="outline" className={`font-mono text-[11px] ${entitlementColor(org.entitlementState)}`}>
                  {org.entitlementState}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {/* Emergency pause */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              {org.isPaused
                ? <PauseCircle className="size-4 text-[var(--critical)]" />
                : <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />}
              Emergency Pause
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row
              label="Automation"
              value={
                <Badge variant="outline" className={`font-mono text-[11px] ${org.isPaused ? "text-[#C64D45] border-[#E8C9C5]" : "text-[#27966A] border-[#C7E6D5]"}`}>
                  {org.isPaused ? "Paused" : "Active"}
                </Badge>
              }
            />
            <p className="text-[12px] text-[var(--ink-secondary)]">
              {org.isPaused
                ? "No interventions will be sent until you resume."
                : "Interventions are being sent according to your safety rules."}
            </p>
            {/* Grace period if billing error */}
            {org.entitlementState === "billing_error" && org.billingGracePeriodEnds && (
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--warning)]">
                <AlertTriangle className="size-3" />
                Grace period ends {fmtRelative(org.billingGracePeriodEnds)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Whop integration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              {installation?.status === "active"
                ? <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
                : <AlertTriangle className="size-4 text-[var(--warning)]" />}
              Whop Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row
              label="Installation"
              value={
                <Badge variant="outline" className="font-mono text-[11px] uppercase">
                  {installation?.status ?? "none"}
                </Badge>
              }
            />
            <Row
              label="API config"
              value={
                <Badge variant="outline" className={`font-mono text-[11px] ${whopReady ? "text-[#27966A]" : "text-[#C64D45]"}`}>
                  {whopReady ? "Configured" : "Missing"}
                </Badge>
              }
            />
            {lastWebhook && (
              <Row
                label="Last webhook"
                value={`${fmtRelative(lastWebhook.receivedAt)} (${lastWebhook.status})`}
                mono
              />
            )}
            <Link
              href={`${basePath}/settings/health`}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--recovery-green)] hover:underline"
            >
              <Activity className="size-3.5" />
              Health &amp; sync diagnostics
            </Link>
          </CardContent>
        </Card>

        {/* Billing */}
        {org.billingManageUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <Settings className="size-4 text-[var(--ink-muted)]" />
                Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <a
                href={org.billingManageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--recovery-green)] hover:underline"
              >
                Manage subscription
                <ExternalLink className="size-3.5" />
              </a>
              {org.entitlementState === "billing_error" && org.billingGracePeriodEnds && (
                <p className="text-[12px] text-[var(--warning)]">
                  Payment issue — grace period ends {org.billingGracePeriodEnds.toLocaleDateString()}.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
      <span className={`text-[13px] text-[var(--ink-primary)] ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function entitlementColor(state: string): string {
  switch (state) {
    case "active": return "text-[#27966A] border-[#C7E6D5]";
    case "billing_error": return "text-[#D89222] border-[#F5E0C2]";
    case "inactive": return "text-[#C64D45] border-[#E8C9C5]";
    case "pilot_override": return "text-[#4C7ECF] border-[#C9DCF5]";
    default: return "";
  }
}

function fmtRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
