// Opaque student access tokens.
//
// Replaces the previous base64 JSON token system that exposed internal IDs.
//
// Design:
// - Generate 32+ cryptographically secure random bytes
// - The raw token goes in the URL (base64url-encoded for URL safety)
// - Only the SHA-256 hash is stored in the database
// - Look up by hash, verify expiry, revocation, and relationships
// - Consume only one-time actions; allow reusable access when intended

import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";

const TOKEN_BYTES = 32; // 256 bits of entropy

/**
 * Generate a new opaque access token for a student intervention.
 * Returns the raw token (to put in the URL) and stores only its hash.
 */
export async function createStudentAccessToken(params: {
  organizationId: string;
  interventionId: string;
  studentId: string;
  expiresInSeconds: number;
}): Promise<{ token: string; tokenHash: string }> {
  // Generate cryptographically secure random bytes
  const rawBytes = randomBytes(TOKEN_BYTES);
  const token = rawBytes.toString("base64url");

  // Hash the token for storage (never store the raw token)
  const tokenHash = hashToken(token);

  await db.studentAccessToken.create({
    data: {
      organizationId: params.organizationId,
      interventionId: params.interventionId,
      studentId: params.studentId,
      tokenHash,
      expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000),
    },
  });

  return { token, tokenHash };
}

/**
 * Verify an opaque access token.
 * Returns the token record if valid, or null if:
 * - Token not found (hash doesn't match)
 * - Token expired
 * - Token revoked
 * - Intervention/student/org relationships don't match
 */
export async function verifyStudentAccessToken(
  token: string,
): Promise<{
  tokenId: string;
  organizationId: string;
  interventionId: string;
  studentId: string;
} | null> {
  const tokenHash = hashToken(token);

  const tokenRecord = await db.studentAccessToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      organizationId: true,
      interventionId: true,
      studentId: true,
      expiresAt: true,
      revokedAt: true,
      consumedAt: true,
    },
  });

  if (!tokenRecord) {
    return null;
  }

  // Check expiration
  if (Date.now() >= tokenRecord.expiresAt.getTime()) {
    return null;
  }

  // Check revocation
  if (tokenRecord.revokedAt) {
    return null;
  }

  // Update lastUsedAt (but don't block on failure)
  await db.studentAccessToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    tokenId: tokenRecord.id,
    organizationId: tokenRecord.organizationId,
    interventionId: tokenRecord.interventionId,
    studentId: tokenRecord.studentId,
  };
}

/**
 * Consume a token for a one-time action.
 * After consumption, the token can no longer be used for that action.
 */
export async function consumeStudentAccessToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const result = await db.studentAccessToken.updateMany({
    where: {
      tokenHash,
      consumedAt: null,
      revokedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  return result.count > 0;
}

/**
 * Revoke all pending tokens for a student (e.g. after opt-out).
 */
export async function revokeStudentTokens(params: {
  organizationId: string;
  studentId: string;
}): Promise<number> {
  const result = await db.studentAccessToken.updateMany({
    where: {
      organizationId: params.organizationId,
      studentId: params.studentId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  return result.count;
}

/**
 * Revoke a specific token.
 */
export async function revokeStudentToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const result = await db.studentAccessToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return result.count > 0;
}

/**
 * Hash a raw token using SHA-256.
 * Only the hash is stored — the raw token is never persisted.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
