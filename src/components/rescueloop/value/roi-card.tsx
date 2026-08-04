import { Card, CardContent } from "@/components/ui/card";
import { KPIS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export function RoiCard() {
  const planCost = KPIS.planCost;
  const confirmedValue = KPIS.confirmedRecoveredRevenue;
  const ratio = KPIS.confirmedValueToCost;

  // Proportional widths for the ratio bar. The bar always sums to 100%
  // of the container; the larger segment is the recovered value.
  const total = planCost + confirmedValue;
  const costPct = Math.round((planCost / total) * 100);
  const valuePct = 100 - costPct;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
          {/* Left: headline ratio */}
          <div className="flex flex-col justify-between gap-6 border-b border-[#E3E5DF] p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                Confirmed value-to-cost
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="tabular-mono text-5xl font-bold text-[#147D68]">
                  {ratio.toFixed(1)}×
                </span>
                <span className="text-sm font-medium text-[#6A706A]">
                  return on plan cost
                </span>
              </div>
              <p className="mt-2 text-sm text-[#6A706A]">
                ROI is calculated using confirmed value only. Estimated value is
                excluded from this calculation.
              </p>
            </div>

            <div className="flex items-center gap-6 border-t border-[#E3E5DF] pt-4">
              <div>
                <p className="text-xs text-[#6A706A]">Plan cost</p>
                <p className="tabular-mono text-lg font-semibold text-[#171A17]">
                  {formatCurrency(planCost)}
                  <span className="ml-1 text-xs font-normal text-[#6A706A]">
                    /month
                  </span>
                </p>
              </div>
              <div className="h-8 w-px bg-[#E3E5DF]" />
              <div>
                <p className="text-xs text-[#6A706A]">Confirmed recovered</p>
                <p className="tabular-mono text-lg font-semibold text-[#171A17]">
                  {formatCurrency(confirmedValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Right: ratio bar + sub-stats */}
          <div className="flex flex-col gap-6 p-6 lg:col-span-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-[#6A706A]">
                  Plan cost vs. confirmed value recovered
                </span>
                <span className="tabular-mono text-[#6A706A]">
                  {formatCurrency(planCost)} → {formatCurrency(confirmedValue)}
                </span>
              </div>
              <div className="flex h-10 w-full overflow-hidden rounded-md border border-[#E3E5DF]">
                <div
                  className="flex items-center justify-center bg-[#E3E5DF] text-[10px] font-medium text-[#6A706A]"
                  style={{ width: `${costPct}%` }}
                  title={`Plan cost: ${formatCurrency(planCost)}`}
                >
                  {costPct >= 8 ? `${costPct}%` : null}
                </div>
                <div
                  className="flex items-center justify-center bg-[#147D68] text-[10px] font-semibold text-white"
                  style={{ width: `${valuePct}%` }}
                  title={`Confirmed value: ${formatCurrency(confirmedValue)}`}
                >
                  {valuePct}%
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-[#6A706A]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-[#E3E5DF]" />
                  Plan cost
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-[#147D68]" />
                  Confirmed value recovered
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[#E3E5DF] pt-4">
              <div className="rounded-lg bg-[#F8F8F5] px-4 py-3">
                <p className="text-xs text-[#6A706A]">Creator actions avoided</p>
                <p className="tabular-mono mt-1 text-xl font-semibold text-[#171A17]">
                  {KPIS.creatorActionsAvoided}
                </p>
                <p className="mt-0.5 text-xs text-[#6A706A]">
                  Time saved by automated detection
                </p>
              </div>
              <div className="rounded-lg bg-[#F8F8F5] px-4 py-3">
                <p className="text-xs text-[#6A706A]">Students re-engaged</p>
                <p className="tabular-mono mt-1 text-xl font-semibold text-[#171A17]">
                  {KPIS.studentsReengaged}
                </p>
                <p className="mt-0.5 text-xs text-[#6A706A]">
                  Returned after an intervention
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
