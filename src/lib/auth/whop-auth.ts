// Authentication and authorization helpers for Whop-embedded routes.
//
// Uses the official @whop/sdk pattern:
//   const { userId } = await whopsdk.verifyUserToken(request.headers)
//   const access = await whopsdk.users.checkAccess(companyId, { id: userId })
//
// Typed errors distinguish:
// - Missing token
// - Invalid or expired token
// - Whop API unavailable
// - Insufficient company access
// - Installation missing
//
// Never trusts companyId, experienceId, or userId from the URL alone.

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop/client";
import { db } from "@/lib/db";
import {
  APIError,
  APIConnectionError,
  AuthenticationError,
} from "@whop/sdk";

// ─── Typed auth errors ───────────────────────────────────────

export class MissingTokenError extends Error {
  constructor() {
    super("Missing Whop user token");
  }
}

export class InvalidTokenError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid or expired Whop user token");
  }
}

export class WhopUnavailableError extends Error {
  constructor(message?: string) {
    super(message ?? "Whop API is currently unavailable");
  }
}

export class InsufficientAccessError extends Error {
  constructor(resource: string) {
    super(`Not authorized for this ${resource}`);
  }
}

export class InstallationMissingError extends Error {
  constructor(companyId: string) {
    super(`RescueLoop is not installed for company ${companyId}`);
  }
}

// ─── Authenticated contexts ──────────────────────────────────

export interface AuthenticatedUser {
  whopUserId: string;
  internalUserId: string | null;
}

export interface CompanyAdminContext extends AuthenticatedUser {
  organizationId: string;
  companyId: string;
}

// ─── Core auth helpers ───────────────────────────────────────

/**
 * Require a verified Whop user token for the current request.
 *
 * Reads the token from the request headers using the SDK's built-in
 * header extraction. Throws typed errors for each failure mode.
 */
export async function requireWhopUser(): Promise<AuthenticatedUser> {
  const headerList = await headers();

  let userId: string;
  try {
    // The SDK's verifyUserToken accepts a Headers object directly and
    // extracts the token from the standard Whop header.
    const payload = await whopsdk.verifyUserToken(headerList, {
      dontThrow: true,
    });

    if (!payload || !payload.userId) {
      // Check if a token was even present to distinguish missing vs invalid
      const hasToken = headerList.get("x-whop-user-token");
      if (!hasToken) {
        throw new MissingTokenError();
      }
      throw new InvalidTokenError();
    }

    userId = payload.userId;
  } catch (error) {
    if (
      error instanceof MissingTokenError ||
      error instanceof InvalidTokenError
    ) {
      throw error;
    }
    // SDK connection errors mean Whop is unavailable
    if (
      error instanceof APIConnectionError ||
      error instanceof APIError
    ) {
      // Redact the full error to avoid leaking details; log server-side
      console.error("[whop-auth] API error during token verification", {
        type: error.constructor.name,
      });
      throw new WhopUnavailableError();
    }
    // Unknown error — treat as invalid token (redacted)
    console.error("[whop-auth] Unexpected error during token verification", {
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
    throw new InvalidTokenError("Token verification failed");
  }

  // Look up the internal user record
  const user = await db.user.findUnique({
    where: { whopUserId: userId },
    select: { id: true },
  });

  return {
    whopUserId: userId,
    internalUserId: user?.id ?? null,
  };
}

/**
 * Require administrative access to a specific Whop company.
 *
 * Uses the official checkAccess endpoint:
 *   const access = await whopsdk.users.checkAccess(companyId, { id: userId })
 *   require access.access_level === "admin"
 *
 * Never trusts the companyId from the URL alone — always verifies via Whop.
 */
export async function requireCompanyAdmin(
  companyId: string,
): Promise<CompanyAdminContext> {
  const user = await requireWhopUser();

  // Verify admin access via the official Whop API
  let accessLevel: string;
  try {
    const access = await whopsdk.users.checkAccess(companyId, {
      id: user.whopUserId,
    });
    accessLevel = access.access_level;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw new InvalidTokenError("Whop authentication failed");
    }
    if (error instanceof APIConnectionError) {
      throw new WhopUnavailableError();
    }
    // Other API errors (not found, permission denied) → no access
    console.error("[whop-auth] checkAccess failed", {
      companyId,
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
    throw new InsufficientAccessError("company");
  }

  if (accessLevel !== "admin") {
    throw new InsufficientAccessError("company");
  }

  // Find the RescueLoop organization associated with this Whop company
  const installation = await db.whopInstallation.findUnique({
    where: { whopCompanyId: companyId },
    include: {
      organization: {
        include: {
          members: {
            where: { userId: user.internalUserId ?? undefined },
        },
      },
    },
  },
  });

  if (!installation || installation.status !== "active") {
    throw new InstallationMissingError(companyId);
  }

  const member = installation.organization.members[0];
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new InsufficientAccessError("organization");
  }

  return {
    ...user,
    organizationId: installation.organization.id,
    companyId,
  };
}

/**
 * Require student access via an opaque access token.
 * The token is a random string; only its SHA-256 hash is stored.
 * Verifies: token exists, not expired, not revoked, organisation/
 * intervention/student relationships match, intervention is still
 * eligible for student interaction.
 */
export async function requireStudentInterventionAccess(
  token: string,
): Promise<{
  interventionId: string;
  organizationId: string;
  studentId: string;
  tokenId: string;
}> {
  const { verifyStudentAccessToken } = await import("@/lib/crypto/student-access-tokens");

  const tokenRecord = await verifyStudentAccessToken(token);
  if (!tokenRecord) {
    throw new Response(
      JSON.stringify({ error: "Invalid or expired link" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Verify the intervention still exists and is in a state that allows student interaction
  const intervention = await db.intervention.findUnique({
    where: { id: tokenRecord.interventionId },
    select: {
      id: true,
      organizationId: true,
      studentId: true,
      state: true,
    },
  });

  if (!intervention || intervention.organizationId !== tokenRecord.organizationId) {
    throw new Response(
      JSON.stringify({ error: "Intervention not found" }),
      {
        status: 404,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (intervention.studentId !== tokenRecord.studentId) {
    throw new Response(
      JSON.stringify({ error: "Token does not match student" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Check if the student has opted out
  const suppression = await db.suppression.findFirst({
    where: {
      organizationId: intervention.organizationId,
      studentId: intervention.studentId,
    },
  });

  if (suppression) {
    throw new Response(
      JSON.stringify({ error: "Reminders stopped" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return {
    interventionId: tokenRecord.interventionId,
    organizationId: tokenRecord.organizationId,
    studentId: tokenRecord.studentId,
    tokenId: tokenRecord.tokenId,
  };
}

// ─── Error → Response conversion ─────────────────────────────

export function authErrorToResponse(error: unknown): Response {
  if (error instanceof Response) return error;

  if (error instanceof MissingTokenError) {
    return Response.json({ error: "Missing user token" }, { status: 401 });
  }
  if (error instanceof InvalidTokenError) {
    return Response.json({ error: "Invalid or expired token" }, { status: 401 });
  }
  if (error instanceof WhopUnavailableError) {
    return Response.json({ error: "Authentication service unavailable" }, { status: 503 });
  }
  if (error instanceof InsufficientAccessError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof InstallationMissingError) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  console.error("[whop-auth] Unhandled auth error", {
    type: error instanceof Error ? error.constructor.name : "unknown",
  });
  return Response.json({ error: "Authentication failed" }, { status: 500 });
}
