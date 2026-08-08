"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  UserPlus,
  CheckCircle2,
  Eye,
  AlertTriangle,
  MessageSquare,
  CalendarClock,
  Ban,
  Radio,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type EventStatus = "success" | "warning" | "info" | "critical" | "recovery";

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  icon: LucideIcon;
  status: EventStatus;
  timestamp: Date;
}

// ── Status colors ──────────────────────────────────────────────

const STATUS_COLORS: Record<EventStatus, string> = {
  success: "text-[var(--recovery-green)]",
  warning: "text-[var(--warning)]",
  info: "text-[var(--info)]",
  critical: "text-[var(--critical)]",
  recovery: "text-[var(--recovery-green)]",
};

const STATUS_BG: Record<EventStatus, string> = {
  success: "bg-[var(--recovery-green)]/10",
  warning: "bg-[var(--warning)]/10",
  info: "bg-[var(--info)]/10",
  critical: "bg-[var(--critical)]/10",
  recovery: "bg-[var(--recovery-green)]/10",
};

const STATUS_DOT: Record<EventStatus, string> = {
  success: "bg-[var(--recovery-green)]",
  warning: "bg-[var(--warning)]",
  info: "bg-[var(--info)]",
  critical: "bg-[var(--critical)]",
  recovery: "bg-[var(--recovery-green)]",
};

// ── Simulated event templates ──────────────────────────────────

const EVENT_TEMPLATES: Array<{
  type: string;
  description: string;
  icon: LucideIcon;
  status: EventStatus;
}> = [
  { type: "student_detected", description: "Student detected — Sarah M.", icon: UserPlus, status: "info" },
  { type: "intervention_approved", description: "Intervention approved — follow-up email", icon: CheckCircle2, status: "success" },
  { type: "activity_observed", description: "Activity observed — login after 14 days", icon: Eye, status: "recovery" },
  { type: "risk_alert", description: "Risk alert — payment failure detected", icon: AlertTriangle, status: "critical" },
  { type: "message_sent", description: "Re-engagement message sent", icon: MessageSquare, status: "info" },
  { type: "scheduled", description: "Follow-up scheduled — 3 days", icon: CalendarClock, status: "warning" },
  { type: "excluded", description: "Student excluded — opted out", icon: Ban, status: "warning" },
  { type: "recovered", description: "Student recovered — subscription renewed", icon: CheckCircle2, status: "recovery" },
  { type: "student_detected", description: "Student detected — Alex K.", icon: UserPlus, status: "info" },
  { type: "intervention_approved", description: "Intervention approved — SMS reminder", icon: CheckCircle2, status: "success" },
  { type: "activity_observed", description: "Activity observed — course progress resumed", icon: Eye, status: "recovery" },
  { type: "risk_alert", description: "Risk alert — 21 days inactive", icon: AlertTriangle, status: "critical" },
  { type: "recovered", description: "Revenue recovered — $29.00", icon: CheckCircle2, status: "recovery" },
  { type: "message_sent", description: "Personalized nudge sent", icon: MessageSquare, status: "info" },
];

// ── Utility ────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

let eventCounter = 0;
function generateEvent(): ActivityEvent {
  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  eventCounter++;
  return {
    id: `evt-${eventCounter}-${Date.now()}`,
    type: template.type,
    description: template.description,
    icon: template.icon,
    status: template.status,
    timestamp: new Date(),
  };
}

// ── Animation variants ─────────────────────────────────────────

const itemVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.2 },
  },
};

// ── Component ──────────────────────────────────────────────────

interface ActivityFeedProps {
  /** Max number of visible events */
  maxEvents?: number;
  /** Interval in ms between new simulated events */
  intervalMs?: number;
  className?: string;
}

export function ActivityFeed({
  maxEvents = 20,
  intervalMs = 4000,
  className,
}: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(Date.now());
  const reduced = useReducedMotion();
  const feedRef = useRef<HTMLDivElement>(null);

  // Tick for relative timestamps
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  // Simulate incoming events
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setEvents((prev) => {
        const newEvent = generateEvent();
        return [newEvent, ...prev].slice(0, maxEvents);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, intervalMs, maxEvents]);

  // Seed a few initial events
  useEffect(() => {
    const initial: ActivityEvent[] = [];
    for (let i = 0; i < 5; i++) {
      const evt = generateEvent();
      evt.timestamp = new Date(Date.now() - (i + 1) * 30000);
      initial.push(evt);
    }
    setEvents(initial);
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            {!paused && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--recovery-green)] opacity-40" />
            )}
            <span
              className={cn(
                "relative inline-flex h-full w-full rounded-full",
                paused ? "bg-[var(--ink-muted)]" : "bg-[var(--recovery-green)]",
              )}
            />
          </span>
          <span className="text-sm font-semibold text-[var(--ink-primary)]">
            Activity Feed
          </span>
          {paused ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Paused
            </span>
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--recovery-green)]">
              Live
            </span>
          )}
        </div>
        <button
          onClick={togglePause}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] transition-colors"
          aria-label={paused ? "Resume feed" : "Pause feed"}
        >
          {paused ? (
            <>
              <Play className="size-3" />
              Resume
            </>
          ) : (
            <>
              <Pause className="size-3" />
              Pause
            </>
          )}
        </button>
      </div>

      {/* Feed list */}
      <div
        ref={feedRef}
        className="max-h-80 overflow-y-auto overscroll-contain"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {events.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
              Waiting for activity…
            </div>
          )}
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={reduced ? undefined : itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className="group flex items-start gap-3 border-b border-[var(--hairline)] last:border-b-0 px-4 py-3 hover:bg-[var(--canvas-elevated)]/50 transition-colors"
            >
              {/* Icon */}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg mt-0.5",
                  STATUS_BG[event.status],
                  STATUS_COLORS[event.status],
                )}
              >
                <event.icon className="size-3.5" />
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug text-[var(--ink-primary)] truncate">
                  {event.description}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  {relativeTime(event.timestamp)}
                </p>
              </div>

              {/* Status dot */}
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0 mt-2",
                  STATUS_DOT[event.status],
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--hairline)] px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] text-[var(--ink-muted)]">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
          <Radio className="size-2.5" />
          {paused ? "Updates paused" : "Real-time updates"}
        </div>
      </div>
    </div>
  );
}
