"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Users, ChevronRight, Eye } from "lucide-react";

type ReviewStatus = "New" | "Reviewing" | "Qualified" | "Contacted" | "Accepted" | "Rejected" | "Withdrawn";

interface PilotApp {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  whopBusinessUrl: string | null;
  approximatePayingMembers: number | null;
  courses: string | null;
  typicalMembershipPrice: number | null;
  monthlyNewMembers: number | null;
  currentFollowUpProcess: string | null;
  primaryRetentionConcern: string | null;
  preferredPilotTiming: string;
  reviewStatus: ReviewStatus;
  reviewNotes: string | null;
  createdAt: string;
}

const STATUS_FLOW: Record<ReviewStatus, ReviewStatus[]> = {
  New: ["Reviewing", "Rejected"],
  Reviewing: ["Qualified", "Rejected"],
  Qualified: ["Contacted", "Rejected"],
  Contacted: ["Accepted", "Rejected", "Withdrawn"],
  Accepted: [],
  Rejected: [],
  Withdrawn: [],
};

const statusColor = (s: ReviewStatus) => {
  const map: Record<ReviewStatus, string> = {
    New: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    Reviewing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Qualified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Contacted: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
    Accepted: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    Withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return map[s] || "";
};

const TIMING_LABELS: Record<string, string> = {
  asap: "ASAP",
  within_2_weeks: "Within 2 weeks",
  within_a_month: "Within a month",
  flexible: "Flexible",
};

function timingLabel(value: string): string {
  return TIMING_LABELS[value] ?? value;
}

export default function PilotsPage() {
  const [apps, setApps] = useState<PilotApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PilotApp | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    internalFetch<PilotApp[]>("/api/internal/pilots")
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleTransition(app: PilotApp, newStatus: ReviewStatus) {
    if (!reason.trim()) return;
    setActing(true);
    try {
      await internalPost("/api/internal/pilots", {
        action: "transition",
        id: app.id,
        newStatus,
        reason,
      });
      setApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, reviewStatus: newStatus } : a)),
      );
      setSelected(null);
      setReason("");
    } catch { } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pilot Applications</h1>
        <Badge variant="outline" className="text-xs">
          <Users className="mr-1 h-3 w-3" />
          {apps.length} total
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review workflow</CardTitle>
          <CardDescription>
            New → Reviewing → Qualified → Contacted → Accepted / Rejected / Withdrawn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pilot applications.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Timing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.fullName}</TableCell>
                      <TableCell>{app.businessName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{app.email}</TableCell>
                      <TableCell className="text-xs">{timingLabel(app.preferredPilotTiming)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor(app.reviewStatus)}>
                          {app.reviewStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={selected?.id === app.id}
                          onOpenChange={(open) => {
                            if (!open) { setSelected(null); setReason(""); }
                            else setSelected(app);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>{app.fullName} — {app.businessName}</DialogTitle>
                              <DialogDescription>
                                Current status: {app.reviewStatus}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Email:</span> {app.email}</div>
                                <div><span className="text-muted-foreground">Timing:</span> {timingLabel(app.preferredPilotTiming)}</div>
                                {app.approximatePayingMembers != null && (
                                  <div><span className="text-muted-foreground">Members:</span> {app.approximatePayingMembers}</div>
                                )}
                                {app.typicalMembershipPrice != null && (
                                  <div><span className="text-muted-foreground">Price:</span> ${app.typicalMembershipPrice}</div>
                                )}
                              </div>
                              {app.currentFollowUpProcess && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground font-medium">Follow-up process:</span>
                                  <p className="mt-1 whitespace-pre-wrap">{app.currentFollowUpProcess}</p>
                                </div>
                              )}
                              {app.primaryRetentionConcern && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground font-medium">Retention concern:</span>
                                  <p className="mt-1 whitespace-pre-wrap">{app.primaryRetentionConcern}</p>
                                </div>
                              )}
                              {app.courses && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground font-medium">Courses:</span>
                                  <p className="mt-1 whitespace-pre-wrap">{app.courses}</p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium">Reason for action <span className="text-destructive">*</span></label>
                                <Textarea
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                  placeholder="Required — explain why this transition is being made"
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              {STATUS_FLOW[app.reviewStatus].map((next) => (
                                <Button
                                  key={next}
                                  size="sm"
                                  variant={next === "Rejected" ? "destructive" : "default"}
                                  disabled={!reason.trim() || acting}
                                  onClick={() => handleTransition(app, next)}
                                >
                                  {next === "Rejected" ? "Reject" : `Move to ${next}`}
                                  <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                              ))}
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
