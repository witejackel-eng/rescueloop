"use client";

import { cn } from "@/lib/utils";
import { momentumMeta } from "@/lib/format";
import type { Momentum } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LEGEND: { id: Momentum; description: string }[] = [
  { id: "accelerating", description: "Completing lessons faster than baseline" },
  { id: "steady", description: "Consistent pace" },
  { id: "slowing", description: "Pace decreasing" },
  { id: "stopped", description: "No activity for 7+ days" },
  { id: "recovered", description: "Returned after intervention" },
];

/**
 * Compact inline legend explaining the 5 momentum states. Each pill is
 * wrapped in a tooltip with a one-line description.
 */
export function MomentumLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5",
        className,
      )}
    >
      <span className="text-[13px] font-medium text-[#6A706A]">
        Momentum
      </span>
      {LEGEND.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[#E3E5DF] bg-white px-2.5 py-0.5 text-[13px] text-[#171A17]">
              <span className={momentumMeta[item.id].color}>●</span>
              <span>{momentumMeta[item.id].label}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-white text-[#171A17] shadow-md"
          >
            {item.description}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
