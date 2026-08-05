"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { internalFetch, internalPost } from "@/lib/internal-api-client";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface SyncFailure {
  id: string;
  organizationId: string;
  eventType: string;
  lastError: string;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function SyncPage() {
  const [failures, setFailures] = useState<SyncFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    internalFetch<SyncFailure[]>("/api/internal/sync")
      .then(setFailures)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await internalPost("/api/internal/sync", { action: "retry", id, reason: "Manual retry from internal dashboard" });
      setFailures((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // keep item in list
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sync Failures</h1>
        <Badge variant="outline" className="text-xs">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {failures.length} failures
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent sync failures</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : failures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync failures. All clear!</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Org ID</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failures.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium font-mono text-xs">{f.eventType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.organizationId.slice(0, 12)}…</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-destructive">{f.lastError}</TableCell>
                      <TableCell>{f.attemptCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(f.updatedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRetry(f.id)} disabled={retrying === f.id}>
                          <RefreshCw className={`mr-1 h-3 w-3 ${retrying === f.id ? "animate-spin" : ""}`} />
                          Retry
                        </Button>
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
