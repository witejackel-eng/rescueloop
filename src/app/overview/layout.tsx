"use client";

// /overview layout — unified demo shell for all /overview/* routes.
//
// ARCHITECTURE
// ────────────
// Wraps every /overview sub-route with a shared product shell:
//   • Left sidebar (240px on desktop, Sheet drawer on mobile)
//   • Top bar: RescueLoop logo, workspace name, plan badge, system status
//   • Persistent disclosure banner at the bottom
//
// BEHAVIOR
// ────────
//   • Mobile: hamburger triggers a Sheet drawer (Radix Dialog — built-in
//     focus trap + Escape close). Drawer also closes on route change.
//   • Desktop: sidebar is always visible, no hamburger.
//   • Active nav item highlighted with --recovery-green left border accent.
//   • framer-motion for sidebar entrance animation on mount.

import { type ReactNode, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Megaphone,
  BarChart3,
  Wallet,
  HeartPulse,
  Settings2,
  Menu,
  CircleCheck,
} from "lucide-react";
import { RescueLoopLogo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ─── Navigation items ──────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Rescue Queue", href: "/overview/rescue-queue", icon: ListChecks },
  { label: "Students", href: "/overview/students", icon: Users },
  { label: "Campaigns", href: "/overview/campaigns", icon: Megaphone },
  { label: "Insights", href: "/overview/insights", icon: BarChart3 },
  { label: "Value Ledger", href: "/overview/value", icon: Wallet },
];

const SECONDARY_NAV: NavItem[] = [
  { label: "System Health", href: "/overview/settings/health", icon: HeartPulse },
  { label: "Settings", href: "/overview/settings", icon: Settings2 },
];

// ─── Sidebar content (shared between desktop & mobile drawer) ──

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = useCallback(
    (href: string) => {
      // Exact match for /overview, prefix match for sub-routes
      if (href === "/overview") return pathname === "/overview";
      return pathname.startsWith(href);
    },
    [pathname],
  );

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Demo navigation">
      {/* Primary group */}
      {PRIMARY_NAV.map((item) => (
        <NavItemLink
          key={item.href}
          item={item}
          active={isActive(item.href)}
          onNavigate={onNavigate}
        />
      ))}

      <Separator className="my-3 bg-[var(--hairline)]" />

      {/* Secondary group */}
      <span className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
        System
      </span>
      {SECONDARY_NAV.map((item) => (
        <NavItemLink
          key={item.href}
          item={item}
          active={isActive(item.href)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function NavItemLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-2 py-2 text-[13px] font-medium transition-colors",
        active
          ? "text-[var(--recovery-green)] bg-[var(--recovery-light)]/50"
          : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]",
      )}
      aria-current={active ? "page" : undefined}
    >
      {/* Left border accent for active item */}
      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--recovery-green)]"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active
            ? "text-[var(--recovery-green)]"
            : "text-[var(--ink-muted)] group-hover:text-[var(--ink-secondary)]",
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

// ─── Disclosure banner ─────────────────────────────────────────

function DisclosureBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-2.5 text-[12px] text-[var(--ink-muted)]">
      <CircleCheck className="size-3.5 shrink-0 text-[var(--recovery-green)]" />
      <span>
        Interactive demo · simulated workspace — No customer data is connected. Nothing is sent.
      </span>
    </div>
  );
}

// ─── Top bar ───────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--hairline)] bg-[var(--surface)] px-4">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="touch-target -ml-1 flex size-9 items-center justify-center rounded-md text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
        )}

        <RescueLoopLogo context="workspace" compact className="shrink-0" />

        <Separator orientation="vertical" className="mx-1 h-5 bg-[var(--hairline)]" />

        <span className="hidden text-[14px] font-medium text-[var(--ink-primary)] sm:inline">
          Creator Growth Lab
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/8 font-mono text-[11px] uppercase tracking-wide text-[var(--recovery-green)]"
        >
          Growth
        </Badge>

        {/* System status indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--recovery-green)] opacity-40" />
            <span className="relative inline-flex size-full rounded-full bg-[var(--recovery-green)]" />
          </span>
          <span className="hidden text-[11px] font-medium text-[var(--ink-muted)] sm:inline">
            Healthy
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Main layout ───────────────────────────────────────────────

export default function OverviewLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Track drawer open intent alongside the pathname when it was opened.
  // When pathname changes, `mobileOpen` is automatically false because
  // the stored pathname no longer matches — no useEffect or ref needed.
  const [drawerState, setDrawerState] = useState<{ route: string; open: boolean }>({
    route: pathname,
    open: false,
  });
  const mobileOpen = drawerState.route === pathname && drawerState.open;

  const openDrawer = useCallback(
    () => setDrawerState({ route: pathname, open: true }),
    [pathname],
  );
  const closeDrawer = useCallback(
    () => setDrawerState((prev) => ({ ...prev, open: false })),
    [],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--canvas)]">
      {/* ─── Top bar ──────────────────────────────────────────── */}
      <TopBar onMenuClick={openDrawer} />

      {/* ─── Body: sidebar + main ─────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <motion.aside
          initial={{ x: -8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--surface)] pt-4 lg:flex"
        >
          <SidebarNav />
        </motion.aside>

        {/* Mobile sidebar drawer */}
        <Sheet open={mobileOpen} onOpenChange={(open) => (open ? openDrawer() : closeDrawer())}>
          <SheetContent
            side="left"
            className="w-[280px] border-r border-[var(--hairline)] bg-[var(--surface)] p-0"
          >
            <SheetHeader className="border-b border-[var(--hairline)] px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-[14px]">
                <RescueLoopLogo context="workspace" compact />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navigation menu for the demo workspace
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto pt-4">
              <SidebarNav onNavigate={closeDrawer} />
            </div>
          </SheetContent>
        </Sheet>

        {/* ─── Main content area ──────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── Sticky disclosure banner ─────────────────────── */}
          <DisclosureBanner />
        </main>
      </div>
    </div>
  );
}
