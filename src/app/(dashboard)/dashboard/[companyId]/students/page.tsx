"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import type { DemoMember } from "@/lib/demo-fixtures";

type StatusFilter = "all" | "needs_attention" | "active" | "responded" | "paused_reminders";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_attention", label: "Needs attention" },
  { key: "active", label: "Active" },
  { key: "responded", label: "Responded" },
  { key: "paused_reminders", label: "Paused" },
];

const MEMBERSHIP_BADGE: Record<DemoMember["membership"], { label: string; className: string }> = {
  active: { label: "Active", className: "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]" },
  trialing: { label: "Trial", className: "border-[var(--info)]/30 text-[var(--info)]" },
  cancelling: { label: "Cancelling", className: "border-[var(--critical)]/30 text-[var(--critical)]" },
  cancelled: { label: "Cancelled", className: "border-[var(--ink-muted)]/30 text-[var(--ink-muted)]" },
  paused_membership: { label: "Paused", className: "border-[var(--warning)]/30 text-[var(--warning)]" },
};

const STATUS_DOT: Record<DemoMember["status"], string> = {
  active: "bg-[var(--recovery-green)]",
  needs_attention: "bg-[var(--warning)]",
  responded: "bg-[var(--info)]",
  paused_reminders: "bg-[var(--ink-muted)]",
};

// Left border accent for rows based on status
const STATUS_BORDER: Record<DemoMember["status"], string> = {
  active: "before:bg-[var(--recovery-green)]",
  needs_attention: "before:bg-[var(--warning)]",
  responded: "before:bg-[var(--info)]",
  paused_reminders: "before:bg-[var(--ink-muted)]",
};

// Empty state placeholder (italicized)
const EmptyDash = () => (
  <span className="italic text-[var(--ink-muted)]/70">Pending</span>
);

export default function MembersPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const members = useMemo(() => {
    const list = bundle?.members ?? [];
    return list.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [bundle?.members, filter, search]);

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
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Members</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {loading ? (
              <span className="inline-block h-3 w-40 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
            ) : (
              <>
                {bundle?.members?.length ?? 0} students across all courses
              </>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh members"
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertCircle className="size-4" />
            <span>Failed to load members: {error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <Filter className="size-3" /> Filter
          </span>
          {FILTERS.map((f) => {
            const count = f.key === "all"
              ? bundle?.members?.length ?? 0
              : bundle?.members?.filter((m) => m.status === f.key).length ?? 0;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-all",
                  active
                    ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-white"
                    : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
                )}
              >
                {f.label}
                <span className={cn("font-mono text-[10px] tabular-nums", active ? "text-white/70" : "text-[var(--ink-muted)]")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto sm:w-[240px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
          <Input
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-[6px] pl-8 text-[12px]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <CardSkeleton rows={6} />
      ) : members.length === 0 ? (
        <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
          <div className="text-center">
            <Users className="mx-auto size-6 text-[var(--ink-muted)]" />
            <p className="mt-2 text-[12px] text-[var(--ink-muted)]">No members match this filter.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                  {["Student", "Membership", "Progress", "Last activity", "Status", "Intervention", "Response"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {members.map((m, i) => {
                    const mb = MEMBERSHIP_BADGE[m.membership];
                    return (
                      <motion.tr
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className={cn(
                          "group relative border-b border-[var(--hairline)] transition-colors last:border-0 hover:bg-[var(--canvas-elevated)]",
                          "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:content-[''] before:opacity-0 before:transition-opacity group-hover:before:opacity-100",
                          STATUS_BORDER[m.status],
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--canvas-elevated)] font-mono text-[10px] font-medium text-[var(--ink-secondary)]">
                              {m.initials}
                            </span>
                            <div className="min-w-0">
                              <span className="block text-[13px] font-medium text-[var(--ink-primary)]">{m.name}</span>
                              <span className="block text-[10px] text-[var(--ink-muted)]">{m.course}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("rounded-[3px] text-[9px]", mb.className)}>
                            {mb.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-[3px] w-16 overflow-hidden rounded-full bg-[var(--hairline)]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(2, Math.min(100, m.progress))}%` }}
                                transition={{ duration: 0.5, delay: i * 0.03 }}
                                className="h-full rounded-full bg-[var(--recovery-green)]"
                              />
                            </div>
                            <span className="font-mono text-[10px] tabular-nums text-[var(--ink-secondary)]">{m.progress}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-[var(--ink-muted)]">
                          {m.lastActivity}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full", STATUS_DOT[m.status])} />
                            <span className="text-[11px] capitalize text-[var(--ink-secondary)]">
                              {m.status.replace(/_/g, " ")}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[var(--ink-secondary)]">
                          {m.lastIntervention ?? <EmptyDash />}
                        </td>
                        <td className="px-4 py-3">
                          {m.lastResponse ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-[3px] text-[9px]",
                                m.lastResponse === "Continue course" && "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]",
                                m.lastResponse === "I need help" && "border-[var(--warning)]/30 text-[var(--warning)]",
                                m.lastResponse === "I'm blocked" && "border-[var(--critical)]/30 text-[var(--critical)]",
                                m.lastResponse === "Stop reminders" && "border-[var(--ink-muted)]/30 text-[var(--ink-muted)]",
                              )}
                            >
                              {m.lastResponse}
                            </Badge>
                          ) : (
                            <EmptyDash />
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
