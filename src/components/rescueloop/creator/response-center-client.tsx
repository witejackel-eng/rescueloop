"use client";

// Client component for the Creator Response Centre.
// Handles interactive features: filtering, marking handled, etc.
// No AI auto-reply bypassing creator review.

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  HelpCircle,
  Clock,
  Ban,
  Heart,
  BookOpen,
  ArrowRight,
  Eye,
  Flag,
  User,
  MoreHorizontal,
  Filter,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

interface ResponseRow {
  id: string;
  responseType: string;
  blockerType?: string | null;
  note?: string | null;
  createdAt: Date;
  student: {
    id: string;
    name: string | null;
    email: string | null;
  };
  intervention: {
    id: string;
    outcomeState: string;
    state: string;
    messagePreview: string;
    trigger: string;
    courseName: string;
    campaignName: string;
  };
  isSuppressed: boolean;
  laterActivity: Array<{
    lessonTitle: string | null;
    occurredAt: Date;
  }>;
}

interface ResponseCenterClientProps {
  responses: ResponseRow[];
  companyId: string;
}

// ─── Response type display config ─────────────────────────────

const RESPONSE_TYPE_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  continue_course: { label: "Continue", variant: "default" },
  stuck: { label: "Stuck", variant: "secondary" },
  remind_later: { label: "Remind later", variant: "outline" },
  already_completed: { label: "Completed", variant: "default" },
  human_help: { label: "Needs help", variant: "destructive" },
  stop_reminders: { label: "Opted out", variant: "destructive" },
};

const BLOCKER_TYPE_LABELS: Record<string, string> = {
  lack_of_time: "No time",
  material_difficult: "Hard material",
  unsure_next_step: "Unsure next step",
  expected_something_different: "Unexpected",
  technical_problem: "Tech problem",
  needs_creator_help: "Creator help",
};

const OUTCOME_STATE_LABELS: Record<string, string> = {
  no_response: "No response",
  opened: "Opened",
  responded: "Responded",
  reminded_later: "Reminded",
  requested_help: "Help requested",
  opted_out: "Opted out",
  course_started: "Course started",
  progress_resumed: "Progress resumed",
  already_completed: "Already completed",
};

// ─── Component ───────────────────────────────────────────────

export function ResponseCenterClient({
  responses,
  companyId,
}: ResponseCenterClientProps) {
  const [filter, setFilter] = useState<"all" | "needs_attention" | "handled">("all");
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  const [markingBusy, setMarkingBusy] = useState<string | null>(null);

  // Filter responses
  const filtered = responses.filter((r) => {
    if (filter === "all") return true;
    if (filter === "needs_attention") {
      return (
        !handledIds.has(r.id) &&
        (r.responseType === "human_help" ||
          r.responseType === "stuck" ||
          r.responseType === "stop_reminders")
      );
    }
    if (filter === "handled") {
      return handledIds.has(r.id);
    }
    return true;
  });

  async function markHandled(responseId: string) {
    setMarkingBusy(responseId);
    // Best-effort — this is a UI affordance, not a critical mutation
    setHandledIds((prev) => new Set(prev).add(responseId));
    setMarkingBusy(null);
  }

  const needsAttentionCount = responses.filter(
    (r) =>
      !handledIds.has(r.id) &&
      (r.responseType === "human_help" ||
        r.responseType === "stuck" ||
        r.responseType === "stop_reminders"),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="h-8 text-[13px]"
        >
          All ({responses.length})
        </Button>
        <Button
          variant={filter === "needs_attention" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("needs_attention")}
          className="h-8 gap-1.5 text-[13px]"
        >
          <Flag className="size-3.5" />
          Needs attention ({needsAttentionCount})
        </Button>
        <Button
          variant={filter === "handled" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("handled")}
          className="h-8 text-[13px]"
        >
          <CheckCircle2 className="size-3.5" />
          Handled ({handledIds.size})
        </Button>
      </div>

      {/* Response table — responsive with horizontal scroll on mobile */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Student</TableHead>
                <TableHead className="min-w-[120px]">Course</TableHead>
                <TableHead className="min-w-[100px]">Response</TableHead>
                <TableHead className="min-w-[100px]">Blocker</TableHead>
                <TableHead className="min-w-[80px]">Time</TableHead>
                <TableHead className="min-w-[120px]">Later activity</TableHead>
                <TableHead className="min-w-[80px]">State</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const typeConfig = RESPONSE_TYPE_CONFIG[r.responseType] ?? {
                  label: r.responseType,
                  variant: "outline" as const,
                };
                const blockerLabel = r.blockerType
                  ? BLOCKER_TYPE_LABELS[r.blockerType] ?? r.blockerType
                  : null;
                const postResponseActivity = r.laterActivity.slice(0, 2);
                const isHandled = handledIds.has(r.id);

                return (
                  <TableRow
                    key={r.id}
                    className={cn(
                      isHandled && "opacity-50",
                    )}
                  >
                    {/* Student */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-medium text-[var(--ink-primary)]">
                          {r.student.name ?? "Student"}
                        </span>
                        {r.student.email && (
                          <span className="text-[12px] text-[var(--ink-muted)]">
                            {r.student.email}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Course */}
                    <TableCell>
                      <span className="text-[13px] text-[var(--ink-secondary)]">
                        {r.intervention.courseName}
                      </span>
                    </TableCell>

                    {/* Response type */}
                    <TableCell>
                      <Badge variant={typeConfig.variant} className="text-[12px]">
                        {typeConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Blocker */}
                    <TableCell>
                      {blockerLabel ? (
                        <Badge variant="outline" className="text-[11px]">
                          {blockerLabel}
                        </Badge>
                      ) : (
                        <span className="text-[12px] text-[var(--ink-muted)]">—</span>
                      )}
                    </TableCell>

                    {/* Response time */}
                    <TableCell>
                      <span className="text-[12px] text-[var(--ink-muted)]" title={r.createdAt.toISOString()}>
                        {formatDistanceToNow(r.createdAt, { addSuffix: true })}
                      </span>
                    </TableCell>

                    {/* Later activity */}
                    <TableCell>
                      {postResponseActivity.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {postResponseActivity.map((a, i) => (
                            <span key={i} className="text-[12px] text-[var(--recovery-green)]">
                              ✓ {a.lessonTitle ?? "Lesson"}
                            </span>
                          ))}
                          {r.laterActivity.length > 2 && (
                            <span className="text-[11px] text-[var(--ink-muted)]">
                              +{r.laterActivity.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-[var(--ink-muted)]">None yet</span>
                      )}
                    </TableCell>

                    {/* State */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {r.isSuppressed && (
                          <Badge variant="destructive" className="text-[10px]">
                            Suppressed
                          </Badge>
                        )}
                        {isHandled && (
                          <Badge variant="secondary" className="text-[10px]">
                            Handled
                          </Badge>
                        )}
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          {OUTCOME_STATE_LABELS[r.intervention.outcomeState] ?? r.intervention.outcomeState}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions — no AI auto-reply */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => markHandled(r.id)}
                            disabled={isHandled || markingBusy === r.id}
                          >
                            <CheckCircle2 className="mr-2 size-4" />
                            Mark handled
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="mr-2 size-4" />
                            Open student
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 size-4" />
                            Prepare follow-up
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Footer note — no AI auto-reply */}
      <p className="text-[12px] text-[var(--ink-muted)]">
        All follow-ups require creator review. No automated replies are sent without your approval.
      </p>
    </div>
  );
}
