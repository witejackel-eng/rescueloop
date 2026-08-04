import { Card, CardContent } from "@/components/ui/card";
import { AttributionPill } from "@/components/shared/status-pills";
import { KPIS, VALUE_EVENTS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import type { AttributionLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

function sumByAttribution(level: AttributionLevel): number {
  return VALUE_EVENTS.filter((e) => e.attributionLevel === level).reduce(
    (sum, e) => sum + e.monetaryValue,
    0,
  );
}

// Accent color tokens per attribution tier. Each card gets a distinct
// border-left accent + tinted header strip so the three tiers are
// visually separable at a glance.
const ACCENT_STYLES: Record<
  AttributionLevel,
  { border: string; chip: string }
> = {
  confirmed: {
    border: "border-l-4 border-l-[#27966A]",
    chip: "bg-[#E8F5EF] text-[#27966A]",
  },
  strongly_associated: {
    border: "border-l-4 border-l-[#4C7ECF]",
    chip: "bg-[#E8F0FE] text-[#4C7ECF]",
  },
  estimated: {
    border: "border-l-4 border-l-[#D89222]",
    chip: "bg-[#FEF3E2] text-[#D89222]",
  },
};

export function ValueSummaryCards() {
  const stronglyAssociated = sumByAttribution("strongly_associated");

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1 — Confirmed */}
        <Card className={cn("gap-0 py-0", ACCENT_STYLES.confirmed.border)}>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Confirmed recovered revenue
                </p>
                <p className="tabular-mono mt-1 text-3xl font-semibold text-[#171A17]">
                  {formatCurrency(KPIS.confirmedRecoveredRevenue)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  ACCENT_STYLES.confirmed.chip,
                )}
              >
                Tier 1
              </span>
            </div>
            <p className="text-sm text-[#6A706A]">
              Directly attributable to specific interventions
            </p>
            <div className="flex flex-col gap-1.5 border-t border-[#E3E5DF] pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6A706A]">Students re-engaged</span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {KPIS.studentsReengaged}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6A706A]">First-time activations</span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {KPIS.firstTimeActivations}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6A706A]">Cancellations reversed</span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {KPIS.cancellationsReversed}
                </span>
              </div>
            </div>
            <div>
              <AttributionPill level="confirmed" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Strongly associated */}
        <Card
          className={cn(
            "gap-0 py-0",
            ACCENT_STYLES.strongly_associated.border,
          )}
        >
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Strongly associated value
                </p>
                <p className="tabular-mono mt-1 text-3xl font-semibold text-[#171A17]">
                  {formatCurrency(stronglyAssociated)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  ACCENT_STYLES.strongly_associated.chip,
                )}
              >
                Tier 2
              </span>
            </div>
            <p className="text-sm text-[#6A706A]">
              Intervention sent, student returned, causal chain not fully
              isolated
            </p>
            <div className="flex flex-col gap-1.5 border-t border-[#E3E5DF] pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6A706A]">Events this period</span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {
                    VALUE_EVENTS.filter(
                      (e) => e.attributionLevel === "strongly_associated",
                    ).length
                  }
                </span>
              </div>
              <p className="mt-1 text-xs italic text-[#6A706A]">
                Included in confirmed where evidence is complete
              </p>
            </div>
            <div>
              <AttributionPill level="strongly_associated" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Estimated */}
        <Card className={cn("gap-0 py-0", ACCENT_STYLES.estimated.border)}>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Estimated 90-day retained value
                </p>
                <p className="tabular-mono mt-1 text-3xl font-semibold text-[#171A17]">
                  {formatCurrency(KPIS.estimated90DayRetainedValue)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  ACCENT_STYLES.estimated.chip,
                )}
              >
                Tier 3
              </span>
            </div>
            <p className="text-sm text-[#6A706A]">
              Modeled projection based on retention probability
            </p>
            <div className="flex flex-col gap-1.5 border-t border-[#E3E5DF] pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6A706A]">Horizon</span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  90 days
                </span>
              </div>
              <p className="mt-1 text-xs italic text-[#6A706A]">
                Not yet confirmed. Updated as responses arrive.
              </p>
            </div>
            <div>
              <AttributionPill level="estimated" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical disclaimer — never collapse the tiers into one exaggerated number */}
      <div className="mt-4 rounded-lg border border-[#E3E5DF] bg-[#F8F8F5] px-4 py-3">
        <p className="text-sm text-[#171A17]">
          <span className="font-semibold">Note on attribution:</span>{" "}
          RescueLoop never combines confirmed, associated, and estimated value
          into a single exaggerated number. Each figure is reported separately
          with its evidence.
        </p>
      </div>
    </div>
  );
}
