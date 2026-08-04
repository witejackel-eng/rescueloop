"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Search, RotateCcw, Keyboard, X, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import { RESCUE_QUEUE_ROWS, INTERVENTIONS } from "@/lib/mock-data";
import type { InterventionState, Priority, QueueTab, RiskSegment } from "@/lib/types";
import { SegmentNav, MobileStageNav, STAGE_DEFS } from "@/components/rescueloop/rescue-queue/segment-nav";
import { StudentList } from "@/components/rescueloop/rescue-queue/student-list";
import { Inspector } from "@/components/rescueloop/rescue-queue/inspector";
import { useKeyboardQueue } from "@/components/rescueloop/rescue-queue/keyboard-handler";
import {
  LiveQueueRow,
  PRIORITY_WEIGHT,
} from "@/components/rescueloop/rescue-queue/student-row";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Track whether the viewport is below the lg breakpoint (1024px).
// Used to decide whether tapping a row opens the bottom-sheet inspector
// (mobile) or just updates the right column (desktop).
function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(max-width: 1023px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches,
    () => false,
  );
}

// Map each stage to the intervention states it represents.
const STAGE_STATES: Record<QueueTab, InterventionState[]> = {
  awaiting_review: ["awaiting_approval"],
  approved: ["approved"],
  scheduled: ["scheduled"],
  sent: ["sent", "opened"],
  responded: ["responded"],
  recovered: ["recovered"],
  dismissed: ["dismissed", "stopped"],
};

