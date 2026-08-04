"server-only";
// Conservative attribution engine for Activation Rescue.
//
// Policy (2026-08-01):
//
// - strongly_associated: notification was API-accepted, student opened
//   the rescue experience or chose Continue, and course interaction
//   occurred afterward within the policy window (14 days).
//   Financial value: $0 (no money claimed).
//
// - estimated: forward-looking subscription value based on clearly
//   stated assumptions. Labelled as estimated, never confirmed.
//
// - confirmed: NOT available for Activation Rescue in this phase.
//   A normal subsequent subscription payment is recorded as
//   "observed subsequent payment" but does NOT automatically enter
//   confirmed RescueLoop revenue.
//
//   Confirmed attribution is reserved for later workflows:
//   - Failed payment recovered
//   - Cancellation explicitly reversed followed by successful renewal
//
// This ensures we never claim that an ordinary scheduled payment was
// "recovered revenue" just because the student returned to the course.

export interface AttributionEvidence {
  eventType: string;
  timestamp: string;
  detail: string;
}

export interface AttributionResult {
  state: "unattributed" | "strongly_associated" | "confirmed" | "estimated" | "rejected";
  evidence: AttributionEvidence[];
  formula: string;
  amountCents: number;
  policyVersion: string;
}

const POLICY_VERSION = "2026-08-01";
const POLICY_WINDOW_DAYS = 14;

/**
 * Classify the outcome of an Activation Rescue intervention when a
 * course-progress event arrives.
 *
 * For Activation Rescue, course activity after delivery = strongly_associated.
 * This does NOT create any financial value.
 */
export function classifyActivationProgressOutcome(params: {
  interventionDeliveredAt: Date | null;
  courseStartedAt: Date | null;
  progressResumedAt: Date | null;
  now?: Date;
}): AttributionResult {
  const now = params.now ?? new Date();
  const evidence: AttributionEvidence[] = [];
  let state: AttributionResult["state"] = "unattributed";

  if (params.interventionDeliveredAt) {
    evidence.push({
      eventType: "intervention_delivered",
      timestamp: params.interventionDeliveredAt.toISOString(),
      detail: "Notification was accepted by the Whop API",
    });
  }

  // Check if course activity occurred within the policy window after delivery
  const activityDate = params.courseStartedAt ?? params.progressResumedAt;

  if (
    activityDate &&
    params.interventionDeliveredAt &&
    activityDate > params.interventionDeliveredAt
  ) {
    const daysAfter = (activityDate.getTime() - params.interventionDeliveredAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysAfter <= POLICY_WINDOW_DAYS) {
      evidence.push({
        eventType: params.courseStartedAt ? "course_started" : "progress_resumed",
        timestamp: activityDate.toISOString(),
        detail: `Course activity occurred ${daysAfter.toFixed(1)} days after notification delivery`,
      });
      state = "strongly_associated";
    } else {
      evidence.push({
        eventType: "activity_outside_window",
        timestamp: activityDate.toISOString(),
        detail: `Course activity occurred ${daysAfter.toFixed(1)} days after delivery — outside the ${POLICY_WINDOW_DAYS}-day policy window`,
      });
      state = "rejected";
    }
  }

  const formula =
    state === "strongly_associated"
      ? `Strongly associated: course activity resumed within ${POLICY_WINDOW_DAYS} days of notification. No financial value claimed (Activation Rescue policy ${POLICY_VERSION}).`
      : state === "rejected"
        ? `Rejected: activity occurred outside the ${POLICY_WINDOW_DAYS}-day policy window.`
        : "Unattributed: no verifiable course activity after notification delivery.";

  return {
    state,
    evidence,
    formula,
    amountCents: 0, // Activation Rescue never claims financial value
    policyVersion: POLICY_VERSION,
  };
}

/**
 * Classify an observed subsequent payment.
 *
 * For Activation Rescue, a normal subscription payment after course
 * activity is recorded as "observed subsequent payment" with NO
 * confirmed attribution. It does not enter confirmed RescueLoop revenue.
 *
 * This is the key conservative rule: ordinary payments are not
 * "recovered revenue" just because the student returned.
 */
export function classifyObservedPayment(params: {
  interventionDeliveredAt: Date | null;
  paymentSucceededAt: Date;
  membershipPriceCents: number;
  courseActivityOccurred: boolean;
}): AttributionResult {
  const evidence: AttributionEvidence[] = [];

  evidence.push({
    eventType: "payment_succeeded",
    timestamp: params.paymentSucceededAt.toISOString(),
    detail: "A subsequent subscription payment succeeded",
  });

  if (params.interventionDeliveredAt) {
    evidence.push({
      eventType: "intervention_delivered",
      timestamp: params.interventionDeliveredAt.toISOString(),
      detail: "Notification was delivered before this payment",
    });
  }

  // For Activation Rescue, ordinary payments are NEVER confirmed revenue.
  // They are recorded as "observed" with estimated attribution at most.
  const state: AttributionResult["state"] = params.courseActivityOccurred
    ? "estimated" // Course activity + payment = estimated (not confirmed)
    : "unattributed"; // Payment without course activity = unattributed

  const formula =
    state === "estimated"
      ? `Estimated: payment succeeded after course activity. Not confirmed — ordinary subscription payments are not attributed as recovered revenue under Activation Rescue policy ${POLICY_VERSION}.`
      : "Unattributed: payment succeeded but no course activity was observed.";

  return {
    state,
    evidence,
    formula,
    amountCents: params.membershipPriceCents, // Recorded for visibility, but classified as estimated — NOT confirmed
    policyVersion: POLICY_VERSION,
  };
}

/**
 * Create a value event for an observed payment.
 * Uses a unique constraint on paymentEventId to prevent duplicate attribution.
 */
export async function createObservedPaymentValueEvent(params: {
  organizationId: string;
  interventionId: string;
  studentId?: string;
  paymentEventId: string; // Unique — prevents duplicate attribution
  amountCents: number;
  courseActivityOccurred: boolean;
  paymentSucceededAt: Date;
  interventionDeliveredAt: Date | null;
}): Promise<{ created: boolean; reason: string }> {
  const { db } = await import("@/lib/db");

  // Check if a value event already exists for this payment (idempotency)
  const existing = await db.valueEvent.findUnique({
    where: { paymentEventId: params.paymentEventId },
    select: { id: true },
  });

  if (existing) {
    return {
      created: false,
      reason: "Value event already exists for this payment — duplicate attribution prevented",
    };
  }

  const result = classifyObservedPayment({
    interventionDeliveredAt: params.interventionDeliveredAt,
    paymentSucceededAt: params.paymentSucceededAt,
    membershipPriceCents: params.amountCents,
    courseActivityOccurred: params.courseActivityOccurred,
  });

  const valueEvent = await db.valueEvent.create({
    data: {
      organizationId: params.organizationId,
      interventionId: params.interventionId,
      studentId: params.studentId,
      event: "Observed subsequent payment",
      attributionLevel: result.state,
      amountCents: result.amountCents,
      formula: result.formula,
      policyVersion: result.policyVersion,
      paymentEventId: params.paymentEventId,
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

  return { created: true, reason: result.formula };
}
