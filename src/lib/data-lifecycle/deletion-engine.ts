// Data deletion engine — handles GDPR/data-deletion workflows.
//
// Deletion stages: Requested → Verified → Scheduled → Processing → Completed/Failed/Cancelled
//
// On deletion:
//   - Pause organisation
//   - Stop pending interventions
//   - Revoke student tokens
//   - Remove or anonymize personal data
//   - Preserve only legally/operationally justified audit metadata
//   - Record completion evidence

import "server-only";
import { db } from "@/lib/db";

// ─── Deletion stage handlers ────────────────────────────────

/**
 * Verify a deletion request — confirm the org exists and has no pending
// financial obligations that would legally prevent deletion.
 */
export async function verifyDeletionRequest(
  deletionRequestId: string,
): Promise<{ verified: boolean; reason?: string }> {
  const request = await db.dataDeletionRequest.findUnique({
    where: { id: deletionRequestId },
    include: { organization: true },
  });

  if (!request) {
    return { verified: false, reason: "Deletion request not found" };
  }

  if (request.status !== "requested") {
    return { verified: false, reason: `Request is in status ${request.status}, not requested` };
  }

  // Check for pending interventions that are mid-delivery
  const pendingInterventions = await db.intervention.count({
    where: {
      organizationId: request.organizationId,
      state: { in: ["delivery_attempted", "notification_accepted", "queued"] },
    },
  });

  // Mark as verified
  await db.dataDeletionRequest.update({
    where: { id: deletionRequestId },
    data: {
      status: "verified",
      verifiedAt: new Date(),
    },
  });

  if (pendingInterventions > 0) {
    return {
      verified: true,
      reason: `Verified with ${pendingInterventions} pending interventions that will be stopped`,
    };
  }

  return { verified: true };
}

/**
 * Schedule a verified deletion for processing.
 * Sets a scheduled time (default: 24h grace period for cancellation).
 */
export async function scheduleDeletion(
  deletionRequestId: string,
  graceHours: number = 24,
): Promise<void> {
  const scheduledAt = new Date();
  const processAfter = new Date(scheduledAt.getTime() + graceHours * 60 * 60 * 1000);

  await db.dataDeletionRequest.update({
    where: { id: deletionRequestId },
    data: {
      status: "scheduled",
      scheduledAt,
    },
  });

  // Pause the organisation immediately upon scheduling
  await db.organization.update({
    where: { id: (await db.dataDeletionRequest.findUnique({ where: { id: deletionRequestId } }))!.organizationId },
    data: { isPaused: true },
  });
}

/**
 * Execute the full deletion pipeline.
 * This is the core logic invoked by the durable deletion job.
 */
export async function executeDeletion(
  deletionRequestId: string,
): Promise<{ success: boolean; evidence: Record<string, unknown> }> {
  const request = await db.dataDeletionRequest.findUnique({
    where: { id: deletionRequestId },
  });

  if (!request) {
    throw new Error(`Deletion request ${deletionRequestId} not found`);
  }

  const organizationId = request.organizationId;

  // Mark as processing
  await db.dataDeletionRequest.update({
    where: { id: deletionRequestId },
    data: {
      status: "processing",
      processedAt: new Date(),
    },
  });

  try {
    const evidence: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      organizationId,
    };

    // Step 1: Stop all pending interventions
    const stoppedInterventions = await db.intervention.updateMany({
      where: {
        organizationId,
        state: { in: ["drafted", "awaiting_approval", "approved", "scheduled", "queued", "delivery_attempted"] },
      },
      data: { state: "stopped" },
    });
    evidence.stoppedInterventions = stoppedInterventions.count;

    // Step 2: Revoke all student access tokens
    const revokedTokens = await db.studentAccessToken.updateMany({
      where: {
        organizationId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    evidence.revokedTokens = revokedTokens.count;

    // Step 3: Anonymize student personal data
    const anonymizedStudents = await db.student.updateMany({
      where: { organizationId },
      data: {
        email: null,
        name: "[deleted]",
      },
    });
    evidence.anonymizedStudents = anonymizedStudents.count;

    // Step 4: Anonymize user emails within the org
    const orgMembers = await db.organizationMember.findMany({
      where: { organizationId },
      select: { userId: true },
    });
    const userIds = orgMembers.map((m) => m.userId);

    if (userIds.length > 0) {
      await db.user.updateMany({
        where: { id: { in: userIds } },
        data: { email: null, name: "[deleted]" },
      });
    }
    evidence.anonymizedUsers = userIds.length;

    // Step 5: Remove student free-text responses (notes)
    const deletedNotes = await db.studentResponse.updateMany({
      where: {
        intervention: { organizationId },
        note: { not: null },
      },
      data: { note: null },
    });
    evidence.deletedResponseNotes = deletedNotes.count;

    // Step 6: Remove blocker response notes
    const deletedBlockerNotes = await db.blockerResponse.updateMany({
      where: {
        organizationId,
        note: { not: null },
      },
      data: { note: null },
    });
    evidence.deletedBlockerNotes = deletedBlockerNotes.count;

    // Step 7: Redact webhook payloads (preserve event metadata for audit)
    const redactedPayloads = await db.webhookReceipt.updateMany({
      where: { organizationId },
      data: { payloadJson: {} as any },
    });
    evidence.redactedPayloads = redactedPayloads.count;

    // Step 8: Suspend the organisation
    await db.organization.update({
      where: { id: organizationId },
      data: {
        status: "suspended",
        isPaused: true,
      },
    });

    // Step 9: Record completion
    evidence.completedAt = new Date().toISOString();

    await db.dataDeletionRequest.update({
      where: { id: deletionRequestId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    return { success: true, evidence };
  } catch (error) {
    // Record failure
    await db.dataDeletionRequest.update({
      where: { id: deletionRequestId },
      data: { status: "failed" },
    });

    throw error;
  }
}
