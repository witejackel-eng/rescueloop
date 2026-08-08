// Unit tests for the Outcome Engine.
//
// Tests:
// 1. Idempotent recomputation (same events → same outcome)
// 2. Out-of-order events (late course activity arrives after initial "no_change" → recomputes to "course_return_observed")
// 3. stop_reminders → opted_out outcome
// 4. stuck with blocker → blocker_reported outcome
// 5. No inflation (course progress after intervention is "observed", not "rescued")
// 6. Insufficient data → insufficient_data outcome
// 7. membership_deactivated when membership cancelled
// 8. lesson_progress_observed when lesson completed after intervention
// 9. course_return_observed when course accessed after intervention
// 10. Attribution never uses "rescued"

import { describe, it, expect } from "vitest";
import {
  computeOutcome,
  recomputeOutcome,
  computeAttribution,
  type OutcomeEngineInput,
  type StudentResponseInput,
  type ObservedOutcome,
  type AttributionLabel,
} from "@/lib/outcomes/outcome-engine";

// ─── Helpers ──────────────────────────────────────────────────

const now = new Date("2025-01-15T12:00:00Z");
const sentAt = new Date("2025-01-14T12:00:00Z"); // 24h ago
const recentSentAt = new Date("2025-01-15T11:30:00Z"); // 30min ago

function makeInput(
  overrides: Partial<OutcomeEngineInput> = {},
): OutcomeEngineInput {
  return {
    response: null,
    courseActivity: [],
    membershipEvents: [],
    interventionSentAt: sentAt,
    now,
    ...overrides,
  };
}

// ─── 1. Idempotent recomputation ──────────────────────────────

describe("Outcome Engine — idempotent recomputation", () => {
  it("same events always produce the same outcome", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
    });

    const result1 = computeOutcome(input);
    const result2 = computeOutcome(input);
    const result3 = recomputeOutcome(input);

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it("idempotent with course activity events", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T15:00:00Z"),
        },
      ],
    });

    const result1 = computeOutcome(input);
    const result2 = computeOutcome(input);

    expect(result1).toBe(result2);
    expect(result1).toBe("lesson_progress_observed");
  });

  it("idempotent with multiple recomputations", () => {
    const input = makeInput({
      response: {
        responseType: "stuck",
        blockerType: "lack_of_time",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
    });

    for (let i = 0; i < 100; i++) {
      expect(computeOutcome(input)).toBe("blocker_reported");
    }
  });
});

// ─── 2. Out-of-order events ──────────────────────────────────

describe("Outcome Engine — out-of-order events", () => {
  it("late course activity recomputes no_change to course_return_observed", () => {
    // Initially: no response, 24h elapsed → no_change
    const initialInput = makeInput();
    const initialOutcome = computeOutcome(initialInput);
    expect(initialOutcome).toBe("no_change");

    // Later: course activity event arrives
    const updatedInput = makeInput({
      courseActivity: [
        {
          type: "course_accessed",
          occurredAt: new Date("2025-01-14T18:00:00Z"),
        },
      ],
    });

    // Recompute: should now be course_return_observed
    const recomputedOutcome = recomputeOutcome(updatedInput);
    expect(recomputedOutcome).toBe("course_return_observed");
  });

  it("late lesson completion recomputes no_change to lesson_progress_observed", () => {
    const initialInput = makeInput();
    expect(computeOutcome(initialInput)).toBe("no_change");

    const updatedInput = makeInput({
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T20:00:00Z"),
        },
      ],
    });

    expect(recomputeOutcome(updatedInput)).toBe("lesson_progress_observed");
  });

  it("events in reverse chronological order produce same result", () => {
    const input1 = makeInput({
      courseActivity: [
        { type: "course_accessed", occurredAt: new Date("2025-01-14T14:00:00Z") },
        { type: "lesson_completed", occurredAt: new Date("2025-01-14T18:00:00Z") },
      ],
    });

    const input2 = makeInput({
      courseActivity: [
        { type: "lesson_completed", occurredAt: new Date("2025-01-14T18:00:00Z") },
        { type: "course_accessed", occurredAt: new Date("2025-01-14T14:00:00Z") },
      ],
    });

    expect(computeOutcome(input1)).toBe(computeOutcome(input2));
  });
});

// ─── 3. stop_reminders → opted_out ───────────────────────────

