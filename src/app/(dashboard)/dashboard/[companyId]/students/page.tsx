"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckSquare,
  Archive,
  Send,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import type { DemoMember } from "@/lib/demo-fixtures";
import { GlobalSearchBar } from "@/components/shared/global-search-bar";
import { FilterBar, type ActiveFilters } from "@/components/shared/filter-bar";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { EnhancedEmptyState } from "@/components/shared/empty-state";

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

// ── Risk score derivation ──────────────────────────────────────
function deriveRiskScore(member: DemoMember): number {
  let score = 0;
  if (member.status === "needs_attention") score += 40;
  else if (member.status === "paused_reminders") score += 50;
  else if (member.status === "responded") score += 15;
  else score += 5;
  score += Math.round((100 - member.progress) * 0.35);
  if (member.membership === "cancelling") score += 20;
  else if (member.membership === "cancelled") score += 25;
  else if (member.membership === "paused_membership") score += 15;
  if (member.suppressed) score += 10;
  return Math.min(100, Math.max(0, score));
}

function riskStyle(score: number) {
  if (score <= 30) return { color: "var(--recovery-green)", bg: "bg-[var(--recovery-green)]", text: "text-[var(--recovery-green)]", label: "Low" };
  if (score <= 60) return { color: "var(--warning)", bg: "bg-[var(--warning)]", text: "text-[var(--warning)]", label: "Medium" };
  return { color: "var(--critical)", bg: "bg-[var(--critical)]", text: "text-[var(--critical)]", label: "High" };
}

