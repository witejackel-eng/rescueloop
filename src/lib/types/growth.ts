// ─────────────────────────────────────────────────────────────
// PX07 — Growth Instrumentation Types
// Minimal privacy-safe business funnel tracking.
// ─────────────────────────────────────────────────────────────

/** Funnel steps — ordered by customer journey */
export type FunnelStep =
  | "install"
  | "permission_complete"
  | "first_sync_started"
  | "first_sync_complete"
  | "first_candidate"
  | "first_review"
  | "first_approval"
  | "first_notification_accepted"
  | "first_student_response"
  | "first_observed_return"
  | "subscription_activated"
  | "subscription_cancelled"
  | "referral_source";

/** Human-readable labels for funnel steps */
export const FUNNEL_STEP_LABELS: Record<FunnelStep, string> = {
  install: "Install",
  permission_complete: "Permissions",
  first_sync_started: "Sync Started",
  first_sync_complete: "Sync Complete",
  first_candidate: "First Candidate",
  first_review: "First Review",
  first_approval: "First Approval",
  first_notification_accepted: "Notification Accepted",
  first_student_response: "Student Response",
  first_observed_return: "Observed Return",
  subscription_activated: "Subscription",
  subscription_cancelled: "Cancellation",
  referral_source: "Referral Source",
};

/** The ordered funnel for the primary activation path (excludes cancellation & referral) */
export const ACTIVATION_FUNNEL: FunnelStep[] = [
  "install",
  "permission_complete",
  "first_sync_started",
  "first_sync_complete",
  "first_candidate",
  "first_review",
  "first_approval",
  "first_notification_accepted",
  "first_student_response",
  "first_observed_return",
  "subscription_activated",
];

/** A single privacy-safe funnel event */
export interface FunnelEvent {
  /** Unique event ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** Which funnel step */
  step: FunnelStep;
  /** ISO timestamp */
  timestamp: string;
  /**
   * Optional metadata — privacy-safe only.
   * NO raw student message, NO blocker free text,
   * NO token/secrets, NO unnecessary PII.
   */
  meta?: Record<string, string | number | boolean>;
}

/** Aggregated funnel counts at each step */
export interface FunnelStepAggregate {
  step: FunnelStep;
  label: string;
  count: number;
  /** Cumulative conversion rate from first step */
  conversionRate: number;
  /** Drop-off rate from previous step */
  dropoffRate: number;
}

/** Full funnel analysis */
export interface FunnelAnalysis {
  steps: FunnelStepAggregate[];
  totalAtTop: number;
  totalAtBottom: number;
  overallConversion: number;
  averageTimeToConvertHours: number;
}

/** Referral source tracking */
export type ReferralChannel =
  | "organic"
  | "word_of_mouth"
  | "content"
  | "partner"
  | "ad"
  | "community"
  | "other";

export interface ReferralEntry {
  tenantId: string;
  channel: ReferralChannel;
  source: string; // e.g. "blog-post", "twitter", "partner-name"
  timestamp: string;
  converted: boolean; // did they activate subscription?
}

export interface ReferralAggregate {
  channel: ReferralChannel;
  count: number;
  converted: number;
  conversionRate: number;
}

/** Case-study consent tracking */
export interface CaseStudyConsent {
  tenantId: string;
  tenantName: string;
  consentGiven: boolean;
  consentDate: string | null;
  storyHighlight: string | null; // brief summary, privacy-safe
}

/** Growth overview combining funnel + referral */
export interface GrowthOverview {
  funnel: FunnelAnalysis;
  referrals: ReferralAggregate[];
  caseStudyCandidates: CaseStudyConsent[];
  recentEvents: FunnelEvent[];
}
