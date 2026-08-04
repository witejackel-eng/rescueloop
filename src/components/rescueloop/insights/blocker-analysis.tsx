import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BLOCKER_ANALYSIS } from "@/lib/mock-data";
import type { BlockerType } from "@/lib/types";

/**
 * Blocker analysis — horizontal div-based bars showing why students get
 * stuck. Sorted descending by percentage (data is already sorted).
 * Server component.
 */

// Map human-readable blocker labels (used in mock-data) to typed keys,
// then to accent colors per the design system:
//   lack_of_time / unsure_next_step            → info (#4C7ECF)
//   material_difficult / expected_something_…  → warning (#D89222)
//   technical_problem / needs_creator_help     → critical (#C64D45)
const BLOCKER_TYPE_BY_LABEL: Record<string, BlockerType> = {
  "Lack of time": "lack_of_time",
  "Material is difficult": "material_difficult",
  "Unsure what to do next": "unsure_next_step",
  "Expected something different": "expected_something_different",
  "Technical problem": "technical_problem",
  "Needs creator help": "needs_creator_help",
};

const BLOCKER_COLOR: Record<BlockerType, string> = {
  lack_of_time: "#4C7ECF",
  material_difficult: "#D89222",
  unsure_next_step: "#4C7ECF",
  expected_something_different: "#D89222",
  technical_problem: "#C64D45",
  needs_creator_help: "#C64D45",
};

export function BlockerAnalysis() {
  const sorted = [...BLOCKER_ANALYSIS].sort((a, b) => b.percent - a.percent);
  const maxPct = Math.max(...sorted.map((b) => b.percent));
  const totalResponses = sorted.reduce((sum, b) => sum + b.count, 0);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-base font-semibold text-[#171A17]">
          Why students get stuck
        </CardTitle>
        <p className="mt-0.5 text-sm text-[#6A706A]">
          Self-reported blockers from students who stalled
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-3">
          {sorted.map((b) => {
            const type = BLOCKER_TYPE_BY_LABEL[b.blocker] ?? "lack_of_time";
            const color = BLOCKER_COLOR[type];
            const widthPct = (b.percent / maxPct) * 100;

            return (
              <div key={b.blocker} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-[#171A17]">
                    {b.blocker}
                  </span>
                  <span
                    className="tabular-mono text-base font-semibold"
                    style={{ color }}
                  >
                    {b.percent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#F0F2EC]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="tabular-mono w-16 shrink-0 text-right text-xs text-[#6A706A]">
                    {b.count} students
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#E3E5DF] pt-3 text-xs text-[#6A706A]">
          <span>
            <span className="tabular-mono font-medium text-[#171A17]">
              {totalResponses}
            </span>{" "}
            blocker responses collected
          </span>
          <span className="text-[#6A706A]">Last 30 days</span>
        </div>
      </CardContent>
    </Card>
  );
}
