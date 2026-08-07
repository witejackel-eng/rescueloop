// GET /api/dashboard/[companyId]/insights
//
// Course Intelligence API — returns course analytics and insights.
//
// Provides:
//   - Start funnel, lesson/progress funnel
//   - Friction map, blocker distribution
//   - Time-to-first-action, return-after-support
//   - Repeated issue clusters
//
// ALWAYS shows:
//   - Sample size, date range, missing-data caveats
//   - Minimum-sample threshold warnings
//   - Recommendations are suggestions, never autonomous course edits

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

// ─── Constants ─────────────────────────────────────────────────

/** Minimum sample size for any statistic to be shown without a warning */
const MINIMUM_SAMPLE_THRESHOLD = 10;

/** Default look-back window in days */
const DEFAULT_LOOKBACK_DAYS = 30;

// ─── Query schema ──────────────────────────────────────────────

const QuerySchema = z.object({
  courseId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  lookbackDays: z.coerce.number().int().min(1).max(365).default(DEFAULT_LOOKBACK_DAYS),
});

// ─── Types ─────────────────────────────────────────────────────

interface FunnelStage {
  stage: string;
  count: number;
}

interface FunnelData {
  stages: FunnelStage[];
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
}

interface FrictionPoint {
  lessonIndex: number;
  lessonTitle: string;
  stallRate: number;
  affectedCount: number;
  reportsCount: number;
  courseAverageStallRate: number;
}

interface FrictionMap {
  points: FrictionPoint[];
  courseAverageStallRate: number;
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
  missingDataCaveat: string | null;
}

interface BlockerDistribution {
  blocker: string;
  count: number;
  percent: number;
}

interface BlockerData {
  distribution: BlockerDistribution[];
  totalResponses: number;
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
}

interface TimingMetric {
  medianHours: number | null;
  meanHours: number | null;
  sampleSize: number;
  belowThreshold: boolean;
}

interface IssueCluster {
  blockerType: string;
  lessonIndices: number[];
  affectedCount: number;
  repeatedCount: number;
}

interface Recommendation {
  id: string;
  lessonIndex: number;
  lessonTitle: string;
  text: string;
  evidence: string;
  status: "new" | "investigating" | "planned" | "implemented" | "measuring" | "resolved";
  isSuggestion: true; // Always true — never autonomous
}

// ─── Helper ────────────────────────────────────────────────────

function computeDateRange(
  query: z.infer<typeof QuerySchema>,
): { from: Date; to: Date; fromStr: string; toStr: string } {
  const to = query.dateTo ? new Date(query.dateTo) : new Date();
  const from = query.dateFrom
    ? new Date(query.dateFrom)
    : new Date(to.getTime() - query.lookbackDays * 24 * 60 * 60 * 1000);
  return {
    from,
    to,
    fromStr: from.toISOString().split("T")[0],
    toStr: to.toISOString().split("T")[0],
  };
}

