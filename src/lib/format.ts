import type {
  AttributionLevel,
  AutomationState,
  InterventionState,
  MembershipStatus,
  Momentum,
  Priority,
  RiskSegment,
} from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Status label & color maps ───────────────────────────────

export const automationStateMeta: Record<
  AutomationState,
  { label: string; color: string; dot: string; description: string }
> = {
  audit_only: {
    label: "Audit only",
    color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]",
    dot: "bg-[#6A706A]",
    description: "Detecting risk signals. No messages will be sent.",
  },
  manual_approval: {
    label: "Manual approval",
    color: "bg-[#FEF3E2] text-[#D89222] border-[#F5E0C2]",
    dot: "bg-[#D89222]",
    description: "You approve every intervention before it is sent.",
  },
  automatic: {
    label: "Automatic",
    color: "bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]",
    dot: "bg-[#27966A]",
    description: "Approved interventions send automatically within safety rules.",
  },
  paused: {
    label: "Paused",
    color: "bg-[#F4E8E6] text-[#C64D45] border-[#E8C9C5]",
    dot: "bg-[#C64D45]",
    description: "All automation is paused. Nothing will be sent.",
  },
  connection_problem: {
    label: "Connection problem",
    color: "bg-[#F4E8E6] text-[#C64D45] border-[#E8C9C5]",
    dot: "bg-[#C64D45]",
    description: "Whop connection lost. Reconnect to resume automation.",
  },
};

export const interventionStateMeta: Record<
  InterventionState,
  { label: string; color: string; dot: string }
> = {
  detected: { label: "Detected", color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]", dot: "bg-[#6A706A]" },
  awaiting_approval: { label: "Awaiting approval", color: "bg-[#FEF3E2] text-[#D89222] border-[#F5E0C2]", dot: "bg-[#D89222]" },
  approved: { label: "Approved", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]", dot: "bg-[#4C7ECF]" },
  scheduled: { label: "Scheduled", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]", dot: "bg-[#4C7ECF]" },
  queued: { label: "Queued", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]", dot: "bg-[#4C7ECF]" },
  sent: { label: "Sent", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]", dot: "bg-[#4C7ECF]" },
  opened: { label: "Opened", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]", dot: "bg-[#4C7ECF]" },
  responded: { label: "Responded", color: "bg-[#FEF3E2] text-[#D89222] border-[#F5E0C2]", dot: "bg-[#D89222]" },
  recovered: { label: "Recovered", color: "bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]", dot: "bg-[#27966A]" },
  not_recovered: { label: "Not recovered", color: "bg-[#F4E8E6] text-[#C64D45] border-[#E8C9C5]", dot: "bg-[#C64D45]" },
  dismissed: { label: "Dismissed", color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]", dot: "bg-[#6A706A]" },
  stopped: { label: "Stopped", color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]", dot: "bg-[#6A706A]" },
};

export const priorityMeta: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]" },
  medium: { label: "Medium", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]" },
  high: { label: "High", color: "bg-[#FEF3E2] text-[#D89222] border-[#F5E0C2]" },
  urgent: { label: "Urgent", color: "bg-[#F4E8E6] text-[#C64D45] border-[#E8C9C5]" },
};

export const riskSegmentMeta: Record<
  RiskSegment,
  { label: string; color: string }
> = {
  never_started: { label: "Never started", color: "text-[#D89222]" },
  early_stall: { label: "Early stall", color: "text-[#4C7ECF]" },
  mid_course_stall: { label: "Mid-course stall", color: "text-[#4C7ECF]" },
  near_completion: { label: "Near completion", color: "text-[#27966A]" },
  inactive_near_renewal: { label: "Inactive near renewal", color: "text-[#D89222]" },
  scheduled_cancellation: { label: "Scheduled cancellation", color: "text-[#C64D45]" },
};

export const momentumMeta: Record<
  Momentum,
  { label: string; color: string; icon: "trending-up" | "minus" | "trending-down" | "pause" | "refresh-cw" }
> = {
  accelerating: { label: "Accelerating", color: "text-[#27966A]", icon: "trending-up" },
  steady: { label: "Steady", color: "text-[#4C7ECF]", icon: "minus" },
  slowing: { label: "Slowing", color: "text-[#D89222]", icon: "trending-down" },
  stopped: { label: "Stopped", color: "text-[#C64D45]", icon: "pause" },
  recovered: { label: "Recovered", color: "text-[#27966A]", icon: "refresh-cw" },
};

export const membershipStatusMeta: Record<
  MembershipStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]" },
  trialing: { label: "Trial", color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]" },
  cancelling: { label: "Cancelling", color: "bg-[#F4E8E6] text-[#C64D45] border-[#E8C9C5]" },
  cancelled: { label: "Cancelled", color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]" },
  paused_membership: { label: "Paused", color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]" },
};

export const attributionMeta: Record<
  AttributionLevel,
  { label: string; color: string; description: string }
> = {
  confirmed: {
    label: "Confirmed",
    color: "bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]",
    description: "Directly attributable to a specific intervention with clear evidence.",
  },
  strongly_associated: {
    label: "Strongly associated",
    color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]",
    description: "Intervention sent, student returned, but causal chain is not fully isolated.",
  },
  estimated: {
    label: "Estimated",
    color: "bg-[#FEF3E2] text-[#D89222] border-[#F5E0C2]",
    description: "Modeled projection based on probability of retention. Not yet confirmed.",
  },
};

export function relativeDay(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date("2026-02-01");
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}
