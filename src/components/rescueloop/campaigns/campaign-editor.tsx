"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Compass,
  Flag,
  Footprints,
  ShieldAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { StatusPill } from "@/components/shared/status-pills";
import { MessagePreview } from "./message-preview";
import type {
  Campaign,
  CampaignRules,
  CampaignSafety,
  CampaignStatus,
  CampaignType,
  MembershipStatus,
} from "@/lib/types";

const CAMPAIGN_ICONS: Record<CampaignType, LucideIcon> = {
  activation_rescue: Zap,
  early_progress_rescue: Footprints,
  mid_course_rescue: Compass,
  near_finish_rescue: Flag,
  cancellation_rescue: ShieldAlert,
};

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  activation_rescue: "Activation rescue",
  early_progress_rescue: "Early progress rescue",
  mid_course_rescue: "Mid-course rescue",
  near_finish_rescue: "Near-finish rescue",
  cancellation_rescue: "Cancellation rescue",
};

const MEMBERSHIP_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trial" },
  { value: "cancelling", label: "Cancelling" },
  { value: "cancelled", label: "Cancelled" },
];

export function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const Icon = CAMPAIGN_ICONS[campaign.type];
  const isCancellation = campaign.type === "cancellation_rescue";

  const [rules, setRules] = useState<CampaignRules>(campaign.rules);
  const [safety, setSafety] = useState<CampaignSafety>(campaign.safety);
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [approvalMode, setApprovalMode] = useState<"manual" | "automatic">(
    campaign.approvalMode,
  );
  const [dirty, setDirty] = useState(false);

  const isActive = status === "active";

  const markDirty = () => setDirty(true);

  function updateRule<K extends keyof CampaignRules>(
    key: K,
    value: CampaignRules[K],
  ) {
    setRules((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function updateSafety<K extends keyof CampaignSafety>(
    key: K,
    value: CampaignSafety[K],
  ) {
    setSafety((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function toggleMembership(value: MembershipStatus, checked: boolean) {
    setRules((prev) => {
      const exists = prev.membershipStatuses.includes(value);
      if (checked && !exists) {
        return {
          ...prev,
          membershipStatuses: [...prev.membershipStatuses, value],
        };
      }
      if (!checked && exists) {
        return {
          ...prev,
          membershipStatuses: prev.membershipStatuses.filter(
            (s) => s !== value,
          ),
        };
      }
      return prev;
    });
    markDirty();
  }

  function toggleStatus(checked: boolean) {
    setStatus(checked ? "active" : "paused");
    markDirty();
  }

  function handleApprovalModeChange(value: "manual" | "automatic") {
    if (!value || isCancellation) return;
    setApprovalMode(value);
    markDirty();
  }

  function handleSave() {
    toast.success("Campaign saved", {
      description: `${campaign.name} rules and safety controls updated.`,
    });
    setDirty(false);
  }

  function handleCancel() {
    setRules(campaign.rules);
    setSafety(campaign.safety);
    setStatus(campaign.status);
    setApprovalMode(campaign.approvalMode);
    setDirty(false);
    toast.info("Changes discarded");
  }

  // Effective approval mode — cancellation_rescue is always manual
  const effectiveApprovalMode = isCancellation ? "manual" : approvalMode;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F5EF] text-[#147D68]">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-[#171A17] sm:text-2xl">
                {campaign.name}
              </h1>
              <StatusPill
                className={
                  isActive
                    ? "border-[#C7E6D5] bg-[#E8F5EF] text-[#27966A]"
                    : "border-[#E3E5DF] bg-[#F0F2EC] text-[#6A706A]"
                }
                dot
                dotColor={isActive ? "bg-[#27966A]" : "bg-[#6A706A]"}
              >
                {isActive ? "Active" : "Paused"}
              </StatusPill>
            </div>
            <p className="mt-1 text-sm text-[#6A706A]">
              {CAMPAIGN_TYPE_LABELS[campaign.type]} · Edit rules, safety
              controls, and message
            </p>
          </div>
        </div>

        {/* Active / Paused toggle */}
        <div className="flex items-center gap-2.5 rounded-lg border border-[#E3E5DF] bg-[#FFFFFF] px-3 py-2">
          <Switch
            checked={isActive}
            onCheckedChange={toggleStatus}
            aria-label="Toggle campaign status"
          />
          <Label className="cursor-pointer text-sm font-medium text-[#171A17]">
            {isActive ? "Active" : "Paused"}
          </Label>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {/* Left column: Rule builder + Safety */}
        <div className="flex flex-col gap-4">
          <RuleBuilderCard
            rules={rules}
            onRuleChange={updateRule}
            onToggleMembership={toggleMembership}
          />
          <SafetyControlsCard
            safety={safety}
            onSafetyChange={updateSafety}
            approvalMode={effectiveApprovalMode}
            onApprovalModeChange={handleApprovalModeChange}
            isCancellation={isCancellation}
          />
        </div>

        {/* Right column: Message preview (sticky) */}
        <div className="lg:sticky lg:top-24">
          <MessagePreview template={campaign.messageTemplate} />
        </div>
      </div>

      {/* Sticky save bar */}
      <SaveBar
        dirty={dirty}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ── Rule builder ───────────────────────────────────────────────

function RuleBuilderCard({
  rules,
  onRuleChange,
  onToggleMembership,
}: {
  rules: CampaignRules;
  onRuleChange: <K extends keyof CampaignRules>(
    key: K,
    value: CampaignRules[K],
  ) => void;
  onToggleMembership: (value: MembershipStatus, checked: boolean) => void;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#171A17]">
          Rule builder
        </CardTitle>
        <CardDescription className="text-xs text-[#6A706A]">
          Define when this campaign should trigger an intervention
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {/* Progress range */}
        <FieldGroup
          label="Progress range"
          hint="Trigger only for students within this progress band"
        >
          <div className="flex items-center gap-3">
            <NumberWithSuffix
              value={rules.progressMin}
              onChange={(v) => onRuleChange("progressMin", v)}
              suffix="%"
              min={0}
              max={100}
              ariaLabel="Minimum progress percent"
            />
            <span className="text-xs text-[#6A706A]">to</span>
            <NumberWithSuffix
              value={rules.progressMax}
              onChange={(v) => onRuleChange("progressMax", v)}
              suffix="%"
              min={0}
              max={100}
              ariaLabel="Maximum progress percent"
            />
          </div>
          <Slider
            value={[rules.progressMin, rules.progressMax]}
            min={0}
            max={100}
            step={1}
            onValueChange={(vals) => {
              if (vals.length === 2) {
                onRuleChange("progressMin", vals[0]);
                onRuleChange("progressMax", vals[1]);
              }
            }}
            className="mt-3"
          />
        </FieldGroup>

        {/* Inactivity period */}
        <FieldGroup
          label="Inactivity period"
          hint="Days since the student last engaged with the course"
        >
          <div className="flex items-center gap-3">
            <NumberWithSuffix
              value={rules.inactivityDaysMin}
              onChange={(v) => onRuleChange("inactivityDaysMin", v)}
              suffix="days"
              min={0}
              ariaLabel="Minimum inactivity days"
            />
            <span className="text-xs text-[#6A706A]">to</span>
            <NumberWithSuffix
              value={rules.inactivityDaysMax}
              onChange={(v) => onRuleChange("inactivityDaysMax", v)}
              suffix="days"
              min={0}
              ariaLabel="Maximum inactivity days"
            />
          </div>
        </FieldGroup>

        {/* Membership status */}
        <FieldGroup
          label="Membership status"
          hint="Trigger only for members in these statuses"
        >
          <div className="grid grid-cols-2 gap-2">
            {MEMBERSHIP_OPTIONS.map((opt) => {
              const checked = rules.membershipStatuses.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-[#E3E5DF] bg-[#F8F8F5] px-3 py-2 text-sm text-[#171A17] transition-colors hover:bg-[#F0F2EC] has-[:checked]:border-[#147D68] has-[:checked]:bg-[#E8F5EF]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => onToggleMembership(opt.value, c === true)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </FieldGroup>

        {/* Renewal window */}
        <FieldGroup
          label="Renewal window"
          hint="Trigger this many days before a renewal event"
        >
          <NumberWithSuffix
            value={rules.renewalWindowDays}
            onChange={(v) => onRuleChange("renewalWindowDays", v)}
            suffix="days before renewal"
            min={0}
            ariaLabel="Renewal window days"
          />
        </FieldGroup>

        {/* Intervention cooldown */}
        <FieldGroup
          label="Intervention cooldown"
          hint="Wait this many days between interventions to the same member"
        >
          <NumberWithSuffix
            value={rules.cooldownDays}
            onChange={(v) => onRuleChange("cooldownDays", v)}
            suffix="days"
            min={0}
            ariaLabel="Cooldown days"
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

// ── Safety controls ────────────────────────────────────────────

function SafetyControlsCard({
  safety,
  onSafetyChange,
  approvalMode,
  onApprovalModeChange,
  isCancellation,
}: {
  safety: CampaignSafety;
  onSafetyChange: <K extends keyof CampaignSafety>(
    key: K,
    value: CampaignSafety[K],
  ) => void;
  approvalMode: "manual" | "automatic";
  onApprovalModeChange: (value: "manual" | "automatic") => void;
  isCancellation: boolean;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#171A17]">
          Safety controls
        </CardTitle>
        <CardDescription className="text-xs text-[#6A706A]">
          Guardrails that protect members from over-messaging
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {/* Max messages per member */}
        <FieldGroup
          label="Maximum messages per member"
          hint="Cap the total interventions a member can receive"
        >
          <NumberWithSuffix
            value={safety.maxMessagesPerMember}
            onChange={(v) => onSafetyChange("maxMessagesPerMember", v)}
            suffix="messages"
            min={1}
            ariaLabel="Maximum messages per member"
          />
        </FieldGroup>

        {/* Cooldown days */}
        <FieldGroup
          label="Cooldown days"
          hint="Minimum gap between interventions to the same member"
        >
          <NumberWithSuffix
            value={safety.cooldownDays}
            onChange={(v) => onSafetyChange("cooldownDays", v)}
            suffix="days"
            min={0}
            ariaLabel="Safety cooldown days"
          />
        </FieldGroup>

        {/* Quiet hours */}
        <FieldGroup
          label="Quiet hours"
          hint="Do not send messages during these hours"
        >
          <div className="flex items-center gap-3">
            <TimeInput
              value={safety.quietHoursStart}
              onChange={(v) => onSafetyChange("quietHoursStart", v)}
              ariaLabel="Quiet hours start"
            />
            <span className="text-xs text-[#6A706A]">to</span>
            <TimeInput
              value={safety.quietHoursEnd}
              onChange={(v) => onSafetyChange("quietHoursEnd", v)}
              ariaLabel="Quiet hours end"
            />
          </div>
        </FieldGroup>

        {/* Stop switches */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-[#6A706A]">Stop sending when</p>
          <StopRow
            label="Member responds"
            description="Pause further messages once a member replies"
            checked={safety.stopAfterResponse}
            onCheckedChange={(c) => onSafetyChange("stopAfterResponse", c)}
          />
          <StopRow
            label="Progress resumes"
            description="Stop once the member starts progressing again"
            checked={safety.stopAfterProgressResumes}
            onCheckedChange={(c) => onSafetyChange("stopAfterProgressResumes", c)}
          />
          <StopRow
            label="Membership ends"
            description="Stop if the member's membership is no longer active"
            checked={safety.stopAfterMembershipEnds}
            onCheckedChange={(c) => onSafetyChange("stopAfterMembershipEnds", c)}
          />
        </div>

        {/* Approval mode */}
        <FieldGroup
          label="Approval mode"
          hint="Choose how interventions are released"
        >
          <ToggleGroup
            type="single"
            value={approvalMode}
            onValueChange={(v) =>
              onApprovalModeChange(v as "manual" | "automatic")
            }
            disabled={isCancellation}
            className="w-full rounded-md border border-[#E3E5DF] bg-[#F8F8F5]"
          >
            <ToggleGroupItem
              value="manual"
              className="flex-1 data-[state=on]:bg-[#FEF3E2] data-[state=on]:text-[#D89222]"
            >
              Manual
            </ToggleGroupItem>
            <ToggleGroupItem
              value="automatic"
              className="flex-1 data-[state=on]:bg-[#E8F5EF] data-[state=on]:text-[#147D68]"
            >
              Automatic
            </ToggleGroupItem>
          </ToggleGroup>
          {isCancellation && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#D89222]">
              <ShieldAlert className="size-3.5" />
              Cancellation Rescue requires manual approval
            </p>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

// ── Sticky save bar ────────────────────────────────────────────

function SaveBar({
  dirty,
  onSave,
  onCancel,
}: {
  dirty: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E3E5DF] bg-[#FFFFFF]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFFFFF]/80">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <p className="text-xs text-[#6A706A]">
          {dirty
            ? "You have unsaved changes"
            : "All changes saved"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={!dirty}
            className="text-[#6A706A]"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={!dirty}
            className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Small field primitives ─────────────────────────────────────

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <Label className="text-[13px] font-medium text-[#171A17]">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-[#6A706A]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function NumberWithSuffix({
  value,
  onChange,
  suffix,
  min = 0,
  max,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={ariaLabel}
        onChange={(e) => {
          const next = e.target.value === "" ? 0 : Number(e.target.value);
          if (Number.isFinite(next)) {
            onChange(next);
          }
        }}
        className="h-9 w-20 tabular-mono text-sm"
      />
      <span className="text-xs text-[#6A706A]">{suffix}</span>
    </div>
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
    <Input
      type="time"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 flex-1 text-sm"
    />
  );
}

function StopRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E3E5DF] bg-[#F8F8F5] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#171A17]">{label}</p>
        <p className="text-xs text-[#6A706A]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
