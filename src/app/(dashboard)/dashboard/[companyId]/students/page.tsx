"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const MEMBERS = [
  { name: "Maya Thompson", course: "Agency Growth System", membership: "Active", progress: 68, lastActivity: "8 days ago", status: "Needs attention", intervention: "Mid-course stall", response: "Continue course", suppressed: false },
  { name: "Devon Park", course: "Agency Growth System", membership: "Active", progress: 45, lastActivity: "14 days ago", status: "Needs attention", intervention: "Renewal review", response: "Pending", suppressed: false },
  { name: "Sara Klein", course: "Agency Growth System", membership: "Active", progress: 0, lastActivity: "21 days ago", status: "Needs attention", intervention: "Never started", response: "None", suppressed: false },
  { name: "Jamal Wright", course: "Agency Growth System", membership: "Active", progress: 52, lastActivity: "3 days ago", status: "Responded", intervention: "Follow-up", response: "Continue course", suppressed: false },
  { name: "Aisha Patel", course: "Freelance Foundations", membership: "Active", progress: 89, lastActivity: "1 hour ago", status: "Active", intervention: "None", response: "None", suppressed: false },
  { name: "Marcus Chen", course: "Agency Growth System", membership: "Active", progress: 34, lastActivity: "5 days ago", status: "Needs attention", intervention: "Early stall", response: "Pending", suppressed: false },
  { name: "Priya Sharma", course: "Client Breakthrough", membership: "Active", progress: 72, lastActivity: "2 hours ago", status: "Active", intervention: "None", response: "None", suppressed: false },
  { name: "Alex Kim", course: "Agency Growth System", membership: "Active", progress: 15, lastActivity: "10 days ago", status: "Paused reminders", intervention: "Early stall", response: "Stop reminders", suppressed: true },
  { name: "Jordan Lee", course: "Freelance Foundations", membership: "Cancelled", progress: 56, lastActivity: "30 days ago", status: "Needs attention", intervention: "Cancellation review", response: "None", suppressed: false },
  { name: "Taylor Brown", course: "Agency Growth System", membership: "Active", progress: 95, lastActivity: "30 min ago", status: "Active", intervention: "None", response: "None", suppressed: false },
];

const FILTERS = ["All", "Needs attention", "Active", "Responded", "Paused reminders"];

export default function MembersPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = MEMBERS.filter((m) => {
    if (filter === "All") return true;
    if (filter === "Needs attention") return m.status === "Needs attention";
    if (filter === "Active") return m.status === "Active";
    if (filter === "Responded") return m.status === "Responded";
    if (filter === "Paused reminders") return m.status === "Paused reminders";
    return true;
  }).filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Members</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">{MEMBERS.length} students across all courses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className="rounded-[6px] text-[11px]"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
        <div className="ml-auto">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[200px] rounded-[6px] text-[12px]"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                {["Student", "Course", "Membership", "Progress", "Last Activity", "Status", "Intervention", "Response"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-[var(--ink-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={i} className="border-b border-[var(--hairline)] last:border-0 hover:bg-[var(--canvas)]/50">
                  <td className="px-4 py-3 font-medium text-[var(--ink-primary)]">
                    {m.name}
                    {m.suppressed && <Badge variant="outline" className="ml-2 rounded-[3px] text-[9px]">Opted out</Badge>}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-secondary)]">{m.course}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="rounded-[3px] text-[10px]">{m.membership}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-[var(--canvas)]">
                        <div className="h-full rounded-full bg-[var(--recovery-green)]" style={{ width: `${m.progress}%` }} />
                      </div>
                      <span className="text-[var(--ink-muted)]">{m.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">{m.lastActivity}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`rounded-[3px] text-[9px] ${
                        m.status === "Needs attention" ? "border-[var(--warning)]/30 text-[var(--warning)]" :
                        m.status === "Active" ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]" :
                        m.status === "Responded" ? "border-[var(--info)]/30 text-[var(--info)]" :
                        "border-[var(--ink-muted)]/30 text-[var(--ink-muted)]"
                      }`}
                    >
                      {m.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-secondary)]">{m.intervention}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">{m.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
