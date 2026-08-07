"use client";

import { useState } from "react";
import { COURSE, COURSE_AVERAGE_STALL_RATE } from "@/lib/mock-data";
import { CourseMap } from "@/components/rescueloop/insights/course-map";
import { CourseFunnel } from "@/components/rescueloop/insights/course-funnel";
import { BlockerExplorer } from "@/components/rescueloop/insights/blocker-explorer";
import { RecommendationWorkflow } from "@/components/rescueloop/insights/recommendation-workflow";
import { AnimatedCounter } from "@/components/interaction/animated-counter";

export default function InsightsPage() {
  // Lesson 7 is highlighted by default per the spec.
  const [selectedLesson, setSelectedLesson] = useState<number>(7);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
            Course Intelligence
          </h1>
          <span className="font-mono text-[12px] tabular-nums text-[var(--ink-muted)]">
            {COURSE.name} · {COURSE.lessonCount} lessons
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          <span>Course avg stall rate: <span className="font-semibold text-[var(--ink-primary)]"><AnimatedCounter value={COURSE_AVERAGE_STALL_RATE} suffix="%" /></span></span>
        </div>
      </header>

      {/* Hero — course map */}
      <CourseMap selectedLesson={selectedLesson} onSelectLesson={setSelectedLesson} />

      {/* Course progression funnel */}
      <CourseFunnel />

      {/* Blocker explorer + recommendation workflow (two columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BlockerExplorer selectedLesson={selectedLesson} />
        <RecommendationWorkflow
          selectedLesson={selectedLesson}
          onSelectLesson={setSelectedLesson}
        />
      </div>
    </div>
  );
}
