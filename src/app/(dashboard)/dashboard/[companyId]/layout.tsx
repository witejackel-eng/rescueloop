"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  BookOpen,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Activity,
  Heart,
  Settings,
  CreditCard,
  HelpCircle,
  Menu,
  Wifi,
  RefreshCw,
  Bell,
  Search,
  Command as CommandIcon,
  Keyboard,
  CircleDot,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RescueLoopMark } from "@/components/brand/logo";
import { useDemoStore, useUnresolvedNotificationCount } from "@/features/demo-engine/demo-store";
import { NotificationPanel } from "@/components/shell/notification-panel";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { WorkspaceSwitcher } from "@/components/shared/workspace-switcher";
import { PullRefresh } from "@/components/shared/pull-refresh";

// ── Navigation ────────────────────────────────────────────────
const PRIMARY_NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/rescue-queue", label: "Rescue Queue", icon: ListChecks },
  { href: "/students", label: "Members", icon: Users },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/responses", label: "Responses", icon: MessageSquare },
  { href: "/outcomes", label: "Outcomes", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const SECONDARY_NAV = [
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/health", label: "System Health", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/usage", label: "Plan & Usage", icon: CreditCard },
  { href: "/help/diagnostics", label: "Help", icon: HelpCircle },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open command palette", group: "Global" },
  { keys: ["⌘", "/"], description: "Show keyboard shortcuts", group: "Global" },
  { keys: ["G", "O"], description: "Go to Overview", group: "Navigation" },
  { keys: ["G", "Q"], description: "Go to Rescue Queue", group: "Navigation" },
  { keys: ["G", "M"], description: "Go to Members", group: "Navigation" },
  { keys: ["G", "P"], description: "Go to Playbooks", group: "Navigation" },
  { keys: ["G", "R"], description: "Go to Responses", group: "Navigation" },
  { keys: ["G", "I"], description: "Go to Insights", group: "Navigation" },
  { keys: ["G", "A"], description: "Go to Activity", group: "Navigation" },
  { keys: ["G", "S"], description: "Go to Settings", group: "Navigation" },
  { keys: ["N"], description: "Open notifications", group: "Actions" },
  { keys: ["R"], description: "Refresh current view", group: "Actions" },
  { keys: ["?"], description: "Open help center", group: "Actions" },
  { keys: ["Esc"], description: "Close dialog / panel", group: "Actions" },
];

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ companyId: string }>();
  const pathname = usePathname();
  const companyId = params.companyId;
  const basePath = `/dashboard/${companyId}`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const setCommandPaletteOpen = useDemoStore((s) => s.setCommandPaletteOpen);
  const unresolvedCount = useUnresolvedNotificationCount();
  const router = useRouter();

  // Pull-to-refresh: reload current route data
  const handlePullRefresh = useCallback(async () => {
    router.refresh();
  }, [router]);

  const isActive = (href: string) => {
    const full = `${basePath}${href}`;
    if (href === "") return pathname === basePath;
    return pathname.startsWith(full);
  };

  // Global keyboard shortcut handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ⌘ + / → shortcuts dialog
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (isTyping) return;

      // Single-key navigation (G then letter)
      if (e.key === "n" || e.key === "N") {
        setNotifOpen(true);
      } else if (e.key === "?") {
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[228px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] lg:flex">
        {/* Logo + company */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[var(--hairline)] px-4">
          <Link href="/" aria-label="RescueLoop home" className="shrink-0">
            <RescueLoopMark size={22} />
          </Link>
          <WorkspaceSwitcher variant="sidebar" />
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Dashboard navigation">
          <div className="px-4 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Primary
          </div>
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 mx-2 rounded-[6px] px-2.5 py-2 transition-colors",
                  active
                    ? "bg-[var(--surface)] text-[var(--ink-primary)] shadow-[0_0_0_1px_var(--hairline)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface)]/60",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-[var(--recovery-green)]"
                  />
                )}
                <Icon className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  active && "text-[var(--recovery-green)]",
                )} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className="px-4 pb-1 pt-4 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Secondary
          </div>
          {SECONDARY_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 mx-2 rounded-[6px] px-2.5 py-2 transition-colors",
                  active
                    ? "bg-[var(--surface)] text-[var(--ink-primary)] shadow-[0_0_0_1px_var(--hairline)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface)]/60",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-[var(--recovery-green)]"
                  />
                )}
                <Icon className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  active && "text-[var(--recovery-green)]",
                )} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status footer */}
        <div className="border-t border-[var(--hairline)] px-3 py-3 space-y-2">
          {/* Theme toggle in sidebar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[var(--ink-muted)]">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-[6px] bg-[var(--surface)] px-2.5 py-2 border border-[var(--hairline)]">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)]">
              <RefreshCw className="size-3" />
              <span>Last sync</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--ink-secondary)]">just now</span>
          </div>
          <button
            onClick={() => setShortcutsOpen(true)}
            className="flex w-full items-center justify-between gap-2 rounded-[6px] px-2.5 py-1.5 text-[10px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink-secondary)]"
            aria-label="Keyboard shortcuts"
          >
            <span className="flex items-center gap-1.5">
              <Keyboard className="size-3" />
              <span>Shortcuts</span>
            </span>
            <kbd className="rounded border border-[var(--hairline)] bg-[var(--canvas)] px-1 py-px font-mono text-[9px]">⌘ /</kbd>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 lg:px-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden size-9 rounded-[8px] text-[var(--ink-secondary)]"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex items-center gap-2 lg:hidden">
            <RescueLoopMark size={18} />
            <WorkspaceSwitcher variant="compact" />
          </div>

          {/* Page breadcrumb (single source of truth — workspace already in sidebar) */}
          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-medium text-[var(--ink-muted)]">Dashboard</span>
            <span className="text-[var(--ink-muted)]">/</span>
            <span className="text-[13px] font-medium text-[var(--ink-primary)] truncate">
              {getPageTitle(pathname, basePath)}
            </span>
          </div>

          {/* Command palette trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="ml-2 hidden items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1.5 text-[12px] text-[var(--ink-muted)] transition-colors hover:border-[var(--hairline-strong)] hover:text-[var(--ink-secondary)] md:flex"
            aria-label="Open command palette"
          >
            <Search className="size-3.5" />
            <span>Search…</span>
            <kbd className="flex items-center gap-0.5 rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1 py-px font-mono text-[10px]">
              <CommandIcon className="size-2.5" />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShortcutsOpen(true)}
              className="hidden md:flex size-9 items-center justify-center rounded-[8px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-secondary)]"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (⌘ /)"
            >
              <Keyboard className="size-[18px]" />
            </button>

            <Badge variant="outline" className="hidden sm:inline-flex rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
              <Wifi className="mr-1 size-3" />
              Connected
            </Badge>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 rounded-[8px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
              onClick={() => setNotifOpen(true)}
              aria-label={`Notifications${unresolvedCount > 0 ? `, ${unresolvedCount} unresolved` : ""}`}
            >
              <Bell className="size-[18px]" />
              {unresolvedCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--critical)] font-mono text-[9px] font-semibold text-white">
                  {unresolvedCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <PullRefresh onRefresh={handlePullRefresh}>
            <div className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16 lg:px-8 lg:py-8 lg:pb-20">
              {children}
              {/* Closure footer */}
              <DashboardFooter />
            </div>
          </PullRefresh>
        </div>
      </div>

      {/* Mobile sheet — enhanced with sections, workspace, theme toggle, collapse */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[280px] border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0 [&>button]:hidden"
        >
          {/* Workspace header */}
          <SheetHeader className="border-b border-[var(--hairline)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Link href="/" onClick={() => setMobileOpen(false)} aria-label="RescueLoop home">
                <RescueLoopMark size={20} />
              </Link>
              <WorkspaceSwitcher variant="compact" />
            </div>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
          </SheetHeader>

          {/* Scrollable nav with section headers + green indicator */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin py-2" aria-label="Mobile navigation">
            {/* Primary section */}
            <div className="px-4 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              Primary
            </div>
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 px-5 py-2.5 mobile-tap-feedback transition-colors",
                    active
                      ? "bg-[var(--surface)] text-[var(--ink-primary)] font-semibold"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--recovery-green)]" />
                  )}
                  <Icon className={cn(
                    "size-4 shrink-0",
                    active && "text-[var(--recovery-green)]",
                  )} />
                  <span className="text-[14px]">{item.label}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="mx-4 my-2 h-px bg-[var(--hairline)]" />

            {/* Secondary section */}
            <div className="px-4 pb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              Secondary
            </div>
            {SECONDARY_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 px-5 py-2.5 mobile-tap-feedback transition-colors",
                    active
                      ? "bg-[var(--surface)] text-[var(--ink-primary)] font-semibold"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--recovery-green)]" />
                  )}
                  <Icon className={cn(
                    "size-4 shrink-0",
                    active && "text-[var(--recovery-green)]",
                  )} />
                  <span className="text-[14px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sheet footer: theme toggle + collapse */}
          <div className="border-t border-[var(--hairline)] px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--ink-muted)]">Appearance</span>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--ink-secondary)] transition-colors hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] mobile-tap-feedback"
            >
              <PanelLeftClose className="size-3.5" />
              Collapse sidebar
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notification sheet */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full border-l border-[var(--hairline)] p-0 sm:max-w-md">
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Keyboard shortcuts dialog */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-[520px] gap-0 p-0">
          <DialogHeader className="border-b border-[var(--hairline)] px-5 py-4">
            <DialogTitle className="flex items-center gap-2 font-serif text-[18px]">
              <Keyboard className="size-4 text-[var(--recovery-green)]" />
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              Use these shortcuts to navigate RescueLoop faster.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
            {Object.entries(
              KEYBOARD_SHORTCUTS.reduce<Record<string, typeof KEYBOARD_SHORTCUTS>>((acc, s) => {
                (acc[s.group] = acc[s.group] || []).push(s);
                return acc;
              }, {})
            ).map(([group, shortcuts]) => (
              <div key={group} className="mb-5 last:mb-0">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  {group}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((s, i) => (
                    <div
                      key={`${s.description}-${i}`}
                      className="flex items-center justify-between rounded-[6px] px-2 py-1.5 transition-colors hover:bg-[var(--canvas-elevated)]"
                    >
                      <span className="text-[13px] text-[var(--ink-secondary)]">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k, j) => (
                          <kbd
                            key={`${k}-${j}`}
                            className="min-w-[20px] rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 text-center font-mono text-[10px] font-medium text-[var(--ink-secondary)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile bottom tabs — enhanced with 5th slot, touch targets, haptic feedback, stronger active indicator */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {PRIMARY_NAV.slice(0, 3).map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 mobile-tap-feedback",
                "min-h-[44px]", // Touch target
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator — thicker top bar with animation */}
              {active && (
                <span className="absolute top-0 left-1/4 right-1/4 h-[3px] rounded-b-full bg-[var(--recovery-green)] mobile-nav-active-bar" />
              )}
              <Icon className={cn(
                "size-[18px] transition-colors",
                active ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]",
              )} />
              <span className={cn(
                "text-[9px] leading-none",
                active ? "font-bold text-[var(--ink-primary)]" : "text-[var(--ink-muted)]",
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* 4th slot: Notifications with unread badge */}
        <Link
          href={`${basePath}/notifications`}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 mobile-tap-feedback",
            "min-h-[44px]",
          )}
          aria-current={isActive("/notifications") ? "page" : undefined}
        >
          {isActive("/notifications") && (
            <span className="absolute top-0 left-1/4 right-1/4 h-[3px] rounded-b-full bg-[var(--recovery-green)] mobile-nav-active-bar" />
          )}
          <span className="relative">
            <Bell className={cn(
              "size-[18px] transition-colors",
              isActive("/notifications") ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]",
            )} />
            {unresolvedCount > 0 && (
              <span className="absolute -right-1.5 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[var(--critical)] font-mono text-[8px] font-semibold text-white">
                {unresolvedCount > 9 ? "9+" : unresolvedCount}
              </span>
            )}
          </span>
          <span className={cn(
            "text-[9px] leading-none",
            isActive("/notifications") ? "font-bold text-[var(--ink-primary)]" : "text-[var(--ink-muted)]",
          )}>
            Alerts
          </span>
        </Link>
        {/* 5th slot: More button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 mobile-tap-feedback",
            "min-h-[44px]",
          )}
          aria-label="More sections"
        >
          <Menu className="size-[18px] text-[var(--ink-muted)]" />
          <span className="text-[9px] leading-none text-[var(--ink-muted)]">More</span>
        </button>
      </nav>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function getPageTitle(pathname: string, basePath: string): string {
  const rest = pathname.replace(basePath, "").replace(/^\/+/, "");
  if (!rest) return "Overview";
  const segment = rest.split("/")[0];
  const map: Record<string, string> = {
    "rescue-queue": "Rescue Queue",
    "students": "Members",
    "playbooks": "Playbooks",
    "responses": "Responses",
    "outcomes": "Outcomes",
    "insights": "Insights",
    "analytics": "Analytics",
    "activity": "Activity",
    "notifications": "Notifications",
    "settings": "Settings",
    "usage": "Plan & Usage",
    "help": "Help",
  };
  return map[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

function DashboardFooter() {
  return (
    <footer
      className="mt-10 flex flex-col gap-2 border-t border-[var(--hairline)] pt-4 text-[11px] text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between"
      aria-label="Dashboard footer"
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <CircleDot className="size-3 text-[var(--recovery-green)]" />
          <span>All systems operational</span>
        </span>
        <span className="text-[var(--hairline-strong)]">·</span>
        <span className="font-mono">v2.4.1</span>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/help/diagnostics" className="transition-colors hover:text-[var(--ink-secondary)]">
          Status
        </Link>
        <span className="text-[var(--hairline-strong)]">·</span>
        <Link href="/help/diagnostics" className="transition-colors hover:text-[var(--ink-secondary)]">
          Docs
        </Link>
        <span className="text-[var(--hairline-strong)]">·</span>
        <a href="mailto:support@rescueloop.io" className="transition-colors hover:text-[var(--ink-secondary)]">
          Support
        </a>
      </div>
    </footer>
  );
}
