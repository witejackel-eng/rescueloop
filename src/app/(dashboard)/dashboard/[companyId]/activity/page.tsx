"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  Users,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import type { DemoActivityEvent } from "@/lib/demo-fixtures";
import { PageTransition } from "@/components/shared/page-transition";

type EventType = DemoActivityEvent["type"] | "all";

const EVENT_META: Record<DemoActivityEvent["type"], { icon: typeof Activity; color: string; label: string; ring: string }> = {
  sync_completed: { icon: RefreshCw, color: "text-[var(--ink-muted)]", label: "Sync", ring: "ring-[var(--ink-muted)]/30" },
  candidate_detected: { icon: AlertCircle, color: "text-[var(--warning)]", label: "Detected", ring: "ring-[var(--warning)]/30" },
  draft_prepared: { icon: Clock, color: "text-[var(--info)]", label: "Draft", ring: "ring-[var(--info)]/30" },
  creator_edited: { icon: MessageSquare, color: "text-[var(--ink-secondary)]", label: "Edited", ring: "ring-[var(--ink-secondary)]/30" },
  approved: { icon: CheckCircle2, color: "text-[var(--recovery-green)]", label: "Approved", ring: "ring-[var(--recovery-green)]/30" },
  student_opened: { icon: Users, color: "text-[var(--info)]", label: "Opened", ring: "ring-[var(--info)]/30" },
  student_responded: { icon: MessageSquare, color: "text-[var(--recovery-green)]", label: "Responded", ring: "ring-[var(--recovery-green)]/30" },
  course_activity_observed: { icon: TrendingUp, color: "text-[var(--recovery-green)]", label: "Activity", ring: "ring-[var(--recovery-green)]/30" },
};

const FILTERS: EventType[] = [
  "all",
  "sync_completed",
  "candidate_detected",
  "draft_prepared",
  "approved",
  "student_responded",
  "course_activity_observed",
];

export default function ActivityPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [filter, setFilter] = useState<EventType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const events = useMemo(() => {
    const list = bundle?.activity ?? [];
    return filter === "all" ? list : list.filter((e) => e.type === filter);
  }, [bundle?.activity, filter]);

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
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Activity</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Operational timeline for your RescueLoop workspace
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh activity"
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          <Filter className="size-3" /> Filter
        </span>
        {FILTERS.map((f) => {
          const count = f === "all"
            ? bundle?.activity?.length ?? 0
            : bundle?.activity?.filter((e) => e.type === f).length ?? 0;
          const active = filter === f;
          const label = f === "all" ? "All" : EVENT_META[f]?.label ?? f;
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
              {label}
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
            <span>Failed to load activity: {error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {loading ? (
        <CardSkeleton rows={8} />
      ) : events.length === 0 ? (
        <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
          <div className="text-center">
            <Activity className="mx-auto size-6 text-[var(--ink-muted)]" />
            <p className="mt-2 text-[12px] text-[var(--ink-muted)]">No events match this filter.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[var(--ink-secondary)]" />
              <h2 className="font-serif text-[15px] text-[var(--ink-primary)]">Recent Events</h2>
            </div>
            <Badge variant="outline" className="rounded-[3px] text-[10px]">
              {events.length} {events.length === 1 ? "event" : "events"}
            </Badge>
          </div>
          <div className="relative">
            {/* Vertical timeline rail — proper 2px line through icon centers */}
            <div
              className="absolute left-[23px] top-3 bottom-3 w-[2px] rounded-full bg-[var(--hairline-subtle)]"
              aria-hidden
            />

            <div className="space-y-0.5">
              <AnimatePresence mode="popLayout">
                {events.map((e, i) => {
                  const meta = EVENT_META[e.type];
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="group relative flex items-start gap-3 rounded-[8px] px-2 py-2 transition-colors duration-200 hover:bg-[var(--canvas-elevated)]"
                    >
                      {/* Uniform 48px circular icon container with type-colored ring on hover */}
                      <div className={cn(
                        "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface)]",
                        "border-[var(--hairline)] transition-all duration-200 group-hover:border-[var(--hairline-strong)] group-hover:shadow-[0_4px_12px_-4px_rgba(17,17,15,0.12)]",
                        "group-hover:ring-2 group-hover:ring-offset-0",
                        meta.ring,
                      )}>
                        <Icon className={cn("size-4 transition-transform duration-200 group-hover:scale-110", meta.color)} />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                              {e.detail}
                            </span>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                              <span className="font-medium text-[var(--ink-secondary)]">{e.actor}</span>
                              <span className="text-[var(--ink-muted)]">·</span>
                              <Badge variant="outline" className={cn("rounded-[2px] text-[9px]", meta.color, "border-current/30")}>
                                {meta.label}
                              </Badge>
                            </p>
                          </div>
                          <span className="shrink-0 rounded-[3px] bg-[var(--canvas)] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[var(--ink-secondary)] transition-colors group-hover:bg-[var(--surface)]">
                            {e.timestamp}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          {/* Sticky footer closure */}
          <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline-subtle)] pt-3 text-[10px] text-[var(--ink-muted)]">
            <span>Showing {events.length} of {bundle?.activity?.length ?? events.length} events</span>
            <button className="font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]">
              Load more
            </button>
          </div>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
