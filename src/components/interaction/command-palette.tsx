"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Megaphone,
  BarChart3,
  DollarSign,
  Settings,
  Search,
  Pause,
  Play,
  Bell,
  Zap,
  Shield,
  type LucideIcon,
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

// ── Command registry ───────────────────────────────────────────
// Single registry for routes AND safe actions.
// Internal routes are NOT exposed to creators.
// Unavailable actions are disabled with reason text.
// Preserves company context (companyId).
// Restores trigger focus after close.
// Keyboard shortcut: Cmd+K / Ctrl+K

interface CommandEntry {
  id: string;
  label: string;
  /** The group this command belongs to. */
  group: "navigate" | "actions" | "search";
  icon: LucideIcon;
  /** Space-separated keywords for fuzzy search. */
  keywords: string;
  /** Route to navigate to (for navigation commands). */
  href?: string;
  /** Action to execute (for action commands). */
  action?: () => void;
  /** Whether this command is currently available. */
  available: boolean;
  /** Reason text shown when unavailable. */
  unavailableReason?: string;
  /** Whether this is an internal-only route (never shown to creators). */
  internal?: boolean;
  /** Keyboard shortcut label for display. */
  shortcut?: string;
}

/**
 * Command palette for RescueLoop workspace.
 *
 * ## Keyboard shortcuts
 * - **Cmd+K / Ctrl+K** — Open/close the command palette
 * - **Escape** — Close the palette (restores trigger focus)
 * - **Enter** — Execute the selected command
 * - **Arrow Up/Down** — Navigate the command list
 *
 * ## Registry rules
 * - One registry for routes AND safe actions
 * - Internal routes are never exposed to creators
 * - Unavailable actions show reason text and are disabled
 * - Company context is preserved in all navigation
 * - Trigger focus is restored after close
 */
