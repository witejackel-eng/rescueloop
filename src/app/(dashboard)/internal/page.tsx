"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  AlertTriangle,
  Shield,
  RefreshCw,
  CreditCard,
  Webhook,
  DollarSign,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const SUMMARY = {
  totalOrgs: 184,
  healthy: 176,
  needsAttention: 8,
};

const ATTENTION_BREAKDOWN = [
  { type: "Permission failures", count: 2, icon: Shield, color: "text-[var(--warning)]" },
  { type: "Stalled sync", count: 1, icon: RefreshCw, color: "text-[var(--critical)]" },
  { type: "Dead-letter jobs", count: 1, icon: AlertTriangle, color: "text-[var(--warning)]" },
  { type: "Billing issues", count: 2, icon: CreditCard, color: "text-[var(--critical)]" },
  { type: "Webhook delay", count: 1, icon: Webhook, color: "text-[var(--warning)]" },
  { type: "High-cost tenant", count: 1, icon: DollarSign, color: "text-[var(--info)]" },
];

const NAV_LINKS = [
  { href: "/internal/orgs", label: "Organizations", icon: Building2 },
  { href: "/internal/costs", label: "Costs", icon: DollarSign },
  { href: "/internal/scale", label: "Scale", icon: BarChart3 },
  { href: "/internal/growth", label: "Growth", icon: TrendingUp },
];

export default function InternalOperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Internal Operations</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Operator console · strict internal auth required</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Organizations</span>
          <p className="mt-2 font-serif text-[36px] text-[var(--ink-primary)]">{SUMMARY.totalOrgs}</p>
        </Card>
        <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Healthy</span>
          <p className="mt-2 font-serif text-[36px] text-[var(--recovery-green)]">{SUMMARY.healthy}</p>
        </Card>
        <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Needs attention</span>
          <p className="mt-2 font-serif text-[36px] text-[var(--warning)]">{SUMMARY.needsAttention}</p>
        </Card>
      </div>

      {/* Attention breakdown */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Attention Breakdown</h2>
        <div className="mt-4 space-y-3">
          {ATTENTION_BREAKDOWN.map((item) => (
            <div key={item.type} className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2.5">
                <item.icon className={`size-4 ${item.color}`} />
                <span className="text-[var(--ink-secondary)]">{item.type}</span>
              </div>
              <span className={`font-medium ${item.color}`}>{item.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="flex cursor-pointer items-center gap-3 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline)] hover:shadow-sm">
              <link.icon className="size-5 text-[var(--ink-secondary)]" />
              <span className="text-[13px] font-medium text-[var(--ink-primary)]">{link.label}</span>
              <ArrowRight className="ml-auto size-4 text-[var(--ink-muted)]" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
