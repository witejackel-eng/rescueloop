"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Settings2,
  AlertTriangle,
  MessageSquare,
  Settings,
  AtSign,
  Search,
  X,
  Inbox,
  ListChecks,
  Trash2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { EnhancedEmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import {
  useDemoStore,
  useNotifications,
  useNotificationPreferences,
} from "@/features/demo-engine/demo-store";
import { relativeFromIso } from "@/lib/dates";
import type {
  Notification,
  NotificationCategory,
  NotificationPreferences,
} from "@/lib/types";

// ── Notification metadata ─────────────────────────────────────
type CategoryKey = "all" | "unread" | NotificationCategory;

const CATEGORY_META: Record<
  NotificationCategory,
  { icon: LucideIcon; color: string; bg: string; border: string; dot: string; label: string }
> = {
  rescue: {
    icon: AlertTriangle,
    color: "text-[var(--critical)]",
    bg: "bg-[var(--critical)]/10",
    border: "border-[var(--critical)]/30",
    dot: "bg-[var(--critical)]",
    label: "Rescue",
  },
  response: {
    icon: MessageSquare,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
    border: "border-[var(--warning)]/30",
    dot: "bg-[var(--warning)]",
    label: "Response",
  },
  system: {
    icon: Settings,
    color: "text-[var(--info)]",
    bg: "bg-[var(--info)]/10",
    border: "border-[var(--info)]/30",
    dot: "bg-[var(--info)]",
    label: "System",
  },
  mention: {
    icon: AtSign,
    color: "text-[var(--recovery-green)]",
    bg: "bg-[var(--recovery-green)]/10",
    border: "border-[var(--recovery-green)]/30",
    dot: "bg-[var(--recovery-green)]",
    label: "Mention",
  },
};

const FILTERS: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "rescue", label: "Rescues" },
  { key: "response", label: "Responses" },
  { key: "system", label: "System" },
  { key: "mention", label: "Mentions" },
];

type TimeRange = "today" | "week" | "month" | "all";

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

const PAGE_SIZE = 10;

// ── Preferences dialog config ─────────────────────────────────
type PrefRow = {
  key: keyof NotificationPreferences;
  label: string;
  description?: string;
};

type PrefSection = {
  title: string;
  description: string;
  rows: PrefRow[];
};

const PREF_SECTIONS: PrefSection[] = [
  {
    title: "Rescue alerts",
    description: "Triggered when RescueLoop detects at-risk members or recoveries.",
    rows: [
      { key: "rescueCandidateDetected", label: "New rescue candidate detected" },
      { key: "highRiskMember", label: "High-risk member detected" },
      { key: "recoveryCompleted", label: "Recovery completed" },
    ],
  },
  {
    title: "Response notifications",
    description: "Member replies and follow-up cadence.",
    rows: [
      { key: "memberResponded", label: "Member responded" },
      { key: "responseOverdue", label: "Response overdue" },
      { key: "positiveFeedback", label: "Positive feedback received" },
    ],
  },
  {
    title: "System notifications",
    description: "Sync, plan, and maintenance signals.",
    rows: [
      { key: "syncCompleted", label: "Sync completed" },
      { key: "syncFailed", label: "Sync failed" },
      { key: "maintenanceScheduled", label: "Maintenance scheduled" },
    ],
  },
];

const CHANNEL_ROWS: PrefRow[] = [
  { key: "channelInApp", label: "In-app", description: "Always-on for the Notifications Center." },
  { key: "channelEmail", label: "Email", description: "Daily digest at 9:00 AM local time." },
  { key: "channelSlack", label: "Slack", description: "Connect a workspace to enable." },
];

