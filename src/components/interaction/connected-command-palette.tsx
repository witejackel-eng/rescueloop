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
import { useState } from "react";
import { buildDashboardHref, CONNECTED_NAV_ITEMS } from "@/components/shell/connected-nav";

// ── Command registry for connected company context ────────────
// Same pattern as the demo CommandPalette but all routes are
// company-scoped via buildDashboardHref(companyId, segment).
// Never exposes demo routes (/overview, /rescue-queue, etc.)
// without the companyId prefix.

interface CommandEntry {
  id: string;
  label: string;
  group: "navigate" | "actions";
  icon: LucideIcon;
  keywords: string;
  href?: string;
  action?: () => void;
  available: boolean;
  shortcut?: string;
}

interface ConnectedCommandPaletteProps {
  companyId: string;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function ConnectedCommandPalette({
  companyId,
  isPaused,
  onTogglePause,
}: ConnectedCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const triggerRef = useRef<HTMLElement | null>(null);

  const commands: CommandEntry[] = useMemo(
    () => [
      // Navigation commands — company-scoped
      ...CONNECTED_NAV_ITEMS.map((item) => ({
        id: `nav-${item.key}`,
        label: `Go to ${item.label}`,
        group: "navigate" as const,
        icon: item.icon,
        keywords: `${item.label} ${item.description}`,
        href: buildDashboardHref(companyId, item.segment),
        available: true,
      })),

      // Action commands
      {
        id: "action-pause-resume",
        label: isPaused ? "Resume automation" : "Pause automation",
        group: "actions",
        icon: isPaused ? Play : Pause,
        keywords: "pause resume automation",
        action: onTogglePause,
        available: true,
        shortcut: "P",
      },
      {
        id: "action-review-queue",
        label: "Review rescue queue",
        group: "actions",
        icon: ListChecks,
        keywords: "review rescue queue open awaiting",
        href: buildDashboardHref(companyId, "rescue-queue"),
        available: true,
      },
    ],
    [companyId, isPaused, onTogglePause],
  );

  const navigateCommands = useMemo(
    () => commands.filter((c) => c.group === "navigate"),
    [commands],
  );
  const actionCommands = useMemo(
    () => commands.filter((c) => c.group === "actions"),
    [commands],
  );

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        triggerRef.current = document.activeElement as HTMLElement;
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Restore trigger focus on close
  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true });
      triggerRef.current = null;
    }
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
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
    [go],
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
            >
              <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
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
            >
              <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
