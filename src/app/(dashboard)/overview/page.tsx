"use client";

import { useState } from "react";
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
  CreditCard,
  Menu,
  X,
  Shield,
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
import { DemoOverviewSection } from "@/components/demo/demo-overview";
import { DemoRescueQueueSection } from "@/components/demo/demo-rescue-queue";
import { DemoMembersSection } from "@/components/demo/demo-members";
import { DemoPlaybooksSection } from "@/components/demo/demo-playbooks";
import { DemoResponsesSection } from "@/components/demo/demo-responses";
import { DemoOutcomesSection } from "@/components/demo/demo-outcomes";
import { DemoInsightsSection } from "@/components/demo/demo-insights";
import { DemoActivitySection } from "@/components/demo/demo-activity";
import { DemoSystemHealthSection } from "@/components/demo/demo-system-health";
import { DemoPlanUsageSection } from "@/components/demo/demo-plan-usage";

// ── Tab definitions ────────────────────────────────────────────
type TabId = "overview" | "queue" | "members" | "playbooks" | "responses" | "outcomes" | "insights" | "activity" | "health" | "plan";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: React.ComponentType;
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, section: DemoOverviewSection },
  { id: "queue", label: "Rescue Queue", icon: ListChecks, section: DemoRescueQueueSection },
  { id: "members", label: "Members", icon: Users, section: DemoMembersSection },
  { id: "playbooks", label: "Playbooks", icon: BookOpen, section: DemoPlaybooksSection },
  { id: "responses", label: "Responses", icon: MessageSquare, section: DemoResponsesSection },
  { id: "outcomes", label: "Outcomes", icon: BarChart3, section: DemoOutcomesSection },
  { id: "insights", label: "Insights", icon: Lightbulb, section: DemoInsightsSection },
  { id: "activity", label: "Activity", icon: Activity, section: DemoActivitySection },
  { id: "health", label: "System Health", icon: Heart, section: DemoSystemHealthSection },
  { id: "plan", label: "Plan & Usage", icon: CreditCard, section: DemoPlanUsageSection },
];

// ── Main Page ──────────────────────────────────────────────────
export default function DemoWorkspacePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const SectionComponent = currentTab.section;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] lg:flex">
        {/* Logo + Demo badge */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[var(--hairline)] px-4">
          <RescueLoopMark size={22} />
          <span className="font-serif text-[15px] text-[var(--ink-primary)]">RescueLoop</span>
          <Badge className="ml-auto rounded-[3px] border border-[var(--warning)]/30 bg-[var(--warning-light)] px-1.5 py-0 text-[9px] font-semibold uppercase text-[var(--warning)]">
            Demo
          </Badge>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Demo workspace navigation">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors",
                  active
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas)]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                    className="absolute inset-0 rounded-[4px] bg-[var(--surface)] shadow-[0_0_0_1px_var(--hairline)]"
                  />
                )}
                {active && (
                  <span className="absolute -left-px top-1/2 h-4 w-[2px] -translate-y-1/2 bg-[var(--recovery-green)]" />
                )}
                <Icon className="relative z-10 size-4 shrink-0" />
                <span className="relative z-10 text-[13px]">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer disclosure */}
        <div className="border-t border-[var(--hairline)] px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)]">
            <Shield className="size-3" />
            <span className="font-medium uppercase tracking-[0.08em]">Demo</span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-[var(--ink-muted)]">
            No customer data connected. Nothing is sent.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 lg:px-5">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden size-9 rounded-[8px] text-[var(--ink-secondary)]"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <RescueLoopMark size={18} />
            <Badge className="rounded-[3px] border border-[var(--warning)]/30 bg-[var(--warning-light)] px-1.5 py-0 text-[8px] font-semibold uppercase text-[var(--warning)]">
              Demo
            </Badge>
          </div>

          {/* Breadcrumb / section title */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--ink-primary)]">{currentTab.label}</span>
            <span className="text-[var(--ink-muted)]">·</span>
            <span className="text-[12px] text-[var(--ink-muted)]">Creator Growth Lab</span>
          </div>

          {/* Disclosure — always visible */}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--warning)]/20 bg-[var(--warning-light)]/60 px-2.5 py-1 text-[10px] font-medium text-[var(--warning)]">
              <Shield className="size-3" />
              Interactive demo · simulated workspace
            </span>
            <span className="sm:hidden inline-flex items-center gap-1 rounded-[4px] border border-[var(--warning)]/20 bg-[var(--warning-light)]/60 px-2 py-1 text-[9px] font-medium text-[var(--warning)]">
              <Shield className="size-2.5" />
              Demo
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Mobile section header */}
          <div className="lg:hidden border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-3">
            <h1 className="font-serif text-[20px] text-[var(--ink-primary)]">{currentTab.label}</h1>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Interactive demo · No customer data is connected
            </p>
          </div>

          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <SectionComponent />
              </motion.div>
            </AnimatePresence>

            {/* Bottom disclosure */}
            <div className="mt-8 border-t border-[var(--hairline)] pt-4">
              <p className="text-center text-[11px] text-[var(--ink-muted)]">
                Interactive demo · simulated workspace · No customer data is connected. Nothing is sent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] border-r border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0">
          <SheetHeader className="border-b border-[var(--hairline)] px-4 py-4">
            <div className="flex items-center gap-2.5">
              <RescueLoopMark size={22} />
              <SheetTitle className="font-serif text-[16px] text-[var(--ink-primary)]">RescueLoop</SheetTitle>
              <Badge className="ml-auto rounded-[3px] border border-[var(--warning)]/30 bg-[var(--warning-light)] px-1.5 py-0 text-[9px] font-semibold uppercase text-[var(--warning)]">
                Demo
              </Badge>
            </div>
          </SheetHeader>
          <nav className="flex flex-col py-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-left transition-colors",
                    active
                      ? "bg-[var(--surface)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[14px]">{tab.label}</span>
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-[var(--recovery-green)]" />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-[var(--hairline)] px-5 py-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)]">
              <Shield className="size-3" />
              <span className="font-medium uppercase tracking-[0.08em]">Demo</span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-[var(--ink-muted)]">
              No customer data connected. Nothing is sent.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile bottom tab bar — shows primary tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {TABS.slice(0, 4).map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="mobile-demo-nav"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="absolute top-0 h-[2px] w-8 bg-[var(--recovery-green)]"
                />
              )}
              <Icon className={cn("size-4", active ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]")} />
              <span className={cn("text-[9px]", active ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]")}>
                {tab.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
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
