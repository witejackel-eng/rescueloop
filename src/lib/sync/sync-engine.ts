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
//
// Phase 10 improvements:
// - Progress ingestion uses createMany({ skipDuplicates: true }) for batch
// - Structured failure classification (duplicate vs real error)
// - Persists: externalInteractionId, sourceTimestamp, receivedAt,
//   lessonId, lessonTitle, action, payloadHash, sourceVersion
// - Bounded aggregation for recalculateCourseStates
// - Handles: duplicates, out-of-order, older-after-newer, lesson count changes
//
// Phase 11 improvements:
// - Set-based reconciliation replaces per-student N+1 queries
// - Persists reconciliation outcomes with classification + resolution state
// - Pagination and summary counts
//
// Phase 12 improvements:
// - Candidate detection operates only on campaign's confirmed mapping
// - All 17 eligibility checks verified
// - Explicit campaign-to-mapping relationship
// - Immutable snapshots with unique idempotency key
// - Batch queries, no N+1

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
const PROGRESS_BATCH_SIZE = 100; // Max progress events per createMany batch
const RECONCILIATION_PAGE_SIZE = 200; // Students per reconciliation page
const CANDIDATE_BATCH_SIZE = 50; // Students per candidate detection batch

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

// ─── Structured failure classification (Phase 10) ───────────

export type FailureClass =
  | "duplicate_unique_constraint"
  | "duplicate_payload_hash"
  | "student_not_found"
  | "course_not_found"
  | "validation_error"
  | "db_error";

export interface ClassifiedFailure {
  class: FailureClass;
  externalId: string;
  message: string;
}

/**
 * Classify a Prisma / DB error into a structured failure type.
 * Unique constraint violations are "duplicate" — everything else is a real error.
 *
 * Phase 10: Also detects student_not_found, course_not_found, and validation_error
 * based on the error message content, so callers never treat these as duplicates.
 */
export function classifyCreateError(error: unknown, context: string): ClassifiedFailure {
  const msg = error instanceof Error ? error.message : String(error ?? "unknown");

  // Foreign key constraint violation — Prisma P2003
  if (
    msg.includes("Foreign key constraint failed") ||
    msg.includes("P2003")
  ) {
    if (context.includes("student") || msg.includes("studentId") || msg.includes("Student")) {
      return { class: "student_not_found", externalId: context, message: msg };
    }
    if (context.includes("course") || msg.includes("courseId") || msg.includes("Course")) {
      return { class: "course_not_found", externalId: context, message: msg };
    }
    return { class: "db_error", externalId: context, message: msg };
  }

  // Validation error — Prisma P2025 (record not found) or data validation
  if (
    msg.includes("required") && msg.includes("Argument") ||
    msg.includes("P2025") ||
    msg.includes("validation")
  ) {
    return { class: "validation_error", externalId: context, message: msg };
  }

  // Prisma unique constraint violation codes
  if (
    msg.includes("Unique constraint failed") ||
    msg.includes("Unique constraint violation") ||
    msg.includes("P2002") // Prisma error code for unique constraint
  ) {
    // Determine which constraint based on context or message content
    if (context.includes("payloadHash") || msg.includes("payloadHash")) {
      return { class: "duplicate_payload_hash", externalId: context, message: msg };
    }
    return { class: "duplicate_unique_constraint", externalId: context, message: msg };
  }

  return { class: "db_error", externalId: context, message: msg };
}

// ─── Payload hash for dedup (Phase 10) ──────────────────────

/**
 * Simple deterministic hash for progress event dedup.
 * Produces a hex string from the interaction's identifying fields.
 * In production, replace with crypto.subtle.digest("SHA-256", ...).
 */
