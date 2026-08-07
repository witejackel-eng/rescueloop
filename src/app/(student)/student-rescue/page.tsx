"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { COURSE } from "@/lib/mock-data";
import { BrandSignature } from "@/components/brand/logo";

const STUDENT_FIRST_NAME = "Maya";
const PROGRESS_PERCENT = 38;
const LESSONS_COMPLETED = 11;
const NEXT_LESSON_INDEX = 12;
const NEXT_LESSON_TITLE = "Onboarding a Client";
const NEXT_LESSON_DURATION = "~12 minutes";

const fadeSlide = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export default function StudentRescuePage() {
  const router = useRouter();
  const [remindTomorrow, setRemindTomorrow] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + course context */}
      <motion.header {...fadeSlide} className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#171A17] sm:text-[32px]">
          Hi {STUDENT_FIRST_NAME} <span aria-hidden>👋</span>
        </h1>
        <p className="text-[15px] text-[#6A706A]">{COURSE.name}</p>
      </motion.header>

      {/* Progress */}
      <motion.section
        {...fadeSlide}
        transition={{ ...fadeSlide.transition, delay: 0.04 }}
        aria-label="Your progress"
      >
        <Card className="gap-4 rounded-2xl border-[#E3E5DF] bg-white p-5 shadow-[0_1px_3px_rgba(23,26,23,0.04)]">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-medium text-[#171A17]">
              Your progress
            </span>
            <span className="tabular-mono text-[20px] font-semibold text-[#147D68]">
              {PROGRESS_PERCENT}%
            </span>
          </div>
          <Progress
            value={PROGRESS_PERCENT}
            className="h-2.5 rounded-full bg-[#E8F0EC]"
          />
          <p className="text-[14px] text-[#6A706A]">
            <span className="tabular-mono font-medium text-[#171A17]">
              {LESSONS_COMPLETED}
            </span>{" "}
            of{" "}
            <span className="tabular-mono font-medium text-[#171A17]">
              {COURSE.lessonCount}
            </span>{" "}
            lessons done
          </p>
        </Card>
      </motion.section>

      {/* Next lesson */}
      <motion.section
        {...fadeSlide}
        transition={{ ...fadeSlide.transition, delay: 0.08 }}
        aria-label="Next lesson"
      >
        <Card className="gap-5 rounded-2xl border-[#E3E5DF] bg-white p-5 shadow-[0_1px_3px_rgba(23,26,23,0.04)]">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium uppercase tracking-wide text-[#147D68]">
              Up next
            </span>
            <h2 className="text-[18px] font-semibold leading-snug text-[#171A17]">
              {NEXT_LESSON_TITLE}
            </h2>
            <p className="text-[14px] text-[#6A706A]">
              Lesson{" "}
              <span className="tabular-mono">{NEXT_LESSON_INDEX}</span> ·{" "}
              {NEXT_LESSON_DURATION}
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full rounded-xl bg-[#147D68] text-[15px] font-medium text-white shadow-sm hover:bg-[#127060]"
            onClick={() => {
              // In production this would route to the actual lesson.
              // For now, no-op so the demo stays calm and stable.
            }}
          >
            Continue course
            <ArrowRight className="size-4" />
          </Button>
        </Card>
      </motion.section>

      {/* Secondary actions OR remind-me confirmation */}
      <AnimatePresence mode="wait" initial={false}>
        {remindTomorrow ? (
          <motion.div
            key="remind-confirmation"
            {...fadeSlide}
            className="flex items-center gap-3 rounded-2xl border border-[#E8F0EC] bg-[#F4FBF8] px-4 py-3.5"
          >
            <CheckCircle2 className="size-5 shrink-0 text-[#27966A]" />
            <p className="text-[15px] font-medium text-[#171A17]">
              No problem — we&rsquo;ll remind you tomorrow.{" "}
              <span aria-hidden>👋</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="secondary-actions"
            {...fadeSlide}
            className="flex flex-col gap-2.5"
          >
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full justify-center rounded-xl border-[#E3E5DF] bg-white text-[15px] font-medium text-[#171A17] hover:bg-[#F8F8F5]"
              onClick={() => router.push("/student-rescue/blocker")}
            >
              <HelpCircle className="size-4 text-[#147D68]" />
              I&rsquo;m feeling stuck
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-11 w-full rounded-xl text-[15px] font-medium text-[#6A706A] hover:bg-[#F0F2EC] hover:text-[#171A17]"
              onClick={() => setRemindTomorrow(true)}
            >
              Remind me tomorrow
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet brand signature — student-safe */}
      <div className="mt-2 flex justify-center">
        <BrandSignature context="student" />
      </div>

      {/* Encouragement */}
      <motion.p
        {...fadeSlide}
        transition={{ ...fadeSlide.transition, delay: 0.12 }}
        className="mt-1 text-center text-[14px] leading-relaxed text-[#6A706A]"
      >
        You&rsquo;re making real progress. Every lesson gets you closer to your
        first client.
      </motion.p>
    </div>
  );
}
