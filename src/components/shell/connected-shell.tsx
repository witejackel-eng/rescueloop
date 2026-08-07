"use client";

// ConnectedShell — the company-scoped shell for /dashboard/[companyId]/* routes.
//
// This shell is SEPARATE from the demo WorkspaceShell. It never links to
// demo routes (/overview, /rescue-queue, etc.). Every nav href includes
// the companyId so creators stay inside their dashboard scope.
//
// Visual language is the warm cream design system, but the shell is
// visually distinct from the demo workspace:
//   - Wider desktop nav rail (76px) with section dividers
//   - Environment badge (FIXTURE / CONNECTED / NOT CONFIGURED)
//   - Installation-state dot next to the company name
//   - "Last sync" timestamp with relative time
//   - Emergency pause button (calls /api/companies/[id]/settings/pause)
//   - User menu placeholder (no auth wired here — server-side handles it)
//
// All numbers in font-mono tabular-nums.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Play,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  type LucideIcon,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { RescueLoopMark } from "@/components/brand/logo";
import {
  CONNECTED_NAV_ITEMS,
  MOBILE_PRIMARY_ITEMS,
  MOBILE_MORE_ITEMS,
  buildDashboardHref,
  getActiveConnectedNavKey,
  ENVIRONMENT_BADGE,
  ENVIRONMENT_LABEL,
  type ConnectedEnvironment,
  type InstallationState,
} from "@/components/shell/connected-nav";
import { ShellInteractionWrapper } from "@/components/shell/shell-core";
import { useReducedMotionContract } from "@/hooks/use-reduced-motion-contract";
import { ConnectedCommandPalette } from "@/components/interaction/connected-command-palette";
import { Search } from "lucide-react";

export interface ConnectedShellProps {
  /** Company ID used in every nav href. In fixture mode this is FIXTURE_COMPANY_ID. */
  companyId: string;
  /** Display name for the company (from the Organization row). */
  companyName?: string;
  /** Environment badge mode. */
  environment: ConnectedEnvironment;
  /** Whether the Whop installation is active / missing / unknown. */
  installationState: InstallationState;
  /** ISO timestamp of the last successful sync (webhook receipt). null if never. */
  lastSyncAt: string | null;
  /** Whether the org is currently paused (no interventions send). */
  isPaused: boolean;
  children: React.ReactNode;
}

