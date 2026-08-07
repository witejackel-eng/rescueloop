"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface NavCommand {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  keywords: string;
}

// Demo workspace navigation (top-level routes)
const DEMO_NAV_COMMANDS: NavCommand[] = [
  { label: "Go to Overview", href: "/overview", icon: LayoutDashboard, keywords: "dashboard home" },
  { label: "Go to Rescue Queue", href: "/rescue-queue", icon: ListChecks, keywords: "queue triage approve" },
  { label: "Go to Students", href: "/students", icon: Users, keywords: "members directory" },
  { label: "Go to Campaigns", href: "/campaigns", icon: Activity, keywords: "automation messages" },
  { label: "Go to Insights", href: "/insights", icon: BarChart3, keywords: "analytics friction lessons" },
  { label: "Go to Value Ledger", href: "/value", icon: CreditCard, keywords: "revenue roi attribution" },
  { label: "Go to Settings", href: "/settings", icon: Settings, keywords: "configuration whop" },
];

// Company-scoped dashboard navigation (relative to basePath)
const COMPANY_NAV_ITEMS: NavCommand[] = [
  { label: "Overview", href: "", icon: LayoutDashboard, keywords: "dashboard home" },
  { label: "Rescue Queue", href: "/rescue-queue", icon: ListChecks, keywords: "queue triage approve" },
  { label: "Members", href: "/students", icon: Users, keywords: "students directory" },
  { label: "Playbooks", href: "/playbooks", icon: BookOpen, keywords: "automation rules criteria" },
  { label: "Responses", href: "/responses", icon: MessageSquare, keywords: "student replies messages" },
  { label: "Outcomes", href: "/outcomes", icon: BarChart3, keywords: "results revenue attribution" },
  { label: "Insights", href: "/insights", icon: Lightbulb, keywords: "analytics friction lessons" },
  { label: "Activity", href: "/activity", icon: Activity, keywords: "feed timeline events" },
  { label: "System Health", href: "/settings/health", icon: Heart, keywords: "status providers diagnostics" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "configuration whop" },
  { label: "Plan & Usage", href: "/usage", icon: CreditCard, keywords: "billing plan limits" },
  { label: "Help & Diagnostics", href: "/help/diagnostics", icon: HelpCircle, keywords: "support troubleshoot" },
];

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

  const navCommands = basePath ? COMPANY_NAV_ITEMS : DEMO_NAV_COMMANDS;
  const queueHref = basePath ? `${basePath}/rescue-queue` : "/rescue-queue";
  const actionsHomeHref = basePath ? `${basePath}` : "/overview";
  const studentsHref = basePath ? `${basePath}/students` : "/students";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, students, or actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {navCommands.map((cmd) => {
            const target = basePath ? `${basePath}${cmd.href}` : cmd.href;
            return (
              <CommandItem
                key={cmd.label}
                value={`${cmd.label} ${cmd.keywords}`}
                onSelect={() => go(target)}
              >
                <cmd.icon className="size-4 text-[var(--ink-secondary)]" />
                <span>{cmd.label}</span>
              </CommandItem>
            );
          })}
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
            onSelect={() => go(queueHref)}
          >
            <ListChecks className="size-4 text-[var(--ink-secondary)]" />
            <span>Review rescue queue</span>
          </CommandItem>
          <CommandItem
            value="open unresolved creator actions notifications"
            onSelect={() => go(actionsHomeHref)}
          >
            <Bell className="size-4 text-[var(--ink-secondary)]" />
            <span>Open unresolved creator actions</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Search">
          <CommandItem
            value="search student find member"
            onSelect={() => go(studentsHref)}
          >
            <Search className="size-4 text-[var(--ink-secondary)]" />
            <span>Search students</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
