import "server-only";

// ─────────────────────────────────────────────────────────────
// FixtureNotificationsProvider — DOES NOT send real notifications.
//
// In fixture mode, `send()` returns an accepted result with a
// deterministic provider message ID and logs the would-be send
// so tests can assert on the captured payload.
// ─────────────────────────────────────────────────────────────

import type {
  NotificationResult,
  NotificationsProvider,
  SendNotificationParams,
} from "@/providers/contracts";
import { getStudents } from "./fixtures-data";

// In-memory log of every send attempt — useful for tests.
export interface FixtureNotificationLogEntry {
  providerMessageId: string;
  sentAt: string; // ISO 8601
  params: SendNotificationParams;
}

const sendLog: FixtureNotificationLogEntry[] = [];

function generateMessageId(): string {
  // Deterministic per-process counter — keeps IDs unique within a run
  // while remaining stable for snapshot assertions.
  const n = sendLog.length + 1;
  const padded = n.toString().padStart(6, "0");
  return `fixture_msg_${padded}`;
}

function resolveUserLabel(userId: string): string {
  const students = getStudents();
  const found = students.find((s) => s.id === userId);
  return found ? `${found.name} <${found.email}>` : userId;
}

export class FixtureNotificationsProvider implements NotificationsProvider {
  /**
   * Returns `{ accepted: true, providerMessageId: "fixture_msg_..." }`
   * and logs the would-be send. NEVER sends a real notification.
   */
  async send(params: SendNotificationParams): Promise<NotificationResult> {
    const providerMessageId = generateMessageId();
    const sentAt = new Date().toISOString();

    const recipients = params.userIds.map(resolveUserLabel);

    console.info(
      `[fixture:notifications] SEND (not a real delivery) — ` +
        `providerMessageId=${providerMessageId} experienceId=${params.experienceId} ` +
        `recipients=${recipients.length} restPath=${params.restPath ?? "(default)"}`,
      {
        title: params.title,
        contentPreview: params.content.slice(0, 120),
        recipients,
      },
    );

    sendLog.push({ providerMessageId, sentAt, params });

    return {
      accepted: true,
      providerMessageId,
    };
  }
}

/** Test-only accessor: the in-memory log of fixture sends. */
export function getFixtureNotificationLog(): readonly FixtureNotificationLogEntry[] {
  return sendLog;
}

/** Test-only: clear the in-memory send log. */
export function clearFixtureNotificationLog(): void {
  sendLog.length = 0;
}