// ── Sparkline: deterministic 7-point mini chart ────────────────
function sparklineData(member: DemoMember): number[] {
  // Deterministic seed from member properties
  const seed = member.progress * 7 + member.name.length * 13 + (member.suppressed ? 17 : 0);
  const points: number[] = [];
  for (let i = 0; i < 7; i++) {
    // Simple LCG-style pseudo-random
    const val = ((seed * (i + 1) * 31 + 37) % 100);
    // Mix in progress to give a realistic trend
    const trend = member.progress + (val - 50) * 0.4;
    points.push(Math.max(0, Math.min(100, Math.round(trend))));
  }
  return points;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 48;
  const h = 16;
  const step = w / (data.length - 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Relative time formatter ────────────────────────────────────
function toRelativeTime(dateStr: string): string {
  // Handle our fixture format: "X days ago" or "X min ago" etc.
  if (dateStr.includes("ago")) return dateStr;
  // Try parsing as a real date
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  } catch {
    return dateStr;
  }
}

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
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const allMembers = bundle?.members ?? [];

  const members = useMemo(() => {
    return allMembers.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allMembers, filter, search]);

  // ── Summary stats ───────────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (allMembers.length === 0) return null;
    const scores = allMembers.map(deriveRiskScore);
    const atRisk = scores.filter((s) => s > 60).length;
    const avgEngagement = Math.round(allMembers.reduce((sum, m) => sum + m.progress, 0) / allMembers.length);
    // "Active today" = members with lastActivity containing "0 days ago" or "ago" with < 1 day
    const activeToday = allMembers.filter((m) => {
      const rel = toRelativeTime(m.lastActivity);
      return rel.includes("Just") || rel.includes("m ago") || rel.includes("h ago") || (rel.includes("d ago") && rel.startsWith("0"));
    }).length;
    return { total: allMembers.length, atRisk, avgEngagement, activeToday };
  }, [allMembers]);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(members.map((m) => m.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function bulkToast(action: string) {
    if (selectedIds.size === 0) return;
    toast.success(`${action} ${selectedIds.size} member${selectedIds.size === 1 ? "" : "s"}`, {
      description: "Action queued for the selected members.",
    });
    clearSelection();
    setSelectMode(false);
  }

  return (
    <PageTransition>
    <div className="space-y-5">
      {/* Header */}
      <SectionHeader
        icon={Users}
        title="Members"
        description={
          loading ? (
            <span className="inline-block h-3 w-40 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
          ) : (
            <>{allMembers.length} students across all courses</>
          )
        }
        action={{ label: "Refresh", onClick: handleRefresh, icon: RefreshCw, loading: refreshing }}
      />

      {/* ── NEW: Summary Stats Header ── */}
      {!loading && summaryStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total members", value: summaryStats.total, icon: Users, color: "text-[var(--ink-primary)]", iconBg: "bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]", border: "before:bg-[var(--ink-secondary)]" },
            { label: "At risk", value: summaryStats.atRisk, icon: AlertTriangle, color: "text-[var(--critical)]", iconBg: "bg-[var(--critical)]/10 text-[var(--critical)]", border: "before:bg-[var(--critical)]" },
            { label: "Avg. engagement", value: `${summaryStats.avgEngagement}%`, icon: TrendingUp, color: "text-[var(--recovery-green)]", iconBg: "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]", border: "before:bg-[var(--recovery-green)]" },
            { label: "Active today", value: summaryStats.activeToday, icon: Activity, color: "text-[var(--info)]", iconBg: "bg-[var(--info)]/10 text-[var(--info)]", border: "before:bg-[var(--info)]" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={cn(
                "relative overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-3",
                "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
                s.border,
              )}>
                <div className="flex items-center gap-2 pl-1 text-[var(--ink-muted)]">
                  <span className={cn("flex size-6 items-center justify-center rounded-[5px]", s.iconBg)}>
                    <Icon className="size-3" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em]">{s.label}</span>
                </div>
                <div className={cn("mt-2 pl-1 font-serif text-[24px] leading-none tabular-nums", s.color)}>
                  {s.value}
                </div>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* ── Global Search & Filter Bar ── */}
      <div className="space-y-3">
        <GlobalSearchBar
          placeholder="Search members, playbooks, responses…"
          onSearch={(q) => {
            setSearch(q);
          }}
          onSelect={(result) => {
            toast.success(`Selected: ${result.label}`, { description: result.detail });
          }}
        />
        <FilterBar
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
        />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <Filter className="size-3" /> Filter
          </span>
          {FILTERS.map((f) => {
            const count = f.key === "all"
              ? allMembers.length
              : allMembers.filter((m) => m.status === f.key).length;
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
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant={selectMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleSelectMode}
            className={cn(
              "h-8 rounded-[6px] px-2.5 text-[11px]",
              selectMode && "bg-[var(--ink-primary)] text-white",
            )}
            aria-label="Toggle selection mode"
          >
            <CheckSquare className="mr-1 size-3" />
            {selectMode ? "Exit select" : "Select"}
          </Button>
          <div className="relative sm:w-[240px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
            <Input
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-[6px] pl-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <CardSkeleton rows={6} />
      ) : members.length === 0 ? (
        <EnhancedEmptyState
          icon={Users}
          title="No members match this filter"
          description="Try adjusting your filters or search query to find the members you're looking for."
          actionLabel="Reset filters"
          onAction={() => {
            setFilter("all");
            setSearch("");
            setActiveFilters({});
          }}
        />
      ) : (
        <Card className="overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)]">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--hairline-subtle)] bg-[var(--canvas-elevated)]">
                  {selectMode && (
                    <th className="w-[44px] whitespace-nowrap px-3 py-2.5 text-left">
                      <Checkbox
                        checked={members.length > 0 && selectedIds.size === members.length}
                        onCheckedChange={(checked) => {
                          if (checked) selectAllVisible();
                          else clearSelection();
                        }}
                        aria-label="Select all visible members"
                      />
                    </th>
                  )}
                  {["Student", "Risk", "Membership", "Progress", "Trend", "Last activity", "Status", "Intervention", "Response"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-secondary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {members.map((m, i) => {
                    const mb = MEMBERSHIP_BADGE[m.membership];
                    const riskScore = deriveRiskScore(m);
                    const risk = riskStyle(riskScore);
                    const sparkData = sparklineData(m);
                    const relTime = toRelativeTime(m.lastActivity);
                    const isSelected = selectedIds.has(m.id);
                    return (
                      <motion.tr
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        data-selected={isSelected || undefined}
                        onClick={selectMode ? () => toggleSelected(m.id) : undefined}
                        className={cn(
                          "group relative border-b border-[var(--hairline-subtle)] last:border-0",
                          "table-row-hover",
                          "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:content-[''] before:opacity-0 before:transition-opacity group-hover:before:opacity-100",
                          STATUS_BORDER[m.status],
                          isSelected && "table-row-selected before:opacity-100 before:bg-[var(--recovery-green)]",
                          selectMode && "cursor-pointer",
                        )}
                      >
                        {selectMode && (
                          <td className="whitespace-nowrap px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelected(m.id)}
                              aria-label={`Select ${m.name}`}
                            />
                          </td>
                        )}
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
                        {/* ── NEW: Risk Score Badge ── */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="h-[10px] w-[3px] overflow-hidden rounded-[2px]" style={{ backgroundColor: risk.color }}>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${riskScore}%` }}
                                transition={{ duration: 0.4, delay: i * 0.03 }}
                                className="w-full rounded-[2px]"
                                style={{ backgroundColor: risk.color, marginTop: `${100 - riskScore}%` }}
                              />
                            </div>
                            <span className={cn("font-mono text-[11px] tabular-nums", risk.text)}>
                              {riskScore}
                            </span>
                            <Badge variant="outline" className={cn("rounded-[3px] text-[8px] px-1 py-0", risk.text, `border-current/30`)}>
                              {risk.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("rounded-[3px] text-[9px]", mb.className)}>
                            {mb.label}
                          </Badge>
                        </td>
                        {/* ── Enhanced Progress bar ── */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-[3px] w-16 overflow-hidden rounded-full bg-[var(--hairline)]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(2, Math.min(100, m.progress))}%` }}
                                transition={{ duration: 0.5, delay: i * 0.03 }}
                                className={cn(
                                  "h-full rounded-full",
                                  m.progress >= 70 ? "bg-[var(--recovery-green)]" : m.progress >= 40 ? "bg-[var(--warning)]" : "bg-[var(--critical)]",
                                )}
                              />
                            </div>
                            <span className="font-mono text-[10px] tabular-nums text-[var(--ink-secondary)]">{m.progress}%</span>
                          </div>
                        </td>
                        {/* ── NEW: Sparkline Trend ── */}
                        <td className="px-4 py-3">
                          <Sparkline data={sparkData} color={risk.color} />
                        </td>
                        {/* ── NEW: Relative time ── */}
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="text-[11px] text-[var(--ink-muted)]">{relTime}</span>
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

      {/* Bulk action bar — slides up when rows are selected */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 lg:pl-[228px]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mx-auto max-w-[1200px] px-4 pb-4">
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--hairline-strong)] bg-[var(--ink-primary)] px-4 py-3 text-white shadow-[0_8px_32px_-8px_rgba(17,17,15,0.4)]">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-[6px] bg-white/10">
                    <CheckSquare className="size-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">
                      {selectedIds.size} selected
                    </p>
                    <p className="text-[11px] text-white/60">
                      Choose an action to apply
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => bulkToast("Tagged")}
                    className="bg-[var(--recovery-green)] text-white hover:bg-[var(--recovery-green)]/90 h-8 px-3 text-[12px]"
                  >
                    <Send className="mr-1 size-3" />
                    Tag
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => bulkToast("Archived")}
                    variant="outline"
                    className="h-8 border-white/20 bg-transparent px-3 text-[12px] text-white hover:bg-white/10 hover:text-white"
                  >
                    <Archive className="mr-1 size-3" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    onClick={clearSelection}
                    variant="ghost"
                    className="h-8 px-2 text-[12px] text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label="Clear selection"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}
