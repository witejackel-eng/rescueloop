"use client";

import { cn } from "@/lib/utils";
import { momentumMeta } from "@/lib/format";
import type { Momentum } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

const MOMENTUM_ORDER: Momentum[] = [
  "accelerating",
  "steady",
  "slowing",
  "stopped",
  "recovered",
];

const MOMENTUM_DESCRIPTIONS: Record<Momentum, string> = {
  accelerating: "Progress accelerating — multiple lessons completed in the last 14 days.",
  steady: "Steady pace — completing roughly one lesson per week.",
  slowing: "Pace slowing — gap between lessons growing, but not stalled.",
  stopped: "No activity in 7+ days. Likely needs an intervention.",
  recovered: "Returned after a stall and is making progress again.",
};

const MOMENTUM_DOT: Record<Momentum, string> = {
  accelerating: "bg-[var(--recovery-green)]",
  steady: "bg-[var(--info)]",
  slowing: "bg-[var(--warning)]",
  stopped: "bg-[var(--critical)]",
  recovered: "bg-[var(--recovery-green)]",
};

export function MomentumLegend({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]",
            className,
          )}
        >
          <Info className="size-3" />
          Momentum legend
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 rounded-none border-[var(--hairline)] bg-[var(--surface)] p-3"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Momentum classification
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {MOMENTUM_ORDER.map((m) => {
            const meta = momentumMeta[m];
            return (
              <li key={m} className="flex items-start gap-2">
                <span className={cn("mt-1 size-2 shrink-0 rounded-full", MOMENTUM_DOT[m])} />
                <div className="min-w-0">
                  <p className={cn("text-[12px] font-medium", meta.color)}>{meta.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)]">
                    {MOMENTUM_DESCRIPTIONS[m]}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function MomentumDot({ momentum, className }: { momentum: Momentum; className?: string }) {
  return (
    <span
      className={cn("size-2 rounded-full", MOMENTUM_DOT[momentum], className)}
      aria-label={`Momentum: ${momentumMeta[momentum].label}`}
    />
  );
}
