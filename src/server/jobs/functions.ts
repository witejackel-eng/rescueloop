// Inngest job functions for the Activation Rescue workflow.
// Each function is a durable, retryable, idempotent job.

import { inngest, EVENTS } from "./client";
import { db } from "@/lib/db";
import { checkActivationEligibility } from "@/lib/eligibility/activation-engine";
import { classifyProgressOutcome, createValueEvent } from "@/lib/attribution/engine";
import { createStudentToken, buildStudentExperienceUrl } from "@/lib/crypto/student-tokens";
import { getEnv } from "@/lib/env";
import { sendWhopNotification } from "@/lib/whop/client";
import { recordAuditEvent } from "@/lib/audit";

/**
 * Webhook processing job.
 * Receives a webhook receipt, processes the event, and updates state.
 * Idempotent: checks receipt status before processing.
 */
export const processWebhook = inngest.createFunction(
  {
    id: "process-webhook",
    retries: 5,
  },
  { event: EVENTS.webhookReceived },
  async ({ event, step }) => {
    const { receiptId } = event.data as { receiptId: string };

    // Step 1: Mark as processing
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

    // Step 2: Process based on event type
    const receipt = await db.webhookReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt || receipt.status === "processed") {
      return { processed: false, reason: "already-processed" };
    }

    const payload = receipt.payloadJson as Record<string, unknown>;

    if (receipt.eventType.includes("lesson.completed") || receipt.eventType.includes("course.progress")) {
      await step.run("handle-progress-event", async () => {
        await handleProgressEvent(receipt.organizationId, payload, receiptId);
      });
    } else if (receipt.eventType.includes("membership")) {
      await step.run("handle-membership-event", async () => {
        await handleMembershipEvent(receipt.organizationId, payload, receiptId);
      });
    } else if (receipt.eventType.includes("payment")) {
      await step.run("handle-payment-event", async () => {
        await handlePaymentEvent(receipt.organizationId, payload, receiptId);
      });
    }

    // Step 3: Mark as processed
    await step.run("mark-processed", async () => {
      await db.webhookReceipt.update({
        where: { id: receiptId },
        data: { status: "processed", processedAt: new Date() },
      });
    });

    return { processed: true };
  },
);

/**
 * Intervention delivery job.
 * Re-checks all safety conditions before sending.
 * Records the delivery attempt state accurately.
 */