// ── Page ──────────────────────────────────────────────────────
export default function NotificationsPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId;
  const basePath = `/dashboard/${companyId}`;

  const notifications = useNotifications();
  const preferences = useNotificationPreferences();

  const markNotificationRead = useDemoStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useDemoStore((s) => s.markAllNotificationsRead);
  const dismissNotification = useDemoStore((s) => s.dismissNotification);
  const bulkMarkNotificationsRead = useDemoStore((s) => s.bulkMarkNotificationsRead);
  const bulkDismissNotifications = useDemoStore((s) => s.bulkDismissNotifications);
  const setNotificationPreference = useDemoStore((s) => s.setNotificationPreference);

  const [filter, setFilter] = useState<CategoryKey>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [search, setSearch] = useState("");
  const [showDismissed, setShowDismissed] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [prefOpen, setPrefOpen] = useState(false);
  // Local draft of preferences while dialog is open
  const [prefDraft, setPrefDraft] = useState<NotificationPreferences | null>(null);

  // Reset pagination + selection whenever the filter context changes.
  // Uses the "Adjusting state when a prop changes" pattern (render-phase
  // conditional setState) rather than a useEffect — see:
  // https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes
  const filtersKey = `${filter}|${timeRange}|${search}|${showDismissed}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (filtersKey !== prevFiltersKey) {
    setPrevFiltersKey(filtersKey);
    setVisibleCount(PAGE_SIZE);
    setSelected(new Set());
  }

  // ── Derived counts ──
  const visibleToCenter = useMemo(
    () => notifications.filter((n) => showDismissed || !n.dismissed),
    [notifications, showDismissed],
  );

  const counts = useMemo(() => {
    const list = visibleToCenter;
    return {
      all: list.length,
      unread: list.filter((n) => !n.resolved).length,
      rescue: list.filter((n) => n.category === "rescue").length,
      response: list.filter((n) => n.category === "response").length,
      system: list.filter((n) => n.category === "system").length,
      mention: list.filter((n) => n.category === "mention").length,
    };
  }, [visibleToCenter]);

  const stats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = todayMs - 7 * 24 * 60 * 60 * 1000;
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.resolved && !n.dismissed).length,
      today: notifications.filter((n) => new Date(n.createdAtIso).getTime() >= todayMs).length,
      thisWeek: notifications.filter((n) => new Date(n.createdAtIso).getTime() >= weekMs).length,
    };
  }, [notifications]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = todayMs - 7 * 24 * 60 * 60 * 1000;
    const monthMs = todayMs - 30 * 24 * 60 * 60 * 1000;

    return visibleToCenter.filter((n) => {
      // Filter chip
      if (filter === "unread" && n.resolved) return false;
      if (
        filter !== "all" &&
        filter !== "unread" &&
        n.category !== filter
      )
        return false;
      // Time range
      if (timeRange !== "all") {
        const ts = new Date(n.createdAtIso).getTime();
        if (timeRange === "today" && ts < todayMs) return false;
        if (timeRange === "week" && ts < weekMs) return false;
        if (timeRange === "month" && ts < monthMs) return false;
      }
      // Search
      if (q) {
        const hay = `${n.title} ${n.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleToCenter, filter, timeRange, search]);

  const visibleSlice = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // ── Handlers ──
  function handleMarkAllRead() {
    const unreadCount = notifications.filter((n) => !n.resolved && !n.dismissed).length;
    if (unreadCount === 0) {
      toast.info("No unread notifications to mark.");
      return;
    }
    markAllNotificationsRead();
    toast.success(`Marked ${unreadCount} notification${unreadCount === 1 ? "" : "s"} as read.`);
  }

  function handleMarkRead(n: Notification) {
    if (n.resolved) {
      markNotificationRead(n.id, false);
      toast.info(`"${n.title}" marked as unread.`);
    } else {
      markNotificationRead(n.id, true);
      toast.success(`"${n.title}" marked as read.`);
    }
  }

  function handleDismiss(n: Notification) {
    dismissNotification(n.id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(n.id);
      return next;
    });
    toast.success(`Dismissed "${n.title}".`);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(visibleSlice.map((n) => n.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleBulkRead() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    bulkMarkNotificationsRead(ids);
    toast.success(`Marked ${ids.length} as read.`);
    clearSelection();
    setBulkMode(false);
  }

  function handleBulkDismiss() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    bulkDismissNotifications(ids);
    toast.success(`Dismissed ${ids.length} notification${ids.length === 1 ? "" : "s"}.`);
    clearSelection();
    setBulkMode(false);
  }

  function openPreferences() {
    setPrefDraft({ ...preferences });
    setPrefOpen(true);
  }

  function handlePrefToggle(key: keyof NotificationPreferences, value: boolean) {
    setPrefDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handlePrefSave() {
    if (!prefDraft) return;
    (Object.keys(prefDraft) as Array<keyof NotificationPreferences>).forEach((key) => {
      if (preferences[key] !== prefDraft[key]) {
        setNotificationPreference(key, prefDraft[key]);
      }
    });
    toast.success("Notification preferences saved.");
    setPrefOpen(false);
    setPrefDraft(null);
  }

  function handlePrefCancel() {
    setPrefOpen(false);
    setPrefDraft(null);
  }

  const subtitle = (
    <span>
      <span className="font-mono tabular-nums">{counts.all}</span> notification
      {counts.all === 1 ? "" : "s"}
      {counts.unread > 0 && (
        <>
          {" · "}
          <span className="font-mono tabular-nums text-[var(--recovery-green)]">{counts.unread}</span> unread
        </>
      )}
    </span>
  );

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <SectionHeader
          icon={Bell}
          title="Notifications"
          description={subtitle}
          action={{
            label: "Refresh",
            onClick: () => {
              toast.success("Notifications refreshed.");
            },
            icon: CheckCheck,
          }}
        />

        {/* Top action bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 rounded-[6px] border-[var(--hairline)] px-3 text-[12px] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink-primary)]"
            >
              <CheckCheck className="mr-1.5 size-3.5" />
              Mark all as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openPreferences}
              className="h-8 rounded-[6px] border-[var(--hairline)] px-3 text-[12px] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink-primary)]"
            >
              <Settings2 className="mr-1.5 size-3.5" />
              Notification preferences
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBulkMode((v) => !v);
                clearSelection();
              }}
              className={cn(
                "h-8 rounded-[6px] px-3 text-[12px]",
                bulkMode
                  ? "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)] hover:bg-[var(--recovery-green)]/15"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]",
              )}
            >
              <ListChecks className="mr-1.5 size-3.5" />
              {bulkMode ? "Exit bulk select" : "Bulk select"}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setShowDismissed((v) => !v)}
            className={cn(
              "self-start rounded-full border px-3 py-1 text-[11px] transition-colors sm:self-auto",
              showDismissed
                ? "border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]"
                : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]",
            )}
            aria-pressed={showDismissed}
          >
            {showDismissed ? "Showing dismissed" : "Show dismissed"}
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total"
            value={stats.total}
            icon={Bell}
            accent="none"
            delay={0}
          />
          <MetricCard
            label="Unread"
            value={stats.unread}
            icon={AlertTriangle}
            accent="recovery"
            colorClassName="text-[var(--recovery-green)]"
            delay={60}
          />
          <MetricCard
            label="Today"
            value={stats.today}
            icon={Inbox}
            accent="info"
            delay={120}
          />
          <MetricCard
            label="This Week"
            value={stats.thisWeek}
            icon={ListChecks}
            accent="warning"
            delay={180}
          />
        </div>

        {/* Filter bar */}
        <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <div className="flex flex-col gap-3">
            {/* Filter chips */}
            <div className="flex items-center gap-2 mobile-scroll-x overflow-x-auto pb-1">
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                Filter
              </span>
              {FILTERS.map((f) => {
                const count =
                  f.key === "all"
                    ? counts.all
                    : f.key === "unread"
                      ? counts.unread
                      : counts[f.key];
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={active}
                    className={cn(
                      "touch-target flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-all",
                      active
                        ? "border-[var(--recovery-green)] bg-[var(--recovery-green)] text-white"
                        : "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas)]",
                    )}
                  >
                    {f.label}
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

            {/* Time range + search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 mobile-scroll-x overflow-x-auto">
                <span className="flex shrink-0 items-center text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  Range
                </span>
                {TIME_RANGES.map((r) => {
                  const active = timeRange === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setTimeRange(r.key)}
                      aria-pressed={active}
                      className={cn(
                        "touch-target shrink-0 rounded-[6px] px-2 py-1 text-[11px] transition-colors",
                        active
                          ? "bg-[var(--ink-primary)] text-white"
                          : "text-[var(--ink-muted)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-secondary)]",
                      )}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative sm:ml-auto sm:w-[260px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications…"
                  className="h-8 rounded-[6px] border-[var(--hairline)] bg-[var(--canvas-elevated)] pl-8 pr-8 text-[12px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--recovery-green)]"
                  aria-label="Search notifications"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Bulk action bar */}
        <AnimatePresence>
          {bulkMode && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/[0.04] p-3">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--canvas-elevated)]"
                >
                  <Checkbox
                    checked={
                      visibleSlice.length > 0 &&
                      selected.size === visibleSlice.length
                    }
                    onCheckedChange={(checked) => {
                      if (checked) selectAllVisible();
                      else clearSelection();
                    }}
                    aria-label="Select all visible"
                  />
                  <span>Select all</span>
                </button>
                <Badge
                  variant="outline"
                  className="rounded-[3px] border-[var(--recovery-green)]/30 text-[10px] text-[var(--recovery-green)]"
                >
                  {selected.size} selected
                </Badge>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkRead}
                    disabled={selected.size === 0}
                    className="h-7 rounded-[6px] border-[var(--hairline)] px-2 text-[11px] text-[var(--ink-secondary)] disabled:opacity-50"
                  >
                    <CheckCheck className="mr-1 size-3" />
                    Mark read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDismiss}
                    disabled={selected.size === 0}
                    className="h-7 rounded-[6px] border-[var(--hairline)] px-2 text-[11px] text-[var(--ink-secondary)] disabled:opacity-50"
                  >
                    <Trash2 className="mr-1 size-3" />
                    Dismiss
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBulkMode(false);
                      clearSelection();
                    }}
                    className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <EnhancedEmptyState
            icon={Bell}
            title="No notifications match this filter"
            description="Try adjusting your filter, time range, or search query to surface more activity."
            actionLabel="Reset filters"
            onAction={() => {
              setFilter("all");
              setTimeRange("all");
              setSearch("");
              setShowDismissed(false);
            }}
          />
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleSlice.map((n, i) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  basePath={basePath}
                  bulkMode={bulkMode}
                  selected={selected.has(n.id)}
                  onToggleSelected={() => toggleSelected(n.id)}
                  onMarkRead={() => handleMarkRead(n)}
                  onDismiss={() => handleDismiss(n)}
                  index={i}
                />
              ))}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-3 text-[10px] text-[var(--ink-muted)]">
              <span>
                Showing {visibleSlice.length} of {filtered.length} notification
                {filtered.length === 1 ? "" : "s"}
              </span>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="flex items-center gap-1 font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                >
                  Load more
                  <ChevronDown className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preferences dialog */}
      <Dialog open={prefOpen} onOpenChange={(o) => (o ? openPreferences() : handlePrefCancel())}>
        <DialogContent className="max-h-[88vh] max-w-[560px] gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-[var(--hairline)] px-5 py-4">
            <DialogTitle className="flex items-center gap-2 font-serif text-[18px] text-[var(--ink-primary)]">
              <Settings2 className="size-4 text-[var(--recovery-green)]" />
              Notification preferences
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--ink-secondary)]">
              Choose which alerts you receive and where they&apos;re delivered.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
            {prefDraft &&
              PREF_SECTIONS.map((section) => (
                <PrefSectionBlock
                  key={section.title}
                  section={section}
                  draft={prefDraft}
                  onToggle={handlePrefToggle}
                />
              ))}

            {/* Delivery channels */}
            {prefDraft && (
              <div className="mb-2 last:mb-0">
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
                  Delivery channels
                </h3>
                <p className="mb-3 text-[11px] text-[var(--ink-muted)]">
                  Where RescueLoop should send your notifications.
                </p>
                <div className="divide-y divide-[var(--hairline-subtle)] rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                  {CHANNEL_ROWS.map((row) => {
                    const isSlack = row.key === "channelSlack";
                    const value = prefDraft[row.key];
                    return (
                      <div
                        key={row.key}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                              {row.label}
                            </span>
                            {isSlack && (
                              <Badge
                                variant="outline"
                                className="rounded-[3px] border-[var(--hairline-strong)] text-[9px] uppercase tracking-[0.04em] text-[var(--ink-muted)]"
                              >
                                Coming soon
                              </Badge>
                            )}
                          </div>
                          {row.description && (
                            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                              {row.description}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(v) => handlePrefToggle(row.key, v)}
                          disabled={isSlack}
                          aria-label={row.label}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrefCancel}
              className="h-8 rounded-[6px] px-3 text-[12px] text-[var(--ink-secondary)]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePrefSave}
              className="h-8 rounded-[6px] bg-[var(--recovery-green)] px-4 text-[12px] text-white hover:bg-[var(--recovery-green)]/90"
            >
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// ── Notification card ─────────────────────────────────────────
interface NotificationCardProps {
  notification: Notification;
  basePath: string;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onMarkRead: () => void;
  onDismiss: () => void;
  index: number;
}

function NotificationCard({
  notification: n,
  basePath,
  bulkMode,
  selected,
  onToggleSelected,
  onMarkRead,
  onDismiss,
  index,
}: NotificationCardProps) {
  const meta = CATEGORY_META[n.category];
  const Icon = meta.icon;
  const isUnread = !n.resolved;
  const actionHref = n.actionHref.startsWith("/dashboard")
    ? n.actionHref
    : `${basePath}${n.actionHref}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
      transition={{ delay: Math.min(index * 0.03, 0.25), duration: 0.25 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden rounded-[10px] border bg-[var(--surface)] p-4 transition-all",
          "hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]",
          isUnread ? "border-[var(--hairline)]" : "border-[var(--hairline-subtle)]",
          selected && "border-[var(--recovery-green)]/40 bg-[var(--recovery-green)]/[0.04]",
          n.dismissed && "opacity-60",
        )}
      >
        {/* Unread indicator dot */}
        {isUnread && (
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full",
              meta.dot,
            )}
          />
        )}

        <div className="flex items-start gap-3 pl-1">
          {/* Checkbox in bulk mode */}
          {bulkMode && (
            <div className="flex pt-1">
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelected()}
                aria-label={`Select notification: ${n.title}`}
              />
            </div>
          )}

          {/* Type icon */}
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[8px] border",
              meta.bg,
              meta.border,
            )}
          >
            <Icon className={cn("size-4", meta.color)} />
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-[13px] text-[var(--ink-primary)]",
                      isUnread ? "font-semibold" : "font-medium",
                    )}
                  >
                    {n.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("rounded-[3px] text-[9px] uppercase tracking-[0.04em]", meta.bg, meta.color, meta.border)}
                  >
                    {meta.label}
                  </Badge>
                  {n.dismissed && (
                    <Badge
                      variant="outline"
                      className="rounded-[3px] border-[var(--hairline-strong)] text-[9px] uppercase tracking-[0.04em] text-[var(--ink-muted)]"
                    >
                      Dismissed
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                  {n.description}
                </p>
                <p className="mt-1.5 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                  {relativeFromIso(n.createdAtIso)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkRead}
                    className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                    aria-label={isUnread ? "Mark as read" : "Mark as unread"}
                  >
                    <CheckCheck className="mr-1 size-3" />
                    {isUnread ? "Mark read" : "Unread"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                    aria-label="Dismiss notification"
                  >
                    <X className="mr-1 size-3" />
                    Dismiss
                  </Button>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-[6px] border-[var(--hairline)] px-2.5 text-[11px] text-[var(--ink-secondary)] hover:border-[var(--recovery-green)] hover:text-[var(--recovery-green)]"
                >
                  <Link href={actionHref}>
                    {n.actionLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Preferences section block ─────────────────────────────────
interface PrefSectionBlockProps {
  section: PrefSection;
  draft: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences, value: boolean) => void;
}

function PrefSectionBlock({ section, draft, onToggle }: PrefSectionBlockProps) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
        {section.title}
      </h3>
      <p className="mb-3 text-[11px] text-[var(--ink-muted)]">{section.description}</p>
      <div className="divide-y divide-[var(--hairline-subtle)] rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
        {section.rows.map((row) => {
          const value = draft[row.key];
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                  {row.label}
                </span>
                {row.description && (
                  <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                    {row.description}
                  </p>
                )}
              </div>
              <Switch
                checked={value}
                onCheckedChange={(v) => onToggle(row.key, v)}
                aria-label={row.label}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
