"use client";

// Client component that fetches diagnostics from the company-scoped API
// and renders them in a structured, redacted format.

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface DiagnosticsData {
  companyId: string;
  organization: {
    id: string;
    name: string;
    status: string;
    planTier: string;
    isPaused: boolean;
    timezone: string;
  };
  installation: {
    status: string;
    grantedScopes: string[];
    installedAt: string | null;
  } | null;
  sync: {
    lastSyncState: string | null;
    lastSyncStartedAt: string | null;
    lastSyncCompletedAt: string | null;
    lastSyncError: string | null;
    totalSyncs: number;
  };
  billing: {
    entitlementState: string | null;
    planTier: string | null;
    billingPeriodEnd: string | null;
  };
  usage: {
    currentPeriod: string;
    metrics: Array<{ metric: string; count: number }>;
  };
  webhookHealth: {
    totalReceived: number;
    totalProcessed: number;
    totalFailed: number;
    totalDuplicate: number;
  };
  outboxHealth: {
    pending: number;
    dispatched: number;
    failed: number;
    deadLetter: number;
  };
  checkedAt: string;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-[var(--ink-secondary)]">{label}</span>
      <span className="font-mono text-[var(--ink-primary)]">
        {value ?? "—"}
      </span>
    </div>
  );
}

function HealthBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="font-mono text-[10px]">N/A</Badge>;

  const isHealthy = status === "active" || status === "completed";
  const isCritical = status === "failed" || status === "inactive" || status === "billing_error";

  return (
    <Badge
      variant={isCritical ? "destructive" : isHealthy ? "default" : "secondary"}
      className="font-mono text-[10px]"
    >
      {isCritical && <XCircle className="mr-1 size-3" />}
      {isHealthy && <CheckCircle2 className="mr-1 size-3" />}
      {!isHealthy && !isCritical && <AlertTriangle className="mr-1 size-3" />}
      {status}
    </Badge>
  );
}

export function DiagnosticsClient({ companyId }: { companyId: string }) {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchDiagnostics() {
      try {
        const res = await fetch(`/api/dashboard/${companyId}/diagnostics`);
        if (!res.ok) {
          setError(`Failed to load diagnostics (${res.status})`);
          return;
        }
        const json = (await res.json()) as DiagnosticsData;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDiagnostics();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  function handleExport() {
    if (!data) return;
    setExporting(true);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rescueloop-diagnostics-${companyId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-[14px] text-[var(--ink-muted)]">
          Unable to load diagnostics: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* ── Organization ───────────────────────────────────── */}
      <SectionCard title="Organization">
        <StatusRow label="Name" value={data.organization.name} />
        <StatusRow label="Status" value={data.organization.status} />
        <StatusRow label="Plan" value={data.organization.planTier} />
        <StatusRow label="Paused" value={data.organization.isPaused ? "Yes" : "No"} />
        <StatusRow label="Timezone" value={data.organization.timezone} />
      </SectionCard>

      {/* ── Installation ───────────────────────────────────── */}
      <SectionCard title="Whop Installation">
        {data.installation ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--ink-secondary)]">Status</span>
              <HealthBadge status={data.installation.status} />
            </div>
            <StatusRow
              label="Installed at"
              value={
                data.installation.installedAt
                  ? new Date(data.installation.installedAt).toLocaleString()
                  : "—"
              }
            />
            {data.installation.grantedScopes.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[12px] font-semibold text-[var(--ink-secondary)]">
                  Granted scopes:
                </span>
                <div className="flex flex-wrap gap-1">
                  {data.installation.grantedScopes.map((scope) => (
                    <Badge
                      key={scope}
                      variant="outline"
                      className="font-mono text-[10px]"
                    >
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[13px] text-[var(--ink-muted)]">
            No installation found.
          </p>
        )}
      </SectionCard>

      {/* ── Sync ──────────────────────────────────────────── */}
      <SectionCard title="Sync Pipeline">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[var(--ink-secondary)]">Last state</span>
          <HealthBadge status={data.sync.lastSyncState} />
        </div>
        <StatusRow
          label="Started at"
          value={
            data.sync.lastSyncStartedAt
              ? new Date(data.sync.lastSyncStartedAt).toLocaleString()
              : "—"
          }
        />
        <StatusRow
          label="Completed at"
          value={
            data.sync.lastSyncCompletedAt
              ? new Date(data.sync.lastSyncCompletedAt).toLocaleString()
              : "—"
          }
        />
        {data.sync.lastSyncError && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
            <p className="font-mono text-[12px] text-red-700">
              {data.sync.lastSyncError}
            </p>
          </div>
        )}
        <StatusRow label="Total syncs" value={data.sync.totalSyncs} />
      </SectionCard>

      {/* ── Billing ───────────────────────────────────────── */}
      <SectionCard title="Billing & Entitlement">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[var(--ink-secondary)]">Entitlement</span>
          <HealthBadge status={data.billing.entitlementState} />
        </div>
        <StatusRow label="Plan" value={data.billing.planTier} />
        <StatusRow
          label="Period ends"
          value={
            data.billing.billingPeriodEnd
              ? new Date(data.billing.billingPeriodEnd).toLocaleDateString()
              : "—"
          }
        />
      </SectionCard>

      {/* ── Usage ─────────────────────────────────────────── */}
      <SectionCard title={`Usage (${data.usage.currentPeriod})`}>
        {data.usage.metrics.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-muted)]">
            No usage data for the current period.
          </p>
        ) : (
          data.usage.metrics.map((m) => (
            <StatusRow key={m.metric} label={m.metric} value={m.count} />
          ))
        )}
      </SectionCard>

      {/* ── Webhook Health ─────────────────────────────────── */}
      <SectionCard title="Webhook Processing">
        <StatusRow label="Received" value={data.webhookHealth.totalReceived} />
        <StatusRow label="Processed" value={data.webhookHealth.totalProcessed} />
        <StatusRow label="Failed" value={data.webhookHealth.totalFailed} />
        <StatusRow label="Duplicate" value={data.webhookHealth.totalDuplicate} />
      </SectionCard>

      {/* ── Outbox Health ──────────────────────────────────── */}
      <SectionCard title="Outbox Events">
        <StatusRow label="Pending" value={data.outboxHealth.pending} />
        <StatusRow label="Dispatched" value={data.outboxHealth.dispatched} />
        <StatusRow label="Failed" value={data.outboxHealth.failed} />
        <StatusRow label="Dead letter" value={data.outboxHealth.deadLetter} />
      </SectionCard>

      {/* ── Export button ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : exported ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <Download className="size-4" />
          )}
          {exported ? "Exported" : "Export JSON"}
        </Button>
        <span className="text-[12px] text-[var(--ink-muted)]">
          Checked at {new Date(data.checkedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
