"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/layout-primitives";
import { AutomationStatePill } from "@/components/shared/status-pills";
import {
  SettingsNav,
  type SettingsSectionId,
} from "@/components/rescueloop/settings/settings-nav";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUTOMATION_STATE,
  COMPANY,
  COURSE,
  COURSES_FOR_SELECTION,
  KPIS,
  LAST_SYNC,
  NEXT_SYNC,
  PRODUCT,
} from "@/lib/mock-data";
import { automationStateMeta } from "@/lib/format";
import type { AutomationState } from "@/lib/types";

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
    label: "New help requests from students",
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
    id: "confirmed_recoveries",
    label: "Confirmed recoveries",
    description: "When an intervention leads to a retained member.",
    defaultOn: true,
  },
  {
    id: "course_friction",
    label: "Course friction findings",
    description: "When RescueLoop identifies a stall pattern in a lesson.",
    defaultOn: true,
  },
  {
    id: "campaign_pauses",
    label: "Campaign pauses",
    description: "When a campaign is paused by safety rules or manually.",
    defaultOn: true,
  },
  {
    id: "sync_problems",
    label: "Synchronization problems",
    description: "When the Whop connection fails or data is stale.",
    defaultOn: true,
  },
  {
    id: "plan_limit",
    label: "Plan limit notices",
    description: "When you approach your monthly intervention quota.",
    defaultOn: true,
  },
  {
    id: "weekly_summary",
    label: "Weekly summary email",
    description: "A digest of recoveries and value recovered, sent Mondays.",
    defaultOn: false,
  },
  {
    id: "daily_digest",
    label: "Daily digest",
    description: "A short daily summary of queue activity, sent at 8:00.",
    defaultOn: false,
  },
];

const AUTOMATION_MODES: {
  value: AutomationState;
  label: string;
  description: string;
}[] = [
  {
    value: "audit_only",
    label: "Audit only",
    description: "Detect risk signals. No messages will be sent.",
  },
  {
    value: "manual_approval",
    label: "Manual approval",
    description: "You approve every intervention before it is sent.",
  },
  {
    value: "automatic",
    label: "Automatic",
    description:
      "Approved interventions send automatically within safety rules.",
  },
];

