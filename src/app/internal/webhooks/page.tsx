"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { internalFetch, internalPost } from "@/lib/internal-api-client";
import { Webhook as WebhookIcon, RefreshCw } from "lucide-react";

interface FailedWebhook {
  id: string;
  organizationId: string;
  eventType: string;
  status: string;
  lastError: string | null;
  attemptCount: number;
  receivedAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<FailedWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    internalFetch<FailedWebhook[]>("/api/internal/webhooks")
      .then(setWebhooks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await internalPost("/api/internal/webhooks", { action: "retry", id, reason: "Manual retry from internal dashboard" });
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch { } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <Badge variant="outline" className="text-xs">
          <WebhookIcon className="mr-1 h-3 w-3" />
          {webhooks.length} failed
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failed webhook deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No failed webhooks.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Org ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs font-medium">{w.eventType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.organizationId.slice(0, 12)}…</TableCell>
                      <TableCell><Badge variant="outline">{w.status}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-destructive">{w.lastError ?? "—"}</TableCell>
                      <TableCell>{w.attemptCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(w.receivedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRetry(w.id)} disabled={retrying === w.id}>
                          <RefreshCw className={`mr-1 h-3 w-3 ${retrying === w.id ? "animate-spin" : ""}`} />
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
