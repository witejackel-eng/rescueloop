import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUpRight, MessageSquareWarning } from "lucide-react";
import Link from "next/link";
import {
  COURSE_AVERAGE_STALL_RATE,
  FRICTION_FINDINGS,
} from "@/lib/mock-data";

/**
 * Course friction finding card — highlighted to surface the top lesson
 * stall. Uses FRICTION_FINDINGS[0] (Lesson 7 by default).
 * Server component.
 */
export function FrictionFindingCard() {
  const finding = FRICTION_FINDINGS[0];
  if (!finding) return null;

  const multiple = (finding.stallRate / finding.courseAverageStallRate).toFixed(
    1,
  );

  return (
    <Card
      className="gap-0 overflow-hidden border-l-4 py-0"
      style={{ borderLeftColor: "#D89222" }}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#FEF3E2] text-[#D89222]">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#D89222]">
                  Course friction finding
                </p>
                <p className="text-sm font-semibold text-[#171A17]">
                  Lesson {finding.lessonIndex}: {finding.lessonTitle}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Stall rate"
                value={`${finding.stallRate}%`}
                accent="warning"
              />
              <Metric
                label="Course avg"
                value={`${COURSE_AVERAGE_STALL_RATE}%`}
              />
              <Metric
                label="Vs. average"
                value={`${multiple}×`}
                accent="critical"
              />
              <Metric
                label="Affected"
                value={`${finding.affectedStudents}`}
                sub="students"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6A706A]">
              <span className="inline-flex items-center gap-1">
                <MessageSquareWarning className="size-3.5" />
                <span className="tabular-mono font-medium text-[#171A17]">
                  {finding.reportsCount}
                </span>{" "}
                reports that setup was unclear
              </span>
              <span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {finding.affectedStudents}
                </span>{" "}
                students affected
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#6A706A]">
              <span className="font-medium text-[#171A17]">Recommendation:</span>{" "}
              {finding.recommendation}
            </p>
          </div>

          <div className="sm:pl-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/insights">
                View friction finding
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "warning" | "critical";
}) {
  const valueColor =
    accent === "warning"
      ? "text-[#D89222]"
      : accent === "critical"
        ? "text-[#C64D45]"
        : "text-[#171A17]";
  return (
    <div className="rounded-lg bg-[#F8F8F5] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#6A706A]">
        {label}
      </p>
      <p className={`tabular-mono mt-0.5 text-lg font-semibold ${valueColor}`}>
        {value}
        {sub && (
          <span className="ml-1 text-xs font-normal text-[#6A706A]">
            {sub}
          </span>
        )}
      </p>
    </div>
  );
}
