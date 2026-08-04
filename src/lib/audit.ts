"server-only";
// Audit log helper. Every administrative mutation must create an audit entry.

import { db } from "@/lib/db";
import type { AuditAction } from "@prisma/client";

export async function recordAuditEvent(params: {
  organizationId: string;
  actorId?: string;
  action: AuditAction;
  objectType: string;
  objectId: string;
  interventionId?: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  return db.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId ?? "system",
      action: params.action,
      objectType: params.objectType,
      objectId: params.objectId,
      interventionId: params.interventionId,
      previousState: params.previousState,
      newState: params.newState,
      reason: params.reason,
      metadataJson: (params.metadata ?? {}) as any,
    },
  });
}
