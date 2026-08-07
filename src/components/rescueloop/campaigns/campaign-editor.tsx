"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_ICONS,
  CAMPAIGN_TYPE_LABELS,
} from "@/components/rescueloop/campaigns/campaign-list-row";
import { RuleClauses } from "@/components/rescueloop/campaigns/rule-clauses";
import { AudienceSimulation } from "@/components/rescueloop/campaigns/audience-simulation";
import { MessagePreviewPanel } from "@/components/rescueloop/campaigns/message-preview-panel";
import type {
  Campaign,
  CampaignRules,
  CampaignSafety,
  CampaignStatus,
} from "@/lib/types";

interface CampaignEditorProps {
  campaign: Campaign;
}

export function CampaignEditor({ campaign }: CampaignEditorProps) {
  const Icon = CAMPAIGN_ICONS[campaign.type];
  const isCancellation = campaign.type === "cancellation_rescue";

  // Initial state — what "currently published" looks like.
  const initialRules = useMemo<CampaignRules>(() => campaign.rules, [campaign.rules]);
  const initialSafety = useMemo<CampaignSafety>(
    () => campaign.safety,
    [campaign.safety],
  );
  const initialStatus = useMemo<CampaignStatus>(
    () => campaign.status,
    [campaign.status],
  );
  const initialApprovalMode = useMemo<"manual" | "automatic">(
    () => (isCancellation ? "manual" : campaign.approvalMode),
    [campaign.approvalMode, isCancellation],
  );

  // Working state
  const [rules, setRules] = useState<CampaignRules>(initialRules);
  const [safety, setSafety] = useState<CampaignSafety>(initialSafety);
  const [status, setStatus] = useState<CampaignStatus>(initialStatus);
  const [approvalMode, setApprovalMode] =
    useState<"manual" | "automatic">(initialApprovalMode);

  // Snapshot of the last-published state. Until the user publishes, this
  // stays null and we fall back to the campaign's initial values.
  const [published, setPublished] = useState<{
    rules: CampaignRules;
    safety: CampaignSafety;
    status: CampaignStatus;
    approvalMode: "manual" | "automatic";
  } | null>(null);

  // Effective baseline for dirty-checking + "Compare to current rule".
  const baseline = published ?? {
    rules: initialRules,
    safety: initialSafety,
    status: initialStatus,
    approvalMode: initialApprovalMode,
  };

  const dirty = useMemo(
    () =>
      JSON.stringify(rules) !== JSON.stringify(baseline.rules) ||
      JSON.stringify(safety) !== JSON.stringify(baseline.safety) ||
      status !== baseline.status ||
      approvalMode !== baseline.approvalMode,
    [rules, safety, status, approvalMode, baseline],
  );

  const isActive = status === "active";

  function updateRule<K extends keyof CampaignRules>(
    key: K,
    value: CampaignRules[K],
  ) {
    setRules((prev) => ({ ...prev, [key]: value }));
  }

  function updateSafety<K extends keyof CampaignSafety>(
    key: K,
    value: CampaignSafety[K],
  ) {
    setSafety((prev) => ({ ...prev, [key]: value }));
  }

  function handleApprovalModeChange(value: "manual" | "automatic") {
    if (isCancellation) return;
    setApprovalMode(value);
  }

  function toggleStatus(checked: boolean) {
    setStatus(checked ? "active" : "paused");
  }

  function handlePublish() {
    if (!dirty) return;
    toast.success("Changes published", {
      description: `${campaign.name} rules and safety controls updated.`,
    });
    // Snapshot the current working state as the new "published" baseline.
    setPublished({
      rules: { ...rules, membershipStatuses: [...rules.membershipStatuses] },
      safety: { ...safety },
      status,
      approvalMode,
    });
  }

  function handleDiscard() {
    setRules(baseline.rules);
    setSafety(baseline.safety);
    setStatus(baseline.status);
    setApprovalMode(baseline.approvalMode);
    toast.info("Changes discarded");
  }

  const baselineRules = baseline.rules;

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Back link */}
      <Link
        href="/campaigns"
        className="inline-flex w-fit items-center gap-1 text-[12px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
      >
        <ChevronLeft className="size-3.5" />
        Campaign Studio
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[var(--hairline)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink-primary)]">
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-[26px] leading-tight text-[var(--ink-primary)]">
              {campaign.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                {CAMPAIGN_TYPE_LABELS[campaign.type]}
              </span>
              <span className="text-[var(--ink-muted)]">·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px]",
                  isActive ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isActive ? "bg-[var(--recovery-green)]" : "bg-[var(--ink-muted)]",
                  )}
                />
                {isActive ? "Active" : "Paused"}
              </span>
              {dirty && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-[2px] border border-[var(--warning-light)] bg-[var(--warning-light)] px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--warning)]">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: status toggle + publish */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-[2px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5">
            <Switch
              checked={isActive}
              onCheckedChange={toggleStatus}
              aria-label="Toggle campaign status"
            />
            <span className="text-[12px] text-[var(--ink-primary)]">
              {isActive ? "Active" : "Paused"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            disabled={!dirty}
            className="h-9 gap-1.5 rounded-[2px] px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" />
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!dirty}
            className="h-9 gap-1.5 rounded-[2px] bg-[var(--ink-primary)] px-3 text-[12px] text-[var(--canvas)] hover:bg-[var(--dark-elevated)] disabled:opacity-40"
          >
            <Upload className="size-3.5" />
            Publish changes
          </Button>
        </div>
      </header>

      {/* Three-column workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px_360px] lg:items-start">
        {/* Left: Rule logic */}
        <div className="rounded-none border border-[var(--hairline)] bg-[var(--surface)]">
          <RuleClauses
            rules={rules}
            safety={safety}
            approvalMode={approvalMode}
            isCancellation={isCancellation}
            onRuleChange={updateRule}
            onSafetyChange={updateSafety}
            onApprovalModeChange={handleApprovalModeChange}
          />
        </div>

        {/* Center: Live audience simulation */}
        <div className="rounded-none border border-[var(--hairline)] bg-[var(--surface)] lg:sticky lg:top-6">
          <AudienceSimulation
            rules={rules}
            baselineRules={baselineRules}
          />
        </div>

        {/* Right: Message preview */}
        <div className="rounded-none border border-[var(--hairline)] bg-[var(--surface)] lg:sticky lg:top-6">
          <MessagePreviewPanel template={campaign.messageTemplate} />
        </div>
      </div>
    </div>
  );
}
