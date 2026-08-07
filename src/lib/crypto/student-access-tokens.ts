"server-only";
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
// - NEVER log raw token values
// - Non-enumerating errors: don't reveal whether token exists vs is expired vs is wrong experience

import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";

const TOKEN_BYTES = 32; // 256 bits of entropy

// ─── Non-enumerating error ────────────────────────────────────
// All token validation failures return the same generic error to prevent
// token enumeration attacks (don't reveal whether token exists, is expired,
// is revoked, or belongs to a different experience).

export class TokenValidationError extends Error {
  readonly code = "TOKEN_INVALID" as const;
  constructor() {
    super("Invalid or expired link");
  }
}

// ─── Validated token result ───────────────────────────────────

export interface ValidatedToken {
  tokenId: string;
  organizationId: string;
  interventionId: string;
  studentId: string;
  /** Whether this token was just consumed (first use) */
  consumedJustNow: boolean;
}

// ─── Hash function ────────────────────────────────────────────

/**
 * Hash a raw token using SHA-256.
 * Only the hash is stored — the raw token is never persisted.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── Token creation ───────────────────────────────────────────

/**
 * Generate a new opaque access token for a student intervention.
 * Returns the raw token (to put in the URL) and stores only its hash.
 * NEVER logs the raw token.
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

// ─── Token validation (non-enumerating) ───────────────────────

/**
 * Validate an opaque student access token with full checks.
 *
 * Validates: hash, expiry, revocation, tenant/intervention linkage, and
 * optionally the intended experience (experienceId).
 *
 * Returns non-enumerating errors — callers cannot distinguish between
 * "token doesn't exist", "token expired", "token revoked", or
 * "token belongs to different experience". This prevents enumeration attacks.
 *
 * Updates lastUsedAt on success (best-effort, non-blocking).
 *
 * NEVER logs the raw token value.
 */
export async function validateStudentAccessToken(
  token: string,
  options?: {
    /** If provided, verifies the token's intervention belongs to this experience */
    expectedExperienceId?: string;
  },
): Promise<ValidatedToken> {
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

  // Non-enumerating: any failure returns the same error
  if (!tokenRecord) {
    throw new TokenValidationError();
  }

  // Check expiration
  if (Date.now() >= tokenRecord.expiresAt.getTime()) {
    throw new TokenValidationError();
  }

  // Check revocation
  if (tokenRecord.revokedAt) {
    throw new TokenValidationError();
  }

  // Check experience linkage (if expectedExperienceId is provided)
  if (options?.expectedExperienceId) {
    const intervention = await db.intervention.findUnique({
      where: { id: tokenRecord.interventionId },
      select: {
        campaign: {
          select: {
            confirmedMapping: {
              select: {
                course: {
                  select: { externalExperienceId: true },
                },
              },
            },
          },
        },
      },
    });

    const experienceId =
      intervention?.campaign?.confirmedMapping?.course?.externalExperienceId;

    if (experienceId !== options.expectedExperienceId) {
      // Non-enumerating: wrong experience → same error
      throw new TokenValidationError();
    }
  }

  // Update lastUsedAt (best-effort, non-blocking)
  await db.studentAccessToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    tokenId: tokenRecord.id,
    organizationId: tokenRecord.organizationId,
    interventionId: tokenRecord.interventionId,
    studentId: tokenRecord.studentId,
    consumedJustNow: false,
  };
}

// ─── Legacy verify function (backward compatible) ─────────────

/**
 * Verify an opaque access token.
 * Returns the token record if valid, or null if invalid.
 * @deprecated Use validateStudentAccessToken() for new code — it throws
 *   non-enumerating errors and supports experience validation.
 */
export async function verifyStudentAccessToken(
  token: string,
): Promise<{
  tokenId: string;
  organizationId: string;
  interventionId: string;
  studentId: string;
} | null> {
  try {
    const result = await validateStudentAccessToken(token);
    return {
      tokenId: result.tokenId,
      organizationId: result.organizationId,
      interventionId: result.interventionId,
      studentId: result.studentId,
    };
  } catch {
    return null;
  }
}

// ─── Validate and consume ─────────────────────────────────────

/**
 * Validate a token and mark it as consumed on first use.
 * After consumption, the token is still valid for read-only access
 * but cannot be used to submit additional responses.
 *
 * Idempotent: if the token was already consumed, returns successfully
 * with consumedJustNow = false.
 */
export async function validateAndConsumeToken(
  token: string,
  options?: {
    expectedExperienceId?: string;
  },
): Promise<ValidatedToken> {
  const result = await validateStudentAccessToken(token, options);

  // If already consumed, return with consumedJustNow = false
  if (result.consumedJustNow) {
    return result;
  }

  // Check if already consumed
  const tokenRecord = await db.studentAccessToken.findUnique({
    where: { id: result.tokenId },
    select: { consumedAt: true },
  });

  if (tokenRecord?.consumedAt) {
    return { ...result, consumedJustNow: false };
  }

  // Consume: set consumedAt (only if not already set — race-safe via updateMany)
  const updateResult = await db.studentAccessToken.updateMany({
    where: {
      id: result.tokenId,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  return {
    ...result,
    consumedJustNow: updateResult.count > 0,
  };
}

// ─── Revoke tokens ────────────────────────────────────────────

/**
 * Consume a token for a one-time action.
 * After consumption, the token can no longer be used for that action.
 * @deprecated Use validateAndConsumeToken() for new code.
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
 * Revoke a specific token.
 * After revocation, the token can no longer be used at all.
 * Never logs the raw token.
 */
export async function revokeToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const result = await db.studentAccessToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
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
 * Revoke a specific token by its raw value.
 * @deprecated Use revokeToken() for new code.
 */
export const revokeStudentToken = revokeToken;
