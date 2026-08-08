// Server-side auth guard for /dashboard/[companyId] routes.
//
// This is the SINGLE entry point for company access control in connected mode.
// Every dashboard page MUST call this guard before rendering any content.
//
// INVARIANTS:
//   1. In fixture mode (RESCUELOOP_FIXTURE_MODE=true): returns a fixture context
//      with the well-known fixture company ID. Validates the URL companyId matches.
//   2. In connected mode: validates the Whop user token, checks company
//      installation, verifies tenant/company match. NEVER falls through to
//      fixture data.
//   3. If auth fails in connected mode, throws a typed error — the caller
//      must render an error card or re-throw. Content is NEVER rendered.
//   4. The companyId from the URL is NEVER trusted without authorization.
//      In connected mode, the server verifies the user has admin access to
//      that specific companyId before returning any data.
//
// This module is server-only. It must never be imported from client code.

import "server-only";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";
import {
  requireCompanyAdmin,
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
  InstallationMissingError,
} from "@/lib/auth/whop-auth";
import { ConfigurationError } from "@/lib/env/server";

// ─── Result types ────────────────────────────────────────────

export interface ConnectedCompanyContext {
  mode: "connected";
  /** The verified organization ID from the database. */
  organizationId: string;
  /** The verified company ID (same as URL param after auth). */
  companyId: string;
  /** The authenticated Whop user ID. */
  whopUserId: string;
}

export interface FixtureCompanyContext {
  mode: "fixture";
  /** Sentinel fixture organization ID — do NOT use for real DB queries. */
  organizationId: "org_fixture";
  /** The well-known fixture company ID. */
  companyId: typeof FIXTURE_COMPANY_ID;
}

export type CompanyAccessContext = ConnectedCompanyContext | FixtureCompanyContext;

// ─── Auth error type ─────────────────────────────────────────

/**
 * Thrown when access is denied in connected mode.
 * Contains enough information to render the correct error card.
 */
export class CompanyAccessDeniedError extends Error {
  readonly code:
    | "MISSING_TOKEN"
    | "INVALID_TOKEN"
    | "WHOP_UNAVAILABLE"
    | "INSUFFICIENT_ACCESS"
    | "INSTALLATION_MISSING"
    | "NOT_CONFIGURED"
    | "FIXTURE_COMPANY_MISMATCH";
  readonly originalError?: Error;

  constructor(
    code: CompanyAccessDeniedError["code"],
    message: string,
    originalError?: Error,
  ) {
    super(message);
    this.code = code;
    this.name = "CompanyAccessDeniedError";
    this.originalError = originalError;
  }

  static missingToken(): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "MISSING_TOKEN",
      "Missing Whop user token. Open this page from your Whop dashboard.",
    );
  }

  static invalidToken(err?: Error): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "INVALID_TOKEN",
      "Invalid or expired Whop user token. Please reopen from your Whop dashboard.",
      err,
    );
  }

  static whopUnavailable(err?: Error): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "WHOP_UNAVAILABLE",
      "Whop API is currently unavailable. Please try again in a moment.",
      err,
    );
  }

  static insufficientAccess(err?: Error): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "INSUFFICIENT_ACCESS",
      "You do not have admin access to this company.",
      err,
    );
  }

  static installationMissing(companyId: string): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "INSTALLATION_MISSING",
      `RescueLoop is not installed for company ${companyId}.`,
    );
  }

  static notConfigured(): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "NOT_CONFIGURED",
      "The Whop integration is not configured for this environment.",
    );
  }

  static fixtureCompanyMismatch(urlCompanyId: string): CompanyAccessDeniedError {
    return new CompanyAccessDeniedError(
      "FIXTURE_COMPANY_MISMATCH",
      `In fixture mode, the URL companyId "${urlCompanyId}" does not match the configured fixture company.`,
    );
  }
}

// ─── Main guard function ─────────────────────────────────────

/**
 * Require verified access to a company dashboard.
 *
 * This is the SINGLE auth guard for all /dashboard/[companyId] routes.
 *
 * - Fixture mode: verifies URL companyId matches FIXTURE_COMPANY_ID,
 *   returns a FixtureCompanyContext. No Whop calls are made.
 * - Connected mode: calls requireCompanyAdmin for the full auth chain,
 *   returns a ConnectedCompanyContext with verified organizationId.
 * - Unconfigured: throws CompanyAccessDeniedError with NOT_CONFIGURED code.
 *
 * CRITICAL: In connected mode, this function NEVER returns fixture data.
 * If auth fails, it throws. The caller MUST handle the throw —
 * either by rendering an error card or re-throwing.
 *
 * @param companyId - The companyId from the URL (NEVER trusted without auth)
 * @throws {CompanyAccessDeniedError} if access is denied
 */
