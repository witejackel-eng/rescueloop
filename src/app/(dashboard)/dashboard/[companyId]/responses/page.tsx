"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Clock,
  RefreshCw,
  AlertCircle,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import type { DemoResponse } from "@/lib/demo-fixtures";
import { PageTransition } from "@/components/shared/page-transition";

type ResponseFilter = "all" | "Continue course" | "I need help" | "I'm blocked" | "Stop reminders";

const FILTERS: ResponseFilter[] = ["all", "Continue course", "I need help", "I'm blocked", "Stop reminders"];

const RESPONSE_META: Record<DemoResponse["response"], { color: string; bg: string; border: string; icon: typeof MessageSquare }> = {
  "Continue course": { color: "text-[var(--recovery-green)]", bg: "bg-[var(--recovery-green)]/10 border-[var(--recovery-green)]/30", border: "border-l-[var(--recovery-green)]", icon: ArrowUpRight },
  "I need help": { color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10 border-[var(--warning)]/30", border: "border-l-[var(--warning)]", icon: MessageSquare },
  "I'm blocked": { color: "text-[var(--critical)]", bg: "bg-[var(--critical)]/10 border-[var(--critical)]/30", border: "border-l-[var(--critical)]", icon: AlertCircle },
  "Stop reminders": { color: "text-[var(--ink-muted)]", bg: "bg-[var(--ink-muted)]/10 border-[var(--ink-muted)]/30", border: "border-l-[var(--ink-muted)]", icon: Clock },
};

export default function ResponsesPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [filter, setFilter] = useState<ResponseFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const responses = useMemo(() => {
    const list = bundle?.responses ?? [];
    return filter === "all" ? list : list.filter((r) => r.response === filter);
  }, [bundle?.responses, filter]);

  const counts = useMemo(() => {
    const list = bundle?.responses ?? [];
    return {
      total: list.length,
      continue: list.filter((r) => r.response === "Continue course").length,
      help: list.filter((r) => r.response === "I need help").length,
      blocked: list.filter((r) => r.response === "I'm blocked").length,
      stop: list.filter((r) => r.response === "Stop reminders").length,
    };
  }, [bundle?.responses]);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <PageTransition>
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Responses</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {loading ? (
              <span className="inline-block h-3 w-48 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
            ) : (
              <>{counts.total} student responses received</>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh responses"
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {!loading && counts.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Continue course", value: counts.continue, color: "text-[var(--recovery-green)]", accent: "bg-[var(--recovery-green)]", borderAccent: "before:bg-[var(--recovery-green)]" },
            { label: "Need help", value: counts.help, color: "text-[var(--warning)]", accent: "bg-[var(--warning)]", borderAccent: "before:bg-[var(--warning)]" },
            { label: "Blocked", value: counts.blocked, color: "text-[var(--critical)]", accent: "bg-[var(--critical)]", borderAccent: "before:bg-[var(--critical)]" },
            { label: "Opted out", value: counts.stop, color: "text-[var(--ink-muted)]", accent: "bg-[var(--ink-muted)]", borderAccent: "before:bg-[var(--ink-muted)]" },
          ].map((s) => (
            <Card key={s.label} className={cn(
              "relative overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-3",
              "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
              s.borderAccent,
            )}>
              <div className="flex items-center gap-1.5 pl-1">
                <span className={cn("size-1.5 rounded-full", s.accent)} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">{s.label}</span>
              </div>
              <div className={cn("mt-1.5 pl-1 font-serif text-[24px] leading-none tabular-nums", s.color)}>
                {s.value}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          <Filter className="size-3" /> Filter
        </span>
        {FILTERS.map((f) => {
          const count = f === "all"
            ? counts.total
            : bundle?.responses?.filter((r) => r.response === f).length ?? 0;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-all",
                active
                  ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-white"
                  : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
              )}
            >
              {f === "all" ? "All" : f}
              <span className={cn("font-mono text-[10px] tabular-nums", active ? "text-white/70" : "text-[var(--ink-muted)]")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertCircle className="size-4" />
            <span>Failed to load responses: {error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} showHeader={false} rows={2} className="p-4" />
          ))}
        </div>
      ) : responses.length === 0 ? (
        <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
          <div className="text-center">
            <MessageSquare className="mx-auto size-6 text-[var(--ink-muted)]" />
            <p className="mt-2 text-[12px] text-[var(--ink-muted)]">No responses match this filter.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {responses.map((r, i) => {
              const meta = RESPONSE_META[r.response];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <Card className={cn(
                    "group rounded-[8px] border border-l-[3px] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]",
                    meta.border,
                  )}>
                    <div className="flex items-start gap-3">
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-[6px] border", meta.bg)}>
                        <Icon className={cn("size-3.5", meta.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[var(--ink-primary)]">{r.student}</span>
                          <span className="text-[var(--ink-muted)]">·</span>
                          <span className="truncate text-[11px] text-[var(--ink-muted)]">{r.course}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge variant="outline" className={cn("rounded-[3px] text-[10px]", meta.bg, meta.color)}>
                            {r.response}
                          </Badge>
                          <span className="text-[11px] text-[var(--ink-secondary)]">{r.followUpState}</span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                        {r.timestamp}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
