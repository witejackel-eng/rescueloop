"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Search, ArrowRight } from "lucide-react";
import { useState } from "react";

const ORGS = [
  { id: "org_001", name: "Creator Growth Lab", plan: "Growth", members: 742, health: "healthy", lastSync: "2 min ago", whopConnected: true, queueDepth: 3, deadLetters: 0 },
  { id: "org_002", name: "Fitness Mastery", plan: "Rescue", members: 198, health: "healthy", lastSync: "5 min ago", whopConnected: true, queueDepth: 1, deadLetters: 0 },
  { id: "org_003", name: "Design Academy Pro", plan: "Scale", members: 2100, health: "degraded", lastSync: "45 min ago", whopConnected: true, queueDepth: 12, deadLetters: 2 },
  { id: "org_004", name: "Music Production Hub", plan: "Growth", members: 534, health: "healthy", lastSync: "1 min ago", whopConnected: true, queueDepth: 0, deadLetters: 0 },
  { id: "org_005", name: "Coding Bootcamp Elite", plan: "Scale", members: 1800, health: "unhealthy", lastSync: "2 hours ago", whopConnected: false, queueDepth: 45, deadLetters: 8 },
  { id: "org_006", name: "Photography Masterclass", plan: "Rescue", members: 89, health: "healthy", lastSync: "8 min ago", whopConnected: true, queueDepth: 2, deadLetters: 0 },
  { id: "org_007", name: "Business Strategy Group", plan: "Growth", members: 421, health: "degraded", lastSync: "30 min ago", whopConnected: true, queueDepth: 7, deadLetters: 1 },
  { id: "org_008", name: "Language Learning Plus", plan: "Rescue", members: 156, health: "healthy", lastSync: "3 min ago", whopConnected: true, queueDepth: 0, deadLetters: 0 },
];

export default function InternalOrgsPage() {
  const [search, setSearch] = useState("");

  const filtered = ORGS.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Organizations</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">{ORGS.length} tenants</p>
      </div>

      <Input
        placeholder="Search organizations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 w-[300px] rounded-[6px] text-[12px]"
      />

      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                {["Organization", "Plan", "Members", "Health", "Last Sync", "Queue", "Dead Letters"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-[var(--ink-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr key={org.id} className="border-b border-[var(--hairline)] last:border-0 hover:bg-[var(--canvas)]/50">
                  <td className="px-4 py-3">
                    <Link href={`/internal/orgs/${org.id}`} className="font-medium text-[var(--ink-primary)] hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="rounded-[3px] text-[10px]">{org.plan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-secondary)]">{org.members.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {org.health === "healthy" ? (
                      <span className="flex items-center gap-1 text-[var(--recovery-green)]">
                        <CheckCircle2 className="size-3" /> Healthy
                      </span>
                    ) : org.health === "degraded" ? (
                      <span className="flex items-center gap-1 text-[var(--warning)]">
                        <AlertCircle className="size-3" /> Degraded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[var(--critical)]">
                        <AlertCircle className="size-3" /> Unhealthy
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">{org.lastSync}</td>
                  <td className="px-4 py-3 text-[var(--ink-secondary)]">{org.queueDepth}</td>
                  <td className="px-4 py-3">
                    {org.deadLetters > 0 ? (
                      <span className="text-[var(--critical)]">{org.deadLetters}</span>
                    ) : (
                      <span className="text-[var(--ink-muted)]">0</span>
                    )}
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
