"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sliders, Users, Send, ShieldOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeReveal, motionTokens } from "@/design-system/motion";
import { ScrollReveal } from "@/components/marketing/shared/scroll-reveal";
import { SectionEyebrow } from "@/components/marketing/shared/section-eyebrow";
import { Slider } from "@/components/ui/slider";

// ── Rule computation ────────────────────────────────────────

interface RuleStats {
  eligibleMembers: number;
  expectedInterventions: number;
  excludedByCooldown: number;
  nearRenewal: number;
  membershipValue: number;
}

const TOTAL_STUDENTS = 742;
const PRODUCT_PRICE = 79;

function computeStats(inactivityThreshold: number): RuleStats {
  // Progress band: 20%–80% covers ~60% of the student population
  const progressBand = 0.6;
  // Inactivity threshold factor: more days = more students included
  // At 7 days, roughly 47% of in-band students qualify
  // Scales with threshold to create visible movement
  const inactivityFactor = 0.25 + (inactivityThreshold / 30) * 0.55;
  const eligible = Math.round(TOTAL_STUDENTS * progressBand * inactivityFactor);
  const excludedByCooldown = Math.round(eligible * 0.18);
  const nearRenewal = Math.round(eligible * 0.12);

  return {
    eligibleMembers: eligible,
    expectedInterventions: Math.round(eligible * 0.4),
    excludedByCooldown,
    nearRenewal,
    membershipValue: eligible * PRODUCT_PRICE,
  };
}

// ── Component ───────────────────────────────────────────────

export function PlaybookMoment() {
  const reduced = useReducedMotion();
  const [inactivityThreshold, setInactivityThreshold] = useState(7);
  const [progressMin] = useState(20);
  const [progressMax] = useState(80);

  const stats = useMemo(
    () => computeStats(inactivityThreshold),
    [inactivityThreshold],
  );

  const baselineStats = useMemo(() => computeStats(7), []);

  return (
    <section
      id="playbook-moment"
      className="border-t border-[var(--hairline)] bg-[var(--section-recovery-tint)] py-20 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal>
          <SectionEyebrow>Playbook</SectionEyebrow>
          <h2 className="mt-6 max-w-[28ch] font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
            Define the rule.{" "}
            <span className="italic text-[var(--ink-secondary)]">
              See who qualifies.
            </span>
          </h2>
          <p className="mt-6 max-w-[56ch] text-[15px] leading-relaxed text-[var(--ink-secondary)] lg:text-[16px]">
            Adjust a single threshold and watch the audience update instantly. You
            always see exactly who would receive an intervention — before anything
            is sent.
          </p>
        </ScrollReveal>

        {/* Product surface */}
        <ScrollReveal delay={0.15}>
          <div className="mt-14 border border-[var(--hairline)] bg-[var(--surface)] shadow-sm">
            {/* Rule builder header */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-3.5 text-[var(--ink-secondary)]" />
                <span className="font-serif text-[16px] text-[var(--ink-primary)]">
                  Rescue rule
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--recovery-green)]">
                Editing · not yet published
              </span>
            </div>

            {/* Rule clauses */}
            <div className="border-b border-[var(--hairline)]">
              {/* Clause 1: Progress band */}
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-none border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] font-mono text-[10px] text-[var(--recovery-green)]">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-[var(--ink-primary)]">
                    Progress between{" "}
                    <span className="font-mono tabular-nums text-[var(--recovery-green)]">
                      {progressMin}%
                    </span>{" "}
                    and{" "}
                    <span className="font-mono tabular-nums text-[var(--recovery-green)]">
                      {progressMax}%
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--ink-muted)]">
                    Catches mid-course students — not never-starters, not completers.
                  </div>
                </div>
              </div>

              {/* Clause 2: Inactivity — interactive */}
              <div className="flex items-start gap-4 border-t border-[var(--hairline-subtle)] px-5 py-4">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-none border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] font-mono text-[10px] text-[var(--recovery-green)]">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-[var(--ink-primary)]">
                    Inactive{" "}
                    <span className="font-mono tabular-nums text-[var(--recovery-green)]">
                      {inactivityThreshold}+
                    </span>{" "}
                    days
                  </div>
                  <div className="mt-3">
                    <Slider
                      value={[inactivityThreshold]}
                      onValueChange={(v) => setInactivityThreshold(v[0])}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full max-w-[320px]"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)]">
                      <span>1 day</span>
                      <span>30 days</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[12px] text-[var(--ink-muted)]">
                    Drag to widen or narrow the inactivity window. Eligibility updates
                    in real time.
                  </div>
                </div>
              </div>

              {/* Clause 3: Membership status */}
              <div className="flex items-start gap-4 border-t border-[var(--hairline-subtle)] px-5 py-4">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-none border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] font-mono text-[10px] text-[var(--recovery-green)]">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-[var(--ink-primary)]">
                    Membership status is{" "}
                    <span className="font-mono text-[var(--recovery-green)]">active</span>{" "}
                    or{" "}
                    <span className="font-mono text-[var(--recovery-green)]">trialing</span>
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--ink-muted)]">
                    Excludes cancelled and paused members automatically.
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility summary */}
            <div className="border-b border-[var(--hairline)]">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Eligibility preview
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  Based on {TOTAL_STUDENTS} enrolled students
                </span>
              </div>

              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<Users className="size-3.5" />}
                  label="Eligible members"
                  value={stats.eligibleMembers}
                  changed={stats.eligibleMembers !== baselineStats.eligibleMembers}
                  positive={stats.eligibleMembers > baselineStats.eligibleMembers}
                />
                <StatCard
                  icon={<Send className="size-3.5" />}
                  label="Expected interventions"
                  value={stats.expectedInterventions}
                  changed={
                    stats.expectedInterventions !== baselineStats.expectedInterventions
                  }
                  positive={
                    stats.expectedInterventions > baselineStats.expectedInterventions
                  }
                />
                <StatCard
                  icon={<ShieldOff className="size-3.5" />}
                  label="Excluded by cooldown"
                  value={stats.excludedByCooldown}
                  changed={false}
                  positive={false}
                />
                <StatCard
                  icon={<Clock className="size-3.5" />}
                  label="Near renewal"
                  value={stats.nearRenewal}
                  changed={stats.nearRenewal !== baselineStats.nearRenewal}
                  positive={false}
                />
              </div>
            </div>

            {/* Footer — clear "nothing sent yet" message */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--recovery-green)]" />
                <span className="text-[12px] text-[var(--ink-secondary)]">
                  Nothing will be sent until you publish this rule
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                ${stats.membershipValue}/mo represented
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Stat card ───────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  changed,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  changed: boolean;
  positive: boolean;
}) {
  return (
    <div className="border-t border-[var(--hairline-subtle)] px-5 py-4 sm:border-t-0 sm:border-l first:sm:border-l-0 lg:py-3">
      <div className="flex items-center gap-1.5 text-[var(--ink-muted)]">
        {icon}
        <span className="text-[12px]">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono text-[24px] tabular-nums leading-none text-[var(--ink-primary)]"
        >
          {value}
        </motion.span>
        {changed && (
          <span
            className={cn(
              "font-mono text-[10px] tabular-nums",
              positive ? "text-[var(--recovery-green)]" : "text-[var(--critical)]",
            )}
          >
            {positive ? "↑" : "↓"} vs 7d threshold
          </span>
        )}
      </div>
    </div>
  );
}
