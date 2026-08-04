"use client";

import { useMemo, useState } from "react";
import { Clock, Send, CalendarClock, FileEdit, X } from "lucide-react";
import { PageHeader } from "@/components/shared/layout-primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RESCUE_QUEUE_ROWS, INTERVENTIONS } from "@/lib/mock-data";
import type {
  InterventionState,
  Priority,
  QueueTab,
  Student,
} from "@/lib/types";
import { QueueToolbar } from "@/components/rescueloop/rescue-queue/queue-toolbar";
import { QueueTable } from "@/components/rescueloop/rescue-queue/queue-table";
import { StudentDrawer } from "@/components/rescueloop/rescue-queue/student-drawer";

// Map each queue tab to the set of intervention states it represents.
const TAB_STATE_MAP: Record<QueueTab, InterventionState[]> = {
  awaiting_review: ["awaiting_approval"],
  approved: ["approved"],
  scheduled: ["scheduled"],
  sent: ["sent", "opened"],
  responded: ["responded"],
  recovered: ["recovered"],
  dismissed: ["dismissed", "stopped"],
};

const TAB_LABELS: { value: QueueTab; label: string }[] = [
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "responded", label: "Responded" },
  { value: "recovered", label: "Recovered" },
  { value: "dismissed", label: "Dismissed" },
];

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

type SortKey = "last_activity" | "priority" | "progress" | "renewal_date";

