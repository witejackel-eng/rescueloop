"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Clock,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format";
import type { ValueEvent } from "@/lib/types";
import { standard } from "@/design-system/motion";

interface EvidenceTimelineProps {
  event: ValueEvent | null;
}

interface EvidenceNode {
  timestamp: string;
  source: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

// Build a deterministic evidence chain for a given value event.
function buildEvidenceChain(event: ValueEvent): EvidenceNode[] {
  const date = new Date(event.date);
  const dayMinus = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() - n);
    return formatShortDate(d.toISOString().split("T")[0]);
  };
  const dayPlus = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return formatShortDate(d.toISOString().split("T")[0]);
  };

  // Common chain — order matters: risk → intervention → opened → completed → reversed → payment
  const chain: EvidenceNode[] = [
    {
      timestamp: dayMinus(4),
      source: "RescueLoop engine",
      title: "Risk detected",
      description: `${event.studentName} matched a stall signal — 7+ days inactive.`,
      icon: AlertTriangle,
      iconBg: "bg-[var(--warning-light)]",
      iconColor: "text-[var(--warning)]",
    },
    {
      timestamp: dayMinus(3),
      source: "Creator (approval)",
      title: "Intervention approved",
      description: `${event.intervention} queued for sending.`,
      icon: Check,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    },
    {
      timestamp: dayMinus(3),
      source: "Email channel",
      title: "Student opened rescue experience",
      description: `Message opened 4 minutes after delivery.`,
      icon: Mail,
      iconBg: "bg-[var(--canvas-elevated)]",
      iconColor: "text-[var(--ink-secondary)]",
    },
    {
      timestamp: dayMinus(1),
      source: "Course platform",
      title: "Student completed lesson",
      description: event.evidence,
      icon: Send,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    },
  ];

  // Tier-specific tail
  if (event.event.toLowerCase().includes("cancellation")) {
    chain.push({
      timestamp: dayMinus(0),
      source: "Whop",
      title: "Cancellation reversed",
      description: `Scheduled cancellation withdrawn by ${event.studentName}.`,
      icon: RefreshCw,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    });
    chain.push({
      timestamp: dayPlus(1),
      source: "Whop",
      title: "Payment succeeded",
      description: `Membership renewal processed — $${event.monetaryValue}.`,
      icon: ShieldCheck,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    });
  } else if (event.event.toLowerCase().includes("activated")) {
    chain.push({
      timestamp: dayMinus(0),
      source: "Course platform",
      title: "First lesson completed",
      description: `Activation event — first lesson done after 39-day gap.`,
      icon: Sparkles,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    });
    chain.push({
      timestamp: dayPlus(1),
      source: "Whop",
      title: "Payment succeeded",
      description: `Membership renewal processed — $${event.monetaryValue}.`,
      icon: ShieldCheck,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    });
  } else {
    chain.push({
      timestamp: dayMinus(0),
      source: "Course platform",
      title: "Lesson completed after contact",
      description: `Progress increase recorded within 48h of message.`,
      icon: Send,
      iconBg: "bg-[var(--recovery-light)]",
      iconColor: "text-[var(--recovery-green)]",
    });
    if (event.monetaryValue > 0) {
      chain.push({
        timestamp: dayPlus(1),
        source: "Whop",
        title: "Payment succeeded",
        description: `Membership renewal processed — $${event.monetaryValue}.`,
        icon: ShieldCheck,
        iconBg: "bg-[var(--recovery-light)]",
        iconColor: "text-[var(--recovery-green)]",
      });
    }
  }

  // Estimated tier — show "modeling" tail instead of confirmed payment
  if (event.attributionLevel === "estimated") {
    const last = chain[chain.length - 1];
    last.title = "90-day retention modeled";
    last.description = `Projected value of $${event.monetaryValue} based on retention probability.`;
    last.icon = Clock;
    last.iconBg = "bg-[var(--warning-light)]";
    last.iconColor = "text-[var(--warning)]";
  }

  return chain;
}

export function EvidenceTimeline({ event }: EvidenceTimelineProps) {
  if (!event) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-[260px]">
          <div className="mx-auto flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
            <Sparkles className="size-4" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">
            Select a value event
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-muted)]">
            The timeline shows the evidence chain — from risk detection to payment — for the
            selected event.
          </p>
        </div>
      </div>
    );
  }

  const chain = buildEvidenceChain(event);

  return (
    <div className="flex h-full flex-col bg-[var(--canvas-elevated)]">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--hairline)] px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-[18px] leading-tight text-[var(--ink-primary)]">
            {event.event}
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
            {formatShortDate(event.date)}
          </span>
        </div>
        <p className="text-[12px] text-[var(--ink-secondary)]">
          {event.studentName} · {event.intervention}
        </p>
        {event.monetaryValue > 0 && (
          <p className="font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
            ${event.monetaryValue}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Evidence chain
        </p>
        <ol className="relative space-y-4 pl-7">
          <span className="absolute left-[11px] top-1 bottom-1 w-px bg-[var(--hairline)]" />
          {chain.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.li
                key={`${node.title}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...standard, delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-7 top-0.5">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center border border-[var(--hairline)]",
                      node.iconBg,
                    )}
                  >
                    <Icon className={cn("size-3", node.iconColor)} />
                  </span>
                </span>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                      {node.title}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {node.timestamp}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                    {node.source}
                  </span>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                    {node.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
