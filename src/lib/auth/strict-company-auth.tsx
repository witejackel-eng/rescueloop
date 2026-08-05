// Strict authorization for connected company pages.
//
// Every connected page must use this module (or call requireCompanyAdmin
// directly) for full auth enforcement.
//
// In Whop mode: verify user token → verify company access → resolve organisation
//   → verify organisation membership → return tenant-scoped context.
// In fixture mode: verify fixture mode is allowed → verify companyId matches
//   the configured fixture company → return a typed fixture identity.
// Never lets an arbitrary companyId select a fixture organisation.

import "server-only";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
  InstallationMissingError,
} from "@/lib/auth/whop-auth";
import { ConfigurationError } from "@/lib/env/server";
import { AuthErrorCard, InstallationRequiredCard } from "@/components/rescueloop/company/state-cards";

// ─── Result types ────────────────────────────────────────────

export interface WhopAuthContext {
  mode: "whop";
  organizationId: string;
  companyId: string;
  whopUserId: string;
}

export interface FixtureAuthContext {
  mode: "fixture";
  /** Sentinel ID — do NOT use for database queries. */
  organizationId: "org_fixture";
  companyId: typeof FIXTURE_COMPANY_ID;
}

export type StrictAuthContext = WhopAuthContext | FixtureAuthContext;

// ─── Strict auth resolver ────────────────────────────────────

/**
 * Resolve strict authorization for a connected company page.
 *
 * - Fixture mode: verifies the URL companyId matches FIXTURE_COMPANY_ID,
 *   then returns a FixtureAuthContext. No Whop calls are made.
 * - Whop mode: calls requireCompanyAdmin for the full auth chain,
 *   then returns a WhopAuthContext with the real organizationId.
 *
 * Throws the same errors as requireCompanyAdmin in Whop mode.
 * Throws InsufficientAccessError if fixture mode is on but the URL
 * companyId does not match the fixture company.
 */
export async function resolveStrictCompanyAuth(
  companyId: string,
): Promise<StrictAuthContext> {
  const mode = getProviderMode();

  if (mode === "fixture") {
    // Strict: never let an arbitrary companyId select a fixture organisation.
    if (companyId !== FIXTURE_COMPANY_ID) {
      throw new InsufficientAccessError(
        "company — fixture mode only allows the configured fixture company",
      );
    }
    return {
      mode: "fixture",
      organizationId: "org_fixture",
      companyId: FIXTURE_COMPANY_ID,
    };
  }

  // Whop mode — full strict auth chain
  const ctx = await requireCompanyAdmin(companyId);
  return {
    mode: "whop",
    organizationId: ctx.organizationId,
    companyId: ctx.companyId,
    whopUserId: ctx.whopUserId,
  };
}

// ─── Auth error → JSX ────────────────────────────────────────
// Used by every connected page to render a consistent auth error card.

export interface AuthErrorRenderOptions {
  adminMessage?: string;
}

/**
 * Map a thrown auth error to a React element.
 * Returns null if the error is not a recognised auth error
 * (callers should re-throw in that case).
 */
export function renderAuthError(
  error: unknown,
  options?: AuthErrorRenderOptions,
): React.ReactNode | null {
  if (error instanceof MissingTokenError) {
    return (
      <AuthErrorCard
        title="Sign in required"
        description="Open this page from your Whop dashboard to verify your admin access."
        hint="Missing Whop user token"
      />
    );
  }
  if (error instanceof InvalidTokenError) {
    return (
      <AuthErrorCard
        title="Session expired"
        description="Your Whop session has expired. Please reopen this page from your Whop dashboard."
        hint="Invalid or expired token"
      />
    );
  }
  if (error instanceof WhopUnavailableError) {
    return (
      <AuthErrorCard
        title="Whop is unavailable"
        description="We couldn't reach Whop to verify your access. Please try again in a moment."
        hint="Authentication service unavailable"
      />
    );
  }
  if (error instanceof InsufficientAccessError) {
    return (
      <AuthErrorCard
        title="Admin access required"
        description={options?.adminMessage ?? "Only company admins can view this page."}
        hint={error.message}
      />
    );
  }
  if (error instanceof ConfigurationError) {
    return (
      <AuthErrorCard
        title="Integration not configured"
        description="The Whop integration is not configured for this environment. Enable fixture mode for local development."
        hint={error.message}
      />
    );
  }
  return null;
}

/**
 * Full auth error handler including InstallationMissingError.
 */
export function renderCompanyAuthError(
  error: unknown,
  companyId: string,
  options?: AuthErrorRenderOptions,
): React.ReactNode | null {
  if (error instanceof InstallationMissingError) {
    return <InstallationRequiredCard companyId={companyId} />;
  }
  return renderAuthError(error, options);
}
