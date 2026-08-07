"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Copy,
  CheckCircle2,
  Wifi,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Shield,
  Activity,
  Clock,
  Database,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";

export default function DiagnosticsPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  const company = bundle?.company;
  const healthDomains = bundle?.healthDomains ?? [];
  const healthyCount = healthDomains.filter((h) => h.status === "healthy").length;
  const degradedCount = healthDomains.filter((h) => h.status === "degraded").length;
  const unhealthyCount = healthDomains.filter((h) => h.status === "unhealthy").length;

  const diagnosticSummary = company
    ? `RescueLoop Diagnostic Summary
============================
Release SHA: abc1234
Company ID: ${company.id}
Company Name: ${company.name}
Whop connection: ${company.whopConnected ? "Connected" : "Disconnected"}
Sync status: ${company.lastSync}
Health: ${healthyCount}/${healthDomains.length} domains healthy${degradedCount > 0 ? ` (${degradedCount} degraded)` : ""}
Plan: ${company.plan} ($${company.planPrice}/mo)
Last successful sync: ${company.lastSync}
Browser: Modern (WebRTC supported)`
    : "Loading…";

  const STATUS_ICON = {
    healthy: CheckCircle2,
    degraded: AlertTriangle,
    unhealthy: AlertCircle,
  } as const;

  const STATUS_COLOR = {
    healthy: "text-[var(--recovery-green)]",
    degraded: "text-[var(--warning)]",
    unhealthy: "text-[var(--critical)]",
  } as const;

  const STATUS_BG = {
    healthy: "bg-[var(--recovery-green)]/10",
    degraded: "bg-[var(--warning)]/10",
    unhealthy: "bg-[var(--critical)]/10",
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Diagnostics</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Share this summary with support if you need help
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh diagnostics"
        >
          <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertCircle className="size-4" />
            <span>Failed to load diagnostics: {error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Quick status summary */}
      {!loading && company && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--recovery-green)]/10">
                  <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">{healthyCount}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Healthy domains</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--warning)]/10">
                  <AlertTriangle className="size-4 text-[var(--warning)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">{degradedCount}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Degraded</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--critical)]/10">
                  <AlertCircle className="size-4 text-[var(--critical)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">{unhealthyCount}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Down</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Diagnostic Details Card */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5">
        <h2 className="text-base font-semibold text-[var(--ink-primary)]">System Information</h2>
        <div className="mt-4 divide-y divide-[var(--hairline)]">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 items-center gap-4 py-2.5">
                <div className="h-2.5 w-28 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                <div className="ml-auto h-2.5 w-36 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
              </div>
            ))
          ) : (
            <>
              {[
                { label: "Release SHA", value: "abc1234", icon: Database, status: "neutral" as const },
                { label: "Company ID", value: company?.id ?? "—", icon: Server, status: "neutral" as const },
                { label: "Whop connection", value: company?.whopConnected ? "Connected" : "Disconnected", icon: Wifi, status: (company?.whopConnected ? "info" : "unhealthy") as const },
                { label: "Sync status", value: company?.systemHealth === "healthy" ? "Active" : "Degraded", icon: Activity, status: (company?.systemHealth === "healthy" ? "healthy" : "degraded") as const },
                { label: "Health", value: `${healthyCount}/${healthDomains.length} domains healthy`, icon: CheckCircle2, status: (healthyCount === healthDomains.length ? "healthy" : "degraded") as const },
                { label: "Plan", value: company ? `${company.plan} · $${company.planPrice}/mo` : "—", icon: Shield, status: "neutral" as const },
                { label: "Last successful sync", value: company?.lastSync ?? "—", icon: Clock, status: "neutral" as const },
              ].map(({ label, value, icon: Icon, status }) => (
                <div key={label} className="grid grid-cols-2 items-center gap-4 py-2.5 text-[12px]">
                  <div className="flex items-center gap-2 text-[var(--ink-muted)]">
                    <Icon className="size-3" />
                    {label}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {status !== "neutral" && (
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          status === "healthy" && "bg-[var(--recovery-green)]",
                          status === "info" && "bg-[var(--info)]",
                          status === "degraded" && "bg-[var(--warning)]",
                          status === "unhealthy" && "bg-[var(--critical)]"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        status === "healthy" && "text-[var(--recovery-green)]",
                        status === "info" && "text-[var(--info)]",
                        status === "degraded" && "text-[var(--warning)]",
                        status === "unhealthy" && "text-[var(--critical)]",
                        status === "neutral" && "text-[var(--ink-primary)]"
                      )}
                    >
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-[6px] text-[11px]"
            onClick={() => {
              navigator.clipboard?.writeText(diagnosticSummary);
              setCopied(true);
              toast.success("Diagnostic summary copied to clipboard");
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? (
              <CheckCircle2 className="mr-1.5 size-3.5 text-[var(--recovery-green)]" />
            ) : (
              <Copy className="mr-1.5 size-3.5" />
            )}
            Copy diagnostic summary
          </Button>
        </div>
      </Card>

      {/* Health Domain Cards */}
      {!loading && healthDomains.length > 0 && (
        <div>
          <h2 className="mb-3 text-[14px] font-medium text-[var(--ink-primary)]">Health Domains</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {healthDomains.map((h, i) => {
              const StatusIcon = STATUS_ICON[h.status];
              return (
                <motion.div
                  key={h.domain}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Card className="group rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("flex size-7 items-center justify-center rounded-[5px]", STATUS_BG[h.status])}>
                          <StatusIcon className={cn("size-3.5", STATUS_COLOR[h.status])} />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-[var(--ink-primary)]">{h.domain}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                            Checked {h.lastChecked}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-[3px] text-[9px] capitalize",
                          h.status === "healthy"
                            ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                            : h.status === "degraded"
                              ? "border-[var(--warning)]/30 text-[var(--warning)]"
                              : "border-[var(--critical)]/30 text-[var(--critical)]"
                        )}
                      >
                        {h.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--ink-secondary)]">{h.message}</p>
                    {h.details && (
                      <p className="mt-1 text-[10px] leading-relaxed text-[var(--ink-muted)]">{h.details}</p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety disclaimer */}
      <Card className="rounded-[8px] border border-[var(--critical)]/20 bg-[var(--critical-light)]/20 p-4">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-[var(--critical)]" />
          <p className="text-[11px] leading-relaxed text-[var(--critical)]">
            This summary never includes secrets, API keys, DATABASE_URL, authorization tokens, student link tokens,
            webhook payloads, or student message content.
          </p>
        </div>
      </Card>
    </div>
  );
}
