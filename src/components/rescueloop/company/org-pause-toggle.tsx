"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Pause, Play, Loader2 } from "lucide-react";

interface OrgPauseToggleProps {
  companyId: string;
  isPaused: boolean;
}

export function OrgPauseToggle({ companyId, isPaused }: OrgPauseToggleProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/settings/pause`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            paused: !isPaused,
            reason: isPaused ? "admin_resumed" : "admin_paused",
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update.");
        return;
      }
      toast.success(isPaused ? "Automation resumed." : "Automation paused.");
      router.refresh();
      setOpen(false);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (isPaused) {
    return (
      <Button onClick={toggle} disabled={busy} className="gap-2">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        Resume automation
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-[var(--critical)]/40 text-[var(--critical)] hover:bg-[var(--critical-light)]/40 hover:text-[var(--critical)]"
        >
          <Pause className="size-4" />
          Pause automation
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause all automation?</AlertDialogTitle>
          <AlertDialogDescription>
            No new interventions will be sent while paused. Existing scheduled
            sends will be stopped at the delivery safety check. You can resume
            at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              await toggle();
            }}
            className="bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pause className="size-4" />
            )}
            Pause automation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
