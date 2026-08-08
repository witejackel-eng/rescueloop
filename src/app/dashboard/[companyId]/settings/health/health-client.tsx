"use client";

// Client component that fetches health signals from the company-scoped API
// and renders them with live status indicators.

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface HealthSignal {
  id: string;
  source: string;
  status: "healthy" | "degraded" | "critical" | "unknown";
  message: string;
  lastCheckedAt: string;
  metadata?: Record<string, unknown>;
}

interface CompanyHealthResponse {
  companyId: string;
  overallStatus: "healthy" | "degraded" | "critical";
  signals: HealthSignal[];
  checkedAt: string;
}

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle2,
    label: "Healthy",
    badgeVariant: "default" as const,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    badgeVariant: "secondary" as const,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
  critical: {
    icon: XCircle,
    label: "Critical",
    badgeVariant: "destructive" as const,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  unknown: {
    icon: HelpCircle,
    label: "Unknown",
    badgeVariant: "outline" as const,
    colorClass: "text-gray-500",
    bgClass: "bg-gray-50",
  },
} as const;

function SignalCard({ signal }: { signal: HealthSignal }) {
  const config = STATUS_CONFIG[signal.status];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
        >
          <Icon className={`size-4 ${config.colorClass}`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-[var(--ink-primary)]">
              {signal.source}
            </span>
            <Badge variant={config.badgeVariant} className="font-mono text-[10px]">
              {config.label}
            </Badge>
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            {signal.message}
          </p>
          {signal.metadata &&
            Object.keys(signal.metadata).length > 0 && (
              <div className="mt-2 space-y-0.5 font-mono text-[11px] text-[var(--ink-muted)]">
                {Object.entries(signal.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold">{key}:</span>{" "}
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </div>
                ))}
              </div>
            )}
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">
            checked {new Date(signal.lastCheckedAt).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthSignalsClient({ companyId }: { companyId: string }) {
  const [data, setData] = useState<CompanyHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch(`/api/dashboard/${companyId}/health`);
        if (!res.ok) {
          setError(`Failed to load health data (${res.status})`);
          return;
        }
        const json = (await res.json()) as CompanyHealthResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHealth();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
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
          Unable to load health signals: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const overallConfig = STATUS_CONFIG[data.overallStatus];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-4">
      {/* ── Overall status banner ─────────────────────────── */}
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${overallConfig.bgClass}`}
      >
        <OverallIcon className={`size-5 ${overallConfig.colorClass}`} />
        <div>
          <p className="text-[15px] font-semibold text-[var(--ink-primary)]">
            Overall: {overallConfig.label}
          </p>
          <p className="font-mono text-[12px] text-[var(--ink-muted)]">
            Last checked: {new Date(data.checkedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Individual signal cards ────────────────────────── */}
      {data.signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
