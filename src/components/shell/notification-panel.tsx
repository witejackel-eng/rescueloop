"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Pause,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AtSign,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import type { Notification } from "@/lib/types";

const NOTIF_META: Record<Notification["type"], { icon: LucideIcon; color: string }> = {
  help_request: { icon: HelpCircle, color: "text-[var(--warning)]" },
  cancellation_detection: { icon: AlertTriangle, color: "text-[var(--critical)]" },
  recovery_confirmed: { icon: CheckCircle2, color: "text-[var(--recovery-green)]" },
  friction_finding: { icon: TrendingUp, color: "text-[var(--ink-secondary)]" },
  campaign_paused: { icon: Pause, color: "text-[var(--ink-muted)]" },
  sync_problem: { icon: RefreshCw, color: "text-[var(--critical)]" },
  plan_limit: { icon: AlertTriangle, color: "text-[var(--warning)]" },
  creator_mention: { icon: AtSign, color: "text-[var(--recovery-green)]" },
  member_mention: { icon: AtSign, color: "text-[var(--recovery-green)]" },
};

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const notifications = useDemoStore((s) => s.notifications);
  const resolveNotification = useDemoStore((s) => s.resolveNotification);
  const visible = notifications.filter((n) => !n.dismissed);
  const unresolvedCount = visible.filter((n) => !n.resolved).length;

  return (
    <>
      <SheetHeader className="border-b border-[var(--hairline)] px-5 py-4">
        <SheetTitle className="flex items-center justify-between font-sans text-base font-medium">
          <span>Creator actions</span>
          {unresolvedCount > 0 && (
            <span className="font-mono text-xs text-[var(--ink-secondary)]">
              {unresolvedCount} unresolved
            </span>
          )}
        </SheetTitle>
      </SheetHeader>
      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="divide-y divide-[var(--hairline-subtle)]">
          {visible.map((notif) => {
            const meta = NOTIF_META[notif.type];
            const Icon = meta.icon;
            return (
              <div
                key={notif.id}
                className={cn(
                  "flex gap-3 px-5 py-4 transition-colors",
                  !notif.resolved && "bg-[var(--canvas-elevated)]/50",
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", meta.color)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--ink-primary)]">{notif.title}</p>
                    {notif.resolved && (
                      <span className="shrink-0 text-[10px] font-medium text-[var(--ink-muted)]">RESOLVED</span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-secondary)]">{notif.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">{notif.createdAt}</span>
                    <div className="flex gap-1">
                      {!notif.resolved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[12px] text-[var(--ink-muted)]"
                          onClick={() => resolveNotification(notif.id)}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[12px]">
                        <Link href={notif.actionHref} onClick={onClose}>
                          {notif.actionLabel}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
