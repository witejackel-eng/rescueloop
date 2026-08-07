// /dashboard/[companyId]/rescue-queue
//
// Canonical rescue queue (WP-03). Shows database-backed Activation Rescue
// candidates for the admin's org.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import Link from "next/link";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures/fixtures-data";
import {
  getMemberships as getFixtureMemberships,
  getCourseStudents as getFixtureCourseStudents,
  getCourses as getFixtureCourses,
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
import { QueueActions } from "@/components/rescueloop/company/queue-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, FlaskConical } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type QueueCandidate = Prisma.InterventionGetPayload<{
  where: { state: "awaiting_approval" };
  include: {
    student: {
      select: {
        id: true; name: true; email: true; whopUserId: true;
        memberships: { include: { product: { select: { id: true; name: true; whopProductId: true } } } };
        studentStates: { select: { progressPercent: true; lessonsCompleted: true; totalLessons: true; lastActivityAt: true; firstActivityAt: true; course: { select: { id: true; name: true } } } };
      };
    };
    campaign: { select: { id: true; name: true; type: true; cooldownDays: true; maxMessagesPerStudent: true; quietHoursStart: true; quietHoursEnd: true } };
    campaignVersion: { select: { id: true; versionNumber: true } };
    eligibilitySnapshot: { select: { id: true; detectedAt: true; evidenceJson: true } };
  };
}>;

export default async function RescueQueuePage({
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
    return <FixtureRescueQueue companyId={companyId} />;
  }

  // ─── Connected mode (auth confirmed) ────────────────────────
  const interventions = await db.intervention.findMany({
    where: { organizationId: ctx.organizationId, state: "awaiting_approval" },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      student: {
        select: {
          id: true, name: true, email: true, whopUserId: true,
          memberships: {
            include: { product: { select: { id: true, name: true, whopProductId: true } } },
          },
          studentStates: {
            select: { progressPercent: true, lessonsCompleted: true, totalLessons: true, lastActivityAt: true, firstActivityAt: true, course: { select: { id: true, name: true } } },
          },
        },
      },
      campaign: {
        select: { id: true, name: true, type: true, cooldownDays: true, maxMessagesPerStudent: true, quietHoursStart: true, quietHoursEnd: true },
      },
      campaignVersion: { select: { id: true, versionNumber: true } },
      eligibilitySnapshot: { select: { id: true, detectedAt: true, evidenceJson: true } },
    },
  });

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Rescue queue"
        description="Activation Rescue candidates awaiting your review. Approve, schedule, or dismiss each one."
      >
        <Badge variant="outline" className="font-mono text-[12px]">
          {interventions.length} awaiting
        </Badge>
      </CompanyPageHeader>

      {interventions.length === 0 ? (
        <EmptyStateCard
          title="No Activation Rescue candidates detected yet"
          description="When members match your campaign rules, they'll appear here for your review."
          icon={ListChecks}
          actionHref={`${basePath}/onboarding`}
          actionLabel="Configure campaign"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {interventions.map((iv) => (
            <Card key={iv.id}>
              <CardHeader className="gap-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="font-serif text-[18px]">
                    {iv.student.name ?? iv.student.email ?? `user_${iv.student.whopUserId.slice(-6)}`}
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-[11px] uppercase tracking-wide">
                    {iv.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">Trigger</span>
                    <span className="text-[13px] text-[var(--ink-primary)]">{iv.trigger}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-secondary)]">{iv.messagePreview}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-3">
                  <Link
                    href={`${basePath}/responses`}
                    className="text-[12px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
                  >
                    View student responses →
                  </Link>
                  <QueueActions
                    companyId={companyId}
                    interventionId={iv.id}
                    studentName={iv.student.name ?? iv.student.email ?? `user_${iv.student.whopUserId.slice(-6)}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fixture rescue queue ────────────────────────────────────

function FixtureRescueQueue({ companyId }: { companyId: string }) {
  const memberships = getFixtureMemberships();
  const courseStudents = getFixtureCourseStudents();
  const courses = getFixtureCourses();

  // Candidates: active members with no course progress
  const candidates = memberships.filter(
    (m) => m.status === "active" && !courseStudents.some((cs) => cs.userId === m.userId),
  );

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Rescue queue"
        description="Activation Rescue candidates awaiting your review."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture · {candidates.length} candidates
        </Badge>
      </CompanyPageHeader>

      <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Fixture mode.</span>{" "}
          Illustrative fixture outcome — data is from deterministic local seeds.
        </p>
      </div>

      {candidates.length === 0 ? (
        <EmptyStateCard
          title="No candidates in fixture data"
          description="The fixture seed has no active-no-progress members right now."
          icon={ListChecks}
          actionHref={`${basePath}/onboarding`}
          actionLabel="Configure campaign"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((m) => {
            const studentName = `user_${m.userId}`;
            return (
              <Card key={m.id}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-[16px] text-[var(--ink-primary)]">{studentName}</span>
                    <Badge variant="outline" className="font-mono text-[11px] uppercase">
                      {m.status}
                    </Badge>
                  </div>
                  <div className="font-mono text-[12px] text-[var(--ink-muted)]">
                    product: {m.productId} · joined: {fmtRelative(new Date(m.joinedAt))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