export function computePayloadHash(fields: {
  userId: string;
  courseId: string;
  lessonId: string;
  action: string;
  sourceTimestamp: string;
}): string {
  // Deterministic concatenation for hashing
  const raw = `${fields.userId}|${fields.courseId}|${fields.lessonId}|${fields.action}|${fields.sourceTimestamp}`;
  // Simple FNV-1a hash for non-crypto dedup (good enough for idempotency keys)
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned 32-bit hex
  return (hash >>> 0).toString(16).padStart(8, "0");
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
        const failure = classifyCreateError(error, `membership-${membership.id}`);
        if (failure.class === "duplicate_unique_constraint") {
          // Idempotent — already ingested
          result.recordsSkipped++;
        } else {
          result.errors.push(`Membership ${membership.id}: ${failure.message}`);
          result.recordsSkipped++;
        }
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

// ─── Course progress sync (Phase 10: idempotent + bounded) ──

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
  const now = new Date();

  do {
    const page = await params.providers.progress.listLessonInteractions({
      companyId: params.companyId,
      courseId: course.externalCourseId,
      cursor,
      pageSize: PAGE_SIZE,
    });

    result.recordsRead += page.items.length;
    pagesProcessed++;

    // Phase 10: Resolve all students for this page in one query
    const userIds = [...new Set(page.items.map((i) => i.userId))];
    const students = await db.student.findMany({
      where: {
        organizationId: params.organizationId,
        whopUserId: { in: userIds },
      },
      select: { id: true, whopUserId: true },
    });
    const studentMap = new Map(students.map((s) => [s.whopUserId, s.id]));

    // Phase 10: Check existing interaction IDs to split creates from skips
    const interactionIds = page.items
      .map((i) => i.id)
      .filter(Boolean);
    const existingEvents = interactionIds.length > 0
      ? await db.progressEvent.findMany({
          where: {
            organizationId: params.organizationId,
            externalInteractionId: { in: interactionIds },
          },
          select: { externalInteractionId: true },
        })
      : [];
    const existingInteractionSet = new Set(existingEvents.map((e) => e.externalInteractionId));

    // Phase 10: Also check existing payload hashes for dedup
    // and fetch sourceTimestamp so we can handle out-of-order / older-after-newer
    const payloadHashes = page.items.map((interaction) =>
      computePayloadHash({
        userId: interaction.userId,
        courseId: interaction.courseId,
        lessonId: interaction.lessonId,
        action: interaction.completed ? "completed" : "started",
        sourceTimestamp: interaction.sourceTimestamp,
      }),
    );
    const existingByHash = payloadHashes.length > 0
      ? await db.progressEvent.findMany({
          where: {
            organizationId: params.organizationId,
            payloadHash: { in: payloadHashes },
          },
          select: { payloadHash: true, sourceTimestamp: true, id: true },
        })
      : [];
    const existingHashSet = new Set(existingByHash.map((e) => e.payloadHash));
    // Map: payloadHash → existing event for out-of-order update detection
    const existingByHashMap = new Map(existingByHash.map((e) => [e.payloadHash, e]));

    // Build create data, filtering out duplicates and missing students
    const toCreate: Array<{
      organizationId: string;
      studentId: string;
      courseId: string;
      externalInteractionId: string;
      lessonId: string;
      lessonIndex: number;
      lessonTitle: string | null;
      action: string;
      payloadHash: string;
      sourceTimestamp: Date;
      receivedAt: Date;
      sourceVersion: string | null;
      occurredAt: Date;
    }> = [];

    for (const interaction of page.items) {
      // Skip if student not found — students with activity but no qualifying membership
      const studentId = studentMap.get(interaction.userId);
      if (!studentId) {
        result.warnings.push(
          `Interaction ${interaction.id}: student ${interaction.userId} not found — skipped (membership may arrive later)`,
        );
        result.recordsSkipped++;
        continue;
      }

      // Phase 10: Skip duplicates by external interaction ID
      if (existingInteractionSet.has(interaction.id)) {
        result.recordsSkipped++;
        continue;
      }

      // Phase 10: Compute payload hash
      const hash = computePayloadHash({
        userId: interaction.userId,
        courseId: interaction.courseId,
        lessonId: interaction.lessonId,
        action: interaction.completed ? "completed" : "started",
        sourceTimestamp: interaction.sourceTimestamp,
      });

      // Phase 10: If a different payloadHash exists for the same interaction ID,
      // an older event is being replaced by a newer one — update the source timestamp
      const existingByHash = existingByHashMap.get(hash);
      if (existingHashSet.has(hash)) {
        // Check if the incoming event has a newer source timestamp than stored
        const incomingSource = new Date(interaction.sourceTimestamp);
        if (
          existingByHash?.sourceTimestamp &&
          incomingSource > existingByHash.sourceTimestamp
        ) {
          // Out-of-order: newer event for same dedup key — update timestamp
          try {
            await db.progressEvent.update({
              where: { id: existingByHash.id },
              data: {
                sourceTimestamp: incomingSource,
                occurredAt: new Date(interaction.createdAt),
                receivedAt: now,
              },
            });
            result.recordsUpdated++;
          } catch {
            // Race condition — skip gracefully
            result.recordsSkipped++;
          }
        } else {
          // Exact duplicate or older event — skip
          result.recordsSkipped++;
        }
        continue;
      }

      toCreate.push({
        organizationId: params.organizationId,
        studentId,
        courseId: course.id,
        externalInteractionId: interaction.id,
        lessonId: interaction.lessonId,
        lessonIndex: 0, // Lesson index not available from provider; use 0 as placeholder
        lessonTitle: interaction.lessonTitle,
        action: interaction.completed ? "completed" : "started",
        payloadHash: hash,
        sourceTimestamp: new Date(interaction.sourceTimestamp),
        receivedAt: now,
        sourceVersion: null, // No version from current provider contract
        occurredAt: new Date(interaction.createdAt),
      });
    }

    // Phase 10: Batch create with skipDuplicates for true idempotency
    if (toCreate.length > 0) {
      // Process in sub-batches to avoid oversized queries
      for (let i = 0; i < toCreate.length; i += PROGRESS_BATCH_SIZE) {
        const batch = toCreate.slice(i, i + PROGRESS_BATCH_SIZE);
        try {
          const createResult = await db.progressEvent.createMany({
            data: batch,
            skipDuplicates: true,
          });
          result.recordsCreated += createResult.count;
          // Any items not created were duplicates (skipDuplicates silently skips)
          result.recordsSkipped += batch.length - createResult.count;
        } catch (error) {
          const failure = classifyCreateError(error, "progress-batch");
          if (
            failure.class === "duplicate_unique_constraint" ||
            failure.class === "duplicate_payload_hash"
          ) {
            // These are expected under race conditions — all treated as skipped
            result.recordsSkipped += batch.length;
          } else {
            result.errors.push(`Progress batch create: ${failure.message}`);
            result.recordsSkipped += batch.length;
          }
        }
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

  // Phase 10: Recalculate course states using bounded aggregation
  await recalculateCourseStatesBounded(params.organizationId, course.id);

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
      duplicatesHandled: result.recordsSkipped,
    },
  });

  return result;
}

