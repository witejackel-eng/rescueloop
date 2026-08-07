"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, TrendingUp, Eye } from "lucide-react";

const OUTCOMES = [
  { classification: "Confirmed recovered value", value: "$0", description: "No auditable monetary reversal events in this period", icon: CheckCircle2, color: "text-[var(--recovery-green)]" },
  { classification: "Strongly associated", value: "8 students", description: "Students who resumed course activity after intervention (non-monetary engagement/outcome count)", icon: TrendingUp, color: "text-[var(--info)]" },
  { classification: "Observed", value: "12 events", description: "RescueLoop observed return-to-activity events where students engaged after outreach", icon: Eye, color: "text-[var(--ink-secondary)]" },
  { classification: "Estimated opportunity", value: "4 students", description: "Modeled estimate of students who may re-engage based on historical patterns — separate modelled context", icon: BarChart3, color: "text-[var(--ink-muted)]" },
];

export default function OutcomesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Outcomes</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Evidence-tiered recovery attribution</p>
      </div>

      <Card className="rounded-[8px] border border-[var(--warning)]/20 bg-[var(--warning-light)]/30 p-4">
        <p className="text-[12px] text-[var(--warning)]">
          Evidence tiers are never summed. Estimated opportunity is not labeled as recovered revenue. Confirmed recovery requires an auditable reversal event.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {OUTCOMES.map((o, i) => (
          <Card key={i} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-3">
              <o.icon className={`size-5 ${o.color}`} />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">{o.classification}</span>
                <p className={`mt-1 font-serif text-[24px] ${o.color}`}>{o.value}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-[var(--ink-secondary)]">{o.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
