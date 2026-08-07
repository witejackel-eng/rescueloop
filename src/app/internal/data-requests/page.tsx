"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { internalFetch } from "@/lib/internal-api-client";
import { FileDown } from "lucide-react";

interface DataRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  status: string;
  reason: string | null;
  requestedAt: string;
  completedAt: string | null;
}

export default function DataRequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internalFetch<DataRequest[]>("/api/internal/data-requests")
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "processing") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    if (s === "requested") return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Data Requests</h1>
        <Badge variant="outline" className="text-xs">
          <FileDown className="mr-1 h-3 w-3" />
          {requests.length} requests
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export & deletion requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.organizationName}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{r.reason ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.requestedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}</TableCell>
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
