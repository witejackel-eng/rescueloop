// RescueLoop — Outcome Engine
// Computes observed outcomes from student responses and subsequent course activity.
// Key invariants:
// - Idempotent: same events → same outcome
// - Out-of-order safe: late events recompute deterministically
// - No causal inflation: progress after intervention is "observed", not "rescued"
// - Insufficient data → insufficient_data (not a guess)

export type ObservedOutcome =
  | "no_change"
  | "responded"
  | "blocker_reported"
  | "opted_out"
  | "course_return_observed"
  | "lesson_progress_observed"
  | "membership_deactivated"
  | "insufficient_data";

export type AttributionLabel = "observed" | "strongly_associated" | "unattributed";

export interface StudentResponseInput {
  responseType: string;
  blockerType?: string;
  respondedAt: Date;
}

export interface CourseActivityEvent {
  type: "lesson_completed" | "course_accessed" | "lesson_started";
  occurredAt: Date;
}

export interface MembershipEvent {
  status: string;
  occurredAt: Date;
}

export interface OutcomeEngineInput {
  /** Student response (null if no response yet) */
  response: StudentResponseInput | null;
  /** Course activity events after intervention */
  courseActivity: CourseActivityEvent[];
  /** Membership events after intervention */
  membershipEvents: MembershipEvent[];
  /** When the intervention was sent/delivered */
  interventionSentAt: Date;
  /** Current time for threshold calculation */
  now: Date;
  /** Custom threshold for insufficient data (default: 3 hours) */
  insufficientDataThresholdMs?: number;
}

/** Default insufficient-data threshold: 3 hours */
const DEFAULT_INSUFFICIENT_DATA_MS = 3 * 60 * 60 * 1000;

/** Terminal membership statuses that count as deactivation */
const DEACTIVATED_MEMBERSHIP_STATUSES = new Set(["cancelled", "past_due", "cancelling"]);

/**
 * Check if any membership event indicates deactivation.
 * Only consider events after the intervention was sent.
 */
function isMembershipDeactivated(
  membershipEvents: MembershipEvent[],
  interventionSentAt: Date,
): boolean {
  const terminalEvents = membershipEvents.filter(
    (e) =>
      e.occurredAt >= interventionSentAt &&
      DEACTIVATED_MEMBERSHIP_STATUSES.has(e.status),
  );
  // If there's a terminal event, check if it was later reversed by an "active" event
  if (terminalEvents.length === 0) return false;
  const lastTerminal = terminalEvents[terminalEvents.length - 1];
  // Check if there's an "active" event after the last terminal event
  const reactivated = membershipEvents.some(
    (e) =>
      e.occurredAt > lastTerminal.occurredAt &&
      e.status === "active",
  );
  return !reactivated;
}

/**
 * Check for post-intervention course activity.
 * Returns the most significant activity type found.
 */
function postInterventionActivity(
  courseActivity: CourseActivityEvent[],
  interventionSentAt: Date,
): "lesson_completed" | "course_accessed" | null {
  const postEvents = courseActivity.filter((e) => e.occurredAt >= interventionSentAt);
  if (postEvents.length === 0) return null;
  // lesson_completed is most significant
  const hasLessonCompleted = postEvents.some((e) => e.type === "lesson_completed");
  if (hasLessonCompleted) return "lesson_completed";
  // course_accessed or lesson_started both count as return
  const hasReturn = postEvents.some(
    (e) => e.type === "course_accessed" || e.type === "lesson_started",
  );
  if (hasReturn) return "course_accessed";
  return null;
}

/**
 * Compute the observed outcome from response and subsequent activity.
 * This function is pure: same input → same output (idempotent).
 * Late/out-of-order events simply provide updated input values.
 */
