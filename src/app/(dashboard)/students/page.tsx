"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { PageHeader } from "@/components/shared/layout-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COURSE, KPIS, STUDENTS } from "@/lib/mock-data";
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
import { SavedViews } from "@/components/rescueloop/students/saved-views";
import { MomentumLegend } from "@/components/rescueloop/students/momentum-legend";
import { StudentTable, type StudentAction } from "@/components/rescueloop/students/student-table";
import { StudentCard } from "@/components/rescueloop/students/student-card";
import { StudentSummarySheet } from "@/components/rescueloop/students/student-summary-sheet";

export default function StudentsPage() {
  const { toast } = useToast();

  const [activeView, setActiveView] = useState<SavedViewId>("all");
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_FILTERS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Tracks students excluded from automation at runtime. Seeded from the
  // mock data so the "Needs attention" saved view respects excludes live.
  const [excludedIds, setExcludedIds] = useState<Set<string>>(
    () => new Set(STUDENTS.filter((s) => s.excluded).map((s) => s.id)),
  );

  // Counts for each saved view pill (computed across the full STUDENTS set
  // — saved views act as a starting filter, not a refinement of the bar).
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

  const savedViewPills = SAVED_VIEWS.map((v) => ({
    id: v.id,
    label: v.label,
    count: viewCounts[v.id],
  }));

  // Filtered students: first the saved view, then the bar filters.
  const filteredStudents = useMemo(
    () =>
      STUDENTS.filter((s) => matchesSavedView(s, activeView, excludedIds)).filter(
        (s) => matchesFilters(s, filters),
      ),
    [activeView, filters, excludedIds],
  );

  const filtersActive = !isDefaultFilters(filters);

  function updateFilter<K extends keyof StudentFilters>(
    key: K,
    value: StudentFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleViewStudent(student: Student) {
    setSelectedStudent(student);
    setSheetOpen(true);
  }

  function toggleExcluded(studentId: string): boolean {
    let nextExcluded = false;
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
        nextExcluded = false;
      } else {
        next.add(studentId);
        nextExcluded = true;
      }
      return next;
    });
    return nextExcluded;
  }

  function handleAction(student: Student, action: StudentAction) {
    if (action === "history") {
      toast({
        title: "Rescue history",
        description: `Opening rescue history for ${student.name}.`,
      });
    } else if (action === "exclude") {
      const nowExcluded = toggleExcluded(student.id);
      toast({
        title: nowExcluded
          ? "Excluded from automation"
          : "Re-included in automation",
        description: `${student.name} ${nowExcluded ? "won't" : "will"} receive automated interventions.`,
      });
    } else if (action === "message") {
      toast({
        title: "Message composer",
        description: `Opening message composer for ${student.name}.`,
      });
    }
  }

  const selectedExcluded = selectedStudent
    ? excludedIds.has(selectedStudent.id)
    : false;

  return (
    <div className="pb-6">
      <PageHeader
        title="Students"
        description={`${KPIS.totalStudents} members across ${COURSE.name}`}
      />

      {/* Saved views */}
      <div className="mb-4">
        <SavedViews
          views={savedViewPills}
          activeView={activeView}
          onSelect={setActiveView}
        />
      </div>

      {/* Filter bar */}
      <div className="mb-4 rounded-xl border border-[#E3E5DF] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Label className="mb-1.5 block text-[12px] text-[#6A706A]">
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6A706A]" />
              <Input
                placeholder="Name or email"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="h-9 pl-8 text-[13px]"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => updateFilter("search", "")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6A706A] hover:text-[#171A17]"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <FilterSelect
            label="Course"
            value="cr_ags"
            onValueChange={() => {}}
            disabled
            items={[{ value: "cr_ags", label: COURSE.name }]}
          />

          <FilterSelect
            label="Membership"
            value={filters.membershipStatus}
            onValueChange={(v) =>
              updateFilter(
                "membershipStatus",
                v as StudentFilters["membershipStatus"],
              )
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
            label="Risk segment"
            value={filters.riskSegment}
            onValueChange={(v) =>
              updateFilter(
                "riskSegment",
                v as StudentFilters["riskSegment"],
              )
            }
            items={[
              { value: "all", label: "All segments" },
              { value: "never_started", label: "Never started" },
              { value: "early_stall", label: "Early stall" },
              { value: "mid_course_stall", label: "Mid-course stall" },
              { value: "near_completion", label: "Near completion" },
              {
                value: "scheduled_cancellation",
                label: "Scheduled cancellation",
              },
            ]}
          />

          <div>
            <Label className="mb-1.5 block text-[12px] text-[#6A706A]">
              Progress range (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Min"
                value={filters.progressMin}
                onChange={(e) => updateFilter("progressMin", e.target.value)}
                className="h-9 text-[13px]"
              />
              <span className="text-[#6A706A]">–</span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Max"
                value={filters.progressMax}
                onChange={(e) => updateFilter("progressMax", e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>
          </div>

          <FilterSelect
            label="Last activity"
            value={filters.lastActivity}
            onValueChange={(v) =>
              updateFilter(
                "lastActivity",
                v as StudentFilters["lastActivity"],
              )
            }
            items={[
              { value: "any", label: "Any" },
              { value: "today", label: "Today" },
              { value: "3d", label: "3+ days ago" },
              { value: "7d", label: "7+ days ago" },
              { value: "14d", label: "14+ days ago" },
              { value: "30d", label: "30+ days ago" },
            ]}
          />

          <FilterSelect
            label="Renewal window"
            value={filters.renewalWindow}
            onValueChange={(v) =>
              updateFilter(
                "renewalWindow",
                v as StudentFilters["renewalWindow"],
              )
            }
            items={[
              { value: "any", label: "Any" },
              { value: "this_week", label: "This week" },
              { value: "2_weeks", label: "Next 2 weeks" },
              { value: "30_days", label: "Next 30 days" },
            ]}
          />

          <FilterSelect
            label="Response state"
            value={filters.responseState}
            onValueChange={(v) =>
              updateFilter(
                "responseState",
                v as StudentFilters["responseState"],
              )
            }
            items={[
              { value: "any", label: "Any" },
              { value: "responded", label: "Responded" },
              { value: "not_responded", label: "Not responded" },
              { value: "recovered", label: "Recovered" },
            ]}
          />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#E3E5DF] pt-3">
          <div className="text-[13px] text-[#6A706A]">
            {activeView !== "all" && (
              <span className="mr-1.5 rounded-full bg-[#E8F5EF] px-2 py-0.5 text-[12px] font-medium text-[#147D68]">
                {SAVED_VIEWS.find((v) => v.id === activeView)?.label}
              </span>
            )}
            Showing {filteredStudents.length} of {STUDENTS.length} members
          </div>
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-[13px] text-[#6A706A]"
            >
              <X className="size-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Momentum legend */}
      <div className="mb-3">
        <MomentumLegend />
      </div>

      {/* Results */}
      {filteredStudents.length === 0 ? (
        <EmptyState onClear={handleClearFilters} />
      ) : (
        <>
          <div className="hidden lg:block">
            <StudentTable
              students={filteredStudents}
              excludedIds={excludedIds}
              onView={handleViewStudent}
              onAction={handleAction}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:hidden sm:grid-cols-2">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                excluded={excludedIds.has(student.id)}
                onView={handleViewStudent}
              />
            ))}
          </div>
        </>
      )}

      <StudentSummarySheet
        student={selectedStudent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        excluded={selectedExcluded}
        onExcludeChange={(next) => {
          if (!selectedStudent) return;
          setExcludedIds((prev) => {
            const nextSet = new Set(prev);
            if (next) nextSet.add(selectedStudent.id);
            else nextSet.delete(selectedStudent.id);
            return nextSet;
          });
          toast({
            title: next
              ? "Excluded from automation"
              : "Re-included in automation",
            description: `${selectedStudent.name} ${next ? "won't" : "will"} receive automated interventions.`,
          });
        }}
        onSendMessage={() => {
          if (!selectedStudent) return;
          toast({
            title: "Message composer",
            description: `Opening message composer for ${selectedStudent.name}.`,
          });
        }}
      />
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { value: string; label: string }[];
  disabled?: boolean;
}

function FilterSelect({
  label,
  value,
  onValueChange,
  items,
  disabled,
}: FilterSelectProps) {
  return (
    <div>
      <Label className="mb-1.5 block text-[12px] text-[#6A706A]">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-full text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value} className="text-[13px]">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-[#E3E5DF] bg-white p-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F8F8F5]">
        <Search className="size-5 text-[#6A706A]" />
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-[#171A17]">
        No students match these filters
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#6A706A]">
        Try removing some filters or switching to a different saved view.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="mt-4 h-8 text-[13px]"
      >
        <X className="size-3.5" />
        Clear filters
      </Button>
    </div>
  );
}
