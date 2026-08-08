// Whop adapter for the `IdentityProvider` contract.
//
// Wraps:
//   - `getWhopClient().verifyUserToken(headers, { dontThrow: true })`
//   - `getWhopClient().users.checkAccess(companyId, { id: userId })`
//
// so business logic never imports the Whop SDK directly.

import "server-only";

import { getWhopClient } from "@/lib/whop/client";
import {
  AccessCheckResult,
  AccessLevel,
  VerifiedUser,
} from "@/providers/contracts";
import {
  ProviderAuthenticationError,
  ProviderError,
} from "@/providers/contracts/shared";
import { APIError, APIConnectionError, AuthenticationError } from "@whop/sdk";
import { assertWhopConfigured, mapWhopError, WHOP_PROVIDER } from "./errors";

/**
 * Whop implementation of the `IdentityProvider` contract.
 *
 * `verifyUserToken` uses `{ dontThrow: true }` so we can map null payloads
 * to typed errors instead of catching SDK exceptions. `checkAccess` returns
 * Whop's `{ access_level, has_access }` shape directly, which mirrors the
 * contract's `AccessCheckResult`.
 */
export class WhopIdentityProvider {
  async verifyUserToken(headers: Headers): Promise<VerifiedUser> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const payload = await client.verifyUserToken(headers, {
        dontThrow: true,
      });

      if (!payload || !payload.userId) {
        // Distinguish "no token" from "bad token" by sniffing the header.
        const hasToken = headers.get("x-whop-user-token");
        if (!hasToken) {
          throw new ProviderError({
            provider: WHOP_PROVIDER,
            code: "MISSING_USER_TOKEN",
            message: "Missing Whop user token.",
            retriable: false,
          });
        }
        throw new ProviderAuthenticationError(WHOP_PROVIDER);
      }

      return {
        userId: payload.userId,
        appId: payload.appId,
      };
    } catch (error) {
      // Already-typed provider errors propagate unchanged.
      if (error instanceof ProviderError) {
        throw error;
      }
      if (error instanceof AuthenticationError) {
        throw new ProviderAuthenticationError(WHOP_PROVIDER);
      }
      if (error instanceof APIConnectionError || error instanceof APIError) {
        throw mapWhopError(error);
      }
      throw mapWhopError(error);
    }
  }

  async checkAccess(
    companyId: string,
    userId: string,
  ): Promise<AccessCheckResult> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const result = await client.users.checkAccess(companyId, {
        id: userId,
      });

      return {
        accessLevel: normalizeAccessLevel(result.access_level),
        hasAccess: result.has_access === true,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw new ProviderAuthenticationError(WHOP_PROVIDER);
      }
      throw mapWhopError(error);
    }
  }
}

/**
 * Narrow Whop's `access_level` union to the contract's `AccessLevel`.
 * The Whop API may add new values over time; unknown values collapse to
 * `no_access` so the contract stays closed and access fails safe.
 */
function normalizeAccessLevel(level: string | null | undefined): AccessLevel {
  switch (level) {
    case "admin":
      return "admin";
    case "customer":
      return "customer";
    case "no_access":
    default:
      return "no_access";
  }
}

/** Re-exported for the bundle index. */
export const whopIdentityProvider = new WhopIdentityProvider();
