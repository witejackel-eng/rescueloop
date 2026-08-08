"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Inbox, Loader2, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SegmentNav,
  MobileStageNav,
  STAGE_DEFS,
} from "./segment-nav";
import { WP04StudentRow } from "./wp04-student-row";
import { WP04Inspector } from "./wp04-inspector";
import { useKeyboardQueue } from "./keyboard-handler";
import type { InterventionState, Priority, QueueTab, RiskSegment } from "@/lib/types";
import type {
  QueueItem,
  QueueResponse,
  InterventionDetail,
} from "./wp04-types";
import { stateToQueueTab } from "./wp04-types";

// ── Props ────────────────────────────────────────────────────
interface RescueQueueClientProps {
  companyId: string;
  /** Initial data from server render (pre-fetched awaiting_review) */
  initialItems?: QueueItem[];
  initialCounts?: Record<QueueTab, number>;
}

// ── Main component ───────────────────────────────────────────
export function RescueQueueClient({
  companyId,
  initialItems = [],
  initialCounts,
}: RescueQueueClientProps) {
  // ── State ──────────────────────────────────────────────────
  const [items, setItems] = useState<QueueItem[]>(initialItems);
  const [counts, setCounts] = useState<Record<QueueTab, number>>(
    initialCounts ?? computeDefaultCounts(initialItems),
  );
  const [activeStage, setActiveStage] = useState<QueueTab>("awaiting_review");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorDetail, setInspectorDetail] = useState<InterventionDetail | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskSegment | "all">("all");
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // ── Fetch queue data ───────────────────────────────────────
  const fetchQueue = useCallback(async (stage?: QueueTab) => {
    const targetStage = stage ?? activeStage;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/queue?stage=${targetStage}`,
      );
      if (!res.ok) {
        // If API not available yet, don't crash — just show empty
        if (res.status === 404) {
          if (mountedRef.current) setItems([]);
          return;
        }
        const json = await res.json().catch(() => ({}));
        toast.error((json as { error?: string }).error ?? "Failed to load queue");
        return;
      }
      const data = (await res.json()) as QueueResponse;
      if (mountedRef.current) {
        setItems(data.items);
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      // Network error — leave existing data in place
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [companyId, activeStage]);

  // Fetch on stage change
  const handleStageChange = useCallback((stage: QueueTab) => {
    setActiveStage(stage);
    setSelectedId(null);
    setInspectorDetail(null);
    setInspectorOpen(false);
    fetchQueue(stage);
  }, [fetchQueue]);

  // ── Fetch inspector detail ─────────────────────────────────
  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/queue/${encodeURIComponent(id)}`,
      );
      if (!res.ok) return null;
      return (await res.json()) as InterventionDetail;
    } catch {
      return null;
    }
  }, [companyId]);

  // ── Select row / open inspector ────────────────────────────
  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id);
    const detail = await fetchDetail(id);
    setInspectorDetail(detail);
    setInspectorOpen(true);
  }, [fetchDetail]);

  // ── Actions ────────────────────────────────────────────────
  const postAction = useCallback(async (
    action: "approve" | "dismiss" | "schedule" | "suppress",
    interventionId: string,
    body?: Record<string, unknown>,
  ) => {
    setBusyAction(action);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/queue/${encodeURIComponent(interventionId)}/${action}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: body ? JSON.stringify(body) : "{}",
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Failed to ${action}.`);
        return;
      }
      toast.success(`${actionLabel(action)} — ${inspectorDetail?.studentName ?? "Student"}`);
      // Optimistically remove from list
      setItems((prev) => prev.filter((i) => i.id !== interventionId));
      setInspectorOpen(false);
      setInspectorDetail(null);
      setSelectedId(null);
      // Re-fetch for updated counts
      void fetchQueue();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyAction(null);
    }
  }, [companyId, inspectorDetail, fetchQueue]);

  const handleApprove = useCallback((id: string) => postAction("approve", id), [postAction]);
  const handleDismiss = useCallback((id: string) => postAction("dismiss", id), [postAction]);
  const handleSuppress = useCallback((id: string) => postAction("suppress", id), [postAction]);
  const handleSchedule = useCallback((id: string, _when: string) => {
    postAction("schedule", id, { scheduledFor: _when });
  }, [postAction]);

  // ── Keyboard shortcuts ─────────────────────────────────────
  const visibleRows = useMemo(() => filteredItems(items, priorityFilter), [items, priorityFilter]);

  useKeyboardQueue({
    rows: visibleRows.map((r) => ({ id: r.id, selectable: true })),
    activeId: selectedId,
    onActiveId: (id) => {
      if (id) setSelectedId(id);
    },
    onOpenInspector: (id) => handleSelect(id),
    onCloseInspector: () => {
      setInspectorOpen(false);
      setInspectorDetail(null);
    },
    onApprove: handleApprove,
    onDismiss: handleDismiss,
    onSchedule: (id) => {
      // Open schedule popover — for now just approve
      toast.info("Press Schedule in the inspector panel");
    },
    inspectorOpen,
    enabled: true,
  });

  // ── Close inspector on mobile sheet ────────────────────────
  const handleCloseInspector = useCallback(() => {
    setInspectorOpen(false);
    setInspectorDetail(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left sidebar: segment nav (desktop) */}
      <SegmentNav
        activeStage={activeStage}
        onStageChange={handleStageChange}
        counts={counts}
        priorityFilter={priorityFilter}
        onPriorityFilter={setPriorityFilter}
        riskFilter={riskFilter}
        onRiskFilter={setRiskFilter}
      />

      {/* Center: student list */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile stage nav */}
        <MobileStageNav
          activeStage={activeStage}
          onStageChange={handleStageChange}
          counts={counts}
        />

        {/* Keyboard hint */}
        <div className="hidden items-center gap-2 border-b border-[var(--hairline)] px-4 py-1.5 lg:flex">
          <Keyboard className="size-3 text-[var(--ink-muted)]" />
          <span className="font-mono text-[10px] text-[var(--ink-muted)]">
            j/k navigate · a approve · d dismiss · s schedule · esc close
          </span>
        </div>

        {/* Student list */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-5 animate-spin text-[var(--ink-muted)]" />
              <span className="ml-2 text-[13px] text-[var(--ink-muted)]">Loading queue…</span>
            </div>
          ) : visibleRows.length === 0 ? (
            <EmptyState stage={activeStage} />
          ) : (
            <div role="listbox" aria-label="Students in queue" tabIndex={0}>
              <AnimatePresence initial={false} mode="popLayout">
                {visibleRows.map((item) => (
                  <WP04StudentRow
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    onSelect={() => handleSelect(item.id)}
                    onApprove={() => handleApprove(item.id)}
                    onDismiss={() => handleDismiss(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* List count footer */}
        <div className="flex items-center justify-between border-t border-[var(--hairline)] bg-[var(--canvas)] px-4 py-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            {visibleRows.length} {visibleRows.length === 1 ? "student" : "students"}
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {activeStage.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Inspector: desktop panel */}
      <div className="hidden w-[420px] shrink-0 lg:block">
        <WP04Inspector
          companyId={companyId}
          detail={inspectorDetail}
          onApprove={handleApprove}
          onSchedule={handleSchedule}
          onDismiss={handleDismiss}
          onSuppress={handleSuppress}
          variant="column"
          busyAction={busyAction}
        />
      </div>

      {/* Inspector: mobile sheet */}
      <Sheet open={inspectorOpen} onOpenChange={(open) => { if (!open) handleCloseInspector(); }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Intervention details</SheetTitle>
            <SheetDescription>Review and take action on this intervention</SheetDescription>
          </SheetHeader>
          <WP04Inspector
            companyId={companyId}
            detail={inspectorDetail}
            onApprove={handleApprove}
            onSchedule={handleSchedule}
            onDismiss={handleDismiss}
            onSuppress={handleSuppress}
            variant="sheet"
            busyAction={busyAction}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function filteredItems(items: QueueItem[], priorityFilter: Priority | "all"): QueueItem[] {
  if (priorityFilter === "all") return items;
  return items.filter((i) => i.priority === priorityFilter);
}

function computeDefaultCounts(items: QueueItem[]): Record<QueueTab, number> {
  const counts: Record<QueueTab, number> = {
    awaiting_review: 0,
    approved: 0,
    scheduled: 0,
    sent: 0,
    responded: 0,
    recovered: 0,
    dismissed: 0,
  };
  for (const item of items) {
    const tab = stateToQueueTab(item.state);
    counts[tab]++;
  }
  return counts;
}

function actionLabel(action: string): string {
  switch (action) {
    case "approve": return "Approved";
    case "dismiss": return "Dismissed";
    case "schedule": return "Scheduled";
    case "suppress": return "Suppressed";
    default: return action;
  }
}

// ── Empty state ──────────────────────────────────────────────
const EMPTY_COPY: Record<QueueTab, { title: string; description: string }> = {
  awaiting_review: {
    title: "No students awaiting review",
    description:
      "When RescueLoop detects a new risk signal, you'll see it here for approval.",
  },
  approved: {
    title: "Nothing approved and waiting",
    description:
      "Approved interventions move to Scheduled or Sent once they're queued for delivery.",
  },
  scheduled: {
    title: "No interventions scheduled",
    description:
      "Interventions you schedule for a future time will appear here until they send.",
  },
  sent: {
    title: "No interventions in flight",
    description:
      "Sent messages and active threads show up here while you wait for a response.",
  },
  responded: {
    title: "No active responses",
    description:
      "When a member replies to a rescue message, you'll see the conversation here.",
  },
  recovered: {
    title: "No recoveries yet",
    description:
      "Members who return to the course after a rescue will appear here once confirmed.",
  },
  dismissed: {
    title: "Nothing dismissed",
    description:
      "Interventions you decline or stop will be archived here for your records.",
  },
};

function EmptyState({ stage }: { stage: QueueTab }) {
  const copy = EMPTY_COPY[stage];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center px-6 py-20 text-center"
    >
      <div className="flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
        <Inbox className="size-4" />
      </div>
      <h3 className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">{copy.title}</h3>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-[var(--ink-muted)]">
        {copy.description}
      </p>
    </motion.div>
  );
}
