import { Lightbulb, Sparkles } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shared/layout-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FRICTION_FINDINGS } from "@/lib/mock-data";
import { CourseFunnel } from "@/components/rescueloop/insights/course-funnel";
import { LessonFrictionChart } from "@/components/rescueloop/insights/lesson-friction-chart";
import { BlockerAnalysis } from "@/components/rescueloop/insights/blocker-analysis";
import { RecommendationCard } from "@/components/rescueloop/insights/recommendation-cards";

export default function InsightsPage() {
  const newCount = FRICTION_FINDINGS.filter((f) => f.status === "new").length;
  const plannedCount = FRICTION_FINDINGS.filter(
    (f) => f.status === "planned",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Insights"
        description="Where students struggle and what to do about it"
        actions={
          <Badge
            variant="outline"
            className="border-[#E3E5DF] bg-[#F8F8F5] text-[#6A706A]"
          >
            <span className="tabular-mono">{FRICTION_FINDINGS.length}</span>
            <span className="ml-1">findings</span>
          </Badge>
        }
      />

      {/* 1. Course progression funnel (full width) */}
      <CourseFunnel />

      {/* 2. Two-column: lesson friction + blocker analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LessonFrictionChart />
        <BlockerAnalysis />
      </div>

      {/* 3. Recommendation cards (full width) */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Recommended actions"
          description="Evidence-backed fixes for the lessons where students stall"
          action={
            <div className="flex items-center gap-2 text-xs text-[#6A706A]">
              <span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {newCount}
                </span>{" "}
                new
              </span>
              <span className="text-[#D8DAD4]">·</span>
              <span>
                <span className="tabular-mono font-medium text-[#171A17]">
                  {plannedCount}
                </span>{" "}
                planned
              </span>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FRICTION_FINDINGS.map((finding) => (
            <RecommendationCard key={finding.id} finding={finding} />
          ))}
        </div>
      </div>

      {/* 4. Summary insight callout */}
      <Card
        className="gap-0 overflow-hidden border-l-4 py-0"
        style={{ borderLeftColor: "#147D68" }}
      >
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F5EF] text-[#147D68]">
              <Lightbulb className="size-4.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-[#147D68]" />
                <p className="text-xs font-medium uppercase tracking-wide text-[#147D68]">
                  Key takeaway
                </p>
              </div>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#171A17]">
                Lesson 7 accounts for the largest single-lesson drop-off.
                Adding a setup walkthrough could reduce mid-course stall by an
                estimated 30%.
              </p>
              <p className="mt-2 text-xs text-[#6A706A]">
                This estimate is based on observed stall rates and assumes a
                50% reduction in Lesson 7 friction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
