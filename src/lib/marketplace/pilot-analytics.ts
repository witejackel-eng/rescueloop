import "server-only";
// Pilot Analytics Allowlist — WP08
//
// The controlled pilot (3–5 creators) measures these signals:
//   install → permissions granted
//   time to first sync
//   time to first candidate
//   review/approval actions
//   provider accepted
//   student response
//   observed return
//   support tickets
//   permission/sync failures
//   cancellation reasons
//
// HARD RULE: Never send raw student free text to analytics.
// This module encodes that rule as a runtime gate.
//
// Each pilot event MUST be on this allowlist AND pass sanitizePilotEvent().

export type PilotEventName =
  | "pilot.install_started"
  | "pilot.permissions_granted"
  | "pilot.permissions_declined"
  | "pilot.first_sync_completed"
  | "pilot.first_sync_failed"
  | "pilot.first_candidate_shown"
  | "pilot.draft_reviewed"
  | "pilot.draft_edited"
  | "pilot.message_approved"
  | "pilot.notification_accepted"
  | "pilot.notification_failed"
  | "pilot.student_responded"
  | "pilot.student_reported_blocker"
  | "pilot.student_opted_out"
  | "pilot.observed_return"
  | "pilot.support_ticket_opened"
  | "pilot.cancellation_reason_recorded";

export const PILOT_EVENT_ALLOWLIST: ReadonlySet<PilotEventName> = new Set<PilotEventName>([
  "pilot.install_started",
  "pilot.permissions_granted",
  "pilot.permissions_declined",
  "pilot.first_sync_completed",
  "pilot.first_sync_failed",
  "pilot.first_candidate_shown",
  "pilot.draft_reviewed",
  "pilot.draft_edited",
  "pilot.message_approved",
  "pilot.notification_accepted",
  "pilot.notification_failed",
  "pilot.student_responded",
  "pilot.student_reported_blocker",
  "pilot.student_opted_out",
  "pilot.observed_return",
  "pilot.support_ticket_opened",
  "pilot.cancellation_reason_recorded",
]);

/** Fields that are NEVER sent to analytics — even if a caller passes them. */
const FORBIDDEN_PILOT_KEYS = new Set([
  "studentName",
  "studentEmail",
  "studentId",
  "messageContent",
  "messagePreview",
  "draftText",
  "studentFreeText",
  "blockerDescription", // free-text from student
  "token",
  "tokenHash",
  "whopUserId",
  "ipAddress",
  "userAgent",
]);

export interface PilotEvent {
  event: PilotEventName;
  organizationId: string;
  /** Anonymous counter only — no PII. */
  properties?: Record<string, unknown>;
}

/** Returns a sanitized copy with forbidden keys removed and strings truncated. */
export function sanitizePilotEvent(event: PilotEvent): PilotEvent {
  if (!PILOT_EVENT_ALLOWLIST.has(event.event)) {
    throw new Error(`Pilot event not on allowlist: ${event.event}`);
  }

  const safe: Record<string, unknown> = {};
  if (event.properties) {
    for (const [key, value] of Object.entries(event.properties)) {
      if (FORBIDDEN_PILOT_KEYS.has(key)) continue;
      if (typeof value === "string" && value.length > 200) {
        safe[key] = value.substring(0, 200) + "...[truncated]";
      } else {
        safe[key] = value;
      }
    }
  }

  return {
    event: event.event,
    organizationId: event.organizationId,
    properties: safe,
  };
}
