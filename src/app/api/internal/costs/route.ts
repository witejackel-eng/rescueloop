// GET /api/internal/costs
//
// Per-tenant cost estimates derived from real UsageCounter data.
// Returns cost breakdown with margin. Internal-only — never exposed
// to creator-facing routes.
//
// Auth: withInternalAuth()

import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { db } from "@/lib/db";
import type { PlanTier } from "@prisma/client";

// ─── Rate card (internal, not exposed to creators) ───────────

const RATE_CARD = {
  rescue: { priceCents: 2900, infraCostCents: 180, paymentCostPct: 0.029, supportCostCents: 50 },
  growth: { priceCents: 5900, infraCostCents: 420, paymentCostPct: 0.029, supportCostCents: 120 },
  scale: { priceCents: 11900, infraCostCents: 850, paymentCostPct: 0.029, supportCostCents: 280 },
  internal: { priceCents: 0, infraCostCents: 0, paymentCostPct: 0, supportCostCents: 0 },
  pilot: { priceCents: 0, infraCostCents: 0, paymentCostPct: 0, supportCostCents: 0 },
} as const;

interface TenantCostEstimate {
  organizationId: string;
  organizationName: string;
  planTier: string;
  monitoredMembers: number;
  revenue: { priceCents: number };
  costs: {
    infra: number;
    payment: number;
    support: number;
    total: number;
  };
  margin: {
    cents: number;
    percent: number;
  };
}

// ─── Route handler ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      // Get all organizations with their plan tier
      const orgs = await db.organization.findMany({
        where: { status: "active" },
        select: { id: true, name: true, planTier: true },
      });

      // Get current period usage counters
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const counters = await db.usageCounter.findMany({
        where: { period: currentPeriod, metric: "monitored_members" },
        select: { organizationId: true, count: true },
      });

      // Get actual MRR from SubscriptionEntitlement records
      // SubscriptionEntitlement stores planTier but not priceCents directly,
      // so we count active entitlements per org and look up plan price.
      const PLAN_PRICE_CENTS: Record<string, number> = { rescue: 2900, growth: 5900, scale: 11900 };
      const entitlements = await db.subscriptionEntitlement.findMany({
        where: { state: "active" },
        select: { organizationId: true, planTier: true },
      });
      const mrrByOrg = new Map<string, number>();
      for (const ent of entitlements) {
        const prev = mrrByOrg.get(ent.organizationId) ?? 0;
        mrrByOrg.set(ent.organizationId, prev + (PLAN_PRICE_CENTS[ent.planTier] ?? 0));
      }

      const counterMap = new Map(counters.map((c) => [c.organizationId, c.count]));

      // Build cost estimates for each tenant
      const estimates: TenantCostEstimate[] = orgs.map((org) => {
        const planTier = (org.planTier ?? "rescue") as PlanTier;
        const rate = RATE_CARD[planTier] ?? RATE_CARD.rescue;
        const monitoredMembers = counterMap.get(org.id) ?? 0;

        // Payment processing cost derived from actual subscription MRR.
        // Falls back to plan price when no entitlement records exist.
        // NEVER uses memberCount × planPrice (that is a known buggy pattern).
        const actualMrr = mrrByOrg.get(org.id);
        const estimatedMrrCents = actualMrr ?? rate.priceCents;
        const paymentCost = Math.round(estimatedMrrCents * rate.paymentCostPct);

        const totalCost = rate.infraCostCents + paymentCost + rate.supportCostCents;
        const marginCents = rate.priceCents - totalCost;
        const marginPercent =
          rate.priceCents > 0 ? Math.round((marginCents / rate.priceCents) * 100) : 0;

        return {
          organizationId: org.id,
          organizationName: org.name,
          planTier,
          monitoredMembers,
          revenue: { priceCents: rate.priceCents },
          costs: {
            infra: rate.infraCostCents,
            payment: paymentCost,
            support: rate.supportCostCents,
            total: totalCost,
          },
          margin: {
            cents: marginCents,
            percent: marginPercent,
          },
        };
      });

      // Summary
      const totalRevenue = estimates.reduce((sum, e) => sum + e.revenue.priceCents, 0);
      const totalCost = estimates.reduce((sum, e) => sum + e.costs.total, 0);
      const totalMargin = totalRevenue - totalCost;
      const marginPercent =
        totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

      return NextResponse.json({
        _meta: {
          disclaimer: "Internal estimate — not accounting truth. Payment processing derived from actual subscription MRR where available.",
          period: currentPeriod,
          rateCardVersion: "v3-2025-01",
        },
        estimates,
        summary: {
          tenantCount: estimates.length,
          totalRevenueCents: totalRevenue,
          totalCostCents: totalCost,
          totalMarginCents: totalMargin,
          marginPercent,
        },
      });
    } catch (err) {
      console.error("[internal/costs] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}
