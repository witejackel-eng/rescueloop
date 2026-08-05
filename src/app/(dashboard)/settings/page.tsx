"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Unplug,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import {
  COMPANY,
  COURSE,
  COURSES_FOR_SELECTION,
  KPIS,
  LAST_SYNC,
  NEXT_SYNC,
  PRODUCT,
} from "@/lib/mock-data";
import type { AutomationState } from "@/lib/types";
import {
  SegmentedControl,
} from "@/components/interaction/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  SettingsNav,
  type SettingsSectionId,
} from "@/components/rescueloop/settings/settings-nav";
import {
  GroupedList,
  Row,
  ValueLabel,
} from "@/components/rescueloop/settings/grouped-list";

// ── Constants ────────────────────────────────────────────────

const TIMEZONES = [
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEDT)" },
  { value: "UTC", label: "UTC" },
];

const RETENTION_OPTIONS = [
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
  { value: "indefinite", label: "Indefinite" },
];

const PLAN_INTERVENTION_LIMIT = 100;

interface NotificationToggle {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const NOTIFICATION_TOGGLES: NotificationToggle[] = [
  {
    id: "help_requests",
    label: "Help requests",
    description: "When a student submits a direct help request.",
    defaultOn: true,
  },
  {
    id: "cancellation_detections",
    label: "Cancellation detections",
    description: "When a cancellation signal is detected for a member.",
    defaultOn: true,
  },
  {
    id: "recoveries",
    label: "Recoveries",
    description: "When a student returns or completes a lesson after intervention.",
    defaultOn: true,
  },
  {
    id: "friction_findings",
    label: "Friction findings",
    description: "When a new lesson-level friction finding is detected.",
    defaultOn: true,
  },
  {
    id: "campaign_pauses",
    label: "Campaign pauses",
    description: "When a campaign is paused automatically due to a safety rule.",
    defaultOn: false,
  },
  {
    id: "sync_problems",
    label: "Sync problems",
    description: "When the Whop membership sync encounters errors.",
    defaultOn: true,
  },
  {
    id: "plan_limits",
    label: "Plan limits",
    description: "When you approach the monthly intervention limit.",
    defaultOn: true,
  },
  {
    id: "weekly_summary",
    label: "Weekly summary",
    description: "A Monday-morning digest of the prior week.",
    defaultOn: true,
  },
  {
    id: "daily_digest",
    label: "Daily digest",
    description: "A brief daily digest at 9:00 AM local time.",
    defaultOn: false,
  },
];

const AUTOMATION_MODE_SEGMENTS: { value: AutomationState; label: string }[] = [
  { value: "audit_only", label: "Audit only" },
  { value: "manual_approval", label: "Manual approval" },
  { value: "automatic", label: "Automatic" },
];

// ── Page ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const automationState = useDemoStore((s) => s.automationState);
  const setAutomationState = useDemoStore((s) => s.setAutomationState);
  const pauseAutomation = useDemoStore((s) => s.pauseAutomation);
  const resumeAutomation = useDemoStore((s) => s.resumeAutomation);

  const [active, setActive] = useState<SettingsSectionId>("workspace");

  // Workspace
  const [companyName, setCompanyName] = useState(COMPANY.name);
  const [defaultCourse, setDefaultCourse] = useState(COURSE.id);
  const [timezone, setTimezone] = useState("America/New_York");
  const [notifEmail, setNotifEmail] = useState("creator@creatorgrowthlab.com");

  // Automation
  const [quietStart, setQuietStart] = useState("20:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [cooldownDays, setCooldownDays] = useState(14);
  const [maxMessages, setMaxMessages] = useState(3);

  // Notifications
  const [notifState, setNotifState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_TOGGLES.map((t) => [t.id, t.defaultOn])),
  );

  // Data & privacy
  const [retention, setRetention] = useState("90");

  // Plan
  const interventionsUsed = KPIS.interventionsSent;
  const interventionsPct = Math.min(
    100,
    Math.round((interventionsUsed / PLAN_INTERVENTION_LIMIT) * 100),
  );

