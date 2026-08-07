// /companies/[companyId]/settings
//
// Server component. Shows organisation settings (quiet hours, cooldown, max
// messages, campaign status), the pause/resume toggle, and sync status.

import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  InstallationMissingError,
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
} from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  AuthErrorCard,
  CompanyPageHeader,
  InstallationRequiredCard,
} from "@/components/rescueloop/company/state-cards";
import { OrgPauseToggle } from "@/components/rescueloop/company/org-pause-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Gauge,
  MessageSquare,
  Moon,
  RefreshCw,
  Activity,
  Plug,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    if (error instanceof InstallationMissingError) {
      return (
        <div className="mx-auto max-w-3xl">
          <InstallationRequiredCard companyId={companyId} />
        </div>
      );
    }
    if (error instanceof MissingTokenError) {
      return (
        <AuthErrorCard
          title="Sign in required"
          description="Open this page from your Whop dashboard to verify your admin access."
          hint="Missing Whop user token"
        />
      );
    }
    if (error instanceof InvalidTokenError) {
      return (
        <AuthErrorCard
          title="Session expired"
          description="Your Whop session has expired. Please reopen this page from your Whop dashboard."
          hint="Invalid or expired token"
        />
      );
    }
    if (error instanceof WhopUnavailableError) {
      return (
        <AuthErrorCard
          title="Whop is unavailable"
          description="We couldn't reach Whop to verify your access. Please try again in a moment."
          hint="Authentication service unavailable"
        />
      );
    }
    if (error instanceof InsufficientAccessError) {
      return (
        <AuthErrorCard
          title="Admin access required"
          description="Only company admins can view organisation settings."
          hint={error.message}
        />
      );
    }
    throw error;
  }

  // Load the organisation + campaigns + sync status in parallel
  const [org, campaigns, lastWebhook, installation] = await Promise.all([
    db.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        isPaused: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        timezone: true,
        planTier: true,
        createdAt: true,
      },
    }),
    db.campaign.findMany({
      where: { organizationId: ctx.organizationId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        approvalMode: true,
        cooldownDays: true,
        maxMessagesPerStudent: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    }),
    db.webhookReceipt.findFirst({
      where: { organizationId: ctx.organizationId },
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true, eventType: true, status: true },
    }),
    db.whopInstallation.findFirst({
      where: { organizationId: ctx.organizationId },
      select: {
        whopCompanyId: true,
        status: true,
        installedAt: true,
        grantedScopes: true,
      },
    }),
  ]);

  if (!org) {
    return (
      <AuthErrorCard
        title="Organisation not found"
        description="The organisation backing this Whop company could not be located."
      />
    );
  }

  const activeCampaign = campaigns.find((c) => c.status === "active");

  return (
    <div className="mx-auto max-w-4xl">
      <CompanyPageHeader
        title="Organisation settings"
        description="Safety rules, campaign status, and Whop sync health for this organisation."
      >
        <OrgPauseToggle companyId={companyId} isPaused={org.isPaused} />
      </CompanyPageHeader>

      {/* Status banner */}
      {org.isPaused && (
        <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--critical)]/30 bg-[var(--critical-light)]/40 p-3">
          <Activity className="size-4 shrink-0 text-[var(--critical)]" />
          <p className="text-[13px] text-[var(--ink-primary)]">
            <span className="font-medium">Automation is paused.</span>{" "}
            <span className="text-[var(--ink-secondary)]">
              No interventions will be sent until you resume.
            </span>
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Organisation overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Plug className="size-4 text-[var(--recovery-green)]" />
              Organisation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Name" value={org.name} />
            <Row
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] uppercase"
                >
                  {org.isPaused ? "paused" : org.status}
                </Badge>
              }
            />
            <Row label="Plan tier" value={org.planTier} mono />
            <Row label="Timezone" value={org.timezone} mono />
            <Row
              label="Created"
              value={formatDate(org.createdAt)}
              mono
            />
            {installation && (
              <>
                <div className="my-1 border-t border-[var(--hairline)]" />
                <Row
                  label="Whop company"
                  value={installation.whopCompanyId}
                  mono
                />
                <Row
                  label="Installation"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-[var(--recovery-green)]" />
                      <span className="font-mono text-[12px]">
                        {installation.status}
                      </span>
                    </span>
                  }
                />
                <Row
                  label="Installed"
                  value={formatDate(installation.installedAt)}
                  mono
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Safety rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Gauge className="size-4 text-[var(--recovery-green)]" />
              Safety rules
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activeCampaign ? (
              <>
                <Row
                  label="Quiet hours"
                  icon={Moon}
                  value={`${activeCampaign.quietHoursStart} → ${activeCampaign.quietHoursEnd}`}
                  mono
                />
                <Row
                  label="Cooldown"
                  icon={Clock}
                  value={`${activeCampaign.cooldownDays} days`}
                  mono
                />
                <Row
                  label="Max messages"
                  icon={MessageSquare}
                  value={`${activeCampaign.maxMessagesPerStudent} / member / month`}
                  mono
                />
                <Row
                  label="Approval mode"
                  value={
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] uppercase"
                    >
                      {activeCampaign.approvalMode}
                    </Badge>
                  }
                />
                <div className="my-1 border-t border-[var(--hairline)]" />
                <Row label="Campaign" value={activeCampaign.name} />
                <Row label="Type" value={activeCampaign.type} mono />
              </>
            ) : (
              <p className="text-[13px] text-[var(--ink-muted)]">
                No active campaign. Complete onboarding to configure safety
                rules.
              </p>
            )}

            {/* Org-level quiet hours override (if set) */}
            {org.quietHoursStart && org.quietHoursEnd && (
              <div className="mt-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-2.5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                  Org override
                </p>
                <p className="mt-0.5 font-mono text-[12px] text-[var(--ink-secondary)]">
                  quiet hours {org.quietHoursStart} → {org.quietHoursEnd}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <RefreshCw className="size-4 text-[var(--recovery-green)]" />
              Sync status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row
              label="Data source"
              value="Whop webhooks (Standard Webhooks)"
              mono
            />
            <Row
              label="Last webhook"
              value={
                lastWebhook
                  ? `${formatDateTime(lastWebhook.receivedAt)} · ${lastWebhook.eventType}`
                  : "No webhooks received yet"
              }
              mono
            />
            <Row
              label="Webhook status"
              value={
                lastWebhook ? (
                  <Badge
                    variant="outline"
                    className="font-mono text-[11px] uppercase"
                  >
                    {lastWebhook.status}
                  </Badge>
                ) : (
                  <span className="font-mono text-[12px] text-[var(--ink-muted)]">
                    —
                  </span>
                )
              }
            />
            {installation && (
              <Row
                label="Granted scopes"
                value={
                  installation.grantedScopes.length > 0
                    ? installation.grantedScopes.join(", ")
                    : "—"
                }
                mono
              />
            )}
            <div className="mt-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
              <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                RescueLoop ingests membership, payment, and course-progress
                events from Whop in real time. Eligibility is re-evaluated as
                each event lands. The pilot uses manual approval — no message
                is sent without your sign-off.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  icon?: typeof Clock;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[12px] text-[var(--ink-secondary)]">
        {Icon && <Icon className="size-3 text-[var(--ink-muted)]" />}
        {label}
      </span>
      <span
        className={`text-[13px] text-[var(--ink-primary)] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
