// /companies/[companyId]/overview
//
// Database-backed overview page. Shows installation status, provider mode,
// last sync, candidate count, intervention counts, plan usage, and emergency
// pause status. In fixture mode, renders with fixture data and labels
// values as "Illustrative fixture outcome". Every count links to the
// underlying record list.

import "server-only";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures/fixtures-data";
import {
  getMemberships,
  getCourses,
  getProducts,
  getCourseStudents,
} from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import { getOrganizationPlan, checkLimit } from "@/lib/usage/enforcement";
import { PLANS } from "@/lib/usage/plans";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
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
    const auth = await requireCompanyAdmin(companyId);
    organizationId = auth.organizationId;
  } else {
    redirect("/onboarding");
  }

  if (mode === "fixture") {
    return <FixtureOverview companyId={companyId} />;
  }

  // ─── Whop mode: database queries ─────────────────────────────
  const orgId = organizationId;

  const [
    org,
    installation,
    lastWebhook,
    candidateCount,
    interventionCounts,
    campaignCount,
    studentCount,
    planTier,
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
  ]);

  const plan = PLANS[planTier];

  const [membersCheck, seatsCheck] = await Promise.all([
    checkLimit(orgId, "monitored_members"),
    checkLimit(orgId, "team_members"),
  ]);

  const interventionByState = Object.fromEntries(
    interventionCounts.map((r) => [r.state, r._count]),
  );

  const basePath = `/companies/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Overview"
        description="Recovery pulse, system status, and the next creator action — at a glance."
      >
        <Badge variant="outline" className="font-mono text-[11px] uppercase tracking-wide">
          whop · connected
        </Badge>
      </CompanyPageHeader>

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

        {/* Provider mode */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Activity className="size-4 text-[var(--recovery-green)]" />
              Provider mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="font-mono text-[11px] uppercase">
              whop
            </Badge>
          </CardContent>
        </Card>

        {/* Candidates — links to queue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Users className="size-4 text-[var(--ink-muted)]" />
              Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`${basePath}/queue`}
              className="font-mono tabular-nums text-2xl text-[var(--recovery-green)] hover:underline"
            >
              {candidateCount}
            </Link>
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">awaiting approval</p>
          </CardContent>
        </Card>

        {/* Interventions summary — links to queue */}
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
                    href={`${basePath}/queue?state=${state}`}
                    className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline"
                  >
                    {interventionByState[state] ?? 0}
                  </Link>
                }
              />
            ))}
          </CardContent>
        </Card>

        {/* Plan usage — links to underlying pages */}
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
              label="Seats"
              value={`${seatsCheck.current} / ${seatsCheck.limit === Infinity ? "∞" : seatsCheck.limit}`}
              mono
            />
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
            <Row
              label="Campaigns"
              value={
                <Link
                  href={`${basePath}/campaigns`}
                  className="font-mono tabular-nums text-[var(--ink-primary)] hover:underline"
                >
                  {campaignCount}
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Fixture overview ────────────────────────────────────────

function FixtureOverview({ companyId }: { companyId: string }) {
  const memberships = getMemberships();
  const courses = getCourses();
  const products = getProducts();
  const courseStudents = getCourseStudents();

  const activeNoProgress = memberships.filter(
    (m) => m.status === "active" && !courseStudents.some((cs) => cs.userId === m.userId),
  ).length;
  const totalActive = memberships.filter((m) => m.status === "active").length;
  const totalTrialing = memberships.filter((m) => m.status === "trialing").length;
  const totalCancelled = memberships.filter(
    (m) => m.status === "cancelling" || m.status === "cancelled",
  ).length;

  const basePath = `/companies/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Overview"
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={CheckCircle2} title="Installation" color="green">
          <Row label="Status" value={<Badge variant="outline" className="font-mono text-[11px] uppercase">active</Badge>} />
          <Row label="Source" value="Fixture provider" mono />
        </StatCard>

        <StatCard icon={RefreshCw} title="Last sync" color="green">
          <Row label="Mode" value="Fixture synchronization" mono />
          <Row label="Source" value="Deterministic seed data" mono />
        </StatCard>

        <StatCard icon={Activity} title="Provider mode" color="green">
          <Badge
            variant="outline"
            className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase text-[var(--warning)]"
          >
            fixture
          </Badge>
        </StatCard>

        <StatCard icon={Users} title="Candidates" color="muted">
          <Link
            href={`${basePath}/queue`}
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
          <Row label="Cancelling/cancelled" value={totalCancelled} mono />
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
