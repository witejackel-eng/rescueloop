"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  RESCUE_QUEUE_ROWS,
  ACTIVITY_FEED,
  VALUE_EVENTS,
  NOTIFICATIONS,
} from "@/lib/mock-data";
import type {
  InterventionState,
  ActivityEvent,
  ValueEvent,
  Notification,
  NotificationPreferences,
  AutomationState,
} from "@/lib/types";

// ── Demo state shape ─────────────────────────────────────────
// This store makes the frontend behave like a coherent product
// demonstration. State changes propagate across the queue, activity
// feed, value ledger, and notification centre.

interface QueueItemState {
  id: string;
  interventionState: InterventionState;
  scheduledFor: string | null;
  excluded: boolean;
  progressPercent: number;
}

interface DemoState {
  // Automation
  automationState: AutomationState;

  // Queue
  queueItems: QueueItemState[];

  // Activity feed (newest first)
  activity: ActivityEvent[];

  // Value ledger
  valueEvents: ValueEvent[];

  // Notifications
  notifications: Notification[];

  // Notification preferences (Notifications Center)
  notificationPreferences: NotificationPreferences;

  // Student-facing blocker submissions
  blockerSubmissions: { studentId: string; blocker: string; note: string | null; createdAt: string }[];

  // Command palette open state
  commandPaletteOpen: boolean;

  // ── Actions ──
  setAutomationState: (s: AutomationState) => void;
  pauseAutomation: () => void;
  resumeAutomation: () => void;

  approveIntervention: (id: string) => void;
  scheduleIntervention: (id: string, when: string) => void;
  sendIntervention: (id: string) => void;
  dismissIntervention: (id: string) => void;
  excludeStudent: (id: string) => void;
  undoAction: (id: string) => void;

  addActivity: (event: ActivityEvent) => void;
  addValueEvent: (event: ValueEvent) => void;
  resolveNotification: (id: string) => void;

  // Notifications Center actions
  markNotificationRead: (id: string, read: boolean) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  bulkMarkNotificationsRead: (ids: string[]) => void;
  bulkDismissNotifications: (ids: string[]) => void;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
  resetNotificationPreferences: () => void;

  submitBlocker: (studentId: string, blocker: string, note: string | null) => void;

  triggerDemoRecovery: (studentId: string, studentName: string) => void;

  setCommandPaletteOpen: (open: boolean) => void;

  resetDemo: () => void;
}

function initialQueue(): QueueItemState[] {
  return RESCUE_QUEUE_ROWS.map((r) => ({
    id: r.id,
    interventionState: r.interventionState,
    scheduledFor: null,
    excluded: r.student.excluded,
    progressPercent: r.progressPercent,
  }));
}

function seedActivity(): ActivityEvent[] {
  return ACTIVITY_FEED.map((a, i) => ({
    ...a,
    id: `ac_${i}`,
    timestamp: a.timestamp,
    type: a.type,
    studentName: a.studentName,
    detail: a.detail,
    value: a.value,
  }));
}

