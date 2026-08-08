"use client";

import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  RefreshCw,
  MailX,
  CreditCard,
  Webhook,
  TrendingUp,
} from "lucide-react";
import type { ExceptionSummary } from "@/lib/types/operations-internal";

interface ExceptionSummaryCardsProps {
  summary: ExceptionSummary;
}

const CARDS = [
  {
    key: "healthyTenants" as const,
    label: "Healthy Tenants",
    icon: ShieldCheck,
    color: "text-[var(--recovery-green)]",
    bg: "bg-[var(--recovery-light)]",
  },
  {
    key: "needingAction" as const,
    label: "Needing Action",
    icon: AlertTriangle,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning-light)]",
  },
  {
    key: "permissionFailures" as const,
    label: "Permission Failures",
    icon: Lock,
    color: "text-[var(--critical)]",
    bg: "bg-[var(--critical-light)]",
  },
  {
    key: "stalledSyncs" as const,
    label: "Stalled Syncs",
    icon: RefreshCw,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning-light)]",
  },
  {
    key: "deadLetters" as const,
    label: "Dead Letters",
    icon: MailX,
    color: "text-[var(--critical)]",
    bg: "bg-[var(--critical-light)]",
  },
  {
    key: "billingIssues" as const,
    label: "Billing Issues",
    icon: CreditCard,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning-light)]",
  },
  {
    key: "webhookLags" as const,
    label: "Webhook Lag",
    icon: Webhook,
    color: "text-[var(--info)]",
    bg: "bg-[#D6E4F0]",
  },
  {
    key: "highCostTenants" as const,
    label: "High-Cost Tenants",
    icon: TrendingUp,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning-light)]",
  },
] as const;

export function ExceptionSummaryCards({ summary }: ExceptionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {CARDS.map((card) => {
        const value = summary[card.key];
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="flex flex-col items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-4"
          >
            <div className={`flex size-8 items-center justify-center rounded-[6px] ${card.bg}`}>
              <Icon className={`size-4 ${card.color}`} strokeWidth={2} />
            </div>
            <span className="font-mono text-[20px] tabular-nums text-[var(--ink-primary)]">
              {value}
            </span>
            <span className="text-center text-[11px] leading-tight text-[var(--ink-muted)]">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
