import "server-only";

// ─────────────────────────────────────────────────────────────
// FixtureMembershipsProvider — returns deterministic membership
// data from the local fixture store. Implements `MembershipsProvider`.
// Supports filtering by productId and status.
// ─────────────────────────────────────────────────────────────

import type {
  ExternalMembership,
  ListMembershipsParams,
  MembershipPage,
  MembershipsProvider,
} from "@/providers/contracts";
import {
  decodeCursor,
  encodeCursor,
  getMemberships,
  makeFixtureRateLimit,
} from "./fixtures-data";

const DEFAULT_PAGE_SIZE = 25;

export class FixtureMembershipsProvider implements MembershipsProvider {
  async list(params: ListMembershipsParams): Promise<MembershipPage> {
    // Fixture store is single-tenant; any companyId returns the same set.
    void params.companyId;

    const all = getMemberships();
    const filtered = all.filter((m) => {
      if (params.productId && m.productId !== params.productId) return false;
      if (params.status && m.status !== params.status) return false;
      return true;
    });

    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);

    const items = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < filtered.length ? encodeCursor(nextOffset) : null;

    return {
      items,
      nextCursor,
      rateLimit: makeFixtureRateLimit(),
    };
  }

  async retrieve(membershipId: string): Promise<ExternalMembership | null> {
    const all = getMemberships();
    return all.find((m) => m.id === membershipId) ?? null;
  }
}
