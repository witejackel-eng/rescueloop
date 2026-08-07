// /dashboard/[companyId]
//
// Canonical dashboard overview. Shows onboarding progress, quick links to
// sub-routes, and the recovery pulse.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top. In connected mode,
// auth MUST pass before any data is fetched or rendered. In fixture mode,
// fixture data is shown with a fixture banner.

import "server-only";
import Link from "next/link";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures/fixtures-data";
import {
  getMemberships,
  getCourses,
  getProducts,
  getCourseStudents,
} from "@/providers/fixtures";
import { db } from "@/lib/db";
import { getOrganizationPlan, checkLimit } from "@/lib/usage/enforcement";
import { PLANS } from "@/lib/usage/plans";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import {
  CompanyPageHeader,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Users,
  Megaphone,
  RefreshCw,
  Gauge,
  PauseCircle,
  CheckCircle2,
  FlaskConical,
  AlertTriangle,
  ListChecks,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
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

  // ─── Fixture mode ───────────────────────────────────────────
  if (ctx.mode === "fixture") {
    return <FixtureDashboard companyId={companyId} />;
  }

  // ─── Connected mode (auth confirmed) ────────────────────────
  const orgId = ctx.organizationId;

  const [
    org,
    installation,
    lastWebhook,
    candidateCount,
    interventionCounts,
    campaignCount,
    studentCount,
    planTier,
    hasCompletedOnboarding,
  ] = await Promise.all([
    db.organization.findUnique({
      where: { id: orgId },
      select: { name: true, isPaused: true, status: true, planTier: true },
    }),
    db.whopInstallation.findUnique({
      where: { whopCompanyId: companyId },
      select: { status: true, installedAt: true },
    }),
    db.webhookReceipt.findFirst({
      where: { organizationId: orgId },
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true, eventType: true },
    }),
    db.intervention.count({
      where: { organizationId: orgId, state: "awaiting_approval" },
    }),
    db.intervention.groupBy({
      by: ["state"],
      where: { organizationId: orgId },
      _count: true,
    }),
    db.campaign.count({
      where: { organizationId: orgId, status: "active" },
    }),
    db.student.count({
      where: { organizationId: orgId },
    }),
    getOrganizationPlan(orgId),
    db.campaign.findFirst({
      where: { organizationId: orgId, status: "active" },
      select: { id: true },
    }).then((c) => !!c),
  ]);

  const plan = PLANS[planTier];

  const [membersCheck, seatsCheck] = await Promise.all([
    checkLimit(orgId, "monitored_members"),
    checkLimit(orgId, "team_members"),
  ]);

  const interventionByState = Object.fromEntries(
    interventionCounts.map((r) => [r.state, r._count]),
  );

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Dashboard"
        description="Recovery pulse, system status, and the next creator action — at a glance."
      >
        <Badge variant="outline" className="font-mono text-[11px] uppercase tracking-wide">
          whop · connected
        </Badge>
      </CompanyPageHeader>

      {/* Onboarding prompt when not yet configured */}
      {!hasCompletedOnboarding && (
        <Card className="mb-5 border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/20">
          <CardContent className="flex items-start gap-3 py-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[14px] font-medium text-[var(--ink-primary)]">
                Complete setup to start detecting rescue opportunities
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                Map a Whop course to a paid product and configure your safety rules.
                Nothing sends until you approve it.
              </p>
              <Link
                href={`${basePath}/onboarding`}
                className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--recovery-green)] hover:underline"
              >
                Start onboarding <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency pause banner */}
      {org?.isPaused && (
        <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--critical)]/30 bg-[var(--critical-light)]/40 p-3">
          <PauseCircle className="size-4 shrink-0 text-[var(--critical)]" />
          <p className="text-[13px] text-[var(--ink-primary)]">
            <span className="font-medium">Automation is paused.</span>{" "}
            <span className="text-[var(--ink-secondary)]">
              No interventions will be sent until you resume.
            </span>
          </p>
        </div>
      )}

      {/* Quick navigation cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickNavCard
          href={`${basePath}/rescue-queue`}
          icon={ListChecks}
          label="Rescue Queue"
          value={candidateCount}
          valueLabel="awaiting"
          accent="green"
        />
        <QuickNavCard
          href={`${basePath}/students`}
          icon={Users}
          label="Students"
          value={studentCount}
          valueLabel="total"
          accent="muted"
        />
        <QuickNavCard
          href={`${basePath}/insights`}
          icon={Activity}
          label="Insights"
          value={campaignCount}
          valueLabel="campaigns"
          accent="muted"
        />
        <QuickNavCard
          href={`${basePath}/settings`}
          icon={Gauge}
          label="Settings"
          value={plan.name}
          valueLabel="plan"
          accent="muted"
        />
      </div>

      {/* Detail cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Installation status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
              Installation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row
              label="Status"
              value={
                <Badge variant="outline" className="font-mono text-[11px] uppercase">
                  {installation?.status ?? "unknown"}
                </Badge>
              }
            />
            {installation?.installedAt && (
              <Row label="Installed" value={fmtDate(installation.installedAt)} mono />
            )}
          </CardContent>
        </Card>

        {/* Sync status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <RefreshCw className="size-4 text-[var(--recovery-green)]" />
              Last sync
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row
              label="Webhook"
              value={
                lastWebhook
                  ? `${fmtRelative(lastWebhook.receivedAt)} · ${lastWebhook.eventType}`
                  : "No webhooks yet"
              }
              mono
            />
            <Row
              label="Source"
              value="Whop Standard Webhooks"
              mono
              linkHref={`${basePath}/sync`}
              linkLabel="View sync status →"
            />
          </CardContent>
        </Card>

        {/* Candidates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Users className="size-4 text-[var(--ink-muted)]" />
              Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`${basePath}/rescue-queue`}
              className="font-mono tabular-nums text-2xl text-[var(--recovery-green)] hover:underline"
            >
              {candidateCount}
            </Link>
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">awaiting approval</p>
          </CardContent>
        </Card>

        {/* Interventions summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Megaphone className="size-4 text-[var(--ink-muted)]" />
              Interventions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {(["awaiting_approval", "approved", "delivered", "notification_accepted", "dismissed", "failed"] as const).map((state) => (
              <Row
                key={state}
                label={state.replace(/_/g, " ")}
                value={
                  <Link
                    href={`${basePath}/rescue-queue?state=${state}`}
                    className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline"
                  >
                    {interventionByState[state] ?? 0}
                  </Link>
                }
              />
            ))}
          </CardContent>
        </Card>

        {/* Plan usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Gauge className="size-4 text-[var(--ink-muted)]" />
              Plan usage
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row label="Tier" value={plan.name} mono />
            <Row
              label="Members"
              value={
                <Link
                  href={`${basePath}/students`}
                  className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline"
                >
                  {membersCheck.current} / {membersCheck.limit === Infinity ? "∞" : membersCheck.limit}
                </Link>
              }
            />
            {membersCheck.current >= membersCheck.limit * 0.8 && membersCheck.limit !== Infinity && (
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--warning)]">
                <AlertTriangle className="size-3" />
                Approaching member limit
              </div>
            )}
            <Row
              label="Students"
              value={
                <Link
                  href={`${basePath}/students`}
                  className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline"
                >
                  {studentCount}
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Quick navigation card ───────────────────────────────────

function QuickNavCard({
  href,
  icon: Icon,
  label,
  value,
  valueLabel,
  accent,
}: {
  href: string;
  icon: typeof Activity;
  label: string;
  value: number | string;
  valueLabel: string;
  accent: "green" | "muted";
}) {
  const iconColor = accent === "green" ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]";
  return (
    <Link href={href} className="group">
      <Card className="transition-colors group-hover:border-[var(--recovery-green)]/30">
        <CardContent className="flex items-center gap-3 py-4">
          <Icon className={`size-5 shrink-0 ${iconColor}`} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
            <span className="font-mono tabular-nums text-[18px] text-[var(--ink-primary)]">
              {value}
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">{valueLabel}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Fixture dashboard ────────────────────────────────────────

function FixtureDashboard({ companyId }: { companyId: string }) {
  const memberships = getMemberships();
  const courses = getCourses();
  const products = getProducts();
  const courseStudents = getCourseStudents();

  const activeNoProgress = memberships.filter(
    (m) => m.status === "active" && !courseStudents.some((cs) => cs.userId === m.userId),
  ).length;
  const totalActive = memberships.filter((m) => m.status === "active").length;
  const totalTrialing = memberships.filter((m) => m.status === "trialing").length;

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Dashboard"
        description="Recovery pulse, system status, and the next creator action — at a glance."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture
        </Badge>
      </CompanyPageHeader>

      {/* Fixture banner */}
      <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Fixture mode.</span>{" "}
          All data below is deterministic local seed data —{" "}
          <span className="font-medium">Illustrative fixture outcome</span>.
        </p>
      </div>

      {/* Quick navigation */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickNavCard
          href={`${basePath}/rescue-queue`}
          icon={ListChecks}
          label="Rescue Queue"
          value={activeNoProgress}
          valueLabel="candidates"
          accent="green"
        />
        <QuickNavCard
          href={`${basePath}/students`}
          icon={Users}
          label="Students"
          value={memberships.length}
          valueLabel="total"
          accent="muted"
        />
        <QuickNavCard
          href={`${basePath}/insights`}
          icon={Activity}
          label="Insights"
          value={courses.length}
          valueLabel="courses"
          accent="muted"
        />
        <QuickNavCard
          href={`${basePath}/settings`}
          icon={Gauge}
          label="Settings"
          value="Pilot"
          valueLabel="plan"
          accent="muted"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={CheckCircle2} title="Installation" color="green">
          <Row label="Status" value={<Badge variant="outline" className="font-mono text-[11px] uppercase">active</Badge>} />
          <Row label="Source" value="Fixture provider" mono />
        </StatCard>

        <StatCard icon={RefreshCw} title="Last sync" color="green">
          <Row label="Mode" value="Fixture synchronization" mono />
          <Row label="Source" value="Deterministic seed data" mono />
        </StatCard>

        <StatCard icon={Users} title="Candidates" color="muted">
          <Link
            href={`${basePath}/rescue-queue`}
            className="font-mono tabular-nums text-2xl text-[var(--ink-primary)] hover:underline"
          >
            {activeNoProgress}
          </Link>
          <p className="mt-1 text-[12px] text-[var(--ink-muted)]">active, no course progress</p>
        </StatCard>

        <StatCard icon={Megaphone} title="Membership summary" color="muted">
          <Row
            label="Active"
            value={
              <Link href={`${basePath}/students?status=active`} className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline">
                {totalActive}
              </Link>
            }
          />
          <Row
            label="Trialing"
            value={
              <Link href={`${basePath}/students?status=trialing`} className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline">
                {totalTrialing}
              </Link>
            }
          />
          <Row
            label="Total"
            value={
              <Link href={`${basePath}/students`} className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline">
                {memberships.length}
              </Link>
            }
          />
        </StatCard>

        <StatCard icon={Gauge} title="Plan usage" color="muted">
          <Row label="Tier" value="Pilot (fixture)" mono />
          <Row
            label="Members"
            value={
              <Link href={`${basePath}/students`} className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline">
                {memberships.length}
              </Link>
            }
          />
          <Row label="Courses" value={courses.length} mono />
          <Row label="Products" value={products.length} mono />
        </StatCard>
      </div>
    </div>
  );
}

// ─── Shared components ───────────────────────────────────────

function StatCard({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: typeof Activity;
  title: string;
  color: "green" | "muted" | "warning";
  children: React.ReactNode;
}) {
  const iconClass =
    color === "green"
      ? "text-[var(--recovery-green)]"
      : color === "warning"
        ? "text-[var(--warning)]"
        : "text-[var(--ink-muted)]";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <Icon className={`size-4 ${iconClass}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
  linkHref,
  linkLabel,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
        <span className={`text-[13px] text-[var(--ink-primary)] ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      </div>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="self-end text-[11px] text-[var(--recovery-green)] hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  return fmtDate(d);
}
