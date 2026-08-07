// Authentication and authorization helpers for Whop-embedded routes.
//
// Uses the official @whop/sdk pattern:
//   const client = getWhopClient()
//   const { userId } = await client.verifyUserToken(request.headers)
//   const access = await client.users.checkAccess(companyId, { id: userId })
//
// Typed errors distinguish:
// - Missing token
// - Invalid or expired token
// - Whop API unavailable
// - Insufficient company access
// - Installation missing
// - Whop not configured (build-safe)
//
// Never trusts companyId, experienceId, or userId from the URL alone.

import "server-only";
import { headers } from "next/headers";
import { getWhopClient, isWhopReady } from "@/lib/whop/client";
import { ConfigurationError } from "@/lib/env/server";
import { db } from "@/lib/db";
import {
  APIError,
  APIConnectionError,
  AuthenticationError,
} from "@whop/sdk";

// ─── Typed auth errors ───────────────────────────────────────

export class MissingTokenError extends Error {
  readonly code = "MISSING_TOKEN" as const;
  constructor() {
    super("Missing Whop user token");
  }
}

export class InvalidTokenError extends Error {
  readonly code = "INVALID_TOKEN" as const;
  constructor(message?: string) {
    super(message ?? "Invalid or expired Whop user token");
  }
}

export class WhopUnavailableError extends Error {
  readonly code = "WHOP_UNAVAILABLE" as const;
  constructor(message?: string) {
    super(message ?? "Whop API is currently unavailable");
  }
}

export class InsufficientAccessError extends Error {
  readonly code = "INSUFFICIENT_ACCESS" as const;
  constructor(resource: string) {
    super(`Not authorized for this ${resource}`);
  }
}

export class InstallationMissingError extends Error {
  readonly code = "INSTALLATION_MISSING" as const;
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
 * Throws typed errors for each failure mode:
 * - ConfigurationError (503) if Whop is not configured
 * - MissingTokenError (401) if no token is present
 * - InvalidTokenError (401) if token verification fails
 * - WhopUnavailableError (503) if the Whop API is unreachable
 */
export async function requireWhopUser(): Promise<AuthenticatedUser> {
  // Check configuration BEFORE calling the SDK
  if (!isWhopReady()) {
    throw new ConfigurationError("Whop");
  }

  const client = getWhopClient();
  const headerList = await headers();

  let userId: string;
  try {
    const payload = await client.verifyUserToken(headerList, {
      dontThrow: true,
    });

    if (!payload || !payload.userId) {
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
      error instanceof InvalidTokenError ||
      error instanceof ConfigurationError
    ) {
      throw error;
    }
    if (error instanceof APIConnectionError || error instanceof APIError) {
      console.error("[whop-auth] API error during token verification", {
        type: error.constructor.name,
      });
      throw new WhopUnavailableError();
    }
    console.error("[whop-auth] Unexpected error during token verification", {
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
    throw new InvalidTokenError("Token verification failed");
  }

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
 * Uses the official checkAccess endpoint and requires access_level === "admin".
 */
export async function requireCompanyAdmin(
  companyId: string,
): Promise<CompanyAdminContext> {
  const user = await requireWhopUser();
  const client = getWhopClient();

  let accessLevel: string;
  try {
    const access = await client.users.checkAccess(companyId, {
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
    if (error instanceof ConfigurationError) {
      throw error;
    }
    console.error("[whop-auth] checkAccess failed", {
      companyId,
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
    throw new InsufficientAccessError("company");
  }

  if (accessLevel !== "admin") {
    throw new InsufficientAccessError("company");
  }

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
      JSON.stringify({ error: { code: "INVALID_OR_EXPIRED_LINK", message: "Invalid or expired link" } }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

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
      JSON.stringify({ error: { code: "NOT_FOUND", message: "Intervention not found" } }),
      {
        status: 404,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (intervention.studentId !== tokenRecord.studentId) {
    throw new Response(
      JSON.stringify({ error: { code: "TOKEN_SCOPE_MISMATCH", message: "Token does not match student" } }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const suppression = await db.suppression.findFirst({
    where: {
      organizationId: intervention.organizationId,
      studentId: intervention.studentId,
    },
  });

  if (suppression) {
    throw new Response(
      JSON.stringify({ error: { code: "REMINDERS_STOPPED", message: "Reminders stopped" } }),
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
// Maps typed auth errors to consistent HTTP responses with safe error codes.

export function authErrorToResponse(error: unknown): Response {
  if (error instanceof Response) return error;

  if (error instanceof ConfigurationError) {
    return Response.json(error.toResponse(), { status: 503 });
  }
  if (error instanceof MissingTokenError) {
    return Response.json(
      { error: { code: error.code, message: "Missing user token" } },
      { status: 401 },
    );
  }
  if (error instanceof InvalidTokenError) {
    return Response.json(
      { error: { code: error.code, message: "Invalid or expired token" } },
      { status: 401 },
    );
  }
  if (error instanceof WhopUnavailableError) {
    return Response.json(
      { error: { code: error.code, message: "Authentication service unavailable" } },
      { status: 503 },
    );
  }
  if (error instanceof InsufficientAccessError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: 403 },
    );
  }
  if (error instanceof InstallationMissingError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: 404 },
    );
  }

  console.error("[whop-auth] Unhandled auth error", {
    type: error instanceof Error ? error.constructor.name : "unknown",
  });
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Authentication failed" } },
    { status: 500 },
  );
}
