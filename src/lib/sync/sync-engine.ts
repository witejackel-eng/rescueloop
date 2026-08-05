// Synchronization engine — syncs external provider data into the database.
// Uses the provider contracts so it works with both fixture and Whop providers.
//
// Each sync function is a separate durable workflow:
// - syncCourses
// - syncProducts
// - syncMemberships
// - syncCourseProgress
// - reconcile
// - detectCandidates
//
// All syncs are idempotent (upsert by external ID) and resumable (cursor checkpoints).
//
// Phase 9 improvements:
// - Bounded, batched DB operations per page
// - loadExternalIds in one query, then split into creates / updates
// - createMany({ skipDuplicates: true }) where supported
// - Batch updates in controlled concurrency
// - Persist checkpoint after every committed page
// - normalizeMembershipStatus replaces `as any`
// - Correct result accounting: upsert updates → recordsUpdated

import "server-only";
import { db } from "@/lib/db";
import type { ProviderBundle } from "@/providers/contracts";
import { recordAuditEvent } from "@/lib/audit";
import { normalizeMembershipStatus } from "./normalize-membership-status";
import {
  createSyncExecution,
  completeSyncExecution,
  createSyncStage,
  completeSyncStage,
  persistCheckpoint,
  getLatestCheckpoint,
  createReconciliationRun,
  completeReconciliationRun,
} from "./sync-records";
import type { SyncStageResults } from "./sync-records";

// ─── Constants ───────────────────────────────────────────────

const PAGE_SIZE = 50;
const MAX_CONCURRENT_UPDATES = 10; // Bounded concurrency for batch updates

// ─── Types ───────────────────────────────────────────────────

export interface SyncResult {
  resource: string;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  warnings: string[];
  cursor: string | null; // For resumption
}

export interface SyncExecutionParams {
  organizationId: string;
  companyId: string; // Whop company ID
  providers: ProviderBundle;
  cursor?: string | null;
  syncExecutionId?: string; // Existing execution to attach to
  requestedBy?: string;
}

// ─── Bounded concurrency helper ──────────────────────────────

/** Run items with at most `concurrency` operations in flight. */
async function boundedMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = MAX_CONCURRENT_UPDATES,
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = fn(item).then((r) => { results.push(r); });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove settled promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          executing[i].then(() => true, () => true),
          Promise.resolve(false),
        ]);
        if (settled) executing.splice(i, 1);
      }
    }
  }

  await Promise.allSettled(executing);
  return results;
}

// ─── Course sync ─────────────────────────────────────────────