describe("Outcome Engine — stop_reminders → opted_out", () => {
  it("stop_reminders always results in opted_out", () => {
    const input = makeInput({
      response: {
        responseType: "stop_reminders",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
    });

    expect(computeOutcome(input)).toBe("opted_out");
  });

  it("stop_reminders is opted_out even with subsequent course activity", () => {
    const input = makeInput({
      response: {
        responseType: "stop_reminders",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T18:00:00Z"),
        },
      ],
    });

    // opted_out is highest priority — even if student returns to course
    expect(computeOutcome(input)).toBe("opted_out");
  });

  it("stop_reminders is opted_out even with membership deactivation", () => {
    const input = makeInput({
      response: {
        responseType: "stop_reminders",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      membershipEvents: [
        {
          status: "cancelled",
          occurredAt: new Date("2025-01-14T20:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("opted_out");
  });
});

// ─── 4. stuck with blocker → blocker_reported ────────────────

describe("Outcome Engine — stuck with blocker → blocker_reported", () => {
  it("stuck with blockerType results in blocker_reported", () => {
    const input = makeInput({
      response: {
        responseType: "stuck",
        blockerType: "lack_of_time",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
    });

    expect(computeOutcome(input)).toBe("blocker_reported");
  });

  it("stuck with each blocker type results in blocker_reported", () => {
    const blockerTypes = [
      "lack_of_time",
      "material_difficult",
      "unsure_next_step",
      "expected_something_different",
      "technical_problem",
      "needs_creator_help",
    ] as const;

    for (const blockerType of blockerTypes) {
      const input = makeInput({
        response: {
          responseType: "stuck",
          blockerType,
          respondedAt: new Date("2025-01-14T13:00:00Z"),
        },
      });

      expect(computeOutcome(input)).toBe("blocker_reported");
    }
  });

  it("stuck without blockerType is responded (not blocker_reported)", () => {
    const input = makeInput({
      response: {
        responseType: "stuck",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
    });

    expect(computeOutcome(input)).toBe("responded");
  });

  it("stuck with blocker still reports blocker even if course activity follows", () => {
    const input = makeInput({
      response: {
        responseType: "stuck",
        blockerType: "material_difficult",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T18:00:00Z"),
        },
      ],
    });

    // Blocker was reported — course activity is additional context
    expect(computeOutcome(input)).toBe("blocker_reported");
  });
});

// ─── 5. No inflation (course progress is "observed", not "rescued") ──

describe("Outcome Engine — no causality inflation", () => {
  it("lesson progress is lesson_progress_observed, not 'rescued'", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T18:00:00Z"),
        },
      ],
    });

    const outcome = computeOutcome(input);
    expect(outcome).toBe("lesson_progress_observed");
    // Explicitly verify no "rescued" anywhere
    expect(outcome).not.toContain("rescued");
    expect(outcome).not.toContain("rescue");
  });

  it("course return is course_return_observed, not 'rescued'", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      courseActivity: [
        {
          type: "course_accessed",
          occurredAt: new Date("2025-01-14T15:00:00Z"),
        },
      ],
    });

    const outcome = computeOutcome(input);
    expect(outcome).toBe("course_return_observed");
    expect(outcome).not.toContain("rescued");
  });

  it("attribution never uses 'rescued'", () => {
    const response: StudentResponseInput = {
      responseType: "continue_course",
      respondedAt: new Date("2025-01-14T13:00:00Z"),
    };

    const attribution = computeAttribution("lesson_progress_observed", response);
    expect(attribution).not.toBe("rescued");
    // Valid attribution labels
    expect(["observed", "strongly_associated", "unattributed"]).toContain(attribution);
  });

  it("attribution for continue_course with lesson progress is strongly_associated", () => {
    const response: StudentResponseInput = {
      responseType: "continue_course",
      respondedAt: new Date("2025-01-14T13:00:00Z"),
    };

    expect(computeAttribution("lesson_progress_observed", response)).toBe("strongly_associated");
    expect(computeAttribution("course_return_observed", response)).toBe("strongly_associated");
  });

  it("attribution for stuck with lesson progress is observed (not strongly_associated)", () => {
    const response: StudentResponseInput = {
      responseType: "stuck",
      blockerType: "lack_of_time",
      respondedAt: new Date("2025-01-14T13:00:00Z"),
    };

    expect(computeAttribution("lesson_progress_observed", response)).toBe("observed");
  });

  it("attribution for opted_out is unattributed", () => {
    const response: StudentResponseInput = {
      responseType: "stop_reminders",
      respondedAt: new Date("2025-01-14T13:00:00Z"),
    };

    expect(computeAttribution("opted_out", response)).toBe("unattributed");
  });
});

