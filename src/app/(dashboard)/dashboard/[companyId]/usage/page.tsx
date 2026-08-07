"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CreditCard,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import { useState } from "react";

export default function UsagePage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  const plans = bundle?.plans ?? [];
  const currentPlan = bundle?.currentPlan;
  const usage = bundle?.usage;
  const company = bundle?.company;

  const usageItems = usage
    ? [
        {
          label: "Monitored members",
          current: usage.membersUsed,
          limit: usage.membersLimit,
          icon: Users,
          color: "var(--recovery-green)",
        },
        {
          label: "Interventions",
          current: usage.interventionsUsed,
          limit: usage.interventionsLimit,
          icon: Zap,
          color: "var(--info)",
        },
        {
          label: "Rescue Queue actions",
          current: 34,
          limit: 500,
          icon: Activity,
          color: "var(--warning)",
        },
        {
          label: "API calls",
          current: 1842,
          limit: 10000,
          icon: TrendingUp,
          color: "var(--ink-secondary)",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Plan &amp; Usage</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {company ? `${company.name} · ${company.plan} plan` : "Your current plan and usage details"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh usage"
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertTriangle className="size-4" />
            <span>Failed to load usage: {error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Current Usage Card */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-medium text-[var(--ink-primary)]">Current Usage</h2>
          {currentPlan && (
            <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
              {currentPlan.name} plan
            </Badge>
          )}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-2.5 w-24 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                  <div className="h-3 w-32 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-[var(--hairline)]" />
                </div>
              ))
            : usageItems.map((u, i) => {
                const pct = Math.min((u.current / u.limit) * 100, 100);
                const isWarning = pct > 70;
                const Icon = u.icon;
                return (
                  <motion.div
                    key={u.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-secondary)]">
                        <Icon className="size-3" />
                        {u.label}
                      </div>
                      {isWarning && (
                        <AlertTriangle className="size-3 text-[var(--warning)]" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="font-mono text-[16px] tabular-nums text-[var(--ink-primary)]">
                        {u.current.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-[var(--ink-muted)]">
                        / {u.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--canvas)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.07 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          "h-full rounded-full",
                          isWarning ? "bg-[var(--warning)]" : `bg-[var(--recovery-green)]`
                        )}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
                      {pct.toFixed(0)}% utilized
                    </p>
                  </motion.div>
                );
              })}
        </div>
      </Card>

      {/* Plan comparison */}
      <div>
        <h2 className="mb-3 text-[14px] font-medium text-[var(--ink-primary)]">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : plans.map((plan, i) => {
                const isCurrent = currentPlan?.id === plan.id;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card
                      className={cn(
                        "group overflow-hidden rounded-[8px] bg-[var(--surface)] transition-all",
                        isCurrent
                          ? "border-[var(--recovery-green)]/40 shadow-[0_0_0_1px_var(--recovery-green)]/10"
                          : "border border-[var(--hairline)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]"
                      )}
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-[18px] text-[var(--ink-primary)]">{plan.name}</span>
                          {isCurrent && (
                            <Badge className="rounded-[3px] text-[9px] bg-[var(--recovery-green)] text-white">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-baseline gap-0.5">
                          <span className="font-serif text-[32px] text-[var(--ink-primary)]">${plan.price}</span>
                          <span className="text-[14px] text-[var(--ink-muted)]">/mo</span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-[11px]">
                            <Users className="size-3 text-[var(--ink-muted)]" />
                            <span className="text-[var(--ink-secondary)]">
                              Up to {plan.memberLimit.toLocaleString()} members
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <Zap className="size-3 text-[var(--ink-muted)]" />
                            <span className="text-[var(--ink-secondary)]">
                              Up to {plan.interventionLimit.toLocaleString()} interventions
                            </span>
                          </div>
                        </div>

                        {/* Feature list */}
                        <ul className="mt-4 space-y-1.5">
                          {(plan.name === "Rescue"
                            ? ["Rescue Queue", "Basic playbooks", "Email support"]
                            : plan.name === "Growth"
                              ? ["Everything in Rescue", "Course insights", "Priority support"]
                              : ["Everything in Growth", "API access", "Dedicated support"]
                          ).map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-[11px] text-[var(--ink-secondary)]">
                              <CheckCircle2 className="size-3 text-[var(--recovery-green)]/60" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full rounded-[6px] text-[11px]"
                            onClick={() => toast.info(`Plan change to ${plan.name} would take effect at next billing cycle`)}
                          >
                            {plan.price < (currentPlan?.price ?? 0) ? "Downgrade" : "Upgrade"}
                            <ArrowRight className="ml-1 size-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Billing note */}
      {!loading && (
        <Card className="rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] p-4">
          <div className="flex items-start gap-2.5">
            <CreditCard className="mt-0.5 size-3.5 shrink-0 text-[var(--ink-muted)]" />
            <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
              Billing is managed through your Whop subscription. Plan changes take effect at the next billing cycle.
              Usage counters reset monthly. Contact support if you need a plan outside these tiers.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
