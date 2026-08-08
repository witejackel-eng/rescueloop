"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileEdit,
  History,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  RotateCcw,
  X,
  XCircle,
  Zap,
  Loader2,
  Snowflake,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PriorityPill,
} from "@/components/shared/status-pills";
import {
  formatShortDate,
  relativeDay,
} from "@/lib/format";
import type {
  InterventionState,
  Priority,
} from "@/lib/types";
import type {
  InterventionDetail,
  EvidenceTimelineEntry,
  SafetyCheckResult,
  AuditEntry,
} from "./wp04-types";

// ── Props ────────────────────────────────────────────────────
interface WP04InspectorProps {
  companyId: string;
  detail: InterventionDetail | null;
  onApprove: (id: string) => void;
  onSchedule: (id: string, when: string) => void;
  onDismiss: (id: string) => void;
  onSuppress: (id: string) => void;
  /** When true, action bar is sticky inside a Sheet (mobile). When false, sticky inside column. */
  variant?: "column" | "sheet";
  /** Busy state for action buttons */
  busyAction?: string | null;
}

// ── Helper components ────────────────────────────────────────
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
      <Icon className="size-3.5" />
      {children}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--ink-primary)]">{children}</dd>
    </div>
  );
}

// ── Inactivity display ───────────────────────────────────────
function inactivityDisplay(days: number): string {
  if (days === 0) return "Active today";
  if (days === 1) return "1 day inactive";
  return `${days} days inactive`;
}

