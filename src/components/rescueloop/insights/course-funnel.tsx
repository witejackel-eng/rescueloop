import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COURSE_FUNNEL } from "@/lib/mock-data";

/**
 * Course progression funnel — vertical stack of horizontal bars with
 * per-stage conversion %, drop-off counts, and overall completion rate.
 * Server component (no interactivity).
 */
export function CourseFunnel() {
  const max = COURSE_FUNNEL[0].count;
  const first = COURSE_FUNNEL[0].count;
  const last = COURSE_FUNNEL[COURSE_FUNNEL.length - 1].count;
  const overallRate = (last / first) * 100;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-base font-semibold text-[#171A17]">
          Course progression funnel
        </CardTitle>
        <p className="mt-0.5 text-sm text-[#6A706A]">
          How students move from course start to completion
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-2.5">
          {COURSE_FUNNEL.map((stage, i) => {
            const widthPct = Math.max(14, (stage.count / max) * 100);
            const prev = i > 0 ? COURSE_FUNNEL[i - 1] : null;
            const conv = prev ? Math.round((stage.count / prev.count) * 100) : null;
            const dropoff = prev ? prev.count - stage.count : null;
            const isFinal = i === COURSE_FUNNEL.length - 1;

            return (
              <div key={stage.stage} className="flex flex-col gap-1">
                {prev && conv !== null && dropoff !== null && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-1 text-xs text-[#6A706A]">
                    <span className="tabular-mono font-medium text-[#147D68]">
                      {conv}%
                    </span>
                    <span>conversion</span>
                    <span className="text-[#D8DAD4]">·</span>
                    <span className="tabular-mono text-[#C64D45]">
                      &minus;{dropoff}
                    </span>
                    <span>dropped off</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex h-12 items-center justify-between gap-2 overflow-hidden rounded-md px-3 transition-all"
                    style={{
                      width: `${widthPct}%`,
                      minWidth: "200px",
                      background: isFinal
                        ? "linear-gradient(90deg, #27966A 0%, #1F8A5E 100%)"
                        : "linear-gradient(90deg, #147D68 0%, #1A8E76 100%)",
                    }}
                  >
                    <span className="truncate text-sm font-medium text-white drop-shadow-sm">
                      {stage.stage}
                    </span>
                    <span className="tabular-mono shrink-0 text-base font-semibold text-white">
                      {stage.count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-[#E3E5DF] pt-3 text-xs text-[#6A706A] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Overall completion rate{" "}
            <span className="tabular-mono font-semibold text-[#171A17]">
              {overallRate.toFixed(1)}%
            </span>{" "}
            of starters complete the course
          </span>
          <span className="tabular-mono">
            {first} &rarr; {last}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