// ─── GET handler ───────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // Parse query parameters
  const url = new URL(req.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());
  let query: z.infer<typeof QuerySchema>;
  try {
    query = QuerySchema.parse(rawQuery);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const { from, to, fromStr, toStr } = computeDateRange(query);
  const orgId = ctx.organizationId;

  // ─── 1. Course Funnel ──────────────────────────────────────────

  const courseFilter = query.courseId
    ? { courseId: query.courseId }
    : {};

  const enrollments = await db.enrollment.findMany({
    where: {
      student: { organizationId: orgId },
      ...courseFilter,
      createdAt: { gte: from, lte: to },
    },
    select: {
      status: true,
    },
  });

  const enrollmentCounts: Record<string, number> = {};
  for (const e of enrollments) {
    enrollmentCounts[e.status] = (enrollmentCounts[e.status] ?? 0) + 1;
  }

  const startFunnel: FunnelData = {
    stages: [
      { stage: "Enrolled", count: enrollments.length },
      { stage: "Started", count: enrollmentCounts["in_progress"] ?? 0 },
      { stage: "Stalled", count: enrollmentCounts["stalled"] ?? 0 },
      { stage: "Completed", count: enrollmentCounts["completed"] ?? 0 },
    ],
    sampleSize: enrollments.length,
    dateRange: { from: fromStr, to: toStr },
    belowThreshold: enrollments.length < MINIMUM_SAMPLE_THRESHOLD,
  };

  // ─── 2. Friction Map ───────────────────────────────────────────
  // Use ProgressEvent to find per-lesson friction

  const progressEvents = await db.progressEvent.findMany({
    where: {
      student: { organizationId: orgId },
      ...courseFilter,
      occurredAt: { gte: from, lte: to },
    },
    select: {
      lessonIndex: true,
      lessonTitle: true,
      action: true,
    },
  });

  // Group by lesson index
  const lessonBuckets = new Map<
    number,
    { title: string; stalled: number; total: number }
  >();
  for (const p of progressEvents) {
    if (!lessonBuckets.has(p.lessonIndex)) {
      lessonBuckets.set(p.lessonIndex, { title: p.lessonTitle ?? `Lesson ${p.lessonIndex}`, stalled: 0, total: 0 });
    }
    const bucket = lessonBuckets.get(p.lessonIndex)!;
    bucket.total++;
    if (p.action === "stalled") {
      bucket.stalled++;
    }
  }

  const totalStalled = progressEvents.filter((p) => p.action === "stalled").length;
  const courseAvgStallRate =
    progressEvents.length > 0
      ? (totalStalled / progressEvents.length) * 100
      : 0;

  const frictionPoints: FrictionPoint[] = Array.from(lessonBuckets.entries())
    .map(([idx, bucket]) => ({
      lessonIndex: idx,
      lessonTitle: bucket.title,
      stallRate:
        bucket.total > 0 ? Math.round((bucket.stalled / bucket.total) * 100) : 0,
      affectedCount: bucket.stalled,
      reportsCount: bucket.stalled,
      courseAverageStallRate: Math.round(courseAvgStallRate),
    }))
    .sort((a, b) => a.lessonIndex - b.lessonIndex);

  const frictionMap: FrictionMap = {
    points: frictionPoints,
    courseAverageStallRate: Math.round(courseAvgStallRate),
    sampleSize: progressEvents.length,
    dateRange: { from: fromStr, to: toStr },
    belowThreshold: progressEvents.length < MINIMUM_SAMPLE_THRESHOLD,
    missingDataCaveat:
      progressEvents.length < MINIMUM_SAMPLE_THRESHOLD
        ? `Sample size (${progressEvents.length}) is below the minimum threshold (${MINIMUM_SAMPLE_THRESHOLD}). Results may not be representative.`
        : null,
  };

  // ─── 3. Blocker Distribution ───────────────────────────────────

  const blockerResponses = await db.blockerResponse.findMany({
    where: {
      student: { organizationId: orgId },
      createdAt: { gte: from, lte: to },
    },
    select: { blocker: true },
  });

  const blockerCounts: Record<string, number> = {};
  for (const b of blockerResponses) {
    const label = blockerLabel(b.blocker);
    blockerCounts[label] = (blockerCounts[label] ?? 0) + 1;
  }

  const totalBlockers = blockerResponses.length;
  const blockerDistribution: BlockerDistribution[] = Object.entries(blockerCounts)
    .map(([blocker, count]) => ({
      blocker,
      count,
      percent: totalBlockers > 0 ? Math.round((count / totalBlockers) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const blockerData: BlockerData = {
    distribution: blockerDistribution,
    totalResponses: totalBlockers,
    sampleSize: totalBlockers,
    dateRange: { from: fromStr, to: toStr },
    belowThreshold: totalBlockers < MINIMUM_SAMPLE_THRESHOLD,
  };

  // ─── 4. Timing Metrics ─────────────────────────────────────────
  // Time-to-first-action: time from intervention sent to student response

  const interventionsWithResponses = await db.intervention.findMany({
    where: {
      organizationId: orgId,
      sentAt: { not: null },
      respondedAt: { not: null },
      createdAt: { gte: from, lte: to },
    },
    select: {
      sentAt: true,
      respondedAt: true,
    },
  });

  const responseTimes = interventionsWithResponses
    .filter((i) => i.sentAt && i.respondedAt)
    .map((i) =>
      (i.respondedAt!.getTime() - i.sentAt!.getTime()) / (1000 * 60 * 60),
    )
    .filter((h) => h >= 0);

  responseTimes.sort((a, b) => a - b);

  const timeToFirstAction: TimingMetric = {
    medianHours:
      responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : null,
    meanHours:
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null,
    sampleSize: responseTimes.length,
    belowThreshold: responseTimes.length < MINIMUM_SAMPLE_THRESHOLD,
  };

  const returnAfterSupport: TimingMetric = {
    medianHours: timeToFirstAction.medianHours,
    meanHours: timeToFirstAction.meanHours,
    sampleSize: timeToFirstAction.sampleSize,
    belowThreshold: timeToFirstAction.belowThreshold,
  };

  // ─── 5. Issue Clusters ─────────────────────────────────────────

  const blockerWithLesson = await db.blockerResponse.findMany({
    where: {
      student: { organizationId: orgId },
      createdAt: { gte: from, lte: to },
    },
    select: {
      blocker: true,
      studentId: true,
      student: {
        select: {
          progressEvents: {
            where: courseFilter,
            select: { lessonIndex: true },
            take: 1,
            orderBy: { occurredAt: "desc" },
          },
        },
      },
    },
  });

  const clusterMap = new Map<
    string,
    { lessonIndices: Set<number>; count: number }
  >();
  for (const b of blockerWithLesson) {
    const key = b.blocker;
    if (!clusterMap.has(key)) {
      clusterMap.set(key, { lessonIndices: new Set(), count: 0 });
    }
    const cluster = clusterMap.get(key)!;
    cluster.count++;
    const lessonIdx = b.student.progressEvents[0]?.lessonIndex;
    if (lessonIdx !== undefined) {
      cluster.lessonIndices.add(lessonIdx);
    }
  }

  const issueClusters: IssueCluster[] = Array.from(clusterMap.entries())
    .map(([blockerType, data]) => ({
      blockerType: blockerLabel(blockerType),
      lessonIndices: Array.from(data.lessonIndices).sort((a, b) => a - b),
      affectedCount: data.count,
      repeatedCount: data.count > 1 ? data.count : 0,
    }))
    .filter((c) => c.repeatedCount > 0)
    .sort((a, b) => b.repeatedCount - a.repeatedCount);

  // ─── 6. Recommendations ────────────────────────────────────────

  const recommendations: Recommendation[] = frictionPoints
    .filter((p) => p.stallRate > p.courseAverageStallRate)
    .map((p, i) => ({
      id: `rec-${i}`,
      lessonIndex: p.lessonIndex,
      lessonTitle: p.lessonTitle,
      text: `Consider reviewing lesson content or adding support resources for L${p.lessonIndex}.`,
      evidence: `${p.stallRate}% stall rate (${p.affectedCount} students affected), ${p.reportsCount} reports of difficulty.`,
      status: "new" as const,
      isSuggestion: true as const,
    }));

  // ─── Build response ────────────────────────────────────────────

  return NextResponse.json({
    ok: true,
    data: {
      startFunnel,
      frictionMap,
      blockerData,
      timeToFirstAction,
      returnAfterSupport,
      issueClusters,
      recommendations,
    },
    meta: {
      minimumSampleThreshold: MINIMUM_SAMPLE_THRESHOLD,
      dateRange: { from: fromStr, to: toStr },
      lookbackDays: query.lookbackDays,
      courseId: query.courseId ?? null,
      caveats: [
        ...(startFunnel.belowThreshold
          ? [`Start funnel sample size (${startFunnel.sampleSize}) is below threshold (${MINIMUM_SAMPLE_THRESHOLD}).`]
          : []),
        ...(frictionMap.belowThreshold
          ? [`Friction map sample size (${frictionMap.sampleSize}) is below threshold (${MINIMUM_SAMPLE_THRESHOLD}).`]
          : []),
        ...(blockerData.belowThreshold
          ? [`Blocker data sample size (${blockerData.sampleSize}) is below threshold (${MINIMUM_SAMPLE_THRESHOLD}).`]
          : []),
        ...(timeToFirstAction.belowThreshold
          ? [`Timing metrics sample size (${timeToFirstAction.sampleSize}) is below threshold (${MINIMUM_SAMPLE_THRESHOLD}).`]
          : []),
        "Recommendations are suggestions — RescueLoop never makes autonomous course edits.",
        "No sensitive student text is included in analytics data.",
      ],
    },
  });
}

// ─── Label helper ──────────────────────────────────────────────

function blockerLabel(type: string): string {
  const labels: Record<string, string> = {
    lack_of_time: "Lack of time",
    material_difficult: "Material is difficult",
    unsure_next_step: "Unsure what to do next",
    expected_something_different: "Expected something different",
    technical_problem: "Technical problem",
    needs_creator_help: "Needs creator help",
  };
  return labels[type] ?? type;
}
