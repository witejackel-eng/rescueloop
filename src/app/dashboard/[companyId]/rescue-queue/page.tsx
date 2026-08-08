// /dashboard/[companyId]/rescue-queue
//
// WP04 Enhanced Rescue Queue — client-driven queue with inspector,
// segment navigation, keyboard shortcuts, and evidence timeline.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.
// The server component pre-fetches initial data and passes it
// to the client component for hydration.

import "server-only";
import { getProviderMode } from "@/providers";
import { db } from "@/lib/db";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import {
  CompanyPageHeader,
  EmptyStateCard,
  LoadingCard,
} from "@/components/rescueloop/company/state-cards";
import { RescueQueueClient } from "@/components/rescueloop/rescue-queue/rescue-queue-client";
import { Badge } from "@/components/ui/badge";
import { ListChecks, FlaskConical } from "lucide-react";
import type { QueueItem } from "@/components/rescueloop/rescue-queue/wp04-types";
import type { QueueTab } from "@/lib/types";

export const dynamic = "force-dynamic";

// Mapping from DB intervention state string to QueueTab
function dbStateToQueueTab(state: string): QueueTab {
  switch (state) {
    case "awaiting_approval": return "awaiting_review";
    case "approved": return "approved";
    case "scheduled": return "scheduled";
    case "delivery_attempted":
    case "notification_accepted":
    case "delivered":
    case "queued": return "sent";
    case "dismissed": return "dismissed";
    case "stopped": return "dismissed";
    default: return "awaiting_review";
  }
}

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

  // ─── Connected mode: pre-fetch initial data ────────────────
  const interventions = await db.intervention.findMany({
    where: { organizationId: ctx.organizationId, state: "awaiting_approval" },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          whopUserId: true,
          studentStates: {
            select: {
              progressPercent: true,
              lessonsCompleted: true,
              totalLessons: true,
              lastActivityAt: true,
              firstActivityAt: true,
              course: { select: { id: true, name: true } },
            },
          },
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          type: true,
          cooldownDays: true,
          maxMessagesPerStudent: true,
          quietHoursStart: true,
          quietHoursEnd: true,
        },
      },
      eligibilitySnapshot: {
        select: { id: true, detectedAt: true, evidenceJson: true },
      },
    },
  });

  // Also get counts for all segments
  const allInterventions = await db.intervention.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, state: true },
  });

  const counts: Record<QueueTab, number> = {
    awaiting_review: 0,
    approved: 0,
    scheduled: 0,
    sent: 0,
    responded: 0,
    recovered: 0,
    dismissed: 0,
  };
  for (const iv of allInterventions) {
    const tab = dbStateToQueueTab(iv.state);
    counts[tab]++;
  }

  // Map to QueueItem for client hydration
  const initialItems: QueueItem[] = interventions.map((iv) => {
    const studentState = iv.student.studentStates[0];
    const courseName = studentState?.course?.name ?? "Unknown course";
    const progressPercent = studentState?.progressPercent ?? 0;
    const lastActivityAt = studentState?.lastActivityAt?.toISOString() ?? iv.createdAt.toISOString();
    const inactivityDays = studentState?.lastActivityAt
      ? Math.floor((Date.now() - studentState.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      id: iv.id,
      studentId: iv.student.id,
      studentName: iv.student.name ?? iv.student.email ?? `user_${iv.student.whopUserId.slice(-6)}`,
      studentEmail: iv.student.email ?? "",
      studentAvatarInitials: (iv.student.name ?? "U").slice(0, 2).toUpperCase(),
      courseName,
      trigger: iv.trigger,
      priority: iv.priority as QueueItem["priority"],
      state: iv.state,
      inactivityDays,
      progressPercent,
      lastActivityAt,
      scheduledFor: iv.scheduledFor?.toISOString() ?? null,
      suppressed: false,
      inCooldown: iv.cooldownUntil ? new Date(iv.cooldownUntil) > new Date() : false,
      cooldownUntil: iv.cooldownUntil?.toISOString() ?? null,
    };
  });

  const awaitingCount = counts.awaiting_review;

  return (
    <div className="flex flex-col">
      <div className="shrink-0 border-b border-[var(--hairline)] bg-[var(--canvas)] px-6 py-4">
        <CompanyPageHeader
          title="Rescue queue"
          description="Activation Rescue candidates. Approve, schedule, or dismiss each one."
        >
          <Badge variant="outline" className="font-mono text-[12px]">
            {awaitingCount} awaiting
          </Badge>
        </CompanyPageHeader>
      </div>
      <RescueQueueClient
        companyId={companyId}
        initialItems={initialItems}
        initialCounts={counts}
      />
    </div>
  );
}

// ─── Fixture rescue queue ────────────────────────────────────
import {
  FIXTURE_COMPANY_ID,
} from "@/providers/fixtures/fixtures-data";
import {
  getMemberships as getFixtureMemberships,
  getCourseStudents as getFixtureCourseStudents,
} from "@/providers/fixtures";

function FixtureRescueQueue({ companyId }: { companyId: string }) {
  const memberships = getFixtureMemberships();
  const courseStudents = getFixtureCourseStudents();

  // Candidates: active members with no course progress
  const candidates = memberships.filter(
    (m) => m.status === "active" && !courseStudents.some((cs) => cs.userId === m.userId),
  );

  // Convert to QueueItem format
  const initialItems: QueueItem[] = candidates.map((m, idx) => ({
    id: `fixture-iv-${idx}`,
    studentId: m.userId,
    studentName: `user_${m.userId}`,
    studentEmail: "",
    studentAvatarInitials: `U${idx}`,
    courseName: "Agency Growth System",
    trigger: "No course progress detected",
    priority: "high" as const,
    state: "awaiting_approval" as QueueItem["state"],
    inactivityDays: 14,
    progressPercent: 0,
    lastActivityAt: new Date(m.joinedAt).toISOString(),
    scheduledFor: null,
    suppressed: false,
    inCooldown: false,
    cooldownUntil: null,
  }));

  const counts: Record<QueueTab, number> = {
    awaiting_review: initialItems.length,
    approved: 0,
    scheduled: 0,
    sent: 0,
    responded: 0,
    recovered: 0,
    dismissed: 0,
  };

  return (
    <div className="flex flex-col">
      <div className="shrink-0 border-b border-[var(--hairline)] bg-[var(--canvas)] px-6 py-4">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-[26px] leading-tight text-[var(--ink-primary)]">
              Rescue queue
            </h1>
            <p className="text-[14px] text-[var(--ink-secondary)]">
              Activation Rescue candidates awaiting your review.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
          >
            <FlaskConical className="mr-1 size-3" />
            fixture · {candidates.length} candidates
          </Badge>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2.5 border-b border-[var(--hairline)] bg-[var(--warning-light)]/20 px-6 py-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Fixture mode.</span>{" "}
          Illustrative fixture outcome — data is from deterministic local seeds.
        </p>
      </div>

      <RescueQueueClient
        companyId={companyId}
        initialItems={initialItems}
        initialCounts={counts}
      />
    </div>
  );
}
