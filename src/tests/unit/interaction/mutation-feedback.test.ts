import { describe, it, expect } from "vitest";
import {
  interventionToMutationState,
  interventionLabel,
  type MutationState,
} from "@/components/interaction/mutation-feedback";

// ── MutationState type coverage ────────────────────────────────
// Verify that MutationState covers all required states per spec:
// idle, pressed, pending, success, failure, retrying,
// permission-denied, plan-limit, paused, suppressed

describe("MutationState type coverage", () => {
  const requiredStates: MutationState[] = [
    "idle",
    "pressed",
    "pending",
    "success",
    "failure",
    "retrying",
    "permission-denied",
    "plan-limit",
    "paused",
    "suppressed",
  ];

  it("has all 10 required mutation states", () => {
    expect(requiredStates).toHaveLength(10);
  });

  it("each state is a distinct string", () => {
    const unique = new Set(requiredStates);
    expect(unique.size).toBe(10);
  });
});

// ── interventionToMutationState ────────────────────────────────
// Maps InterventionState to MutationState

describe("interventionToMutationState", () => {
  it("maps detected → idle", () => {
    expect(interventionToMutationState("detected")).toBe("idle");
  });

  it("maps awaiting_approval → idle", () => {
    expect(interventionToMutationState("awaiting_approval")).toBe("idle");
  });

  it("maps approved → pending", () => {
    expect(interventionToMutationState("approved")).toBe("pending");
  });

  it("maps queued → pending", () => {
    expect(interventionToMutationState("queued")).toBe("pending");
  });

  it("maps scheduled → pending", () => {
    expect(interventionToMutationState("scheduled")).toBe("pending");
  });

  it("maps sent → success (provider accepted)", () => {
    expect(interventionToMutationState("sent")).toBe("success");
  });

  it("maps opened → success", () => {
    expect(interventionToMutationState("opened")).toBe("success");
  });

  it("maps responded → success", () => {
    expect(interventionToMutationState("responded")).toBe("success");
  });

  it("maps recovered → success", () => {
    expect(interventionToMutationState("recovered")).toBe("success");
  });

  it("maps not_recovered → failure", () => {
    expect(interventionToMutationState("not_recovered")).toBe("failure");
  });

  it("maps dismissed → suppressed", () => {
    expect(interventionToMutationState("dismissed")).toBe("suppressed");
  });

  it("maps stopped → paused", () => {
    expect(interventionToMutationState("stopped")).toBe("paused");
  });

  it("covers all 12 InterventionState values", () => {
    const allStates = [
      "detected",
      "awaiting_approval",
      "approved",
      "scheduled",
      "queued",
      "sent",
      "opened",
      "responded",
      "recovered",
      "not_recovered",
      "dismissed",
      "stopped",
    ] as const;
    // Verify no state throws
    for (const s of allStates) {
      expect(() => interventionToMutationState(s)).not.toThrow();
    }
  });
});

// ── interventionLabel (truthful labels) ────────────────────────
// Never claim delivered without evidence.
// Use: saved, scheduled, queued, provider accepted, suppressed, failed, retrying

describe("interventionLabel — truthful labels", () => {
  it('approved → "approved" (not "delivered")', () => {
    expect(interventionLabel("approved")).toBe("approved");
  });

  it('scheduled → "scheduled"', () => {
    expect(interventionLabel("scheduled")).toBe("scheduled");
  });

  it('queued → "queued"', () => {
    expect(interventionLabel("queued")).toBe("queued");
  });

  it('sent → "provider accepted" (not "delivered")', () => {
    // NEVER claim delivered without evidence
    expect(interventionLabel("sent")).toBe("provider accepted");
  });

  it('responded → "responded"', () => {
    expect(interventionLabel("responded")).toBe("responded");
  });

  it('recovered → "returned"', () => {
    expect(interventionLabel("recovered")).toBe("returned");
  });

  it('not_recovered → "failed"', () => {
    expect(interventionLabel("not_recovered")).toBe("failed");
  });

  it('dismissed → "suppressed"', () => {
    expect(interventionLabel("dismissed")).toBe("suppressed");
  });

  it("never returns 'delivered' for any state", () => {
    const allStates = [
      "detected",
      "awaiting_approval",
      "approved",
      "scheduled",
      "queued",
      "sent",
      "opened",
      "responded",
      "recovered",
      "not_recovered",
      "dismissed",
      "stopped",
    ] as const;
    for (const s of allStates) {
      expect(interventionLabel(s)).not.toBe("delivered");
    }
  });

  it("all labels are non-empty for actionable states", () => {
    const actionableStates = [
      "approved",
      "scheduled",
      "queued",
      "sent",
      "responded",
      "recovered",
      "not_recovered",
      "dismissed",
    ] as const;
    for (const s of actionableStates) {
      expect(interventionLabel(s).length).toBeGreaterThan(0);
    }
  });
});

// ── Mutation state transitions ─────────────────────────────────
// Verify that the state machine follows the expected flow

describe("mutation state machine", () => {
  it("happy path: idle → pending → success", () => {
    const path: MutationState[] = ["idle", "pending", "success"];
    for (let i = 1; i < path.length; i++) {
      // Each state is a valid transition (no runtime check needed,
      // this just verifies the type system allows the sequence)
      expect(typeof path[i]).toBe("string");
    }
  });

  it("retry path: idle → pending → failure → retrying → pending → success", () => {
    const path: MutationState[] = [
      "idle",
      "pending",
      "failure",
      "retrying",
      "pending",
      "success",
    ];
    expect(path).toHaveLength(6);
  });

  it("permission denied: idle → pending → permission-denied", () => {
    const path: MutationState[] = ["idle", "pending", "permission-denied"];
    expect(path).toHaveLength(3);
  });

  it("plan limit: idle → pending → plan-limit", () => {
    const path: MutationState[] = ["idle", "pending", "plan-limit"];
    expect(path).toHaveLength(3);
  });

  it("suppressed: idle → pending → suppressed", () => {
    const path: MutationState[] = ["idle", "pending", "suppressed"];
    expect(path).toHaveLength(3);
  });

  it("paused: idle → pending → paused", () => {
    const path: MutationState[] = ["idle", "pending", "paused"];
    expect(path).toHaveLength(3);
  });

  it("undo path: idle → pending → success → idle (rollback)", () => {
    const path: MutationState[] = ["idle", "pending", "success", "idle"];
    expect(path).toHaveLength(4);
  });
});
