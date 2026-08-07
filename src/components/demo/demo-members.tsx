"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_MEMBERS, type DemoMember } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";

type Filter = "all" | "needs_attention" | "active" | "responded" | "paused_reminders";

export function DemoMembersSection() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = DEMO_MEMBERS.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  const selected = selectedId ? DEMO_MEMBERS.find((m) => m.id === selectedId) ?? null : null;

  const membershipColor = (s: string) => {
    switch (s) {
      case "active": return "bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]";
      case "trialing": return "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]";
      case "cancelling": return "bg-[#F4E8E6] text-[#C64D45] border-[#E8C9C5]";
      case "cancelled": return "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]";
      default: return "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]";
    }
  };

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "needs_attention", label: "Needs attention" },
    { value: "active", label: "Active" },
    { value: "responded", label: "Responded" },
    { value: "paused_reminders", label: "Paused reminders" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition-colors",
              filter === f.value
                ? "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-primary)] shadow-[0_1px_2px_rgba(17,17,15,0.06)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
            )}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="ml-1.5 font-mono tabular-nums text-[10px]">
                {DEMO_MEMBERS.filter((m) => m.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Table */}
        <div className="min-w-0 flex-1">
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                    <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Student</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Membership</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Progress</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Last activity</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Intervention</th>
                    <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id === selectedId ? null : m.id)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-[var(--canvas-elevated)]",
                        m.id === selectedId && "bg-[var(--surface)]",
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                            <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[10px] font-medium text-[var(--ink-primary)]">
                              {m.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] text-[var(--ink-primary)]">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={cn("rounded-[2px] border px-1.5 py-0 text-[10px] font-medium", membershipColor(m.membership))}>
                          {m.membership}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-[3px] w-16 overflow-hidden bg-[var(--hairline)]">
                            <div className="h-full bg-[var(--recovery-green)]" style={{ width: `${m.progress}%` }} />
                          </div>
                          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">{m.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">{m.lastActivity}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] text-[var(--ink-secondary)]">{m.lastIntervention ?? "—"}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-medium",
                          m.status === "needs_attention" && "border-[var(--warning)]/30 bg-[var(--warning-light)] text-[var(--warning)]",
                          m.status === "active" && "border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]",
                          m.status === "responded" && "border-[var(--info)]/30 bg-[#E8F0FE] text-[var(--info)]",
                          m.status === "paused_reminders" && "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]",
                        )}>
                          {m.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-[320px] lg:shrink-0">
            <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
              <header className="border-b border-[var(--hairline)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                    <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[12px] font-medium text-[var(--ink-primary)]">
                      {selected.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">{selected.name}</h3>
                    <p className="text-[12px] text-[var(--ink-muted)]">{selected.course}</p>
                  </div>
                </div>
              </header>
              <div className="divide-y divide-[var(--hairline)]">
                <div className="px-5 py-3 flex justify-between">
                  <span className="text-[12px] text-[var(--ink-muted)]">Membership</span>
                  <Badge className={cn("rounded-[2px] border px-1.5 py-0 text-[10px] font-medium", membershipColor(selected.membership))}>
                    {selected.membership}
                  </Badge>
                </div>
                <div className="px-5 py-3 flex justify-between">
                  <span className="text-[12px] text-[var(--ink-muted)]">Progress</span>
                  <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">{selected.progress}%</span>
                </div>
                <div className="px-5 py-3 flex justify-between">
                  <span className="text-[12px] text-[var(--ink-muted)]">Last activity</span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">{selected.lastActivity}</span>
                </div>
                <div className="px-5 py-3">
                  <span className="text-[12px] text-[var(--ink-muted)]">Last intervention</span>
                  <p className="mt-1 text-[13px] text-[var(--ink-primary)]">{selected.lastIntervention ?? "None"}</p>
                </div>
                <div className="px-5 py-3">
                  <span className="text-[12px] text-[var(--ink-muted)]">Last response</span>
                  <p className="mt-1 text-[13px] text-[var(--ink-primary)]">{selected.lastResponse ?? "None"}</p>
                </div>
                <div className="px-5 py-3 flex justify-between">
                  <span className="text-[12px] text-[var(--ink-muted)]">Suppressed / opt-out</span>
                  <span className={cn("text-[12px]", selected.suppressed ? "text-[var(--critical)]" : "text-[var(--ink-primary)]")}>
                    {selected.suppressed ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
