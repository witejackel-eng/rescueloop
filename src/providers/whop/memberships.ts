// Whop adapter for the `MembershipsProvider` contract.
//
// Wraps `getWhopClient().memberships.list()` and `retrieve()` so business
// logic never imports the Whop SDK directly.

import "server-only";

import { getWhopClient } from "@/lib/whop/client";
import {
  ExternalMembership,
  ExternalMembershipStatus,
  ListMembershipsParams,
  MembershipPage,
  ProviderNotFoundError,
} from "@/providers/contracts";
import type {
  Membership,
  MembershipStatus,
} from "@whop/sdk/resources/shared";
import type { MembershipListResponse } from "@whop/sdk/resources/memberships";
import type { CursorPage } from "@whop/sdk/core/pagination";
import { APIError, NotFoundError } from "@whop/sdk";
import { assertWhopConfigured, mapWhopError } from "./errors";

/**
 * Whop implementation of the `MembershipsProvider` contract.
 *
 * The Whop SDK exposes membership `status` as one of:
 *   `'trialing' | 'active' | 'past_due' | 'completed' | 'canceled' |
 *    'expired' | 'unresolved' | 'drafted' | 'canceling'`
 *
 * The contract uses British-spelled `'cancelling'` and `'cancelled'`, so we
 * normalize the spelling during mapping. Unknown statuses fall back to
 * `'cancelled'` to ensure the contract type stays closed.
 *
 * NOTE: `priceCents` is not on `MembershipListResponse` — pricing lives on
 * the related `Plan`. TODO: Verify against real Whop API during Phase 2.
 */
export class WhopMembershipsProvider {
  async list(params: ListMembershipsParams): Promise<MembershipPage> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const page = (await client.memberships.list({
        company_id: params.companyId,
        product_ids: params.productId ? [params.productId] : undefined,
        statuses: params.status ? [toWhopStatus(params.status)] : undefined,
        after: params.cursor ?? undefined,
        first: params.pageSize ?? undefined,
      })) as CursorPage<MembershipListResponse>;

      const items = (page.data ?? []).map(mapMembershipListResponse);

      return {
        items,
        nextCursor: page.page_info?.end_cursor ?? null,
      };
    } catch (error) {
      throw mapWhopError(error);
    }
  }

  async retrieve(membershipId: string): Promise<ExternalMembership | null> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const membership = await client.memberships.retrieve(membershipId);
      return mapMembership(membership);
    } catch (error) {
      if (error instanceof NotFoundError || (error instanceof APIError && error.status === 404)) {
        return null;
      }
      if (error instanceof ProviderNotFoundError) {
        return null;
      }
      throw mapWhopError(error);
    }
  }
}

// ─── Mappers ─────────────────────────────────────────────────

function mapMembershipListResponse(m: MembershipListResponse): ExternalMembership {
  return {
    id: m.id,
    userId: m.user?.id ?? "",
    productId: m.product?.id ?? "",
    status: fromWhopStatus(m.status),
    cancelAtPeriodEnd: m.cancel_at_period_end,
    // `joined_at` is a Unix timestamp string (seconds) on the SDK type.
    joinedAt: unixToIso(m.joined_at) ?? m.created_at,
    renewalDate: unixToIso(m.renewal_period_end),
    cancelledAt: unixToIso(m.canceled_at),
    // Pricing is on `Plan`, not `Membership`.
    // TODO: Verify against real Whop API during Phase 2.
    priceCents: 0,
    currency: m.currency ?? "usd",
    sourceTimestamp: m.updated_at,
  };
}

function mapMembership(m: Membership): ExternalMembership {
  return {
    id: m.id,
    userId: m.user?.id ?? "",
    productId: m.product?.id ?? "",
    status: fromWhopStatus(m.status),
    cancelAtPeriodEnd: m.cancel_at_period_end,
    joinedAt: unixToIso(m.joined_at) ?? m.created_at,
    renewalDate: unixToIso(m.renewal_period_end),
    cancelledAt: unixToIso(m.canceled_at),
    // TODO: Verify against real Whop API during Phase 2.
    priceCents: 0,
    currency: m.currency ?? "usd",
    sourceTimestamp: m.updated_at,
  };
}

/**
 * Convert a Whop `MembershipStatus` to the contract's
 * `ExternalMembershipStatus`, normalizing the British spelling of
 * `cancelled` / `cancelling`.
 */
function fromWhopStatus(status: MembershipStatus): ExternalMembershipStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceling":
      return "cancelling";
    case "canceled":
      return "cancelled";
    case "expired":
    case "completed":
    case "unresolved":
    case "drafted":
      // Whop's terminal / non-active states collapse to `cancelled` for
      // the contract — the contract's status enum is intentionally
      // narrower than the SDK's.
      return "cancelled";
    default:
      return "cancelled";
  }
}

/** Map the contract's status back to the Whop SDK's status string. */
function toWhopStatus(status: ExternalMembershipStatus): MembershipStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "cancelling":
      return "canceling";
    case "cancelled":
      return "canceled";
    case "paused":
      // Whop has no `paused` membership status — pausing is modeled via
      // `payment_collection_paused`. Filter to `active` so the SDK accepts
      // the request.
      return "active";
    default:
      return "active";
  }
}

/**
 * Convert a Whop Unix-timestamp string (seconds since epoch) to an ISO 8601
 * string. Returns `null` if the input is missing or unparseable.
 */
function unixToIso(unixSeconds: string | null | undefined): string | null {
  if (!unixSeconds) return null;
  const seconds = Number(unixSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

/** Re-exported for the bundle index. */
export const whopMembershipsProvider = new WhopMembershipsProvider();