export async function syncCourses(params: SyncExecutionParams): Promise<SyncResult> {
  const result: SyncResult = {
    resource: "courses",
    recordsRead: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
    warnings: [],
    cursor: null,
  };

  // Resume from checkpoint if no explicit cursor
  let cursor = params.cursor ?? null;
  if (!cursor) {
    const checkpoint = await getLatestCheckpoint(params.organizationId, "courses");
    if (checkpoint?.cursor) {
      cursor = checkpoint.cursor;
    }
  }

  let pagesProcessed = 0;

  do {
    const page = await params.providers.courses.list({
      companyId: params.companyId,
      cursor,
      pageSize: PAGE_SIZE,
    });

    result.recordsRead += page.items.length;
    pagesProcessed++;

    // 1. Validate the full page
    const validItems = page.items.filter((course) => {
      if (!course.id) {
        result.errors.push(`Course missing id — skipped`);
        result.recordsSkipped++;
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      cursor = page.nextCursor;
      continue;
    }

    // 2. Load existing external IDs in one bounded query
    const externalIds = validItems.map((c) => c.id);
    const existing = await db.course.findMany({
      where: {
        organizationId: params.organizationId,
        externalCourseId: { in: externalIds },
      },
      select: { id: true, externalCourseId: true },
    });
    const existingMap = new Map(existing.map((e) => [e.externalCourseId, e.id]));

    // 3. Split into creates and updates
    const toCreate = validItems.filter((c) => !existingMap.has(c.id));
    const toUpdate = validItems.filter((c) => existingMap.has(c.id));

    // 4. Batch creates with skipDuplicates
    if (toCreate.length > 0) {
      try {
        await db.course.createMany({
          data: toCreate.map((course) => ({
            organizationId: params.organizationId,
            externalCourseId: course.id,
            externalExperienceId: course.experienceId,
            name: course.title ?? "Untitled Course",
            lessonCount: course.lessonCount,
          })),
          skipDuplicates: true,
        });
        result.recordsCreated += toCreate.length;
      } catch (error) {
        result.errors.push(`Course batch create: ${error instanceof Error ? error.message : "unknown"}`);
        result.recordsSkipped += toCreate.length;
      }
    }

    // 5. Batch updates with bounded concurrency
    if (toUpdate.length > 0) {
      const updateResults = await boundedMap(toUpdate, async (course) => {
        const existingId = existingMap.get(course.id)!;
        try {
          await db.course.update({
            where: { id: existingId },
            data: {
              name: course.title ?? undefined,
              lessonCount: course.lessonCount || undefined,
              externalExperienceId: course.experienceId || undefined,
            },
          });
          return true;
        } catch (error) {
          result.errors.push(`Course ${course.id}: ${error instanceof Error ? error.message : "unknown"}`);
          return false;
        }
      });
      result.recordsUpdated += updateResults.filter(Boolean).length;
      result.recordsSkipped += updateResults.filter((r) => !r).length;
    }

    // 6. Commit page — persist checkpoint
    cursor = page.nextCursor;
    if (params.syncExecutionId) {
      await persistCheckpoint(
        params.organizationId,
        "courses",
        cursor,
        null,
        params.syncExecutionId,
        pagesProcessed,
      );
    }
  } while (cursor);

  result.cursor = cursor;

  // 7. Emit usage and audit data
  await recordAuditEvent({
    organizationId: params.organizationId,
    action: "synced",
    objectType: "course",
    objectId: "bulk",
    reason: `Synced ${result.recordsRead} courses`,
    metadata: {
      created: result.recordsCreated,
      updated: result.recordsUpdated,
      skipped: result.recordsSkipped,
      errors: result.errors.length,
    },
  });

  return result;
}

// ─── Product sync ────────────────────────────────────────────

export async function syncProducts(params: SyncExecutionParams): Promise<SyncResult> {
  const result: SyncResult = {
    resource: "products",
    recordsRead: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
    warnings: [],
    cursor: null,
  };

  let cursor = params.cursor ?? null;
  if (!cursor) {
    const checkpoint = await getLatestCheckpoint(params.organizationId, "products");
    if (checkpoint?.cursor) {
      cursor = checkpoint.cursor;
    }
  }

  let pagesProcessed = 0;

  do {
    const page = await params.providers.products.list({
      companyId: params.companyId,
      cursor,
      pageSize: PAGE_SIZE,
    });

    result.recordsRead += page.items.length;
    pagesProcessed++;

    const validItems = page.items.filter((product) => {
      if (!product.id) {
        result.errors.push(`Product missing id — skipped`);
        result.recordsSkipped++;
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      cursor = page.nextCursor;
      continue;
    }

    // Load existing in one query
    const externalIds = validItems.map((p) => p.id);
    const existing = await db.product.findMany({
      where: {
        organizationId: params.organizationId,
        whopProductId: { in: externalIds },
      },
      select: { id: true, whopProductId: true },
    });
    const existingMap = new Map(existing.map((e) => [e.whopProductId, e.id]));

    const toCreate = validItems.filter((p) => !existingMap.has(p.id));
    const toUpdate = validItems.filter((p) => existingMap.has(p.id));

    // Batch creates
    if (toCreate.length > 0) {
      try {
        await db.product.createMany({
          data: toCreate.map((product) => ({
            organizationId: params.organizationId,
            whopProductId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            currency: product.currency,
            billingCycle: product.billingCycle,
          })),
          skipDuplicates: true,
        });
        result.recordsCreated += toCreate.length;
      } catch (error) {
        result.errors.push(`Product batch create: ${error instanceof Error ? error.message : "unknown"}`);
        result.recordsSkipped += toCreate.length;
      }
    }

    // Batch updates
    if (toUpdate.length > 0) {
      const updateResults = await boundedMap(toUpdate, async (product) => {
        const existingId = existingMap.get(product.id)!;
        try {
          await db.product.update({
            where: { id: existingId },
            data: {
              name: product.name,
              priceCents: product.priceCents,
              currency: product.currency,
              billingCycle: product.billingCycle,
            },
          });
          return true;
        } catch (error) {
          result.errors.push(`Product ${product.id}: ${error instanceof Error ? error.message : "unknown"}`);
          return false;
        }
      });
      result.recordsUpdated += updateResults.filter(Boolean).length;
      result.recordsSkipped += updateResults.filter((r) => !r).length;
    }

    // Persist checkpoint
    cursor = page.nextCursor;
    if (params.syncExecutionId) {
      await persistCheckpoint(
        params.organizationId,
        "products",
        cursor,
        null,
        params.syncExecutionId,
        pagesProcessed,
      );
    }
  } while (cursor);

  result.cursor = cursor;

  await recordAuditEvent({
    organizationId: params.organizationId,
    action: "synced",
    objectType: "product",
    objectId: "bulk",
    reason: `Synced ${result.recordsRead} products`,
    metadata: {
      created: result.recordsCreated,
      updated: result.recordsUpdated,
      skipped: result.recordsSkipped,
    },
  });

  return result;
}

// ─── Membership sync ─────────────────────────────────────────

export async function syncMemberships(params: SyncExecutionParams): Promise<SyncResult> {
  const result: SyncResult = {
    resource: "memberships",
    recordsRead: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
    warnings: [],
    cursor: null,
  };

  let cursor = params.cursor ?? null;
  if (!cursor) {
    const checkpoint = await getLatestCheckpoint(params.organizationId, "memberships");
    if (checkpoint?.cursor) {
      cursor = checkpoint.cursor;
    }
  }

  let pagesProcessed = 0;

  do {
    const page = await params.providers.memberships.list({
      companyId: params.companyId,
      cursor,
      pageSize: PAGE_SIZE,
    });

    result.recordsRead += page.items.length;
    pagesProcessed++;

    for (const membership of page.items) {
      try {
        // Normalize the external status — replaces `membership.status as any`
        const { status: safeStatus, warning } = normalizeMembershipStatus(membership.status);
        if (warning) {
          result.warnings.push(warning);
        }

        // Find or create the student (upsert by composite key)
        const student = await db.student.upsert({
          where: {
            organizationId_whopUserId: {
              organizationId: params.organizationId,
              whopUserId: membership.userId,
            },
          },
          create: {
            organizationId: params.organizationId,
            whopUserId: membership.userId,
          },
          update: {},
        });

        // Find the product
        const product = await db.product.findFirst({
          where: {
            organizationId: params.organizationId,
            whopProductId: membership.productId,
          },
        });

        if (!product) {
          result.errors.push(`Membership ${membership.id}: product ${membership.productId} not found`);
          result.recordsSkipped++;
          continue;
        }

        // Check if membership already exists to determine create vs update
        const existingMembership = await db.membership.findUnique({
          where: { whopMembershipId: membership.id },
          select: { id: true },
        });

        if (existingMembership) {
          // UPDATE — increment recordsUpdated, NOT recordsCreated
          await db.membership.update({
            where: { id: existingMembership.id },
            data: {
              status: safeStatus,
              renewalDate: membership.renewalDate ? new Date(membership.renewalDate) : null,
              cancelledAt: membership.cancelledAt ? new Date(membership.cancelledAt) : null,
              priceCents: membership.priceCents,
              currency: membership.currency,
              lastSyncedAt: new Date(),
            },
          });
          result.recordsUpdated++;
        } else {
          // CREATE
          await db.membership.create({
            data: {
              organizationId: params.organizationId,
              studentId: student.id,
              productId: product.id,
              whopMembershipId: membership.id,
              status: safeStatus,
              joinedAt: new Date(membership.joinedAt),
              renewalDate: membership.renewalDate ? new Date(membership.renewalDate) : null,
              cancelledAt: membership.cancelledAt ? new Date(membership.cancelledAt) : null,
              priceCents: membership.priceCents,
              currency: membership.currency,
              lastSyncedAt: new Date(),
            },
          });
          result.recordsCreated++;
        }
      } catch (error) {
        result.errors.push(`Membership ${membership.id}: ${error instanceof Error ? error.message : "unknown"}`);
        result.recordsSkipped++;
      }
    }

    // Persist checkpoint
    cursor = page.nextCursor;
    if (params.syncExecutionId) {
      await persistCheckpoint(
        params.organizationId,
        "memberships",
        cursor,
        null,
        params.syncExecutionId,
        pagesProcessed,
      );
    }
  } while (cursor);

  result.cursor = cursor;

  await recordAuditEvent({
    organizationId: params.organizationId,
    action: "synced",
    objectType: "membership",
    objectId: "bulk",
    reason: `Synced ${result.recordsRead} memberships`,
    metadata: {
      created: result.recordsCreated,
      updated: result.recordsUpdated,
      skipped: result.recordsSkipped,
      warnings: result.warnings.length,
    },
  });

  return result;
}

// ─── Course progress sync ────────────────────────────────────

export async function syncCourseProgress(
  params: SyncExecutionParams & { courseId: string },
): Promise<SyncResult> {
  const result: SyncResult = {
    resource: "progress",
    recordsRead: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
    warnings: [],
    cursor: null,
  };

  // Find the internal course
  const course = await db.course.findFirst({
    where: {
      organizationId: params.organizationId,
      id: params.courseId,
    },
  });

  if (!course) {
    result.errors.push(`Course ${params.courseId} not found`);
    return result;
  }

  let cursor = params.cursor ?? null;
  if (!cursor) {
    const checkpoint = await getLatestCheckpoint(params.organizationId, "progress");
    if (checkpoint?.cursor) {
      cursor = checkpoint.cursor;
    }
  }

  let pagesProcessed = 0;

  do {
    const page = await params.providers.progress.listLessonInteractions({
      companyId: params.companyId,
      courseId: course.externalCourseId,
      cursor,
      pageSize: PAGE_SIZE,
    });

    result.recordsRead += page.items.length;
    pagesProcessed++;

    for (const interaction of page.items) {
      try {
        // Find the student
        const student = await db.student.findFirst({
          where: {
            organizationId: params.organizationId,
            whopUserId: interaction.userId,
          },
        });

        if (!student) {
          result.recordsSkipped++;
          continue;
        }

        // Use the external interaction ID for idempotency
        // The unique constraint prevents duplicate counting
        try {
          await db.progressEvent.create({
            data: {
              organizationId: params.organizationId,
              studentId: student.id,
              courseId: course.id,
              externalInteractionId: interaction.id,
              lessonIndex: 0,
              lessonTitle: interaction.lessonTitle,
              action: interaction.completed ? "completed" : "started",
              occurredAt: new Date(interaction.createdAt),
            },
          });
          result.recordsCreated++;
        } catch {
          // Unique constraint violation — already recorded (idempotent)
          result.recordsSkipped++;
        }
      } catch (error) {
        result.errors.push(`Interaction ${interaction.id}: ${error instanceof Error ? error.message : "unknown"}`);
        result.recordsSkipped++;
      }
    }

    // Persist checkpoint
    cursor = page.nextCursor;
    if (params.syncExecutionId) {
      await persistCheckpoint(
        params.organizationId,
        "progress",
        cursor,
        null,
        params.syncExecutionId,
        pagesProcessed,
      );
    }
  } while (cursor);

  // Recalculate course states from the interaction table
  await recalculateCourseStates(params.organizationId, course.id);

  result.cursor = cursor;

  await recordAuditEvent({
    organizationId: params.organizationId,
    action: "synced",
    objectType: "progress",
    objectId: course.id,
    reason: `Synced ${result.recordsRead} progress events`,
    metadata: {
      created: result.recordsCreated,
      skipped: result.recordsSkipped,
    },
  });

  return result;
}

// ─── Reconciliation ──────────────────────────────────────────

export interface ReconciliationResult {
  matched: number;
  membershipWithoutCourseActivity: number;
  courseActivityWithoutMembership: number;
  unmappedProduct: number;
  missingSourceFields: number;
  staleSourceRecord: number;
}

export async function reconcile(
  organizationId: string,
  courseId: string,
  syncExecutionId?: string,
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    matched: 0,
    membershipWithoutCourseActivity: 0,
    courseActivityWithoutMembership: 0,
    unmappedProduct: 0,
    missingSourceFields: 0,
    staleSourceRecord: 0,
  };

  // Create a reconciliation run record
  const run = await createReconciliationRun(organizationId, courseId, syncExecutionId);

  // Get all memberships for this organization that map to this course
  const mappings = await db.productCourseMapping.findMany({
    where: { organizationId, courseId, isConfirmed: true },
    include: { product: { include: { memberships: true } } },
  });

  const mappedProductIds = new Set(mappings.map((m) => m.productId));

  // Get all students with course activity
  const courseStates = await db.studentCourseState.findMany({
    where: { organizationId, courseId },
  });

  const studentsWithActivity = new Set(courseStates.map((s) => s.studentId));

  // Check each membership
  for (const mapping of mappings) {
    for (const membership of mapping.product.memberships) {
      if (studentsWithActivity.has(membership.studentId)) {
        result.matched++;
      } else {
        result.membershipWithoutCourseActivity++;
      }
    }
  }

  // Check for course activity without a mapped membership
  for (const state of courseStates) {
    const hasMembership = await db.membership.findFirst({
      where: {
        organizationId,
        studentId: state.studentId,
        productId: { in: Array.from(mappedProductIds) },
      },
    });

    if (!hasMembership) {
      result.courseActivityWithoutMembership++;
    }
  }

  // Complete the reconciliation run record
  await completeReconciliationRun(run.id, result);

  return result;
}

// ─── Candidate detection ─────────────────────────────────────

export interface CandidateDetectionResult {
  candidatesFound: number;
  snapshotsCreated: number;
  errors: string[];
}

export async function detectCandidates(
  organizationId: string,
  campaignId: string,
): Promise<CandidateDetectionResult> {
  const result: CandidateDetectionResult = {
    candidatesFound: 0,
    snapshotsCreated: 0,
    errors: [],
  };

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, organizationId, type: "activation_rescue" },
    include: { organization: true, versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!campaign) {
    result.errors.push("Campaign not found or not an Activation Rescue campaign");
    return result;
  }

  const latestVersion = campaign.versions[0];

  // Find all confirmed product-course mappings for this org
  const mappings = await db.productCourseMapping.findMany({
    where: { organizationId, isConfirmed: true },
    include: {
      product: { include: { memberships: { where: { status: { in: ["active", "trialing"] } } } } },
      course: true,
    },
  });

  const now = new Date();

  for (const mapping of mappings) {
    for (const membership of mapping.product.memberships) {
      // Check if the student has any course activity
      const hasActivity = await db.studentCourseState.findFirst({
        where: {
          organizationId,
          studentId: membership.studentId,
          courseId: mapping.courseId,
        },
      });

      if (hasActivity && hasActivity.lessonsCompleted > 0) {
        continue; // Has course activity — not a candidate
      }

      // Check activation delay
      const daysSinceJoin = (now.getTime() - membership.joinedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceJoin < mapping.activationDelayDays) {
        continue; // Too soon
      }

      // Check suppression
      const suppressed = await db.suppression.findFirst({
        where: { organizationId, studentId: membership.studentId },
      });
      if (suppressed) continue;

      // Check existing active intervention
      const existingIntervention = await db.intervention.findFirst({
        where: {
          organizationId,
          studentId: membership.studentId,
          campaignId,
          state: { notIn: ["dismissed", "stopped", "failed"] },
        },
      });
      if (existingIntervention) continue;

      // Check cooldown
      const lastIntervention = await db.intervention.findFirst({
        where: { organizationId, studentId: membership.studentId, campaignId },
        orderBy: { createdAt: "desc" },
      });

      if (lastIntervention) {
        const daysSinceLast = (now.getTime() - lastIntervention.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast < campaign.cooldownDays) continue;
      }

      // Check max messages
      const recentCount = await db.intervention.count({
        where: {
          organizationId,
          studentId: membership.studentId,
          campaignId,
          createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          state: { in: ["notification_accepted", "delivered"] },
        },
      });
      if (recentCount >= campaign.maxMessagesPerStudent) continue;

      // Candidate found — create eligibility snapshot
      result.candidatesFound++;

      const evidence = {
        detectedAt: now.toISOString(),
        membershipId: membership.id,
        membershipStatus: membership.status,
        joinedAt: membership.joinedAt.toISOString(),
        daysSinceJoin: Math.floor(daysSinceJoin),
        activationDelayDays: mapping.activationDelayDays,
        courseId: mapping.courseId,
        productId: mapping.productId,
        campaignId,
        campaignVersionId: latestVersion?.id,
      };

      try {
        await db.eligibilitySnapshot.create({
          data: {
            organizationId,
            studentId: membership.studentId,
            campaignId,
            campaignVersionId: latestVersion?.id,
            state: "eligible",
            evidenceJson: evidence as any,
            detectedAt: now,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        result.snapshotsCreated++;
      } catch (error) {
        result.errors.push(
          `Student ${membership.studentId}: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    }
  }

  return result;
}

// ─── Orchestrated sync execution ─────────────────────────────

/**
 * Run a full sync with durable execution records and stage tracking.
 * Returns the sync execution ID for observability.
 */
export async function runFullSync(
  params: SyncExecutionParams & { resources?: string[] },
): Promise<{ executionId: string; results: SyncResult[] }> {
  const resources = params.resources ?? ["courses", "products", "memberships"];
  const results: SyncResult[] = [];

  // Create the execution record
  const execution = await createSyncExecution({
    orgId: params.organizationId,
    trigger: params.requestedBy ? "manual" : "scheduled",
    requestedBy: params.requestedBy,
    jobId: params.syncExecutionId,
  });

  try {
    for (const resource of resources) {
      const stage = await createSyncStage(execution.id, resource);

      let syncResult: SyncResult;
      switch (resource) {
        case "courses":
          syncResult = await syncCourses({ ...params, syncExecutionId: execution.id });
          break;
        case "products":
          syncResult = await syncProducts({ ...params, syncExecutionId: execution.id });
          break;
        case "memberships":
          syncResult = await syncMemberships({ ...params, syncExecutionId: execution.id });
          break;
        default:
          await completeSyncStage(stage.id, {
            pagesProcessed: 0, recordsRead: 0, recordsCreated: 0,
            recordsUpdated: 0, recordsSkipped: 0,
          }, "skipped");
          continue;
      }

      results.push(syncResult);

      // Complete the stage with counts
      await completeSyncStage(stage.id, {
        pagesProcessed: 0, // Pages are tracked inside the sync functions
        recordsRead: syncResult.recordsRead,
        recordsCreated: syncResult.recordsCreated,
        recordsUpdated: syncResult.recordsUpdated,
        recordsSkipped: syncResult.recordsSkipped,
      });
    }

    await completeSyncExecution(execution.id, "completed");
  } catch (error) {
    await completeSyncExecution(
      execution.id,
      "failed",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return { executionId: execution.id, results };
}

// ─── Helpers ─────────────────────────────────────────────────

async function recalculateCourseStates(organizationId: string, courseId: string): Promise<void> {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  // Get all students with progress events for this course
  const students = await db.progressEvent.findMany({
    where: { organizationId, courseId },
    select: { studentId: true },
    distinct: ["studentId"],
  });

  for (const { studentId } of students) {
    const completedCount = await db.progressEvent.count({
      where: {
        organizationId,
        studentId,
        courseId,
        action: "completed",
      },
    });

    const firstEvent = await db.progressEvent.findFirst({
      where: { organizationId, studentId, courseId },
      orderBy: { occurredAt: "asc" },
    });

    const lastEvent = await db.progressEvent.findFirst({
      where: { organizationId, studentId, courseId },
      orderBy: { occurredAt: "desc" },
    });

    const progressPercent = course.lessonCount > 0
      ? Math.round((completedCount / course.lessonCount) * 100)
      : 0;

    await db.studentCourseState.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      create: {
        organizationId,
        studentId,
        courseId,
        progressPercent,
        lessonsCompleted: completedCount,
        totalLessons: course.lessonCount,
        firstActivityAt: firstEvent?.occurredAt ?? new Date(),
        lastActivityAt: lastEvent?.occurredAt ?? new Date(),
      },
      update: {
        lessonsCompleted: completedCount,
        progressPercent,
        lastActivityAt: lastEvent?.occurredAt ?? undefined,
      },
    });
  }
}
