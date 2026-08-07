"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_RESPONSES } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";

const responseColor = (r: string) => {
  switch (r) {
    case "Continue course": return "border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]";
    case "I need help": return "border-[var(--warning)]/30 bg-[var(--warning-light)] text-[var(--warning)]";
    case "I'm blocked": return "border-[var(--critical)]/30 bg-[var(--critical-light)] text-[var(--critical)]";
    case "Stop reminders": return "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]";
    default: return "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]";
  }
};

export function DemoResponsesSection() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-[var(--ink-secondary)]">
        Student responses to RescueLoop interventions. All data illustrative.
      </p>
      <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Timestamp</th>
                <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Student</th>
                <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Course</th>
                <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Response</th>
                <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {DEMO_RESPONSES.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--canvas-elevated)] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">{r.timestamp}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[13px] text-[var(--ink-primary)]">{r.student}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[12px] text-[var(--ink-secondary)]">{r.course}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={cn("rounded-[2px] border px-2 py-0.5 text-[11px] font-medium", responseColor(r.response))}>
                      {r.response}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[12px] text-[var(--ink-secondary)]">{r.followUpState}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
