// ─────────────────────────────────────────────────────────────
// WP04 Rescue Queue — enhanced types for the API-driven queue
// ─────────────────────────────────────────────────────────────

import type { InterventionState, Priority, QueueTab } from "@/lib/types";

/** A single eligibility check within an evidence timeline entry. */
export interface EligibilityCheck {
  ruleId: string;
  label: string;
  passed: boolean;
  detail?: string;
}

/** One entry in the evidence timeline (ordered by detectedAt). */
export interface EvidenceTimelineEntry {
  id: string;
  detectedAt: string;
  checks: EligibilityCheck[];
  overallEligible: boolean;
}

/** A safety check result. */
export interface SafetyCheckResult {
  ruleId: string;
  label: string;
  passed: boolean;
  detail?: string;
}

/** An audit history entry for an intervention. */
export interface AuditEntry {
  id: string;
  action: string;
  actorId: string | null;
  actorLabel?: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  reason?: string;
}

/** Full intervention detail returned by the API for the inspector. */
export interface InterventionDetail {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatarInitials: string;
  courseId: string;
  courseName: string;
  trigger: string;
  recommendedAction: string;
  messagePreview: string;
  messageEdited: boolean;
  priority: Priority;
  state: InterventionState;
  scheduledFor: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  recoveredAt: string | null;
  cooldownUntil: string | null;
  inactivityDays: number;
  progressPercent: number;
  lastActivityAt: string;
  joinedAt: string;
  membershipStatus: string;
  renewalDate: string;
  monthlyValue: number;
  attributionLevel: string;
  /** Eligibility evidence timeline entries. */
  evidenceTimeline: EvidenceTimelineEntry[];
  /** Safety check results. */
  safetyChecks: SafetyCheckResult[];
  /** Audit trail. */
  auditHistory: AuditEntry[];
  /** Whether this student is suppressed. */
  suppressed: boolean;
  /** Whether this student is in cooldown. */
  inCooldown: boolean;
  /** Campaign type for display. */
  campaignType: string;
  /** Max messages per student from campaign safety. */
  maxMessagesPerStudent: number;
  /** Quiet hours window. */
  quietHoursStart: string;
  quietHoursEnd: string;
}

/** Summary row used in the queue list. */
export interface QueueItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatarInitials: string;
  courseName: string;
  trigger: string;
  priority: Priority;
  /** DB intervention state string — may be domain or DB enum value. */
  state: string;
  inactivityDays: number;
  progressPercent: number;
  lastActivityAt: string;
  scheduledFor: string | null;
  suppressed: boolean;
  inCooldown: boolean;
  cooldownUntil: string | null;
}

/** Full queue response from the API. */
export interface QueueResponse {
  items: QueueItem[];
  counts: Record<QueueTab, number>;
}

/** Mapping from any intervention state string (DB or domain) to QueueTab. */
export function stateToQueueTab(state: string): QueueTab {
  switch (state) {
    case "awaiting_approval":
    case "drafted":
      return "awaiting_review";
    case "approved":
      return "approved";
    case "scheduled":
      return "scheduled";
    case "sent":
    case "opened":
    case "delivery_attempted":
    case "notification_accepted":
    case "delivered":
    case "queued":
      return "sent";
    case "responded":
      return "responded";
    case "recovered":
      return "recovered";
    case "dismissed":
    case "stopped":
    case "failed":
      return "dismissed";
    default:
      return "awaiting_review";
  }
}
