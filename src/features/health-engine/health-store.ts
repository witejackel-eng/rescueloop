"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HealthSignal, HealthStatus, HealthCheckResult, HealthDomain } from "@/lib/types/health";

// ── Demo health signals ──────────────────────────────────────
// Realistic signals: mostly healthy with 1-2 degraded/unhealthy domains

const DEMO_SIGNALS: HealthSignal[] = [
  {
    domain: "whop",
    status: "healthy",
    label: "Whop",
    description: "Whop platform connection and API access",
    lastChecked: new Date(Date.now() - 60000).toISOString(),
    details: "Connected. API token valid. Last API call 45s ago.",
    dataSafe: true,
    retrying: false,
    actionRequired: false,
  },
  {
    domain: "permissions",
    status: "healthy",
    label: "Permissions",
    description: "Whop permissions and access grants",
    lastChecked: new Date(Date.now() - 120000).toISOString(),
    details: "All required permissions granted. Read members, read courses, send notifications.",
    dataSafe: true,
    retrying: false,
    actionRequired: false,
  },
  {
    domain: "membership_sync",
    status: "degraded",
    label: "Membership Sync",
    description: "Synchronization of member data from Whop",
    lastChecked: new Date(Date.now() - 300000).toISOString(),
    details: "Last full sync completed 15 min ago (normal: <5 min). Incremental sync pending.",
    impact: "New member changes may not appear for up to 20 min.",
    dataSafe: true,
    retrying: true,
    actionRequired: false,
  },
  {
    domain: "course_activity",
    status: "healthy",
    label: "Course Activity",
    description: "Course progress and student activity data",
    lastChecked: new Date(Date.now() - 180000).toISOString(),
    details: "Receiving activity events. 847 events processed in last hour.",
    dataSafe: true,
    retrying: false,
    actionRequired: false,
  },
  {
    domain: "webhooks",
    status: "unhealthy",
    label: "Webhooks",
    description: "Webhook delivery and receipt confirmation",
    lastChecked: new Date(Date.now() - 60000).toISOString(),
    details: "3 webhooks undelivered in the last hour. Last successful delivery 12 min ago.",
    impact: "Billing events and membership changes may be delayed. RescueLoop is using polling fallback.",
    dataSafe: true,
    retrying: true,
    actionRequired: true,
    actionLabel: "Reconnect webhooks",
    actionHref: "/settings",
  },
  {
    domain: "jobs",
    status: "healthy",
    label: "Jobs",
    description: "Background job queue and processing",
    lastChecked: new Date(Date.now() - 30000).toISOString(),
    details: "Job queue healthy. 2 active, 0 stalled, 12 completed in last hour.",
    dataSafe: true,
    retrying: false,
    actionRequired: false,
  },
  {
    domain: "notifications",
    status: "healthy",
    label: "Notifications",
    description: "Notification delivery to students",
    lastChecked: new Date(Date.now() - 240000).toISOString(),
    details: "Notification pipeline operational. 89 delivered, 0 failed in last hour.",
    dataSafe: true,
    retrying: false,
    actionRequired: false,
  },
  {
    domain: "billing",
    status: "healthy",
    label: "Billing",
    description: "Plan status and payment processing",
    lastChecked: new Date(Date.now() - 600000).toISOString(),
    details: "Growth plan active. Next billing cycle Feb 12. Payment method valid.",
    dataSafe: true,
    retrying: false,
    actionRequired: false,
  },
  {
    domain: "data_freshness",
    status: "degraded",
    label: "Data Freshness",
    description: "How recent and current the workspace data is",
    lastChecked: new Date(Date.now() - 120000).toISOString(),
    details: "Member data 18 min old (threshold: 10 min). Course progress 4 min old.",
    impact: "Dashboard metrics may not reflect the very latest activity. No data loss.",
    dataSafe: true,
    retrying: true,
    actionRequired: false,
  },
];

function computeOverall(signals: HealthSignal[]): HealthStatus {
  if (signals.some((s) => s.status === "unhealthy")) return "unhealthy";
  if (signals.some((s) => s.status === "degraded")) return "degraded";
  if (signals.some((s) => s.status === "unknown")) return "unknown";
  return "healthy";
}

interface HealthState {
  signals: HealthSignal[];
  checkedAt: string;

  // Computed
  overallStatus: HealthStatus;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  unknownCount: number;
  actionNeededCount: number;

  // Actions
  refreshHealth: () => void;
  updateSignal: (domain: HealthDomain, patch: Partial<HealthSignal>) => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      signals: DEMO_SIGNALS,
      checkedAt: new Date().toISOString(),

      get overallStatus() {
        return computeOverall(get().signals);
      },
      get healthyCount() {
        return get().signals.filter((s) => s.status === "healthy").length;
      },
      get degradedCount() {
        return get().signals.filter((s) => s.status === "degraded").length;
      },
      get unhealthyCount() {
        return get().signals.filter((s) => s.status === "unhealthy").length;
      },
      get unknownCount() {
        return get().signals.filter((s) => s.status === "unknown").length;
      },
      get actionNeededCount() {
        return get().signals.filter((s) => s.actionRequired).length;
      },

      refreshHealth: () => {
        set({
          signals: DEMO_SIGNALS.map((s) => ({
            ...s,
            lastChecked: new Date().toISOString(),
          })),
          checkedAt: new Date().toISOString(),
        });
      },

      updateSignal: (domain, patch) => {
        set((state) => ({
          signals: state.signals.map((s) =>
            s.domain === domain ? { ...s, ...patch } : s
          ),
        }));
      },
    }),
    { name: "rescueloop-health-v1" }
  )
);
