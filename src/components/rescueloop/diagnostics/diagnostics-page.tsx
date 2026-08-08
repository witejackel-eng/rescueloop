"use client";

import { useState } from "react";
import { Stethoscope, Filter, Search } from "lucide-react";
import { DiagnosticCard } from "./diagnostic-card";
import { RecoveryStatusDisplay } from "./recovery-status";
import { DiagnosticExport } from "./diagnostic-export";
import type {
  DiagnosticEntry,
  DiagnosticSeverity,
  DiagnosticBundle,
} from "@/lib/types/operations-internal";

interface DiagnosticsPageProps {
  diagnostics: DiagnosticEntry[];
  bundle: DiagnosticBundle;
}

type SeverityFilter = DiagnosticSeverity | "all";

const SEVERITY_FILTERS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export function DiagnosticsPageView({ diagnostics, bundle }: DiagnosticsPageProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = diagnostics.filter((d) => {
    if (severityFilter !== "all" && d.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.errorId.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeRecoveries = diagnostics.filter((d) => d.recoveryStatus === "in_progress").length;
  const failedRecoveries = diagnostics.filter(
    (d) => d.recoveryStatus === "failed" || d.recoveryStatus === "max_retries_exceeded"
  ).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[28px] leading-none text-[var(--ink-primary)]">
            Diagnostics
          </h1>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-[var(--ink-muted)]">
            <Stethoscope className="size-3.5" strokeWidth={2} />
            Help → Diagnostics · error IDs, recovery, and export
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeRecoveries > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--info)]">
              <span className="size-1.5 rounded-full bg-[var(--info)] animate-pulse" />
              {activeRecoveries} recovering
            </span>
          )}
          {failedRecoveries > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--critical)]">
              <span className="size-1.5 rounded-full bg-[var(--critical)]" />
              {failedRecoveries} failed
            </span>
          )}
          <DiagnosticExport bundle={bundle} />
        </div>
      </header>

      {/* Summary counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SEVERITY_FILTERS.filter((f) => f.value !== "all").map((f) => {
          const count = diagnostics.filter((d) => d.severity === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setSeverityFilter(severityFilter === f.value ? "all" : f.value)}
              className={`flex flex-col items-center gap-1 rounded-[8px] border px-3 py-3 transition-colors ${
                severityFilter === f.value
                  ? "border-[var(--ink-primary)] bg-[var(--canvas-elevated)]"
                  : "border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <span className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">{count}</span>
              <span className="text-[11px] text-[var(--ink-muted)]">{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSeverityFilter(f.value)}
              className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                severityFilter === f.value
                  ? "bg-[var(--ink-primary)] text-white"
                  : "bg-[var(--canvas-elevated)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {f.value !== "all" && <Filter className="size-2.5" />}
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search error IDs, titles…"
            className="w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] py-1.5 pl-8 pr-3 text-[12px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--recovery-green)] sm:w-64"
          />
        </div>
      </div>

      {/* Recovery status bar for in-progress items */}
      {diagnostics.filter((d) => d.recoveryStatus === "in_progress").length > 0 && (
        <section className="rounded-[8px] border border-[var(--info)] bg-[#D6E4F0]/20 p-4">
          <h3 className="mb-3 text-[13px] font-medium text-[var(--ink-primary)]">
            Active Recovery
          </h3>
          <div className="flex flex-col gap-3">
            {diagnostics
              .filter((d) => d.recoveryStatus === "in_progress")
              .map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-[var(--ink-primary)]">{d.title}</p>
                    <p className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">{d.errorId}</p>
                  </div>
                  <RecoveryStatusDisplay entry={d} />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Diagnostic cards */}
      <section className="flex flex-col gap-3">
        {filtered.map((entry) => (
          <DiagnosticCard key={entry.id} entry={entry} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] py-12 text-center text-[13px] text-[var(--ink-muted)]">
            No diagnostics match your filter
          </div>
        )}
      </section>
    </div>
  );
}