export default function RescueQueuePage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("awaiting_review");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("last_activity");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);

  // Compute counts per tab.
  const tabCounts = useMemo(() => {
    const counts: Record<QueueTab, number> = {
      awaiting_review: 0,
      approved: 0,
      scheduled: 0,
      sent: 0,
      responded: 0,
      recovered: 0,
      dismissed: 0,
    };
    for (const row of RESCUE_QUEUE_ROWS) {
      for (const tab of TAB_LABELS) {
        if (TAB_STATE_MAP[tab.value].includes(row.interventionState)) {
          counts[tab.value]++;
          break;
        }
      }
    }
    return counts;
  }, []);

  const rowsForTab = useMemo(() => {
    const states = TAB_STATE_MAP[activeTab];
    return RESCUE_QUEUE_ROWS.filter((row) => {
      // State filter (tab)
      if (!states.includes(row.interventionState)) return false;
      // Search filter (student name or trigger)
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${row.student.name} ${row.student.email} ${row.trigger}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Priority filter
      if (priorityFilter !== "all" && row.priority !== priorityFilter) return false;
      // Risk segment filter
      if (riskFilter !== "all") {
        const cs = row.student.courseStates[0];
        if (cs?.riskSegment !== riskFilter) return false;
      }
      return true;
    });
  }, [activeTab, search, priorityFilter, riskFilter]);

  const sortedRows = useMemo(() => {
    const list = [...rowsForTab];
    list.sort((a, b) => {
      switch (sort) {
        case "last_activity":
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        case "priority":
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        case "progress":
          return a.progressPercent - b.progressPercent;
        case "renewal_date":
          return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
        default:
          return 0;
      }
    });
    return list;
  }, [rowsForTab, sort]);

  // Visible rows on the current tab — used to scope "select all".
  const visibleRowIds = useMemo(() => sortedRows.map((r) => r.id), [sortedRows]);

  const selectedCount = selectedIds.size;

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const id of visibleRowIds) next.add(id);
      } else {
        for (const id of visibleRowIds) next.delete(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleTabChange(value: string) {
    setActiveTab(value as QueueTab);
    // Clear selection when switching tabs so the bulk bar reflects visible rows.
    clearSelection();
  }

  function openDrawer(student: Student) {
    setDrawerStudent(student);
  }

  function closeDrawer() {
    setDrawerStudent(null);
  }

  // Active intervention for the selected student.
  const drawerIntervention = useMemo(() => {
    if (!drawerStudent) return null;
    return (
      INTERVENTIONS.find((iv) => iv.studentId === drawerStudent.id) ?? null
    );
  }, [drawerStudent]);

  // Past interventions (excluding the current one).
  const drawerPreviousInterventions = useMemo(() => {
    if (!drawerStudent) return [];
    return INTERVENTIONS.filter(
      (iv) => iv.studentId === drawerStudent.id && iv.id !== drawerIntervention?.id,
    );
  }, [drawerStudent, drawerIntervention]);

  const allOnPageSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.has(id));

  return (
    <div className={selectedCount > 0 ? "pb-24" : undefined}>
      <PageHeader
        title="Rescue Queue"
        description="Review and approve recovery interventions for at-risk members"
        actions={
          <Badge
            variant="outline"
            className="border-[#E3E5DF] bg-[#F8F8F5] text-[#6A706A] text-xs font-medium"
          >
            <span className="size-1.5 rounded-full bg-[#D89222]" />
            {tabCounts.awaiting_review} awaiting review
          </Badge>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-9 w-fit bg-[#F8F8F5] p-1">
            {TAB_LABELS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#171A17] data-[state=active]:shadow-sm text-[#6A706A]"
              >
                {tab.label}
                {tabCounts[tab.value] > 0 && (
                  <span
                    className={`tabular-mono rounded-full px-1.5 text-[11px] ${
                      activeTab === tab.value
                        ? "bg-[#E8F5EF] text-[#147D68]"
                        : "bg-[#F0F2EC] text-[#6A706A]"
                    }`}
                  >
                    {tabCounts[tab.value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <QueueToolbar
          search={search}
          onSearch={setSearch}
          priorityFilter={priorityFilter}
          onPriorityFilter={setPriorityFilter}
          riskFilter={riskFilter}
          onRiskFilter={setRiskFilter}
          sort={sort}
          onSort={setSort}
          rowCount={sortedRows.length}
          totalCount={rowsForTab.length}
        />

        {TAB_LABELS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {activeTab === tab.value && (
              <QueueTable
                rows={sortedRows}
                selectedIds={selectedIds}
                onToggleRow={toggleRow}
                onToggleAll={toggleAllVisible}
                allSelected={allOnPageSelected}
                onReview={openDrawer}
                activeTab={activeTab}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Floating bulk action bar */}
      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#E3E5DF] bg-[#FFFFFF] px-3 py-2 shadow-lg">
            <span className="tabular-mono text-sm font-medium text-[#171A17]">
              {selectedCount} selected
            </span>
            <div className="hidden h-5 w-px bg-[#E3E5DF] sm:block" />
            <Button
              size="sm"
              className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
            >
              <Send className="size-3.5" />
              Approve &amp; send
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileEdit className="size-3.5" />
                  Change template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel>Swap message template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Activation Rescue</DropdownMenuItem>
                <DropdownMenuItem>Early Progress Rescue</DropdownMenuItem>
                <DropdownMenuItem>Mid-Course Rescue</DropdownMenuItem>
                <DropdownMenuItem>Near-Finish Rescue</DropdownMenuItem>
                <DropdownMenuItem>Cancellation Rescue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarClock className="size-3.5" />
                  Schedule
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Send at</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Clock className="size-3.5" />
                  In 1 hour
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="size-3.5" />
                  Tomorrow · 9:00 AM
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="size-3.5" />
                  In 3 days · 9:00 AM
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="size-3.5" />
                  Next Monday · 9:00 AM
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm">
              Dismiss
            </Button>
            <Button variant="ghost" size="sm" className="text-[#6A706A]">
              Exclude from automation
            </Button>
            <div className="hidden h-5 w-px bg-[#E3E5DF] sm:block" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-[#6A706A]"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <StudentDrawer
        student={drawerStudent}
        intervention={drawerIntervention}
        previousInterventions={drawerPreviousInterventions}
        open={drawerStudent !== null}
        onOpenChange={(o) => {
          if (!o) closeDrawer();
        }}
      />
    </div>
  );
}