// ── Evidence timeline ────────────────────────────────────────
function EvidenceTimeline({ entries }: { entries: EvidenceTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-3 py-3 text-center text-[12px] text-[var(--ink-muted)]">
        No eligibility checks recorded.
      </p>
    );
  }

  return (
    <ol className="relative space-y-3 pl-6">
      <span className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--hairline)]" />
      {entries.map((entry, i) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-6 top-0.5">
            {entry.overallEligible ? (
              <span className="flex size-5 items-center justify-center border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]">
                <Check className="size-3" />
              </span>
            ) : (
              <span className="flex size-5 items-center justify-center border border-[var(--critical)]/30 bg-[var(--critical-light)] text-[var(--critical)]">
                <X className="size-3" />
              </span>
            )}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                Eligibility check #{entries.length - i}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                {formatShortDate(entry.detectedAt)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {entry.checks.map((check) => (
                <div
                  key={check.ruleId}
                  className="flex items-start gap-2 text-[12px]"
                >
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[var(--recovery-green)]" />
                  ) : (
                    <XCircle className="mt-0.5 size-3 shrink-0 text-[var(--critical)]" />
                  )}
                  <span className={cn(check.passed ? "text-[var(--ink-secondary)]" : "text-[var(--ink-primary)]")}>
                    {check.label}
                    {check.detail && (
                      <span className="ml-1 text-[var(--ink-muted)]">— {check.detail}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Safety checks panel ──────────────────────────────────────
function SafetyChecksPanel({ checks }: { checks: SafetyCheckResult[] }) {
  if (checks.length === 0) {
    return (
      <p className="border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-3 py-3 text-center text-[12px] text-[var(--ink-muted)]">
        No safety checks recorded.
      </p>
    );
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = passedCount === checks.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium",
          allPassed
            ? "bg-[var(--recovery-light)] text-[var(--recovery-green)]"
            : "bg-[var(--critical-light)] text-[var(--critical)]",
        )}>
          {allPassed ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
          {passedCount}/{checks.length} passed
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {checks.map((check) => (
          <li
            key={check.ruleId}
            className="flex items-start gap-2 text-[12px]"
          >
            {check.passed ? (
              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[var(--recovery-green)]" />
            ) : (
              <XCircle className="mt-0.5 size-3 shrink-0 text-[var(--critical)]" />
            )}
            <div className="flex-1">
              <span className={cn(check.passed ? "text-[var(--ink-secondary)]" : "font-medium text-[var(--ink-primary)]")}>
                {check.label}
              </span>
              {check.detail && (
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{check.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Audit history ────────────────────────────────────────────
function AuditHistory({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-3 py-3 text-center text-[12px] text-[var(--ink-muted)]">
        No audit history recorded.
      </p>
    );
  }

  return (
    <ol className="relative space-y-2 pl-6">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-[var(--hairline)]" />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-6 top-1 size-2 rounded-full bg-[var(--ink-muted)]" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[var(--ink-primary)]">
                {entry.action.replace(/_/g, " ")}
              </span>
              {entry.actorLabel && (
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  by {entry.actorLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
              <span>{formatShortDate(entry.timestamp)}</span>
              {entry.previousState && entry.newState && (
                <>
                  <span className="text-[var(--hairline-strong)]">·</span>
                  <span>{entry.previousState} → {entry.newState}</span>
                </>
              )}
              {entry.reason && (
                <>
                  <span className="text-[var(--hairline-strong)]">·</span>
                  <span>{entry.reason}</span>
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Schedule options ─────────────────────────────────────────
const SCHEDULE_OPTIONS = [
  { label: "In 1 hour", value: "In 1 hour" },
  { label: "Tomorrow · 9:00 AM", value: "Tomorrow · 9:00 AM" },
  { label: "In 3 days · 9:00 AM", value: "In 3 days · 9:00 AM" },
  { label: "Next Monday · 9:00 AM", value: "Next Monday · 9:00 AM" },
];

// ── Main Inspector Component ────────────────────────────────
export function WP04Inspector({
  companyId,
  detail,
  onApprove,
  onSchedule,
  onDismiss,
  onSuppress,
  variant = "column",
  busyAction = null,
}: WP04InspectorProps) {
  const [messageDraft, setMessageDraft] = useState("");
  const [lastDetailId, setLastDetailId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset draft when intervention changes
  const currentId = detail?.id ?? null;
  if (currentId !== lastDetailId) {
    setLastDetailId(currentId);
    setMessageDraft(detail?.messagePreview ?? "");
    setSaveStatus("idle");
  }

  // Auto-save draft via PATCH (debounced 800ms)
  const saveDraft = useCallback(async (interventionId: string, message: string) => {
    setSaveStatus("saving");
    try {
      await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/queue/${encodeURIComponent(interventionId)}/edit`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messagePreview: message }),
        },
      );
      setSaveStatus("saved");
      // Clear "saved" indicator after 2s
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [companyId]);

  const handleDraftChange = useCallback((value: string) => {
    setMessageDraft(value);
    if (detail && value !== detail.messagePreview) {
      // Debounce auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft(detail.id, value);
      }, 800);
    }
  }, [detail, saveDraft]);

  // Empty state
  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-[260px]">
          <div className="mx-auto flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
            <Sparkles className="size-4" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">
            Select a student to review
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-muted)]">
            The inspector shows the rescue plan, evidence timeline, and safety
            state for the selected row. Use J / K to move between students.
          </p>
        </div>
      </div>
    );
  }

  const messageDirty = messageDraft !== detail.messagePreview;
  const showEdited = detail.messageEdited || messageDirty;

  const canApprove = detail.state === "awaiting_approval";
  const canSchedule = detail.state === "awaiting_approval";
  const canDismiss =
    detail.state === "awaiting_approval" ||
    detail.state === "approved" ||
    detail.state === "scheduled";
  const canSuppress = !detail.suppressed;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--canvas-elevated)]",
        variant === "column" && "border-l border-[var(--hairline)]",
      )}
    >
      {/* Header — student identity */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--hairline)] px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--surface)]">
            <AvatarFallback className="rounded-none bg-[var(--surface)] text-[13px] font-medium text-[var(--ink-primary)]">
              {detail.studentAvatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-[20px] leading-tight text-[var(--ink-primary)]">
              {detail.studentName}
            </h2>
            <p className="truncate text-[12px] text-[var(--ink-muted)]">{detail.studentEmail}</p>
          </div>
          <PriorityPill priority={detail.priority} />
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          <span>{detail.courseName}</span>
          <span className="text-[var(--hairline-strong)]">·</span>
          <span className={cn(detail.inactivityDays > 7 ? "text-[var(--critical)]" : detail.inactivityDays > 3 ? "text-[var(--warning)]" : "")}>
            {inactivityDisplay(detail.inactivityDays)}
          </span>
          <span className="text-[var(--hairline-strong)]">·</span>
          <span>Progress: {detail.progressPercent}%</span>
          {detail.suppressed && (
            <>
              <span className="text-[var(--hairline-strong)]">·</span>
              <Badge variant="destructive" className="h-5 rounded-none px-1.5 font-mono text-[10px]">Suppressed</Badge>
            </>
          )}
          {detail.inCooldown && (
            <>
              <span className="text-[var(--hairline-strong)]">·</span>
              <Badge variant="secondary" className="h-5 rounded-none px-1.5 font-mono text-[10px]">
                <Snowflake className="mr-0.5 size-3" />
                Cooldown
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Body — scrollable */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col divide-y divide-[var(--hairline)]">
          {/* 1. Why RescueLoop flagged them */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={AlertTriangle}>Why RescueLoop flagged them</SectionTitle>
            <p className="text-[13px] leading-relaxed text-[var(--ink-primary)]">
              {detail.trigger}
            </p>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Recommended action">
                {detail.recommendedAction}
              </Field>
              <Field label="Campaign type">
                <span className="font-mono text-[12px] uppercase tracking-wide">
                  {detail.campaignType.replace(/_/g, " ")}
                </span>
              </Field>
            </dl>
          </section>

          {/* 2. Evidence timeline */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={History}>Evidence timeline</SectionTitle>
            <EvidenceTimeline entries={detail.evidenceTimeline} />
          </section>

          {/* 3. Message editor */}
          <section className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SectionTitle icon={Mail}>Message</SectionTitle>
                {showEdited && (
                  <Badge variant="secondary" className="h-5 rounded-none px-1.5 font-mono text-[10px]">
                    Edited
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--ink-muted)]">
                    <Loader2 className="size-3 animate-spin" />
                    Saving…
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="font-mono text-[10px] text-[var(--recovery-green)]">
                    Saved
                  </span>
                )}
                {messageDirty && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessageDraft(detail.messagePreview);
                      setSaveStatus("idle");
                    }}
                    className="flex items-center gap-1 font-mono text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                  >
                    <RotateCcw className="size-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>
            <Textarea
              value={messageDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              rows={6}
              className="rounded-none border-[var(--hairline)] bg-[var(--surface)] font-sans text-[13px] leading-relaxed text-[var(--ink-primary)] focus-visible:ring-[var(--recovery-green)]/30"
              aria-label="Editable message draft"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {messageDraft.length} chars · {messageDirty ? "edited" : "template"}
            </p>
          </section>

          {/* 4. Safety check results */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={ShieldCheck}>Safety checks</SectionTitle>
            <SafetyChecksPanel checks={detail.safetyChecks} />
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Cooldown until">
                <span className="font-mono text-[12px] tabular-nums">
                  {detail.cooldownUntil
                    ? `${formatShortDate(detail.cooldownUntil)} · ${relativeDay(detail.cooldownUntil)}`
                    : "None"}
                </span>
              </Field>
              <Field label="Quiet hours">
                <span className="font-mono text-[12px] tabular-nums">
                  {detail.quietHoursStart}–{detail.quietHoursEnd}
                </span>
              </Field>
              <Field label="Max messages / student">
                <span className="font-mono text-[12px] tabular-nums">
                  {detail.maxMessagesPerStudent}/mo
                </span>
              </Field>
              <Field label="Send timing">
                {detail.scheduledFor ? (
                  <span className="font-mono text-[12px] tabular-nums">
                    {detail.scheduledFor}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--recovery-green)]">
                    <Send className="size-3" />
                    Send now
                  </span>
                )}
              </Field>
            </dl>
          </section>

          {/* 5. Audit history */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={History}>Audit history</SectionTitle>
            <AuditHistory entries={detail.auditHistory} />
          </section>
        </div>
      </ScrollArea>

      {/* Sticky actions */}
      <div className="shrink-0 border-t border-[var(--hairline)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-col gap-2">
          {/* Primary row */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!canApprove || busyAction !== null}
              onClick={() => onApprove(detail.id)}
              className="h-9 flex-1 rounded-none bg-[var(--ink-primary)] text-[var(--canvas)] hover:bg-[var(--ink-primary)]/90 disabled:opacity-40"
            >
              {busyAction === "approve" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Approve &amp; send
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canSchedule || busyAction !== null}
                  className="h-9 rounded-none border-[var(--hairline)] bg-[var(--surface)] px-3 text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)] disabled:opacity-40"
                >
                  <CalendarClock className="size-3.5" />
                  Schedule
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-56 rounded-none border-[var(--hairline)] bg-[var(--surface)] p-1"
              >
                <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Send at
                </p>
                <div className="flex flex-col">
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onSchedule(detail.id, opt.value)}
                      className="flex items-center gap-2 px-2 py-2 text-left text-[13px] text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]"
                    >
                      <Clock className="size-3.5 text-[var(--ink-muted)]" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Secondary row */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!canDismiss || busyAction !== null}
              onClick={() => onDismiss(detail.id)}
              className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] disabled:opacity-40"
            >
              <FileEdit className="size-3.5" />
              Dismiss
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canSuppress || busyAction !== null}
                  className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--critical-light)] hover:text-[var(--critical)] disabled:opacity-40"
                >
                  <ShieldOff className="size-3.5" />
                  Suppress
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Suppress this student?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {detail.studentName.split(" ")[0]} will no longer receive any automated
                    rescue interventions. You can reverse this from their student profile
                    at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-none bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                    onClick={() => onSuppress(detail.id)}
                  >
                    Suppress student
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
