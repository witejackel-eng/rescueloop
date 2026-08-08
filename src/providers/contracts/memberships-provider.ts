// Provider contract: Membership data source.

export type ExternalMembershipStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelling"
  | "cancelled"
  | "paused";

export interface ExternalMembership {
  id: string; // Whop membership ID
  userId: string; // Whop user ID
  productId: string;
  status: ExternalMembershipStatus;
  cancelAtPeriodEnd: boolean;
  joinedAt: string; // ISO 8601
  renewalDate: string | null;
  cancelledAt: string | null;
  priceCents: number;
  currency: string;
  sourceTimestamp: string;
}

export interface MembershipPage {
  items: ExternalMembership[];
  nextCursor: string | null;
  rateLimit?: RateLimitMetadata;
}

export interface ListMembershipsParams {
  companyId: string;
  productId?: string;
  status?: ExternalMembershipStatus;
  cursor?: string | null;
  pageSize?: number;
}

export interface MembershipsProvider {
  list(params: ListMembershipsParams): Promise<MembershipPage>;
  retrieve(membershipId: string): Promise<ExternalMembership | null>;
}

import type { RateLimitMetadata } from "./shared";
