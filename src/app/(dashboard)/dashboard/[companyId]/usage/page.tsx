"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Users, Zap, FileText } from "lucide-react";

const PLANS = [
  { name: "Rescue", price: "$29", members: 250, features: ["Rescue Queue", "Basic playbooks", "Email support"] },
  { name: "Growth", price: "$59", members: 1000, features: ["Everything in Rescue", "Course insights", "Priority support"], current: true },
  { name: "Scale", price: "$119", members: 2500, features: ["Everything in Growth", "API access", "Dedicated support"] },
];

export default function UsagePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Plan & Usage</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Your current plan and usage details</p>
      </div>

      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <h2 className="text-[14px] font-medium text-[var(--ink-primary)]">Current Usage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Monitored members", current: 742, limit: 1000 },
            { label: "Interventions", current: 118, limit: 2000 },
            { label: "Rescue Queue actions", current: 34, limit: 500 },
            { label: "API calls", current: 1842, limit: 10000 },
          ].map((u) => (
            <div key={u.label}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--ink-secondary)]">{u.label}</span>
                <span className="text-[var(--ink-primary)]">{u.current.toLocaleString()} / {u.limit.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--canvas)]">
                <div
                  className="h-full rounded-full bg-[var(--recovery-green)]"
                  style={{ width: `${Math.min((u.current / u.limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={`rounded-[8px] border bg-[var(--surface)] p-5 ${p.current ? "border-[var(--recovery-green)]/40" : "border-[var(--hairline)]"}`}>
            <div className="flex items-center justify-between">
              <span className="font-serif text-[18px] text-[var(--ink-primary)]">{p.name}</span>
              {p.current && <Badge className="rounded-[3px] text-[9px] bg-[var(--recovery-green)]">Current</Badge>}
            </div>
            <p className="mt-2 font-serif text-[32px] text-[var(--ink-primary)]">{p.price}<span className="text-[14px] text-[var(--ink-muted)]">/mo</span></p>
            <p className="text-[12px] text-[var(--ink-muted)]">Up to {p.members.toLocaleString()} members</p>
            <ul className="mt-3 space-y-1">
              {p.features.map((f) => (
                <li key={f} className="text-[11px] text-[var(--ink-secondary)]">• {f}</li>
              ))}
            </ul>
            {!p.current && (
              <Button variant="outline" size="sm" className="mt-4 w-full rounded-[6px] text-[11px]">
                Upgrade
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
