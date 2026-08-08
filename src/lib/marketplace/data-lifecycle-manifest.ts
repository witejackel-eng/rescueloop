import "server-only";
// Uninstall & Data Lifecycle Manifest — WP08
//
// Documents what RescueLoop does when a creator uninstalls the app, pauses,
// requests export, or requests deletion. This module is the contract;
// runtime behaviour lives in src/lib/data-lifecycle/*.

export interface DataLifecycleAction {
  id: string;
  label: string;
  trigger: "creator_uninstall" | "creator_pause" | "creator_export" | "creator_delete" | "whop_webhook_membership_cancelled";
  scope: "organization" | "single_student";
  /** What RescueLoop does immediately. */
  immediate: string;
  /** What RescueLoop does on the scheduled job. */
  scheduled: string;
  /** Data retention default. */
  retention: string;
  /** Whether the action is reversible. */
  reversible: boolean;
}

export const DATA_LIFECYCLE_ACTIONS: readonly DataLifecycleAction[] = [
  {
    id: "pause",
    label: "Pause interventions",
    trigger: "creator_pause",
    scope: "organization",
    immediate: "Emergency pause flag set; outbox submission halted; queued notifications remain in 'pending' state.",
    scheduled: "No new candidates surfaced until resumed.",
    retention: "All historical data retained.",
    reversible: true,
  },
  {
    id: "uninstall",
    label: "Uninstall RescueLoop from Whop",
    trigger: "creator_uninstall",
    scope: "organization",
    immediate: "Webhook subscription removed; sync halted; pending notifications cancelled (not submitted).",
    scheduled: "After 30-day grace period, organization data is deleted per Whop marketplace policy unless export was requested.",
    retention: "30-day grace period for re-install recovery.",
    reversible: true,
  },
  {
    id: "export",
    label: "Request data export",
    trigger: "creator_export",
    scope: "organization",
    immediate: "Export job queued; status visible in /dashboard/[companyId]/settings.",
    scheduled: "Export produced within 72 hours; download link emailed to creator. Link expires after 7 days.",
    retention: "Export itself is retained for 7 days only.",
    reversible: false,
  },
  {
    id: "delete",
    label: "Request full deletion",
    trigger: "creator_delete",
    scope: "organization",
    immediate: "Deletion job queued; status visible in /dashboard/[companyId]/settings.",
    scheduled: "All organization data, students, interventions, outcomes, audit logs deleted within 30 days. Whop membership cancelled.",
    retention: "Only anonymized aggregate counts retained for analytics.",
    reversible: false,
  },
  {
    id: "student_opt_out",
    label: "Student opts out of further messages",
    trigger: "creator_delete",
    scope: "single_student",
    immediate: "Student flagged opted_out; suppresses any future notification for that student immediately, regardless of playbook/schedule.",
    scheduled: "Student access token revoked; no further emails.",
    retention: "Opt-out flag retained indefinitely to honour the request.",
    reversible: false,
  },
] as const;

// ─── Support channels ──────────────────────────────────────────

export const SUPPORT_CHANNELS = {
  /** Public support email (creator-only). */
  email: "support@rescueloop.app",
  /** Status page. */
  statusPage: "https://status.rescueloop.app",
  /** Documentation root. */
  docs: "https://docs.rescueloop.app",
  /** Privacy policy URL. */
  privacy: "/legal/privacy",
  /** Terms URL. */
  terms: "/legal/terms",
  /** Data processing addendum URL. */
  dataProcessing: "/legal/data-processing",
  /** Security overview URL. */
  security: "/legal/security",
} as const;
