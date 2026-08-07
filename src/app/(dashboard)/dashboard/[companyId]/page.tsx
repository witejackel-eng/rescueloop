"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  AlertTriangle,
  Clock,
  MessageSquare,
  TrendingUp,
  Activity,
  Heart,
  ListChecks,
  ArrowRight,
  Wifi,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const METRICS = [
  { label: "Monitored members", value: "742", icon: Users, trend: "+12 this week" },
  { label: "Needs review", value: "23", icon: AlertTriangle, color: "text-[var(--warning)]" },
  { label: "Awaiting approval", value: "5", icon: Clock, color: "text-[var(--info)]" },
  { label: "Responses", value: "18", icon: MessageSquare, trend: "+4 today" },
  { label: "Observed returns", value: "12", icon: TrendingUp, color: "text-[var(--recovery-green)]" },
];

const QUEUE_PREVIEW = [
  { name: "Maya Thompson", trigger: "Mid-course stall", urgency: "High", inactive: "8 days" },
  { name: "Devon Park", trigger: "Inactive near renewal", urgency: "Urgent", inactive: "14 days" },
  { name: "Sara Klein", trigger: "Never started", urgency: "Medium", inactive: "21 days" },
];

const RECENT_ACTIVITY = [
  { event: "Student responded", detail: "Maya T. chose 'Continue course'", time: "2 min ago" },
  { event: "Candidate detected", detail: "Jamal W. stalled at Lesson 7", time: "8 min ago" },
  { event: "Draft approved", detail: "Message to Sara K. sent", time: "15 min ago" },
  { event: "Sync completed", detail: "742 members, 8 courses", time: "23 min ago" },
];

const HEALTH_DOMAINS = [
  { name: "Whop connection", status: "healthy" },
  { name: "Membership sync", status: "healthy" },
  { name: "Course activity", status: "healthy" },
  { name: "Webhooks", status: "degraded" },
  { name: "Jobs", status: "healthy" },
];

export default function CompanyOverviewPage() {
  const params = useParams<{ companyId: string }>();
  const basePath = `/dashboard/${params.companyId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Dashboard</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Creator Growth Lab · Agency Growth System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
            <Wifi className="mr-1 size-3" /> Connected
          </Badge>
          <Badge variant="outline" className="rounded-[3px] text-[10px]">Growth · $59/mo</Badge>
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {METRICS.map((m) => (
          <Card key={m.label} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--ink-muted)]">
              <m.icon className="size-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-[0.06em]">{m.label}</span>
            </div>
            <div className={`mt-2 font-serif text-[28px] leading-none ${m.color ?? "text-[var(--ink-primary)]"}`}>
              {m.value}
            </div>
            {m.trend && (
              <p className="mt-1.5 text-[10px] text-[var(--ink-muted)]">{m.trend}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Rescue Queue preview */}
        <div className="lg:col-span-3">
          <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Rescue Queue</h2>
              <Link href={`${basePath}/rescue-queue`}>
                <Button variant="ghost" size="sm" className="text-[12px] text-[var(--ink-secondary)]">
                  View all <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {QUEUE_PREVIEW.map((q) => (
                <div
                  key={q.name}
                  className="flex items-center justify-between rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-4 py-3"
                >
                  <div>
                    <span className="text-[13px] font-medium text-[var(--ink-primary)]">{q.name}</span>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{q.trigger} · {q.inactive} inactive</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-[3px] text-[10px]",
                      q.urgency === "Urgent" && "border-[var(--critical)]/30 text-[var(--critical)]",
                      q.urgency === "High" && "border-[var(--warning)]/30 text-[var(--warning)]",
                      q.urgency === "Medium" && "border-[var(--info)]/30 text-[var(--info)]",
                    )}
                  >
                    {q.urgency}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Health summary */}
        <div className="lg:col-span-2">
          <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">System Health</h2>
              <Link href={`${basePath}/settings/health`}>
                <Button variant="ghost" size="sm" className="text-[12px] text-[var(--ink-secondary)]">
                  Details <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {HEALTH_DOMAINS.map((h) => (
                <div key={h.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--ink-secondary)]">{h.name}</span>
                  {h.status === "healthy" ? (
                    <span className="flex items-center gap-1 text-[var(--recovery-green)]">
                      <CheckCircle2 className="size-3" /> Healthy
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[var(--warning)]">
                      <AlertCircle className="size-3" /> Degraded
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent activity + actions */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Activity className="mt-0.5 size-3.5 shrink-0 text-[var(--ink-muted)]" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-medium text-[var(--ink-primary)]">{a.event}</span>
                    <p className="text-[11px] text-[var(--ink-muted)]">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--ink-muted)]">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Quick Actions</h2>
            <div className="mt-4 space-y-2">
              <Link href={`${basePath}/rescue-queue`} className="block">
                <Button variant="outline" className="w-full justify-start rounded-[6px] text-[12px]">
                  <ListChecks className="mr-2 size-3.5" /> Review Rescue Queue (23)
                </Button>
              </Link>
              <Link href={`${basePath}/responses`} className="block">
                <Button variant="outline" className="w-full justify-start rounded-[6px] text-[12px]">
                  <MessageSquare className="mr-2 size-3.5" /> View Responses (18)
                </Button>
              </Link>
              <Link href={`${basePath}/settings/health`} className="block">
                <Button variant="outline" className="w-full justify-start rounded-[6px] text-[12px]">
                  <Heart className="mr-2 size-3.5" /> View System Health
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ink-secondary)]">Usage</span>
              <span className="text-[var(--ink-primary)]">742 / 1,000 members</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--canvas)]">
              <div className="h-full w-[74%] rounded-full bg-[var(--recovery-green)]" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