// ── Page ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("general");

  // General
  const [companyName, setCompanyName] = useState(COMPANY.name);
  const [defaultCourseId, setDefaultCourseId] = useState(COURSE.id);
  const [timezone, setTimezone] = useState("America/New_York");
  const [notificationEmail, setNotificationEmail] = useState(
    "team@creatorgrowthlab.com",
  );

  // Automation
  const [automationMode, setAutomationMode] =
    useState<AutomationState>(AUTOMATION_STATE);
  const [isPaused, setIsPaused] = useState(false);
  const [quietStart, setQuietStart] = useState("20:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [cooldownDays, setCooldownDays] = useState(14);
  const [maxMessagesPerMonth, setMaxMessagesPerMonth] = useState(3);

  // Notifications
  const [notificationState, setNotificationState] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      NOTIFICATION_TOGGLES.map((t) => [t.id, t.defaultOn]),
    ),
  );

  // Whop / product mappings
  const [productMappings, setProductMappings] = useState<
    { id: string; product: string; courseId: string }[]
  >([
    {
      id: "pm_agency",
      product: PRODUCT.name,
      courseId: COURSE.id,
    },
  ]);

  // Data & privacy
  const [retention, setRetention] = useState("90");

  // Danger zone: delete account confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const displayAutomationState: AutomationState = isPaused
    ? "paused"
    : automationMode;

  const interventionsUsed = KPIS.interventionsSent;
  const interventionsPct = Math.min(
    100,
    Math.round((interventionsUsed / PLAN_INTERVENTION_LIMIT) * 100),
  );

  return (
    <div className="pb-8">
      <PageHeader
        title="Settings"
        description="Workspace, automation, billing, and data preferences"
      />

      <div className="grid gap-6 lg:grid-cols-[12rem_1fr] lg:gap-8">
        <SettingsNav active={active} onChange={setActive} />

        <div className="min-w-0 space-y-6">
          {active === "general" && (
            <GeneralSection
              companyName={companyName}
              setCompanyName={setCompanyName}
              defaultCourseId={defaultCourseId}
              setDefaultCourseId={setDefaultCourseId}
              timezone={timezone}
              setTimezone={setTimezone}
              notificationEmail={notificationEmail}
              setNotificationEmail={setNotificationEmail}
            />
          )}

          {active === "automation" && (
            <AutomationSection
              displayState={displayAutomationState}
              automationMode={automationMode}
              setAutomationMode={setAutomationMode}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              quietStart={quietStart}
              setQuietStart={setQuietStart}
              quietEnd={quietEnd}
              setQuietEnd={setQuietEnd}
              cooldownDays={cooldownDays}
              setCooldownDays={setCooldownDays}
              maxMessagesPerMonth={maxMessagesPerMonth}
              setMaxMessagesPerMonth={setMaxMessagesPerMonth}
            />
          )}

          {active === "whop" && (
            <WhopSection
              productMappings={productMappings}
              setProductMappings={setProductMappings}
            />
          )}

          {active === "notifications" && (
            <NotificationsSection
              state={notificationState}
              setState={setNotificationState}
            />
          )}

          {active === "plan" && (
            <PlanSection
              interventionsUsed={interventionsUsed}
              interventionsPct={interventionsPct}
            />
          )}

          {active === "data" && (
            <DataSection
              retention={retention}
              setRetention={setRetention}
            />
          )}

          {active === "danger" && (
            <DangerSection
              deleteConfirmText={deleteConfirmText}
              setDeleteConfirmText={setDeleteConfirmText}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared section helpers ───────────────────────────────────

function SectionShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-[#E3E5DF] py-5">
        <CardTitle className="text-base font-semibold text-[#171A17]">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-[#6A706A]">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
      {footer && (
        <div className="flex flex-col items-stretch gap-2 border-t border-[#E3E5DF] bg-[#F8F8F5] px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          {footer}
        </div>
      )}
    </Card>
  );
}

function FieldRow({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 px-6 py-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-4 sm:py-5">
      <div className="sm:pt-2">
        <Label
          htmlFor={htmlFor}
          className="text-sm font-medium text-[#171A17]"
        >
          {label}
        </Label>
        {description && (
          <p className="mt-1 text-xs leading-snug text-[#6A706A]">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ── 1. General ───────────────────────────────────────────────

interface GeneralSectionProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  defaultCourseId: string;
  setDefaultCourseId: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  notificationEmail: string;
  setNotificationEmail: (v: string) => void;
}

function GeneralSection({
  companyName,
  setCompanyName,
  defaultCourseId,
  setDefaultCourseId,
  timezone,
  setTimezone,
  notificationEmail,
  setNotificationEmail,
}: GeneralSectionProps) {
  return (
    <SectionShell
      title="General"
      description="Workspace identity and defaults used across RescueLoop."
      footer={
        <Button
          onClick={() => toast.success("Settings saved")}
          className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
        >
          Save changes
        </Button>
      }
    >
      <FieldRow label="Company name" htmlFor="company-name">
        <Input
          id="company-name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="max-w-md"
        />
      </FieldRow>
      <Separator className="bg-[#E3E5DF]" />
      <FieldRow
        label="Default course"
        htmlFor="default-course"
        description="The course RescueLoop monitors by default across dashboards."
      >
        <Select value={defaultCourseId} onValueChange={setDefaultCourseId}>
          <SelectTrigger id="default-course" className="max-w-md">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {COURSES_FOR_SELECTION.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <Separator className="bg-[#E3E5DF]" />
      <FieldRow
        label="Timezone"
        htmlFor="timezone"
        description="Used for quiet hours, scheduling, and digest emails."
      >
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="timezone" className="max-w-md">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <Separator className="bg-[#E3E5DF]" />
      <FieldRow
        label="Notification email"
        htmlFor="notification-email"
        description="Where operational alerts and summaries are delivered."
      >
        <Input
          id="notification-email"
          type="email"
          value={notificationEmail}
          onChange={(e) => setNotificationEmail(e.target.value)}
          className="max-w-md"
        />
      </FieldRow>
    </SectionShell>
  );
}

// ── 2. Automation ────────────────────────────────────────────

interface AutomationSectionProps {
  displayState: AutomationState;
  automationMode: AutomationState;
  setAutomationMode: (v: AutomationState) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  quietStart: string;
  setQuietStart: (v: string) => void;
  quietEnd: string;
  setQuietEnd: (v: string) => void;
  cooldownDays: number;
  setCooldownDays: (v: number) => void;
  maxMessagesPerMonth: number;
  setMaxMessagesPerMonth: (v: number) => void;
}

function AutomationSection({
  displayState,
  automationMode,
  setAutomationMode,
  isPaused,
  setIsPaused,
  quietStart,
  setQuietStart,
  quietEnd,
  setQuietEnd,
  cooldownDays,
  setCooldownDays,
  maxMessagesPerMonth,
  setMaxMessagesPerMonth,
}: AutomationSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-[#E3E5DF] py-5">
          <CardTitle className="text-base font-semibold text-[#171A17]">
            Current automation state
          </CardTitle>
          <CardDescription className="text-sm text-[#6A706A]">
            Live status of intervention automation across all campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AutomationStatePill state={displayState} />
            <p className="text-sm text-[#6A706A]">
              {automationStateMeta[displayState].description}
            </p>
          </div>
          {isPaused ? (
            <Button
              onClick={() => {
                setIsPaused(false);
                toast.success("Automation resumed");
              }}
              className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
            >
              <Play className="size-4" />
              Resume automation
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[#E8C9C5] bg-white text-[#C64D45] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
                >
                  <Pause className="size-4" />
                  Pause all automation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pause all automation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    No new interventions will be sent. In-progress campaigns
                    stop scheduling. You can resume at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="border-[#E8C9C5] bg-white text-[#C64D45] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
                    onClick={() => {
                      setIsPaused(true);
                      toast.error("All automation paused");
                    }}
                  >
                    Pause automation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>

      <SectionShell
        title="Automation mode"
        description="Choose how approved interventions are delivered."
      >
        <RadioGroup
          value={automationMode}
          onValueChange={(v) => setAutomationMode(v as AutomationState)}
          className="gap-0"
        >
          {AUTOMATION_MODES.map((mode, idx) => {
            const isSelected = automationMode === mode.value;
            return (
              <div key={mode.value}>
                {idx > 0 && <Separator className="bg-[#E3E5DF]" />}
                <Label
                  htmlFor={`mode-${mode.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-6 py-4 transition-colors",
                    isSelected ? "bg-[#E8F5EF]/40" : "hover:bg-[#F8F8F5]",
                  )}
                >
                  <RadioGroupItem
                    id={`mode-${mode.value}`}
                    value={mode.value}
                    className="mt-1 border-[#147D68] text-[#147D68]"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[#171A17]">
                      {mode.label}
                    </span>
                    <span className="text-xs leading-snug text-[#6A706A]">
                      {mode.description}
                    </span>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </SectionShell>

      <SectionShell
        title="Safety controls"
        description="Default guardrails applied to every campaign unless overridden."
      >
        <FieldRow
          label="Quiet hours"
          htmlFor="quiet-start"
          description="No interventions are sent during this window."
        >
          <div className="flex items-center gap-2">
            <Input
              id="quiet-start"
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="w-32 tabular-mono"
            />
            <span className="text-sm text-[#6A706A]">to</span>
            <Input
              id="quiet-end"
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="w-32 tabular-mono"
            />
          </div>
        </FieldRow>
        <Separator className="bg-[#E3E5DF]" />
        <FieldRow
          label="Default cooldown"
          htmlFor="cooldown"
          description="Minimum days between interventions to the same member."
        >
          <div className="flex items-center gap-2">
            <Input
              id="cooldown"
              type="number"
              min={1}
              max={90}
              value={cooldownDays}
              onChange={(e) =>
                setCooldownDays(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-24 tabular-mono"
            />
            <span className="text-sm text-[#6A706A]">days</span>
          </div>
        </FieldRow>
        <Separator className="bg-[#E3E5DF]" />
        <FieldRow
          label="Max messages per member"
          htmlFor="max-messages"
          description="Per calendar month. Members exceeding this are excluded."
        >
          <div className="flex items-center gap-2">
            <Input
              id="max-messages"
              type="number"
              min={1}
              max={20}
              value={maxMessagesPerMonth}
              onChange={(e) =>
                setMaxMessagesPerMonth(
                  Math.max(1, Number(e.target.value) || 1),
                )
              }
              className="w-24 tabular-mono"
            />
            <span className="text-sm text-[#6A706A]">messages / month</span>
          </div>
        </FieldRow>
      </SectionShell>
    </div>
  );
}

// ── 3. Whop connection ───────────────────────────────────────

interface WhopSectionProps {
  productMappings: { id: string; product: string; courseId: string }[];
  setProductMappings: React.Dispatch<
    React.SetStateAction<{ id: string; product: string; courseId: string }[]>
  >;
}

function WhopSection({ productMappings, setProductMappings }: WhopSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-[#E3E5DF] py-5">
          <CardTitle className="text-base font-semibold text-[#171A17]">
            Connection status
          </CardTitle>
          <CardDescription className="text-sm text-[#6A706A]">
            RescueLoop syncs members, progress, and cancellations from Whop.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="border-[#C7E6D5] bg-[#E8F5EF] text-[#27966A]"
              >
                <span className="size-1.5 rounded-full bg-[#27966A]" />
                Connected
              </Badge>
              <div className="flex items-center gap-4 text-sm text-[#6A706A]">
                <span>
                  Last sync:{" "}
                  <span className="tabular-mono text-[#171A17]">
                    {LAST_SYNC}
                  </span>
                </span>
                <span className="hidden text-[#E3E5DF] sm:inline">|</span>
                <span>
                  Next sync:{" "}
                  <span className="tabular-mono text-[#171A17]">
                    {NEXT_SYNC}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => toast.success("Sync started")}
                className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
              >
                <RefreshCw className="size-4" />
                Sync now
              </Button>
              <Button
                variant="ghost"
                onClick={() => toast.info("Redirecting to Whop…")}
                className="text-[#6A706A] hover:bg-[#F8F8F5] hover:text-[#171A17]"
              >
                Reconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionShell
        title="Product mapping"
        description="Map each Whop product to the course RescueLoop monitors."
        footer={
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Add product mapping coming soon")
            }
            className="border-[#E3E5DF] bg-white text-[#171A17] hover:bg-[#F8F8F5]"
          >
            <Plus className="size-4" />
            Add product mapping
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="border-[#E3E5DF] hover:bg-transparent">
              <TableHead className="pl-6 text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                Whop product
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                RescueLoop course
              </TableHead>
              <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productMappings.map((m) => (
              <TableRow
                key={m.id}
                className="border-[#E3E5DF] hover:bg-[#F8F8F5]"
              >
                  <TableCell className="pl-6 py-3.5 text-sm font-medium text-[#171A17]">
                    {m.product}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Select
                      value={m.courseId}
                      onValueChange={(v) =>
                        setProductMappings((prev) =>
                          prev.map((p) =>
                            p.id === m.id ? { ...p, courseId: v } : p,
                          ),
                        )
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-8 w-full max-w-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSES_FOR_SELECTION.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="pr-6 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProductMappings((prev) =>
                          prev.filter((p) => p.id !== m.id),
                        );
                        toast.success("Product mapping removed");
                      }}
                      className="text-[#6A706A] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
            {productMappings.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="px-6 py-8 text-center text-sm text-[#6A706A]"
                >
                  No product mappings yet. Add one to start monitoring.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionShell>
    </div>
  );
}

// ── 4. Notifications ─────────────────────────────────────────

function NotificationsSection({
  state,
  setState,
}: {
  state: Record<string, boolean>;
  setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <SectionShell
      title="Notifications"
      description="Choose what RescueLoop alerts you about. Email is delivered to your notification address."
    >
      <div className="divide-y divide-[#E3E5DF]">
        {NOTIFICATION_TOGGLES.map((toggle) => {
          const value = state[toggle.id] ?? toggle.defaultOn;
          return (
            <div
              key={toggle.id}
              className="flex items-start justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#171A17]">
                  {toggle.label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-[#6A706A]">
                  {toggle.description}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => {
                  setState((prev) => ({ ...prev, [toggle.id]: checked }));
                  toast.success(
                    `${toggle.label} ${checked ? "enabled" : "disabled"}`,
                  );
                }}
                className="data-[state=checked]:bg-[#147D68] data-[state=unchecked]:bg-[#E3E5DF]"
              />
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

// ── 5. Plan & billing ────────────────────────────────────────

function PlanSection({
  interventionsUsed,
  interventionsPct,
}: {
  interventionsUsed: number;
  interventionsPct: number;
}) {
  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-[#E3E5DF] py-5">
          <CardTitle className="text-base font-semibold text-[#171A17]">
            Current plan
          </CardTitle>
          <CardDescription className="text-sm text-[#6A706A]">
            Your subscription and monthly intervention quota.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-[#171A17]">
                  RescueLoop Pro
                </span>
                <span className="tabular-mono text-sm text-[#6A706A]">
                  ${KPIS.planCost}/month
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6A706A]">
                Includes 100 interventions per month, full automation, and
                value-ledger reporting.
              </p>
            </div>
            <Button
              onClick={() => toast.info("Upgrade flow coming soon")}
              className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
            >
              Upgrade plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-[#E3E5DF] py-5">
          <CardTitle className="text-base font-semibold text-[#171A17]">
            Usage this cycle
          </CardTitle>
          <CardDescription className="text-sm text-[#6A706A]">
            Resets on February 12.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#6A706A]">
              Interventions sent
            </span>
            <span className="tabular-mono text-sm text-[#171A17]">
              <span className="font-semibold">{interventionsUsed}</span>
              <span className="text-[#6A706A]">
                {" "}
                / {PLAN_INTERVENTION_LIMIT}
              </span>
            </span>
          </div>
          <Progress
            value={interventionsPct}
            className="mt-3 h-2 bg-[#F0F2EC] [&>div]:bg-[#147D68]"
          />
          <p className="mt-2 text-xs text-[#6A706A]">
            {PLAN_INTERVENTION_LIMIT - interventionsUsed} interventions
            remaining this cycle.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-[#E3E5DF] py-5">
          <CardTitle className="text-base font-semibold text-[#171A17]">
            Billing
          </CardTitle>
          <CardDescription className="text-sm text-[#6A706A]">
            Manage how you pay and review past invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[#E3E5DF] px-0">
          <button
            onClick={() => toast.info("Opening billing history…")}
            className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-[#F8F8F5]"
          >
            <span className="text-sm font-medium text-[#171A17]">
              View billing history
            </span>
            <ExternalLink className="size-4 text-[#6A706A]" />
          </button>
          <button
            onClick={() => toast.info("Opening payment method…")}
            className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-[#F8F8F5]"
          >
            <span className="text-sm font-medium text-[#171A17]">
              Manage payment method
            </span>
            <ExternalLink className="size-4 text-[#6A706A]" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── 6. Data & privacy ────────────────────────────────────────

function DataSection({
  retention,
  setRetention,
}: {
  retention: string;
  setRetention: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionShell
        title="Exports"
        description="Download a copy of your data. Exports are CSV and ready in under a minute."
      >
        <div className="flex flex-col gap-3 px-6 py-5">
          <Button
            variant="outline"
            onClick={() => toast.success("Exporting student data (CSV)…")}
            className="justify-start border-[#E3E5DF] bg-white text-[#171A17] hover:bg-[#F8F8F5]"
          >
            <Download className="size-4" />
            Export student data
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("Exporting value ledger (CSV)…")}
            className="justify-start border-[#E3E5DF] bg-white text-[#171A17] hover:bg-[#F8F8F5]"
          >
            <Download className="size-4" />
            Export value ledger
          </Button>
        </div>
      </SectionShell>

      <SectionShell
        title="Retention"
        description="How long RescueLoop keeps intervention history and student activity."
      >
        <FieldRow
          label="Data retention period"
          htmlFor="retention"
          description="Older records are permanently deleted after this window."
        >
          <Select value={retention} onValueChange={setRetention}>
            <SelectTrigger id="retention" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RETENTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </SectionShell>

      <Card className="gap-0 border-[#E8C9C5] py-0">
        <CardHeader className="border-b border-[#E8C9C5] py-5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#C64D45]">
            <ShieldAlert className="size-4" />
            Delete intervention history
          </CardTitle>
          <CardDescription className="text-sm text-[#6A706A]">
            Permanently remove every intervention record, message, and response.
            Student data and course progress are preserved.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-[#E8C9C5] bg-white text-[#C64D45] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
              >
                <Trash2 className="size-4" />
                Delete all intervention history
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete all intervention history?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes {KPIS.interventionsSent}{" "}
                  intervention records, their messages, and any responses. This
                  action cannot be undone and will affect your value ledger.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#C64D45] text-white hover:bg-[#C64D45]/90 focus-visible:ring-[#C64D45]/20"
                  onClick={() =>
                    toast.success("Intervention history deleted")
                  }
                >
                  Delete history
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-1">
        <Button
          variant="link"
          onClick={() => toast.info("Opening privacy policy…")}
          className="h-auto p-0 text-[#147D68] underline-offset-4 hover:underline"
        >
          Privacy policy
          <ExternalLink className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── 7. Danger zone ───────────────────────────────────────────

function DangerSection({
  deleteConfirmText,
  setDeleteConfirmText,
}: {
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
}) {
  return (
    <Card className="gap-0 border-[#E8C9C5] py-0">
      <CardHeader className="border-b border-[#E8C9C5] py-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#C64D45]">
          <ShieldAlert className="size-4" />
          Danger zone
        </CardTitle>
        <CardDescription className="text-sm text-[#6A706A]">
          Irreversible actions. Please read each prompt carefully.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-[#E3E5DF] px-0">
        {/* Disconnect Whop */}
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#171A17]">
              Disconnect Whop
            </p>
            <p className="mt-0.5 text-xs leading-snug text-[#6A706A]">
              Stops syncing, pauses automation, and revokes API access. Your
              data is retained.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="shrink-0 border-[#E8C9C5] bg-white text-[#C64D45] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
              >
                Disconnect Whop
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Whop?</AlertDialogTitle>
                <AlertDialogDescription>
                  Sync will stop, automation will pause, and all dashboards will
                  show stale data. You can reconnect at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="border-[#E8C9C5] bg-white text-[#C64D45] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
                  onClick={() =>
                    toast.error("Whop disconnected")
                  }
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete account */}
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#171A17]">
              Delete account
            </p>
            <p className="mt-0.5 text-xs leading-snug text-[#6A706A]">
              Permanently deletes your RescueLoop workspace, all student data,
              interventions, and the value ledger. Cannot be undone.
            </p>
          </div>
          <AlertDialog
            onOpenChange={(open) => {
              if (!open) setDeleteConfirmText("");
            }}
          >
            <AlertDialogTrigger asChild>
              <Button className="shrink-0 bg-[#C64D45] text-white hover:bg-[#C64D45]/90 focus-visible:ring-[#C64D45]/20">
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete account permanently?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the {COMPANY.name} workspace,
                  all {KPIS.totalStudents} students, {KPIS.interventionsSent}{" "}
                  interventions, and your full value ledger. This action cannot
                  be undone. Type{" "}
                  <span className="font-mono font-semibold text-[#C64D45]">
                    DELETE
                  </span>{" "}
                  to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
                autoComplete="off"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirmText !== "DELETE"}
                  className="bg-[#C64D45] text-white hover:bg-[#C64D45]/90 focus-visible:ring-[#C64D45]/20 disabled:opacity-50"
                  onClick={() => {
                    toast.success(
                      "Account scheduled for deletion",
                    );
                    setDeleteConfirmText("");
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
