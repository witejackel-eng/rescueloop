import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { RISK_SEGMENTS } from "@/lib/mock-data";

/**
 * Risk segment cards — 2x2 grid showing each segment's count, trend,
 * rescue rate, and a thin progress bar.
 * Server component.
 */
export function RiskSegments() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {RISK_SEGMENTS.map((seg) => {
        const trendUp = seg.trend > 0;
        const trendColor = trendUp
          ? "text-[#C64D45]"
          : "text-[#27966A]"; // rising risk = bad (red), falling = good (green)
        return (
          <Card key={seg.id} className="gap-0 py-0">
            <CardHeader className="px-4 pt-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium text-[#6A706A]">
                  {seg.label}
                </CardTitle>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}
                >
                  {trendUp ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  <span className="tabular-mono">
                    {trendUp ? "+" : ""}
                    {seg.trend}
                  </span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline gap-2">
                <span className="tabular-mono text-3xl font-semibold text-[#171A17]">
                  {seg.count}
                </span>
                <span className="text-xs text-[#6A706A]">students</span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-[#6A706A]">
                {seg.description}
              </p>

              <div className="mt-3 border-t border-[#E3E5DF] pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6A706A]">Rescue rate</span>
                  <span className="tabular-mono font-medium text-[#147D68]">
                    {seg.rescueRate}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F2EC]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#147D68] to-[#27966A] transition-all"
                    style={{ width: `${seg.rescueRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