export function ConnectedShell({
  companyId,
  companyName,
  environment,
  installationState,
  lastSyncAt,
  isPaused: initialPaused,
  children,
}: ConnectedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [paused, setPaused] = useState(initialPaused);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const activeKey = getActiveConnectedNavKey(pathname, companyId);
  const envBadge = ENVIRONMENT_BADGE[environment];
  const envLabel = ENVIRONMENT_LABEL[environment];
  const motionContract = useReducedMotionContract();

  async function togglePause(nextPaused: boolean) {
    setPauseBusy(true);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/settings/pause`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            paused: nextPaused,
            reason: nextPaused ? "admin_paused_shell" : "admin_resumed_shell",
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Failed to update pause state.");
        return;
      }
      setPaused(nextPaused);
      toast.success(
        nextPaused
          ? "Automation paused — no interventions will send."
          : "Automation resumed.",
      );
      setPauseDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPauseBusy(false);
    }
  }

  return (
    <ShellInteractionWrapper>
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* ─── Desktop vertical nav rail ─────────────────────────── */}
      <aside className="hidden w-[76px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] md:flex">
        <div className="flex h-14 items-center justify-center border-b border-[var(--hairline)]">
          <Link
            href={buildDashboardHref(companyId, "")}
            aria-label="RescueLoop — dashboard"
          >
            <RescueLoopMark size={26} />
          </Link>
        </div>

        {/* Environment badge in the rail (vertical text) */}
        <div className="flex justify-center border-b border-[var(--hairline)] py-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide",
              envBadge.bgClass,
              envBadge.textClass,
            )}
            title={envLabel}
          >
            <span className={cn("size-1 rounded-full", envBadge.dotClass)} />
            {envBadge.label}
          </span>
        </div>

        <nav
          className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3"
          aria-label="Company navigation"
        >
          <TooltipProvider delayDuration={150}>
            {CONNECTED_NAV_ITEMS.map((item) => (
              <NavRailItem
                key={item.key}
                item={item}
                companyId={companyId}
                active={activeKey === item.key}
              />
            ))}
          </TooltipProvider>
        </nav>

        {/* Footer: installation state + settings shortcut */}
        <div className="flex flex-col items-center gap-1 border-t border-[var(--hairline)] py-3">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1 font-mono text-[10px] text-[var(--ink-muted)]"
                  aria-label={`Installation: ${installationState}`}
                >
                  <InstallationDot state={installationState} />
                  <span className="hidden lg:inline">
                    {installationState === "active"
                      ? "installed"
                      : installationState === "missing"
                        ? "no install"
                        : "unknown"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {installationState === "active"
                  ? "Whop installation active"
                  : installationState === "missing"
                    ? "Whop installation missing"
                    : "Installation state unknown"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* ─── Main content area ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top command bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 lg:px-6">
          {/* Mobile logo */}
          <Link
            href={buildDashboardHref(companyId, "")}
            className="flex items-center gap-2 md:hidden"
            aria-label="RescueLoop"
          >
            <RescueLoopMark size={22} />
          </Link>

          {/* Company selector (read-only) */}
          <button
            type="button"
            className="hidden items-center gap-2 text-[13px] font-medium text-[var(--ink-primary)] md:flex"
            aria-label={`Company: ${companyName ?? companyId}`}
            title="Company context (read-only)"
          >
            {/* Environment pill (compact) */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
                envBadge.bgClass,
                envBadge.textClass,
              )}
            >
              <span className={cn("size-1 rounded-full", envBadge.dotClass)} />
              {envBadge.label}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <InstallationDot state={installationState} />
              <span className="max-w-[180px] truncate">
                {companyName ?? "Connected company"}
              </span>
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              ·
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {companyId}
            </span>
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
                ⌘K
              </kbd>
            </button>

            {/* Last sync timestamp */}
            <div
              className="hidden items-center gap-1.5 lg:flex"
              title={
                lastSyncAt
                  ? `Last sync: ${new Date(lastSyncAt).toLocaleString()}`
                  : "No sync yet"
              }
            >
              <RefreshCw className="size-3.5 text-[var(--ink-muted)]" />
              <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                {lastSyncAt
                  ? `sync ${formatRelativeShort(lastSyncAt)}`
                  : "never synced"}
              </span>
            </div>

            {/* Sync status — installation/connected indicator */}
            <SyncStatusPill
              installationState={installationState}
              environment={environment}
            />

            {/* Pause / Resume */}
            {paused ? (
              <Button
                onClick={() => togglePause(false)}
                disabled={pauseBusy}
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-[8px] bg-[var(--recovery-green)] px-3 text-[12px] font-medium text-white hover:bg-[var(--recovery-green)]/90"
                aria-label="Resume automation"
              >
                {pauseBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                <span className="hidden sm:inline">Resume</span>
              </Button>
            ) : (
              <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 rounded-[8px] px-3 text-[12px] font-medium text-[var(--critical)] hover:bg-[var(--critical-light)]/40"
                    aria-label="Pause automation"
                  >
                    <Pause className="size-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Pause all automation?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      No new interventions will be sent while paused. Existing
                      scheduled sends will be stopped at the delivery safety
                      check. You can resume at any time from the shell.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pauseBusy}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={pauseBusy}
                      onClick={async (e) => {
                        e.preventDefault();
                        await togglePause(true);
                      }}
                      className="bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                    >
                      {pauseBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Pause className="size-4" />
                      )}
                      Pause automation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* User menu (placeholder) */}
            <UserMenu companyId={companyId} />
          </div>
        </header>

        {/* Paused banner — reduced-motion-aware */}
        <AnimatePresence>
          {paused && (
            <motion.div
              {...motionContract.motionProps({
                hidden: { height: 0, opacity: 0 },
                visible: { height: "auto", opacity: 1 },
                exit: { height: 0, opacity: 0 },
              })}
              className="overflow-hidden border-b border-[var(--critical-light)] bg-[var(--critical-light)]/40"
            >
              <p className="px-4 py-1.5 text-center text-[12px] font-medium text-[var(--critical)]">
                Automation paused — no interventions will be sent until you resume.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Environment banner (unconfigured / fixture) */}
        <AnimatePresence>
          {environment !== "whop" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "overflow-hidden border-b",
                environment === "fixture"
                  ? "border-[var(--warning-light)] bg-[var(--warning-light)]/40"
                  : "border-[var(--critical-light)] bg-[var(--critical-light)]/40",
              )}
            >
              <p
                className={cn(
                  "px-4 py-1.5 text-center text-[12px] font-medium",
                  environment === "fixture"
                    ? "text-[var(--warning)]"
                    : "text-[var(--critical)]",
                )}
              >
                {environment === "fixture"
                  ? "Fixture environment — local deterministic data, no live Whop calls."
                  : "Whop integration not configured — set WHOP_API_KEY, WHOP_WEBHOOK_SECRET, and NEXT_PUBLIC_WHOP_APP_ID."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0" id="main-content" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[1320px] px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>

      {/* ─── Mobile bottom tab bar ────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile company navigation"
      >
        {MOBILE_PRIMARY_ITEMS.map((item) => {
          const active = activeKey === item.key;
          return (
            <Link
              key={item.key}
              href={buildDashboardHref(companyId, item.segment)}
              className="relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2"
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              {active && (
                <motion.span
                  layoutId="mobile-connected-nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="absolute top-0 h-[2px] w-8 bg-[var(--recovery-green)]"
                />
              )}
              <item.icon
                className={cn(
                  "size-5",
                  active
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-muted)]",
                )}
              />
              <span
                className={cn(
                  "text-[10px]",
                  active
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-muted)]",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreSheetOpen(true)}
          className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2"
          aria-label="More navigation"
        >
          <MoreHorizontal className="size-5 text-[var(--ink-muted)]" />
          <span className="text-[10px] text-[var(--ink-muted)]">More</span>
        </button>
      </nav>

      {/* ─── Mobile "More" sheet ──────────────────────────────── */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[20px] p-0">
          <SheetHeader className="border-b border-[var(--hairline)] px-5 pt-5">
            <SheetTitle className="flex items-center justify-between font-serif text-xl">
              <span>More</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
                  envBadge.bgClass,
                  envBadge.textClass,
                )}
              >
                <span className={cn("size-1 rounded-full", envBadge.dotClass)} />
                {envBadge.label}
              </span>
            </SheetTitle>
          </SheetHeader>
          <nav
            className="flex flex-col p-3"
            aria-label="More company navigation"
          >
            {MOBILE_MORE_ITEMS.map((item) => {
              const active = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={buildDashboardHref(companyId, item.segment)}
                  onClick={() => setMoreSheetOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-[8px] px-3 py-3 text-[15px]",
                    active
                      ? "bg-[var(--canvas-elevated)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)]",
                  )}
                >
                  <item.icon className="size-5" />
                  <span className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-[11px] text-[var(--ink-muted)]">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Company-scoped command palette */}
      <ConnectedCommandPalette
        companyId={companyId}
        isPaused={paused}
        onTogglePause={() => togglePause(!paused)}
      />
    </div>
    </ShellInteractionWrapper>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

interface NavRailItemProps {
  item: {
    key: string;
    label: string;
    icon: LucideIcon;
    segment: string;
    description: string;
  };
  companyId: string;
  active: boolean;
}

function NavRailItem({ item, companyId, active }: NavRailItemProps) {
  const href = buildDashboardHref(companyId, item.segment);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className="relative flex size-10 items-center justify-center press"
          aria-current={active ? "page" : undefined}
          aria-label={item.label}
        >
          {active && (
            <motion.span
              layoutId="connected-nav-active-bg"
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
              layoutId="connected-nav-active-bar"
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="absolute -left-[16px] top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[var(--recovery-green)]"
            />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="flex flex-col">
          <span className="font-medium">{item.label}</span>
          <span className="text-[11px] opacity-80">{item.description}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function InstallationDot({ state }: { state: InstallationState }) {
  if (state === "active") {
    return (
      <CheckCircle2 className="size-3 text-[var(--recovery-green)]" aria-hidden />
    );
  }
  if (state === "missing") {
    return (
      <AlertTriangle className="size-3 text-[var(--warning)]" aria-hidden />
    );
  }
  return (
    <ShieldAlert
      className="size-3 text-[var(--ink-muted)]"
      aria-hidden
    />
  );
}

function SyncStatusPill({
  installationState,
  environment,
}: {
  installationState: InstallationState;
  environment: ConnectedEnvironment;
}) {
  let label: string;
  let dotClass: string;
  let textClass: string;

  if (environment === "unconfigured") {
    label = "Not configured";
    dotClass = "bg-[var(--critical)]";
    textClass = "text-[var(--critical)]";
  } else if (installationState === "active") {
    label = environment === "fixture" ? "Fixture" : "Connected";
    dotClass = environment === "fixture" ? "bg-[var(--warning)]" : "bg-[var(--recovery-green)]";
    textClass = environment === "fixture" ? "text-[var(--warning)]" : "text-[var(--recovery-green)]";
  } else if (installationState === "missing") {
    label = "Install missing";
    dotClass = "bg-[var(--warning)]";
    textClass = "text-[var(--warning)]";
  } else {
    label = "Sync unknown";
    dotClass = "bg-[var(--ink-muted)]";
    textClass = "text-[var(--ink-secondary)]";
  }

  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-2 py-1 sm:flex",
        textClass,
      )}
      title={`Sync status: ${label}`}
    >
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

function UserMenu({ companyId }: { companyId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-[8px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
          aria-label="User menu"
        >
          <UserIcon className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-[var(--ink-primary)]">
            Creator account
          </span>
          <span className="font-mono text-[11px] text-[var(--ink-muted)]">
            {companyId}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-[13px]"
          onClick={() => {
            toast.info("Profile is not wired in the pilot.");
          }}
        >
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-[13px]"
          onClick={() => {
            window.location.href = buildDashboardHref(companyId, "settings");
          }}
        >
          <SettingsIcon className="size-4" />
          Organisation settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-[13px] text-[var(--critical)]"
          onClick={() => {
            toast.info("Sign-out is handled by Whop — close the embedded frame.");
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatRelativeShort(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
