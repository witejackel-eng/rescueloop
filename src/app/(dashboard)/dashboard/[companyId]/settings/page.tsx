"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Settings,
  Wifi,
  Link2,
  Link,
  Heart,
  Key,
  Activity,
  Bell,
  Shield,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";

export default function SettingsPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalManual, setApprovalManual] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [autoDraft, setAutoDraft] = useState(true);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  const company = bundle?.company;
  const healthDomains = bundle?.healthDomains ?? [];

  const whopDomain = healthDomains.find((h) => h.domain === "Whop connection");
  const syncDomain = healthDomains.find((h) => h.domain === "Membership sync");
  const webhookDomain = healthDomains.find((h) => h.domain === "Webhooks");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Settings</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {company ? `${company.name} configuration` : "RescueLoop configuration"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh settings"
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
            <span>Failed to load settings: {error}</span>
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

      {/* Connection Section */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--recovery-green)]/10">
            <Wifi className="size-4 text-[var(--recovery-green)]" />
          </div>
          <h2 className="text-[14px] font-medium text-[var(--ink-primary)]">Connection</h2>
        </div>

        <div className="mt-5 divide-y divide-[var(--hairline)]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="h-2.5 w-32 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                <div className="h-2.5 w-24 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
              </div>
            ))
          ) : (
            <>
              {/* Whop Integration */}
              <div className="group flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Key className="size-3.5 text-[var(--ink-muted)]" />
                  <span className="text-[12px] text-[var(--ink-secondary)]">Whop Integration</span>
                  {whopDomain?.status === "healthy" ? (
                    <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--critical)]/30 text-[var(--critical)]">
                      Disconnected
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="h-7 rounded-[5px] px-2.5 text-[10px] text-[var(--ink-secondary)]">
                  <ExternalLink className="mr-1 size-3" />
                  Reconnect
                </Button>
              </div>

              {/* Webhook URL */}
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Link className="size-3.5 text-[var(--ink-muted)]" />
                  <span className="text-[12px] text-[var(--ink-secondary)]">Webhook URL</span>
                </div>
                <code className="font-mono text-xs bg-[var(--canvas)] border border-[var(--hairline)] rounded-[6px] px-3 py-2 text-[var(--ink-secondary)]">
                  https://rescueloop.vercel.app/api/webhooks/whop
                </code>
              </div>

              {/* Last sync */}
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="size-3.5 text-[var(--ink-muted)]" />
                  <span className="text-[12px] text-[var(--ink-secondary)]">Last successful sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                    {company?.lastSync ?? "—"}
                  </span>
                  {syncDomain?.status === "healthy" ? (
                    <CheckCircle2 className="size-3 text-[var(--recovery-green)]" />
                  ) : (
                    <AlertTriangle className="size-3 text-[var(--warning)]" />
                  )}
                </div>
              </div>

              {/* System health */}
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Heart className="size-3.5 text-[var(--ink-muted)]" />
                  <span className="text-[12px] text-[var(--ink-secondary)]">System health</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-[3px] text-[9px]",
                      company?.systemHealth === "healthy"
                        ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                        : company?.systemHealth === "degraded"
                          ? "border-[var(--warning)]/30 text-[var(--warning)]"
                          : "border-[var(--critical)]/30 text-[var(--critical)]"
                    )}
                  >
                    {company?.systemHealth ?? "—"}
                  </Badge>
                  <span className="text-[10px] text-[var(--ink-muted)]">
                    {healthDomains.filter((h) => h.status === "healthy").length}/{healthDomains.length} domains
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Automation Section */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--info)]/10">
            <Zap className="size-4 text-[var(--info)]" />
          </div>
          <h2 className="text-[14px] font-medium text-[var(--ink-primary)]">Automation</h2>
        </div>

        <div className="mt-5 divide-y divide-[var(--hairline)]">
          {/* Approval mode toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div>
              <span className="text-[12px] text-[var(--ink-secondary)]">Manual approval required</span>
              <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                Review and approve each intervention before it is sent
              </p>
            </div>
            <Switch checked={approvalManual} onCheckedChange={(v) => { setApprovalManual(v); toast.success(`Manual approval ${v ? "enabled" : "disabled"}`); }} />
          </div>

          {/* Auto-draft toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div>
              <span className="text-[12px] text-[var(--ink-secondary)]">Auto-generate drafts</span>
              <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                Automatically prepare intervention messages for review
              </p>
            </div>
            <Switch checked={autoDraft} onCheckedChange={(v) => { setAutoDraft(v); toast.success(`Auto-draft ${v ? "enabled" : "disabled"}`); }} />
          </div>

          {/* Notifications toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div>
              <span className="text-[12px] text-[var(--ink-secondary)]">Notifications</span>
              <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                Receive alerts when students respond or need attention
              </p>
            </div>
            <Switch checked={notificationsOn} onCheckedChange={(v) => { setNotificationsOn(v); toast.success(`Notifications ${v ? "enabled" : "disabled"}`); }} />
          </div>

          {/* Quiet hours */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-[var(--ink-muted)]" />
              <span className="text-[12px] text-[var(--ink-secondary)]">Quiet hours</span>
            </div>
            <span className="font-mono text-[12px] text-[var(--ink-primary)]">10pm – 8am</span>
          </div>

          {/* Default cooldown */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-[var(--ink-muted)]" />
              <span className="text-[12px] text-[var(--ink-secondary)]">Default cooldown</span>
            </div>
            <span className="font-mono text-[12px] text-[var(--ink-primary)]">7 days</span>
          </div>
        </div>
      </Card>

      {/* Detection Rules Section */}
      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--warning)]/10">
            <Eye className="size-4 text-[var(--warning)]" />
          </div>
          <h2 className="text-[14px] font-medium text-[var(--ink-primary)]">Detection Rules</h2>
        </div>

        <div className="mt-5 divide-y divide-[var(--hairline)]">
          {[
            { label: "Stall threshold", value: "7 days inactivity", icon: Clock },
            { label: "Renewal alert window", value: "5 days before renewal", icon: Bell },
            { label: "Max interventions per student", value: "3 per 30 days", icon: Shield },
            { label: "Progress threshold for stall", value: "< 20% completed", icon: Database },
          ].map((rule) => (
            <div key={rule.label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <rule.icon className="size-3.5 text-[var(--ink-muted)]" />
                <span className="text-[12px] text-[var(--ink-secondary)]">{rule.label}</span>
              </div>
              <span className="font-mono text-[12px] text-[var(--ink-primary)]">{rule.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Safety note */}
      <Card className="rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] p-4">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-[var(--ink-muted)]" />
          <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
            All intervention messages require creator review before delivery. Detection rules identify <em>when</em> a
            student qualifies for outreach — they never send messages automatically. Quiet hours and cooldowns protect
            students from over-contact regardless of detection signals.
          </p>
        </div>
      </Card>
    </div>
  );
}
