"use client";

// DemoDisclosureBanner — persistent disclosure bar for all /overview/* demo pages.
// Every demo page MUST show this banner at the top.
// It is visually prominent and always visible.

import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DemoDisclosureBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-md border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
        <div>
          <p className="text-[14px] font-medium text-[var(--ink-primary)]">
            Interactive demo · simulated workspace
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--ink-secondary)]">
            No customer data is connected. Nothing is sent.
          </p>
        </div>
      </div>
      <Badge
        variant="outline"
        className="self-start border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/10 font-mono text-[11px] uppercase tracking-wide text-[var(--recovery-green)] sm:self-auto"
      >
        public · no auth
      </Badge>
    </div>
  );
}
