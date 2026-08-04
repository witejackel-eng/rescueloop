import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RECOVERY_FUNNEL } from "@/lib/mock-data";

/**
 * Recovery funnel — horizontal div-based bars with proportional widths.
 * Each stage shows count + label; conversion % between stages.
 * Server component (no interactivity needed).
 */
export function RecoveryFunnel() {
  const max = RECOVERY_FUNNEL[0].count;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-base font-semibold text-[#171A17]">
          Recovery funnel
        </CardTitle>
        <p className="text-sm text-[#6A706A]">
          From detected risk signals to retained students — last 30 days
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-2.5">
          {RECOVERY_FUNNEL.map((stage, i) => {
            const widthPct = Math.max(8, (stage.count / max) * 100);
            const prev = i > 0 ? RECOVERY_FUNNEL[i - 1] : null;
            const conv = prev ? Math.round((stage.count / prev.count) * 100) : null;

            // Color gradient: teal at the top, fading slightly toward green for final stage
            const isFinal = i === RECOVERY_FUNNEL.length - 1;

            return (
              <div key={stage.stage} className="flex flex-col gap-1">
                {prev && conv !== null && (
                  <div className="flex items-center gap-1.5 pl-1 text-xs text-[#6A706A]">
                    <span className="tabular-mono font-medium text-[#147D68]">
                      {conv}%
                    </span>
                    <span className="lowercase">
                      {stage.stage.toLowerCase()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {/* bar */}
                  <div
                    className="relative h-10 rounded-md transition-all"
                    style={{
                      width: `${widthPct}%`,
                      background: isFinal
                        ? "linear-gradient(90deg, #27966A 0%, #1F8A5E 100%)"
                        : "linear-gradient(90deg, #147D68 0%, #1A8E76 100%)",
                      minWidth: "120px",
                    }}
                  >
                    <div className="flex h-full items-center justify-between gap-2 px-3">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {stage.stage}
                      </span>
                      <span className="tabular-mono text-sm font-semibold text-white">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  {/* label */}
                  <span className="hidden text-xs text-[#6A706A] sm:inline">
                    {stage.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#E3E5DF] pt-3 text-xs text-[#6A706A]">
          <span>
            Overall conversion{" "}
            <span className="tabular-mono font-medium text-[#171A17]">
              {Math.round(
                (RECOVERY_FUNNEL[RECOVERY_FUNNEL.length - 1].count /
                  RECOVERY_FUNNEL[0].count) *
                  100,
              )}
              %
            </span>{" "}
            detected → retained
          </span>
          <span className="tabular-mono">
            {RECOVERY_FUNNEL[0].count} →{" "}
            {RECOVERY_FUNNEL[RECOVERY_FUNNEL.length - 1].count}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
