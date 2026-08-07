"use client";

import { Activity, Clock } from "lucide-react";
import { ExceptionSummaryCards } from "./exception-summary";
import { ExceptionTable } from "./exception-table";
import { AuditLog } from "./audit-log";
import type { ExceptionSignal, ExceptionSummary, AuditEntry } from "@/lib/types/operations-internal";

interface ExceptionDashboardProps {
  summary: ExceptionSummary;
  exceptions: ExceptionSignal[];
  auditLog: AuditEntry[];
}

export function ExceptionDashboard({ summary, exceptions, auditLog }: ExceptionDashboardProps) {
  const openCount = exceptions.filter((e) => e.status === "open" || e.status === "escalated").length;
  const recoveringCount = exceptions.filter((e) => e.status === "recovering").length;

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[28px] leading-none text-[var(--ink-primary)]">
            Internal Operations
          </h1>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-[var(--ink-muted)]">
            <Activity className="size-3.5" strokeWidth={2} />
            Exception console · real-time signals
          </p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--ink-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--critical)]" />
            {openCount} open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--info)]" />
            {recoveringCount} recovering
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3" strokeWidth={2} />
            Updated just now
          </span>
        </div>
      </header>

      {/* Summary cards */}
      <section>
        <ExceptionSummaryCards summary={summary} />
      </section>

      {/* Exception table */}
      <section>
        <h2 className="mb-3 font-serif text-[16px] text-[var(--ink-primary)]">
          Exception Signals
        </h2>
        <ExceptionTable exceptions={exceptions} />
      </section>

      {/* Audit log */}
      <section>
        <AuditLog entries={auditLog} maxRows={10} />
      </section>
    </div>
  );
}
