"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type {
  CampaignRules,
  CampaignSafety,
  MembershipStatus,
} from "@/lib/types";

const MEMBERSHIP_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "cancelling", label: "Cancelling" },
  { value: "cancelled", label: "Cancelled" },
  { value: "paused_membership", label: "Paused membership" },
];

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "active",
  trialing: "trialing",
  cancelling: "cancelling",
  cancelled: "cancelled",
  paused_membership: "paused",
};

interface RuleClausesProps {
  rules: CampaignRules;
  safety: CampaignSafety;
  approvalMode: "manual" | "automatic";
  isCancellation: boolean;
  onRuleChange: <K extends keyof CampaignRules>(
    key: K,
    value: CampaignRules[K],
  ) => void;
  onSafetyChange: <K extends keyof CampaignSafety>(
    key: K,
    value: CampaignSafety[K],
  ) => void;
  onApprovalModeChange: (value: "manual" | "automatic") => void;
}

export function RuleClauses({
  rules,
  safety,
  approvalMode,
  isCancellation,
  onRuleChange,
  onSafetyChange,
  onApprovalModeChange,
}: RuleClausesProps) {
  function toggleMembership(value: MembershipStatus, checked: boolean) {
    const exists = rules.membershipStatuses.includes(value);
    if (checked && !exists) {
      onRuleChange("membershipStatuses", [...rules.membershipStatuses, value]);
    } else if (!checked && exists) {
      onRuleChange(
        "membershipStatuses",
        rules.membershipStatuses.filter((s) => s !== value),
      );
    }
  }

  const membershipLabel =
    rules.membershipStatuses.length === 0
      ? "no statuses"
      : rules.membershipStatuses.map((s) => STATUS_LABELS[s]).join(", ");

  return (
    <section className="flex flex-col">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">
          Rule logic
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Click a value to edit
        </span>
      </div>

      {/* Clauses */}
      <div className="px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Trigger when
        </p>
        <ol className="mt-2 flex flex-col gap-1.5 font-serif text-[19px] leading-snug text-[var(--ink-primary)]">
          <li>
            Progress is between{" "}
            <InlinePopover
              ariaLabel="Edit progress range"
              trigger={
                <ClauseValue>
                  {rules.progressMin}
                  <span className="text-[var(--ink-muted)]">%</span>–{rules.progressMax}
                  <span className="text-[var(--ink-muted)]">%</span>
                </ClauseValue>
              }
            >
              <div className="flex items-center gap-2">
                <NumberInput
                  value={rules.progressMin}
                  min={0}
                  max={100}
                  onChange={(v) =>
                    onRuleChange("progressMin", Math.min(v, rules.progressMax))
                  }
                  ariaLabel="Minimum progress percent"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">to</span>
                <NumberInput
                  value={rules.progressMax}
                  min={0}
                  max={100}
                  onChange={(v) =>
                    onRuleChange("progressMax", Math.max(v, rules.progressMin))
                  }
                  ariaLabel="Maximum progress percent"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">%</span>
              </div>
            </InlinePopover>
          </li>
          <li>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              AND
            </span>{" "}
            inactive for at least{" "}
            <InlinePopover
              ariaLabel="Edit inactivity days"
              trigger={
                <ClauseValue>
                  {rules.inactivityDaysMin}
                  <span className="text-[var(--ink-muted)]"> days</span>
                </ClauseValue>
              }
            >
              <div className="flex items-center gap-2">
                <NumberInput
                  value={rules.inactivityDaysMin}
                  min={0}
                  onChange={(v) => onRuleChange("inactivityDaysMin", v)}
                  ariaLabel="Minimum inactivity days"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">days</span>
              </div>
            </InlinePopover>
          </li>
          <li>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              AND
            </span>{" "}
            membership is{" "}
            <InlinePopover
              ariaLabel="Edit membership statuses"
              trigger={<ClauseValue>{membershipLabel}</ClauseValue>}
            >
              <div className="flex flex-col gap-1.5">
                {MEMBERSHIP_OPTIONS.map((opt) => {
                  const checked = rules.membershipStatuses.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 rounded-[2px] px-1 py-1 text-[13px] text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) =>
                          toggleMembership(opt.value, c === true)
                        }
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </InlinePopover>
          </li>
          <li>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              AND
            </span>{" "}
            no intervention was sent within{" "}
            <InlinePopover
              ariaLabel="Edit cooldown days"
              trigger={
                <ClauseValue>
                  {rules.cooldownDays}
                  <span className="text-[var(--ink-muted)]"> days</span>
                </ClauseValue>
              }
            >
              <div className="flex items-center gap-2">
                <NumberInput
                  value={rules.cooldownDays}
                  min={0}
                  onChange={(v) => onRuleChange("cooldownDays", v)}
                  ariaLabel="Cooldown days"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">days</span>
              </div>
            </InlinePopover>
          </li>
        </ol>
      </div>

      {/* Safety controls */}
      <div className="border-t border-[var(--hairline)] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Safety controls
        </p>
        <div className="mt-3 flex flex-col">
          <SafetyRow label="Maximum messages per member">
            <InlinePopover
              ariaLabel="Edit max messages"
              trigger={
                <ClauseValue>
                  {safety.maxMessagesPerMember}
                  <span className="text-[var(--ink-muted)]"> messages</span>
                </ClauseValue>
              }
            >
              <div className="flex items-center gap-2">
                <NumberInput
                  value={safety.maxMessagesPerMember}
                  min={1}
                  onChange={(v) => onSafetyChange("maxMessagesPerMember", v)}
                  ariaLabel="Max messages per member"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">messages</span>
              </div>
            </InlinePopover>
          </SafetyRow>

          <SafetyRow label="Quiet hours">
            <InlinePopover
              ariaLabel="Edit quiet hours"
              trigger={
                <ClauseValue>
                  {safety.quietHoursStart}
                  <span className="text-[var(--ink-muted)]"> – </span>
                  {safety.quietHoursEnd}
                </ClauseValue>
              }
            >
              <div className="flex items-center gap-2">
                <TimeInput
                  value={safety.quietHoursStart}
                  onChange={(v) => onSafetyChange("quietHoursStart", v)}
                  ariaLabel="Quiet hours start"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">to</span>
                <TimeInput
                  value={safety.quietHoursEnd}
                  onChange={(v) => onSafetyChange("quietHoursEnd", v)}
                  ariaLabel="Quiet hours end"
                />
              </div>
            </InlinePopover>
          </SafetyRow>

          <SafetyRow label="Stop after response">
            <Switch
              checked={safety.stopAfterResponse}
              onCheckedChange={(c) => onSafetyChange("stopAfterResponse", c)}
              aria-label="Stop after response"
            />
          </SafetyRow>

          <SafetyRow label="Stop after progress resumes">
            <Switch
              checked={safety.stopAfterProgressResumes}
              onCheckedChange={(c) =>
                onSafetyChange("stopAfterProgressResumes", c)
              }
              aria-label="Stop after progress resumes"
            />
          </SafetyRow>

          <SafetyRow label="Stop after membership ends">
            <Switch
              checked={safety.stopAfterMembershipEnds}
              onCheckedChange={(c) =>
                onSafetyChange("stopAfterMembershipEnds", c)
              }
              aria-label="Stop after membership ends"
            />
          </SafetyRow>

          <SafetyRow
            label="Approval mode"
            note={
              isCancellation
                ? "Cancellation Rescue requires manual approval"
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <Switch
                checked={approvalMode === "automatic"}
                disabled={isCancellation}
                onCheckedChange={(c) =>
                  onApprovalModeChange(c ? "automatic" : "manual")
                }
                aria-label="Toggle automatic approval"
              />
              <span
                className={cn(
                  "font-mono text-[12px] uppercase tracking-[0.08em]",
                  approvalMode === "automatic"
                    ? "text-[var(--recovery-green)]"
                    : "text-[var(--ink-secondary)]",
                )}
              >
                {approvalMode === "automatic" ? "Automatic" : "Manual"}
              </span>
            </div>
          </SafetyRow>
        </div>
      </div>
    </section>
  );
}

// ── Inline editing primitives ──────────────────────────────────

function ClauseValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex cursor-pointer items-baseline rounded-[2px] bg-[var(--canvas-elevated)] px-1.5 py-px font-mono text-[15px] tabular-nums text-[var(--ink-primary)] underline decoration-[var(--hairline-strong)] underline-offset-2 transition-colors hover:bg-[var(--canvas)] hover:decoration-[var(--ink-primary)]">
      {children}
    </span>
  );
}

