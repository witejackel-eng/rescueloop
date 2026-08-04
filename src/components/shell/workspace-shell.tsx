"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Megaphone,
  BarChart3,
  DollarSign,
  Settings as SettingsIcon,
  Bell,
  Pause,
  Play,
  Search,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  Command as CommandIcon,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RescueLoopMark } from "@/components/brand/logo";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import { useUnresolvedNotificationCount } from "@/features/demo-engine/demo-store";
import { AutomationStateBadge } from "@/components/shell/automation-badge";
import { NotificationPanel } from "@/components/shell/notification-panel";
import { COMPANY, COURSE, LAST_SYNC } from "@/lib/mock-data";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/rescue-queue", label: "Queue", icon: ListChecks },
  { href: "/students", label: "Students", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/value", label: "Value", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 4); // Overview, Queue, Campaigns, Insights
const MOBILE_MORE = NAV_ITEMS.slice(4); // Value, Students, Settings

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const automationState = useDemoStore((s) => s.automationState);
  const pauseAutomation = useDemoStore((s) => s.pauseAutomation);
  const resumeAutomation = useDemoStore((s) => s.resumeAutomation);
  const setCommandPaletteOpen = useDemoStore((s) => s.setCommandPaletteOpen);
  const unresolvedCount = useUnresolvedNotificationCount();
  const isPaused = automationState === "paused";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Desktop vertical nav rail */}
      <aside className="hidden w-[68px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] md:flex lg:w-[72px]">
        <div className="flex h-14 items-center justify-center border-b border-[var(--hairline)]">
          <Link href="/" aria-label="RescueLoop home">
            <RescueLoopMark size={26} />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1 py-4" aria-label="Workspace navigation">
          <TooltipProvider delayDuration={150}>
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className="relative flex size-10 items-center justify-center press"
                      aria-current={active ? "page" : undefined}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active-bg"
                          transition={{ type: "spring", stiffness: 300, damping: 32 }}
                          className="absolute inset-0 rounded-[8px] bg-[var(--surface)] shadow-[0_0_0_1px_var(--hairline)]"
                        />
                      )}
                      <item.icon
                        className={cn(
                          "relative z-10 size-[18px] transition-colors",
                          active
                            ? "text-[var(--ink-primary)]"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
                        )}
                      />
                      {active && (
                        <motion.span
                          layoutId="nav-active-bar"
                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                          className="absolute -left-[14px] top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[var(--recovery-green)]"
                        />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
        <div className="flex flex-col items-center gap-1 border-t border-[var(--hairline)] py-4">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-[8px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  asChild
                >
                  <Link href="/student-rescue" target="_blank">
                    <HelpCircle className="size-[18px]" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Student rescue preview
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top command bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 lg:px-6">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 md:hidden" aria-label="RescueLoop">
            <RescueLoopMark size={22} />
          </Link>

          {/* Workspace + course selector */}
          <button
            className="hidden items-center gap-2 text-[13px] font-medium text-[var(--ink-primary)] md:flex"
            aria-label="Workspace and course"
          >
            <span>{COMPANY.name}</span>
            <span className="text-[var(--ink-muted)]">/</span>
            <span className="text-[var(--ink-secondary)]">{COURSE.name}</span>
            <ChevronDown className="size-3.5 text-[var(--ink-muted)]" />
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Command palette trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1.5 text-[12px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-secondary)] sm:flex"
              aria-label="Open command palette"
            >
              <Search className="size-3.5" />
              <span>Search</span>
              <kbd className="flex items-center gap-0.5 rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1 py-px font-mono text-[10px]">
                <CommandIcon className="size-2.5" />K
              </kbd>
            </button>

            {/* Sync status — demo-honest label */}
            <div className="hidden items-center gap-1.5 lg:flex" title="Simulated sync — demo workspace">
              <RefreshCw className="size-3.5 text-[var(--ink-muted)]" />
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">Demo sync · {LAST_SYNC}</span>
            </div>

            {/* Automation state */}
            <AutomationStateBadge state={automationState} />

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

            {/* Pause / Resume */}
            <Button
              onClick={() => (isPaused ? resumeAutomation() : pauseAutomation())}
              variant="ghost"
              size="icon"
              className={cn(
                "size-9 rounded-[8px]",
                isPaused
                  ? "bg-[var(--critical)] text-white hover:bg-[var(--critical)]"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]",
              )}
              aria-label={isPaused ? "Resume automation" : "Pause automation"}
            >
              {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </Button>
          </div>
        </header>

        {/* Paused banner */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-[var(--critical-light)] bg-[var(--critical-light)]/40"
            >
              <p className="px-4 py-1.5 text-center text-[12px] font-medium text-[var(--critical)]">
                Automation paused — no interventions will be sent until you resume.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {MOBILE_PRIMARY.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="absolute top-0 h-[2px] w-8 bg-[var(--recovery-green)]"
                />
              )}
              <item.icon
                className={cn(
                  "size-5",
                  active ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]",
                )}
              />
              <span
                className={cn(
                  "text-[10px]",
                  active ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreSheetOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2"
          aria-label="More navigation"
        >
          <MoreHorizontal className="size-5 text-[var(--ink-muted)]" />
          <span className="text-[10px] text-[var(--ink-muted)]">More</span>
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[20px] p-0">
          <SheetHeader className="px-5 pt-5">
            <SheetTitle className="font-serif text-xl">More</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-3">
            {MOBILE_MORE.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[8px] px-3 py-3 text-[15px]",
                    active
                      ? "bg-[var(--canvas-elevated)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)]",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Notification sheet */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full border-l border-[var(--hairline)] p-0 sm:max-w-md">
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
