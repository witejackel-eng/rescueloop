"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Check,
  X,
  CalendarClock,
  Ban,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueActionsProps {
  companyId: string;
  interventionId: string;
  studentName: string;
}

export function QueueActions({
  companyId,
  interventionId,
  studentName,
}: QueueActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [suppressOpen, setSuppressOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");

  async function postAction(
    action: "approve" | "dismiss" | "schedule" | "suppress",
    body?: Record<string, unknown>,
  ) {
    setBusy(action);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/queue/${encodeURIComponent(interventionId)}/${action}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: body ? JSON.stringify(body) : "{}",
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? `Failed to ${action}.`);
        return false;
      }
      toast.success(`${labelFor(action)} — ${studentName}`);
      router.refresh();
      return true;
    } catch {
      toast.error("Network error — please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  const defaultSchedule = (() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  })();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        disabled={busy !== null}
        onClick={() => postAction("approve")}
        className="gap-1.5"
      >
        {busy === "approve" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        Approve
      </Button>

      {/* Schedule */}
      <AlertDialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            className="gap-1.5"
          >
            <CalendarClock className="size-3.5" />
            Schedule
            <ChevronDown className="size-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule intervention</AlertDialogTitle>
            <AlertDialogDescription>
              Choose when to send the rescue message to {studentName}. The
              intervention will move to <span className="font-mono">scheduled</span> and deliver at the chosen time (subject to quiet hours).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <label
              htmlFor="schedule-time"
              className="text-[12px] text-[var(--ink-secondary)]"
            >
              Send at
            </label>
            <Input
              id="schedule-time"
              type="datetime-local"
              value={scheduledFor || defaultSchedule}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="font-mono text-[13px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy !== null}
              onClick={async (e) => {
                e.preventDefault();
                const value = scheduledFor || defaultSchedule;
                const ok = await postAction("schedule", {
                  scheduledFor: new Date(value).toISOString(),
                });
                if (ok) setScheduleOpen(false);
              }}
            >
              {busy === "schedule" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CalendarClock className="size-3.5" />
              )}
              Schedule send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        size="sm"
        variant="ghost"
        disabled={busy !== null}
        onClick={() => postAction("dismiss")}
        className="gap-1.5"
      >
        {busy === "dismiss" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <X className="size-3.5" />
        )}
        Dismiss
      </Button>

      {/* Suppress (destructive, double-confirm) */}
      <AlertDialog open={suppressOpen} onOpenChange={setSuppressOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy !== null}
            className={cn("gap-1.5 text-[var(--critical)] hover:text-[var(--critical)]")}
          >
            <Ban className="size-3.5" />
            Suppress
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop all reminders for {studentName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates an organisation-wide suppression. The student will
              not be contacted again and any pending access links will be
              revoked. This action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy !== null}
              className="bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
              onClick={async (e) => {
                e.preventDefault();
                const ok = await postAction("suppress", {
                  reason: "admin_initiated",
                  scope: "organization",
                });
                if (ok) setSuppressOpen(false);
              }}
            >
              {busy === "suppress" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Ban className="size-3.5" />
              )}
              Suppress student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function labelFor(action: string): string {
  switch (action) {
    case "approve":
      return "Approved";
    case "dismiss":
      return "Dismissed";
    case "schedule":
      return "Scheduled";
    case "suppress":
      return "Suppressed";
    default:
      return action;
  }
}
