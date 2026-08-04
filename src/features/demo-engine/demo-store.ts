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

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      automationState: "manual_approval",
      queueItems: initialQueue(),
      activity: seedActivity(),
      valueEvents: [...VALUE_EVENTS],
      notifications: [...NOTIFICATIONS],
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

      submitBlocker: (studentId, blocker, note) => {
        const submission = {
          studentId,
          blocker,
          note,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          blockerSubmissions: [submission, ...state.blockerSubmissions],
          notifications: [
            {
              id: `nt_blocker_${Date.now()}`,
              type: "help_request" as const,
              title: "Student reported a blocker",
              description: `A student reported: ${blocker.replace(/_/g, " ")}`,
              createdAt: "just now",
              resolved: false,
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
        blockerSubmissions: state.blockerSubmissions,
      }),
    },
  ),
);

// ── Selectors ────────────────────────────────────────────────

export function useQueueCountByState(state: InterventionState) {
  return useDemoStore((s) => s.queueItems.filter((q) => q.interventionState === state && !q.excluded).length);
}

export function useUnresolvedNotificationCount() {
  return useDemoStore((s) => s.notifications.filter((n) => !n.resolved).length);
}

export function useQueueItem(id: string) {
  return useDemoStore((s) => s.queueItems.find((q) => q.id === id));
}
