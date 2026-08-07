"use client";

import { Card } from "@/components/ui/card";
import { DEMO_OUTCOMES } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

const classificationMeta: Record<string, { label: string; color: string; icon: string }> = {
  confirmed_recovered: { label: "Confirmed recovered", color: "border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]", icon: "✓" },
  strongly_associated: { label: "Strongly associated", color: "border-[var(--info)]/30 bg-[#E8F0FE] text-[var(--info)]", icon: "→" },
  observed: { label: "Observed", color: "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]", icon: "○" },
  estimated_opportunity: { label: "Estimated opportunity", color: "border-[var(--warning)]/30 bg-[var(--warning-light)] text-[var(--warning)]", icon: "~" },
};

export function DemoOutcomesSection() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] text-[var(--ink-secondary)]">
          Evidence-first outcome classification. Tiers are not summed. Do not call estimated opportunity &quot;recovered value.&quot;
        </p>
      </div>

      {/* Classification legend */}
      <ScrollReveal delay={0}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(classificationMeta).map(([key, meta]) => (
            <span key={key} className={cn("inline-flex items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-[11px] font-medium", meta.color)}>
              <span className="text-[13px]">{meta.icon}</span>
              {meta.label}
            </span>
          ))}
        </div>
      </ScrollReveal>

      {/* Confirmed recovered value note */}
      <ScrollReveal delay={0.1}>
        <Card className="border border-[var(--hairline)] bg-[var(--surface)] px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Confirmed recovered value
          </p>
          <p className="mt-2 font-serif text-[56px] leading-none text-[var(--ink-primary)]">$0</p>
          <p className="mt-3 text-[12px] italic text-[var(--ink-muted)]">
            All values explicitly illustrative — no real customer data is connected
          </p>
        </Card>
      </ScrollReveal>

      {/* Outcome cards */}
      <ScrollReveal delay={0.15}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {DEMO_OUTCOMES.map((outcome) => {
            const meta = classificationMeta[outcome.classification];
            return (
              <Card key={outcome.id} className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden card-enhanced">
                <header className="border-b border-[var(--hairline)] px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-medium text-[var(--ink-primary)]">{outcome.student}</span>
                    <span className={cn("rounded-[2px] border px-2 py-0.5 text-[10px] font-medium", meta.color)}>
                      {meta.label}
                    </span>
                  </div>
                </header>
                <div className="px-5 py-3">
                  <p className="text-[13px] text-[var(--ink-primary)]">{outcome.description}</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {outcome.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--ink-secondary)]">
                        <span className="mt-[6px] size-1 shrink-0 rounded-full bg-[var(--ink-muted)]" />
                        {ev}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">{outcome.date}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollReveal>
    </div>
  );
}
