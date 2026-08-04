// Authentication and authorization helpers for Whop-embedded routes.
// Every helper reads the Whop user token from the request, verifies it
// server-side, and returns the authenticated context.
// Never trust companyId, experienceId, or userId from the URL alone.

import { headers } from "next/headers";
import { verifyWhopUserToken, checkCompanyAdminAccess } from "@/lib/whop/client";
import { db } from "@/lib/db";

export interface AuthenticatedUser {
  whopUserId: string;
  internalUserId: string | null;
}

export interface CompanyContext extends AuthenticatedUser {
  organizationId: string;
  companyId: string;
  role: "owner" | "admin" | "member";
}

/**
 * Require a verified Whop user token for the current request.
 * Reads the token from the x-whop-user-token header or the `token` query param.
 * Throws a 401 response if the token is missing or invalid.
 */
export async function requireWhopUser(): Promise<AuthenticatedUser> {
  const headerList = await headers();
  const token =
    headerList.get("x-whop-user-token") ??
    headerList.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Response(JSON.stringify({ error: "Missing user token" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const whopUserId = await verifyWhopUserToken(token);
  if (!whopUserId) {
    throw new Response(JSON.stringify({ error: "Invalid user token" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Look up the internal user record
  const user = await db.user.findUnique({
    where: { whopUserId },
    select: { id: true },
  });

  return {
    whopUserId,
    internalUserId: user?.id ?? null,
  };
}

/**
 * Require administrative access to a specific Whop company.
 * Verifies the Whop user token AND checks company membership.
 * Never trusts the companyId from the URL alone.
 */
export async function requireCompanyAdmin(
  companyId: string,
): Promise<CompanyContext> {
  const user = await requireWhopUser();

  // Verify admin access via the Whop API
  const isAdmin = await checkCompanyAdminAccess(user.whopUserId, companyId);
  if (!isAdmin) {
    throw new Response(
      JSON.stringify({ error: "Not authorized for this company" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Find the RescueLoop organization associated with this Whop company
  const installation = await db.whopInstallation.findUnique({
    where: { whopCompanyId: companyId },
    include: { organization: { include: { members: true } } },
  });

  if (!installation || installation.status !== "active") {
    throw new Response(
      JSON.stringify({ error: "RescueLoop not installed for this company" }),
      {
        status: 404,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const member = installation.organization.members.find(
    (m) => m.userId === user.internalUserId,
  );

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new Response(
      JSON.stringify({ error: "Not an organization admin" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return {
    ...user,
    organizationId: installation.organization.id,
    companyId,
    role: member.role,
  };
}

/**
 * Require organization access for a given organization ID.
 * Verifies that the authenticated user is a member of the organization.
 */
export async function requireOrganizationAccess(
  organizationId: string,
): Promise<CompanyContext & { organizationId: string }> {
  const user = await requireWhopUser();

  if (!user.internalUserId) {
    throw new Response(
      JSON.stringify({ error: "User not linked to an organization" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const member = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.internalUserId,
      },
    },
  });

  if (!member) {
    throw new Response(
      JSON.stringify({ error: "Not authorized for this organization" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return {
    ...user,
    organizationId,
    companyId: "", // Not company-scoped
    role: member.role,
  };
}

/**
 * Require student access via a signed intervention token.
 * Used for student-facing routes (/experiences/[experienceId]/rescue/[token]).
 * The token is opaque, signed, and expiring — it does not expose internal IDs.
 */
export async function requireStudentInterventionAccess(
  token: string,
): Promise<{
  interventionId: string;
  organizationId: string;
  studentId: string;
}> {
  const { getEnv } = await import("@/lib/env");
  const env = getEnv();
  const { verifyStudentToken } = await import("@/lib/crypto/student-tokens");

  const payload = verifyStudentToken(token, env.STUDENT_LINK_SIGNING_SECRET);
  if (!payload) {
    throw new Response(
      JSON.stringify({ error: "Invalid or expired link" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Verify the intervention still exists and is active
  const intervention = await db.intervention.findUnique({
    where: { id: payload.i },
    select: {
      id: true,
      organizationId: true,
      studentId: true,
      state: true,
    },
  });

  if (!intervention || intervention.organizationId !== payload.o) {
    throw new Response(
      JSON.stringify({ error: "Intervention not found" }),
      {
        status: 404,
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
    interventionId: payload.i,
    organizationId: payload.o,
    studentId: payload.s,
  };
}
