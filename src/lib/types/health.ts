// ─────────────────────────────────────────────────────────────
// PX02 — System Health types
// Creator-facing health domain signals with real status
// ─────────────────────────────────────────────────────────────

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type HealthDomain =
  | "whop"
  | "permissions"
  | "membership_sync"
  | "course_activity"
  | "webhooks"
  | "jobs"
  | "notifications"
  | "billing"
  | "data_freshness";

export interface HealthSignal {
  domain: HealthDomain;
  status: HealthStatus;
  label: string;
  description: string;
  lastChecked: string;
  /** Human-readable detail about current state */
  details: string;
  /** What is impacted by this status */
  impact?: string;
  /** Whether data is safe despite the issue */
  dataSafe: boolean;
  /** Whether RescueLoop is automatically retrying */
  retrying: boolean;
  /** Whether the creator needs to take action */
  actionRequired: boolean;
  /** Label for the action button */
  actionLabel?: string;
  /** Where the action goes */
  actionHref?: string;
}

export interface HealthCheckResult {
  signals: HealthSignal[];
  overallStatus: HealthStatus;
  checkedAt: string;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  unknownCount: number;
}

export const HEALTH_DOMAIN_LABELS: Record<HealthDomain, string> = {
  whop: "Whop",
  permissions: "Permissions",
  membership_sync: "Membership Sync",
  course_activity: "Course Activity",
  webhooks: "Webhooks",
  jobs: "Jobs",
  notifications: "Notifications",
  billing: "Billing",
  data_freshness: "Data Freshness",
};

export const HEALTH_STATUS_META: Record<
  HealthStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  healthy: {
    label: "Healthy",
    color: "text-[#147D68]",
    bg: "bg-[#E8F5EF]",
    border: "border-[#C7E6D5]",
    dot: "bg-[#147D68]",
  },
  degraded: {
    label: "Degraded",
    color: "text-[#C68A1E]",
    bg: "bg-[#FEF3E2]",
    border: "border-[#F5E0C2]",
    dot: "bg-[#C68A1E]",
  },
  unhealthy: {
    label: "Unhealthy",
    color: "text-[#B83D34]",
    bg: "bg-[#F4E8E6]",
    border: "border-[#E8C9C5]",
    dot: "bg-[#B83D34]",
  },
  unknown: {
    label: "Unknown",
    color: "text-[#6A706A]",
    bg: "bg-[#F0F2EC]",
    border: "border-[#E3E5DF]",
    dot: "bg-[#6A706A]",
  },
};
