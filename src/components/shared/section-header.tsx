"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * SectionHeader — consistent section/page header with optional icon,
 * description, badge, and action button. Subtle bottom border separator.
 *
 * Usage:
 *   <SectionHeader
 *     icon={Users}
 *     title="Members"
 *     description="42 students across all courses"
 *     badge={{ label: "New", variant: "outline" }}
 *     action={{ label: "Refresh", onClick: handleRefresh, icon: RefreshCw }}
 *   />
 */

interface BadgeConfig {
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
}

interface ActionConfig {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  loading?: boolean;
}

interface SectionHeaderProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  badge?: BadgeConfig;
  action?: ActionConfig;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  badge,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[var(--canvas-elevated)]">
              <Icon className="size-4 text-[var(--ink-secondary)]" strokeWidth={1.8} />
            </div>
          )}
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">
            {title}
          </h1>
          {badge && (
            <Badge
              variant={badge.variant ?? "outline"}
              className="shrink-0 rounded-[3px] text-[9px] uppercase tracking-[0.04em]"
            >
              {badge.label}
            </Badge>
          )}
        </div>
        {description && (
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="h-7 shrink-0 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label={action.label}
        >
          {action.icon && (
            <action.icon
              className={`mr-1 size-3 ${action.loading ? "animate-spin" : ""}`}
            />
          )}
          {action.label}
        </Button>
      )}
    </div>
  );
}
