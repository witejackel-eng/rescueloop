"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { attributionMeta } from "@/lib/format";
import type { AttributionLevel, ValueEvent } from "@/lib/types";
import { standard } from "@/design-system/motion";

interface AttributionWaterfallProps {
  events: ValueEvent[];
}

function sumByAttribution(events: ValueEvent[], level: AttributionLevel): number {
  return events
    .filter((e) => e.attributionLevel === level)
    .reduce((sum, e) => sum + e.monetaryValue, 0);
}

interface TierDef {
  level: AttributionLevel;
  value: number;
  label: string;
  description: string;
  // Visual treatment — each tier must have distinct weight.
  barClass: string;
  barStyle?: React.CSSProperties;
  rowClass: string;
}

/**
 * Attribution waterfall — three horizontal bands that visually separate the
 * three confidence tiers. Never combines them into one number.
 *
 * Visual weight hierarchy:
 *   Confirmed         → solid recovery-green, full opacity
 *   Strongly assoc.   → info-blue, 70% opacity (lighter visual weight)
 *   Estimated 90-day  → muted warning amber, 40% opacity + dashed border
 */
export function AttributionWaterfall({ events }: AttributionWaterfallProps) {
  const confirmed = sumByAttribution(events, "confirmed");
  const associated = sumByAttribution(events, "strongly_associated");
  const estimated = sumByAttribution(events, "estimated");

  const tiers: TierDef[] = [
    {
      level: "confirmed",
      value: confirmed,
      label: "Confirmed",
      description: "Directly attributable to specific interventions",
      barClass: "bg-[var(--recovery-green)]",
      rowClass: "border-[var(--recovery-green)]",
    },
    {
      level: "strongly_associated",
      value: associated,
      label: "Strongly associated",
      description: "Intervention sent, student returned, causal chain not fully isolated",
      barClass: "bg-[var(--info)]/70",
      rowClass: "border-[var(--info)]",
    },
    {
      level: "estimated",
      value: estimated,
      label: "Estimated 90-day",
      description: "Modeled projection. Not yet confirmed.",
      barClass: "bg-[var(--warning)]/40",
      barStyle: { backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(198,138,30,0.15) 4px, rgba(198,138,30,0.15) 8px)" },
      rowClass: "border-[var(--warning)]",
    },
  ];

  const maxValue = Math.max(confirmed, associated, estimated, 1);

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
          Attributed value — by evidence tier
        </h2>
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          {events.length} events
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[var(--hairline)]">
        {tiers.map((tier, i) => {
          const meta = attributionMeta[tier.level];
          const widthPct = Math.max(12, (tier.value / maxValue) * 100);
          return (
            <motion.div
              key={tier.level}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...standard, delay: i * 0.06 }}
              className={cn("flex flex-col gap-2 border-l-2 px-5 py-4", tier.rowClass)}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className={cn("border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]", meta.color)}>
                    {meta.label}
                  </span>
                  <span className="text-[12px] text-[var(--ink-secondary)]">{tier.label}</span>
                </div>
                <span className="font-mono text-[24px] font-semibold tabular-nums text-[var(--ink-primary)]">
                  $<AnimatedCounter value={tier.value} />
                </span>
              </div>

              {/* The bar — visual weight per tier */}
              <div className="relative h-3 w-full bg-[var(--hairline-subtle)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ ...standard, delay: 0.1 + i * 0.06 }}
                  className={cn("absolute inset-y-0 left-0", tier.barClass)}
                  style={tier.barStyle}
                />
              </div>

              <p className="text-[11px] text-[var(--ink-muted)]">{tier.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Critical disclaimer */}
      <div className="border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--ink-primary)]">
          <span className="font-semibold">Note on attribution:</span>{" "}
          RescueLoop never combines these tiers into one number.
        </p>
      </div>
    </div>
  );
}