function InlinePopover({
  trigger,
  children,
  ariaLabel,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="inline-flex items-baseline"
        >
          {trigger}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="rounded-none border-[var(--hairline)] bg-[var(--surface)] p-3 shadow-[0_4px_24px_rgba(17,17,15,0.08)]"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  // Local input buffer so the user can clear the field and retype without
  // it snapping back to 0. We commit on blur / valid parse.
  const [draft, setDraft] = useState(String(value));
  // Track the last externally-seen value so we can sync the draft when the
  // parent updates `value` (e.g., sibling input clamps progressMin to
  // progressMax). This is the "adjusting state during render" pattern from
  // the React docs — preferred over useEffect for syncing derived state.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (Number(draft) !== value) setDraft(String(value));
  }

  function commit(next: string) {
    const parsed = next === "" ? 0 : Number(next);
    if (!Number.isFinite(parsed)) return;
    let v = parsed;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onChange(v);
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      value={draft}
      min={min}
      max={max}
      aria-label={ariaLabel}
      onChange={(e) => {
        setDraft(e.target.value);
        commit(e.target.value);
      }}
      onBlur={(e) => commit(e.target.value)}
      className="h-8 w-20 rounded-none border border-[var(--hairline)] bg-[var(--canvas)] px-2 font-mono text-[13px] tabular-nums text-[var(--ink-primary)] focus:border-[var(--ink-primary)] focus:outline-none"
    />
  );
}

function TimeInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <input
      type="time"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-[88px] rounded-none border border-[var(--hairline)] bg-[var(--canvas)] px-2 font-mono text-[13px] tabular-nums text-[var(--ink-primary)] focus:border-[var(--ink-primary)] focus:outline-none"
    />
  );
}

// ── Safety row ─────────────────────────────────────────────────

function SafetyRow({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline-subtle)] py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--ink-primary)]">{label}</p>
        {note && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--warning)]">
            <ShieldAlert className="size-3" />
            {note}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
