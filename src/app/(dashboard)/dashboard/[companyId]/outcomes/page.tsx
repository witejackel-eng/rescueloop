"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  TrendingUp,
  Eye,
  BarChart3,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import type { DemoOutcome } from "@/lib/demo-fixtures";

type Classification = DemoOutcome["classification"];

const TIER_META: Record<Classification, {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  accent: string;
  leftBorder: string;
  description: string;
}> = {
  confirmed_recovered: {
    label: "Confirmed recovered",
    icon: ShieldCheck,
    color: "text-[var(--recovery-green)]",
    accent: "border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/5",
    leftBorder: "border-l-[3px] border-l-[var(--recovery-green)]",
    description: "Auditable monetary reversal events. Requires direct evidence.",
  },
  strongly_associated: {
    label: "Strongly associated",
    icon: TrendingUp,
    color: "text-[var(--info)]",
    accent: "border-[var(--info)]/30 bg-[var(--info)]/5",
    leftBorder: "border-l-[3px] border-l-[var(--info)]",
    description: "Students who resumed activity after intervention. Causal chain not fully isolated.",
  },
  observed: {
    label: "Observed",
    icon: Eye,
    color: "text-[var(--ink-secondary)]",
    accent: "border-[var(--hairline-strong)] bg-[var(--canvas-elevated)]/50",
    leftBorder: "border-l-[3px] border-l-[var(--critical)]",
    description: "RescueLoop observed return-to-activity events after outreach.",
  },
  estimated_opportunity: {
    label: "Estimated opportunity",
    icon: BarChart3,
    color: "text-[var(--ink-muted)]",
    accent: "border-[var(--ink-muted)]/20 bg-[var(--canvas-elevated)]/30",
    leftBorder: "border-l-[3px] border-l-[var(--warning)]",
    description: "Modeled projection of potential re-engagement. Not recovered revenue.",
  },
};

export default function OutcomesPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const outcomes = bundle?.outcomes ?? [];

  const tierCounts = useMemo(() => {
    return {
      confirmed_recovered: outcomes.filter((o) => o.classification === "confirmed_recovered").length,
      strongly_associated: outcomes.filter((o) => o.classification === "strongly_associated").length,
      observed: outcomes.filter((o) => o.classification === "observed").length,
      estimated_opportunity: outcomes.filter((o) => o.classification === "estimated_opportunity").length,
    };
  }, [outcomes]);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Outcomes</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Evidence-tiered recovery attribution</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh outcomes"
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Truth banner */}
      <Card className="rounded-[8px] border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
          <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink-primary)]">Evidence tiers are never summed.</span>{" "}
            Estimated opportunity is not labeled as recovered revenue. Confirmed recovery requires an auditable reversal event.
          </p>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertCircle className="size-4" />
            <span>Failed to load outcomes: {error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Tier summary */}
      <div className="mt-6 border-t border-[var(--hairline)] pt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} showHeader={false} rows={1} className="p-4" />
          ))
        ) : (
          (Object.keys(TIER_META) as Classification[]).map((tier) => {
            const meta = TIER_META[tier];
            const Icon = meta.icon;
            return (
              <Card key={tier} className={cn("rounded-[8px] border bg-[var(--surface)] p-4", meta.accent, meta.leftBorder)}>
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("size-4", meta.color)} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                    {meta.label}
                  </span>
                </div>
                <div className={cn("mt-2 font-serif text-[28px] font-semibold leading-none tabular-nums", meta.color)}>
                  {tierCounts[tier]}
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-[var(--ink-muted)]">
                  {meta.description}
                </p>
              </Card>
            );
          })
        )}
      </div>
      </div>

      {/* Outcome list */}
      {loading ? (
        <CardSkeleton rows={5} />
      ) : outcomes.length === 0 ? (
        <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-6 text-[var(--ink-muted)]" />
            <p className="mt-2 text-[12px] text-[var(--ink-muted)]">No outcomes recorded yet.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <h2 className="font-serif text-[16px] font-semibold text-[var(--ink-primary)]">Attribution Ledger</h2>
          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
            {outcomes.length} outcome{outcomes.length === 1 ? "" : "s"} · click to expand evidence
          </p>
          <div className="mt-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {outcomes.map((o, i) => {
                const meta = TIER_META[o.classification];
                const Icon = meta.icon;
                const isExpanded = expandedId === o.id;
                return (
                  <motion.div
                    key={o.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      className={cn(
                        "w-full rounded-[6px] border bg-[var(--canvas)] px-4 py-3 text-left transition-all",
                        isExpanded ? meta.accent : "border-[var(--hairline)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("size-4 shrink-0", meta.color)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-[var(--ink-primary)]">{o.student}</span>
                            <Badge variant="outline" className={cn("rounded-[3px] text-[9px]", meta.accent, meta.color)}>
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--ink-secondary)]">{o.description}</p>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                          {o.date}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="size-4 shrink-0 text-[var(--ink-muted)]" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-[var(--ink-muted)]" />
                        )}
                      </div>

                      {/* Expanded evidence */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 border-t border-[var(--hairline)] pt-3">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                                Evidence chain
                              </span>
                              <ul className="mt-2 space-y-1.5">
                                {o.evidence.map((ev, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-[12px] text-[var(--ink-secondary)]">
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--ink-muted)]" />
                                    <span>{ev}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </Card>
      )}
    </div>
  );
}