// Default notification preferences — every channel & alert is on, except
// Slack which is gated as "Coming soon".
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  rescueCandidateDetected: true,
  highRiskMember: true,
  recoveryCompleted: true,
  memberResponded: true,
  responseOverdue: true,
  positiveFeedback: true,
  syncCompleted: false,
  syncFailed: true,
  maintenanceScheduled: true,
  channelInApp: true,
  channelEmail: true,
  channelSlack: false,
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      automationState: "manual_approval",
      queueItems: initialQueue(),
      activity: seedActivity(),
      valueEvents: [...VALUE_EVENTS],
      notifications: [...NOTIFICATIONS],
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      blockerSubmissions: [],
      commandPaletteOpen: false,

      setAutomationState: (s) => set({ automationState: s }),
      pauseAutomation: () => set({ automationState: "paused" }),
      resumeAutomation: () => set({ automationState: "manual_approval" }),

      approveIntervention: (id) => {
        const item = get().queueItems.find((q) => q.id === id);
        if (!item) return;
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === id ? { ...q, interventionState: "approved" as InterventionState } : q,
          ),
          activity: [
            {
              id: `ac_${Date.now()}`,
              timestamp: "just now",
              type: "campaign_scheduled",
              studentName: "You",
              detail: "Approved an intervention — queued for sending",
            },
            ...state.activity,
          ],
        }));
      },

      scheduleIntervention: (id, when) => {
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === id
              ? { ...q, interventionState: "scheduled" as InterventionState, scheduledFor: when }
              : q,
          ),
          activity: [
            {
              id: `ac_${Date.now()}`,
              timestamp: "just now",
              type: "campaign_scheduled",
              studentName: "You",
              detail: `Intervention scheduled for ${when}`,
            },
            ...state.activity,
          ],
        }));
      },

      sendIntervention: (id) => {
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === id ? { ...q, interventionState: "sent" as InterventionState } : q,
          ),
        }));
      },

      dismissIntervention: (id) => {
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === id ? { ...q, interventionState: "dismissed" as InterventionState } : q,
          ),
        }));
      },

      excludeStudent: (id) => {
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === id ? { ...q, excluded: true, interventionState: "dismissed" as InterventionState } : q,
          ),
        }));
      },

      undoAction: (id) => {
        // Restore to awaiting_approval
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === id
              ? { ...q, interventionState: "awaiting_approval" as InterventionState, excluded: false, scheduledFor: null }
              : q,
          ),
        }));
      },

      addActivity: (event) =>
        set((state) => ({ activity: [event, ...state.activity].slice(0, 60) })),

      addValueEvent: (event) =>
        set((state) => ({ valueEvents: [event, ...state.valueEvents] })),

      resolveNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, resolved: true } : n,
          ),
        })),

      // ── Notifications Center actions ──
      markNotificationRead: (id, read) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, resolved: read } : n,
          ),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.dismissed ? n : { ...n, resolved: true },
          ),
        })),

      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, dismissed: true } : n,
          ),
        })),

      bulkMarkNotificationsRead: (ids) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            ids.includes(n.id) ? { ...n, resolved: true } : n,
          ),
        })),

      bulkDismissNotifications: (ids) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            ids.includes(n.id) ? { ...n, dismissed: true } : n,
          ),
        })),

      setNotificationPreference: (key, value) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: value,
          },
        })),

      resetNotificationPreferences: () =>
        set({ notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES } }),

      submitBlocker: (studentId, blocker, note) => {
        const submission = {
          studentId,
          blocker,
          note,
          createdAt: new Date().toISOString(),
        };
        const nowIso = new Date().toISOString();
        set((state) => ({
          blockerSubmissions: [submission, ...state.blockerSubmissions],
          notifications: [
            {
              id: `nt_blocker_${Date.now()}`,
              type: "help_request" as const,
              category: "response" as const,
              title: "Student reported a blocker",
              description: `A student reported: ${blocker.replace(/_/g, " ")}`,
              createdAt: "just now",
              createdAtIso: nowIso,
              resolved: false,
              dismissed: false,
              actionLabel: "Review request",
              actionHref: "/students",
            },
            ...state.notifications,
          ],
          activity: [
            {
              id: `ac_${Date.now()}`,
              timestamp: "just now",
              type: "blocker_collected" as const,
              studentName: "Maya",
              detail: `Reported: ${blocker.replace(/_/g, " ")}`,
            },
            ...state.activity,
          ],
        }));
      },

      triggerDemoRecovery: (studentId, studentName) => {
        const now = new Date().toISOString();
        set((state) => ({
          queueItems: state.queueItems.map((q) =>
            q.id === studentId
              ? {
                  ...q,
                  interventionState: "recovered" as InterventionState,
                  progressPercent: Math.min(q.progressPercent + 4, 100),
                }
              : q,
          ),
          activity: [
            {
              id: `ac_${Date.now()}`,
              timestamp: "just now",
              type: "student_resumed" as const,
              studentName,
              detail: "Completed a lesson after intervention — progress increased",
            },
            {
              id: `ac_${Date.now()}_2`,
              timestamp: "just now",
              type: "recovery_confirmed" as const,
              studentName,
              detail: "Demonstration recovery event triggered",
              value: 79,
            },
            ...state.activity,
          ],
          valueEvents: [
            {
              id: `ve_${Date.now()}`,
              event: "Demo recovery triggered",
              studentId,
              studentName,
              intervention: "Manual demo trigger",
              evidence: "Demonstration event — student returned and completed a lesson",
              attributionLevel: "confirmed" as const,
              monetaryValue: 79,
              date: now.split("T")[0],
            },
            ...state.valueEvents,
          ],
        }));
      },

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      resetDemo: () =>
        set({
          automationState: "manual_approval",
          queueItems: initialQueue(),
          activity: seedActivity(),
          valueEvents: [...VALUE_EVENTS],
          notifications: [...NOTIFICATIONS],
          notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
          blockerSubmissions: [],
          commandPaletteOpen: false,
        }),
    }),
    {
      name: "rescueloop-demo-v2",
      partialize: (state) => ({
        automationState: state.automationState,
        queueItems: state.queueItems,
        activity: state.activity.slice(0, 30),
        valueEvents: state.valueEvents,
        notifications: state.notifications,
        notificationPreferences: state.notificationPreferences,
        blockerSubmissions: state.blockerSubmissions,
      }),
      // Migrate older persisted state that lacks the new notification fields.
      // Each notification gets category/createdAtIso/dismissed backfilled with
      // reasonable defaults derived from its existing type & createdAt string.
      migrate: (persisted: unknown) => {
        if (!persisted || typeof persisted !== "object") return persisted as DemoState;
        const s = persisted as Partial<DemoState>;
        if (Array.isArray(s.notifications)) {
          s.notifications = s.notifications.map((n) => {
            if (n.category && n.createdAtIso && typeof n.dismissed === "boolean") return n;
            const category =
              n.category ??
              (n.type === "help_request"
                ? "response"
                : n.type === "creator_mention" || n.type === "member_mention"
                  ? "mention"
                  : n.type === "sync_problem" || n.type === "campaign_paused" || n.type === "plan_limit"
                    ? "system"
                    : "rescue");
            const createdAtIso =
              n.createdAtIso ?? new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const dismissed = n.dismissed ?? false;
            return { ...n, category, createdAtIso, dismissed } as Notification;
          });
        }
        if (!s.notificationPreferences) {
          s.notificationPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };
        }
        return s as DemoState;
      },
      version: 2,
    },
  ),
);

// ── Selectors ────────────────────────────────────────────────

export function useQueueCountByState(state: InterventionState) {
  return useDemoStore((s) => s.queueItems.filter((q) => q.interventionState === state && !q.excluded).length);
}

export function useUnresolvedNotificationCount() {
  return useDemoStore((s) => s.notifications.filter((n) => !n.resolved && !n.dismissed).length);
}

/**
 * useNotifications — selector returning the full notification list (newest
 * first by createdAtIso). Dismissed notifications remain in the list so the
 * Notifications Center can show a "show dismissed" toggle.
 */
export function useNotifications() {
  return useDemoStore((s) =>
    [...s.notifications].sort(
      (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
    ),
  );
}

export function useNotificationPreferences() {
  return useDemoStore((s) => s.notificationPreferences);
}

export function useQueueItem(id: string) {
  return useDemoStore((s) => s.queueItems.find((q) => q.id === id));
}
