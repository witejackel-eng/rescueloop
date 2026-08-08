import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ─── Internal audit trail ────────────────────────────────────
// Every action taken by internal operators must create an audit record
// with: actor identity, reason, previous/new state, tenant scope.

export interface InternalAuditParams {
  actorId: string;
  action: string;
  objectType: string;
  objectId: string;
  tenantScope?: string;
  previousState?: string;
  newState?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record an internal audit event. Every internal mutation MUST call this.
 * Failures are logged but never throw — audit should never break the caller.
 */
export async function recordInternalAudit(params: InternalAuditParams): Promise<void> {
  try {
    await db.internalAuditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        objectType: params.objectType,
        objectId: params.objectId,
        tenantScope: params.tenantScope ?? null,
        previousState: params.previousState ?? null,
        newState: params.newState ?? null,
        reason: params.reason,
        metadataJson: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    // Audit failures must never break the primary operation.
    // Log prominently so ops can investigate.
    console.error("[internal-audit] FAILED to record audit:", err, params);
  }
}
