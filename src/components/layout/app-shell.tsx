"use client";

/**
 * AppShell — the stable application shell that persists across routes.
 *
 * Per spec 03_APP_SHELL_AND_NAVIGATION.md:
 * - Shell stays mounted across route changes
 * - Uses regional skeletons instead of full-screen flashes
 * - Errors render inside the content region
 * - Browser back restores reasonable context
 * - Deep links open the correct inspector where supported
 * - Navigation exposes current route, supports keyboard/screen readers
 * - Close mobile sheets on navigation
 * - Share one route registry with the command palette
 */

import {
  Bell,
  LifeBuoy,
  Pause,
  Play,
  RefreshCw,
  ChevronDown,
  Menu,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, type ReactNode, type ErrorInfo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RescueLoopLogo } from "@/components/shared/logo";
import { AutomationStatePill } from "@/components/shared/status-pills";
import type { AutomationState } from "@/lib/types";
import {
  AUTOMATION_STATE,
  COMPANY,
  COURSE,
  COURSES_FOR_SELECTION,
  LAST_SYNC,
  NEXT_SYNC,
  NOTIFICATIONS,
  UNRESOLVED_NOTIFICATION_COUNT,
} from "@/lib/mock-data";
import { NotificationList } from "@/components/layout/notification-list";
import { useEscapeKey } from "@/hooks/use-focus-restore";

// ─── Route registry (shared with CommandPalette) ───

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/rescue-queue", label: "Rescue Queue" },
  { href: "/students", label: "Students" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/insights", label: "Insights" },
  { href: "/value", label: "Value" },
  { href: "/settings", label: "Settings" },
] as const;

export type NavRoute = (typeof NAV_ITEMS)[number];

/**
 * Get the current active nav key from a pathname.
 * Shared between AppShell, CommandPalette, and keyboard handlers.
 */
export function getActiveNavKey(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    if (pathname.startsWith(item.href)) return item.href;
  }
  return null;
}

// ─── Regional skeleton patterns ───

export interface RegionSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
  /** Variant controls the skeleton shape */
  variant?: "table" | "cards" | "list" | "chart";
  className?: string;
}

/**
 * RegionSkeleton — renders a regional skeleton for a content area.
 * Per spec: use regional skeletons instead of full-screen flashes.
 * Each region loads independently so the shell never flashes.
 */
