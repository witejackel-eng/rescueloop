"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Wifi, Link2, Bell, Shield, Clock, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const SECTIONS = [
  { title: "Connection", items: [
    { label: "Whop Integration", value: "Connected", status: "healthy" },
    { label: "Webhook URL", value: "https://rescueloop.vercel.app/api/webhooks/whop", status: "healthy" },
    { label: "Last successful sync", value: "2 minutes ago", status: "healthy" },
  ]},
  { title: "Automation", items: [
    { label: "Approval mode", value: "Manual approval required", status: "info" },
    { label: "Quiet hours", value: "10pm – 8am", status: "info" },
    { label: "Default cooldown", value: "7 days", status: "info" },
  ]},
  { title: "Detection Rules", items: [
    { label: "Stall threshold", value: "7 days inactivity", status: "info" },
    { label: "Renewal alert window", value: "5 days before renewal", status: "info" },
    { label: "Max interventions per student", value: "3 per 30 days", status: "info" },
  ]},
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Settings</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">RescueLoop configuration for Creator Growth Lab</p>
      </div>

      {SECTIONS.map((s) => (
        <Card key={s.title} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <h2 className="text-[14px] font-medium text-[var(--ink-primary)]">{s.title}</h2>
          <div className="mt-4 space-y-3">
            {s.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--ink-secondary)]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--ink-primary)]">{item.value}</span>
                  {item.status === "healthy" && (
                    <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