  const isPaused = automationState === "paused";

  function handleAutomationModeChange(next: AutomationState) {
    setAutomationState(next);
    toast.success(`Automation mode: ${next.replace(/_/g, " ")}`);
  }

  function handlePauseToggle() {
    if (isPaused) {
      resumeAutomation();
      toast.success("Automation resumed");
    } else {
      pauseAutomation();
      toast.info("Automation paused — no interventions will be sent");
    }
  }

  function handleSyncNow() {
    toast.success("Sync started — memberships refreshing from Whop");
  }

  function handleExport(kind: "students" | "interventions" | "value") {
    toast.success(`Exported ${kind}.csv`);
  }

  function toggleNotif(id: string, next: boolean) {
    setNotifState((prev) => ({ ...prev, [id]: next }));
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <header className="flex items-baseline gap-3">
        <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
          Settings
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr] lg:gap-8">
        <SettingsNav active={active} onChange={setActive} />

        <div className="flex flex-col gap-6">
          {/* Workspace */}
          {active === "workspace" && (
            <>
              <GroupedList
                title="Workspace"
                description="Identity, course, and timezone preferences"
              >
                <Row label="Company name" description="Displayed across RescueLoop">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-8 w-[200px] rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px]"
                  />
                </Row>
                <Row label="Default course" description="Course used for RescueLoop monitoring">
                  <Select value={defaultCourse} onValueChange={setDefaultCourse}>
                    <SelectTrigger className="h-8 w-[200px] rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {COURSES_FOR_SELECTION.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-[12px]">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Timezone" description="Used for quiet hours and daily digests">
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-8 w-[200px] rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value} className="text-[12px]">
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Notification email" description="Where alerts are sent" last>
                  <Input
                    type="email"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    className="h-8 w-[220px] rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px]"
                  />
                </Row>
              </GroupedList>
            </>
          )}

          {/* Whop connection */}
          {active === "whop" && (
            <GroupedList
              title="Whop connection"
              description="Sync status and product mapping"
            >
              <Row label="Connection status" description="Whop API connection">
                <span className="flex items-center gap-1.5 border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] px-2 py-0.5 text-[11px] font-medium text-[var(--recovery-green)]">
                  <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
                  Connected
                </span>
              </Row>
              <Row label="Last sync">
                <ValueLabel mono>{LAST_SYNC}</ValueLabel>
              </Row>
              <Row label="Next sync">
                <ValueLabel mono>{NEXT_SYNC}</ValueLabel>
              </Row>
              <Row label="Sync now" description="Force a manual sync from Whop" last>
                <Button
                  size="sm"
                  onClick={handleSyncNow}
                  className="h-8 rounded-none bg-[var(--ink-primary)] text-[var(--canvas)] hover:bg-[var(--ink-primary)]/90"
                >
                  <RefreshCw className="size-3.5" />
                  Sync now
                </Button>
              </Row>
            </GroupedList>
          )}

          {/* Product mapping (Whop sub-section) */}
          {active === "whop" && (
            <GroupedList
              title="Product mapping"
              description="Whop products mapped to RescueLoop courses"
            >
              <div className="flex flex-col">
                <div className="grid grid-cols-[1fr_1fr_60px] gap-2 border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    Whop product
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    Mapped course
                  </span>
                  <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    Price
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_60px] gap-2 px-4 py-2.5">
                  <span className="text-[12px] text-[var(--ink-primary)]">{PRODUCT.name}</span>
                  <span className="text-[12px] text-[var(--ink-secondary)]">{COURSE.name}</span>
                  <span className="text-right font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                    ${PRODUCT.price}
                  </span>
                </div>
              </div>
            </GroupedList>
          )}

          {/* Automation */}
          {active === "automation" && (
            <GroupedList
              title="Automation"
              description="Modes, quiet hours, and safety controls"
            >
              <Row label="Automation mode" description="Controls how interventions are dispatched">
                <SegmentedControl
                  ariaLabel="Automation mode"
                  size="sm"
                  segments={AUTOMATION_MODE_SEGMENTS}
                  value={isPaused ? "manual_approval" : automationState}
                  onChange={(v) => handleAutomationModeChange(v as AutomationState)}
                />
              </Row>
              <Row label="Pause automation" description={isPaused ? "Currently paused" : "Currently running"}>
                <Button
                  size="sm"
                  variant={isPaused ? "default" : "outline"}
                  onClick={handlePauseToggle}
                  className={cn(
                    "h-8 rounded-none",
                    isPaused
                      ? "bg-[var(--recovery-green)] text-white hover:bg-[var(--recovery-green)]/90"
                      : "border-[var(--critical)]/30 text-[var(--critical)] hover:bg-[var(--critical-light)]",
                  )}
                >
                  {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              </Row>
              <Row label="Quiet hours" description="No messages sent during these hours (local time)">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="h-8 w-[90px] rounded-none border-[var(--hairline)] bg-[var(--surface)] font-mono text-[12px] tabular-nums"
                  />
                  <span className="text-[12px] text-[var(--ink-muted)]">to</span>
                  <Input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="h-8 w-[90px] rounded-none border-[var(--hairline)] bg-[var(--surface)] font-mono text-[12px] tabular-nums"
                  />
                </div>
              </Row>
              <Row label="Cooldown" description="Days between interventions to the same member">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={cooldownDays}
                    onChange={(e) => setCooldownDays(Number(e.target.value))}
                    className="h-8 w-[60px] rounded-none border-[var(--hairline)] bg-[var(--surface)] font-mono text-[12px] tabular-nums"
                  />
                  <span className="text-[12px] text-[var(--ink-muted)]">days</span>
                </div>
              </Row>
              <Row label="Max messages per member" description="Per-month safety cap" last>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={maxMessages}
                    onChange={(e) => setMaxMessages(Number(e.target.value))}
                    className="h-8 w-[60px] rounded-none border-[var(--hairline)] bg-[var(--surface)] font-mono text-[12px] tabular-nums"
                  />
                  <span className="text-[12px] text-[var(--ink-muted)]">/ month</span>
                </div>
              </Row>
            </GroupedList>
          )}

          {/* Notifications */}
          {active === "notifications" && (
            <GroupedList
              title="Notifications"
              description="What you get alerted about"
            >
              {NOTIFICATION_TOGGLES.map((t, i) => (
                <Row
                  key={t.id}
                  label={t.label}
                  description={t.description}
                  last={i === NOTIFICATION_TOGGLES.length - 1}
                >
                  <Switch
                    checked={notifState[t.id] ?? false}
                    onCheckedChange={(next) => toggleNotif(t.id, next)}
                    aria-label={t.label}
                  />
                </Row>
              ))}
            </GroupedList>
          )}

          {/* Team */}
          {active === "team" && (
            <GroupedList
              title="Team"
              description="Invite teammates to your workspace"
            >
              <Row
                label="Coming soon"
                description="Team invites, roles, and shared approval workflows are on the roadmap."
                last
              >
                <span className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Roadmap
                </span>
              </Row>
            </GroupedList>
          )}

          {/* Plan and usage */}
          {active === "plan" && (
            <>
              <GroupedList
                title="Plan and usage"
                description="Subscription, usage, and upgrades"
              >
                <Row label="Plan" description="RescueLoop Pro">
                  <ValueLabel mono>$29/mo</ValueLabel>
                </Row>
                <Row
                  label="Intervention usage"
                  description={`${interventionsUsed} of ${PLAN_INTERVENTION_LIMIT} monthly interventions used`}
                >
                  <div className="w-[140px]">
                    <div className="h-2 w-full overflow-hidden bg-[var(--hairline)]">
                      <div
                        className="h-full bg-[var(--recovery-green)] transition-all"
                        style={{ width: `${interventionsPct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                      <span>{interventionsPct}%</span>
                      <span>resets Feb 12</span>
                    </div>
                  </div>
                </Row>
                <Row label="Upgrade" description="Move to RescueLoop Scale for unlimited interventions" last>
                  <Button
                    size="sm"
                    onClick={() => toast.success("Upgrade flow started — Stripe checkout opening")}
                    className="h-8 rounded-none bg-[var(--recovery-green)] text-white hover:bg-[var(--recovery-green)]/90"
                  >
                    Upgrade plan
                  </Button>
                </Row>
              </GroupedList>
            </>
          )}

          {/* Data and privacy */}
          {active === "data" && (
            <>
              <GroupedList
                title="Data and privacy"
                description="Exports, retention, and deletion"
              >
                <Row label="Export students" description="Download all students as a CSV">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("students")}
                    className="h-8 rounded-none border-[var(--hairline)] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
                  >
                    <Download className="size-3.5" />
                    Export
                  </Button>
                </Row>
                <Row label="Export interventions" description="All interventions sent">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("interventions")}
                    className="h-8 rounded-none border-[var(--hairline)] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
                  >
                    <Download className="size-3.5" />
                    Export
                  </Button>
                </Row>
                <Row label="Export value ledger" description="All value events">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("value")}
                    className="h-8 rounded-none border-[var(--hairline)] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
                  >
                    <Download className="size-3.5" />
                    Export
                  </Button>
                </Row>
                <Row label="Retention period" description="How long RescueLoop stores raw events" last>
                  <Select value={retention} onValueChange={setRetention}>
                    <SelectTrigger className="h-8 w-[140px] rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {RETENTION_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-[12px]">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
              </GroupedList>

              {/* Destructive action — separated */}
              <GroupedList variant="destructive" title="History deletion">
                <Row
                  label="Delete intervention history"
                  description="Permanently delete all sent interventions and responses. Cannot be undone."
                  destructive
                  last
                >
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-none border-[var(--critical)]/30 text-[var(--critical)] hover:bg-[var(--critical-light)]"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete intervention history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes all sent interventions, responses, and
                          attribution evidence. Students will not be affected, but you will lose
                          the value ledger history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-none bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                          onClick={() => toast.success("Intervention history deleted")}
                        >
                          Delete history
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Row>
              </GroupedList>
            </>
          )}

          {/* Danger zone */}
          {active === "danger" && (
            <GroupedList
              variant="destructive"
              title="Danger zone"
              description="Irreversible account actions — separated from the rest of settings"
            >
              <Row
                label="Disconnect Whop"
                description="Stops all syncs and automation. Reconnect to resume."
                destructive
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-none border-[var(--critical)]/30 text-[var(--critical)] hover:bg-[var(--critical-light)]"
                    >
                      <Unplug className="size-3.5" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-none sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Whop?</AlertDialogTitle>
                      <AlertDialogDescription>
                        All automation will pause and memberships will stop syncing. Existing
                        student data remains, but no new signals will be detected until you
                        reconnect.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-none bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                        onClick={() => toast.success("Whop disconnected — automation paused")}
                      >
                        Disconnect Whop
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Row>
              <Row
                label="Delete account"
                description="Permanently delete your workspace, students, interventions, and value history."
                destructive
                last
              >
                <DeleteAccountDialog />
              </Row>
            </GroupedList>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteAccountDialog() {
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [confirmText, setConfirmText] = useState("");

  return (
    <AlertDialog
      open={step === "confirm"}
      onOpenChange={(o) => {
        if (!o) {
          setStep("idle");
          setConfirmText("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStep("confirm")}
          className="h-8 rounded-none border-[var(--critical)]/30 bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
        >
          <Trash2 className="size-3.5" />
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-none sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your RescueLoop account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your workspace, students, interventions, value ledger, and
            all settings. <span className="font-semibold text-[var(--critical)]">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <label className="text-[12px] text-[var(--ink-secondary)]">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="h-9 rounded-none border-[var(--critical)]/30 font-mono text-[13px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-none"
            onClick={() => {
              setStep("idle");
              setConfirmText("");
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmText !== "DELETE"}
            className="rounded-none bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90 disabled:opacity-40"
            onClick={() => {
              toast.success("Account scheduled for deletion");
              setStep("idle");
              setConfirmText("");
            }}
          >
            Delete account permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