export function computeOutcome(input: OutcomeEngineInput): ObservedOutcome {
  const {
    response,
    courseActivity,
    membershipEvents,
    interventionSentAt,
    now,
    insufficientDataThresholdMs,
  } = input;

  const threshold = insufficientDataThresholdMs ?? DEFAULT_INSUFFICIENT_DATA_MS;
  const elapsedMs = now.getTime() - interventionSentAt.getTime();
  const hasSufficientTime = elapsedMs >= threshold;

  // 1. If opted out, that overrides EVERYTHING (even membership deactivation)
  if (response?.responseType === "stop_reminders") {
    return "opted_out";
  }

  // 2. Membership deactivation is definitive
  if (isMembershipDeactivated(membershipEvents, interventionSentAt)) {
    return "membership_deactivated";
  }

  // 3. Check for post-intervention course activity
  const activity = postInterventionActivity(courseActivity, interventionSentAt);

  // 4. If blocker was reported
  if (response?.responseType === "stuck" && response.blockerType) {
    // Blocker was reported — even if course activity follows, blocker_reported takes priority
    // (the blocker was still reported; the activity is additional context)
    return "blocker_reported";
  }

  // 5. No response — check for observed activity or insufficient data
  if (response === null) {
    if (activity === "lesson_completed") {
      return "lesson_progress_observed";
    }
    if (activity === "course_accessed") {
      return "course_return_observed";
    }
    if (!hasSufficientTime) {
      return "insufficient_data";
    }
    return "no_change";
  }

  // 6. Response exists — check type and activity
  if (activity === "lesson_completed") {
    return "lesson_progress_observed";
  }
  if (activity === "course_accessed") {
    return "course_return_observed";
  }

  // 7. Response without post-intervention activity
  if (response.responseType === "stuck") {
    // stuck without blockerType = generic response
    return "responded";
  }

  if (response.responseType === "human_help") {
    return "responded";
  }

  // All other response types: responded
  return "responded";
}

/**
 * Recompute outcome with new evidence (out-of-order safe).
 * Simply calls computeOutcome with the updated input — idempotent by design.
 */
export function recomputeOutcome(input: OutcomeEngineInput): ObservedOutcome {
  return computeOutcome(input);
}

/**
 * Compute attribution label for an outcome + response combination.
 * Never returns "rescued" — uses honest language only.
 */
export function computeAttribution(
  outcome: ObservedOutcome,
  response: StudentResponseInput,
): AttributionLabel {
  // Opted out: no attribution
  if (outcome === "opted_out" || outcome === "membership_deactivated") {
    return "unattributed";
  }

  // No change or insufficient data: no attribution
  if (outcome === "no_change" || outcome === "insufficient_data") {
    return "unattributed";
  }

  // Blocker reported without progress: observed but not strongly associated
  if (outcome === "blocker_reported") {
    return "observed";
  }

  // Student responded positively and we see progress
  if (
    outcome === "lesson_progress_observed" ||
    outcome === "course_return_observed"
  ) {
    // If student said "continue_course" and we see progress → strongly_associated
    if (
      response.responseType === "continue_course" ||
      response.responseType === "remind_later"
    ) {
      return "strongly_associated";
    }
    // Stuck/human_help but they still made progress → observed (they overcame the blocker)
    return "observed";
  }

  // Just responded without observed progress → observed
  if (outcome === "responded") {
    return "observed";
  }

  return "unattributed";
}

/**
 * Map outcome to human-readable label for creator display.
 * Uses honest language — never "rescued" or "recovered".
 */
export function outcomeLabel(outcome: ObservedOutcome): string {
  switch (outcome) {
    case "no_change":
      return "No change observed";
    case "responded":
      return "Student responded";
    case "blocker_reported":
      return "Blocker reported";
    case "opted_out":
      return "Student opted out";
    case "course_return_observed":
      return "Course return observed";
    case "lesson_progress_observed":
      return "Lesson progress observed";
    case "membership_deactivated":
      return "Membership ended";
    case "insufficient_data":
      return "Too soon to assess";
  }
}

/**
 * Whether this outcome represents some form of positive signal.
 * Used for UI coloring — but NEVER call this "recovery" or "rescue success".
 */
export function isPositiveSignal(outcome: ObservedOutcome): boolean {
  return (
    outcome === "responded" ||
    outcome === "course_return_observed" ||
    outcome === "lesson_progress_observed"
  );
}
