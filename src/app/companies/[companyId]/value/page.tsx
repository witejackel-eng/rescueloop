// /companies/[companyId]/value
//
// Database-backed value/attributed ledger page. Shows unattributed,
// strongly associated, confirmed, estimated, observed payment,
// evidence chain, policy version, source event, filters, pagination,
// export request. Does NOT combine categories into one total.
// Fixture values are visibly labelled.
// Does NOT display "recovered revenue" for fixture data.

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import {
  FIXTURE_COMPANY_ID,
  getMemberships,
  getCourses,
  getLessonInteractions,
  getCourseStudents,
} from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
  InstallationMissingError,
} from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  AuthErrorCard,
  CompanyPageHeader,
  EmptyStateCard,
  InstallationRequiredCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FlaskConical,
  Link2,
  ShieldCheck,
  Eye,
  FileText,
  Scale,
  AlertTriangle,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

const POLICY_VERSION = "2026-08-01";

export default async function ValuePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ level?: string; cursor?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
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
    return <FixtureValue />;
  }

  // ─── Whop mode ───────────────────────────────────────────────
  const PAGE_SIZE = 20;

  const levelFilter = sp.level && sp.level !== "all" ? sp.level : undefined;
  const cursor = sp.cursor ? { id: sp.cursor } : undefined;

  const whereClause: any = { organizationId };
  if (levelFilter) {
    whereClause.attributionLevel = levelFilter;
  }

  const [valueEvents, countsByLevel] = await Promise.all([
    db.valueEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      skip: cursor ? 1 : 0,
      cursor,
      include: {
        attributionEvidences: {
          select: { evidenceType: true, evidenceRef: true, timestamp: true },
          orderBy: { timestamp: "asc" },
        },
        intervention: {
          select: {
            id: true,
            state: true,
            trigger: true,
            student: { select: { name: true, email: true } },
          },
        },
      },
    }),
    db.valueEvent.groupBy({
      by: ["attributionLevel"],
      where: { organizationId },
      _count: true,
      _sum: { amountCents: true },
    }),
  ]);

  const hasNextPage = valueEvents.length > PAGE_SIZE;
  const pageEvents = hasNextPage ? valueEvents.slice(0, PAGE_SIZE) : valueEvents;
  const nextCursor = hasNextPage ? pageEvents[pageEvents.length - 1]?.id : null;

  const levelCounts = Object.fromEntries(
    countsByLevel.map((r) => [
      r.attributionLevel,
      { count: r._count, amountCents: r._sum.amountCents ?? 0 },
    ]),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Value ledger"
        description="Attribution ledger, evidence timeline, and policy version."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          policy v{POLICY_VERSION}
        </Badge>
      </CompanyPageHeader>

      {/* Attribution summary &mdash; categories are NOT combined */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LevelCard
          label="Unattributed"
          count={levelCounts["unattributed"]?.count ?? 0}
          icon={Eye}
          color="muted"
        />
        <LevelCard
          label="Strongly associated"
          count={levelCounts["strongly_associated"]?.count ?? 0}
          icon={Link2}
          color="green"
          note="$0 financial value (policy)"
        />
        <LevelCard
          label="Estimated"
          count={levelCounts["estimated"]?.count ?? 0}
          icon={Scale}
          color="warning"
          amountCents={levelCounts["estimated"]?.amountCents ?? 0}
        />
        <LevelCard
          label="Confirmed"
          count={levelCounts["confirmed"]?.count ?? 0}
          icon={ShieldCheck}
          color="green"
          note="Reserved for payment recovery / cancellation reversal"
        />
      </div>

      {/* Policy note */}
      <div className="mb-4 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
        <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Attribution policy v{POLICY_VERSION}:</span>{" "}
          Activation Rescue never claims confirmed revenue. Ordinary subscription payments
          after course activity are recorded as <span className="font-mono text-[12px]">estimated</span> &mdash;
          not recovered revenue. Confirmed attribution requires explicit payment recovery
          or cancellation reversal.
        </p>
      </div>

      {/* Filter controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          name="level"
          defaultValue={sp.level ?? "all"}
          className="h-9 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 text-[13px] text-[var(--ink-primary)]"
        >
          <option value="all">All attribution levels</option>
          <option value="unattributed">Unattributed</option>
          <option value="strongly_associated">Strongly associated</option>
          <option value="estimated">Estimated</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
        <a
          href="/api/companies/${companyId}/value/export?XTransformPort=3000"
          className="flex items-center gap-1.5 text-[13px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
        >
          <Download className="size-3.5" />
          Export CSV
        </a>
      </div>

      {/* Value events */}
      {pageEvents.length === 0 ? (
        <EmptyStateCard
          title="No value events recorded"
          description="Value events appear as interventions are delivered and student activity is observed."
          icon={DollarSign}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pageEvents.map((ve) => (
            <Card key={ve.id}>
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`font-mono text-[11px] uppercase ${
                        ve.attributionLevel === "strongly_associated"
                          ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                          : ve.attributionLevel === "estimated"
                            ? "border-[var(--warning)]/30 text-[var(--warning)]"
                            : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {ve.attributionLevel.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[13px] text-[var(--ink-primary)]">{ve.event}</span>
                  </div>
                  <span className="font-mono text-[13px] text-[var(--ink-primary)]">
                    {formatCents(ve.amountCents)}
                  </span>
                </div>

                {ve.intervention && (
                  <p className="text-[12px] text-[var(--ink-secondary)]">
                    Student: {ve.intervention.student.name ?? ve.intervention.student.email ?? "\u2014"}{" "}
                    &middot; Intervention: {ve.intervention.state}{" "}
                    &middot; Trigger: {ve.intervention.trigger}
                  </p>
                )}

                {/* Evidence chain */}
                {ve.attributionEvidences.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                      Evidence chain
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ve.attributionEvidences.map((e, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10px] text-[var(--ink-muted)]"
                        >
                          {e.evidenceType} @ {fmtRelative(e.timestamp)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-mono text-[10px] text-[var(--ink-muted)]">
                  policy: {ve.policyVersion} &middot; {fmtRelative(ve.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <a
            href={`?cursor=${nextCursor}${sp.level ? `&level=${sp.level}` : ""}`}
            className="text-[13px] text-[var(--recovery-green)] hover:underline"
          >
            Load more &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Fixture value ───────────────────────────────────────────

function FixtureValue() {
  const memberships = getMemberships();
  const interactions = getLessonInteractions();
  const courseStudents = getCourseStudents();

  // In fixture mode: show that strongly_associated has 0 financial value
  // Never display "recovered revenue" for fixture data
  const studentsResumedCount = courseStudents.filter(
    (cs) => cs.completionRate > 0,
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Value ledger"
        description="Attribution ledger, evidence timeline, and policy version."
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
          <span className="font-medium text-[var(--ink-primary)]">Illustrative fixture outcome.</span>{" "}
          No financial value is claimed. All attribution states are shown for demonstration.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LevelCard label="Unattributed" count={0} icon={Eye} color="muted" />
        <LevelCard
          label="Strongly associated"
          count={studentsResumedCount}
          icon={Link2}
          color="green"
          note="$0 financial value (policy)"
        />
        <LevelCard label="Estimated" count={0} icon={Scale} color="warning" amountCents={0} />
        <LevelCard
          label="Confirmed"
          count={0}
          icon={ShieldCheck}
          color="green"
          note="Reserved for payment recovery"
        />
      </div>

      {/* Policy note */}
      <div className="mb-4 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
        <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Attribution policy v{POLICY_VERSION}:</span>{" "}
          Activation Rescue never claims confirmed revenue. In fixture mode,{" "}
          <span className="font-mono text-[12px]">strongly_associated</span>{" "}
          means course activity resumed within 14 days of notification &mdash; no money is claimed.
        </p>
      </div>

      {/* Fixture: show sample evidence chain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <FileText className="size-4 text-[var(--ink-muted)]" />
            Sample evidence chain (fixture)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-[var(--ink-secondary)]">
            In a real deployment, each value event carries an evidence chain:
            intervention_delivered &rarr; course_started/progress_resumed (within policy window).
            Fixture data demonstrates the shape but not real attribution.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-[12px]">
              <span className="text-[var(--recovery-green)]">&#10003;</span>
              <span className="text-[var(--ink-secondary)]">intervention_delivered</span>
              <span className="text-[var(--ink-muted)]">&rarr;</span>
              <span className="text-[var(--recovery-green)]">&#10003;</span>
              <span className="text-[var(--ink-secondary)]">course_activity_resumed (&le;14d)</span>
              <span className="text-[var(--ink-muted)]">&rarr;</span>
              <Badge variant="outline" className="border-[var(--recovery-green)]/30 font-mono text-[10px] uppercase text-[var(--recovery-green)]">
                strongly_associated
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared components ───────────────────────────────────────

function LevelCard({
  label,
  count,
  icon: Icon,
  color,
  amountCents,
  note,
}: {
  label: string;
  count: number;
  icon: typeof Eye;
  color: "green" | "warning" | "muted";
  amountCents?: number;
  note?: string;
}) {
  const iconClass =
    color === "green"
      ? "text-[var(--recovery-green)]"
      : color === "warning"
        ? "text-[var(--warning)]"
        : "text-[var(--ink-muted)]";

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-secondary)]">
          <Icon className={`size-3 ${iconClass}`} />
          {label}
        </div>
        <p className="font-mono tabular-nums text-2xl text-[var(--ink-primary)]">{count}</p>
        {amountCents !== undefined && amountCents > 0 && (
          <p className="font-mono text-[12px] text-[var(--ink-muted)]">
            {formatCents(amountCents)} estimated
          </p>
        )}
        {note && <p className="text-[11px] text-[var(--ink-muted)]">{note}</p>}
      </CardContent>
    </Card>
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
        description="Only company admins can view the value ledger."
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
