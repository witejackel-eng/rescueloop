// GET /api/internal/exceptions
//
// Exception summary across all tenants. Reads from real DB:
// DeadLetterEvent, OutboxEvent(failed), WebhookReceipt(failed), SyncExecution(failed).
// Internal-only — never exposed to creator-facing routes.
//
// Auth: withInternalAuth()

import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { db } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────

interface ExceptionSignal {
  id: string;
  category: "dead_letter" | "outbox_failed" | "webhook_failed" | "sync_failed";
  organizationId: string;
  eventType: string;
  errorMessage: string | null;
  attemptCount: number;
  occurredAt: string;
}

interface ExceptionSummary {
  totalDeadLetters: number;
  totalOutboxFailed: number;
  totalWebhookFailed: number;
  totalSyncFailed: number;
  totalOpenExceptions: number;
  affectedTenants: number;
}

interface OrgExceptionCount {
  organizationId: string;
  organizationName: string;
  deadLetters: number;
  outboxFailed: number;
  webhookFailed: number;
  syncFailed: number;
  total: number;
}

// ─── Route handler ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      // ─── Aggregate counts ──────────────────────────────────
      const [deadLetterCount, outboxFailedCount, webhookFailedCount, syncFailedCount] =
        await Promise.all([
          db.deadLetterEvent.count(),
          db.outboxEvent.count({ where: { state: "failed" } }),
          db.webhookReceipt.count({ where: { status: "failed" } }),
          db.syncExecution.count({ where: { state: "failed" } }),
        ]);

      // ─── Per-tenant breakdown ──────────────────────────────
      // Dead letters by org
      const deadLettersByOrg = await db.deadLetterEvent.groupBy({
        by: ["organizationId"],
        _count: { id: true },
      });

      // Outbox failures by org
      const outboxFailedByOrg = await db.outboxEvent.groupBy({
        by: ["organizationId"],
        where: { state: "failed" },
        _count: { id: true },
      });

      // Webhook failures by org
      const webhookFailedByOrg = await db.webhookReceipt.groupBy({
        by: ["organizationId"],
        where: { status: "failed" },
        _count: { id: true },
      });

      // Sync failures by org
      const syncFailedByOrg = await db.syncExecution.groupBy({
        by: ["organizationId"],
        where: { state: "failed" },
        _count: { id: true },
      });

      // Build org ID → name map
      const allOrgIds = new Set([
        ...deadLettersByOrg.map((d) => d.organizationId),
        ...outboxFailedByOrg.map((d) => d.organizationId),
        ...webhookFailedByOrg.map((d) => d.organizationId),
        ...syncFailedByOrg.map((d) => d.organizationId),
      ]);

      const orgs = await db.organization.findMany({
        where: { id: { in: [...allOrgIds] } },
        select: { id: true, name: true },
      });
      const orgNameMap = new Map(orgs.map((o) => [o.id, o.name]));

      // Merge per-tenant counts
      const tenantMap = new Map<string, OrgExceptionCount>();

      function ensureOrg(orgId: string) {
        if (!tenantMap.has(orgId)) {
          tenantMap.set(orgId, {
            organizationId: orgId,
            organizationName: orgNameMap.get(orgId) ?? "Unknown",
            deadLetters: 0,
            outboxFailed: 0,
            webhookFailed: 0,
            syncFailed: 0,
            total: 0,
          });
        }
        return tenantMap.get(orgId)!;
      }

      for (const d of deadLettersByOrg) {
        const org = ensureOrg(d.organizationId);
        org.deadLetters = d._count.id;
        org.total += d._count.id;
      }
      for (const d of outboxFailedByOrg) {
        const org = ensureOrg(d.organizationId);
        org.outboxFailed = d._count.id;
        org.total += d._count.id;
      }
      for (const d of webhookFailedByOrg) {
        const org = ensureOrg(d.organizationId);
        org.webhookFailed = d._count.id;
        org.total += d._count.id;
      }
      for (const d of syncFailedByOrg) {
        const org = ensureOrg(d.organizationId);
        org.syncFailed = d._count.id;
        org.total += d._count.id;
      }

      const byTenant = [...tenantMap.values()].sort((a, b) => b.total - a.total);

      // ─── Recent exception signals ──────────────────────────
      const [
        recentDeadLetters,
        recentOutboxFailed,
        recentWebhookFailed,
        recentSyncFailed,
      ] = await Promise.all([
        db.deadLetterEvent.findMany({
          orderBy: { deadLetteredAt: "desc" },
          take: 10,
          select: {
            id: true,
            organizationId: true,
            eventType: true,
            errorMessage: true,
            attemptCount: true,
            deadLetteredAt: true,
          },
        }),
        db.outboxEvent.findMany({
          where: { state: "failed" },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            organizationId: true,
            eventType: true,
            lastError: true,
            attemptCount: true,
            updatedAt: true,
          },
        }),
        db.webhookReceipt.findMany({
          where: { status: "failed" },
          orderBy: { receivedAt: "desc" },
          take: 10,
          select: {
            id: true,
            organizationId: true,
            eventType: true,
            lastError: true,
            attemptCount: true,
            receivedAt: true,
          },
        }),
        db.syncExecution.findMany({
          where: { state: "failed" },
          orderBy: { startedAt: "desc" },
          take: 10,
          select: {
            id: true,
            organizationId: true,
            provider: true,
            errorSummary: true,
            startedAt: true,
          },
        }),
      ]);

      const recentSignals: ExceptionSignal[] = [
        ...recentDeadLetters.map((d) => ({
          id: d.id,
          category: "dead_letter" as const,
          organizationId: d.organizationId,
          eventType: d.eventType,
          errorMessage: d.errorMessage,
          attemptCount: d.attemptCount,
          occurredAt: d.deadLetteredAt.toISOString(),
        })),
        ...recentOutboxFailed.map((d) => ({
          id: d.id,
          category: "outbox_failed" as const,
          organizationId: d.organizationId,
          eventType: d.eventType,
          errorMessage: d.lastError,
          attemptCount: d.attemptCount,
          occurredAt: d.updatedAt.toISOString(),
        })),
        ...recentWebhookFailed.map((d) => ({
          id: d.id,
          category: "webhook_failed" as const,
          organizationId: d.organizationId,
          eventType: d.eventType,
          errorMessage: d.lastError,
          attemptCount: d.attemptCount,
          occurredAt: d.receivedAt.toISOString(),
        })),
        ...recentSyncFailed.map((d) => ({
          id: d.id,
          category: "sync_failed" as const,
          organizationId: d.organizationId,
          eventType: `sync.${d.provider}`,
          errorMessage: d.errorSummary,
          attemptCount: 0,
          occurredAt: d.startedAt.toISOString(),
        })),
      ];

      // Sort by most recent first
      recentSignals.sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );

      const summary: ExceptionSummary = {
        totalDeadLetters: deadLetterCount,
        totalOutboxFailed: outboxFailedCount,
        totalWebhookFailed: webhookFailedCount,
        totalSyncFailed: syncFailedCount,
        totalOpenExceptions:
          deadLetterCount + outboxFailedCount + webhookFailedCount + syncFailedCount,
        affectedTenants: allOrgIds.size,
      };

      return NextResponse.json({
        summary,
        byTenant,
        recentSignals: recentSignals.slice(0, 20),
      });
    } catch (err) {
      console.error("[internal/exceptions] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}
