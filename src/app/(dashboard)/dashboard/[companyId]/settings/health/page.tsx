"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";

const DOMAINS = [
  { name: "Whop connection", status: "healthy", detail: "Webhook receiving, permissions valid" },
  { name: "Permissions", status: "healthy", detail: "All required scopes granted" },
  { name: "Membership sync", status: "healthy", detail: "742 members synced, last sync 2 min ago" },
  { name: "Course activity", status: "healthy", detail: "8 courses active, progress events flowing" },
  { name: "Webhooks", status: "degraded", detail: "Delivery P95 latency 4.2s (threshold: 3s)" },
  { name: "Jobs", status: "healthy", detail: "No failed jobs, queue depth: 0" },
  { name: "Notifications", status: "healthy", detail: "Whop DM channel operational" },
  { name: "Billing", status: "healthy", detail: "Growth plan active, entitlement valid" },
  { name: "Data freshness", status: "healthy", detail: "All entities synced within 15 min" },
];

export default function SystemHealthPage() {
  const healthy = DOMAINS.filter((d) => d.status === "healthy").length;
  const total = DOMAINS.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">System Health</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">{healthy}/{total} domains healthy</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((d) => (
          <Card key={d.name} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--ink-primary)]">{d.name}</span>
              {d.status === "healthy" ? (
                <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
                  <CheckCircle2 className="mr-1 size-3" /> Healthy
                </Badge>
              ) : d.status === "degraded" ? (
                <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--warning)]/30 text-[var(--warning)]">
                  <AlertCircle className="mr-1 size-3" /> Degraded
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--critical)]/30 text-[var(--critical)]">
                  <AlertTriangle className="mr-1 size-3" /> Unhealthy
                </Badge>
              )}
            </div>
            <p className="mt-2 text-[11px] text-[var(--ink-muted)]">{d.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
