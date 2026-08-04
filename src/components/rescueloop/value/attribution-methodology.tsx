"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AttributionPill } from "@/components/shared/status-pills";
import type { AttributionLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

type TierDef = {
  level: AttributionLevel;
  title: string;
  body: string;
  accent: string;
};

const TIERS: TierDef[] = [
  {
    level: "confirmed",
    title: "Confirmed",
    body: "Directly attributable to a specific intervention. The student returned, completed a lesson, or reversed a cancellation within a verifiable window after the intervention was sent.",
    accent: "border-l-[#27966A]",
  },
  {
    level: "strongly_associated",
    title: "Strongly associated",
    body: "An intervention was sent and the student returned, but the causal chain is not fully isolated. For example, the student may have returned independently.",
    accent: "border-l-[#4C7ECF]",
  },
  {
    level: "estimated",
    title: "Estimated",
    body: "Modeled projection based on the probability of retention. These figures are updated as actual responses arrive and are never presented as confirmed revenue.",
    accent: "border-l-[#D89222]",
  },
];

export function AttributionMethodology() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#E3E5DF] bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-[#171A17]">
            Attribution methodology
          </h3>
          <p className="mt-0.5 text-sm text-[#6A706A]">
            How RescueLoop classifies each value event.
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#6A706A] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[#E3E5DF] px-5 py-4">
          <div className="flex flex-col gap-3">
            {TIERS.map((tier) => (
              <div
                key={tier.level}
                className={cn(
                  "rounded-lg border-l-4 bg-[#F8F8F5] px-4 py-3",
                  tier.accent,
                )}
              >
                <div className="flex items-center gap-2">
                  <AttributionPill level={tier.level} />
                  <span className="text-sm font-semibold text-[#171A17]">
                    {tier.title}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#171A17]">
                  {tier.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#E3E5DF] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#6A706A]">
              Confirmed value is the only tier used in ROI calculations.
              Strongly associated events migrate to confirmed when verifiable
              evidence is collected.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-[#E3E5DF] text-[#6A706A]"
              onClick={() => setOpen(false)}
            >
              Collapse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
