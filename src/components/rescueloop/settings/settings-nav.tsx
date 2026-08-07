"use client";

import {
  Bell,
  CreditCard,
  Database,
  Plug,
  Settings,
  ShieldAlert,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { springLayout } from "@/design-system/motion";

export type SettingsSectionId =
  | "workspace"
  | "whop"
  | "automation"
  | "notifications"
  | "team"
  | "plan"
  | "data"
  | "danger";

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    description: "Identity, course, timezone",
    icon: Settings,
  },
  {
    id: "whop",
    label: "Whop connection",
    description: "Sync status & product mapping",
    icon: Plug,
  },
  {
    id: "automation",
    label: "Automation",
    description: "Modes, quiet hours, safety",
    icon: Zap,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "What you get alerted about",
    icon: Bell,
  },
  {
    id: "team",
    label: "Team",
    description: "Invite teammates",
    icon: Users,
  },
  {
    id: "plan",
    label: "Plan and usage",
    description: "Subscription, usage, upgrades",
    icon: CreditCard,
  },
  {
    id: "data",
    label: "Data and privacy",
    description: "Exports, retention, deletion",
    icon: Database,
  },
  {
    id: "danger",
    label: "Danger zone",
    description: "Irreversible account actions",
    icon: ShieldAlert,
  },
];

interface SettingsNavProps {
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-6 lg:self-start">
      {/* Mobile: horizontal scrollable section pills */}
      <div
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          const isDanger = section.id === "danger";
          return (
            <button
              key={section.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(section.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors",
                isActive
                  ? isDanger
                    ? "text-[var(--critical)]"
                    : "text-[var(--ink-primary)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
              )}
            >
              <Icon className="size-3.5" />
              {section.label}
              {isActive && (
                <motion.span
                  layoutId="settings-nav-underline-mobile"
                  transition={springLayout}
                  className={cn(
                    "absolute inset-x-1 bottom-0 h-[2px]",
                    isDanger ? "bg-[var(--critical)]" : "bg-[var(--recovery-green)]",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop: vertical sidebar */}
      <ul className="hidden w-[200px] flex-col gap-0.5 lg:flex">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          const isDanger = section.id === "danger";
          return (
            <li key={section.id}>
              <button
                onClick={() => onChange(section.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex w-full items-start gap-2.5 border-l-2 px-3 py-2 text-left transition-colors",
                  isActive
                    ? isDanger
                      ? "border-[var(--critical)] bg-[var(--critical-light)]/40 text-[var(--critical)]"
                      : "border-[var(--recovery-green)] bg-[var(--recovery-light)]/40 text-[var(--recovery-green)]"
                    : "border-transparent text-[var(--ink-muted)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)]",
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-[13px] font-medium leading-tight">
                    {section.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[11px] leading-snug",
                      isActive ? "opacity-80" : "text-[var(--ink-muted)]/80",
                    )}
                  >
                    {section.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
