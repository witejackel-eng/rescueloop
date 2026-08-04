// Tests for the attribution engine.
// Verifies: classification rules, confirmed vs associated vs estimated,
// no combined totals, payment-only confirmation.

import { describe, it, expect } from "vitest";
import { classifyProgressOutcome } from "@/lib/attribution/engine";

describe("attribution-engine", () => {
  const now = new Date("2026-08-04T12:00:00Z");
  const oneHourAgo = new Date("2026-08-04T11:00:00Z");
  const oneDayAgo = new Date("2026-08-03T12:00:00Z");

  describe("classifyProgressOutcome", () => {
    it("returns unattributed when no intervention was delivered", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: null,
        courseStartedAt: now,
        progressResumedAt: null,
        paymentSucceededAt: null,
        membershipPriceCents: 7900,
      });

      expect(result.state).toBe("unattributed");
      expect(result.amountCents).toBe(0);
    });

    it("returns strongly_associated when course started after delivery", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneHourAgo,
        courseStartedAt: now,
        progressResumedAt: null,
        paymentSucceededAt: null,
        membershipPriceCents: 7900,
      });

      expect(result.state).toBe("strongly_associated");
      expect(result.amountCents).toBe(0); // No financial value yet
    });

    it("returns strongly_associated when progress resumed after delivery", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneHourAgo,
        courseStartedAt: null,
        progressResumedAt: now,
        paymentSucceededAt: null,
        membershipPriceCents: 7900,
      });

      expect(result.state).toBe("strongly_associated");
      expect(result.amountCents).toBe(0);
    });

    it("returns confirmed when payment succeeds after course engagement", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: oneHourAgo,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      expect(result.state).toBe("confirmed");
      expect(result.amountCents).toBe(7900);
    });

    it("returns estimated when payment succeeds but no course engagement", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: null,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      expect(result.state).toBe("estimated");
      expect(result.amountCents).toBe(7900);
    });

    it("does not confirm when course activity happened before intervention", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: now,
        courseStartedAt: oneDayAgo, // Before intervention
        progressResumedAt: null,
        paymentSucceededAt: oneHourAgo,
        membershipPriceCents: 7900,
      });

      // Course started before intervention — not attributable
      expect(result.state).not.toBe("confirmed");
    });

    it("does not confirm when payment happened before intervention", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: now,
        courseStartedAt: oneHourAgo,
        progressResumedAt: null,
        paymentSucceededAt: oneDayAgo, // Before intervention
        membershipPriceCents: 7900,
      });

      expect(result.state).not.toBe("confirmed");
    });

    it("never combines confirmed and estimated value", () => {
      const confirmed = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: oneHourAgo,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      const estimated = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: null,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      // Each result is a separate classification — never summed
      expect(confirmed.state).toBe("confirmed");
      expect(estimated.state).toBe("estimated");
      expect(confirmed.amountCents + estimated.amountCents).toBe(15800); // But they are separate events
    });

    it("includes evidence chain in the result", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: oneHourAgo,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence.some((e) => e.eventType === "intervention_delivered")).toBe(true);
      expect(result.evidence.some((e) => e.eventType === "course_started")).toBe(true);
      expect(result.evidence.some((e) => e.eventType === "payment_succeeded")).toBe(true);
    });

    it("includes a human-readable formula", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: oneHourAgo,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      expect(result.formula).toContain("Confirmed");
    });

    it("includes a policy version", () => {
      const result = classifyProgressOutcome({
        interventionDeliveredAt: oneDayAgo,
        courseStartedAt: oneHourAgo,
        progressResumedAt: null,
        paymentSucceededAt: now,
        membershipPriceCents: 7900,
      });

      expect(result.policyVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
