// ─────────────────────────────────────────────────────────────
// PX07 — Funnel Tracker
// Privacy-safe funnel event tracking + aggregation.
// ─────────────────────────────────────────────────────────────

import type {
  FunnelStep,
  FunnelEvent,
  FunnelStepAggregate,
  FunnelAnalysis,
} from "@/lib/types/growth";
import { ACTIVATION_FUNNEL, FUNNEL_STEP_LABELS } from "@/lib/types/growth";

// ── Event Tracking ───────────────────────────────────────────

let eventCounter = 0;

/** Create a privacy-safe funnel event */
export function trackFunnelStep(
  tenantId: string,
  step: FunnelStep,
  meta?: Record<string, string | number | boolean>
): FunnelEvent {
  eventCounter++;
  return {
    id: `fe_${String(eventCounter).padStart(5, "0")}`,
    tenantId,
    step,
    timestamp: new Date().toISOString(),
    meta,
  };
}

// ── Aggregation ──────────────────────────────────────────────

/** Build funnel analysis from raw events */
export function buildFunnelAnalysis(events: FunnelEvent[]): FunnelAnalysis {
  const stepCounts = new Map<FunnelStep, number>();

  for (const step of ACTIVATION_FUNNEL) {
    stepCounts.set(step, 0);
  }

  for (const event of events) {
    const current = stepCounts.get(event.step) ?? 0;
    stepCounts.set(event.step, current + 1);
  }

  const totalAtTop = stepCounts.get(ACTIVATION_FUNNEL[0]) ?? 0;
  const totalAtBottom = stepCounts.get(ACTIVATION_FUNNEL[ACTIVATION_FUNNEL.length - 1]) ?? 0;

  const steps: FunnelStepAggregate[] = ACTIVATION_FUNNEL.map((step, i) => {
    const count = stepCounts.get(step) ?? 0;
    const prevCount = i > 0 ? (stepCounts.get(ACTIVATION_FUNNEL[i - 1]) ?? 0) : count;
    const conversionRate = totalAtTop > 0 ? (count / totalAtTop) * 100 : 0;
    const dropoffRate = i > 0 && prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0;

    return {
      step,
      label: FUNNEL_STEP_LABELS[step],
      count,
      conversionRate,
      dropoffRate,
    };
  });

  const overallConversion = totalAtTop > 0 ? (totalAtBottom / totalAtTop) * 100 : 0;

  return {
    steps,
    totalAtTop,
    totalAtBottom,
    overallConversion,
    averageTimeToConvertHours: 72, // demo placeholder
  };
}

// ── Demo Data ───────────────────────────────────────────────

const DEMO_TENANTS = [
  "ten_001", "ten_002", "ten_003", "ten_004", "ten_005",
  "ten_006", "ten_007", "ten_008", "ten_009", "ten_010",
  "ten_011", "ten_012", "ten_013", "ten_014", "ten_015",
  "ten_016", "ten_017", "ten_018", "ten_019", "ten_020",
];

/**
 * Realistic funnel drop-off:
 * 20 installs → progressively fewer at each step
 */
function generateDemoEvents(): FunnelEvent[] {
  const events: FunnelEvent[] = [];

  // How many tenants reach each step (out of 20 at top)
  const reachCount: Record<FunnelStep, number> = {
    install: 20,
    permission_complete: 17,
    first_sync_started: 16,
    first_sync_complete: 14,
    first_candidate: 11,
    first_review: 9,
    first_approval: 7,
    first_notification_accepted: 6,
    first_student_response: 5,
    first_observed_return: 3,
    subscription_activated: 2,
    subscription_cancelled: 1,
    referral_source: 4,
  };

  const baseDate = new Date("2025-01-01T00:00:00Z");

  for (const step of ACTIVATION_FUNNEL) {
    const count = reachCount[step];
    for (let i = 0; i < count; i++) {
      const tenantId = DEMO_TENANTS[i];
      const stepIndex = ACTIVATION_FUNNEL.indexOf(step);
      // Each step adds ~2 days on average
      const offsetMs = stepIndex * 2 * 24 * 60 * 60 * 1000 + i * 3600 * 1000;
      const timestamp = new Date(baseDate.getTime() + offsetMs).toISOString();

      events.push({
        id: `fe_demo_${step}_${i}`,
        tenantId,
        step,
        timestamp,
      });
    }
  }

  return events;
}

let _demoEvents: FunnelEvent[] | null = null;

/** Get demo funnel events (cached) */
export function getDemoFunnelEvents(): FunnelEvent[] {
  if (!_demoEvents) {
    _demoEvents = generateDemoEvents();
  }
  return _demoEvents;
}

/** Get demo funnel analysis */
export function getDemoFunnelAnalysis(): FunnelAnalysis {
  return buildFunnelAnalysis(getDemoFunnelEvents());
}
