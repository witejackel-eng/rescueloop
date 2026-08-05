"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { internalFetch, internalPost } from "@/lib/internal-api-client";
import { Gauge, Edit } from "lucide-react";

interface UsageEntry {
  id: string;
  organizationId: string;
  organizationName: string;
  planTier: string;
  metric: string;
  period: string;
  count: number;
  limit: number | null;
  overriddenBy: string | null;
}

export default function UsagePage() {
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideOrgId, setOverrideOrgId] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    internalFetch<UsageEntry[]>("/api/internal/usage")
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleOverride() {
    if (!overrideOrgId || !overrideReason.trim()) return;
    setActing(true);
    try {
      await internalPost("/api/internal/usage", {
        action: "override",
        organizationId: overrideOrgId,
        newLimit: parseInt(overrideValue, 10),
        reason: overrideReason,
      });
      setOverrideOrgId(null);
      setOverrideValue("");
      setOverrideReason("");
    } catch { } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
        <Badge variant="outline" className="text-xs">
          <Gauge className="mr-1 h-3 w-3" />
          {entries.length} counters
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage limits & plan overrides</CardTitle>
          <CardDescription>Monitor usage counters and apply plan overrides when needed.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage data.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => {
                    const overLimit = e.limit != null && e.count > e.limit;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.organizationName}</TableCell>
                        <TableCell><Badge variant="outline">{e.planTier}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{e.metric}</TableCell>
                        <TableCell className="text-xs">{e.period}</TableCell>
                        <TableCell className={overLimit ? "text-destructive font-bold" : ""}>{e.count}</TableCell>
                        <TableCell className="text-xs">{e.limit ?? "∞"}</TableCell>
                        <TableCell className="text-right">
                          <Dialog
                            open={overrideOrgId === e.organizationId}
                            onOpenChange={(open) => {
                              if (!open) { setOverrideOrgId(null); setOverrideValue(""); setOverrideReason(""); }
                              else { setOverrideOrgId(e.organizationId); setOverrideValue(String(e.limit ?? "")); }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline"><Edit className="mr-1 h-3 w-3" />Override</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Override usage limit</DialogTitle>
                                <DialogDescription>
                                  Set a custom limit for {e.organizationName} ({e.metric})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 py-2">
                                <Input type="number" value={overrideValue} onChange={(ev) => setOverrideValue(ev.target.value)} placeholder="New limit" />
                                <Input value={overrideReason} onChange={(ev) => setOverrideReason(ev.target.value)} placeholder="Reason (required)" />
                              </div>
                              <DialogFooter>
                                <Button disabled={!overrideReason.trim() || acting} onClick={handleOverride}>
                                  Apply override
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
