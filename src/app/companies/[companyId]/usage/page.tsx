// /companies/[companyId]/usage
//
// Database-backed usage page. Shows current plan, billing period,
// monitored members, courses, active campaigns, team seats,
// candidates evaluated, interventions created, notifications accepted,
// stored source events, exports, soft warnings, hard limits, plan overrides.
// No checkout needed yet.

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";
import { db } from "@/lib/db";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
  InstallationMissingError,
} from "@/lib/auth/whop-auth";
import { getOrganizationPlan, checkLimit } from "@/lib/usage/enforcement";
import { PLANS, type MetricKey } from "@/lib/usage/plans";
import { getUsageForPeriod } from "@/lib/usage/metering";
import {
  AuthErrorCard,
  CompanyPageHeader,
  InstallationRequiredCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gauge,
  FlaskConical,
  Users,
  GraduationCap,
  Megaphone,
  UserCheck,
  Target,
  Bell,
  Database,
  Download,
  AlertTriangle,
  CheckCircle2,
  Infinity as InfinityIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const mode = getProviderMode();

  let organizationId: string;
  if (mode === "fixture") {
    organizationId = FIXTURE_COMPANY_ID;
  } else if (mode === "whop") {
    let auth;
    try {
      auth = await requireCompanyAdmin(companyId);
    } catch (error) {
      if (error instanceof InstallationMissingError) {
        return (
          <div className="mx-auto max-w-3xl">
            <InstallationRequiredCard companyId={companyId} />
          </div>
        );
      }
      return <div className="mx-auto max-w-3xl">{AuthErrorCardFor(error)}</div>;
    }
    organizationId = auth.organizationId;
  } else {
    redirect("/onboarding");
  }

  if (mode === "fixture") {
    return <FixtureUsage />;
  }

  // ─── Whop mode ───────────────────────────────────────────────
  const planTier = await getOrganizationPlan(organizationId);
  const plan = PLANS[planTier];
  const usage = await getUsageForPeriod(organizationId);

  const [studentCount, courseCount, campaignCount, memberCount, entitlement] = await Promise.all([
    db.student.count({ where: { organizationId } }),
    db.course.count({ where: { organizationId } }),
    db.campaign.count({ where: { organizationId, status: "active" } }),
    db.membership.count({ where: { organizationId, status: { in: ["active", "trialing"] } } }),
    db.subscriptionEntitlement.findFirst({
      where: {
        organizationId,
        billingPeriodStart: { lte: new Date() },
        billingPeriodEnd: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        planTier: true,
        billingPeriodStart: true,
        billingPeriodEnd: true,
      },
    }),
  ]);

  // Check all enforced limits
  const [membersCheck, seatsCheck] = await Promise.all([
    checkLimit(organizationId, "monitored_members"),
    checkLimit(organizationId, "team_members"),
  ]);

  // Check for plan overrides
  const hasPlanOverride = planTier !== "pilot" && entitlement !== null;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Usage"
        description="Plan limits, monthly consumption, and overage warnings."
      >
        <Badge variant="outline" className="font-mono text-[11px] uppercase">
          {plan.name} plan
        </Badge>
      </CompanyPageHeader>

      {/* Plan overview */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              Current plan
            </p>
            <p className="font-serif text-2xl text-[var(--ink-primary)]">{plan.name}</p>
            <p className="font-mono text-[12px] text-[var(--ink-muted)]">
              {plan.priceCents === 0 ? "Free" : formatCents(plan.priceCents)}/mo
            </p>
            {hasPlanOverride && (
              <Badge variant="outline" className="w-fit font-mono text-[10px] uppercase text-[var(--warning)]">
                override from pilot
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              Billing period
            </p>
            <p className="font-mono text-2xl text-[var(--ink-primary)]">{usage.period}</p>
            {entitlement && (
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                {fmtDate(entitlement.billingPeriodStart)} &ndash; {fmtDate(entitlement.billingPeriodEnd)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              Team seats
            </p>
            <UsageBar current={seatsCheck.current} limit={seatsCheck.limit} />
          </CardContent>
        </Card>
      </div>

      {/* Resource usage */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UsageCard
          icon={Users}
          label="Monitored members"
          current={membersCheck.current}
          limit={membersCheck.limit}
        />
        <UsageCard
          icon={GraduationCap}
          label="Courses"
          current={courseCount}
          limit={plan.maxCourses}
        />
        <UsageCard
          icon={Megaphone}
          label="Active campaigns"
          current={campaignCount}
          limit={plan.maxCampaigns}
        />
      </div>

      {/* Metered usage */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Gauge className="size-4 text-[var(--ink-muted)]" />
              Metered consumption this period
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <MeteredRow icon={Target} label="Candidates evaluated" value={usage.counts.candidates_evaluated} />
            <MeteredRow icon={Megaphone} label="Interventions created" value={usage.counts.interventions_created} />
            <MeteredRow icon={Bell} label="Notifications accepted" value={usage.counts.notifications_accepted} />
            <MeteredRow icon={Database} label="Stored source events" value={usage.counts.stored_events} />
            <MeteredRow icon={Download} label="Exports" value={usage.counts.exports} />
          </CardContent>
        </Card>
      </div>

      {/* Soft warnings */}
      {membersCheck.allowed && membersCheck.limit !== Infinity && membersCheck.current >= membersCheck.limit * 0.8 && membersCheck.current < membersCheck.limit && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
          <AlertTriangle className="size-4 shrink-0 text-[var(--warning)]" />
          <p className="text-[13px] text-[var(--ink-secondary)]">
            <span className="font-medium">Soft warning:</span> Monitored members ({membersCheck.current}) is at {Math.round((membersCheck.current / membersCheck.limit) * 100)}% of the plan limit ({membersCheck.limit}).
          </p>
        </div>
      )}

      {/* Hard limits */}
      {!membersCheck.allowed && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-[var(--critical)]/30 bg-[var(--critical-light)]/40 p-3">
          <AlertTriangle className="size-4 shrink-0 text-[var(--critical)]" />
          <p className="text-[13px] text-[var(--ink-primary)]">
            <span className="font-medium">Hard limit reached:</span> Monitored members ({membersCheck.current}) has reached the plan limit ({membersCheck.limit}). New members will not be monitored.
          </p>
        </div>
      )}
      {!seatsCheck.allowed && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-[var(--critical)]/30 bg-[var(--critical-light)]/40 p-3">
          <AlertTriangle className="size-4 shrink-0 text-[var(--critical)]" />
          <p className="text-[13px] text-[var(--ink-primary)]">
            <span className="font-medium">Hard limit reached:</span> Team seats ({seatsCheck.current}) has reached the plan limit ({seatsCheck.limit}). Additional seats cannot be added.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Fixture usage ───────────────────────────────────────────

function FixtureUsage() {
  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Usage"
        description="Plan limits, monthly consumption, and overage warnings."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture &middot; pilot
        </Badge>
      </CompanyPageHeader>

      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Illustrative fixture outcome</span>{" "}
          &mdash; usage is not tracked in fixture mode. Limits shown reflect the Pilot plan defaults.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Current plan</p>
            <p className="font-serif text-2xl text-[var(--ink-primary)]">Pilot</p>
            <p className="font-mono text-[12px] text-[var(--ink-muted)]">Free</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Monitored members</p>
            <p className="font-mono tabular-nums text-2xl text-[var(--ink-primary)]">20</p>
            <p className="font-mono text-[12px] text-[var(--ink-muted)]">/ 500 limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Team seats</p>
            <p className="font-mono tabular-nums text-2xl text-[var(--ink-primary)]">1</p>
            <p className="font-mono text-[12px] text-[var(--ink-muted)]">/ 3 limit</p>
          </CardContent>
        </Card>

        <UsageCard icon={GraduationCap} label="Courses" current={3} limit={5} />
        <UsageCard icon={Megaphone} label="Active campaigns" current={1} limit={5} />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Gauge className="size-4 text-[var(--ink-muted)]" />
              Metered consumption (fixture)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <MeteredRow icon={Target} label="Candidates evaluated" value={0} />
            <MeteredRow icon={Megaphone} label="Interventions created" value={0} />
            <MeteredRow icon={Bell} label="Notifications accepted" value={0} />
            <MeteredRow icon={Database} label="Stored source events" value={0} />
            <MeteredRow icon={Download} label="Exports" value={0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Shared components ───────────────────────────────────────

function UsageCard({
  icon: Icon,
  label,
  current,
  limit,
}: {
  icon: typeof Users;
  label: string;
  current: number;
  limit: number;
}) {
  const pct = limit === Infinity ? 0 : Math.round((current / limit) * 100);
  const isOver = limit !== Infinity && current >= limit;
  const isWarning = !isOver && limit !== Infinity && current >= limit * 0.8;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-secondary)]">
          <Icon className="size-3 text-[var(--ink-muted)]" />
          {label}
        </div>
        <UsageBar current={current} limit={limit} />
        {isOver && (
          <p className="flex items-center gap-1 text-[11px] text-[var(--critical)]">
            <AlertTriangle className="size-3" /> Limit reached
          </p>
        )}
        {isWarning && !isOver && (
          <p className="flex items-center gap-1 text-[11px] text-[var(--warning)]">
            <AlertTriangle className="size-3" /> Approaching limit
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UsageBar({ current, limit }: { current: number; limit: number }) {
  const pct = limit === Infinity ? 0 : Math.min(Math.round((current / limit) * 100), 100);
  const displayLimit = limit === Infinity ? "\u221E" : String(limit);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-mono tabular-nums text-2xl text-[var(--ink-primary)]">{current}</span>
        <span className="font-mono text-[12px] text-[var(--ink-muted)]">/ {displayLimit}</span>
      </div>
      {limit !== Infinity && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hairline)]">
          <div
            className={`h-full rounded-full ${
              pct >= 100 ? "bg-[var(--critical)]" : pct >= 80 ? "bg-[var(--warning)]" : "bg-[var(--recovery-green)]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function MeteredRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[13px] text-[var(--ink-secondary)]">
        <Icon className="size-3.5 text-[var(--ink-muted)]" />
        {label}
      </span>
      <span className="font-mono tabular-nums text-[14px] text-[var(--ink-primary)]">
        {value}
      </span>
    </div>
  );
}

// ─── Auth error helper ───────────────────────────────────────

function AuthErrorCardFor(error: unknown) {
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
        description="Only company admins can view usage."
        hint={error.message}
      />
    );
  }
  return (
    <AuthErrorCard
      title="Something went wrong"
      description="An unexpected error occurred while loading this page."
    />
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
