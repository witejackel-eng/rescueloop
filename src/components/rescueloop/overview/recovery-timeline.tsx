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
import { useDemoStore } from "@/features/demo-engine/demo-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { slideInUp, reducedVariants } from "@/design-system/motion";
import { formatCurrency } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";

const eventTypeMeta: Record<
  ActivityEvent["type"],
  { icon: LucideIcon; tint: string }
> = {
  intervention_sent: { icon: Send, tint: "text-[var(--ink-secondary)]" },
  student_responded: { icon: MessageCircle, tint: "text-[var(--warning)]" },
  student_resumed: { icon: PlayCircle, tint: "text-[var(--recovery-green)]" },
  recovery_confirmed: { icon: CheckCircle2, tint: "text-[var(--recovery-green)]" },
  blocker_collected: { icon: HelpCircle, tint: "text-[var(--warning)]" },
  friction_detected: { icon: AlertTriangle, tint: "text-[var(--warning)]" },
  campaign_scheduled: { icon: CalendarClock, tint: "text-[var(--ink-secondary)]" },
  member_activated: { icon: Zap, tint: "text-[var(--recovery-green)]" },
  cancellation_reversed: { icon: Undo2, tint: "text-[var(--recovery-green)]" },
};

type Bucket = "Just now" | "Earlier today" | "Yesterday" | "Earlier";

function relativeBucket(timestamp: string): Bucket {
  const t = timestamp.toLowerCase();
  if (t === "just now" || /seconds?\s*ago/.test(t)) return "Just now";
  if (/yesterday/.test(t)) return "Yesterday";
  if (/hours?\s*ago/.test(t)) {
    const m = t.match(/(\d+)\s*hours?/);
    if (m && parseInt(m[1], 10) >= 24) return "Earlier";
    return "Earlier today";
  }
  if (/minutes?\s*ago/.test(t)) return "Earlier today";
  if (/days?\s*ago/.test(t)) {
    const m = t.match(/(\d+)\s*days?/);
    if (m && parseInt(m[1], 10) === 1) return "Yesterday";
    return "Earlier";
  }
  return "Earlier";
}

const BUCKET_ORDER: Bucket[] = [
  "Just now",
  "Earlier today",
  "Yesterday",
  "Earlier",
];

export function RecoveryTimeline() {
  const reduced = useReducedMotion();
  const activity = useDemoStore((s) => s.activity);

  // Group events by relative time bucket, preserving chronological order.
  const groups: { label: Bucket; events: ActivityEvent[] }[] = [];
  const indexByBucket = new Map<Bucket, number>();
  for (const ev of activity) {
    const bucket = relativeBucket(ev.timestamp);
    let idx = indexByBucket.get(bucket);
    if (idx === undefined) {
      idx = groups.length;
      groups.push({ label: bucket, events: [] });
      indexByBucket.set(bucket, idx);
    }
    groups[idx].events.push(ev);
  }

  // Sort groups by canonical bucket order.
  groups.sort(
    (a, b) =>
      BUCKET_ORDER.indexOf(a.label) - BUCKET_ORDER.indexOf(b.label),
  );

  const variants = reduced ? reducedVariants : slideInUp;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">
          Live recovery timeline
        </h3>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--ink-muted)]">
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--recovery-green)]" />
          Live
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto border-y border-[var(--hairline)]">
        {groups.length === 0 && (
          <div className="px-2 py-6 text-center text-[12px] text-[var(--ink-muted)]">
            No activity yet.
          </div>
        )}

        {groups.map((group) => (
          <div
            key={group.label}
            className="border-b border-[var(--hairline-subtle)] last:border-b-0"
          >
            <div className="sticky top-0 z-[1] bg-[var(--canvas)] px-1 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {group.label}
              </span>
            </div>

            <div className="relative px-1 pb-1">
              {/* Vertical connecting line on the left */}
              <div className="absolute bottom-2 left-[9px] top-2 w-px bg-[var(--hairline-subtle)]" />
              <div className="relative flex flex-col">
                {group.events.map((ev) => {
                  const meta = eventTypeMeta[ev.type];
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={ev.id}
                      variants={variants}
                      initial="hidden"
                      animate="visible"
                      className="group relative flex items-start gap-3 px-1 py-2 transition-colors hover:bg-[var(--canvas-elevated)]"
                    >
                      <span
                        className={`relative z-[2] mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface)] ${meta.tint}`}
                      >
                        <Icon className="size-[10px]" strokeWidth={2.25} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] text-[var(--ink-primary)]">
                            <span className="font-medium">{ev.studentName}</span>
                          </p>
                          <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                            {ev.timestamp}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--ink-secondary)]">
                          {ev.detail}
                        </p>
                      </div>

                      {typeof ev.value === "number" && ev.value > 0 && (
                        <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--recovery-green)]">
                          +{formatCurrency(ev.value)}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
