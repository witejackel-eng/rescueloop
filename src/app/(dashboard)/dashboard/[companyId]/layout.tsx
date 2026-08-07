"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
  ChevronDown,
  Wifi,
  RefreshCw,
  Bell,
  Search,
  Command as CommandIcon,
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
import { RescueLoopMark } from "@/components/brand/logo";
import { useDemoStore, useUnresolvedNotificationCount } from "@/features/demo-engine/demo-store";
import { NotificationPanel } from "@/components/shell/notification-panel";

// ── Navigation ────────────────────────────────────────────────
const PRIMARY_NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/rescue-queue", label: "Rescue Queue", icon: ListChecks },
  { href: "/students", label: "Members", icon: Users },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/responses", label: "Responses", icon: MessageSquare },
  { href: "/outcomes", label: "Outcomes", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
];

const SECONDARY_NAV = [
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings/health", label: "System Health", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/usage", label: "Plan & Usage", icon: CreditCard },
  { href: "/help/diagnostics", label: "Help", icon: HelpCircle },
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
  const setCommandPaletteOpen = useDemoStore((s) => s.setCommandPaletteOpen);
  const unresolvedCount = useUnresolvedNotificationCount();

  const isActive = (href: string) => {
    const full = `${basePath}${href}`;
    if (href === "") return pathname === basePath;
    return pathname.startsWith(full);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] lg:flex">
        {/* Logo + company */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[var(--hairline)] px-4">
          <Link href="/" aria-label="RescueLoop home">
            <RescueLoopMark size={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-serif text-[13px] text-[var(--ink-primary)]">
                Creator Growth Lab
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
              <Wifi className="size-2.5 text-[var(--recovery-green)]" />
              <span>Whop connected</span>
              <span>·</span>
              <span className="text-[var(--recovery-green)]">Growth</span>
            </div>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Dashboard navigation">
          <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
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
                  "group relative flex items-center gap-2.5 px-4 py-2 transition-colors",
                  active
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas)]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute -left-px top-1/2 h-4 w-[2px] -translate-y-1/2 bg-[var(--recovery-green)]"
                  />
                )}
                <Icon className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  active && "text-[var(--recovery-green)]",
                )} />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}

          <div className="px-3 pb-1 pt-4 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
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
                  "group relative flex items-center gap-2.5 px-4 py-2 transition-colors",
                  active
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas)]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute -left-px top-1/2 h-4 w-[2px] -translate-y-1/2 bg-[var(--recovery-green)]"
                  />
                )}
                <Icon className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  active && "text-[var(--recovery-green)]",
                )} />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--hairline)] px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)]">
            <RefreshCw className="size-3" />
            <span>Last sync: just now</span>
          </div>
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
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--ink-primary)]">Dashboard</span>
            <span className="text-[var(--ink-muted)]">/</span>
            <span className="text-[13px] text-[var(--ink-secondary)]">Creator Growth Lab</span>
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
            <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
              <Wifi className="mr-1 size-3" />
              Connected
            </Badge>
            <Badge variant="outline" className="rounded-[3px] text-[10px]">
              Growth plan
            </Badge>

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
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0">
          <SheetHeader className="border-b border-[var(--hairline)] px-4 py-4">
            <div className="flex items-center gap-2.5">
              <RescueLoopMark size={22} />
              <SheetTitle className="font-serif text-[16px] text-[var(--ink-primary)]">Creator Growth Lab</SheetTitle>
            </div>
          </SheetHeader>
          <nav className="flex flex-col py-2">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 transition-colors",
                    active
                      ? "bg-[var(--surface)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[14px]">{item.label}</span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-[var(--recovery-green)]" />}
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

      {/* Mobile bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {PRIMARY_NAV.slice(0, 4).map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 h-[2px] w-8 bg-[var(--recovery-green)]" />
              )}
              <Icon className={cn("size-4", active ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]")} />
              <span className={cn("text-[9px]", active ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2"
          aria-label="More sections"
        >
          <Menu className="size-4 text-[var(--ink-muted)]" />
          <span className="text-[9px] text-[var(--ink-muted)]">More</span>
        </button>
      </nav>
    </div>
  );
}
