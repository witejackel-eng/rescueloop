"use client";

import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  Search,
  Pause,
  Play,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  RefreshCw,
  Rocket,
  Keyboard,
  Clock,
  Zap,
  Wrench,
  File,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import {
  useRecentItems,
  serializeIcon,
  type RecentItem,
} from "@/hooks/use-recent-items";

// ── Types ──────────────────────────────────────────────────────

interface NavCommand {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  keywords: string;
  shortcut?: string;
}

// ── Icon name → component map ──────────────────────────────────
// Used to reconstruct icon components from serialized recent-item data.

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
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
  Search,
  Pause,
  Play,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  RefreshCw,
  Rocket,
  Keyboard,
  Clock,
  Zap,
  Wrench,
  File,
};

function iconFromName(name: string): typeof LayoutDashboard {
  return ICON_MAP[name] ?? File;
}

// ── Demo workspace navigation (top-level routes) ───────────────

const DEMO_NAV_COMMANDS: NavCommand[] = [
  { label: "Go to Overview", href: "/overview", icon: LayoutDashboard, keywords: "dashboard home" },
  { label: "Go to Rescue Queue", href: "/rescue-queue", icon: ListChecks, keywords: "queue triage approve" },
  { label: "Go to Students", href: "/students", icon: Users, keywords: "members directory" },
  { label: "Go to Campaigns", href: "/campaigns", icon: Activity, keywords: "automation messages" },
  { label: "Go to Insights", href: "/insights", icon: BarChart3, keywords: "analytics friction lessons" },
  { label: "Go to Value Ledger", href: "/value", icon: CreditCard, keywords: "revenue roi attribution" },
  { label: "Go to Settings", href: "/settings", icon: Settings, keywords: "configuration whop" },
];

// ── Company-scoped dashboard navigation (relative to basePath) ──

const COMPANY_NAV_ITEMS: NavCommand[] = [
  { label: "Overview", href: "", icon: LayoutDashboard, keywords: "dashboard home" },
  { label: "Rescue Queue", href: "/rescue-queue", icon: ListChecks, keywords: "queue triage approve", shortcut: "⌘1" },
  { label: "Members", href: "/students", icon: Users, keywords: "students directory", shortcut: "⌘2" },
  { label: "Playbooks", href: "/playbooks", icon: BookOpen, keywords: "automation rules criteria" },
  { label: "Responses", href: "/responses", icon: MessageSquare, keywords: "student replies messages" },
  { label: "Outcomes", href: "/outcomes", icon: BarChart3, keywords: "results revenue attribution" },
  { label: "Insights", href: "/insights", icon: Lightbulb, keywords: "analytics friction lessons", shortcut: "⌘3" },
  { label: "Activity", href: "/activity", icon: Activity, keywords: "feed timeline events" },
  { label: "System Health", href: "/settings/health", icon: Heart, keywords: "status providers diagnostics" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "configuration whop", shortcut: "⌘," },
  { label: "Plan & Usage", href: "/usage", icon: CreditCard, keywords: "billing plan limits" },
  { label: "Help & Diagnostics", href: "/help/diagnostics", icon: HelpCircle, keywords: "support troubleshoot" },
];

// ── Search highlighting ────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);

  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-foreground">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Component ──────────────────────────────────────────────────

interface CommandPaletteProps {
  /**
   * When provided, navigations are scoped to this base path
   * (e.g. "/dashboard/co_cgl"). When omitted, falls back to demo
   * workspace routes (/overview, /rescue-queue, …).
   */
  basePath?: string;
}

