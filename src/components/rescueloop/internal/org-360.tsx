"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Users,
  Target,
  DollarSign,
  RefreshCw,
  Play,
  Pause,
  AlertTriangle,
  Send,
  Trash2,
  Search,
  Flag,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "./audit-log";
import type { Org360, ExceptionSignal, AuditAction } from "@/lib/types/operations-internal";

interface Org360ViewProps {
  org: Org360;
}

const HEALTH_CONFIG = {
  healthy: { icon: ShieldCheck, color: "text-[var(--recovery-green)]", bg: "bg-[var(--recovery-light)]", label: "Healthy" },
  degraded: { icon: ShieldAlert, color: "text-[var(--warning)]", bg: "bg-[var(--warning-light)]", label: "Degraded" },
  critical: { icon: ShieldX, color: "text-[var(--critical)]", bg: "bg-[var(--critical-light)]", label: "Critical" },
} as const;

const SIGNAL_SEVERITY_DOT: Record<string, string> = {
  low: "bg-[#6A706A]",
  medium: "bg-[var(--warning)]",
  high: "bg-[var(--critical)]",
  critical: "bg-[var(--critical)]",
};

const SIGNAL_STATUS_DOT: Record<string, string> = {
  open: "bg-[var(--critical)]",
  investigating: "bg-[var(--warning)]",
  recovering: "bg-[var(--info)]",
  resolved: "bg-[var(--recovery-green)]",
  escalated: "bg-[var(--critical)]",
};

// Available operator actions with labels
const OPERATOR_ACTIONS: { action: AuditAction; label: string; icon: typeof RefreshCw; variant: "default" | "outline" | "destructive" }[] = [
  { action: "retry_operation", label: "Retry", icon: RefreshCw, variant: "outline" },
  { action: "force_sync", label: "Force Sync", icon: Play, variant: "outline" },
  { action: "resend_webhook", label: "Resend Webhook", icon: Send, variant: "outline" },
  { action: "run_diagnostics", label: "Diagnose", icon: Search, variant: "outline" },
  { action: "escalate", label: "Escalate", icon: AlertTriangle, variant: "outline" },
  { action: "suppress", label: "Suppress", icon: Pause, variant: "outline" },
  { action: "purge_dead_letter", label: "Purge DLQ", icon: Trash2, variant: "destructive" },
  { action: "flag_high_cost", label: "Flag Cost", icon: Flag, variant: "outline" },
];

export function Org360View({ org }: Org360ViewProps) {
  const [selectedSignal, setSelectedSignal] = useState<ExceptionSignal | null>(null);
  const hc = HEALTH_CONFIG[org.healthStatus];
  const HealthIcon = hc.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex size-12 items-center justify-center rounded-[8px] ${hc.bg}`}>
              <HealthIcon className={`size-6 ${hc.color}`} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">{org.orgName}</h2>
              <p className="mt-0.5 font-mono text-[12px] text-[var(--ink-muted)]">{org.orgId}</p>
            </div>
          </div>
          <Badge
            className={`${hc.bg} ${hc.color} border-0 text-[12px]`}
          >
            {hc.label}
          </Badge>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-2 gap-px border-t border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-4">
          <MetricTile icon={Users} label="Members" value={org.memberCount.toLocaleString()} />
          <MetricTile icon={Target} label="Active Interventions" value={org.activeInterventions.toString()} />
          <MetricTile
            icon={RefreshCw}
            label="Recovery Rate"
            value={`${(org.recoveryRate * 100).toFixed(0)}%`}
          />
          <MetricTile
            icon={DollarSign}
            label="Monthly Spend"
            value={`$${org.monthlySpend}`}
          />
        </div>
      </div>

      {/* Signals list */}
      <section>
        <h3 className="mb-3 font-serif text-[16px] text-[var(--ink-primary)]">
          Active Signals ({org.signals.length})
        </h3>
        <div className="flex flex-col gap-2">
          {org.signals.length === 0 && (
            <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] py-8 text-center text-[13px] text-[var(--ink-muted)]">
              No active signals — tenant is healthy
            </div>
          )}
          {org.signals.map((signal) => (
            <button
              key={signal.id}
              onClick={() => setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)}
              className={`flex items-start gap-3 rounded-[8px] border px-4 py-3 text-left transition-colors ${
                selectedSignal?.id === signal.id
                  ? "border-[var(--info)] bg-[#D6E4F0]/40"
                  : "border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${SIGNAL_SEVERITY_DOT[signal.severity]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--ink-primary)]">{signal.title}</span>
                  <span className={`size-1.5 rounded-full ${SIGNAL_STATUS_DOT[signal.status]}`} />
                  <span className="text-[10px] uppercase text-[var(--ink-muted)]">{signal.status}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--ink-muted)]">{signal.description}</p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">×{signal.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Selected signal detail + operator actions */}
      {selectedSignal && (
        <section className="rounded-[8px] border border-[var(--info)] bg-[#D6E4F0]/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-serif text-[15px] text-[var(--ink-primary)]">{selectedSignal.title}</h4>
              <p className="mt-1 text-[12px] text-[var(--ink-secondary)]">{selectedSignal.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--ink-muted)]">
                <span>Category: {selectedSignal.category.replace(/_/g, " ")}</span>
                <span>Severity: {selectedSignal.severity}</span>
                <span>Recoverable: {selectedSignal.recoverable ? "Yes" : "No"}</span>
                {selectedSignal.recoveryStrategy && (
                  <span>Strategy: {selectedSignal.recoveryStrategy}</span>
                )}
              </div>
            </div>
          </div>

          {/* Operator actions */}
          <div className="mt-4 border-t border-[var(--hairline)] pt-4">
            <p className="mb-2 text-[11px] font-medium uppercase text-[var(--ink-muted)]">
              Operator Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {OPERATOR_ACTIONS.map((oa) => (
                <AlertDialog key={oa.action}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={oa.variant}
                      size="sm"
                      className="gap-1.5 text-[11px]"
                    >
                      <oa.icon className="size-3" strokeWidth={2} />
                      {oa.label}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm: {oa.label}</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will execute <strong>{oa.label}</strong> on{" "}
                        <strong>{selectedSignal.title}</strong> for{" "}
                        <strong>{org.orgName}</strong>.
                        {oa.action === "purge_dead_letter" && " This action is destructive and cannot be undone."}
                        <br /><br />
                        All operator actions are audited and idempotent — repeating the same action with the same idempotency key will be a no-op.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className={
                          oa.variant === "destructive"
                            ? "bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                            : ""
                        }
                      >
                        Execute {oa.label}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Audit log */}
      <section>
        <AuditLog entries={org.recentEvents} />
      </section>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-[var(--surface)] px-4 py-3">
      <Icon className="size-4 text-[var(--ink-muted)]" strokeWidth={1.5} />
      <span className="font-mono text-[16px] tabular-nums text-[var(--ink-primary)]">{value}</span>
      <span className="text-[10px] text-[var(--ink-muted)]">{label}</span>
    </div>
  );
}
