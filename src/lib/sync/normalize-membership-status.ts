// Normalizes external membership statuses into Prisma-safe enum values.
//
// Unknown Whop statuses map to a safe explicit state (CANCELLED) — they are
// NEVER silently mapped to active. A structured warning is produced for
// any unknown status so callers can log / audit it.

import type { ExternalMembershipStatus } from "@/providers/contracts";

/** The Prisma enum values for MembershipStatus. */
export type PrismaMembershipStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelling"
  | "cancelled"
  | "paused_membership";

export interface NormalizedMembershipStatus {
  status: PrismaMembershipStatus;
  warning?: string;
}

/**
 * Map a known Whop / external status to a Prisma-safe MembershipStatus enum
 * value. Unknown statuses map to `"cancelled"` and produce a structured warning.
 *
 * This function NEVER silently maps an unknown status to `"active"`.
 */
export function normalizeMembershipStatus(
  externalStatus: string,
): NormalizedMembershipStatus {
  switch (externalStatus as ExternalMembershipStatus) {
    case "active":
      return { status: "active" };
    case "trialing":
      return { status: "trialing" };
    case "past_due":
      return { status: "past_due" };
    case "cancelling":
      return { status: "cancelling" };
    case "cancelled":
      return { status: "cancelled" };
    case "paused":
      // The contract uses "paused"; the Prisma enum uses "paused_membership".
      return { status: "paused_membership" };
    default: {
      const warning =
        `Unknown membership status "${externalStatus}" — mapped to "cancelled" for safety. ` +
        `This status should be added to the normalization map.`;
      return { status: "cancelled", warning };
    }
  }
}
