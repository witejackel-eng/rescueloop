// Tests for the conservative Activation Rescue attribution engine.
//
// Key rules:
// - Course activity after notification = strongly_associated ($0)
// - Ordinary subsequent payments = estimated, NOT confirmed
// - One payment cannot be attributed twice (unique constraint)
// - Confirmed is NOT available for Activation Rescue in this phase

import { describe, it, expect } from "vitest";
import {
  classifyActivationProgressOutcome,
  classifyObservedPayment,
} from "@/lib/attribution/engine";

describe("attribution-engine (Activation Rescue)", () => {
  const now = new Date("2026-08-04T12:00:00Z");
  const oneHourAgo = new Date("2026-08-04T11:00:00Z");
  const oneDayAgo = new Date("2026-08-03T12:00:00Z");

  describe("classifyActivationProgressOutcome", () => {
    it("returns strongly_associated when course activity occurs within the policy window", () => {
      const result = classifyActivationProgressOutcome({
        interventionDeliveredAt: oneHourAgo,
        courseStartedAt: now,
        progressResumedAt: null,
      });

      expect(result.state).toBe("strongly_associated");
      expect(result.amountCents).toBe(0); // No financial value
    });

    it("returns rejected when activity occurs outside the policy window", () => {
      const twentyDaysAgo = new Date("2026-07-15T12:00:00Z");

      const result = classifyActivationProgressOutcome({
        interventionDeliveredAt: twentyDaysAgo,
        courseStartedAt: now,
        progressResumedAt: null,
      });

      expect(result.state).toBe("rejected");
    });

    it("returns unattributed when no intervention was delivered", () => {
      const result = classifyActivationProgressOutcome({
        interventionDeliveredAt: null,
        courseStartedAt: now,
        progressResumedAt: null,
      });

      expect(result.state).toBe("unattributed");
    });

    it("returns unattributed when course activity happened before delivery", () => {
      const result = classifyActivationProgressOutcome({
        interventionDeliveredAt: now,
        courseStartedAt: oneDayAgo,
        progressResumedAt: null,
      });

      expect(result.state).toBe("unattributed");
    });

    it("never claims financial value for course activity", () => {
      const result = classifyActivationProgressOutcome({
        interventionDeliveredAt: oneHourAgo,
        courseStartedAt: now,
        progressResumedAt: null,
      });

      expect(result.amountCents).toBe(0);
      expect(result.formula).toContain("No financial value");
    });
  });

  describe("classifyObservedPayment", () => {
    it("classifies as estimated when course activity occurred before payment", () => {
      const result = classifyObservedPayment({
        interventionDeliveredAt: oneDayAgo,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
        courseActivityOccurred: true,
      });

      // Estimated, NOT confirmed — ordinary payments are not confirmed revenue
      expect(result.state).toBe("estimated");
      expect(result.amountCents).toBe(7900);
      expect(result.formula).toContain("Not confirmed");
    });

    it("classifies as unattributed when no course activity occurred", () => {
      const result = classifyObservedPayment({
        interventionDeliveredAt: oneDayAgo,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
        courseActivityOccurred: false,
      });

      expect(result.state).toBe("unattributed");
    });

    it("NEVER classifies an ordinary payment as confirmed", () => {
      // Even with course activity + payment, it's estimated, not confirmed.
      // This is the key conservative rule for Activation Rescue.
      const result = classifyObservedPayment({
        interventionDeliveredAt: oneDayAgo,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
        courseActivityOccurred: true,
      });

      expect(result.state).not.toBe("confirmed");
    });

    it("includes evidence chain", () => {
      const result = classifyObservedPayment({
        interventionDeliveredAt: oneDayAgo,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
        courseActivityOccurred: true,
      });

      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence.some((e) => e.eventType === "payment_succeeded")).toBe(true);
    });

    it("includes a policy version", () => {
      const result = classifyObservedPayment({
        interventionDeliveredAt: oneDayAgo,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
        courseActivityOccurred: true,
      });

      expect(result.policyVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