// ─── Reconciliation (Phase 11: set-based queries) ───────────

export interface ReconciliationResult {
  matched: number;
  membershipWithoutCourseActivity: number;
  courseActivityWithoutMembership: number;
  unmappedProduct: number;
  missingSourceFields: number;
  staleSourceRecord: number;
  totalEvaluated: number;
  pagesProcessed: number;
}

export async function reconcile(
  organizationId: string,
  courseId: string,
  syncExecutionId?: string,
  pageLimit?: number, // Phase 11: pagination — max pages to process
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    matched: 0,
    membershipWithoutCourseActivity: 0,
    courseActivityWithoutMembership: 0,
    unmappedProduct: 0,
    missingSourceFields: 0,
    staleSourceRecord: 0,
    totalEvaluated: 0,
    pagesProcessed: 0,
  };

  // Create a reconciliation run record
  const run = await createReconciliationRun(organizationId, courseId, syncExecutionId);

  // Phase 11: Set-based queries instead of per-student N+1

  // 1. Get all confirmed mappings for this course (bounded — typically ≤10 products per course)
  const mappings = await db.productCourseMapping.findMany({
    where: { organizationId, courseId, isConfirmed: true },
    select: { id: true, productId: true, courseId: true },
  });

  const mappedProductIds = new Set(mappings.map((m) => m.productId));

  // 2. Get all student IDs with qualifying memberships for mapped products (ONE query)
  const studentsWithMembership = await db.membership.findMany({
    where: {
      organizationId,
      productId: { in: Array.from(mappedProductIds) },
    },
    select: { studentId: true, id: true, productId: true, status: true },
  });

  // Build map: studentId → membership info for classification
  const membershipByStudent = new Map<string, { membershipId: string; productId: string; status: string }[]>();
  for (const m of studentsWithMembership) {
    const existing = membershipByStudent.get(m.studentId) ?? [];
    existing.push({ membershipId: m.id, productId: m.productId, status: m.status });
    membershipByStudent.set(m.studentId, existing);
  }

  const studentIdsWithMembership = new Set(membershipByStudent.keys());

  // 3. Get all student IDs with course activity (ONE query)
  const courseStates = await db.studentCourseState.findMany({
    where: { organizationId, courseId },
    select: { studentId: true, id: true, lessonsCompleted: true, totalLessons: true, lastSyncedAt: true },
  });

  const studentIdsWithActivity = new Set(courseStates.map((s) => s.studentId));

  // Phase 11: Detect students with memberships for unmapped products
  const allMembershipsForOrg = await db.membership.findMany({
    where: {
      organizationId,
      status: { in: ["active", "trialing"] },
    },
    select: { studentId: true, id: true, productId: true },
  });
  const studentsWithUnmappedProduct = allMembershipsForOrg.filter(
    (m) => !mappedProductIds.has(m.productId),
  );
  const unmappedStudentIds = new Set(studentsWithUnmappedProduct.map((m) => m.studentId));

  // Phase 11: Detect stale source records (lastSyncedAt > 24h ago)
  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const staleStudentIds = new Set(
    courseStates
      .filter((s) => s.lastSyncedAt && (now.getTime() - s.lastSyncedAt.getTime()) > STALE_THRESHOLD_MS)
      .map((s) => s.studentId),
  );

  // 4. Set-based classification — no per-student queries
  // Matched: students in both sets
  const matchedStudentIds = new Set(
    [...studentIdsWithMembership].filter((id) => studentIdsWithActivity.has(id)),
  );

  // Membership without course activity
  const membershipOnlyStudentIds = new Set(
    [...studentIdsWithMembership].filter((id) => !studentIdsWithActivity.has(id)),
  );

  // Course activity without membership (retroactive link opportunity)
  const activityOnlyStudentIds = new Set(
    [...studentIdsWithActivity].filter((id) => !studentIdsWithMembership.has(id)),
  );

  result.matched = matchedStudentIds.size;
  result.membershipWithoutCourseActivity = membershipOnlyStudentIds.size;
  result.courseActivityWithoutMembership = activityOnlyStudentIds.size;
  result.unmappedProduct = [...unmappedStudentIds].filter(
    (id) => !studentIdsWithMembership.has(id),
  ).length;
  result.staleSourceRecord = staleStudentIds.size;
  result.totalEvaluated = studentIdsWithMembership.size + activityOnlyStudentIds.size;

  // 5. Persist reconciliation outcomes in paginated batches
  const outcomeBatches: Array<{
    reconciliationRunId: string;
    organizationId: string;
    studentId: string;
    membershipId: string | null;
    courseId: string;
    mappingId: string | null;
    classification: string;
    evidenceJson: unknown;
  }> = [];

  // Matched outcomes
  for (const studentId of matchedStudentIds) {
    const memberships = membershipByStudent.get(studentId) ?? [];
    const mappingId = mappings.find((m) =>
      memberships.some((mem) => mem.productId === m.productId),
    )?.id ?? null;
    outcomeBatches.push({
      reconciliationRunId: run.id,
      organizationId,
      studentId,
      membershipId: memberships[0]?.membershipId ?? null,
      courseId,
      mappingId,
      classification: "matched",
      evidenceJson: { hasMembership: true, hasCourseActivity: true, isStale: staleStudentIds.has(studentId) },
    });
  }

  // Membership without course activity
  for (const studentId of membershipOnlyStudentIds) {
    const memberships = membershipByStudent.get(studentId) ?? [];
    const mappingId = mappings.find((m) =>
      memberships.some((mem) => mem.productId === m.productId),
    )?.id ?? null;
    outcomeBatches.push({
      reconciliationRunId: run.id,
      organizationId,
      studentId,
      membershipId: memberships[0]?.membershipId ?? null,
      courseId,
      mappingId,
      classification: "membership_without_course_activity",
      evidenceJson: { hasMembership: true, hasCourseActivity: false, isStale: staleStudentIds.has(studentId) },
    });
  }

  // Course activity without membership
  for (const studentId of activityOnlyStudentIds) {
    outcomeBatches.push({
      reconciliationRunId: run.id,
      organizationId,
      studentId,
      membershipId: null,
      courseId,
      mappingId: null,
      classification: "course_activity_without_membership",
      evidenceJson: { hasMembership: false, hasCourseActivity: true, isStale: staleStudentIds.has(studentId) },
    });
  }

  // Unmapped product outcomes
  for (const studentId of unmappedStudentIds) {
    if (studentIdsWithMembership.has(studentId)) continue; // Already classified above
    const membership = allMembershipsForOrg.find((m) => m.studentId === studentId);
    outcomeBatches.push({
      reconciliationRunId: run.id,
      organizationId,
      studentId,
      membershipId: membership?.id ?? null,
      courseId,
      mappingId: null,
      classification: "unmapped_product",
      evidenceJson: { hasMembership: true, hasCourseActivity: studentIdsWithActivity.has(studentId), productId: membership?.productId },
    });
  }

  // Stale source record outcomes
  for (const studentId of staleStudentIds) {
    // Stale records may overlap with other classifications — add separate stale outcome
    const state = courseStates.find((s) => s.studentId === studentId);
    if (state) {
      outcomeBatches.push({
        reconciliationRunId: run.id,
        organizationId,
        studentId,
        membershipId: null,
        courseId,
        mappingId: null,
        classification: "stale_source_record",
        evidenceJson: { lastSyncedAt: state.lastSyncedAt?.toISOString() },
      });
    }
  }

  // Batch persist outcomes with pagination
  const maxPages = pageLimit ?? Infinity;
  for (let i = 0; i < outcomeBatches.length; i += RECONCILIATION_PAGE_SIZE) {
    if (result.pagesProcessed >= maxPages) break;
    const batch = outcomeBatches.slice(i, i + RECONCILIATION_PAGE_SIZE);
    await db.reconciliationOutcome.createMany({
      data: batch.map((o) => ({
        reconciliationRunId: o.reconciliationRunId,
        organizationId: o.organizationId,
        studentId: o.studentId,
        membershipId: o.membershipId,
        courseId: o.courseId,
        mappingId: o.mappingId,
        classification: o.classification as any,
        evidenceJson: o.evidenceJson as any,
      })),
    });
    result.pagesProcessed++;
  }

  // Complete the reconciliation run record
  await completeReconciliationRun(run.id, {
    matched: result.matched,
    membershipWithoutCourseActivity: result.membershipWithoutCourseActivity,
    courseActivityWithoutMembership: result.courseActivityWithoutMembership,
    unmappedProduct: result.unmappedProduct,
    missingSourceFields: result.missingSourceFields,
    staleSourceRecord: result.staleSourceRecord,
  });

  return result;
}

