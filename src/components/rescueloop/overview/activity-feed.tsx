"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  PlayCircle,
  Send,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVITY_FEED } from "@/lib/mock-data";
import type { ActivityEvent } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const eventTypeMeta: Record<
  ActivityEvent["type"],
  { icon: LucideIcon; color: string; bg: string }
> = {
  intervention_sent: {
    icon: Send,
    color: "text-[#4C7ECF]",
    bg: "bg-[#E8F0FE]",
  },
  student_responded: {
    icon: MessageCircle,
    color: "text-[#D89222]",
    bg: "bg-[#FEF3E2]",
  },
  student_resumed: {
    icon: PlayCircle,
    color: "text-[#147D68]",
    bg: "bg-[#E8F5EF]",
  },
  recovery_confirmed: {
    icon: CheckCircle2,
    color: "text-[#27966A]",
    bg: "bg-[#E8F5EF]",
  },
  blocker_collected: {
    icon: HelpCircle,
    color: "text-[#D89222]",
    bg: "bg-[#FEF3E2]",
  },
  friction_detected: {
    icon: AlertTriangle,
    color: "text-[#D89222]",
    bg: "bg-[#FEF3E2]",
  },
  campaign_scheduled: {
    icon: CalendarClock,
    color: "text-[#4C7ECF]",
    bg: "bg-[#E8F0FE]",
  },
  member_activated: {
    icon: Zap,
    color: "text-[#4C7ECF]",
    bg: "bg-[#E8F0FE]",
  },
  cancellation_reversed: {
    icon: Undo2,
    color: "text-[#27966A]",
    bg: "bg-[#E8F5EF]",
  },
};

/**
 * Live recovery activity feed — client component with framer-motion
 * staggered slide-in. Respects prefers-reduced-motion automatically
 * via framer-motion's standard transitions.
 */
export function ActivityFeed() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-[#171A17]">
              Recovery activity
            </CardTitle>
            <p className="mt-0.5 text-sm text-[#6A706A]">
              Latest interventions and student responses
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5EF] px-2.5 py-1 text-xs font-medium text-[#27966A]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#27966A]" />
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="scroll-area-thin max-h-80 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            {ACTIVITY_FEED.map((event, i) => {
              const meta = eventTypeMeta[event.type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: i * 0.04,
                    ease: "easeOut",
                  }}
                  className="flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-[#F8F8F5]"
                >
                  <span
                    className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}
                  >
                    <Icon className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-[#171A17]">
                        {event.studentName}
                      </p>
                      <span className="shrink-0 text-[11px] text-[#6A706A]">
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#6A706A]">
                      {event.detail}
                    </p>
                  </div>

                  {typeof event.value === "number" && event.value > 0 && (
                    <span className="tabular-mono shrink-0 text-sm font-semibold text-[#147D68]">
                      +{formatCurrency(event.value)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
