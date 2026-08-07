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
import type { Notification } from "@/lib/types";

const NOTIF_META: Record<
  Notification["type"],
  { icon: LucideIcon; color: string; bg: string }
> = {
  help_request: { icon: HelpCircle, color: "text-[#D89222]", bg: "bg-[#FEF3E2]" },
  cancellation_detection: { icon: AlertTriangle, color: "text-[#C64D45]", bg: "bg-[#F4E8E6]" },
  recovery_confirmed: { icon: CheckCircle2, color: "text-[#27966A]", bg: "bg-[#E8F5EF]" },
  friction_finding: { icon: TrendingUp, color: "text-[#4C7ECF]", bg: "bg-[#E8F0FE]" },
  campaign_paused: { icon: Pause, color: "text-[#6A706A]", bg: "bg-[#F0F2EC]" },
  sync_problem: { icon: RefreshCw, color: "text-[#C64D45]", bg: "bg-[#F4E8E6]" },
  plan_limit: { icon: AlertTriangle, color: "text-[#D89222]", bg: "bg-[#FEF3E2]" },
  creator_mention: { icon: AtSign, color: "text-[#27966A]", bg: "bg-[#E8F5EF]" },
  member_mention: { icon: AtSign, color: "text-[#27966A]", bg: "bg-[#E8F5EF]" },
};

export function NotificationList({
  notifications,
  onAction,
}: {
  notifications: Notification[];
  onAction?: () => void;
}) {
  const visible = notifications.filter((n) => !n.dismissed);
  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="divide-y divide-[#E3E5DF]">
        {visible.map((notif) => {
          const meta = NOTIF_META[notif.type];
          const Icon = meta.icon;
          return (
            <div
              key={notif.id}
              className={cn(
                "flex gap-3 p-4 transition-colors hover:bg-[#F8F8F5]",
                !notif.resolved && "bg-[#FBFBF9]",
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  meta.bg,
                )}
              >
                <Icon className={cn("size-4.5", meta.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#171A17]">{notif.title}</p>
                  {notif.resolved && (
                    <span className="shrink-0 rounded-full bg-[#E8F5EF] px-2 py-0.5 text-[10px] font-medium text-[#27966A]">
                      Resolved
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#6A706A]">{notif.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#6A706A]">{notif.createdAt}</span>
                  <Button
                    asChild
                    size="sm"
                    variant={notif.resolved ? "ghost" : "outline"}
                    className="h-7 text-xs"
                  >
                    <Link href={notif.actionHref} onClick={onAction}>
                      {notif.actionLabel}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
