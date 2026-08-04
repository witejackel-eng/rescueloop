"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  HelpCircle,
  MessageCircle,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BlockerType } from "@/lib/types";

type BlockerOption = {
  id: BlockerType;
  label: string;
  icon: LucideIcon;
  confirmation: string;
};

const STUDENT_FIRST_NAME = "Maya";

const BLOCKER_OPTIONS: BlockerOption[] = [
  {
    id: "lack_of_time",
    label: "I don\u2019t have enough time right now",
    icon: Clock,
    confirmation:
      "That\u2019s totally okay. We\u2019ll save your spot and remind you when you\u2019re ready. Your progress won\u2019t go anywhere.",
  },
  {
    id: "material_difficult",
    label: "The material is difficult",
    icon: BookOpen,
    confirmation:
      "Thanks for letting us know. We\u2019ll send you a simpler breakdown of the lesson that\u2019s been tricky.",
  },
  {
    id: "unsure_next_step",
    label: "I don\u2019t know what to do next",
    icon: Compass,
    confirmation:
      "Got it. We\u2019ll send you a quick guide on what to do next so you\u2019re not guessing.",
  },
  {
    id: "expected_something_different",
    label: "I expected something different",
    icon: HelpCircle,
    confirmation:
      "Thank you for telling us. We\u2019ll share this with the creator so they can make the course clearer.",
  },
  {
    id: "technical_problem",
    label: "I have a technical problem",
    icon: Wrench,
    confirmation:
      "Sorry about that. We\u2019ll look into it and get back to you.",
  },
  {
    id: "needs_creator_help",
    label: "I need help from the creator",
    icon: MessageCircle,
    confirmation:
      "We\u2019ve let the creator know you\u2019d like some help. They\u2019ll reach out soon.",
  },
];

const fadeSlide = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export default function BlockerSelectionPage() {
  const [selected, setSelected] = useState<BlockerType | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedOption = BLOCKER_OPTIONS.find((o) => o.id === selected) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/student-rescue"
        className="inline-flex w-fit items-center gap-1 text-[14px] font-medium text-[#6A706A] transition-colors hover:text-[#171A17]"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <AnimatePresence mode="wait" initial={false}>
        {!submitted ? (
          <motion.div
            key="form"
            {...fadeSlide}
            className="flex flex-col gap-6"
          >
            {/* Heading */}
            <header className="flex flex-col gap-2">
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#171A17] sm:text-[28px]">
                What&rsquo;s getting in the way?
              </h1>
              <p className="text-[15px] leading-relaxed text-[#6A706A]">
                No pressure — this helps us send you the right help.
              </p>
            </header>

            {/* Options */}
            <RadioGroup
              value={selected ?? ""}
              onValueChange={(v) => setSelected(v as BlockerType)}
              className="gap-2.5"
            >
              {BLOCKER_OPTIONS.map((opt) => {
                const isSelected = selected === opt.id;
                const Icon = opt.icon;
                return (
                  <Label
                    key={opt.id}
                    htmlFor={`blocker-${opt.id}`}
                    className={cn(
                      "flex min-h-[56px] cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200",
                      isSelected
                        ? "border-[#147D68] bg-[#F4FBF8]"
                        : "border-[#E3E5DF] bg-white hover:border-[#CFD2CB] hover:bg-[#F8F8F5]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-[#E8F5EF] text-[#147D68]"
                          : "bg-[#F4F4F1] text-[#6A706A]"
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="flex-1 text-[16px] font-medium leading-snug text-[#171A17]">
                      {opt.label}
                    </span>
                    <RadioGroupItem
                      id={`blocker-${opt.id}`}
                      value={opt.id}
                      className={cn(
                        "size-5 border-2",
                        isSelected
                          ? "border-[#147D68] text-[#147D68]"
                          : "border-[#CFD2CB] text-transparent"
                      )}
                    />
                  </Label>
                );
              })}
            </RadioGroup>

            {/* Optional note */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="blocker-note"
                className="text-[14px] font-medium text-[#6A706A]"
              >
                Anything else?{" "}
                <span className="text-[#9CA39C]">(optional)</span>
              </Label>
              <Textarea
                id="blocker-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Share anything that would help us support you."
                rows={3}
                className="min-h-[88px] rounded-xl border-[#E3E5DF] bg-white text-[15px] text-[#171A17] placeholder:text-[#9CA39C] focus-visible:border-[#147D68] focus-visible:ring-[#147D68]/20"
              />
            </div>

            {/* Submit */}
            <Button
              size="lg"
              disabled={!selected}
              onClick={() => setSubmitted(true)}
              className="h-12 w-full rounded-xl bg-[#147D68] text-[15px] font-medium text-white shadow-sm hover:bg-[#127060] disabled:bg-[#147D68]/40 disabled:text-white/80"
            >
              Share feedback
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="confirmation"
            {...fadeSlide}
            className="flex flex-col items-center gap-5 pt-2 text-center"
          >
            {/* Checkmark */}
            <div className="flex size-16 items-center justify-center rounded-full bg-[#E8F5EF]">
              <CheckCircle2 className="size-9 text-[#27966A]" />
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[#171A17]">
                Thanks for sharing that, {STUDENT_FIRST_NAME}.
              </h1>
              {selectedOption && (
                <p className="mx-auto max-w-sm text-[16px] leading-relaxed text-[#6A706A]">
                  {selectedOption.confirmation}
                </p>
              )}
            </div>

            <Card className="mt-2 w-full gap-4 rounded-2xl border-[#E3E5DF] bg-white p-5 text-left shadow-[0_1px_3px_rgba(23,26,23,0.04)]">
              <Button
                size="lg"
                asChild
                className="h-12 w-full rounded-xl bg-[#147D68] text-[15px] font-medium text-white shadow-sm hover:bg-[#127060]"
              >
                <Link href="/student-rescue">Back to course</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-11 w-full rounded-xl text-[15px] font-medium text-[#6A706A] hover:bg-[#F0F2EC] hover:text-[#171A17]"
                onClick={() => {
                  // In production this would schedule a reminder.
                  // For now, simply return to the main screen.
                  window.location.href = "/student-rescue";
                }}
              >
                Remind me tomorrow
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
