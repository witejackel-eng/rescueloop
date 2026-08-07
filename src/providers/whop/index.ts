// Whop provider bundle.
//
// Exposes `getWhopProviders()` which returns a fully-wired `ProviderBundle`
// backed by the official `@whop/sdk`, OR `null` when the Whop integration
// is not configured for the current environment.
//
// Callers should treat `null` as a signal to fall back to fixtures or
// return a 503 — they should NOT attempt to construct the bundle directly.

import "server-only";

import { isWhopReady } from "@/lib/whop/client";
import type { ProviderBundle } from "@/providers/contracts";
import { whopCoursesProvider } from "./courses";
import { whopMembershipsProvider } from "./memberships";
import { whopNotificationsProvider } from "./notifications";
import { whopProductsProvider } from "./products";
import { whopProgressProvider } from "./progress";
import { whopIdentityProvider } from "./identity";

export {
  WhopCoursesProvider,
  whopCoursesProvider,
} from "./courses";
export {
  WhopProductsProvider,
  whopProductsProvider,
} from "./products";
export {
  WhopMembershipsProvider,
  whopMembershipsProvider,
} from "./memberships";
export {
  WhopProgressProvider,
  whopProgressProvider,
} from "./progress";
export {
  WhopNotificationsProvider,
  whopNotificationsProvider,
} from "./notifications";
export {
  WhopIdentityProvider,
  whopIdentityProvider,
} from "./identity";
export {
  WHOP_PROVIDER,
  assertWhopConfigured,
  mapWhopError,
} from "./errors";

/**
 * Return the Whop-backed `ProviderBundle`, or `null` when the Whop
 * integration is not configured.
 *
 * The check is performed lazily at call time — never at module-import
 * time — so importing this module during `next build` is safe even when
 * Whop credentials are absent.
 *
 * @example
 * ```ts
 * const providers = getWhopProviders();
 * if (!providers) {
 *   return Response.json({ error: "Whop not configured" }, { status: 503 });
 * }
 * const page = await providers.courses.list({ companyId });
 * ```
 */
export function getWhopProviders(): ProviderBundle | null {
  if (!isWhopReady()) return null;

  return {
    courses: whopCoursesProvider,
    products: whopProductsProvider,
    memberships: whopMembershipsProvider,
    progress: whopProgressProvider,
    notifications: whopNotificationsProvider,
    identity: whopIdentityProvider,
  };
}
