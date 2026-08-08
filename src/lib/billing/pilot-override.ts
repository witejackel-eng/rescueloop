import "server-only";
// Pilot Override — audited server-side entitlement.
// Does NOT fake a Whop membership/payment event.

import type { PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export interface CreatePilotOverrideParams {
  organizationId: string;
  tier: PlanTier;
  grantorId: string;
  expiresAt: Date;
  notes: string;
}

export interface RevokePilotOverrideParams {
  overrideId: string;
  revocatorId: string;
  reason: string;
}

export async function createPilotOverride(
  params: CreatePilotOverrideParams,
): Promise<{ id: string; tier: PlanTier; expiresAt: Date }> {
  const { organizationId, tier, grantorId, expiresAt, notes } = params;

  const override = await db.planOverride.create({
    data: {
      organizationId,
      tier: tier as string,
      metric: "pilot_override",
      overrideLimit: 0,
      reason: "pilot_grant",
      appliedBy: grantorId,
      grantorId,
      approvedBy: grantorId,
      notes,
      startsAt: new Date(),
      expiresAt,
    },
  });

  await db.organization.update({
    where: { id: organizationId },
    data: {
      entitlementState: "pilot_override",
      planTier: tier as string,
    },
  });

  await recordAuditEvent({
    organizationId,
    actorId: grantorId,
    action: "created",
    objectType: "pilot_override",
    objectId: override.id,
    newState: `pilot_override/${tier}`,
    reason: `Pilot override granted: ${notes}`,
  });

  return { id: override.id, tier, expiresAt };
}

export async function revokePilotOverride(
  params: RevokePilotOverrideParams,
): Promise<{ id: string; revoked: boolean }> {
  const { overrideId, revocatorId, reason } = params;

  const override = await db.planOverride.findUnique({
    where: { id: overrideId },
  });

  if (!override) {
    throw new Error(`Pilot override ${overrideId} not found`);
  }

  await db.planOverride.update({
    where: { id: overrideId },
    data: {
      revokedAt: new Date(),
      revocationReason: reason,
    },
  });

  const activeOverrides = await db.planOverride.count({
    where: {
      organizationId: override.organizationId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (activeOverrides === 0) {
    await db.organization.update({
      where: { id: override.organizationId },
      data: {
        entitlementState: "inactive",
      },
    });
  }

  await recordAuditEvent({
    organizationId: override.organizationId,
    actorId: revocatorId,
    action: "deleted",
    objectType: "pilot_override",
    objectId: overrideId,
    previousState: `pilot_override/${override.tier}`,
    newState: "revoked",
    reason: `Pilot override revoked: ${reason}`,
  });

  return { id: overrideId, revoked: true };
}

export async function getActivePilotOverride(organizationId: string) {
  return db.planOverride.findFirst({
    where: {
      organizationId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeExpiredPilotOverrides() {
  const expired = await db.planOverride.findMany({
    where: {
      revokedAt: null,
      expiresAt: { lte: new Date() },
    },
  });

  for (const override of expired) {
    await db.planOverride.update({
      where: { id: override.id },
      data: {
        revokedAt: new Date(),
        revocationReason: "expired",
      },
    });

    const remainingActive = await db.planOverride.count({
      where: {
        organizationId: override.organizationId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (remainingActive === 0) {
      const org = await db.organization.findUnique({
        where: { id: override.organizationId },
        select: { entitlementState: true },
      });
      if (org?.entitlementState === "pilot_override") {
        await db.organization.update({
          where: { id: override.organizationId },
          data: { entitlementState: "inactive" },
        });
      }
    }
  }

  return expired.length;
}
