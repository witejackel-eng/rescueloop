import "server-only";

// ─────────────────────────────────────────────────────────────
// FixtureIdentityProvider — fixture-mode identity verification.
//
// `verifyUserToken` reads the `x-fixture-user-id` header if present,
// otherwise returns a default admin user. It NEVER throws for
// missing tokens — that's the whole point of fixture mode.
//
// `checkAccess` returns admin access for the fixture company.
// ─────────────────────────────────────────────────────────────

import type {
  AccessCheckResult,
  IdentityProvider,
  VerifiedUser,
} from "@/providers/contracts";
import {
  FIXTURE_ADMIN_USER_ID,
  FIXTURE_APP_ID,
  FIXTURE_COMPANY_ID,
} from "./fixtures-data";

const FIXTURE_USER_HEADER = "x-fixture-user-id";

export class FixtureIdentityProvider implements IdentityProvider {
  /**
   * Verify a user token (or, in fixture mode, just look for the
   * `x-fixture-user-id` header). Returns a default admin user if
   * no header is present. Never throws for missing tokens.
   */
  async verifyUserToken(headers: Headers): Promise<VerifiedUser> {
    const headerUserId = headers.get(FIXTURE_USER_HEADER);
    const userId = headerUserId && headerUserId.trim().length > 0
      ? headerUserId.trim()
      : FIXTURE_ADMIN_USER_ID;

    return {
      userId,
      appId: FIXTURE_APP_ID,
    };
  }

  /**
   * Check if a user has access to a company.
   * Returns admin access for the fixture company; no_access otherwise.
   */
  async checkAccess(companyId: string, userId: string): Promise<AccessCheckResult> {
    void userId; // fixture mode grants access to everyone for the fixture company

    if (companyId === FIXTURE_COMPANY_ID) {
      return { accessLevel: "admin", hasAccess: true };
    }

    // Non-fixture companies get no access in fixture mode — this keeps
    // the behaviour predictable for tests against unknown tenants.
    return { accessLevel: "no_access", hasAccess: false };
  }
}
