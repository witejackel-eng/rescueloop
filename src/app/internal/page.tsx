"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { internalFetch } from "@/lib/internal-api-client";
import {
  Building2,
  AlertTriangle,
  Clock,
  MailWarning,
  Users,
  Activity,
} from "lucide-react";

interface DashboardStats {
  organizations: { total: number; active: number; paused: number };
  syncFailures: number;
  outboxBacklog: number;
  deadLetters: number;
  pilotApplications: { total: number; new: number; reviewing: number };
  failedWebhooks: number;
}

export default function InternalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    internalFetch<DashboardStats>("/api/internal/dashboard")
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-destructive">
            Failed to load dashboard: {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Badge variant="outline" className="text-xs">
          <Activity className="mr-1 h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Organizations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.organizations.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.organizations.active ?? 0} active · {stats?.organizations.paused ?? 0} paused
            </p>
          </CardContent>
        </Card>

        {/* Sync failures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sync Failures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.syncFailures ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent failed sync operations
            </p>
          </CardContent>
        </Card>

        {/* Outbox backlog */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outbox Backlog</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.outboxBacklog ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending events awaiting dispatch
            </p>
          </CardContent>
        </Card>

        {/* Dead letters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dead Letters</CardTitle>
            <MailWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.deadLetters ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Events that failed all retries
            </p>
          </CardContent>
        </Card>

        {/* Pilot applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pilot Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pilotApplications.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats?.pilotApplications.new ?? 0)} new · {stats?.pilotApplications.reviewing ?? 0} reviewing
            </p>
          </CardContent>
        </Card>

        {/* Failed webhooks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Webhooks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedWebhooks ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require investigation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