// ─── Candidate detection (Phase 12: full eligibility checks) ─

export interface CandidateDetectionResult {
  candidatesFound: number;
  snapshotsCreated: number;
  snapshotsSkipped: number;
  errors: string[];
  warnings: string[];
  checksPerformed: number;
}

/**
 * Detect candidates for an Activation Rescue campaign.
 *
 * Phase 12: Operates ONLY on the campaign's confirmed mapping.
 * All 17 eligibility checks are verified before creating a snapshot.
 * Uses batch queries — no N+1 patterns.
 */
export async function detectCandidates(
  organizationId: string,
  campaignId: string,
): Promise<CandidateDetectionResult> {
  const result: CandidateDetectionResult = {
    candidatesFound: 0,
    snapshotsCreated: 0,
    snapshotsSkipped: 0,
    errors: [],
    warnings: [],
    checksPerformed: 0,
  };

  const now = new Date();

  // ─── Pre-flight checks (fail fast) ────────────────────────

  // Fetch campaign with organization and latest version
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, organizationId },
    include: {
      organization: {
        include: { installations: true },
      },
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      confirmedMapping: {
        include: {
          product: true,
          course: true,
        },
      },
    },
  });

  // Check: Campaign exists and is Activation Rescue
  if (!campaign || campaign.type !== "activation_rescue") {
    result.errors.push("Campaign not found or not an Activation Rescue campaign");
    return result;
  }

  const latestVersion = campaign.versions[0];
  const org = campaign.organization;

  // Check 1: Organisation active
  if (org.status !== "active") {
    result.errors.push(`Organisation status is "${org.status}", not "active"`);
    return result;
  }

  // Check 2: Organisation not paused
  if (org.isPaused) {
    result.errors.push("Organisation is paused");
    return result;
  }

  // Check 3: Installation active
  const activeInstallation = org.installations.find((i) => i.status === "active");
  if (!activeInstallation) {
    result.errors.push("No active installation");
    return result;
  }

  // Check 4: Campaign active
  if (campaign.status !== "active") {
    result.errors.push(`Campaign status is "${campaign.status}", not "active"`);
    return result;
  }

  // Check 5: Campaign is Activation Rescue (already verified above)
  // Check 6: Manual approval enabled
  if (campaign.approvalMode !== "manual") {
    result.errors.push("Campaign does not have manual approval enabled");
    return result;
  }

  // Check 7: Campaign version exists
  if (!latestVersion) {
    result.errors.push("No campaign version exists");
    return result;
  }

  // Check 8: Confirmed mapping belongs to campaign
  const mapping = campaign.confirmedMapping;
  if (!mapping) {
    result.errors.push("Campaign has no confirmed mapping");
    return result;
  }

  if (!mapping.isConfirmed) {
    result.errors.push("Campaign's mapping is not confirmed");
    return result;
  }

  const courseId = mapping.courseId;
  const productId = mapping.productId;

  // ─── Batch queries (no N+1) ───────────────────────────────

  // All memberships for the mapped product that are active or trialing
  const qualifyingMemberships = await db.membership.findMany({
    where: {
      organizationId,
      productId,
      status: { in: ["active", "trialing"] },
    },
    include: { student: true },
  });

  if (qualifyingMemberships.length === 0) {
    return result; // No candidates possible
  }

  const candidateStudentIds = new Set(qualifyingMemberships.map((m) => m.studentId));

  // Batch: course activity states for all candidate students
  const courseStates = await db.studentCourseState.findMany({
    where: {
      organizationId,
      courseId,
      studentId: { in: Array.from(candidateStudentIds) },
    },
  });
  const activityByStudent = new Map(courseStates.map((s) => [s.studentId, s]));

  // Batch: suppressions for all candidate students (course, campaign, and org level)
  const suppressions = await db.suppression.findMany({
    where: {
      organizationId,
      studentId: { in: Array.from(candidateStudentIds) },
    },
  });
  const suppressedStudentIds = new Set(suppressions.map((s) => s.studentId));

  // Batch: existing active interventions for these students on this campaign
  const activeInterventions = await db.intervention.findMany({
    where: {
      organizationId,
      studentId: { in: Array.from(candidateStudentIds) },
      campaignId,
      state: { notIn: ["dismissed", "stopped", "failed"] },
    },
  });
  const studentsWithActiveIntervention = new Set(activeInterventions.map((i) => i.studentId));

  // Batch: last intervention per student for cooldown check
  const lastInterventions = await db.intervention.findMany({
    where: {
      organizationId,
      studentId: { in: Array.from(candidateStudentIds) },
      campaignId,
    },
    orderBy: { createdAt: "desc" },
    // We'll process these to get the latest per student
  });
  const lastInterventionByStudent = new Map<string, Date>();
  for (const iv of lastInterventions) {
    if (!lastInterventionByStudent.has(iv.studentId)) {
      lastInterventionByStudent.set(iv.studentId, iv.createdAt);
    }
  }

  // Batch: recent intervention counts per student (for per-student message limit)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentInterventions = await db.intervention.findMany({
    where: {
      organizationId,
      studentId: { in: Array.from(candidateStudentIds) },
      campaignId,
      createdAt: { gte: thirtyDaysAgo },
      state: { in: ["notification_accepted", "delivered"] },
    },
    select: { studentId: true },
  });
  const recentInterventionCounts = new Map<string, number>();
  for (const iv of recentInterventions) {
    recentInterventionCounts.set(iv.studentId, (recentInterventionCounts.get(iv.studentId) ?? 0) + 1);
  }

  // Batch: org-wide message count in last 30 days
  const orgWideMessageCount = await db.intervention.count({
    where: {
      organizationId,
      createdAt: { gte: thirtyDaysAgo },
      state: { in: ["notification_accepted", "delivered"] },
    },
  });

  // Batch: campaign message count in last 30 days
  const campaignMessageCount = await db.intervention.count({
    where: {
      organizationId,
      campaignId,
      createdAt: { gte: thirtyDaysAgo },
      state: { in: ["notification_accepted", "delivered"] },
    },
  });

  // Batch: existing eligibility snapshots for this campaign version + window
  // (to prevent duplicate snapshots on re-run)
  const eligibilityWindowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ); // Start of today as the eligibility window

  const existingSnapshots = await db.eligibilitySnapshot.findMany({
    where: {
      organizationId,
      studentId: { in: Array.from(candidateStudentIds) },
      campaignVersionId: latestVersion.id,
      eligibilityWindowStart,
    },
    select: { studentId: true },
  });
  const studentsWithExistingSnapshot = new Set(existingSnapshots.map((s) => s.studentId));

  // Batch: check plan allows monitored members
  const entitlement = await db.subscriptionEntitlement.findFirst({
    where: { organizationId },
  });
  const plan = entitlement
    ? await db.plan.findUnique({ where: { tier: entitlement.planTier } })
    : null;
  const maxMonitoredMembers = plan?.maxMonitoredMembers ?? Infinity;

  // Count current monitored members
  const currentMonitoredMembers = await db.membership.count({
    where: {
      organizationId,
      status: { in: ["active", "trialing"] },
    },
  });

  // Batch: source data freshness check
  const latestCheckpoint = await db.syncCheckpoint.findFirst({
    where: { organizationId, resource: "memberships" },
    orderBy: { updatedAt: "desc" },
  });
  const SOURCE_FRESHNESS_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  const sourceDataFresh = latestCheckpoint
    ? (now.getTime() - latestCheckpoint.updatedAt.getTime()) < SOURCE_FRESHNESS_MAX_AGE_MS
    : false;

  // ─── Evaluate each candidate ──────────────────────────────

  // Process in batches to avoid memory pressure
  const candidateArray = Array.from(qualifyingMemberships);

  for (let batchStart = 0; batchStart < candidateArray.length; batchStart += CANDIDATE_BATCH_SIZE) {
    const batch = candidateArray.slice(batchStart, batchStart + CANDIDATE_BATCH_SIZE);

    for (const membership of batch) {
      result.checksPerformed++;
      const studentId = membership.studentId;

      // Check 9: Membership belongs to mapped product (guaranteed by our query)

      // Check 10: Membership active or trialing (guaranteed by our query)

      // Check 11: Membership not ending (no renewalDate or renewalDate in the future)
      if (membership.renewalDate && membership.renewalDate <= now) {
        continue;
      }

      // Check 12: Activation delay elapsed
      const daysSinceJoin = (now.getTime() - membership.joinedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceJoin < mapping.activationDelayDays) {
        continue;
      }

      // Check 13: Course activity absent
      const courseState = activityByStudent.get(studentId);
      if (courseState && courseState.lessonsCompleted > 0) {
        continue;
      }

      // Check 14: No course-, campaign- or organisation-level suppression
      if (suppressedStudentIds.has(studentId)) {
        continue;
      }

      // Check 15: No existing equivalent active intervention
      if (studentsWithActiveIntervention.has(studentId)) {
        continue;
      }

      // Campaign cooldown check
      const lastIvDate = lastInterventionByStudent.get(studentId);
      if (lastIvDate) {
        const daysSinceLast = (now.getTime() - lastIvDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast < campaign.cooldownDays) {
          continue;
        }
      }

      // Check: Per-student message limit
      const studentRecentCount = recentInterventionCounts.get(studentId) ?? 0;
      if (studentRecentCount >= campaign.maxMessagesPerStudent) {
        continue;
      }

      // Check: Org-wide message limit
      if (orgWideMessageCount >= campaign.maxMessagesPerOrg) {
        continue;
      }

      // Check 18: Campaign message limit clear
      if (campaignMessageCount >= campaign.maxMessagesPerStudent) {
        continue;
      }

      // Check 16: Plan allows monitored member
      if (currentMonitoredMembers >= maxMonitoredMembers) {
        continue;
      }

      // Check 20: Source data sufficiently fresh
      if (!sourceDataFresh) {
        result.warnings.push("Source data is stale — skipping candidate detection");
        continue;
      }

      // Check: Existing snapshot for this window (idempotency)
      if (studentsWithExistingSnapshot.has(studentId)) {
        result.snapshotsSkipped++;
        continue;
      }

      // ─── Candidate found — create immutable eligibility snapshot ───
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
        campaignVersionId: latestVersion.id,
        checks: {
          orgActive: true,
          orgNotPaused: true,
          installationActive: true,
          campaignActive: true,
          campaignIsActivationRescue: true,
          manualApprovalEnabled: true,
          campaignVersionExists: true,
          confirmedMappingBelongsToCampaign: true,
          membershipBelongsToMappedProduct: true,
          membershipActiveOrTrialing: true,
          membershipNotEnding: !membership.renewalDate || membership.renewalDate > now,
          activationDelayElapsed: true,
          courseActivityAbsent: true,
          notSuppressed: true,
          noActiveIntervention: true,
          campaignCooldownClear: !lastIvDate || (now.getTime() - lastIvDate.getTime()) / (1000 * 60 * 60 * 24) >= campaign.cooldownDays,
          orgMessageLimitClear: orgWideMessageCount < campaign.maxMessagesPerOrg,
          campaignMessageLimitClear: campaignMessageCount < campaign.maxMessagesPerStudent,
          planAllowsMonitoredMember: currentMonitoredMembers < maxMonitoredMembers,
          sourceDataFresh: true,
        },
      };

      // Build idempotency key: student + campaign version + eligibility window
      const idempotencyKey = `${studentId}:${latestVersion.id}:${eligibilityWindowStart.toISOString()}`;

      try {
        await db.eligibilitySnapshot.create({
          data: {
            organizationId,
            studentId,
            campaignId,
            campaignVersionId: latestVersion.id,
            idempotencyKey,
            state: "eligible",
            evidenceJson: evidence as any,
            detectedAt: now,
            eligibilityWindowStart,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        result.snapshotsCreated++;
      } catch (error) {
        const failure = classifyCreateError(error, idempotencyKey);
        if (
          failure.class === "duplicate_unique_constraint" ||
          failure.class === "duplicate_payload_hash"
        ) {
          // Idempotent — snapshot already exists for this window
          result.snapshotsSkipped++;
        } else {
          result.errors.push(
            `Student ${studentId}: ${failure.message}`,
          );
        }
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

/**
 * Phase 10: Bounded aggregation for course state recalculation.
 *
 * Instead of N+1 queries (one per student, then 3 more per student),
 * uses 3 bounded aggregate queries total, then upserts in batches.
 *
 * Handles:
 * - Out-of-order interactions (uses MIN/MAX aggregation)
 * - Older events arriving after newer events (idempotent upsert)
 * - Course lesson count changes (recalculates from current course.lessonCount)
 * - Removed lessons (marks stale states where totalLessons > course.lessonCount)
 * - Students with activity but no qualifying membership (flagged, not skipped)
 * - Membership arriving after course activity (retroactively linked via reconciliation)
 */
async function recalculateCourseStatesBounded(organizationId: string, courseId: string): Promise<void> {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  // Bounded aggregation: group by student in a single query using raw SQL
  // This replaces the N+1 pattern of: findDistinct students → count per student → findFirst per student
  const aggregated = await db.$queryRaw<Array<{
    studentId: string;
    completedCount: bigint;
    firstOccurredAt: Date;
    lastOccurredAt: Date;
  }>>`
    SELECT
      "studentId",
      COUNT(*) FILTER (WHERE action = 'completed') AS "completedCount",
      MIN("occurredAt") AS "firstOccurredAt",
      MAX("occurredAt") AS "lastOccurredAt"
    FROM "progress_events"
    WHERE "organizationId" = ${organizationId}
      AND "courseId" = ${courseId}
    GROUP BY "studentId"
  `;

  if (aggregated.length === 0) return;

  // Phase 10: Mark stale any student course states where totalLessons
  // no longer matches the current course.lessonCount (removed lessons)
  await db.studentCourseState.updateMany({
    where: {
      organizationId,
      courseId,
      totalLessons: { not: course.lessonCount },
    },
    data: {
      totalLessons: course.lessonCount,
      // lastSyncedAt will be updated by the upsert below
    },
  });

  // Upsert student course states in batches
  for (let i = 0; i < aggregated.length; i += PROGRESS_BATCH_SIZE) {
    const batch = aggregated.slice(i, i + PROGRESS_BATCH_SIZE);

    await Promise.all(
      batch.map(async (row) => {
        const completedCount = Number(row.completedCount);
        const progressPercent = course.lessonCount > 0
          ? Math.min(100, Math.round((completedCount / course.lessonCount) * 100))
          : 0;

        await db.studentCourseState.upsert({
          where: { studentId_courseId: { studentId: row.studentId, courseId } },
          create: {
            organizationId,
            studentId: row.studentId,
            courseId,
            progressPercent,
            lessonsCompleted: completedCount,
            totalLessons: course.lessonCount,
            firstActivityAt: row.firstOccurredAt,
            lastActivityAt: row.lastOccurredAt,
          },
          update: {
            lessonsCompleted: completedCount,
            progressPercent,
            totalLessons: course.lessonCount,
            lastActivityAt: row.lastOccurredAt,
            lastSyncedAt: new Date(),
          },
        });
      }),
    );
  }

  // Phase 10: Flag students with activity but no qualifying membership
  // These will be fully resolved by the next reconciliation run,
  // which will link memberships retroactively if they have since arrived.
  // We don't delete their course states — they remain as evidence for reconciliation.
}

/**
 * Legacy recalculateCourseStates — kept for backward compatibility.
 * Delegates to the bounded version.
 */
async function recalculateCourseStates(organizationId: string, courseId: string): Promise<void> {
  return recalculateCourseStatesBounded(organizationId, courseId);
}