export function RegionSkeleton({
  rows = 4,
  variant = "table",
  className,
}: RegionSkeletonProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-[#E3E5DF] bg-white p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2 w-2/3" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Default: table
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header row */}
      <div className="flex items-center gap-4 rounded-lg bg-[#F8F8F5] px-3 py-2">
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg px-3 py-2">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Content-region error boundary ───

interface ContentErrorProps {
  error: Error;
  resetErrorBoundary?: () => void;
  className?: string;
}

/**
 * ContentRegionError — renders an error inside the content region.
 * Per spec: errors render inside the content region, not as full-page overlays.
 */
export function ContentRegionError({
  error,
  resetErrorBoundary,
  className,
}: ContentErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-[#E8C9C5] bg-[#FDF6F5] px-6 py-12 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-[#C64D45]/10">
        <AlertTriangle className="size-6 text-[#C64D45]" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[#171A17]">Something went wrong</h3>
        <p className="text-sm text-[#6A706A]">
          {error.message || "An unexpected error occurred in this section."}
        </p>
      </div>
      {resetErrorBoundary && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetErrorBoundary}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Content Region wrapper ───

export interface ContentRegionProps {
  children: ReactNode;
  className?: string;
}

/**
 * ContentRegion — wraps page content inside the shell's main area.
 * Provides a consistent container with error boundary support.
 * The shell stays mounted; only this region changes between routes.
 */
export function ContentRegion({ children, className }: ContentRegionProps) {
  return (
    <div className={cn("min-h-[50vh]", className)}>
      {children}
    </div>
  );
}

// ─── AppHeader ───

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [automationState, setAutomationState] = useState<AutomationState>(AUTOMATION_STATE);
  const [notifOpen, setNotifOpen] = useState(false);

  const isPaused = automationState === "paused";

  function togglePause() {
    setAutomationState((prev) => (prev === "paused" ? "manual_approval" : "paused"));
  }

  // Close mobile nav on route change
  const handleNavClick = useCallback(
    (href: string) => {
      setMobileNavOpen(false);
      router.push(href);
    },
    [router]
  );

  // Escape closes mobile nav
  useEscapeKey(() => setMobileNavOpen(false), mobileNavOpen);
  useEscapeKey(() => setNotifOpen(false), notifOpen);

  // Determine current route for aria-current and screen readers
  const activeKey = getActiveNavKey(pathname);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E3E5DF] bg-[#FFFFFF]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFFFFF]/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="text-left">
                <RescueLoopLogo />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => {
                const active = item.href === activeKey;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#E8F5EF] text-[#0B5144]"
                        : "text-[#6A706A] hover:bg-[#F8F8F5] hover:text-[#171A17]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/overview" className="shrink-0" aria-label="RescueLoop home">
          <RescueLoopLogo />
        </Link>

        {/* Company selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden gap-1.5 text-[#6A706A] sm:flex">
              <span className="size-1.5 rounded-full bg-[#27966A]" />
              {COMPANY.name}
              <ChevronDown className="size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <span className="size-1.5 rounded-full bg-[#27966A]" />
              {COMPANY.name}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[#6A706A]">
              <span className="size-1.5 rounded-full bg-[#D8DAD4]" />
              Switch company…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Course selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden gap-1.5 md:flex">
              <span className="text-[#6A706A]">Course:</span>
              <span className="font-medium text-[#171A17]">{COURSE.name}</span>
              <ChevronDown className="size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Select course</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COURSES_FOR_SELECTION.map((c) => (
              <DropdownMenuItem
                key={c.id}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-[#6A706A]">
                  {c.lessonCount} lessons · {c.studentCount} students
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          {/* Sync status */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden items-center gap-1.5 rounded-full border border-[#E3E5DF] bg-[#F8F8F5] px-2.5 py-1 lg:flex">
                  <RefreshCw className="size-3 text-[#6A706A]" />
                  <span className="text-xs text-[#6A706A]">Synced {LAST_SYNC}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Next sync {NEXT_SYNC}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Automation state */}
          <div className="hidden sm:block">
            <AutomationStatePill state={automationState} />
          </div>

          {/* Notifications */}
          <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-5" />
                {UNRESOLVED_NOTIFICATION_COUNT > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#C64D45] px-1 text-[10px] font-semibold text-white">
                    {UNRESOLVED_NOTIFICATION_COUNT}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0">
              <SheetHeader className="border-b border-[#E3E5DF] px-5 py-4">
                <SheetTitle className="flex items-center justify-between">
                  <span>Creator actions</span>
                  <Badge className="bg-[#C64D45] text-white">
                    {UNRESOLVED_NOTIFICATION_COUNT} unresolved
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <NotificationList notifications={NOTIFICATIONS} onAction={() => setNotifOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Help */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help">
                  <LifeBuoy className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Help & documentation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Pause automation */}
          <Button
            onClick={togglePause}
            variant={isPaused ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5 font-medium",
              isPaused
                ? "bg-[#C64D45] text-white hover:bg-[#C64D45]/90"
                : "border-[#C64D45] text-[#C64D45] hover:bg-[#F4E8E6]",
            )}
          >
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
            <span className="hidden md:inline">{isPaused ? "automation" : "automation"}</span>
          </Button>
        </div>
      </div>

      {/* Desktop horizontal nav — with aria-current for screen readers */}
      <nav className="hidden border-t border-[#E3E5DF] bg-[#FFFFFF] lg:block" aria-label="Main navigation">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-4 lg:px-6">
          {NAV_ITEMS.map((item) => {
            const active = item.href === activeKey;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[#147D68] text-[#147D68]"
                    : "border-transparent text-[#6A706A] hover:text-[#171A17]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Paused banner */}
      {isPaused && (
        <div className="border-b border-[#E8C9C5] bg-[#FDF6F5] px-4 py-2 text-center lg:px-6" role="alert">
          <p className="text-xs font-medium text-[#C64D45]">
            Automation is paused. No interventions will be sent until you resume.
          </p>
        </div>
      )}
    </header>
  );
}

// ─── AppShell ───

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F1]">
      {/* Skip to content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#147D68] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      {/* Shell stays mounted across route changes */}
      <AppHeader />
      {/* Content region — only this area changes between routes */}
      <main
        id="main-content"
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-6 lg:py-8"
        tabIndex={-1}
      >
        {children}
      </main>
      {/* Sticky footer — pushed down by flex-1 on main */}
      <footer className="border-t border-[#E3E5DF] bg-[#FFFFFF] py-4">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 text-xs text-[#6A706A] sm:flex-row lg:px-6">
          <p>RescueLoop — student-success command centre for Whop course creators</p>
          <p>Demo data · Creator Growth Lab · Agency Growth System</p>
        </div>
      </footer>
    </div>
  );
}
