import { NextResponse } from "next/server";

// Demo health signals for API consumption
const DEMO_SIGNALS = [
  { domain: "whop", status: "healthy", label: "Whop", details: "Connected. API token valid.", dataSafe: true, retrying: false, actionRequired: false },
  { domain: "permissions", status: "healthy", label: "Permissions", details: "All required permissions granted.", dataSafe: true, retrying: false, actionRequired: false },
  { domain: "membership_sync", status: "degraded", label: "Membership Sync", details: "Last full sync completed 15 min ago.", impact: "New member changes may not appear for up to 20 min.", dataSafe: true, retrying: true, actionRequired: false },
  { domain: "course_activity", status: "healthy", label: "Course Activity", details: "Receiving activity events. 847 events processed in last hour.", dataSafe: true, retrying: false, actionRequired: false },
  { domain: "webhooks", status: "unhealthy", label: "Webhooks", details: "3 webhooks undelivered in the last hour.", impact: "Billing events and membership changes may be delayed.", dataSafe: true, retrying: true, actionRequired: true, actionLabel: "Reconnect webhooks" },
  { domain: "jobs", status: "healthy", label: "Jobs", details: "Job queue healthy. 2 active, 0 stalled.", dataSafe: true, retrying: false, actionRequired: false },
  { domain: "notifications", status: "healthy", label: "Notifications", details: "89 delivered, 0 failed in last hour.", dataSafe: true, retrying: false, actionRequired: false },
  { domain: "billing", status: "healthy", label: "Billing", details: "Growth plan active. Payment method valid.", dataSafe: true, retrying: false, actionRequired: false },
  { domain: "data_freshness", status: "degraded", label: "Data Freshness", details: "Member data 18 min old (threshold: 10 min).", impact: "Dashboard metrics may not reflect the very latest activity. No data loss.", dataSafe: true, retrying: true, actionRequired: false },
];

export async function GET() {
  const overallStatus = DEMO_SIGNALS.some(s => s.status === "unhealthy")
    ? "unhealthy"
    : DEMO_SIGNALS.some(s => s.status === "degraded")
      ? "degraded"
      : "healthy";

  return NextResponse.json({
    signals: DEMO_SIGNALS,
    overallStatus,
    checkedAt: new Date().toISOString(),
    healthyCount: DEMO_SIGNALS.filter(s => s.status === "healthy").length,
    degradedCount: DEMO_SIGNALS.filter(s => s.status === "degraded").length,
    unhealthyCount: DEMO_SIGNALS.filter(s => s.status === "unhealthy").length,
  });
}
