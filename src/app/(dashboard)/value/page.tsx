"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import { KPIS } from "@/lib/mock-data";
import { AttributionWaterfall } from "@/components/rescueloop/value/attribution-waterfall";
import { EvidenceTimeline } from "@/components/rescueloop/value/evidence-timeline";
import { LedgerTable } from "@/components/rescueloop/value/ledger-table";
import { RoiPanel } from "@/components/rescueloop/value/roi-panel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(max-width: 1023px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches,
    () => false,
  );
}

export default function ValueLedgerPage() {
  const isMobile = useIsMobile();
  const valueEvents = useDemoStore((s) => s.valueEvents);
  const [selectedId, setSelectedId] = useState<string | null>(
    valueEvents[0]?.id ?? null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedEvent = useMemo(
    () => valueEvents.find((e) => e.id === selectedId) ?? null,
    [valueEvents, selectedId],
  );

  function handleSelect(id: string) {
    setSelectedId(id);
    if (isMobile) setSheetOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
            Value Ledger
          </h1>
          <span className="font-mono text-[12px] text-[var(--ink-muted)]">
            Recovered revenue, clearly attributed
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          <span>Plan: ${KPIS.planCost}/mo</span>
        </div>
      </header>

      {/* Hero — attribution waterfall */}
      <AttributionWaterfall events={valueEvents} />

      {/* ROI panel */}
      <RoiPanel />

      {/* Two-column: ledger table + evidence timeline */}
      <div className="grid min-h-[600px] grid-cols-1 overflow-hidden border border-[var(--hairline)] lg:grid-cols-[1fr_400px] lg:border-0">
        <div className="min-h-0 border border-[var(--hairline)] bg-[var(--surface)] lg:border">
          <LedgerTable
            events={valueEvents}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
        <section className="hidden min-h-0 lg:block lg:h-full lg:border lg:border-[var(--hairline)] lg:bg-[var(--canvas-elevated)]">
          <EvidenceTimeline event={selectedEvent} />
        </section>
      </div>

      {/* Mobile evidence timeline bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-none border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0 gap-0 h-[88dvh]",
            "[&>button:last-child]:hidden",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--hairline)] px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Evidence timeline
            </span>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Close timeline"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <EvidenceTimeline event={selectedEvent} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
