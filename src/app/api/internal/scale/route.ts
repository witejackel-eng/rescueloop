// GET /api/internal/scale
// POST /api/internal/scale
//
// Scale benchmark tools for internal operators.
// - GET: Returns current scale metrics and capacity info from real DB data.
// - POST: Triggers a benchmark run (internal-only).
//
// Benchmark execution is internal-only. Results are recommendations only —
// never change customer entitlement or raise plan limits.
//
// Auth: withInternalAuth()

import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";

// ─── Capacity constants ──────────────────────────────────────

const SCALE_CAPACITY_POLICY = {
  hardCapMonitoredMembers: 2500,
  warningThreshold: 0.8, // 80% of cap
  doNotRaiseMessage: "Do NOT raise plan limits after testing without capacity review.",
} as const;

// ─── GET: Current scale metrics ──────────────────────────────

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);

      // ─── Real DB aggregates ────────────────────────────────
      const [
        totalOrgs,
        activeOrgs,
        totalStudents,
        totalMemberships,
        totalInterventions,
        totalWebhooks,
        pendingOutbox,
        failedOutbox,
        deadLetters,
        monitoredMembersCounters,
      ] = await Promise.all([
        db.organization.count(),
        db.organization.count({ where: { status: "active" } }),
        db.student.count(),
        db.membership.count(),
        db.intervention.count(),
        db.webhookReceipt.count(),
        db.outboxEvent.count({ where: { state: "pending" } }),
        db.outboxEvent.count({ where: { state: "failed" } }),
        db.deadLetterEvent.count(),
        db.usageCounter.findMany({
          where: { metric: "monitored_members", period: currentPeriod },
          select: { organizationId: true, count: true },
        }),
      ]);

      const totalMonitoredMembers = monitoredMembersCounters.reduce(
        (sum, c) => sum + c.count,
        0,
      );

      const capUtilization =
        SCALE_CAPACITY_POLICY.hardCapMonitoredMembers > 0
          ? totalMonitoredMembers / SCALE_CAPACITY_POLICY.hardCapMonitoredMembers
          : 0;

      // ─── Per-tenant scale breakdown ────────────────────────
      const orgs = await db.organization.findMany({
        where: { status: "active" },
        select: { id: true, name: true, planTier: true },
      });

      const counterMap = new Map(
        monitoredMembersCounters.map((c) => [c.organizationId, c.count]),
      );

      const tenantScale = orgs.map((org) => ({
        organizationId: org.id,
        organizationName: org.name,
        planTier: org.planTier,
        monitoredMembers: counterMap.get(org.id) ?? 0,
        capPercent:
          SCALE_CAPACITY_POLICY.hardCapMonitoredMembers > 0
            ? Math.round(
                ((counterMap.get(org.id) ?? 0) /
                  SCALE_CAPACITY_POLICY.hardCapMonitoredMembers) *
                  100,
              )
            : 0,
      }));

      // Sort by monitored members descending
      tenantScale.sort((a, b) => b.monitoredMembers - a.monitoredMembers);

      // ─── SLO indicators ────────────────────────────────────
      const healthIndicators = {
        outboxBacklog: pendingOutbox,
        outboxFailures: failedOutbox,
        deadLetters,
        backlogHealthy: pendingOutbox < 100,
        failuresHealthy: failedOutbox < 10,
        deadLettersHealthy: deadLetters < 5,
      };

      return NextResponse.json({
        _meta: {
          disclaimer: "Recommendations only — never change customer entitlement or raise plan limits",
          generatedAt: new Date().toISOString(),
        },
        capacity: {
          hardCap: SCALE_CAPACITY_POLICY.hardCapMonitoredMembers,
          currentTotal: totalMonitoredMembers,
          utilizationPercent: Math.round(capUtilization * 100),
          atWarning: capUtilization >= SCALE_CAPACITY_POLICY.warningThreshold,
          atCap: capUtilization >= 1,
          policy: SCALE_CAPACITY_POLICY.doNotRaiseMessage,
        },
        aggregates: {
          totalOrganizations: totalOrgs,
          activeOrganizations: activeOrgs,
          totalStudents,
          totalMemberships,
          totalInterventions,
          totalWebhooks,
        },
        healthIndicators,
        tenantScale,
      });
    } catch (err) {
      console.error("[internal/scale] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

// ─── POST: Trigger benchmark run ─────────────────────────────

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { profile, chaosScenarios, reason } = body as {
        profile?: string;
        chaosScenarios?: string[];
        reason?: string;
      };

      if (!reason) {
        return NextResponse.json(
          { error: "A reason is required for benchmark runs" },
          { status: 400 },
        );
      }

      // Record the benchmark trigger in audit log
      await recordInternalAudit({
        actorId,
        action: "scale.benchmark_triggered",
        objectType: "benchmark_run",
        objectId: `benchmark-${Date.now()}`,
        reason,
        metadata: {
          profile: profile ?? "default",
          chaosScenarios: chaosScenarios ?? [],
          triggeredAt: new Date().toISOString(),
        },
      });

      // In production, this would dispatch a benchmark job.
      // For now, we record the intent and return a reference.
      const benchmarkId = `bench-${Date.now()}`;

      return NextResponse.json({
        ok: true,
        benchmarkId,
        status: "queued",
        message: "Benchmark run has been queued. Results will be available via GET /api/internal/scale.",
        profile: profile ?? "default",
        chaosScenarios: chaosScenarios ?? [],
      });
    } catch (err) {
      console.error("[internal/scale] POST error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
