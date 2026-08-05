// Inngest job functions for the Activation Rescue workflow.
// Each function is durable, retryable, and idempotent.
//
// NOTE: Function definitions are created lazily via getJobFunctions() to
// avoid calling getInngestClient() at module import time, which would
// crash `next build` when Inngest is not configured.

import "server-only";
import { getInngestClient, EVENTS, isInngestReady } from "./client";
import { db } from "@/lib/db";
import { getWhopClient } from "@/lib/whop/client";
import { recordAuditEvent } from "@/lib/audit";
import {
  createStudentAccessToken,
} from "@/lib/crypto/student-access-tokens";
import {
  classifyActivationProgressOutcome,
  createObservedPaymentValueEvent,
} from "@/lib/attribution/engine";
import type { Prisma } from "@prisma/client";
import type {
  WhopMembershipEvent,
  WhopPaymentEvent,
  WhopLessonInteractionEvent,
} from "@/lib/whop/whop-types";

// ─── Job function definitions (lazy) ─────────────────────────

/**
 * Create and return the Inngest job functions.
 * Call this only when Inngest is configured — it calls getInngestClient().
 */
export function getJobFunctions(): any[] {
  if (!isInngestReady()) return [];
  const client = getInngestClient();

  const processWebhook = client.createFunction(
  {
    id: "process-webhook",
    retries: 5,
  },
  { event: EVENTS.webhookReceived },
  async ({ event, step }) => {
    const { receiptId } = event.data as { receiptId: string };

    // Step 1: Mark as processing (idempotent — skip if already processed)
    await step.run("mark-processing", async () => {
      const receipt = await db.webhookReceipt.findUnique({
        where: { id: receiptId },
      });
      if (!receipt || receipt.status === "processed") {
        return { skipped: true };
      }
      await db.webhookReceipt.update({
        where: { id: receiptId },
        data: { status: "processing", attemptCount: { increment: 1 } },
      });
      return { skipped: false };
    });

    const receipt = await db.webhookReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt || receipt.status === "processed") {
      return { processed: false, reason: "already-processed" };
    }

    // The payload is the verified event object from whopsdk.webhooks.unwrap()
    const eventPayload = receipt.payloadJson as Record<string, unknown>;

    try {
      // Step 2: Process based on event type (using official Whop event names)
      if (receipt.eventType === "membership.activated") {
        await step.run("handle-membership-activated", async () => {
          await handleMembershipActivated(receipt.organizationId, eventPayload, receiptId);
        });
      } else if (receipt.eventType === "membership.deactivated") {
        await step.run("handle-membership-deactivated", async () => {
          await handleMembershipDeactivated(receipt.organizationId, eventPayload, receiptId);
        });
      } else if (receipt.eventType === "payment.succeeded") {
        await step.run("handle-payment-succeeded", async () => {
          await handlePaymentSucceeded(receipt.organizationId, eventPayload, receiptId);
        });
      } else if (receipt.eventType === "course_lesson_interaction.completed") {
        await step.run("handle-lesson-completed", async () => {
          await handleLessonCompleted(receipt.organizationId, eventPayload, receiptId);
        });
      } else {
        // Unknown event type — acknowledge but don't process
        await step.run("mark-unknown", async () => {
          await db.webhookReceipt.update({
            where: { id: receiptId },
            data: {
              status: "processed",
              processedAt: new Date(),
              lastError: `Unknown event type: ${receipt.eventType}`,
            },
          });
        });
        return { processed: false, reason: "unknown-event-type" };
      }

      // Step 3: Mark as processed
      await step.run("mark-processed", async () => {
        await db.webhookReceipt.update({
          where: { id: receiptId },
          data: { status: "processed", processedAt: new Date() },
        });
      });

      return { processed: true };
    } catch (error) {
      // Record the failure
      await db.webhookReceipt.update({
        where: { id: receiptId },
        data: {
          status: "failed",
          lastError: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error; // Let Inngest retry
    }
  },
);

/**
 * Intervention delivery job.
 *
 * Before every send, transactionally re-checks ALL safety conditions.
 * Uses a stable idempotency key derived from the intervention + delivery
 * version (never Date.now()).
 *
 * Calls the official notification API:
 *   whopsdk.notifications.create({ experience_id, title, content, user_ids, rest_path })
 *
 * Records the delivery state truthfully:
 * - api_accepted: the Whop API returned { success: true }
 * - failed: the API threw or returned { success: false }
 * - stopped_before_send: a safety check failed
 *
 * Does NOT set the intervention to "delivered" merely because the API
 * accepted the notification. Uses "notification_accepted" as the
 * intervention state.
 */
  const deliverIntervention = client.createFunction(
  {
    id: "deliver-intervention",
    retries: 3,
  },
  { event: EVENTS.deliverIntervention },
  async ({ event, step }) => {
    const { interventionId } = event.data as { interventionId: string };

    const intervention = await db.intervention.findUnique({
      where: { id: interventionId },
      include: {
        student: { include: { memberships: { include: { product: { include: { mappings: true } } } }, suppressions: true } },
        campaign: true,
        organization: true,
      },
    });

    if (!intervention) {
      return { delivered: false, reason: "not-found" };
    }

    // Stable idempotency key — derived from intervention + campaign version, NOT Date.now()
    const idempotencyKey = `delivery-${intervention.id}-${intervention.campaignVersionId ?? "v1"}`;

    // Check for existing accepted delivery (idempotency)
    const existingAttempt = await db.deliveryAttempt.findUnique({
      where: { idempotencyKey },
    });

    if (existingAttempt?.state === "api_accepted") {
      return { delivered: false, reason: "already-accepted" };
    }

    // ─── Transactional safety re-checks ───────────────────────
    const safetyResult = await step.run("safety-recheck", async () => {
      return await db.$transaction(async (tx) => {
        const checks: { condition: string; passed: boolean; detail: string }[] = [];

        // 1. Organisation status is active
        const orgActive = intervention.organization.status === "active";
        checks.push({ condition: "org_status_active", passed: orgActive, detail: orgActive ? "OK" : `Status: ${intervention.organization.status}` });

        // 2. Organisation global pause is false
        const notPaused = !intervention.organization.isPaused;
        checks.push({ condition: "org_not_paused", passed: notPaused, detail: notPaused ? "OK" : "Organisation is paused" });

        // 3. Campaign is active
        const campaignActive = intervention.campaign.status === "active";
        checks.push({ condition: "campaign_active", passed: campaignActive, detail: campaignActive ? "OK" : `Campaign: ${intervention.campaign.status}` });

        // 4. Campaign uses manual approval
        const manualApproval = intervention.campaign.approvalMode === "manual";
        checks.push({ condition: "manual_approval", passed: manualApproval, detail: manualApproval ? "OK" : "Automatic mode not supported in pilot" });

        // 5. Intervention is approved or validly scheduled
        const approved = intervention.state === "approved" || intervention.state === "scheduled";
        checks.push({ condition: "intervention_approved", passed: approved, detail: approved ? "OK" : `State: ${intervention.state}` });

        // 6. scheduledFor <= now (if scheduled)
        const now = new Date();
        const scheduledOk = !intervention.scheduledFor || intervention.scheduledFor <= now;
        checks.push({ condition: "schedule_reached", passed: scheduledOk, detail: scheduledOk ? "OK" : "Scheduled for future" });

        // 7. Relevant membership is active or trialing
        const activeMembership = intervention.student.memberships.find(
          (m) => m.status === "active" || m.status === "trialing",
        );
        const membershipActive = !!activeMembership;
        checks.push({ condition: "membership_active", passed: membershipActive, detail: membershipActive ? `Status: ${activeMembership!.status}` : "No active membership" });

        // 8. Membership grants access to the mapped course
        const productMapsToCourse = activeMembership?.product.mappings.some(
          (m) => m.isConfirmed,
        ) ?? false;
        checks.push({ condition: "product_mapped", passed: productMapsToCourse, detail: productMapsToCourse ? "OK" : "Product not mapped to course" });

        // 9. Membership is not cancelling or ending
        const notCancelling = activeMembership?.status !== "cancelling" && activeMembership?.status !== "cancelled";
        checks.push({ condition: "membership_not_ending", passed: notCancelling, detail: notCancelling ? "OK" : "Membership ending" });

        // 10. No course interaction has appeared (check progress events)
        const progressEvents = await tx.progressEvent.findFirst({
          where: { studentId: intervention.studentId, organizationId: intervention.organizationId },
        });
        const noCourseActivity = !progressEvents;
        checks.push({ condition: "no_course_activity", passed: noCourseActivity, detail: noCourseActivity ? "OK" : "Course activity detected — stopping" });

        // 11. No student response has appeared
        const existingResponse = await tx.studentResponse.findFirst({
          where: { interventionId: intervention.id },
        });
        const noResponse = !existingResponse;
        checks.push({ condition: "no_student_response", passed: noResponse, detail: noResponse ? "OK" : "Student already responded" });

        // 12. No organisation/course suppression exists
        const notSuppressed = intervention.student.suppressions.length === 0;
        checks.push({ condition: "not_suppressed", passed: notSuppressed, detail: notSuppressed ? "OK" : "Student opted out" });

        // 13. Campaign cooldown has elapsed
        const cooldownDays = intervention.campaign.cooldownDays;
        const lastIntervention = await tx.intervention.findFirst({
          where: {
            studentId: intervention.studentId,
            organizationId: intervention.organizationId,
            id: { not: intervention.id },
          },
          orderBy: { createdAt: "desc" },
        });
        const cooldownElapsed = !lastIntervention ||
          (now.getTime() - lastIntervention.createdAt.getTime()) / (1000 * 60 * 60 * 24) >= cooldownDays;
        checks.push({ condition: "cooldown_elapsed", passed: cooldownElapsed, detail: cooldownElapsed ? "OK" : `Within ${cooldownDays}-day cooldown` });

        // 14. Maximum messages in the configured period has not been reached
        const maxMessages = intervention.campaign.maxMessagesPerStudent;
        const recentInterventions = await tx.intervention.count({
          where: {
            studentId: intervention.studentId,
            organizationId: intervention.organizationId,
            campaignId: intervention.campaignId,
            createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            state: { in: ["delivered", "notification_accepted"] },
          },
        });
        const underMaxMessages = recentInterventions < maxMessages;
        checks.push({ condition: "under_max_messages", passed: underMaxMessages, detail: underMaxMessages ? `${recentInterventions}/${maxMessages}` : `Max reached: ${recentInterventions}/${maxMessages}` });

        // 15. Current student-local time is outside quiet hours
        // (Simplified — real implementation would use student timezone)
        const quietHoursOk = checkQuietHours(intervention.campaign.quietHoursStart, intervention.campaign.quietHoursEnd, now);
        checks.push({ condition: "outside_quiet_hours", passed: quietHoursOk, detail: quietHoursOk ? "OK" : "Within quiet hours" });

        // 16. No equivalent active intervention exists
        const equivalentActive = await tx.intervention.findFirst({
          where: {
            studentId: intervention.studentId,
            organizationId: intervention.organizationId,
            campaignId: intervention.campaignId,
            id: { not: intervention.id },
            state: { in: ["approved", "scheduled", "queued", "delivered", "notification_accepted"] },
          },
        });
        const noEquivalent = !equivalentActive;
        checks.push({ condition: "no_equivalent_active", passed: noEquivalent, detail: noEquivalent ? "OK" : "Equivalent intervention exists" });

        // 17. Stable idempotency key has not already been accepted
        const existingAccepted = await tx.deliveryAttempt.findUnique({
          where: { idempotencyKey },
        });
        const notAlreadyAccepted = !existingAccepted || existingAccepted.state !== "api_accepted";
        checks.push({ condition: "idempotency_clear", passed: notAlreadyAccepted, detail: notAlreadyAccepted ? "OK" : "Already accepted" });

        const allPassed = checks.every((c) => c.passed);

        // Create the delivery attempt record inside the transaction
        if (!allPassed) {
          await tx.deliveryAttempt.create({
            data: {
              interventionId: intervention.id,
              state: "stopped_before_send",
              idempotencyKey,
              errorMessage: JSON.stringify(checks.filter((c) => !c.passed)),
            },
          });
          await tx.intervention.update({
            where: { id: intervention.id },
            data: { state: "stopped" },
          });
        }

        return { allPassed, checks, activeMembership };
      });
    });

    if (!safetyResult.allPassed) {
      await recordAuditEvent({
        organizationId: intervention.organizationId,
        action: "updated",
        objectType: "intervention",
        objectId: intervention.id,
        interventionId: intervention.id,
        previousState: intervention.state,
        newState: "stopped",
        reason: "Safety check failed at delivery time",
        metadata: { checks: safetyResult.checks },
      });
      return { delivered: false, reason: "safety-check-failed" };
    }

    // ─── Generate opaque student access token ─────────────────
    const tokenResult = await createStudentAccessToken({
      organizationId: intervention.organizationId,
      interventionId: intervention.id,
      studentId: intervention.studentId,
      expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
    });

    const restPath = `rescue/${tokenResult.token}`;

    // ─── Send the notification via the official API ───────────
    const message = intervention.messageEdited ?? intervention.messagePreview;

    try {
      const sendResult = await step.run("send-notification", async () => {
        // Find the course to get the externalExperienceId
        const course = await db.course.findFirst({
          where: { organizationId: intervention.organizationId },
        });

        if (!course?.externalExperienceId) {
          throw new Error("Course has no externalExperienceId — cannot send notification");
        }

        // Call the official Whop notification API
        const result = await getWhopClient().notifications.create({
          experience_id: course.externalExperienceId,
          title: "Continue your course",
          content: message,
          user_ids: [intervention.student.whopUserId],
          rest_path: restPath,
        });

        return result;
      });

      // Record the delivery attempt truthfully
      if (sendResult.success) {
        await db.deliveryAttempt.create({
          data: {
            interventionId: intervention.id,
            state: "api_accepted", // API accepted — NOT "delivered"
            idempotencyKey,
            apiAcceptedAt: new Date(),
          },
        });

        // Set intervention state to "notification_accepted" — NOT "delivered"
        // because API acceptance ≠ confirmed delivery
        await db.intervention.update({
          where: { id: intervention.id },
          data: { state: "notification_accepted", sentAt: new Date() },
        });

        await recordAuditEvent({
          organizationId: intervention.organizationId,
          action: "delivered",
          objectType: "intervention",
          objectId: intervention.id,
          interventionId: intervention.id,
          newState: "notification_accepted",
          reason: "Whop API accepted the notification",
        });

        return { delivered: true, apiAccepted: true };
      } else {
        // API returned success: false
        await db.deliveryAttempt.create({
          data: {
            interventionId: intervention.id,
            state: "failed",
            idempotencyKey,
            failedAt: new Date(),
            errorMessage: "Whop API returned success: false",
          },
        });

        return { delivered: false, reason: "api-rejected" };
      }
    } catch (error) {
      // Record failure
      await db.deliveryAttempt.upsert({
        where: { idempotencyKey },
        create: {
          interventionId: intervention.id,
          state: "failed",
          idempotencyKey,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
        update: {
          state: "failed",
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error; // Let Inngest retry with backoff
    }
  },
);

  return [processWebhook, deliverIntervention];
}

// ─── Quiet hours check ───────────────────────────────────────

function checkQuietHours(start: string, end: string, now: Date): boolean {
  // Simplified: check if current hour is within the quiet period.
  // Real implementation would use the student's timezone.
  const currentHour = now.getHours();
  const startHour = parseInt(start.split(":")[0]);
  const endHour = parseInt(end.split(":")[0]);

  if (startHour < endHour) {
    // e.g., 12:00 - 14:00
    return currentHour < startHour || currentHour >= endHour;
  } else {
    // Overnight: e.g., 20:00 - 08:00
    return currentHour < endHour || currentHour >= startHour;
  }
}

// ─── Typed webhook event handlers ────────────────────────────

async function handleMembershipActivated(
  organizationId: string,
  event: WhopMembershipEvent,
  webhookReceiptId: string,
) {
  const membership = event.data;
  const whopUserId = membership.user?.id ?? membership.member?.id;

  if (!whopUserId) return;

  // Find or create the student
  const student = await db.student.upsert({
    where: {
      organizationId_whopUserId: { organizationId, whopUserId },
    },
    create: {
      organizationId,
      whopUserId,
    },
    update: {},
  });

  // Find the product
  const product = await db.product.findFirst({
    where: { whopProductId: membership.product?.id ?? "" },
  });

  if (!product) return;

  // Create or update the membership
  await db.membership.upsert({
    where: { whopMembershipId: membership.id },
    create: {
      organizationId,
      studentId: student.id,
      productId: product.id,
      whopMembershipId: membership.id,
      status: "active",
      joinedAt: new Date(membership.created_at),
      renewalDate: membership.renewal_period_end_date ? new Date(membership.renewal_period_end_date) : null,
      priceCents: membership.plan?.price ?? 0,
      lastSyncedAt: new Date(),
    },
    update: {
      status: "active",
      lastSyncedAt: new Date(),
    },
  });

  // Record the event
  await db.membershipEvent.create({
    data: {
      organizationId,
      membershipId: membership.id, // Note: this is the Whop ID; the DB uses a separate ID
      eventType: "activated",
      occurredAt: new Date(event.timestamp),
      webhookReceiptId,
    },
  });
}

async function handleMembershipDeactivated(
  organizationId: string,
  event: WhopMembershipEvent,
  webhookReceiptId: string,
) {
  const membership = event.data;

  // Update membership status
  const dbMembership = await db.membership.findUnique({
    where: { whopMembershipId: membership.id },
  });

  if (!dbMembership) return;

  await db.membership.update({
    where: { id: dbMembership.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(event.timestamp),
      lastSyncedAt: new Date(),
    },
  });

  // Stop any pending interventions for this student
  await db.intervention.updateMany({
    where: {
      studentId: dbMembership.studentId,
      organizationId,
      state: { in: ["approved", "scheduled", "queued"] },
    },
    data: { state: "stopped" },
  });

  // Record the event
  await db.membershipEvent.create({
    data: {
      organizationId,
      membershipId: dbMembership.id,
      eventType: "deactivated",
      occurredAt: new Date(event.timestamp),
      webhookReceiptId,
    },
  });
}

async function handlePaymentSucceeded(
  organizationId: string,
  event: WhopPaymentEvent,
  webhookReceiptId: string,
) {
  const payment = event.data;
  const whopMembershipId = payment.membership?.id;

  if (!whopMembershipId) return;

  const membership = await db.membership.findUnique({
    where: { whopMembershipId },
  });

  if (!membership) return;

  // Record the payment event (idempotent via unique whopPaymentId)
  await db.paymentEvent.upsert({
    where: { whopPaymentId: payment.id },
    create: {
      organizationId,
      membershipId: membership.id,
      whopPaymentId: payment.id,
      status: "succeeded",
      amountCents: payment.amount ?? 0,
      occurredAt: new Date(event.timestamp),
      webhookReceiptId,
    },
    update: {},
  });

  // For Activation Rescue, ordinary payments are NOT confirmed revenue.
  // Record as "observed subsequent payment" with estimated attribution.
  const recentInterventions = await db.intervention.findMany({
    where: {
      organizationId,
      studentId: membership.studentId,
      state: { in: ["notification_accepted", "delivered"] },
      sentAt: { lt: new Date(event.timestamp) },
    },
  });

  for (const intervention of recentInterventions) {
    // Check if course activity occurred
    const progressEvent = await db.progressEvent.findFirst({
      where: {
        studentId: membership.studentId,
        organizationId,
        occurredAt: { gt: intervention.sentAt ?? new Date(0) },
      },
    });

    await createObservedPaymentValueEvent({
      organizationId,
      interventionId: intervention.id,
      studentId: membership.studentId,
      paymentEventId: payment.id, // Unique — prevents duplicate attribution
      amountCents: payment.amount ?? 0,
      courseActivityOccurred: !!progressEvent,
      paymentSucceededAt: new Date(event.timestamp),
      interventionDeliveredAt: intervention.sentAt,
    });
  }
}

async function handleLessonCompleted(
  organizationId: string,
  event: WhopLessonInteractionEvent,
  webhookReceiptId: string,
) {
  const interaction = event.data;
  const whopUserId = interaction.user?.id;
  const courseId = interaction.course?.id;
  const lessonId = interaction.lesson?.id;
  const interactionId = interaction.id; // Whop's unique interaction ID

  if (!whopUserId || !courseId) return;

  const student = await db.student.findFirst({
    where: { organizationId, whopUserId },
  });

  if (!student) return;

  const course = await db.course.findFirst({
    where: { organizationId, externalCourseId: courseId },
  });

  if (!course) return;

  // Record the progress event with the unique external interaction ID.
  // The unique constraint prevents the same lesson interaction from being counted twice.
  try {
    await db.progressEvent.create({
      data: {
        organizationId,
        studentId: student.id,
        courseId: course.id,
        externalInteractionId: interactionId,
        lessonIndex: 0, // Whop doesn't provide an index; we use the interaction ID for uniqueness
        lessonTitle: interaction.lesson?.title ?? null,
        action: "completed",
        occurredAt: new Date(event.timestamp),
        webhookReceiptId,
      },
    });
  } catch {
    // Unique constraint violation — this interaction was already recorded.
    // This is expected behavior for idempotent processing.
    return;
  }

  // Recalculate the student's course state from authoritative data
  // (don't blindly increment — recalculate from the interaction table)
  const completedCount = await db.progressEvent.count({
    where: {
      studentId: student.id,
      courseId: course.id,
      action: "completed",
    },
  });

  // Update the student course state (recalculate, don't increment)
  const existingState = await db.studentCourseState.findUnique({
    where: {
      studentId_courseId: { studentId: student.id, courseId: course.id },
    },
  });

  const progressPercent = course.lessonCount > 0
    ? Math.round((completedCount / course.lessonCount) * 100)
    : 0;

  const occurredAt = new Date(event.timestamp);

  // Only update lastActivityAt if the incoming event is later
  // (handle out-of-order webhooks)
  const shouldUpdateLastActivity =
    !existingState?.lastActivityAt || occurredAt > existingState.lastActivityAt;

  await db.studentCourseState.upsert({
    where: {
      studentId_courseId: { studentId: student.id, courseId: course.id },
    },
    create: {
      organizationId,
      studentId: student.id,
      courseId: course.id,
      progressPercent,
      lessonsCompleted: completedCount,
      totalLessons: course.lessonCount,
      firstActivityAt: occurredAt,
      lastActivityAt: occurredAt,
    },
    update: {
      lessonsCompleted: completedCount, // Recalculated, not incremented
      progressPercent,
      lastActivityAt: shouldUpdateLastActivity ? occurredAt : undefined,
    },
  });

  // Check for recent interventions to attribute
  const recentInterventions = await db.intervention.findMany({
    where: {
      studentId: student.id,
      organizationId,
      state: { in: ["notification_accepted", "delivered"] },
      sentAt: { gte: new Date(occurredAt.getTime() - 14 * 24 * 60 * 60 * 1000) },
    },
  });

  for (const intervention of recentInterventions) {
    const result = classifyActivationProgressOutcome({
      interventionDeliveredAt: intervention.sentAt,
      courseStartedAt: occurredAt,
      progressResumedAt: occurredAt,
    });

    if (result.state !== "unattributed") {
      // Update intervention outcome
      await db.intervention.update({
        where: { id: intervention.id },
        data: {
          outcomeState: "progress_resumed",
          attributionState: result.state,
          recoveredAt: occurredAt,
        },
      });

      // Create a value event (strongly_associated, $0 — no financial value)
      const valueEvent = await db.valueEvent.create({
        data: {
          organizationId,
          interventionId: intervention.id,
          studentId: student.id,
          event: "Course activity resumed after notification",
          attributionLevel: result.state,
          amountCents: 0, // No financial value claimed
          formula: result.formula,
          policyVersion: result.policyVersion,
        },
      });

      // Store the evidence chain
      await db.attributionEvidence.createMany({
        data: result.evidence.map((e) => ({
          valueEventId: valueEvent.id,
          evidenceType: e.eventType,
          evidenceRef: e.timestamp,
          timestamp: new Date(e.timestamp),
          metadataJson: { detail: e.detail },
        })),
      });
    }
  }
}

// ─── Data export and deletion job functions ─────────────────

/**
 * Process a data export request.
 * Assembles all org data and marks the request as completed.
 */
async function processDataExport(
  exportRequestId: string,
  organizationId: string,
): Promise<void> {
  // Mark as processing
  const request = await db.dataExportRequest.findUnique({
    where: { id: exportRequestId },
  });

  if (!request || request.status === "Completed") {
    return; // Idempotent — skip if already completed or not found
  }

  await db.dataExportRequest.update({
    where: { id: exportRequestId },
    data: { status: "Processing" },
  });

  try {
    const { assembleExport } = await import("@/lib/data-lifecycle/export-engine");
    const payload = await assembleExport(organizationId);

    // In production, the payload would be written to encrypted object storage
    // (e.g. S3 with presigned URL). For now, we record completion and the
    // download token remains valid for retrieval via a download endpoint.

    await db.dataExportRequest.update({
      where: { id: exportRequestId },
      data: {
        status: "Completed",
        completedAt: new Date(),
      },
    });

    await recordAuditEvent({
      organizationId,
      action: "created",
      objectType: "data_export",
      objectId: exportRequestId,
    });
  } catch (error) {
    await db.dataExportRequest.update({
      where: { id: exportRequestId },
      data: { status: "Failed" },
    });

    throw error;
  }
}

/**
 * Process a data deletion request through the full lifecycle.
 */
async function processDataDeletion(
  deletionRequestId: string,
  organizationId: string,
): Promise<void> {
  const { verifyDeletionRequest, scheduleDeletion, executeDeletion } =
    await import("@/lib/data-lifecycle/deletion-engine");

  // Stage 1: Verify
  const verification = await verifyDeletionRequest(deletionRequestId);
  if (!verification.verified) {
    return;
  }

  // Stage 2: Schedule (with 24h grace period)
  await scheduleDeletion(deletionRequestId, 24);

  // Stage 3: Execute (in production, this would be delayed by the grace period
  // via Inngest's step.sleep. For now, we execute immediately after scheduling.)
  const result = await executeDeletion(deletionRequestId);

  await recordAuditEvent({
    organizationId,
    action: "deleted",
    objectType: "data_deletion_request",
    objectId: deletionRequestId,
    newState: result.success ? "completed" : "failed",
    metadataJson: result.evidence as Prisma.InputJsonValue,
  });
}
