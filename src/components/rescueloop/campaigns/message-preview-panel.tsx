"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/interaction/segmented-control";
import { cn } from "@/lib/utils";

const PREVIEW_VARS: Record<string, string> = {
  first_name: "Maya",
  course_name: "Agency Growth System",
  lesson_duration: "8 minutes",
  current_lesson: "Setting Up Your First Campaign",
  progress_percent: "38%",
};

const STUDENT_OPTIONS = [
  "Continue course",
  "I'm stuck",
  "Remind me tomorrow",
] as const;

interface MessagePreviewPanelProps {
  template: string;
}

export function MessagePreviewPanel({ template }: MessagePreviewPanelProps) {
  const [view, setView] = useState<"whop" | "student">("whop");

  const filled = useMemo(
    () => fillTemplate(template, PREVIEW_VARS),
    [template],
  );
  const variableNames = useMemo(() => extractVariables(template), [template]);

  return (
    <section className="flex flex-col">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">
          Message preview
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Sample render
        </span>
      </div>

      {/* View toggle */}
      <div className="border-b border-[var(--hairline)] px-5 py-3">
        <SegmentedControl
          ariaLabel="Preview channel"
          size="sm"
          value={view}
          onChange={(v) => setView(v)}
          segments={[
            { value: "whop", label: "Whop notification" },
            { value: "student", label: "Student page" },
          ]}
        />
      </div>

      {/* Rendered preview */}
      <div className="px-5 py-4">
        {view === "whop" ? (
          <WhopPreview message={filled} />
        ) : (
          <PhonePreview message={filled} />
        )}
      </div>

      {/* Variables available */}
      <div className="border-t border-[var(--hairline)] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Variables available
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {variableNames.map((v) => (
            <span
              key={v}
              className="rounded-[2px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink-secondary)]"
            >
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      </div>

      {/* Student response options */}
      <div className="border-t border-[var(--hairline)] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Student options
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STUDENT_OPTIONS.map((opt) => (
            <span
              key={opt}
              className="inline-flex items-center rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 text-[12px] text-[var(--ink-primary)]"
            >
              {opt}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Preview renderers ──────────────────────────────────────────

function WhopPreview({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[2px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-4">
      {/* Sender row */}
      <div className="flex items-center gap-2 border-b border-[var(--hairline)] pb-2.5">
        <div className="flex size-7 items-center justify-center rounded-full bg-[var(--ink-primary)] font-mono text-[10px] font-semibold text-[var(--canvas)]">
          CR
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--ink-primary)]">
            Creator Growth Lab
          </p>
          <p className="text-[10px] text-[var(--ink-muted)]">
            Whop · direct message
          </p>
        </div>
      </div>
      {/* Message body */}
      <div className="rounded-[2px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2.5">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ink-primary)]">
          {message}
        </p>
      </div>
      <p className="text-right font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
        Just now · preview
      </p>
    </div>
  );
}

function PhonePreview({ message }: { message: string }) {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[280px] flex-col gap-2.5 rounded-[16px] border border-[var(--hairline-strong)] bg-[var(--ink-primary)] p-2">
        {/* Phone notch */}
        <div className="mx-auto h-1 w-12 rounded-full bg-[var(--dark-hairline)]" />
        <div className="rounded-[10px] bg-[var(--canvas)] p-3">
          {/* App header */}
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-2">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                Course
              </span>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
              9:41
            </span>
          </div>
          {/* Course title */}
          <p className="mt-2 font-serif text-[14px] leading-tight text-[var(--ink-primary)]">
            Agency Growth System
          </p>
          {/* Message bubble */}
          <div className="mt-2.5 rounded-[2px] rounded-tl-none border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2.5">
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--ink-primary)]">
              {message}
            </p>
          </div>
          {/* Response options */}
          <div className="mt-2.5 flex flex-col gap-1.5">
            {STUDENT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn(
                  "rounded-[2px] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1.5 text-left text-[11px] text-[var(--ink-primary)] transition-colors hover:bg-[var(--canvas-elevated)]",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template helpers ───────────────────────────────────────────

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] ?? `{{${key}}}`,
  );
}

function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}