export function CommandPalette() {
  const open = useDemoStore((s) => s.commandPaletteOpen);
  const setOpen = useDemoStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const automationState = useDemoStore((s) => s.automationState);
  const pauseAutomation = useDemoStore((s) => s.pauseAutomation);
  const resumeAutomation = useDemoStore((s) => s.resumeAutomation);

  // Ref to the element that triggered the palette, for focus restoration
  const triggerRef = useRef<HTMLElement | null>(null);

  // ── Command registry ────────────────────────────────────────
  const commands: CommandEntry[] = useMemo(
    () => [
      // Navigation commands (routes)
      {
        id: "nav-overview",
        label: "Go to Overview",
        group: "navigate",
        icon: LayoutDashboard,
        keywords: "dashboard home",
        href: "/overview",
        available: true,
        shortcut: "G O",
      },
      {
        id: "nav-queue",
        label: "Go to Rescue Queue",
        group: "navigate",
        icon: ListChecks,
        keywords: "queue triage approve",
        href: "/rescue-queue",
        available: true,
        shortcut: "G Q",
      },
      {
        id: "nav-students",
        label: "Go to Students",
        group: "navigate",
        icon: Users,
        keywords: "members directory",
        href: "/students",
        available: true,
        shortcut: "G S",
      },
      {
        id: "nav-campaigns",
        label: "Go to Campaigns",
        group: "navigate",
        icon: Megaphone,
        keywords: "automation messages",
        href: "/campaigns",
        available: true,
        shortcut: "G C",
      },
      {
        id: "nav-insights",
        label: "Go to Insights",
        group: "navigate",
        icon: BarChart3,
        keywords: "analytics friction lessons",
        href: "/insights",
        available: true,
        shortcut: "G I",
      },
      {
        id: "nav-value",
        label: "Go to Value Ledger",
        group: "navigate",
        icon: DollarSign,
        keywords: "revenue roi attribution",
        href: "/value",
        available: true,
        shortcut: "G V",
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        group: "navigate",
        icon: Settings,
        keywords: "configuration whop",
        href: "/settings",
        available: true,
        shortcut: "G P",
      },

      // Internal routes — never exposed to creators
      {
        id: "nav-internal-sync",
        label: "Internal: Sync Dashboard",
        group: "navigate",
        icon: Shield,
        keywords: "internal sync admin",
        href: "/internal/sync",
        available: false,
        internal: true,
        unavailableReason: "Internal route — not available to creators",
      },
      {
        id: "nav-internal-webhooks",
        label: "Internal: Webhook Logs",
        group: "navigate",
        icon: Shield,
        keywords: "internal webhooks admin",
        href: "/internal/webhooks",
        available: false,
        internal: true,
        unavailableReason: "Internal route — not available to creators",
      },

      // Action commands
      {
        id: "action-pause-resume",
        label:
          automationState === "paused"
            ? "Resume automation"
            : "Pause automation",
        group: "actions",
        icon: automationState === "paused" ? Play : Pause,
        keywords: "pause resume automation playbook",
        action: () => {
          if (automationState === "paused") {
            resumeAutomation();
          } else {
            pauseAutomation();
          }
        },
        available: true,
        shortcut: "P",
      },
      {
        id: "action-review-queue",
        label: "Review rescue queue",
        group: "actions",
        icon: ListChecks,
        keywords: "review rescue queue open awaiting",
        href: "/rescue-queue",
        available: true,
      },
      {
        id: "action-unresolved",
        label: "Open unresolved creator actions",
        group: "actions",
        icon: Bell,
        keywords: "open unresolved creator actions notifications",
        href: "/overview",
        available: true,
      },
      {
        id: "action-campaign",
        label: "Create or edit campaign",
        group: "actions",
        icon: Zap,
        keywords: "create edit campaign",
        href: "/campaigns",
        available: true,
      },

      // Search commands
      {
        id: "search-students",
        label: "Search students",
        group: "search",
        icon: Search,
        keywords: "search student find member",
        href: "/students",
        available: true,
        shortcut: "S",
      },
    ],
    [automationState, pauseAutomation, resumeAutomation]
  );

  // Filter out internal routes (never expose to creators)
  const visibleCommands = useMemo(
    () => commands.filter((cmd) => !cmd.internal),
    [commands]
  );

  const navigateCommands = useMemo(
    () => visibleCommands.filter((c) => c.group === "navigate"),
    [visibleCommands]
  );
  const actionCommands = useMemo(
    () => visibleCommands.filter((c) => c.group === "actions"),
    [visibleCommands]
  );
  const searchCommands = useMemo(
    () => visibleCommands.filter((c) => c.group === "search"),
    [visibleCommands]
  );

  // ── Global ⌘K / Ctrl+K listener ────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Capture the trigger element for focus restoration
        triggerRef.current = document.activeElement as HTMLElement;
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // ── Restore trigger focus on close ─────────────────────────
  useEffect(() => {
    if (!open && triggerRef.current) {
      // Restore focus to the element that triggered the palette
      triggerRef.current.focus({ preventScroll: true });
      triggerRef.current = null;
    }
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [setOpen, router]
  );

  const executeCommand = useCallback(
    (cmd: CommandEntry) => {
      if (!cmd.available) return;

      if (cmd.action) {
        cmd.action();
        setOpen(false);
      } else if (cmd.href) {
        go(cmd.href);
      }
    },
    [go, setOpen]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, students, or actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {navigateCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              value={`${cmd.label} ${cmd.keywords}`}
              onSelect={() => executeCommand(cmd)}
              disabled={!cmd.available}
              title={!cmd.available ? cmd.unavailableReason : undefined}
            >
              <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
              <span>{cmd.label}</span>
              {!cmd.available && cmd.unavailableReason && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {cmd.unavailableReason}
                </span>
              )}
              {cmd.available && cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actionCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              value={`${cmd.label} ${cmd.keywords}`}
              onSelect={() => executeCommand(cmd)}
              disabled={!cmd.available}
              title={!cmd.available ? cmd.unavailableReason : undefined}
            >
              <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
              <span>{cmd.label}</span>
              {!cmd.available && cmd.unavailableReason && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {cmd.unavailableReason}
                </span>
              )}
              {cmd.available && cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          {searchCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              value={`${cmd.label} ${cmd.keywords}`}
              onSelect={() => executeCommand(cmd)}
              disabled={!cmd.available}
              title={!cmd.available ? cmd.unavailableReason : undefined}
            >
              <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
              <span>{cmd.label}</span>
              {!cmd.available && cmd.unavailableReason && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {cmd.unavailableReason}
                </span>
              )}
              {cmd.available && cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// ── Expose the command registry for programmatic use ───────────
// Other components can register additional commands at runtime.
// This is the single source of truth for all commands.

export type { CommandEntry };
