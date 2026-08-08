// GET /api/dashboard/[companyId]/value
//
// Value Ledger API — returns ValueEvents with their AttributionEvidence.
// Supports filtering by attributionLevel, dateRange, studentId, courseId.
//
// Each row includes:
//   - member, course, intervention, observed outcome
//   - evidence class, monetary amount, source events
//   - attribution window, rule version
//   - excluded/disputed state

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import { getAttributionMethodology } from "@/lib/attribution/policy";
import type { AttributionState, Prisma } from "@prisma/client";

const VALID_ATTRIBUTION_LEVELS = new Set<AttributionState>([
  "unattributed",
  "observed",
  "strongly_associated",
  "confirmed",
  "estimated",
  "rejected",
]);

const QuerySchema = z.object({
  attributionLevel: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  studentId: z.string().optional(),
  courseId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  includeExcluded: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

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

  // Build attribution level filter
  const attributionFilter: AttributionState[] = query.attributionLevel
    ? query.attributionLevel
        .split(",")
        .map((s) => s.trim() as AttributionState)
        .filter((s) => VALID_ATTRIBUTION_LEVELS.has(s))
    : [];

  // Build where clause
  const where: Prisma.ValueEventWhereInput = {
    organizationId: ctx.organizationId,
    // By default, exclude excluded entries unless explicitly requested
    ...(query.includeExcluded ? {} : { excluded: false }),
    ...(attributionFilter.length > 0
      ? { attributionLevel: { in: attributionFilter } }
      : {}),
    ...(query.studentId ? { studentId: query.studentId } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          createdAt: {
            ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
            ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
          },
        }
      : {}),
  };

  // If courseId is specified, filter through intervention → campaign → course
  if (query.courseId) {
    const campaignIds = await db.campaign.findMany({
      where: {
        organizationId: ctx.organizationId,
        confirmedMapping: { courseId: query.courseId },
      },
      select: { id: true },
    });
    const cIds = campaignIds.map((c) => c.id);
    where.interventionId = {
      in: (
        await db.intervention.findMany({
          where: {
            organizationId: ctx.organizationId,
            campaignId: { in: cIds },
          },
          select: { id: true },
        })
      ).map((i) => i.id),
    };
  }

  // Pagination
  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  // Fetch value events with evidence and intervention relations
  const [valueEvents, totalCount] = await Promise.all([
    db.valueEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        evidence: {
          orderBy: { timestamp: "asc" },
        },
        intervention: {
          select: {
            id: true,
            trigger: true,
            state: true,
            sentAt: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            campaign: {
              select: {
                id: true,
                name: true,
                type: true,
                confirmedMapping: {
                  select: {
                    course: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.valueEvent.count({ where }),
  ]);

  // Get summary stats
  const [confirmedSum, associatedSum, estimatedSum, disputedCount, excludedCount] =
    await Promise.all([
      db.valueEvent.aggregate({
        where: {
          organizationId: ctx.organizationId,
          attributionLevel: "confirmed",
          excluded: false,
        },
        _sum: { amountCents: true },
      }),
      db.valueEvent.aggregate({
        where: {
          organizationId: ctx.organizationId,
          attributionLevel: "strongly_associated",
          excluded: false,
        },
        _sum: { amountCents: true },
      }),
      db.valueEvent.aggregate({
        where: {
          organizationId: ctx.organizationId,
          attributionLevel: "estimated",
          excluded: false,
        },
        _sum: { amountCents: true },
      }),
      db.valueEvent.count({
        where: {
          organizationId: ctx.organizationId,
          disputed: true,
        },
      }),
      db.valueEvent.count({
        where: {
          organizationId: ctx.organizationId,
          excluded: true,
        },
      }),
    ]);

  // Get attribution methodology
  const methodology = getAttributionMethodology();

  // Enrich rows for the client
  const enrichedEvents = valueEvents.map((ve) => ({
    id: ve.id,
    event: ve.event,
    attributionLevel: ve.attributionLevel,
    amountCents: ve.amountCents,
    currency: ve.currency,
    formula: ve.formula,
    policyVersion: ve.policyVersion,
    excluded: ve.excluded,
    disputed: ve.disputed,
    disputeReason: ve.disputeReason,
    disputedAt: ve.disputedAt?.toISOString() ?? null,
    excludedAt: ve.excludedAt?.toISOString() ?? null,
    createdAt: ve.createdAt.toISOString(),
    updatedAt: ve.updatedAt.toISOString(),
    paymentEventId: ve.paymentEventId,
    // Member info
    member: ve.intervention?.student
      ? {
          id: ve.intervention.student.id,
          name: ve.intervention.student.name,
        }
      : null,
    // Course info
    course: ve.intervention?.campaign?.confirmedMapping?.course
      ? {
          id: ve.intervention.campaign.confirmedMapping.course.id,
          name: ve.intervention.campaign.confirmedMapping.course.name,
        }
      : null,
    // Intervention info
    intervention: ve.intervention
      ? {
          id: ve.intervention.id,
          trigger: ve.intervention.trigger,
          state: ve.intervention.state,
          sentAt: ve.intervention.sentAt?.toISOString() ?? null,
        }
      : null,
    // Evidence chain
    evidence: ve.evidence.map((e) => ({
      id: e.id,
      evidenceType: e.evidenceType,
      evidenceRef: e.evidenceRef,
      timestamp: e.timestamp.toISOString(),
      metadata: e.metadataJson as Record<string, unknown> | null,
    })),
  }));

  return NextResponse.json({
    ok: true,
    data: enrichedEvents,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / query.pageSize),
    },
    summary: {
      confirmedCents: confirmedSum._sum.amountCents ?? 0,
      associatedCents: associatedSum._sum.amountCents ?? 0,
      estimatedCents: estimatedSum._sum.amountCents ?? 0,
      disputedCount,
      excludedCount,
    },
    methodology,
  });
}
