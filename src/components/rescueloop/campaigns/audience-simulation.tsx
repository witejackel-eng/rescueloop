"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Users, X } from "lucide-react";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { SegmentedControl } from "@/components/interaction/segmented-control";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PRODUCT, STUDENTS } from "@/lib/mock-data";
import type { CampaignRules, Student } from "@/lib/types";

interface AudienceStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  hint?: string;
}

interface AudienceSimulationProps {
  rules: CampaignRules;
  baselineRules: CampaignRules;
}

export function AudienceSimulation({
  rules,
  baselineRules,
}: AudienceSimulationProps) {
  const [compare, setCompare] = useState<"proposed" | "compare">("proposed");
  const [sheetOpen, setSheetOpen] = useState(false);

  const proposed = useMemo(() => computeStats(rules), [rules]);
  const baseline = useMemo(() => computeStats(baselineRules), [baselineRules]);

  const newlyIncluded = Math.max(0, proposed.eligible - baseline.eligible);
  const newlyExcluded = Math.max(0, baseline.eligible - proposed.eligible);

  const stats: AudienceStat[] = [
    { label: "Eligible members", value: proposed.eligible, hint: "Matching all rule clauses" },
    {
      label: "Newly included",
      value: newlyIncluded,
      prefix: newlyIncluded > 0 ? "+" : "",
      hint: "Vs currently published rule",
    },
    {
      label: "Newly excluded",
      value: newlyExcluded,
      prefix: newlyExcluded > 0 ? "−" : "",
      hint: "Vs currently published rule",
    },
    { label: "Messages expected this week", value: proposed.messagesThisWeek },
    { label: "Members excluded by cooldown", value: proposed.excludedByCooldown },
    { label: "Members near renewal", value: proposed.nearRenewal },
    {
      label: "Membership value represented",
      value: proposed.membershipValue,
      prefix: "$",
      hint: `Eligible × $${PRODUCT.price}/mo`,
    },
  ];

  const affectedStudents = useMemo(
    () => pickAffectedStudents(rules),
    [rules],
  );

  return (
    <section className="flex flex-col">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">
          Audience simulation
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Live preview
        </span>
      </div>

      {/* Scenario comparison toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-5 py-3">
        <div className="min-w-0">
          <p className="text-[12px] text-[var(--ink-secondary)]">
            Compare to current rule
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
            See who would change if you publish
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Scenario comparison"
          size="sm"
          value={compare}
          onChange={(v) => setCompare(v)}
          segments={[
            { value: "proposed", label: "Proposed" },
            { value: "compare", label: "Compare" },
          ]}
        />
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        {stats.map((stat, idx) => (
          <StatRow
            key={stat.label}
            stat={stat}
            compare={compare === "compare"}
            baselineValue={baselineStat(baseline, idx)}
          />
        ))}
      </div>

      {/* Preview affected students */}
      <div className="border-t border-[var(--hairline)] px-5 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSheetOpen(true)}
          className="h-9 w-full justify-center gap-2 rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[13px] text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]"
        >
          <Users className="size-3.5" />
          Preview affected students
        </Button>
        <p className="mt-2 text-center text-[11px] text-[var(--ink-muted)]">
          Sample of {affectedStudents.length} members matching the proposed rule
        </p>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="rounded-none border-l border-[var(--hairline)] bg-[var(--canvas)] p-0 sm:max-w-md"
        >
          <SheetHeader className="flex-row items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
            <SheetTitle className="font-serif text-[18px] text-[var(--ink-primary)]">
              Affected students
            </SheetTitle>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {affectedStudents.map((s) => {
              const cs = s.courseStates[0];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--canvas-elevated)] font-mono text-[11px] uppercase text-[var(--ink-secondary)]">
                      {s.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-[var(--ink-primary)]">
                        {s.name}
                      </p>
                      <p className="truncate text-[11px] text-[var(--ink-muted)]">
                        {cs?.currentLessonTitle ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div>
                      <p className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                        {cs?.progressPercent ?? 0}
                        <span className="text-[var(--ink-muted)]">%</span>
                      </p>
                      <p className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                        {cs?.daysInactive ?? 0}d idle
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 text-[var(--ink-muted)]" />
                  </div>
                </div>
              );
            })}
            {affectedStudents.length === 0 && (
              <div className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]">
                No students match this rule.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

// ── Stat row (handles both proposed-only and compare modes) ────

function StatRow({
  stat,
  compare,
  baselineValue,
}: {
  stat: AudienceStat;
  compare: boolean;
  baselineValue: number;
}) {
  const diff = stat.value - baselineValue;
  const showDiff = compare && diff !== 0;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline-subtle)] px-5 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--ink-secondary)]">{stat.label}</p>
        {stat.hint && (
          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{stat.hint}</p>
        )}
        {showDiff && (
          <p
            className={cn(
              "mt-0.5 font-mono text-[11px] tabular-nums",
              diff > 0 ? "text-[var(--recovery-green)]" : "text-[var(--critical)]",
            )}
          >
            {diff > 0 ? "+" : "−"}
            {Math.abs(diff)} vs current
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-baseline gap-3">
        {compare && (
          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              Current
            </span>
            <AnimatedCounter
              value={baselineValue}
              prefix={stat.prefix}
              suffix={stat.suffix}
              decimals={stat.decimals ?? 0}
              className="text-[14px] text-[var(--ink-muted)]"
              duration={0.6}
            />
          </div>
        )}
        {compare && (
          <span className="font-mono text-[10px] text-[var(--ink-muted)]">→</span>
        )}
        <div className={cn("flex flex-col items-end", !compare && "items-end")}>
          {compare && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              Proposed
            </span>
          )}
          <AnimatedCounter
            value={stat.value}
            prefix={stat.prefix}
            suffix={stat.suffix}
            decimals={stat.decimals ?? 0}
            className={cn(
              "text-[18px] text-[var(--ink-primary)]",
              showDiff &&
                (diff > 0
                  ? "text-[var(--recovery-green)]"
                  : "text-[var(--critical)]"),
            )}
            duration={0.6}
          />
        </div>
      </div>
    </div>
  );
}

