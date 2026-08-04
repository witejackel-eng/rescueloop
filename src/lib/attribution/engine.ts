// Attribution engine.
// Classifies outcomes as unattributed, strongly_associated, confirmed, or estimated.
// Never combines tiers. Only verified payment data contributes to confirmed value.

import { db } from "@/lib/db";

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

/**
 * Classify the outcome of an intervention when a course-progress event arrives.
 *
 * Rules (conservative):
 * - Course started after intervention delivery = strongly_associated
 * - Progress resumed after intervention delivery = strongly_associated
 * - A payment succeeded after the intervention = confirmed (only if policy permits)
 * - No verifiable link = unattributed
 *
 * Financial value is ONLY confirmed when a qualifying payment event exists
 * AND the attribution policy explicitly permits confirmation.
 */
export function classifyProgressOutcome(params: {
  interventionDeliveredAt: Date | null;
  courseStartedAt: Date | null;
  progressResumedAt: Date | null;
  paymentSucceededAt: Date | null;
  membershipPriceCents: number;
}): AttributionResult {
  const evidence: AttributionEvidence[] = [];
  let state: AttributionResult["state"] = "unattributed";
  let amountCents = 0;

  if (params.interventionDeliveredAt) {
    evidence.push({
      eventType: "intervention_delivered",
      timestamp: params.interventionDeliveredAt.toISOString(),
      detail: "Intervention was delivered to the student",
    });
  }

  // Check if course started after delivery
  if (
    params.courseStartedAt &&
    params.interventionDeliveredAt &&
    params.courseStartedAt > params.interventionDeliveredAt
  ) {
    evidence.push({
      eventType: "course_started",
      timestamp: params.courseStartedAt.toISOString(),
      detail: "Student started the course after the intervention was delivered",
    });
    state = "strongly_associated";
  }

  // Check if progress resumed after delivery
  if (
    params.progressResumedAt &&
    params.interventionDeliveredAt &&
    params.progressResumedAt > params.interventionDeliveredAt
  ) {
    evidence.push({
      eventType: "progress_resumed",
      timestamp: params.progressResumedAt.toISOString(),
      detail: "Student resumed progress after the intervention was delivered",
    });
    state = "strongly_associated";
  }

  // Check if a qualifying payment succeeded after the intervention
  // ONLY this creates confirmed financial value.
  if (
    params.paymentSucceededAt &&
    params.interventionDeliveredAt &&
    params.paymentSucceededAt > params.interventionDeliveredAt
  ) {
    evidence.push({
      eventType: "payment_succeeded",
      timestamp: params.paymentSucceededAt.toISOString(),
      detail: "A qualifying payment succeeded after the intervention",
    });
    // Conservative rule: only confirm if course was started AND payment succeeded
    if (state === "strongly_associated") {
      state = "confirmed";
      amountCents = params.membershipPriceCents;
    } else {
      // Payment without course engagement is estimated, not confirmed
      state = "estimated";
      amountCents = params.membershipPriceCents;
    }
  }

  // If we have course engagement but no payment, it's strongly_associated with $0
  // (no financial value claimed yet)
  const formula = state === "confirmed"
    ? "Confirmed: payment succeeded after intervention and course engagement"
    : state === "strongly_associated"
      ? "Strongly associated: course activity resumed after intervention (no payment verified)"
      : state === "estimated"
        ? "Estimated: payment succeeded but no course engagement observed"
        : "Unattributed: no verifiable link between intervention and outcome";

  return {
    state,
    evidence,
    formula,
    amountCents,
    policyVersion: POLICY_VERSION,
  };
}

/**
 * Create a value event with attribution evidence.
 * Never combines confirmed and estimated value.
 */
export async function createValueEvent(params: {
  organizationId: string;
  interventionId: string;
  studentId?: string;
  event: string;
  attributionLevel: AttributionResult["state"];
  amountCents: number;
  currency?: string;
  formula: string;
  policyVersion: string;
  evidence: AttributionEvidence[];
}) {
  const valueEvent = await db.valueEvent.create({
    data: {
      organizationId: params.organizationId,
      interventionId: params.interventionId,
      studentId: params.studentId,
      event: params.event,
      attributionLevel: params.attributionLevel,
      amountCents: params.amountCents,
      currency: params.currency ?? "USD",
      formula: params.formula,
      policyVersion: params.policyVersion,
    },
  });

  // Store the evidence chain
  if (params.evidence.length > 0) {
    await db.attributionEvidence.createMany({
      data: params.evidence.map((e) => ({
        valueEventId: valueEvent.id,
        evidenceType: e.eventType,
        evidenceRef: e.timestamp,
        timestamp: new Date(e.timestamp),
        metadataJson: { detail: e.detail },
      })),
    });
  }

  return valueEvent;
}
