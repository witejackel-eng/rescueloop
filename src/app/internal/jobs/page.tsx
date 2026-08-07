"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { internalFetch, internalPost } from "@/lib/internal-api-client";
import { RefreshCw, Clock } from "lucide-react";

interface JobExecution {
  id: string;
  organizationId: string;
  jobType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    internalFetch<JobExecution[]>("/api/internal/jobs")
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await internalPost("/api/internal/jobs", { action: "retry", id, reason: "Manual retry from internal dashboard" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch { } finally {
      setRetrying(null);
    }
  }

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "failed") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (s === "running") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <Badge variant="outline" className="text-xs">
          <Clock className="mr-1 h-3 w-3" />
          {jobs.filter((j) => j.status === "pending" || j.status === "running").length} in progress
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outbox backlog & job executions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No job executions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Org ID</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-mono text-xs font-medium">{j.jobType}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColor(j.status)}>{j.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{j.organizationId.slice(0, 12)}…</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-destructive">{j.errorMessage ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {j.status === "failed" && (
                          <Button size="sm" variant="outline" onClick={() => handleRetry(j.id)} disabled={retrying === j.id}>
                            <RefreshCw className={`mr-1 h-3 w-3 ${retrying === j.id ? "animate-spin" : ""}`} />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