// ── Stat computation (deterministic, per spec) ──────────────────

interface Stats {
  eligible: number;
  messagesThisWeek: number;
  excludedByCooldown: number;
  nearRenewal: number;
  membershipValue: number;
}

function computeStats(rules: CampaignRules, totalStudents = 742): Stats {
  const eligible = computeEligible(rules, totalStudents);
  return {
    eligible,
    messagesThisWeek: Math.round(eligible * 0.4),
    excludedByCooldown: Math.round(eligible * 0.18),
    nearRenewal: Math.round(eligible * 0.12),
    membershipValue: eligible * PRODUCT.price,
  };
}

function computeEligible(rules: CampaignRules, totalStudents = 742): number {
  const span = Math.max(0, rules.progressMax - rules.progressMin);
  // Treat a 0-width band (e.g. 0% – 0%) as "students at exactly that progress"
  // — roughly 5% of the cohort. Otherwise use the band width directly.
  const width = span === 0 ? 5 : span;
  // Inactivity adds a small multiplier (0.8 → 1.2) so widening the window
  // visibly moves the number.
  const inactivityFactor =
    0.8 + (Math.min(rules.inactivityDaysMin, 30) / 30) * 0.4;
  // Membership status filter trims the audience further.
  const statusFactor =
    rules.membershipStatuses.length === 0
      ? 0.1
      : Math.min(rules.membershipStatuses.length / 4, 1);
  return Math.round(
    (totalStudents * width * 0.6 * inactivityFactor * statusFactor) / 100,
  );
}

function baselineStat(baseline: Stats, idx: number): number {
  const arr = [
    baseline.eligible,
    0, // newly included — baseline is always 0
    0, // newly excluded — baseline is always 0
    baseline.messagesThisWeek,
    baseline.excludedByCooldown,
    baseline.nearRenewal,
    baseline.membershipValue,
  ];
  return arr[idx] ?? 0;
}

// ── Sample affected students ───────────────────────────────────

function pickAffectedStudents(rules: CampaignRules, limit = 6): Student[] {
  const matches = STUDENTS.filter((s) => matchesRule(s, rules));
  if (matches.length >= limit) return matches.slice(0, limit);
  // Fall back to filling with the next students that don't match, so the
  // sheet always shows a representative sample.
  const filler = STUDENTS.filter((s) => !matchesRule(s, rules));
  return [...matches, ...filler].slice(0, limit);
}

function matchesRule(s: Student, rules: CampaignRules): boolean {
  const cs = s.courseStates[0];
  if (!cs) return false;
  const progress = cs.progressPercent;
  // 0–0 band means "exactly 0% progress".
  const inBand =
    rules.progressMin === 0 && rules.progressMax === 0
      ? progress === 0
      : progress >= rules.progressMin && progress <= rules.progressMax;
  if (!inBand) return false;
  if (cs.daysInactive < rules.inactivityDaysMin) return false;
  if (
    rules.membershipStatuses.length > 0 &&
    !rules.membershipStatuses.includes(s.membership.status)
  ) {
    return false;
  }
  if (s.excluded) return false;
  return true;
}