export default function RescueQueuePage() {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const queueItems = useDemoStore((s) => s.queueItems);
  const approveIntervention = useDemoStore((s) => s.approveIntervention);
  const scheduleIntervention = useDemoStore((s) => s.scheduleIntervention);
  const dismissIntervention = useDemoStore((s) => s.dismissIntervention);
  const excludeStudent = useDemoStore((s) => s.excludeStudent);
  const undoAction = useDemoStore((s) => s.undoAction);
  const triggerDemoRecovery = useDemoStore((s) => s.triggerDemoRecovery);
  const resetDemo = useDemoStore((s) => s.resetDemo);

  const [activeStage, setActiveStage] = useState<QueueTab>("awaiting_review");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskSegment | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetFull, setSheetFull] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);

  // Merge static mock rows with live store state.
  const mergedRows: LiveQueueRow[] = useMemo(() => {
    return RESCUE_QUEUE_ROWS.map((row) => {
      const live = queueItems.find((q) => q.id === row.id);
      return {
        ...row,
        liveInterventionState: live?.interventionState ?? row.interventionState,
        liveProgress: live?.progressPercent ?? row.progressPercent,
        scheduledFor: live?.scheduledFor ?? null,
        excluded: live?.excluded ?? false,
      };
    });
  }, [queueItems]);

  // Per-stage counts (excluding excluded students).
  const counts = useMemo(() => {
    const c: Record<QueueTab, number> = {
      awaiting_review: 0,
      approved: 0,
      scheduled: 0,
      sent: 0,
      responded: 0,
      recovered: 0,
      dismissed: 0,
    };
    for (const row of mergedRows) {
      if (row.excluded && activeStage !== "dismissed") {
        // Excluded students only show up under dismissed (since exclude sets state=dismissed).
      }
      for (const stage of STAGE_DEFS) {
        if (STAGE_STATES[stage.value].includes(row.liveInterventionState)) {
          if (row.excluded && stage.value !== "dismissed") continue;
          c[stage.value]++;
          break;
        }
      }
    }
    return c;
  }, [mergedRows, activeStage]);

  // Filter + sort rows for the active stage.
  const visibleRows = useMemo(() => {
    const states = STAGE_STATES[activeStage];
    const q = search.trim().toLowerCase();
    return mergedRows
      .filter((row) => {
        if (!states.includes(row.liveInterventionState)) return false;
        if (row.excluded && activeStage !== "dismissed") return false;
        if (priorityFilter !== "all" && row.priority !== priorityFilter) return false;
        if (riskFilter !== "all") {
          const cs = row.student.courseStates[0];
          if (cs?.riskSegment !== riskFilter) return false;
        }
        if (q) {
          const hay = `${row.student.name} ${row.student.email} ${row.trigger}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => PRIORITY_WEIGHT(b.priority) - PRIORITY_WEIGHT(a.priority));
  }, [mergedRows, activeStage, search, priorityFilter, riskFilter]);

  // Derived selection — falls back to null when the selected row is no longer
  // visible (e.g., filtered out, or moved to another stage after an action).
  // This avoids set-state-in-effect cascades while keeping the selection valid.
  const effectiveSelectedId = useMemo(() => {
    if (selectedId && visibleRows.some((r) => r.id === selectedId)) {
      return selectedId;
    }
    return null;
  }, [selectedId, visibleRows]);

  const selectedRow = useMemo(
    () => (effectiveSelectedId ? mergedRows.find((r) => r.id === effectiveSelectedId) ?? null : null),
    [mergedRows, effectiveSelectedId],
  );

  const selectedIntervention = useMemo(() => {
    if (!selectedRow) return null;
    const studentId = selectedRow.student.id;
    return INTERVENTIONS.find((iv) => iv.studentId === studentId) ?? null;
  }, [selectedRow]);

  const previousInterventions = useMemo(() => {
    if (!selectedRow || !selectedIntervention) return [];
    const studentId = selectedRow.student.id;
    return INTERVENTIONS.filter(
      (iv) => iv.studentId === studentId && iv.id !== selectedIntervention.id,
    );
  }, [selectedRow, selectedIntervention]);

  // ── Actions ────────────────────────────────────────────────────
  // After approve/dismiss/exclude, the row leaves the visible list, so we
  // advance the selection to the next visible row to keep the workflow moving.
  const pickNextId = useCallback(
    (currentId: string): string | null => {
      const idx = visibleRows.findIndex((r) => r.id === currentId);
      if (idx === -1) return visibleRows[0]?.id ?? null;
      return visibleRows[idx + 1]?.id ?? visibleRows[idx - 1]?.id ?? null;
    },
    [visibleRows],
  );

  const handleApprove = useCallback(
    (id: string) => {
      const row = mergedRows.find((r) => r.id === id);
      const nextId = pickNextId(id);
      approveIntervention(id);
      setSelectedId(nextId);
      toast(`Intervention approved — ${row?.student.name ?? "student"}`, {
        action: { label: "Undo", onClick: () => undoAction(id) },
      });
    },
    [approveIntervention, mergedRows, undoAction, pickNextId],
  );

  const handleSchedule = useCallback(
    (id: string, when: string) => {
      const row = mergedRows.find((r) => r.id === id);
      const nextId = pickNextId(id);
      scheduleIntervention(id, when);
      setSelectedId(nextId);
      toast(`Scheduled for ${when} — ${row?.student.name ?? "student"}`, {
        action: { label: "Undo", onClick: () => undoAction(id) },
      });
    },
    [scheduleIntervention, mergedRows, undoAction, pickNextId],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      const row = mergedRows.find((r) => r.id === id);
      const nextId = pickNextId(id);
      dismissIntervention(id);
      setSelectedId(nextId);
      toast(`Intervention dismissed — ${row?.student.name ?? "student"}`, {
        action: { label: "Undo", onClick: () => undoAction(id) },
      });
    },
    [dismissIntervention, mergedRows, undoAction, pickNextId],
  );

  const handleExclude = useCallback(
    (id: string) => {
      const row = mergedRows.find((r) => r.id === id);
      const nextId = pickNextId(id);
      excludeStudent(id);
      setSelectedId(nextId);
      toast(`Excluded from automation — ${row?.student.name ?? "student"}`, {
        action: { label: "Undo", onClick: () => undoAction(id) },
      });
    },
    [excludeStudent, mergedRows, undoAction, pickNextId],
  );

  const handleTriggerRecovery = useCallback(
    (id: string, name: string) => {
      triggerDemoRecovery(id, name);
      toast(`Demo recovery triggered — ${name}`, {
        action: { label: "Undo", onClick: () => undoAction(id) },
      });
    },
    [triggerDemoRecovery, undoAction],
  );

  // Keyboard "S" — schedule with default time.
  const handleScheduleFromKeyboard = useCallback(
    (id: string) => handleSchedule(id, "Tomorrow · 9:00 AM"),
    [handleSchedule],
  );

  useKeyboardQueue({
    rows: visibleRows,
    selectedId: effectiveSelectedId,
    onSelectId: setSelectedId,
    onApprove: handleApprove,
    onDismiss: handleDismiss,
    onSchedule: handleScheduleFromKeyboard,
    enabled: true,
  });

  // Mobile: selecting a row opens the inspector sheet. On desktop, the right
  // column inspector updates in place without any sheet.
  function handleSelect(id: string) {
    setSelectedId(id);
    if (isMobile) setSheetOpen(true);
  }

  function handleStageChange(stage: QueueTab) {
    setActiveStage(stage);
    setSelectedId(null);
    setSheetOpen(false);
  }

  function handleReset() {
    resetDemo();
    setSelectedId(null);
    setSheetOpen(false);
    toast("Demo reset to its initial state");
  }

  const awaitingCount = counts.awaiting_review;

  return (
    <div className="flex h-[calc(100dvh-130px)] flex-col gap-3 lg:h-[calc(100dvh-150px)]">
      {/* Compact page header */}
      <header className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
            Rescue Queue
          </h1>
          <span className="font-mono text-[12px] tabular-nums text-[var(--ink-muted)]">
            {awaitingCount} awaiting review
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="search"
              placeholder="Search students"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-none border border-[var(--hairline)] bg-[var(--surface)] pl-8 pr-2 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink-primary)] focus:outline-none sm:w-[220px]"
              aria-label="Search students"
            />
          </div>

          <Popover open={hintsOpen} onOpenChange={setHintsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-none text-[var(--ink-muted)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)]"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-64 rounded-none border-[var(--hairline)] bg-[var(--surface)] p-3"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Shortcuts
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[12px]">
                {[
                  { label: "Next student", keys: "J" },
                  { label: "Previous student", keys: "K" },
                  { label: "Approve selected", keys: "A" },
                  { label: "Schedule selected", keys: "S" },
                  { label: "Dismiss selected", keys: "D" },
                ].map((row) => (
                  <li
                    key={row.keys}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[var(--ink-secondary)]">{row.label}</span>
                    <kbd className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-primary)]">
                      {row.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 rounded-none px-2 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)]"
          >
            <RotateCcw className="size-3.5" />
            Reset demo
          </Button>
        </div>
      </header>

      {/* Split-view grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border border-[var(--hairline)] bg-[var(--canvas)] lg:grid-cols-[220px_1fr_420px] lg:border-0">
        <SegmentNav
          activeStage={activeStage}
          onStageChange={handleStageChange}
          counts={counts}
          priorityFilter={priorityFilter}
          onPriorityFilter={setPriorityFilter}
          riskFilter={riskFilter}
          onRiskFilter={setRiskFilter}
        />

        <div className="flex min-h-0 flex-col lg:contents">
          <MobileStageNav
            activeStage={activeStage}
            onStageChange={handleStageChange}
            counts={counts}
          />
          <StudentList
            className="min-h-0 flex-1 overflow-y-auto bg-[var(--canvas)] lg:flex-none lg:border-l lg:border-r lg:border-[var(--hairline)]"
            rows={visibleRows}
            selectedId={effectiveSelectedId}
            onSelect={handleSelect}
            onApprove={handleApprove}
            onDismiss={handleDismiss}
            activeStage={activeStage}
            reduced={reduced}
          />
        </div>

        {/* Desktop inspector */}
        <section className="hidden min-h-0 lg:block lg:h-full">
          <Inspector
            row={selectedRow}
            intervention={selectedIntervention}
            previousInterventions={previousInterventions}
            onApprove={handleApprove}
            onSchedule={handleSchedule}
            onDismiss={handleDismiss}
            onExclude={handleExclude}
            onTriggerRecovery={handleTriggerRecovery}
            variant="column"
          />
        </section>
      </div>

      {/* Mobile inspector bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-none border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0 gap-0",
            "[&>button:last-child]:hidden",
            sheetFull ? "h-[100dvh]" : "h-[88dvh]",
          )}
        >
          {/* Custom sheet header — drag handle + expand + close */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--hairline)] px-4 py-2">
            <button
              type="button"
              onClick={() => setSheetFull((v) => !v)}
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label={sheetFull ? "Collapse sheet" : "Expand sheet"}
            >
              {sheetFull ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronUp className="size-3.5" />
              )}
              {sheetFull ? "Collapse" : "Expand"}
            </button>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Inspector
            </span>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Close inspector"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <Inspector
              row={selectedRow}
              intervention={selectedIntervention}
              previousInterventions={previousInterventions}
              onApprove={handleApprove}
              onSchedule={handleSchedule}
              onDismiss={(id) => {
                handleDismiss(id);
                setSheetOpen(false);
              }}
              onExclude={(id) => {
                handleExclude(id);
                setSheetOpen(false);
              }}
              onTriggerRecovery={handleTriggerRecovery}
              variant="sheet"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
