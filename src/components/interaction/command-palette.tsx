"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDemoStore } from "@/features/demo-engine/demo-store";

const NAV_COMMANDS = [
  { label: "Go to Overview", href: "/overview", icon: LayoutDashboard, keywords: "dashboard home" },
  { label: "Go to Rescue Queue", href: "/rescue-queue", icon: ListChecks, keywords: "queue triage approve" },
  { label: "Go to Students", href: "/students", icon: Users, keywords: "members directory" },
  { label: "Go to Campaigns", href: "/campaigns", icon: Megaphone, keywords: "automation messages" },
  { label: "Go to Insights", href: "/insights", icon: BarChart3, keywords: "analytics friction lessons" },
  { label: "Go to Value Ledger", href: "/value", icon: DollarSign, keywords: "revenue roi attribution" },
  { label: "Go to Settings", href: "/settings", icon: Settings, keywords: "configuration whop" },
];

export function CommandPalette() {
  const open = useDemoStore((s) => s.commandPaletteOpen);
  const setOpen = useDemoStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const automationState = useDemoStore((s) => s.automationState);
  const pauseAutomation = useDemoStore((s) => s.pauseAutomation);
  const resumeAutomation = useDemoStore((s) => s.resumeAutomation);

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

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, students, or actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV_COMMANDS.map((cmd) => (
            <CommandItem
              key={cmd.href}
              value={`${cmd.label} ${cmd.keywords}`}
              onSelect={() => go(cmd.href)}
            >
              <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
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
            onSelect={() => go("/rescue-queue")}
          >
            <ListChecks className="size-4 text-[var(--ink-secondary)]" />
            <span>Review rescue queue</span>
          </CommandItem>
          <CommandItem
            value="open unresolved creator actions notifications"
            onSelect={() => go("/overview")}
          >
            <Bell className="size-4 text-[var(--ink-secondary)]" />
            <span>Open unresolved creator actions</span>
          </CommandItem>
          <CommandItem
            value="create edit campaign"
            onSelect={() => go("/campaigns")}
          >
            <Zap className="size-4 text-[var(--ink-secondary)]" />
            <span>Create or edit campaign</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Search">
          <CommandItem
            value="search student find member"
            onSelect={() => go("/students")}
          >
            <Search className="size-4 text-[var(--ink-secondary)]" />
            <span>Search students</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