// ─── 6. Insufficient data ────────────────────────────────────

describe("Outcome Engine — insufficient data", () => {
  it("no response and not enough time elapsed → insufficient_data", () => {
    const input = makeInput({
      interventionSentAt: recentSentAt, // 30min ago
      now, // now
    });

    expect(computeOutcome(input)).toBe("insufficient_data");
  });

  it("no response and 24h+ elapsed → no_change", () => {
    const input = makeInput({
      interventionSentAt: sentAt, // 24h ago
      now,
    });

    expect(computeOutcome(input)).toBe("no_change");
  });

  it("custom threshold works", () => {
    const input = makeInput({
      interventionSentAt: new Date("2025-01-15T11:00:00Z"), // 1h ago
      now,
      insufficientDataThresholdMs: 2 * 60 * 60 * 1000, // 2h threshold
    });

    expect(computeOutcome(input)).toBe("insufficient_data");
  });

  it("response present overrides insufficient_data", () => {
    const input = makeInput({
      interventionSentAt: recentSentAt, // 30min ago
      now,
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-15T11:45:00Z"),
      },
    });

    // Student responded — we have sufficient data
    expect(computeOutcome(input)).toBe("responded");
  });
});

// ─── 7. Membership deactivation ───────────────────────────────

describe("Outcome Engine — membership deactivation", () => {
  it("membership cancelled after intervention → membership_deactivated", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      membershipEvents: [
        {
          status: "cancelled",
          occurredAt: new Date("2025-01-14T20:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("membership_deactivated");
  });

  it("membership past_due after intervention → membership_deactivated", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      membershipEvents: [
        {
          status: "past_due",
          occurredAt: new Date("2025-01-14T20:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("membership_deactivated");
  });

  it("membership reactivated (active) does not cause membership_deactivated", () => {
    const input = makeInput({
      response: {
        responseType: "continue_course",
        respondedAt: new Date("2025-01-14T13:00:00Z"),
      },
      membershipEvents: [
        {
          status: "active",
          occurredAt: new Date("2025-01-14T20:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).not.toBe("membership_deactivated");
  });
});

// ─── 8. Lesson progress observed ─────────────────────────────

describe("Outcome Engine — lesson progress observed", () => {
  it("lesson_completed after intervention → lesson_progress_observed", () => {
    const input = makeInput({
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T18:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("lesson_progress_observed");
  });

  it("lesson_completed before intervention is ignored", () => {
    const input = makeInput({
      courseActivity: [
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-13T18:00:00Z"), // before intervention
        },
      ],
    });

    // No post-intervention activity
    expect(computeOutcome(input)).toBe("no_change");
  });

  it("lesson_completed takes priority over course_accessed", () => {
    const input = makeInput({
      courseActivity: [
        {
          type: "course_accessed",
          occurredAt: new Date("2025-01-14T15:00:00Z"),
        },
        {
          type: "lesson_completed",
          occurredAt: new Date("2025-01-14T18:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("lesson_progress_observed");
  });
});

// ─── 9. Course return observed ───────────────────────────────

describe("Outcome Engine — course return observed", () => {
  it("course_accessed after intervention → course_return_observed", () => {
    const input = makeInput({
      courseActivity: [
        {
          type: "course_accessed",
          occurredAt: new Date("2025-01-14T15:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("course_return_observed");
  });

  it("lesson_started after intervention → course_return_observed", () => {
    const input = makeInput({
      courseActivity: [
        {
          type: "lesson_started",
          occurredAt: new Date("2025-01-14T15:00:00Z"),
        },
      ],
    });

    expect(computeOutcome(input)).toBe("course_return_observed");
  });
});

// ─── 10. All outcome types are valid ─────────────────────────

describe("Outcome Engine — outcome type validation", () => {
  it("all possible outcomes are valid ObservedOutcome values", () => {
    const validOutcomes: ObservedOutcome[] = [
      "no_change",
      "responded",
      "blocker_reported",
      "opted_out",
      "course_return_observed",
      "lesson_progress_observed",
      "membership_deactivated",
      "insufficient_data",
    ];

    // Verify none contain "rescued"
    for (const outcome of validOutcomes) {
      expect(outcome).not.toContain("rescued");
      expect(outcome).not.toContain("rescue");
    }
  });
});
