"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href?: string;
  ctaLabel: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "connect-whop",
    title: "Connect Whop",
    description: "Sync members and course progress automatically.",
    href: "/dashboard/co_cgl/settings",
    ctaLabel: "Connect",
  },
  {
    id: "review-queue",
    title: "Review your rescue queue",
    description: "Approve or dismiss at least 3 student interventions.",
    href: "/dashboard/co_cgl/rescue-queue",
    ctaLabel: "Open queue",
  },
  {
    id: "enable-playbook",
    title: "Enable your first playbook",
    description: "Activate automation for never-started or stalling students.",
    href: "/dashboard/co_cgl/playbooks",
    ctaLabel: "View playbooks",
  },
  {
    id: "invite-team",
    title: "Invite a teammate",
    description: "Bring in a collaborator to share review load.",
    ctaLabel: "Invite",
  },
  {
    id: "check-insights",
    title: "Review course insights",
    description: "See which lessons cause the most friction.",
    href: "/dashboard/co_cgl/insights",
    ctaLabel: "Open insights",
  },
];

export function OnboardingChecklist({ basePath }: { basePath: string }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(["connect-whop"]));
  const [dismissed, setDismissed] = useState(false);

  const toggleStep = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        toast.success("Step completed", {
          description: "Great work — your rescue setup is growing stronger.",
        });
      }
      return next;
    });
  };

  if (dismissed) return null;

  const progress = Math.round((completed.size / ONBOARDING_STEPS.length) * 100);
  const allDone = completed.size === ONBOARDING_STEPS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-[10px] border border-[var(--hairline)] bg-gradient-to-br from-[var(--surface)] to-[var(--canvas-elevated)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--hairline)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[8px] bg-[var(--recovery-green)]/10">
            <Sparkles className="size-4 text-[var(--recovery-green)]" />
          </div>
          <div>
            <h3 className="font-serif text-[15px] text-[var(--ink-primary)]">
              {allDone ? "Setup complete" : "Get started with RescueLoop"}
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              {allDone
                ? "You're all set — your rescue system is fully configured."
                : `${completed.size} of ${ONBOARDING_STEPS.length} steps completed · ${progress}% done`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-[6px] p-1 text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas)] hover:text-[var(--ink-secondary)]"
          aria-label="Dismiss checklist"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-[var(--hairline)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "h-full transition-colors",
            allDone ? "bg-[var(--recovery-green)]" : "bg-[var(--info)]"
          )}
        />
      </div>

      {/* Steps */}
      <ul className="divide-y divide-[var(--hairline-subtle)]">
        <AnimatePresence>
          {ONBOARDING_STEPS.map((step, i) => {
            const isDone = completed.has(step.id);
            return (
              <motion.li
                key={step.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--canvas)]/50"
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className="shrink-0"
                  aria-label={isDone ? `Mark "${step.title}" as incomplete` : `Mark "${step.title}" as complete`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-5 text-[var(--recovery-green)] transition-transform hover:scale-110" />
                  ) : (
                    <Circle className="size-5 text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-secondary)]" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13px] font-medium transition-colors",
                      isDone
                        ? "text-[var(--ink-muted)] line-through"
                        : "text-[var(--ink-primary)]"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{step.description}</p>
                </div>
                {step.href && !isDone && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-[11px] text-[var(--ink-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Link href={`${basePath}${step.href.replace("/dashboard/co_cgl", "")}`}>
                      {step.ctaLabel}
                      <ChevronRight className="ml-0.5 size-3" />
                    </Link>
                  </Button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {allDone && (
        <div className="border-t border-[var(--hairline)] bg-[var(--recovery-green)]/5 px-5 py-3 text-center">
          <p className="text-[12px] font-medium text-[var(--recovery-green)]">
            🎉 All set — your rescue system is fully configured.
          </p>
        </div>
      )}
    </motion.div>
  );
}