export function CommandPalette({ basePath }: CommandPaletteProps) {
  const open = useDemoStore((s) => s.commandPaletteOpen);
  const setOpen = useDemoStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const automationState = useDemoStore((s) => s.automationState);
  const pauseAutomation = useDemoStore((s) => s.pauseAutomation);
  const resumeAutomation = useDemoStore((s) => s.resumeAutomation);
  const markAllNotificationsRead = useDemoStore((s) => s.markAllNotificationsRead);
  const { recentItems, addItem } = useRecentItems();

  // Track search query for highlighting
  const [searchQuery, setSearchQuery] = useState("");

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // ── Navigation helpers ─────────────────────────────────────

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  /** Navigate and record the visit as a recent item */
  function goAndRecord(label: string, href: string, icon: typeof LayoutDashboard) {
    addItem({
      id: href,
      label,
      href,
      icon: serializeIcon(icon),
    });
    go(href);
  }

  // ── Derived values ─────────────────────────────────────────

  const navCommands = basePath ? COMPANY_NAV_ITEMS : DEMO_NAV_COMMANDS;
  const queueHref = basePath ? `${basePath}/rescue-queue` : "/rescue-queue";
  const actionsHomeHref = basePath ? `${basePath}` : "/overview";
  const studentsHref = basePath ? `${basePath}/students` : "/students";
  const onboardingHref = basePath ? `${basePath}/onboarding` : "/onboarding";

  // Recent items: reconstruct icon components
  const recentWithIcons = useMemo(
    () =>
      recentItems.map((item) => ({
        ...item,
        Icon: iconFromName(item.icon),
      })),
    [recentItems],
  );

  // ── Quick action: refresh data ─────────────────────────────

  const handleRefreshData = useCallback(() => {
    setOpen(false);
    // Force a full page reload to refetch all server data
    window.location.reload();
  }, [setOpen]);

  // ── Quick action: toggle dark mode ─────────────────────────

  const handleToggleDarkMode = useCallback(() => {
    setOpen(false);
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setOpen, theme, setTheme]);

  // ── Quick action: mark all notifications read ──────────────

  const handleMarkAllRead = useCallback(() => {
    setOpen(false);
    markAllNotificationsRead();
  }, [setOpen, markAllNotificationsRead]);

  // ── Quick action: open onboarding ──────────────────────────

  function handleOpenOnboarding() {
    go(onboardingHref);
  }

  // ── Quick action: open keyboard shortcuts ──────────────────

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  function handleOpenShortcuts() {
    setOpen(false);
    setShortcutsOpen(true);
  }

  // ── Theme icon ─────────────────────────────────────────────

  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search pages, students, or actions…"
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* ── Recent Items ──────────────────────────────────── */}
          {recentWithIcons.length > 0 && (
            <CommandGroup heading="Recent">
              {recentWithIcons.map((item) => (
                <CommandItem
                  key={`recent-${item.id}`}
                  value={`recent ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  <item.Icon className="size-4 text-[var(--ink-secondary)]" />
                  <HighlightMatch text={item.label} query={searchQuery} />
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    <Clock className="inline size-3 mr-0.5 -mt-0.5" />
                    {timeAgo(item.timestamp)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {recentWithIcons.length > 0 && <CommandSeparator />}

          {/* ── Navigate ──────────────────────────────────────── */}
          <CommandGroup heading="Navigate">
            {navCommands.map((cmd) => {
              const target = basePath ? `${basePath}${cmd.href}` : cmd.href;
              return (
                <CommandItem
                  key={cmd.label}
                  value={`${cmd.label} ${cmd.keywords}`}
                  onSelect={() => goAndRecord(cmd.label, target, cmd.icon)}
                >
                  <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
                  <HighlightMatch text={cmd.label} query={searchQuery} />
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />

          {/* ── Quick Actions ─────────────────────────────────── */}
          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="toggle dark mode light theme appearance"
              onSelect={handleToggleDarkMode}
            >
              <ThemeIcon className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text={themeLabel} query={searchQuery} />
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="mark all notifications read clear"
              onSelect={handleMarkAllRead}
            >
              <CheckCircle2 className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Mark all notifications read" query={searchQuery} />
            </CommandItem>
            <CommandItem
              value="refresh data reload refetch"
              onSelect={handleRefreshData}
            >
              <RefreshCw className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Refresh data" query={searchQuery} />
              <CommandShortcut>⌘R</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="pause resume automation"
              onSelect={() => {
                if (automationState === "paused") {
                  resumeAutomation();
                } else {
                  pauseAutomation();
                }
                setOpen(false);
              }}
            >
              {automationState === "paused" ? (
                <Play className="size-4 text-[var(--ink-secondary)]" />
              ) : (
                <Pause className="size-4 text-[var(--ink-secondary)]" />
              )}
              <span>
                {automationState === "paused" ? "Resume automation" : "Pause automation"}
              </span>
            </CommandItem>
            <CommandItem
              value="review rescue queue open awaiting"
              onSelect={() => goAndRecord("Rescue Queue", queueHref, ListChecks)}
            >
              <ListChecks className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Review rescue queue" query={searchQuery} />
            </CommandItem>
            <CommandItem
              value="open unresolved creator actions notifications"
              onSelect={() => go(actionsHomeHref)}
            >
              <Bell className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Open unresolved creator actions" query={searchQuery} />
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />

          {/* ── Settings ──────────────────────────────────────── */}
          <CommandGroup heading="Settings">
            <CommandItem
              value="open onboarding wizard setup"
              onSelect={handleOpenOnboarding}
            >
              <Rocket className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Open onboarding wizard" query={searchQuery} />
            </CommandItem>
            <CommandItem
              value="open keyboard shortcuts help"
              onSelect={handleOpenShortcuts}
            >
              <Keyboard className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Open keyboard shortcuts" query={searchQuery} />
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />

          {/* ── Search ────────────────────────────────────────── */}
          <CommandGroup heading="Search">
            <CommandItem
              value="search student find member"
              onSelect={() => go(studentsHref)}
            >
              <Search className="size-4 text-[var(--ink-secondary)]" />
              <HighlightMatch text="Search students" query={searchQuery} />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* ── Keyboard Shortcuts Dialog ────────────────────────── */}
      <CommandDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        title="Keyboard Shortcuts"
        description="Available keyboard shortcuts"
      >
        <CommandList>
          <CommandEmpty>No shortcuts found.</CommandEmpty>
          <CommandGroup heading="General">
            <CommandItem value="command palette" onSelect={() => setShortcutsOpen(false)}>
              <Zap className="size-4 text-[var(--ink-secondary)]" />
              <span>Open command palette</span>
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
            <CommandItem value="dark mode toggle" onSelect={() => setShortcutsOpen(false)}>
              <Moon className="size-4 text-[var(--ink-secondary)]" />
              <span>Toggle dark mode</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem value="refresh data" onSelect={() => setShortcutsOpen(false)}>
              <RefreshCw className="size-4 text-[var(--ink-secondary)]" />
              <span>Refresh data</span>
              <CommandShortcut>⌘R</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          {basePath && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                <CommandItem value="rescue queue shortcut" onSelect={() => setShortcutsOpen(false)}>
                  <ListChecks className="size-4 text-[var(--ink-secondary)]" />
                  <span>Go to Rescue Queue</span>
                  <CommandShortcut>⌘1</CommandShortcut>
                </CommandItem>
                <CommandItem value="members shortcut" onSelect={() => setShortcutsOpen(false)}>
                  <Users className="size-4 text-[var(--ink-secondary)]" />
                  <span>Go to Members</span>
                  <CommandShortcut>⌘2</CommandShortcut>
                </CommandItem>
                <CommandItem value="insights shortcut" onSelect={() => setShortcutsOpen(false)}>
                  <Lightbulb className="size-4 text-[var(--ink-secondary)]" />
                  <span>Go to Insights</span>
                  <CommandShortcut>⌘3</CommandShortcut>
                </CommandItem>
                <CommandItem value="settings shortcut" onSelect={() => setShortcutsOpen(false)}>
                  <Settings className="size-4 text-[var(--ink-secondary)]" />
                  <span>Go to Settings</span>
                  <CommandShortcut>⌘,</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="shortcuts dialog" onSelect={() => setShortcutsOpen(false)}>
              <Keyboard className="size-4 text-[var(--ink-secondary)]" />
              <span>Show keyboard shortcuts</span>
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// ── Utility ────────────────────────────────────────────────────

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
