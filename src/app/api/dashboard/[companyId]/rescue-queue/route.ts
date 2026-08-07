// GET /api/dashboard/[companyId]/rescue-queue
//
// Returns the full rescue queue data for the dashboard:
//  - Interventions with their student, course, campaign, eligibility snapshot
//  - Paged, filterable by state and priority
//  - Includes suppression/cooldown/pause status for each row
//
// Query params:
//   ?state=awaiting_approval,approved  (comma-separated InterventionState filter)
//   ?priority=high,medium            (comma-separated priority filter)
//   ?page=1                          (1-based page number)
//   ?pageSize=25                     (items per page, max 100)
//   ?sortBy=createdAt                (createdAt | priority | state)
//   ?sortOrder=desc                  (asc | desc)

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import type { InterventionState, Prisma } from "@prisma/client";

const QuerySchema = z.object({
  state: z.string().optional(),
  priority: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["createdAt", "priority", "state"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/** Valid intervention states for filtering */
const VALID_STATES = new Set<InterventionState>([
  "drafted",
  "awaiting_approval",
  "approved",
  "scheduled",
  "queued",
  "delivery_attempted",
  "notification_accepted",
  "delivered",
  "failed",
  "stopped",
  "dismissed",
]);

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

  // Build state filter
  const stateFilter: InterventionState[] = query.state
    ? query.state
        .split(",")
        .map((s) => s.trim() as InterventionState)
        .filter((s) => VALID_STATES.has(s))
    : [];

  // Build priority filter
  const priorityFilter: string[] = query.priority
    ? query.priority.split(",").map((p) => p.trim())
    : [];

  // Build where clause
  const where: Prisma.InterventionWhereInput = {
    organizationId: ctx.organizationId,
    ...(stateFilter.length > 0 ? { state: { in: stateFilter } } : {}),
    ...(priorityFilter.length > 0 ? { priority: { in: priorityFilter } } : {}),
  };

  // Build order by
  const orderBy: Prisma.InterventionOrderByWithRelationInput =
    query.sortBy === "priority"
      ? { priority: query.sortOrder }
      : query.sortBy === "state"
        ? { state: query.sortOrder }
        : { createdAt: query.sortOrder };

  // Pagination
  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  // Fetch interventions with relations
  const [interventions, totalCount] = await Promise.all([
    db.intervention.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            whopUserId: true,
            suppressions: {
              select: { id: true, scope: true, reason: true },
            },
            memberships: {
              where: { status: { in: ["active", "trialing"] } },
              select: { id: true, status: true, productId: true },
              take: 1,
            },
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            cooldownDays: true,
          },
        },
        campaignVersion: {
          select: {
            id: true,
            versionNumber: true,
          },
        },
        eligibilitySnapshot: {
          select: {
            id: true,
            state: true,
            evidenceJson: true,
            detectedAt: true,
          },
        },
        deliveryAttempts: {
          select: {
            id: true,
            state: true,
            attemptNumber: true,
            createdAt: true,
          },
          orderBy: { attemptNumber: "desc" },
          take: 1,
        },
      },
    }),
    db.intervention.count({ where }),
  ]);

  // Fetch organization-level status for context
  const organization = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: {
      isPaused: true,
      status: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      timezone: true,
    },
  });

  // Enrich each row with computed status flags
  const now = new Date();
  const enrichedRows = interventions.map((intervention) => {
    const isSuppressed = intervention.student.suppressions.length > 0;
    const hasActiveMembership = intervention.student.memberships.length > 0;

    // Check if student is in cooldown
    const cooldownDays = intervention.campaign.cooldownDays;
    const isInCooldown = intervention.cooldownUntil
      ? intervention.cooldownUntil > now
      : false;

    return {
      id: intervention.id,
      state: intervention.state,
      priority: intervention.priority,
      trigger: intervention.trigger,
      messagePreview: intervention.messagePreview,
      messageEdited: intervention.messageEdited,
      approvedById: intervention.approvedById,
      approvedAt: intervention.approvedAt,
      scheduledFor: intervention.scheduledFor,
      sentAt: intervention.sentAt,
      createdAt: intervention.createdAt,
      updatedAt: intervention.updatedAt,
      // Relations
      student: {
        id: intervention.student.id,
        name: intervention.student.name,
        email: intervention.student.email,
        isSuppressed,
        hasActiveMembership,
      },
      campaign: {
        id: intervention.campaign.id,
        name: intervention.campaign.name,
        type: intervention.campaign.type,
        status: intervention.campaign.status,
      },
      campaignVersion: intervention.campaignVersion
        ? {
            id: intervention.campaignVersion.id,
            versionNumber: intervention.campaignVersion.versionNumber,
          }
        : null,
      eligibilitySnapshot: intervention.eligibilitySnapshot
        ? {
            id: intervention.eligibilitySnapshot.id,
            state: intervention.eligibilitySnapshot.state,
            detectedAt: intervention.eligibilitySnapshot.detectedAt,
          }
        : null,
      latestDeliveryAttempt: intervention.deliveryAttempts[0] ?? null,
      // Computed status flags
      statusFlags: {
        isSuppressed,
        isInCooldown,
        orgPaused: organization?.isPaused ?? false,
        membershipActive: hasActiveMembership,
        campaignActive: intervention.campaign.status === "active",
      },
    };
  });

  return NextResponse.json({
    ok: true,
    data: enrichedRows,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / query.pageSize),
    },
    organizationStatus: {
      isPaused: organization?.isPaused ?? false,
      status: organization?.status ?? "active",
      quietHours: {
        start: organization?.quietHoursStart ?? "20:00",
        end: organization?.quietHoursEnd ?? "08:00",
        timezone: organization?.timezone ?? "America/New_York",
      },
    },
  });
}
