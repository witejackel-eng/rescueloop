// /overview/value — public demo of the value/ROI view.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Reads from fixture providers.

import "server-only";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

// Illustrative demo value events — not from a real attribution engine.
const DEMO_VALUE_EVENTS = [
  { id: "ve_1", student: "Maya R.", event: "Resumed after activation rescue", attribution: "confirmed", value: 79 },
  { id: "ve_2", student: "Jordan K.", event: "Resumed after mid-course nudge", attribution: "likely", value: 79 },
  { id: "ve_3", student: "Alex T.", event: "Completed course after near-finish push", attribution: "confirmed", value: 79 },
  { id: "ve_4", student: "Sam L.", event: "Returned after cancellation rescue", attribution: "possible", value: 0 },
] as const;

export default function OverviewValuePage() {
  const totalValue = DEMO_VALUE_EVENTS.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Value Ledger · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated value ledger. Attribution levels and monetary values
          are illustrative — not customer results.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <TrendingUp className="size-4 text-[var(--recovery-green)]" />
            Simulated value summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="font-mono tabular-nums text-3xl text-[var(--recovery-green)]">
            ${totalValue}
          </span>
          <span className="ml-2 text-[13px] text-[var(--ink-secondary)]">
            attributed across {DEMO_VALUE_EVENTS.length} events (demo)
          </span>
        </CardContent>
      </Card>

      <ul className="divide-y divide-[var(--hairline)]">
        {DEMO_VALUE_EVENTS.map((e) => (
          <li key={e.id} className="flex items-center justify-between px-2 py-3 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[var(--ink-primary)]">{e.student}</span>
              <span className="text-[var(--ink-secondary)]">{e.event}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                {e.attribution}
              </span>
              <span className="font-mono tabular-nums text-[var(--ink-primary)]">
                ${e.value}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
