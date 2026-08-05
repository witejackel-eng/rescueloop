"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { internalFetch, internalPost } from "@/lib/internal-api-client";
import { MailWarning, RefreshCw } from "lucide-react";

interface DeadLetter {
  id: string;
  organizationId: string;
  eventType: string;
  errorMessage: string;
  attemptCount: number;
  deadLetteredAt: string;
}

export default function DeadLettersPage() {
  const [letters, setLetters] = useState<DeadLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [requeuing, setRequeuing] = useState<string | null>(null);

  useEffect(() => {
    internalFetch<DeadLetter[]>("/api/internal/dead-letters")
      .then(setLetters)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRequeue(id: string) {
    setRequeuing(id);
    try {
      await internalPost("/api/internal/dead-letters", { action: "requeue", id, reason: "Manual requeue from internal dashboard" });
      setLetters((prev) => prev.filter((l) => l.id !== id));
    } catch { } finally {
      setRequeuing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dead Letters</h1>
        <Badge variant="outline" className="text-xs">
          <MailWarning className="mr-1 h-3 w-3" />
          {letters.length} events
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events that failed all retry attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : letters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dead letter events.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Org ID</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Dead-lettered</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letters.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-medium">{l.eventType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.organizationId.slice(0, 12)}…</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-destructive">{l.errorMessage}</TableCell>
                      <TableCell>{l.attemptCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(l.deadLetteredAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRequeue(l.id)} disabled={requeuing === l.id}>
                          <RefreshCw className={`mr-1 h-3 w-3 ${requeuing === l.id ? "animate-spin" : ""}`} />
                          Requeue
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