export const deliverIntervention = inngest.createFunction(
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
        student: { include: { memberships: true, suppressions: true } },
        campaign: true,
        organization: true,
      },
    });

    if (!intervention) {
      return { delivered: false, reason: "not-found" };
    }

    // Safety re-checks at delivery time
    const safetyChecks = await step.run("safety-recheck", async () => {
      const checks: { condition: string; passed: boolean; detail: string }[] = [];

      // Organization not paused
      const orgActive = !intervention.organization.isPaused;
      checks.push({ condition: "org_active", passed: orgActive, detail: orgActive ? "OK" : "Paused" });

      // Campaign active
      const campaignActive = intervention.campaign.status === "active";
      checks.push({ condition: "campaign_active", passed: campaignActive, detail: campaignActive ? "OK" : "Paused" });

      // Student not suppressed
      const notSuppressed = intervention.student.suppressions.length === 0;
      checks.push({ condition: "not_suppressed", passed: notSuppressed, detail: notSuppressed ? "OK" : "Opted out" });

      // Membership still active
      const membershipActive = intervention.student.memberships.some(
        (m) => m.status === "active" || m.status === "trialing",
      );
      checks.push({ condition: "membership_active", passed: membershipActive, detail: membershipActive ? "OK" : "Inactive" });

      // Not already delivered (idempotency)
      const notAlreadyDelivered = intervention.state !== "delivered";
      checks.push({ condition: "not_already_delivered", passed: notAlreadyDelivered, detail: notAlreadyDelivered ? "OK" : "Already sent" });

      return checks;
    });

    const allPassed = safetyChecks.every((c) => c.passed);

    if (!allPassed) {
      // Stop delivery — record as stopped_before_send
      await step.run("record-stopped", async () => {
        const idempotencyKey = `delivery-${interventionId}-${Date.now()}`;
        await db.deliveryAttempt.create({
          data: {
            interventionId,
            state: "stopped_before_send",
            idempotencyKey,
            errorMessage: JSON.stringify(safetyChecks.filter((c) => !c.passed)),
          },
        });
        await db.intervention.update({
          where: { id: interventionId },
          data: { state: "stopped" },
        });
        await recordAuditEvent({
          organizationId: intervention.organizationId,
          action: "updated",
          objectType: "intervention",
          objectId: interventionId,
          interventionId,
          previousState: "approved",
          newState: "stopped",
          reason: "Safety check failed at delivery time",
          metadata: { checks: safetyChecks },
        });
      });
      return { delivered: false, reason: "safety-check-failed" };
    }

    // Generate signed student token
    const env = getEnv();
    const token = createStudentToken(
      {
        i: intervention.id,
        o: intervention.organizationId,
        s: intervention.studentId,
        expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
      },
      env.STUDENT_LINK_SIGNING_SECRET,
    );

    const experienceUrl = buildStudentExperienceUrl(env.APP_URL, token);

    // Send the notification
    const message = intervention.messageEdited ?? intervention.messagePreview;
    const idempotencyKey = `delivery-${interventionId}`;

    try {
      const result = await step.run("send-notification", async () => {
        // Check for existing delivery attempt (idempotency)
        const existing = await db.deliveryAttempt.findUnique({
          where: { idempotencyKey },
        });
        if (existing && existing.state === "api_accepted") {
          return { messageId: existing.providerMessageId, skipped: true };
        }

        const sendResult = await sendWhopNotification({
          whopUserId: intervention.student.whopUserId,
          message,
          actionUrl: experienceUrl,
        });

        // Record the delivery attempt
        await db.deliveryAttempt.create({
          data: {
            interventionId,
            state: "api_accepted", // NOT "delivered" — API acceptance ≠ confirmed delivery
            idempotencyKey,
            providerMessageId: sendResult.messageId,
            apiAcceptedAt: new Date(),
          },
        });

        await db.intervention.update({
          where: { id: interventionId },
          data: { state: "delivered", sentAt: new Date() },
        });

        await recordAuditEvent({
          organizationId: intervention.organizationId,
          action: "delivered",
          objectType: "intervention",
          objectId: interventionId,
          interventionId,
          newState: "delivered",
        });

        return { messageId: sendResult.messageId, skipped: false };
      });

      return { delivered: true, messageId: result.messageId };
    } catch (error) {
      // Record failure
      await db.deliveryAttempt.upsert({
        where: { idempotencyKey },
        create: {
          interventionId,
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

      throw error; // Let Inngest retry
    }
  },
);

// ─── Webhook event handlers ──────────────────────────────────

async function handleProgressEvent(
  organizationId: string,
  payload: Record<string, unknown>,
  webhookReceiptId: string,
) {
  const whopUserId = payload.user_id as string;
  const courseId = payload.course_id as string;
  const lessonIndex = payload.lesson_index as number;
  const lessonTitle = payload.lesson_title as string;
  const action = payload.action as string;
  const occurredAt = new Date(payload.occurred_at as string);

  const student = await db.student.findFirst({
    where: { organizationId, whopUserId },
  });

  if (!student) return;

  const course = await db.course.findFirst({
    where: { organizationId, externalCourseId: courseId },
  });

  if (!course) return;

  // Record the progress event
  await db.progressEvent.create({
    data: {
      organizationId,
      studentId: student.id,
      courseId: course.id,
      lessonIndex,
      lessonTitle,
      action,
      occurredAt,
      webhookReceiptId,
    },
  });

  // Update student course state
  await db.studentCourseState.upsert({
    where: {
      studentId_courseId: { studentId: student.id, courseId: course.id },
    },
    create: {
      organizationId,
      studentId: student.id,
      courseId: course.id,
      progressPercent: action === "completed" ? Math.round(((lessonIndex + 1) / course.lessonCount) * 100) : 0,
      lessonsCompleted: action === "completed" ? lessonIndex + 1 : 0,
      totalLessons: course.lessonCount,
      firstActivityAt: occurredAt,
      lastActivityAt: occurredAt,
    },
    update: {
      lessonsCompleted: action === "completed" ? { increment: 1 } : undefined,
      lastActivityAt: occurredAt,
    },
  });

  // Check for recent interventions to attribute
  const recentInterventions = await db.intervention.findMany({
    where: {
      studentId: student.id,
      organizationId,
      state: "delivered",
      sentAt: { gte: new Date(occurredAt.getTime() - 14 * 24 * 60 * 60 * 1000) },
    },
    include: {
      student: { include: { memberships: true } },
    },
  });

  for (const intervention of recentInterventions) {
    // Classify the outcome
    const membership = intervention.student.memberships[0];
    const result = classifyProgressOutcome({
      interventionDeliveredAt: intervention.sentAt,
      courseStartedAt: action === "started" ? occurredAt : null,
      progressResumedAt: action === "completed" ? occurredAt : null,
      paymentSucceededAt: null, // No payment event yet
      membershipPriceCents: membership?.priceCents ?? 0,
    });

    if (result.state !== "unattributed") {
      // Update intervention outcome
      await db.intervention.update({
        where: { id: intervention.id },
        data: {
          outcomeState: action === "started" ? "course_started" : "progress_resumed",
          attributionState: result.state,
          recoveredAt: occurredAt,
        },
      });

      // Create a value event (strongly_associated, $0 for now)
      await createValueEvent({
        organizationId,
        interventionId: intervention.id,
        studentId: student.id,
        event: "Course activity resumed after intervention",
        attributionLevel: result.state,
        amountCents: 0, // No financial value until payment is verified
        formula: result.formula,
        policyVersion: result.policyVersion,
        evidence: result.evidence,
      });
    }
  }
}

async function handleMembershipEvent(
  organizationId: string,
  payload: Record<string, unknown>,
  webhookReceiptId: string,
) {
  const whopMembershipId = payload.membership_id as string;
  const status = payload.status as string;
  const occurredAt = new Date(payload.occurred_at as string);

  const membership = await db.membership.findUnique({
    where: { whopMembershipId },
  });

  if (!membership) return;

  // Update membership status
  await db.membership.update({
    where: { id: membership.id },
    data: {
      status: status as never,
      lastSyncedAt: new Date(),
    },
  });

  // Record the event
  await db.membershipEvent.create({
    data: {
      organizationId,
      membershipId: membership.id,
      eventType: status,
      occurredAt,
      webhookReceiptId,
    },
  });
}

async function handlePaymentEvent(
  organizationId: string,
  payload: Record<string, unknown>,
  webhookReceiptId: string,
) {
  const whopPaymentId = payload.payment_id as string;
  const membershipId = payload.membership_id as string;
  const amountCents = payload.amount_cents as number;
  const status = payload.status as string;
  const occurredAt = new Date(payload.occurred_at as string);

  const membership = await db.membership.findUnique({
    where: { whopMembershipId: membershipId },
  });

  if (!membership) return;

  // Record the payment event (idempotent via unique whopPaymentId)
  await db.paymentEvent.upsert({
    where: { whopPaymentId },
    create: {
      organizationId,
      membershipId: membership.id,
      whopPaymentId,
      status: status as never,
      amountCents,
      occurredAt,
      webhookReceiptId,
    },
    update: {},
  });

  // If payment succeeded, check for attributable interventions
  if (status === "succeeded") {
    const interventions = await db.intervention.findMany({
      where: {
        organizationId,
        student: { memberships: { some: { id: membership.id } } },
        state: "delivered",
        sentAt: { lt: occurredAt },
      },
    });

    for (const intervention of interventions) {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: intervention.sentAt,
        courseStartedAt: intervention.recoveredAt,
        progressResumedAt: intervention.recoveredAt,
        paymentSucceededAt: occurredAt,
        membershipPriceCents: amountCents,
      });

      if (result.state === "confirmed") {
        await db.intervention.update({
          where: { id: intervention.id },
          data: { attributionState: "confirmed" },
        });

        await createValueEvent({
          organizationId,
          interventionId: intervention.id,
          event: "Payment succeeded after intervention",
          attributionLevel: "confirmed",
          amountCents,
          formula: result.formula,
          policyVersion: result.policyVersion,
          evidence: result.evidence,
        });
      }
    }
  }
}
