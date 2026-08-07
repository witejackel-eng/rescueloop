"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Calendar,
  X,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Filter,
  Wifi,
  MessageSquare,
  History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import type { DemoQueueCandidate } from "@/lib/demo-fixtures";

type PriorityFilter = "all" | "urgent" | "high" | "medium";

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function RescueQueuePage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, string>>({});
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const candidates = useMemo(() => {
    const list = bundle?.queueCandidates ?? [];
    const filtered = priorityFilter === "all"
      ? list
      : list.filter((c) => c.priority === priorityFilter);
    return [...filtered].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99),
    );
  }, [bundle?.queueCandidates, priorityFilter]);

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  function priorityColor(priority: string) {
    return priority === "urgent"
      ? "border-[var(--critical)]/30 text-[var(--critical)]"
      : priority === "high"
        ? "border-[var(--warning)]/30 text-[var(--warning)]"
        : "border-[var(--info)]/30 text-[var(--info)]";
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Rescue Queue</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {loading ? (
              <span className="inline-block h-3 w-32 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
            ) : (
              <>
                {candidates.length} student{candidates.length === 1 ? "" : "s"} need attention
                {bundle?.company?.lastSync && (
                  <span className="ml-2 text-[var(--ink-muted)]">· synced {bundle.company.lastSync}</span>
                )}
              </>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh queue"
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
            <span>Failed to load queue: {error}</span>
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

      {/* Priority filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          <Filter className="size-3" /> Filter
        </span>
        {(["all", "urgent", "high", "medium"] as PriorityFilter[]).map((p) => {
          const count =
            p === "all"
              ? bundle?.queueCandidates?.length ?? 0
              : bundle?.queueCandidates?.filter((c) => c.priority === p).length ?? 0;
          const active = priorityFilter === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] capitalize transition-all",
                active
                  ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-white"
                  : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
              )}
            >
              {p}
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  active ? "text-white/70" : "text-[var(--ink-muted)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Queue list */}
        <div className="space-y-2.5 lg:col-span-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} showHeader={false} rows={2} className="p-4" />
            ))
          ) : candidates.length === 0 ? (
            <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-6 text-[var(--recovery-green)]" />
                <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
                  No students match this filter.
                </p>
              </div>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {candidates.map((c, i) => {
                const isSelected = selectedId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer rounded-[8px] border bg-[var(--surface)] p-4 transition-all",
                        isSelected
                          ? "border-[var(--recovery-green)]/40 shadow-[0_0_0_1px_var(--recovery-green)]/20"
                          : "border-[var(--hairline)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
                      )}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="size-6 shrink-0 rounded-full bg-[var(--canvas-elevated)] font-mono text-[10px] font-medium leading-6 text-center text-[var(--ink-secondary)]">
                              {c.initials}
                            </span>
                            <span className="text-[14px] font-medium text-[var(--ink-primary)]">
                              {c.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-[3px] text-[9px] capitalize",
                                priorityColor(c.priority),
                              )}
                            >
                              {c.priority}
                            </Badge>
                            {c.membershipStatus === "cancelling" && (
                              <Badge
                                variant="outline"
                                className="rounded-[3px] text-[9px] border-[var(--critical)]/30 text-[var(--critical)]"
                              >
                                Cancelling
                              </Badge>
                            )}
                            {c.membershipStatus === "trialing" && (
                              <Badge
                                variant="outline"
                                className="rounded-[3px] text-[9px] border-[var(--info)]/30 text-[var(--info)]"
                              >
                                Trial
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-[12px] text-[var(--ink-secondary)]">
                            {c.trigger}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
                            ${c.monthlyValue}/mo
                          </span>
                          <ChevronRight
                            className={cn(
                              "size-4 text-[var(--ink-muted)] transition-transform",
                              isSelected && "rotate-90 text-[var(--recovery-green)]",
                            )}
                          />
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[var(--ink-muted)]">
                        <span className="truncate">{c.course}</span>
                        <span>·</span>
                        <span>{c.daysInactive}d inactive</span>
                        <span>·</span>
                        <span>{c.progress}% complete</span>
                        {c.cooldownUntil && (
                          <>
                            <span>·</span>
                            <span className="text-[var(--warning)]">cooldown {c.cooldownUntil}</span>
                          </>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-[var(--hairline)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, Math.min(100, c.progress))}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
                          className="h-full rounded-full bg-[var(--recovery-green)]"
                        />
                      </div>

                      {/* Action feedback */}
                      {actionState[c.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 overflow-hidden rounded-[4px] bg-[var(--recovery-green)]/10 px-3 py-2 text-[11px] text-[var(--recovery-green)]"
                        >
                          {actionState[c.id]}
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Inspector */}
        <div className="lg:col-span-2">
          {loading ? (
            <CardSkeleton showHeader rows={6} />
          ) : selected ? (
            <InspectorPanel
              candidate={selected}
              actionState={actionState[selected.id]}
              onAction={(action) =>
                setActionState((prev) => ({
                  ...prev,
                  [selected.id]: action,
                }))
              }
            />
          ) : (
            <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] text-[13px] text-[var(--ink-muted)]">
              <div className="text-center">
                <Clock className="mx-auto size-5 text-[var(--ink-muted)]" />
                <p className="mt-2">Select a candidate to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InspectorPanel({
  candidate,
  actionState,
  onAction,
}: {
  candidate: DemoQueueCandidate;
  actionState?: string;
  onAction: (action: string) => void;
}) {
  return (
    <Card className="sticky top-4 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
      <motion.div
        key={candidate.id}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">
              {candidate.name}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "rounded-[3px] text-[9px] capitalize",
                candidate.priority === "urgent"
                  ? "border-[var(--critical)]/30 text-[var(--critical)]"
                  : candidate.priority === "high"
                    ? "border-[var(--warning)]/30 text-[var(--warning)]"
                    : "border-[var(--info)]/30 text-[var(--info)]",
              )}
            >
              {candidate.priority}
            </Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
            {candidate.course} · ${candidate.monthlyValue}/mo
          </p>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Last activity
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-[var(--ink-primary)]">
              {candidate.lastActivity}
            </div>
          </div>
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Progress
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-[var(--ink-primary)]">
              {candidate.progress}%
            </div>
          </div>
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Renewal
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-[var(--ink-primary)]">
              {candidate.renewalDate}
            </div>
          </div>
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Risk segment
            </div>
            <div className="mt-0.5 text-[var(--ink-primary)]">
              {candidate.riskSegment}
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <AlertTriangle className="size-3" /> Evidence
          </span>
          <ul className="mt-1.5 space-y-1">
            {candidate.evidence.map((ev, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-[var(--ink-secondary)]"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--ink-muted)]" />
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact history */}
        {candidate.contactHistory.length > 0 && (
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              <History className="size-3" /> Contact history
            </span>
            <ul className="mt-1.5 space-y-1">
              {candidate.contactHistory.map((h, i) => (
                <li
                  key={i}
                  className="rounded-[4px] bg-[var(--canvas)] px-2 py-1.5 text-[11px] text-[var(--ink-secondary)]"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Draft message */}
        <div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <MessageSquare className="size-3" /> Draft message
          </span>
          <div className="mt-1.5 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-[12px] leading-relaxed text-[var(--ink-secondary)]">
            {candidate.draftMessage}
          </div>
        </div>

        {/* Action feedback */}
        {actionState && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden rounded-[4px] bg-[var(--recovery-green)]/10 px-3 py-2 text-[11px] text-[var(--recovery-green)]"
          >
            {actionState}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 rounded-[6px] text-[12px] bg-[var(--recovery-green)] hover:bg-[var(--recovery-green)]/90"
            onClick={() => onAction("Approved — queued for delivery")}
          >
            <CheckCircle2 className="mr-1.5 size-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-[6px] text-[12px]"
            onClick={() => onAction("Scheduled — sending tomorrow at 9am")}
          >
            <Calendar className="mr-1.5 size-3.5" /> Schedule
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-[6px] text-[12px]"
            onClick={() => onAction("Dismissed — added to cooldown list")}
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Sync hint */}
        <div className="flex items-center gap-1.5 border-t border-[var(--hairline)] pt-3 text-[10px] text-[var(--ink-muted)]">
          <Wifi className="size-3 text-[var(--recovery-green)]" />
          <span>Demo mode — no real messages are sent to students.</span>
        </div>
      </motion.div>
    </Card>
  );
}