export async function requireCompanyAccess(
  companyId: string,
): Promise<CompanyAccessContext> {
  const mode = getProviderMode();

  // ─── Unconfigured mode → error ────────────────────────────
  if (mode === "unconfigured") {
    throw CompanyAccessDeniedError.notConfigured();
  }

  // ─── Fixture mode → verify companyId, return fixture context ──
  if (mode === "fixture") {
    // Strict: never let an arbitrary companyId access fixture data.
    if (companyId !== FIXTURE_COMPANY_ID) {
      throw CompanyAccessDeniedError.fixtureCompanyMismatch(companyId);
    }
    return {
      mode: "fixture",
      organizationId: "org_fixture",
      companyId: FIXTURE_COMPANY_ID,
    };
  }

  // ─── Connected (Whop) mode → full auth chain ──────────────
  // This is the fail-closed path. If ANY step fails, we throw.
  // We NEVER fall through to fixture data.
  try {
    const ctx = await requireCompanyAdmin(companyId);
    return {
      mode: "connected",
      organizationId: ctx.organizationId,
      companyId: ctx.companyId,
      whopUserId: ctx.whopUserId,
    };
  } catch (error) {
    // Map known auth errors to CompanyAccessDeniedError
    if (error instanceof MissingTokenError) {
      throw CompanyAccessDeniedError.missingToken();
    }
    if (error instanceof InvalidTokenError) {
      throw CompanyAccessDeniedError.invalidToken(error);
    }
    if (error instanceof WhopUnavailableError) {
      throw CompanyAccessDeniedError.whopUnavailable(error);
    }
    if (error instanceof InsufficientAccessError) {
      throw CompanyAccessDeniedError.insufficientAccess(error);
    }
    if (error instanceof InstallationMissingError) {
      throw CompanyAccessDeniedError.installationMissing(companyId);
    }
    if (error instanceof ConfigurationError) {
      throw CompanyAccessDeniedError.notConfigured();
    }

    // Unknown error — wrap as insufficient access (fail-closed)
    throw CompanyAccessDeniedError.insufficientAccess(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// ─── Error → JSX rendering ───────────────────────────────────
// Used by every dashboard page to render a consistent error card
// when the auth guard throws.

import {
  AuthErrorCard,
  InstallationRequiredCard,
} from "@/components/rescueloop/company/state-cards";

export interface RenderAccessDeniedOptions {
  adminMessage?: string;
}

/**
 * Render a CompanyAccessDeniedError as a React error card.
 * Returns null if the error is not a CompanyAccessDeniedError
 * (callers should re-throw in that case).
 */
export function renderAccessDeniedError(
  error: unknown,
  companyId: string,
  options?: RenderAccessDeniedOptions,
): React.ReactNode | null {
  if (!(error instanceof CompanyAccessDeniedError)) {
    return null;
  }

  switch (error.code) {
    case "MISSING_TOKEN":
      return (
        <AuthErrorCard
          title="Sign in required"
          description="Open this page from your Whop dashboard to verify your admin access."
          hint="Missing Whop user token"
        />
      );
    case "INVALID_TOKEN":
      return (
        <AuthErrorCard
          title="Session expired"
          description="Your Whop session has expired. Please reopen this page from your Whop dashboard."
          hint="Invalid or expired token"
        />
      );
    case "WHOP_UNAVAILABLE":
      return (
        <AuthErrorCard
          title="Whop is unavailable"
          description="We couldn't reach Whop to verify your access. Please try again in a moment."
          hint="Authentication service unavailable"
        />
      );
    case "INSUFFICIENT_ACCESS":
      return (
        <AuthErrorCard
          title="Admin access required"
          description={
            options?.adminMessage ??
            "Only company admins can view this page."
          }
          hint={error.message}
        />
      );
    case "INSTALLATION_MISSING":
      return <InstallationRequiredCard companyId={companyId} />;
    case "NOT_CONFIGURED":
      return (
        <AuthErrorCard
          title="Integration not configured"
          description="The Whop integration is not configured for this environment. Enable fixture mode for local development."
          hint={error.message}
        />
      );
    case "FIXTURE_COMPANY_MISMATCH":
      return (
        <AuthErrorCard
          title="Invalid company"
          description="This company ID is not available in fixture mode."
          hint={error.message}
        />
      );
  }
}

/**
 * Full handler: try the guard, render error if denied, re-throw if unexpected.
 * Returns the context on success, or a React node (error card) on auth failure.
 */
export async function guardCompanyAccess(
  companyId: string,
  options?: RenderAccessDeniedOptions,
): Promise<{ ok: true; context: CompanyAccessContext } | { ok: false; error: React.ReactNode }> {
  try {
    const context = await requireCompanyAccess(companyId);
    return { ok: true, context };
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId, options);
    if (rendered !== null) {
      return { ok: false, error: rendered };
    }
    // Unexpected error — re-throw
    throw error;
  }
}
