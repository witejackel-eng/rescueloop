"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Search, X, Inbox } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { KPIS, STUDENTS } from "@/lib/mock-data";
import {
  countForView,
  DEFAULT_FILTERS,
  isDefaultFilters,
  matchesFilters,
  matchesSavedView,
  SAVED_VIEWS,
  type SavedViewId,
  type StudentFilters,
} from "@/lib/students-directory";
import type { Student } from "@/lib/types";
import { SavedFilters } from "@/components/rescueloop/students/saved-filters";
import { MomentumLegend } from "@/components/rescueloop/students/momentum-legend";
import { StudentRow, StudentCard } from "@/components/rescueloop/students/student-row";
import { StudentInspector } from "@/components/rescueloop/students/student-inspector";

// Track whether the viewport is below the lg breakpoint (1024px).
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

export default function StudentsPage() {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<SavedViewId>("all");
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(
    () => new Set(STUDENTS.filter((s) => s.excluded).map((s) => s.id)),
  );

  // Counts for each saved filter (computed across the full STUDENTS set).
  const viewCounts = useMemo(() => {
    const counts: Record<SavedViewId, number> = {
      all: STUDENTS.length,
      needs_attention: 0,
      never_started: 0,
      inactive_7plus: 0,
      renewing_this_week: 0,
      cancellation_pending: 0,
      previously_rescued: 0,
    };
    for (const v of SAVED_VIEWS) {
      if (v.id === "all") continue;
      counts[v.id] = countForView(STUDENTS, v.id, excludedIds);
    }
    return counts;
  }, [excludedIds]);

  const savedFilterPills = SAVED_VIEWS.map((v) => ({
    id: v.id,
    label: v.label,
    count: viewCounts[v.id],
  }));

  // Filtered students: saved view + bar filters.
  const filteredStudents = useMemo(
    () =>
      STUDENTS.filter((s) => matchesSavedView(s, activeView, excludedIds)).filter((s) =>
        matchesFilters(s, filters),
      ),
    [activeView, filters, excludedIds],
  );

  const filtersActive = !isDefaultFilters(filters);

  const selectedStudent = useMemo(() => {
    if (!selectedId) return null;
    return STUDENTS.find((s) => s.id === selectedId) ?? null;
  }, [selectedId]);

  const selectedExcluded = selectedStudent ? excludedIds.has(selectedStudent.id) : false;

  function updateFilter<K extends keyof StudentFilters>(
    key: K,
    value: StudentFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleSelect(student: Student) {
    setSelectedId(student.id);
    if (isMobile) setSheetOpen(true);
  }

  function toggleExcluded(studentId: string, next: boolean) {
    setExcludedIds((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(studentId);
      else nextSet.delete(studentId);
      return nextSet;
    });
  }

  function handleToggleExclude(next: boolean) {
    if (!selectedStudent) return;
    toggleExcluded(selectedStudent.id, next);
    toast(
      next
        ? `Excluded from automation — ${selectedStudent.name}`
        : `Re-included in automation — ${selectedStudent.name}`,
    );
  }

  function handleSendMessage() {
    if (!selectedStudent) return;
    toast.info(`Opening message composer for ${selectedStudent.name}`);
  }

  return (
    <div className="flex h-[calc(100dvh-130px)] flex-col gap-3 lg:h-[calc(100dvh-150px)]">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
            Students
          </h1>
          <span className="font-mono text-[12px] tabular-nums text-[var(--ink-muted)]">
            {KPIS.totalStudents} members
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="search"
              placeholder="Search students"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="h-8 w-full rounded-none border border-[var(--hairline)] bg-[var(--surface)] pl-8 pr-2 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink-primary)] focus:outline-none sm:w-[260px]"
              aria-label="Search students"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => updateFilter("search", "")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <MomentumLegend />
        </div>
      </header>

      {/* Saved filters */}
      <div className="shrink-0 border-b border-[var(--hairline)]">
        <SavedFilters
          pills={savedFilterPills}
          active={activeView}
          onChange={(id) => setActiveView(id as SavedViewId)}
        />
      </div>

      {/* Filter bar (collapsible feel — small inline selects) */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <FilterSelect
          label="Membership"
          value={filters.membershipStatus}
          onValueChange={(v) =>
            updateFilter("membershipStatus", v as StudentFilters["membershipStatus"])
          }
          items={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "trialing", label: "Trial" },
            { value: "cancelling", label: "Cancelling" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <FilterSelect
          label="Risk"
          value={filters.riskSegment}
          onValueChange={(v) =>
            updateFilter("riskSegment", v as StudentFilters["riskSegment"])
          }
          items={[
            { value: "all", label: "All segments" },
            { value: "never_started", label: "Never started" },
            { value: "early_stall", label: "Early stall" },
            { value: "mid_course_stall", label: "Mid-course stall" },
            { value: "near_completion", label: "Near completion" },
            { value: "scheduled_cancellation", label: "Scheduled cancellation" },
          ]}
        />
        <FilterSelect
          label="Activity"
          value={filters.lastActivity}
          onValueChange={(v) =>
            updateFilter("lastActivity", v as StudentFilters["lastActivity"])
          }
          items={[
            { value: "any", label: "Any activity" },
            { value: "today", label: "Today" },
            { value: "3d", label: "3+ days ago" },
            { value: "7d", label: "7+ days ago" },
            { value: "14d", label: "14+ days ago" },
            { value: "30d", label: "30+ days ago" },
          ]}
        />
        <FilterSelect
          label="Response"
          value={filters.responseState}
          onValueChange={(v) =>
            updateFilter("responseState", v as StudentFilters["responseState"])
          }
          items={[
            { value: "any", label: "Any response" },
            { value: "responded", label: "Responded" },
            { value: "not_responded", label: "Not responded" },
            { value: "recovered", label: "Recovered" },
          ]}
        />
        <span className="ml-auto font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          {filteredStudents.length} of {STUDENTS.length}
        </span>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Two-column layout: list + inspector */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border border-[var(--hairline)] bg-[var(--canvas)] lg:grid-cols-[1fr_400px] lg:border-0">
        {/* List column */}
        <div className="flex min-h-0 flex-col overflow-hidden border border-[var(--hairline)] bg-[var(--surface)] lg:border">
          {/* Column header */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--hairline)] bg-[var(--canvas)]/95 px-4 py-2 backdrop-blur">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {activeView === "all"
                ? "All members"
                : SAVED_VIEWS.find((v) => v.id === activeView)?.label}
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {filteredStudents.length} {filteredStudents.length === 1 ? "row" : "rows"}
            </span>
          </div>

          {/* Desktop table header */}
          <div className="hidden shrink-0 grid-cols-[260px_80px_1fr_24px_90px_100px_120px_90px] items-center gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-1.5 lg:grid">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Student
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Value
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Progress
            </span>
            <span />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Last activity
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Renewal
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Last intervention
            </span>
            <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Actions
            </span>
          </div>

          {/* Rows / cards / empty */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <EmptyState onClear={handleClearFilters} />
            ) : (
              <>
                <div className="hidden lg:block">
                  {filteredStudents.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      isSelected={student.id === selectedId}
                      onSelect={() => handleSelect(student)}
                      onView={handleSelect}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:hidden">
                  {filteredStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onSelect={() => handleSelect(student)}
                      onView={handleSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Inspector column (desktop) */}
        <section className="hidden min-h-0 lg:block lg:h-full">
          <StudentInspector
            student={selectedStudent}
            excluded={selectedExcluded}
            onToggleExclude={handleToggleExclude}
            onSendMessage={handleSendMessage}
            variant="column"
          />
        </section>
      </div>

      {/* Mobile inspector bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-none border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0 gap-0 h-[88dvh]",
            "[&>button:last-child]:hidden",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--hairline)] px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Student profile
            </span>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Close profile"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <StudentInspector
              student={selectedStudent}
              excluded={selectedExcluded}
              onToggleExclude={(next) => {
                handleToggleExclude(next);
              }}
              onSendMessage={handleSendMessage}
              variant="sheet"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { value: string; label: string }[];
}

function FilterSelect({ label, value, onValueChange, items }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className="h-8 w-[140px] rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px]"
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-none">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} className="text-[12px]">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
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
      <h3 className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">
        No students match these filters
      </h3>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-[var(--ink-muted)]">
        Try removing some filters or switching to a different saved view.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="mt-4 h-8 rounded-none border-[var(--hairline)] text-[var(--ink-secondary)]"
      >
        <X className="size-3.5" />
        Clear filters
      </Button>
    </motion.div>
  );
}
