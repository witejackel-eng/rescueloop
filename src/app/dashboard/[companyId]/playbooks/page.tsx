// /dashboard/[companyId]/playbooks
//
// Canonical playbooks page (WP-03). Database-backed campaign page.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import { getProviderMode } from "@/providers";
import {
  getMemberships,
  getCourses,
  getProducts,
  getCourseStudents,
} from "@/providers/fixtures";
import { db } from "@/lib/db";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import {
  CompanyPageHeader,
  EmptyStateCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  FlaskConical,
  Clock,
  MessageSquare,
  Moon,
  Users,
  CheckCircle2,
  PauseCircle,
  FileText,
  Zap,
  CalendarClock,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlaybooksPage({
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
    return <FixturePlaybooks />;
  }

  // ─── Connected mode (auth confirmed) ────────────────────────
  const orgId = ctx.organizationId;

  const [campaigns, productCourseMappings] = await Promise.all([
    db.campaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: { id: true, versionNumber: true, createdAt: true },
        },
        _count: {
          select: {
            interventions: true,
          },
        },
      },
    }),
    db.productCourseMapping.findMany({
      where: { organizationId: orgId, isConfirmed: true },
      include: {
        product: { select: { name: true } },
        course: { select: { name: true } },
      },
    }),
  ]);

  // Get eligibility snapshot counts per campaign
  const campaignIds = campaigns.map((c) => c.id);
  const snapshotCounts = campaignIds.length > 0
    ? await db.eligibilitySnapshot.groupBy({
        by: ["campaignId"],
        where: {
          organizationId: orgId,
          campaignId: { in: campaignIds },
          state: "eligible",
        },
        _count: true,
      })
    : [];
  const snapshotCountMap = Object.fromEntries(
    snapshotCounts.map((r) => [r.campaignId, r._count]),
  );

  const plannedTypes = [
    "early_progress_rescue",
    "mid_course_rescue",
    "near_finish_rescue",
    "cancellation_rescue",
  ];

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Playbooks"
        description="Rescue campaigns, message templates, and audience rules."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {campaigns.length} playbook{campaigns.length !== 1 ? "s" : ""}
        </Badge>
      </CompanyPageHeader>

      {campaigns.length === 0 ? (
        <EmptyStateCard
          title="No playbooks configured"
          description="Complete onboarding to create your first Activation Rescue playbook."
          icon={Megaphone}
          actionHref={`${basePath}/onboarding`}
          actionLabel="Configure playbook"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map((campaign) => {
            const latestVersion = campaign.versions[0];
            const isOperational = campaign.type === "activation_rescue";
            const relatedMappings = productCourseMappings.filter(
              (m) => m.courseId,
            );
            const candidateCount = snapshotCountMap[campaign.id] ?? 0;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Megaphone className="size-4 text-[var(--ink-muted)]" />
                      {campaign.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`font-mono text-[11px] uppercase ${
                          campaign.status === "active"
                            ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                            : "text-[var(--ink-muted)]"
                        }`}
                      >
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[11px] uppercase">
                        {campaign.type.replace(/_/g, " ")}
                      </Badge>
                      {!isOperational && (
                        <Badge variant="outline" className="font-mono text-[10px] uppercase text-[var(--ink-muted)]">
                          planned
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* Configuration */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ConfigItem icon={Moon} label="Quiet hours" value={`${campaign.quietHoursStart} → ${campaign.quietHoursEnd}`} />
                    <ConfigItem icon={Clock} label="Cooldown" value={`${campaign.cooldownDays} days`} />
                    <ConfigItem icon={MessageSquare} label="Max messages" value={`${campaign.maxMessagesPerStudent} / member / mo`} />
                    <ConfigItem icon={CalendarClock} label="Approval" value={campaign.approvalMode} />
                  </div>

                  {/* Manual-approval state callout */}
                  {campaign.approvalMode === "manual" && (
                    <div className="rounded-md border border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/20 p-2.5">
                      <p className="text-[12px] text-[var(--ink-secondary)]">
                        <span className="font-medium text-[var(--ink-primary)]">Manual approval.</span>{" "}
                        Every candidate lands in your queue for review before any message is sent.
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 border-t border-[var(--hairline)] pt-3">
                    <StatPill icon={Users} label="Candidates" value={candidateCount} />
                    <StatPill icon={Megaphone} label="Interventions" value={campaign._count.interventions} />
                    {latestVersion && (
                      <StatPill icon={FileText} label="Version" value={`v${latestVersion.versionNumber}`} />
                    )}
                  </div>

                  {/* Version history */}
                  {latestVersion && (
                    <div className="border-t border-[var(--hairline)] pt-3">
                      <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                        <History className="size-3" />
                        Latest version
                      </p>
                      <div className="flex items-center gap-3 font-mono text-[12px]">
                        <span className="text-[var(--ink-secondary)]">v{latestVersion.versionNumber}</span>
                        <span className="text-[var(--ink-muted)]">created {fmtRelative(latestVersion.createdAt)}</span>
                      </div>
                    </div>
                  )}

                  {/* Product/course mappings */}
                  {relatedMappings.length > 0 && (
                    <div className="border-t border-[var(--hairline)] pt-3">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                        Mapped products → courses
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {relatedMappings.map((m) => (
                          <span key={m.id} className="font-mono text-[12px] text-[var(--ink-secondary)]">
                            {m.product.name} → {m.course.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Planned rescue types */}
      <div className="mt-6">
        <h2 className="mb-3 font-serif text-[18px] text-[var(--ink-primary)]">
          Planned rescue types
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {plannedTypes.map((type) => (
            <Card key={type} className="border-dashed">
              <CardContent className="flex items-center gap-3 py-4">
                <Zap className="size-4 text-[var(--ink-muted)]" />
                <div>
                  <p className="text-[14px] text-[var(--ink-primary)]">
                    {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  <p className="text-[12px] text-[var(--ink-muted)]">
                    Planned — not yet operational
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto font-mono text-[10px] uppercase text-[var(--ink-muted)]">
                  planned
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fixture playbooks ───────────────────────────────────────

function FixturePlaybooks() {
  const memberships = getMemberships();
  const courses = getCourses();
  const products = getProducts();
  const courseStudents = getCourseStudents();

  const activeNoProgress = memberships.filter(
    (m) => m.status === "active" && !courseStudents.some((cs) => cs.userId === m.userId),
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Playbooks"
        description="Rescue campaigns, message templates, and audience rules."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture
        </Badge>
      </CompanyPageHeader>

      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Fixture mode.</span>{" "}
          Illustrative fixture outcome — playbook data is from deterministic local seeds.
        </p>
      </div>

      {/* Operational: Activation Rescue */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Megaphone className="size-4 text-[var(--recovery-green)]" />
              Activation Rescue
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[var(--recovery-green)]/30 font-mono text-[11px] uppercase text-[var(--recovery-green)]">
                active
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] uppercase">
                activation_rescue
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ConfigItem icon={Moon} label="Quiet hours" value="22:00 → 08:00" />
            <ConfigItem icon={Clock} label="Cooldown" value="7 days" />
            <ConfigItem icon={MessageSquare} label="Max messages" value="3 / member / mo" />
            <ConfigItem icon={CalendarClock} label="Approval" value="manual" />
          </div>

          {/* Manual-approval callout */}
          <div className="rounded-md border border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/20 p-2.5">
            <p className="text-[12px] text-[var(--ink-secondary)]">
              <span className="font-medium text-[var(--ink-primary)]">Manual approval.</span>{" "}
              Every candidate lands in your queue for review before any message is sent.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[var(--hairline)] pt-3">
            <StatPill icon={Users} label="Candidates" value={activeNoProgress} />
            <StatPill icon={Megaphone} label="Interventions" value={0} />
            <StatPill icon={FileText} label="Version" value="v1" />
          </div>

          {/* Version history */}
          <div className="border-t border-[var(--hairline)] pt-3">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              <History className="size-3" />
              Latest version
            </p>
            <div className="flex items-center gap-3 font-mono text-[12px]">
              <span className="text-[var(--ink-secondary)]">v1</span>
              <span className="text-[var(--ink-muted)]">initial configuration</span>
            </div>
          </div>

          <div className="border-t border-[var(--hairline)] pt-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              Mapped products → courses
            </p>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[12px] text-[var(--ink-secondary)]">
                Agency Accelerator ($79/mo) → Agency Growth System
              </span>
              <span className="font-mono text-[12px] text-[var(--ink-secondary)]">
                Freelance Pro ($49/mo) → Freelance Foundations
              </span>
              <span className="font-mono text-[12px] text-[var(--ink-secondary)]">
                Client Mastery ($129/mo) → Client Breakthrough
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned rescue types */}
      <div className="mt-6">
        <h2 className="mb-3 font-serif text-[18px] text-[var(--ink-primary)]">
          Planned rescue types
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "early_progress_rescue",
            "mid_course_rescue",
            "near_finish_rescue",
            "cancellation_rescue",
          ].map((type) => (
            <Card key={type} className="border-dashed">
              <CardContent className="flex items-center gap-3 py-4">
                <Zap className="size-4 text-[var(--ink-muted)]" />
                <div>
                  <p className="text-[14px] text-[var(--ink-primary)]">
                    {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  <p className="text-[12px] text-[var(--ink-muted)]">
                    Planned — not yet operational
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto font-mono text-[10px] uppercase text-[var(--ink-muted)]">
                  planned
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ───────────────────────────────────────

function ConfigItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-secondary)]">
        <Icon className="size-3 text-[var(--ink-muted)]" />
        {label}
      </div>
      <span className="font-mono text-[13px] text-[var(--ink-primary)]">{value}</span>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[12px]">
      <Icon className="size-3 text-[var(--ink-muted)]" />
      <span className="text-[var(--ink-muted)]">{label}:</span>
      <span className="tabular-nums text-[var(--ink-primary)]">{value}</span>
    </div>
  );
}

function fmtRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
