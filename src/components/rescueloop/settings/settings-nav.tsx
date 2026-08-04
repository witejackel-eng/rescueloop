"use client";

import {
  Bell,
  CreditCard,
  Database,
  Plug,
  Settings,
  ShieldAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type SettingsSectionId =
  | "general"
  | "automation"
  | "whop"
  | "notifications"
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
    id: "general",
    label: "General",
    description: "Workspace identity and defaults",
    icon: Settings,
  },
  {
    id: "automation",
    label: "Automation",
    description: "Modes, safety controls, quiet hours",
    icon: Zap,
  },
  {
    id: "whop",
    label: "Whop connection",
    description: "Sync status and product mapping",
    icon: Plug,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "What you get alerted about",
    icon: Bell,
  },
  {
    id: "plan",
    label: "Plan & billing",
    description: "Subscription, usage, payment",
    icon: CreditCard,
  },
  {
    id: "data",
    label: "Data & privacy",
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
      {/* Mobile: horizontal scrollable tab bar */}
      <div
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(section.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-[#147D68] bg-[#E8F5EF] text-[#147D68]"
                  : "border-[#E3E5DF] bg-white text-[#6A706A] hover:bg-[#F8F8F5]",
              )}
            >
              <Icon className="size-3.5" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: vertical sidebar */}
      <ul className="hidden w-48 flex-col gap-0.5 lg:flex">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <button
                onClick={() => onChange(section.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-start gap-2.5 border-l-2 px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-[#147D68] bg-[#E8F5EF] text-[#147D68]"
                    : "border-transparent text-[#6A706A] hover:bg-[#F8F8F5] hover:text-[#171A17]",
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">
                    {section.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-xs leading-snug",
                      isActive ? "text-[#147D68]/80" : "text-[#6A706A]/80",
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
