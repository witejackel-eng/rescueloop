"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
  Plug,
  Shield,
  Users,
  Webhook,
  Cog,
  Bell,
  CreditCard,
  Database,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";

function getDomainIcon(domain: string): typeof Plug {
  const d = domain.toLowerCase();
  if (d.includes("sync")) return Plug;
  if (d.includes("permission") || d.includes("security")) return Shield;
  if (d.includes("whop") || d.includes("member")) return Users;
  if (d.includes("webhook")) return Webhook;
  if (d.includes("job")) return Cog;
  if (d.includes("notif")) return Bell;
  if (d.includes("billing") || d.includes("payment")) return CreditCard;
  if (d.includes("data")) return Database;
  if (d.includes("course")) return BookOpen;
  return Activity;
}

export default function SystemHealthPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  const healthDomains = bundle?.healthDomains ?? [];
  const company = bundle?.company;
  const healthyCount = healthDomains.filter((d) => d.status === "healthy").length;
  const total = healthDomains.length;

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
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">System Health</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {loading ? "Loading…" : `${healthyCount}/${total} domains healthy`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {company?.systemHealth && (
            <Badge
              variant="outline"
              className={cn(
                "rounded-[3px] text-[10px]",
                company.systemHealth === "healthy"
                  ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                  : company.systemHealth === "degraded"
                    ? "border-[var(--warning)]/30 text-[var(--warning)]"
                    : "border-[var(--critical)]/30 text-[var(--critical)]"
              )}
            >
              <Activity className="mr-1 size-3" />
              {company.systemHealth}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
            aria-label="Refresh health status"
          >
            <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertCircle className="size-4" />
            <span>Failed to load health status: {error}</span>
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

      {/* Overall health bar */}
      {!loading && total > 0 && (
        <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[var(--ink-secondary)]">Overall system health</span>
            <span className="font-mono tabular-nums text-[var(--ink-primary)]">
              {healthyCount}/{total} healthy
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--canvas)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(healthyCount / total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "h-full rounded-full",
                healthyCount === total
                  ? "bg-[var(--recovery-green)]"
                  : healthyCount >= total * 0.7
                    ? "bg-[var(--warning)]"
                    : "bg-[var(--critical)]"
              )}
            />
          </div>
        </Card>
      )}

      {/* Health Domain Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          healthDomains.map((d, i) => {
            const DomainIcon = getDomainIcon(d.domain);
            return (
              <motion.div
                key={d.domain}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Card className="group rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex size-8 items-center justify-center rounded-[6px]", STATUS_BG[d.status])}>
                        <DomainIcon className={cn("size-4", STATUS_COLOR[d.status])} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--ink-primary)]">{d.domain}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
                          <Clock className="size-2.5" />
                          {d.lastChecked}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-[3px] text-[9px] capitalize",
                        d.status === "healthy"
                          ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                          : d.status === "degraded"
                            ? "border-[var(--warning)]/30 text-[var(--warning)]"
                            : "border-[var(--critical)]/30 text-[var(--critical)]"
                      )}
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-[11px] text-[var(--ink-secondary)]">{d.message}</p>
                  {d.details && (
                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--ink-muted)]">{d.details}</p>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Health note */}
      {!loading && (
        <Card className="rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] p-4">
          <div className="flex items-start gap-2.5">
            <Activity className="mt-0.5 size-3.5 shrink-0 text-[var(--ink-muted)]" />
            <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
              Health checks run automatically every 30 seconds. Degraded domains may still function with reduced
              performance. Unhealthy domains require attention — check the diagnostics page for a full summary
              you can share with support.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
