"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Pause, Play, Loader2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  status: string;
  isPaused: boolean;
  planTier: string;
  installationStatus: string | null;
  memberCount: number;
  createdAt: string;
}

export default function OrganisationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOrgId, setActingOrgId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    internalFetch<Org[]>("/api/internal/organisations")
      .then(setOrgs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePauseResume(org: Org, action: "pause" | "resume") {
    if (!reason.trim()) return;
    setActing(true);
    try {
      await internalPost("/api/internal/organisations", {
        action,
        organizationId: org.id,
        reason,
      });
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === org.id
            ? { ...o, isPaused: action === "pause", status: action === "pause" ? "paused" : "active" }
            : o,
        ),
      );
      setActingOrgId(null);
      setReason("");
    } catch {
      // keep item as-is
    } finally {
      setActing(false);
    }
  }

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "paused") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Organisations</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All organisations</CardTitle>
          <CardDescription>Manage organisation installation states, provider modes, and pause status.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : orgs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organisations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Installation</TableHead>
                    <TableHead>Paused</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor(org.status)}>{org.status}</Badge>
                      </TableCell>
                      <TableCell>{org.planTier}</TableCell>
                      <TableCell>{org.installationStatus ?? "—"}</TableCell>
                      <TableCell>{org.isPaused ? "Yes" : "No"}</TableCell>
                      <TableCell>{org.memberCount}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={actingOrgId === org.id}
                          onOpenChange={(open) => {
                            if (!open) { setActingOrgId(null); setReason(""); }
                            else { setActingOrgId(org.id); }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              {org.isPaused ? (
                                <><Play className="mr-1 h-3 w-3" />Resume</>
                              ) : (
                                <><Pause className="mr-1 h-3 w-3" />Pause</>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {org.isPaused ? "Resume" : "Pause"} organisation
                              </DialogTitle>
                              <DialogDescription>
                                {org.isPaused
                                  ? `Resume "${org.name}" so it starts processing events again.`
                                  : `Pause "${org.name}" to stop processing events temporarily.`}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-2">
                              <label className="text-sm font-medium">
                                Reason <span className="text-destructive">*</span>
                              </label>
                              <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Required — explain why this change is being made"
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant={org.isPaused ? "default" : "destructive"}
                                disabled={!reason.trim() || acting}
                                onClick={() => handlePauseResume(org, org.isPaused ? "resume" : "pause")}
                              >
                                {acting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                {org.isPaused ? "Resume" : "Pause"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
