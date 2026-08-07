"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  AlertCircle,
  RefreshCw,
  Mail,
  Plus,
  Activity as ActivityIcon,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Zap,
  Sparkles,
  Calendar,
  CheckCircle,
  XCircle,
  CircleDashed,
  UserX,
  Hourglass,
  Target,
  Inbox,
  Eye,
  ShieldAlert,
  Info,
  CornerDownRight,
  FileText,
  Send as SendIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CardSkeleton, MetricSkeleton } from "@/components/shared/card-skeleton";
import { PageTransition } from "@/components/shared/page-transition";
import { EnhancedEmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { SparklineMini } from "@/components/shared/sparkline-mini";
import type {
  DemoMember,
  DemoActivityEvent,
  DemoPlaybook,
} from "@/lib/demo-fixtures";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// Status metadata
// ─────────────────────────────────────────────────────────────
const STATUS_META: Record<
  DemoMember["status"],
  { label: string; color: string; bg: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "text-[var(--recovery-green)]",
    bg: "bg-[var(--recovery-green)]/10 border-[var(--recovery-green)]/30",
    dot: "bg-[var(--recovery-green)]",
  },
  needs_attention: {
    label: "At Risk",
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10 border-[var(--warning)]/30",
    dot: "bg-[var(--warning)]",
  },
  responded: {
    label: "Responded",
    color: "text-[var(--info)]",
    bg: "bg-[var(--info)]/10 border-[var(--info)]/30",
    dot: "bg-[var(--info)]",
  },
  paused_reminders: {
    label: "Inactive",
    color: "text-[var(--ink-muted)]",
    bg: "bg-[var(--ink-muted)]/10 border-[var(--ink-muted)]/30",
    dot: "bg-[var(--ink-muted)]",
  },
};

// ─────────────────────────────────────────────────────────────
// Risk score derivation (same logic as Students page for consistency)
// ─────────────────────────────────────────────────────────────
function deriveRiskScore(member: DemoMember): number {
  let score = 0;
  if (member.status === "needs_attention") score += 40;
  else if (member.status === "paused_reminders") score += 50;
  else if (member.status === "responded") score += 15;
  else score += 5;
  score += Math.round((100 - member.progress) * 0.35);
  if (member.membership === "cancelling") score += 20;
  else if (member.membership === "cancelled") score += 25;
  else if (member.membership === "paused_membership") score += 15;
  if (member.suppressed) score += 10;
  return Math.min(100, Math.max(0, score));
}

function riskStyle(score: number) {
  if (score <= 30)
    return { color: "var(--recovery-green)", label: "Low" };
  if (score <= 60) return { color: "var(--warning)", label: "Medium" };
  return { color: "var(--critical)", label: "High" };
}

// ─────────────────────────────────────────────────────────────
// Circular risk gauge
// ─────────────────────────────────────────────────────────────
function RiskGauge({ score, color }: { score: number; color: string }) {
  const reduced = useReducedMotion();
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Risk score ${score} out of 100`}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--hairline)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduced ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-serif text-[22px] font-semibold leading-none tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
          Risk
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Relative time formatter (mirrors Students page logic)
// ─────────────────────────────────────────────────────────────
function toRelativeTime(dateStr: string): string {
  if (!dateStr) return "—";
  if (dateStr.includes("ago")) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  } catch {
    return dateStr;
  }
}

// Extract a numeric "days inactive" from a member's state
// NOTE: Demo data — synthesized per member for illustrative purposes.
function daysInactiveFrom(member: DemoMember): number {
  const seed = member.name.length * 7 + member.progress;
  return Math.max(
    0,
    Math.min(30, Math.round((100 - member.progress) / 4) + (seed % 5)),
  );
}

// Derive a deterministic email from a member name
function deriveEmail(member: DemoMember): string {
  const slug = member.name.toLowerCase().replace(/[^a-z]+/g, ".");
  return `${slug}@creatorgrowthlab.com`;
}

// Derive a deterministic "member since" date — demo data
function deriveMemberSince(member: DemoMember): string {
  const monthsAgo = 3 + (parseInt(member.id.replace(/\D/g, "") || "1", 10) % 7);
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Recovery probability derived from risk score (0..100)
function recoveryProbability(riskScore: number): number {
  return Math.max(5, Math.min(95, 100 - riskScore));
}

// ─────────────────────────────────────────────────────────────
// Activity event categorization (for filter chips)
// ─────────────────────────────────────────────────────────────
type TimelineFilter = "all" | "messages" | "responses" | "status" | "system";

const FILTER_LABELS: Record<TimelineFilter, string> = {
  all: "All",
  messages: "Messages",
  responses: "Responses",
  status: "Status Changes",
  system: "System Events",
};

function eventCategory(
  type: DemoActivityEvent["type"],
): Exclude<TimelineFilter, "all"> {
  switch (type) {
    case "draft_prepared":
    case "creator_edited":
      return "messages";
    case "student_opened":
    case "student_responded":
    case "course_activity_observed":
      return "responses";
    case "candidate_detected":
    case "approved":
      return "status";
    case "sync_completed":
      return "system";
    default:
      return "system";
  }
}

const EVENT_META: Record<
  DemoActivityEvent["type"],
  { icon: typeof ActivityIcon; color: string; label: string; border: string }
> = {
  sync_completed: {
    icon: RefreshCw,
    color: "text-[var(--ink-muted)]",
    label: "Sync",
    border: "border-l-[var(--ink-muted)]",
  },
  candidate_detected: {
    icon: AlertCircle,
    color: "text-[var(--warning)]",
    label: "Detected",
    border: "border-l-[var(--warning)]",
  },
  draft_prepared: {
    icon: FileText,
    color: "text-[var(--info)]",
    label: "Draft",
    border: "border-l-[var(--info)]",
  },
  creator_edited: {
    icon: MessageSquare,
    color: "text-[var(--ink-secondary)]",
    label: "Edited",
    border: "border-l-[var(--ink-secondary)]",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-[var(--recovery-green)]",
    label: "Approved",
    border: "border-l-[var(--recovery-green)]",
  },
  student_opened: {
    icon: Eye,
    color: "text-[var(--info)]",
    label: "Opened",
    border: "border-l-[var(--info)]",
  },
  student_responded: {
    icon: MessageSquare,
    color: "text-[var(--recovery-green)]",
    label: "Responded",
    border: "border-l-[var(--recovery-green)]",
  },
  course_activity_observed: {
    icon: TrendingUp,
    color: "text-[var(--recovery-green)]",
    label: "Activity",
    border: "border-l-[var(--recovery-green)]",
  },
};

// ─────────────────────────────────────────────────────────────
// Demo intervention history generator
// NOTE: Demo data — synthesized per member for illustrative purposes.
// ─────────────────────────────────────────────────────────────
interface DemoIntervention {
  id: string;
  date: string;
  playbook: string;
  preview: string;
  fullMessage: string;
  responseStatus: "sent" | "opened" | "responded" | "no_response" | "drafted";
  outcome: "recovered" | "no_response" | "in_progress" | "dismissed";
}

function generateInterventions(member: DemoMember): DemoIntervention[] {
  const items: DemoIntervention[] = [];
  const seed = parseInt(member.id.replace(/\D/g, "") || "1", 10);
  const firstName = member.name.split(" ")[0];

  if (member.lastIntervention) {
    items.push({
      id: `iv-${member.id}-1`,
      date: "6 days ago",
      playbook: "Mid-course stall",
      preview:
        "Hey — noticed you paused around Lesson 15. Anything I can help unblock?",
      fullMessage: `Hey ${firstName} — I noticed you were making great progress through ${member.course} and paused around Lesson 15. Is there anything I can help unblock? I'm here if you want to talk through the material or skip ahead to what's next.`,
      responseStatus: member.lastResponse ? "responded" : "opened",
      outcome: member.lastResponse ? "recovered" : "in_progress",
    });
  }

  if (seed % 2 === 0 || member.membership === "trialing") {
    items.push({
      id: `iv-${member.id}-2`,
      date: "12 days ago",
      playbook: "Welcome nudge",
      preview: "Welcome! Just checking in — would a quick walkthrough help?",
      fullMessage: `Hi ${firstName} — welcome to ${member.course}! Sometimes the hardest part is getting into a rhythm. Would a quick walkthrough help?`,
      responseStatus: "no_response",
      outcome: "no_response",
    });
  }

  if (member.status === "responded" || member.status === "active") {
    items.push({
      id: `iv-${member.id}-3`,
      date: "3 weeks ago",
      playbook: "Renewal review",
      preview:
        "You're a few lessons from the finish — want to lock in the last stretch?",
      fullMessage: `${firstName} — you're close to completing ${member.course}. Want to map out the last stretch?`,
      responseStatus: "responded",
      outcome: "recovered",
    });
  }

  return items;
}

const OUTCOME_META: Record<
  DemoIntervention["outcome"],
  { label: string; color: string; bg: string; icon: typeof CheckCircle }
> = {
  recovered: {
    label: "Recovered",
    color: "text-[var(--recovery-green)]",
    bg: "bg-[var(--recovery-green)]/10 border-[var(--recovery-green)]/30",
    icon: CheckCircle,
  },
  no_response: {
    label: "No Response",
    color: "text-[var(--ink-muted)]",
    bg: "bg-[var(--ink-muted)]/10 border-[var(--ink-muted)]/30",
    icon: XCircle,
  },
  in_progress: {
    label: "In Progress",
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10 border-[var(--warning)]/30",
    icon: Hourglass,
  },
  dismissed: {
    label: "Dismissed",
    color: "text-[var(--ink-secondary)]",
    bg: "bg-[var(--canvas-elevated)] border-[var(--hairline)]",
    icon: CircleDashed,
  },
};

const RESPONSE_STATUS_META: Record<
  DemoIntervention["responseStatus"],
  { label: string; color: string }
> = {
  sent: { label: "Sent", color: "text-[var(--ink-secondary)]" },
  opened: { label: "Opened", color: "text-[var(--info)]" },
  responded: {
    label: "Responded",
    color: "text-[var(--recovery-green)]",
  },
  no_response: {
    label: "Not opened",
    color: "text-[var(--ink-muted)]",
  },
  drafted: { label: "Drafted", color: "text-[var(--warning)]" },
};

// ─────────────────────────────────────────────────────────────
// Demo course progress generator
// NOTE: Demo data — synthesized per member.
// ─────────────────────────────────────────────────────────────
interface DemoCourseProgress {
  id: string;
  title: string;
  progress: number;
  lastAccessed: string;
  status: "on_track" | "behind" | "abandoned";
}

function generateCourses(member: DemoMember): DemoCourseProgress[] {
  const primaryStatus: DemoCourseProgress["status"] =
    member.progress >= 60
      ? "on_track"
      : member.progress >= 20
      ? "behind"
      : "abandoned";

  const courses: DemoCourseProgress[] = [
    {
      id: `cp-${member.id}-1`,
      title: member.course,
      progress: member.progress,
      lastAccessed: member.lastActivity,
      status: primaryStatus,
    },
  ];

  const seed = parseInt(member.id.replace(/\D/g, "") || "1", 10);
  if (seed % 3 !== 0) {
    courses.push({
      id: `cp-${member.id}-2`,
      title: "Bonus: Client Templates Library",
      progress: Math.max(0, Math.min(100, (seed * 11) % 80)),
      lastAccessed: "5 days ago",
      status: seed % 2 === 0 ? "on_track" : "behind",
    });
  }

  if (
    member.status === "needs_attention" ||
    member.status === "paused_reminders"
  ) {
    courses.push({
      id: `cp-${member.id}-3`,
      title: "Onboarding Foundations",
      progress: 18,
      lastAccessed: "1 month ago",
      status: "abandoned",
    });
  }

  return courses;
}

const COURSE_STATUS_META: Record<
  DemoCourseProgress["status"],
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  on_track: {
    label: "On track",
    color: "text-[var(--recovery-green)]",
    icon: CheckCircle,
  },
  behind: {
    label: "Behind",
    color: "text-[var(--warning)]",
    icon: AlertTriangle,
  },
  abandoned: {
    label: "Abandoned",
    color: "text-[var(--critical)]",
    icon: UserX,
  },
};

// ─────────────────────────────────────────────────────────────
// Demo risk factors generator
// NOTE: Demo data — synthesized per member from member state.
// ─────────────────────────────────────────────────────────────
interface DemoRiskFactor {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  detectedAt: string;
  suggestedAction: string;
}

function generateRiskFactors(member: DemoMember): DemoRiskFactor[] {
  const factors: DemoRiskFactor[] = [];
  const daysInactive = daysInactiveFrom(member);

  if (daysInactive >= 7) {
    factors.push({
      id: `rf-${member.id}-1`,
      label: `No login in ${daysInactive} days`,
      severity: daysInactive >= 14 ? "critical" : "warning",
      detectedAt: `${Math.max(1, daysInactive - 2)} days ago`,
      suggestedAction: "Send a personalized re-engagement message",
    });
  }

  if (member.progress < 50 && member.progress > 5) {
    factors.push({
      id: `rf-${member.id}-2`,
      label: `Missed lessons — only ${member.progress}% complete`,
      severity: "warning",
      detectedAt: "1 day ago",
      suggestedAction: "Offer a walkthrough of the next lesson",
    });
  }

  if (!member.lastResponse && member.lastIntervention) {
    factors.push({
      id: `rf-${member.id}-3`,
      label: "No response to last 2 emails",
      severity: "warning",
      detectedAt: "3 days ago",
      suggestedAction: "Try a different channel or tone in the next outreach",
    });
  }

  if (member.membership === "cancelling") {
    factors.push({
      id: `rf-${member.id}-4`,
      label: "Cancellation scheduled",
      severity: "critical",
      detectedAt: "2 days ago",
      suggestedAction: "Reach out before cancellation processes",
    });
  } else if (member.membership === "trialing") {
    factors.push({
      id: `rf-${member.id}-4`,
      label: "Trial expiring soon",
      severity: "info",
      detectedAt: "1 day ago",
      suggestedAction:
        "Highlight remaining trial value and conversion benefits",
    });
  }

  if (member.suppressed) {
    factors.push({
      id: `rf-${member.id}-5`,
      label: "Reminders suppressed by request",
      severity: "info",
      detectedAt: "5 days ago",
      suggestedAction: "Honor suppression — do not auto-contact",
    });
  }

  if (factors.length === 0) {
    factors.push({
      id: `rf-${member.id}-ok`,
      label: "No active risk factors detected",
      severity: "info",
      detectedAt: "Just now",
      suggestedAction: "Continue monitoring engagement trends",
    });
  }

  return factors;
}

const RISK_FACTOR_META: Record<
  DemoRiskFactor["severity"],
  {
    color: string;
    bg: string;
    dot: string;
    icon: typeof AlertTriangle;
    label: string;
  }
> = {
  critical: {
    color: "text-[var(--critical)]",
    bg: "bg-[var(--critical)]/5",
    dot: "bg-[var(--critical)]",
    icon: ShieldAlert,
    label: "Critical",
  },
  warning: {
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/5",
    dot: "bg-[var(--warning)]",
    icon: AlertTriangle,
    label: "Warning",
  },
  info: {
    color: "text-[var(--info)]",
    bg: "bg-[var(--info)]/5",
    dot: "bg-[var(--info)]",
    icon: Info,
    label: "Info",
  },
};

// ─────────────────────────────────────────────────────────────
// Demo recent messages
// NOTE: Demo data — synthesized from member interventions.
// ─────────────────────────────────────────────────────────────
interface DemoRecentMessage {
  id: string;
  date: string;
  preview: string;
  status: "delivered" | "opened" | "responded";
}

function generateRecentMessages(member: DemoMember): DemoRecentMessage[] {
  const interventions = generateInterventions(member);
  return interventions.slice(0, 5).map((iv) => ({
    id: `rm-${iv.id}`,
    date: iv.date,
    preview: iv.preview,
    status:
      iv.responseStatus === "responded"
        ? "responded"
        : iv.responseStatus === "opened"
        ? "opened"
        : "delivered",
  }));
}

const MSG_STATUS_META: Record<
  DemoRecentMessage["status"],
  { label: string; color: string; dot: string }
> = {
  delivered: {
    label: "Delivered",
    color: "text-[var(--ink-muted)]",
    dot: "bg-[var(--ink-muted)]",
  },
  opened: {
    label: "Opened",
    color: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
  },
  responded: {
    label: "Responded",
    color: "text-[var(--recovery-green)]",
    dot: "bg-[var(--recovery-green)]",
  },
};

// ─────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────
export default function MemberDetailPage() {
  const params = useParams<{ companyId: string; memberId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(
    params.companyId,
  );

  const member = useMemo(
    () => bundle?.members.find((m) => m.id === params.memberId) ?? null,
    [bundle?.members, params.memberId],
  );

  // Filter activity events for this member (by name match in detail or actor)
  const memberActivity = useMemo<DemoActivityEvent[]>(() => {
    if (!bundle?.activity || !member) return [];
    const matches = bundle.activity.filter(
      (e) =>
        (e.detail && e.detail.includes(member.name)) ||
        e.actor === member.name,
    );
    if (matches.length > 0) return matches;
    // Demo fallback: synthesize 4–6 timeline events for this member
    // NOTE: Demo data — synthesized when no real activity matches.
    const synthesized: DemoActivityEvent[] = [
      {
        id: `syn-${member.id}-1`,
        timestamp: "2 hours ago",
        type: "candidate_detected",
        actor: "RescueLoop",
        detail: `${member.name} flagged: ${member.lastIntervention ?? "Engagement drop"}`,
      },
      {
        id: `syn-${member.id}-2`,
        timestamp: "1 day ago",
        type: "course_activity_observed",
        actor: member.name,
        detail: `Completed a lesson in ${member.course} (${member.progress}% overall)`,
      },
      {
        id: `syn-${member.id}-3`,
        timestamp: "3 days ago",
        type: "draft_prepared",
        actor: "RescueLoop",
        detail: `Draft support message prepared for ${member.name}`,
      },
      {
        id: `syn-${member.id}-4`,
        timestamp: "5 days ago",
        type: "sync_completed",
        actor: "System",
        detail: `Membership sync updated ${member.name}'s status`,
      },
    ];
    if (member.lastResponse) {
      synthesized.push({
        id: `syn-${member.id}-5`,
        timestamp: "4 days ago",
        type: "student_responded",
        actor: member.name,
        detail: `Responded: '${member.lastResponse}'`,
      });
    }
    return synthesized;
  }, [bundle, member]);

  // Communication composer state
  const [message, setMessage] = useState("");
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);

  // Recent messages: pre-populated from member history + user-sent messages.
  // Use useMemo for the seed (deterministic per member) and useState only for
  // messages the user sends at runtime — avoids setState-in-effect pattern.
  const seedMessages = useMemo<DemoRecentMessage[]>(
    () => (member ? generateRecentMessages(member) : []),
    [member],
  );
  const [sentMessages, setSentMessages] = useState<DemoRecentMessage[]>([]);
  const recentMessages = useMemo<DemoRecentMessage[]>(
    () => [...sentMessages, ...seedMessages].slice(0, 5),
    [sentMessages, seedMessages],
  );

  // Engagement sparkline (deterministic demo) — computed before any early
  // returns so the hook order stays stable.
  const engagementSparkline = useMemo(() => {
    if (!member) return [];
    const seed = member.progress * 7 + member.name.length * 13;
    const points: number[] = [];
    for (let i = 0; i < 8; i++) {
      const val = (seed * (i + 1) * 31 + 37) % 100;
      const trend = member.progress + (val - 50) * 0.4;
      points.push(Math.max(0, Math.min(100, Math.round(trend))));
    }
    return points;
  }, [member]);

  // Timeline filter + pagination state
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [timelineLimit, setTimelineLimit] = useState(10);

  // Intervention expand state
  const [expandedInterventionId, setExpandedInterventionId] = useState<
    string | null
  >(null);

  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  function applyPlaybook(playbook: DemoPlaybook) {
    setSelectedPlaybookId(playbook.id);
    // Demo: synthesize a personalized message from the playbook template
    const firstName = member?.name.split(" ")[0] ?? "there";
    const course = member?.course ?? "your course";
    setMessage(
      `Hey ${firstName} — ${playbook.messageTemplate}. I noticed you're ${member?.progress ?? 0}% through ${course}. Want to hop on a quick call or skip ahead to what's next?`,
    );
    toast.success(`Template applied: ${playbook.name}`, {
      description: "Message body populated — review and send when ready.",
    });
  }

  function handleSendMessage() {
    if (!message.trim() || !member) return;
    setSending(true);
    // Simulate async send
    setTimeout(() => {
      const newMsg: DemoRecentMessage = {
        id: `rm-new-${Date.now()}`,
        date: "Just now",
        preview: message.length > 80 ? message.slice(0, 80) + "…" : message,
        status: "delivered",
      };
      setRecentMessages((prev) => [newMsg, ...prev].slice(0, 5));
      setMessage("");
      setSelectedPlaybookId(null);
      setSending(false);
      toast.success("Message sent", {
        description: `Delivered to ${member.name}. You'll be notified when they respond.`,
      });
    }, 700);
  }

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return memberActivity;
    return memberActivity.filter(
      (e) => eventCategory(e.type) === timelineFilter,
    );
  }, [memberActivity, timelineFilter]);

  const visibleTimeline = filteredTimeline.slice(0, timelineLimit);
  const hasMoreTimeline = filteredTimeline.length > timelineLimit;

  const playbooks = bundle?.playbooks ?? [];

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 animate-pulse rounded-[6px] bg-[var(--hairline)]" />
        </div>
        <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="size-16 animate-pulse rounded-full bg-[var(--hairline)]" />
              <div className="space-y-2">
                <div className="h-6 w-48 animate-pulse rounded-[4px] bg-[var(--hairline)]" />
                <div className="h-3 w-32 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                <div className="h-3 w-40 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
              </div>
            </div>
            <div className="size-24 animate-pulse rounded-full bg-[var(--hairline)]" />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <CardSkeleton rows={6} />
            <CardSkeleton rows={4} />
          </div>
          <CardSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <Link
            href={`/dashboard/${params.companyId}/students`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
          >
            <ArrowLeft className="size-3.5" />
            Back to Members
          </Link>
          <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-6">
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2 text-[13px] text-[var(--critical)]">
                <AlertCircle className="size-4" />
                <span className="font-medium">
                  Failed to load member profile
                </span>
              </div>
              <p className="text-[12px] text-[var(--ink-secondary)]">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-8 rounded-[6px] border-[var(--hairline-strong)] px-3 text-[12px]"
              >
                <RefreshCw
                  className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
                />
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // ── Not found state ──────────────────────────────────────────
  if (!member) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <Link
            href={`/dashboard/${params.companyId}/students`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
          >
            <ArrowLeft className="size-3.5" />
            Back to Members
          </Link>
          <EnhancedEmptyState
            icon={UserX}
            title="Member not found"
            description={`We couldn't find a member with ID "${params.memberId}". They may have been removed or the link may be incorrect.`}
            actionLabel="Back to Members"
            onAction={() => {
              window.location.href = `/dashboard/${params.companyId}/students`;
            }}
          />
        </div>
      </PageTransition>
    );
  }

  // ── Compute derived values ───────────────────────────────────
  const riskScore = deriveRiskScore(member);
  const risk = riskStyle(riskScore);
  const statusMeta = STATUS_META[member.status];
  const daysInactive = daysInactiveFrom(member);
  const recoveryProb = recoveryProbability(riskScore);
  const email = deriveEmail(member);
  const memberSince = deriveMemberSince(member);
  const interventions = generateInterventions(member);
  const courses = generateCourses(member);
  const riskFactors = generateRiskFactors(member);

  // Suppress unused warning for toRelativeTime (kept for future use)
  void toRelativeTime;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ── Back link ───────────────────────────────────── */}
        <Link
          href={`/dashboard/${params.companyId}/students`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
        >
          <ArrowLeft className="size-3.5" />
          Back to Members
        </Link>

        {/* ── Header section ──────────────────────────────── */}
        <Card className="overflow-hidden rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)]">
          <div
            className={cn(
              "h-[3px] w-full",
              riskScore <= 30
                ? "bg-[var(--recovery-green)]"
                : riskScore <= 60
                ? "bg-[var(--warning)]"
                : "bg-[var(--critical)]",
            )}
            aria-hidden
          />
          <div className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: avatar + name + meta */}
              <div className="flex items-start gap-4">
                <Avatar className="size-16 border border-[var(--hairline)]">
                  <AvatarFallback
                    className={cn(
                      "rounded-full font-mono text-[16px] font-semibold",
                      statusMeta.bg,
                      statusMeta.color,
                    )}
                  >
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-serif text-[28px] leading-tight text-[var(--ink-primary)]">
                      {member.name}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-[4px] text-[10px]",
                        statusMeta.bg,
                        statusMeta.color,
                      )}
                    >
                      <span
                        className={cn(
                          "mr-1 size-1.5 rounded-full",
                          statusMeta.dot,
                        )}
                      />
                      {statusMeta.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--ink-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-[var(--ink-muted)]" />
                      {email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[var(--ink-muted)]" />
                      Member since {memberSince}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-3.5 text-[var(--ink-muted)]" />
                      {member.course}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-muted)]">
                    <span className="rounded-[3px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-0.5 font-mono">
                      ID: {member.id}
                    </span>
                    {member.lastIntervention && (
                      <span className="flex items-center gap-1">
                        <Target className="size-3" />
                        Last intervention: {member.lastIntervention}
                      </span>
                    )}
                    {member.lastResponse && (
                      <span className="flex items-center gap-1">
                        <CornerDownRight className="size-3" />
                        Last response: {member.lastResponse}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: risk gauge */}
              <div className="flex flex-col items-center gap-1">
                <RiskGauge score={riskScore} color={risk.color} />
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-[3px] text-[9px] uppercase tracking-[0.04em]",
                    riskScore <= 30
                      ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                      : riskScore <= 60
                      ? "border-[var(--warning)]/30 text-[var(--warning)]"
                      : "border-[var(--critical)]/30 text-[var(--critical)]",
                  )}
                >
                  {risk.label} risk
                </Badge>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setMessage("");
                  document
                    .getElementById("member-composer")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(
                    () =>
                      document
                        .getElementById("member-composer-textarea")
                        ?.focus(),
                    300,
                  );
                }}
                className="h-8 rounded-[6px] bg-[var(--ink-primary)] px-3 text-[12px] text-white hover:bg-[var(--ink-primary)]/90"
              >
                <SendIcon className="mr-1.5 size-3.5" />
                Send message
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.success("Added to rescue queue", {
                    description: `${member.name} has been queued for the next outreach cycle.`,
                  });
                }}
                className="h-8 rounded-[6px] border-[var(--hairline-strong)] px-3 text-[12px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                <Plus className="mr-1.5 size-3.5" />
                Add to rescue queue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document
                    .getElementById("member-timeline")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="h-8 rounded-[6px] border-[var(--hairline-strong)] px-3 text-[12px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                <ActivityIcon className="mr-1.5 size-3.5" />
                View activity
              </Button>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  className="h-8 rounded-[6px] px-2 text-[12px] text-[var(--ink-muted)]"
                  aria-label="Refresh"
                >
                  <RefreshCw
                    className={cn("size-3.5", refreshing && "animate-spin")}
                  />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Key Metrics row ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Days inactive"
            value={daysInactive}
            icon={Clock}
            accent={
              daysInactive >= 14
                ? "critical"
                : daysInactive >= 7
                ? "warning"
                : "recovery"
            }
            colorClassName={
              daysInactive >= 14
                ? "text-[var(--critical)]"
                : daysInactive >= 7
                ? "text-[var(--warning)]"
                : "text-[var(--recovery-green)]"
            }
            trend={
              daysInactive >= 7 ? "Needs re-engagement" : "Recently active"
            }
            delay={0}
          />
          <MetricCard
            label="Engagement score"
            value={member.progress}
            format="percent"
            icon={TrendingUp}
            accent={
              member.progress >= 60
                ? "recovery"
                : member.progress >= 30
                ? "warning"
                : "critical"
            }
            colorClassName={
              member.progress >= 60
                ? "text-[var(--recovery-green)]"
                : member.progress >= 30
                ? "text-[var(--warning)]"
                : "text-[var(--critical)]"
            }
            trend="8-week rolling"
            delay={60}
          />
          <MetricCard
            label="Last response"
            value={0}
            icon={MessageSquare}
            accent={member.lastResponse ? "info" : "none"}
            colorClassName="text-[var(--ink-primary)]"
            trend={
              member.lastResponse ? (
                <span className="text-[var(--info)]">
                  {member.lastResponse}
                </span>
              ) : (
                <span className="text-[var(--ink-muted)]">No response yet</span>
              )
            }
            delay={120}
          />
          <MetricCard
            label="Recovery probability"
            value={recoveryProb}
            format="percent"
            icon={Target}
            accent={
              recoveryProb >= 60
                ? "recovery"
                : recoveryProb >= 30
                ? "warning"
                : "critical"
            }
            colorClassName={
              recoveryProb >= 60
                ? "text-[var(--recovery-green)]"
                : recoveryProb >= 30
                ? "text-[var(--warning)]"
                : "text-[var(--critical)]"
            }
            trend={
              recoveryProb >= 60
                ? "Strong recovery signal"
                : recoveryProb >= 30
                ? "Moderate — needs outreach"
                : "Low — urgent action recommended"
            }
            delay={180}
          />
        </div>

        {/* ── Two-column layout: main + sidebar ──────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── MAIN COLUMN (2/3) ── */}
          <div className="space-y-5 lg:col-span-2">
            {/* ── Engagement Timeline ── */}
            <Card
              id="member-timeline"
              className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="size-4 text-[var(--ink-secondary)]" />
                  <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">
                    Engagement Timeline
                  </h2>
                </div>
                <Badge variant="outline" className="rounded-[3px] text-[10px]">
                  {filteredTimeline.length} events
                </Badge>
              </div>

              {/* Filter chips */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(Object.keys(FILTER_LABELS) as TimelineFilter[]).map((f) => {
                  const count =
                    f === "all"
                      ? memberActivity.length
                      : memberActivity.filter(
                          (e) => eventCategory(e.type) === f,
                        ).length;
                  const active = timelineFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setTimelineFilter(f);
                        setTimelineLimit(10);
                      }}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-all",
                        active
                          ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-white"
                          : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
                      )}
                    >
                      {FILTER_LABELS[f]}
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums",
                          active ? "text-white/70" : "text-[var(--ink-muted)]",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Timeline events */}
              {visibleTimeline.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
                  <div className="text-center">
                    <Inbox className="mx-auto size-5 text-[var(--ink-muted)]" />
                    <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
                      No events match this filter.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline rail */}
                  <div
                    className="absolute left-[19px] top-3 bottom-3 w-[2px] rounded-full bg-[var(--hairline)]"
                    aria-hidden
                  />
                  <div className="space-y-0.5">
                    <AnimatePresence mode="popLayout">
                      {visibleTimeline.map((e, i) => {
                        const meta = EVENT_META[e.type];
                        const Icon = meta.icon;
                        return (
                          <motion.div
                            key={e.id}
                            layout
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 4 }}
                            transition={{
                              delay: Math.min(i * 0.03, 0.3),
                              duration: 0.2,
                            }}
                            className={cn(
                              "group relative flex items-start gap-3 rounded-[8px] border-l-2 px-3 py-2.5 transition-colors hover:bg-[var(--canvas)]",
                              meta.border,
                            )}
                          >
                            {/* Icon */}
                            <div
                              className={cn(
                                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface)] transition-all",
                                "border-[var(--hairline)] group-hover:border-[var(--hairline-strong)] group-hover:shadow-sm",
                              )}
                            >
                              <Icon className={cn("size-3.5", meta.color)} />
                            </div>
                            {/* Content */}
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="block text-[12.5px] font-medium text-[var(--ink-primary)]">
                                    {e.detail}
                                  </span>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                                    <span className="font-medium text-[var(--ink-secondary)]">
                                      {e.actor}
                                    </span>
                                    <span className="text-[var(--ink-muted)]">
                                      ·
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="rounded-[2px] text-[9px]"
                                    >
                                      {meta.label}
                                    </Badge>
                                  </p>
                                </div>
                                <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--ink-secondary)]">
                                  {e.timestamp}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Load more */}
              {hasMoreTimeline && (
                <div className="mt-4 flex items-center justify-center border-t border-[var(--hairline)] pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimelineLimit((l) => l + 10)}
                    className="h-7 rounded-[6px] text-[11px] text-[var(--ink-secondary)]"
                  >
                    Load more
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </div>
              )}
            </Card>

            {/* ── Intervention History ── */}
            <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-[var(--ink-secondary)]" />
                  <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">
                    Intervention History
                  </h2>
                </div>
                <Badge variant="outline" className="rounded-[3px] text-[10px]">
                  {interventions.length} past interventions
                </Badge>
              </div>

              {interventions.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
                  <div className="text-center">
                    <Inbox className="mx-auto size-5 text-[var(--ink-muted)]" />
                    <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
                      No interventions recorded yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {interventions.map((iv, i) => {
                      const outcomeMeta = OUTCOME_META[iv.outcome];
                      const statusMetaIv =
                        RESPONSE_STATUS_META[iv.responseStatus];
                      const OutcomeIcon = outcomeMeta.icon;
                      const isExpanded = expandedInterventionId === iv.id;
                      return (
                        <motion.div
                          key={iv.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedInterventionId(
                                isExpanded ? null : iv.id,
                              )
                            }
                            className={cn(
                              "w-full rounded-[6px] border bg-[var(--canvas)] px-4 py-3 text-left transition-all",
                              isExpanded
                                ? `${outcomeMeta.bg}`
                                : "border-[var(--hairline)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <OutcomeIcon
                                className={cn(
                                  "size-4 shrink-0",
                                  outcomeMeta.color,
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                                    {iv.playbook}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "rounded-[3px] text-[9px]",
                                      outcomeMeta.bg,
                                      outcomeMeta.color,
                                    )}
                                  >
                                    {outcomeMeta.label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "rounded-[3px] text-[9px]",
                                      statusMetaIv.color,
                                    )}
                                  >
                                    {statusMetaIv.label}
                                  </Badge>
                                </div>
                                <p className="mt-1 truncate text-[11.5px] text-[var(--ink-secondary)]">
                                  {iv.preview}
                                </p>
                              </div>
                              <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                                {iv.date}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="size-4 shrink-0 text-[var(--ink-muted)]" />
                              ) : (
                                <ChevronRight className="size-4 shrink-0 text-[var(--ink-muted)]" />
                              )}
                            </div>

                            {/* Expanded message body */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 border-t border-[var(--hairline)] pt-3">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                                      Full message
                                    </span>
                                    <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--ink-secondary)]">
                                      {iv.fullMessage}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </Card>

            {/* ── Course Progress ── */}
            <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-[var(--ink-secondary)]" />
                  <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">
                    Course Progress
                  </h2>
                </div>
                <Badge variant="outline" className="rounded-[3px] text-[10px]">
                  {courses.length} enrolled
                </Badge>
              </div>

              <div className="space-y-3">
                {courses.map((c, i) => {
                  const courseStatusMeta = COURSE_STATUS_META[c.status];
                  const StatusIcon = courseStatusMeta.icon;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3.5 transition-colors hover:border-[var(--hairline-strong)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                              {c.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-[3px] text-[9px]",
                                courseStatusMeta.color,
                                "border-current/30",
                              )}
                            >
                              <StatusIcon className="mr-1 size-2.5" />
                              {courseStatusMeta.label}
                            </Badge>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                            <Clock className="size-2.5" />
                            Last accessed {c.lastAccessed}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[14px] font-semibold tabular-nums",
                            courseStatusMeta.color,
                          )}
                        >
                          {c.progress}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2.5 h-[5px] w-full overflow-hidden rounded-full bg-[var(--hairline)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.max(2, Math.min(100, c.progress))}%`,
                          }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={cn(
                            "h-full rounded-full",
                            c.status === "on_track"
                              ? "bg-[var(--recovery-green)]"
                              : c.status === "behind"
                              ? "bg-[var(--warning)]"
                              : "bg-[var(--critical)]",
                          )}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* ── Risk Factors ── */}
            <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-[var(--ink-secondary)]" />
                  <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">
                    Risk Factors
                  </h2>
                </div>
                <Badge variant="outline" className="rounded-[3px] text-[10px]">
                  {riskFactors.length} detected
                </Badge>
              </div>

              <div className="space-y-2">
                {riskFactors.map((f, i) => {
                  const meta = RISK_FACTOR_META[f.severity];
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      className={cn(
                        "flex items-start gap-3 rounded-[6px] border-l-[3px] bg-[var(--canvas)] p-3",
                        f.severity === "critical" &&
                          "border-l-[var(--critical)]",
                        f.severity === "warning" && "border-l-[var(--warning)]",
                        f.severity === "info" && "border-l-[var(--info)]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-[6px]",
                          meta.bg,
                        )}
                      >
                        <Icon className={cn("size-3.5", meta.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-medium text-[var(--ink-primary)]">
                            {f.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-[3px] text-[9px] uppercase tracking-[0.04em]",
                              meta.color,
                              "border-current/30",
                            )}
                          >
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                          <Clock className="size-2.5" />
                          Detected {f.detectedAt}
                        </p>
                        <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-[var(--ink-secondary)]">
                          <Sparkles className="mt-0.5 size-3 shrink-0 text-[var(--recovery-green)]" />
                          <span>
                            <span className="font-medium">Suggested:</span>{" "}
                            {f.suggestedAction}
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── SIDEBAR COLUMN (1/3) — Communication Panel ── */}
          <div className="space-y-5 lg:col-span-1">
            <Card
              id="member-composer"
              className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5 lg:sticky lg:top-4"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-[var(--ink-secondary)]" />
                  <h2 className="font-serif text-[15px] text-[var(--ink-primary)]">
                    Compose
                  </h2>
                </div>
                <Badge variant="outline" className="rounded-[3px] text-[9px]">
                  To: {member.name.split(" ")[0]}
                </Badge>
              </div>

              {/* Template selector */}
              <div className="mb-3">
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  <FileText className="size-3" />
                  Template
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full justify-between rounded-[6px] border-[var(--hairline-strong)] px-3 text-[12px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    >
                      <span className="truncate">
                        {selectedPlaybookId
                          ? playbooks.find(
                              (p) => p.id === selectedPlaybookId,
                            )?.name
                          : "Select a playbook template…"}
                      </span>
                      <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] rounded-[8px] border-[var(--hairline)] bg-[var(--surface)]"
                  >
                    <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                      Playbooks
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--hairline)]" />
                    {playbooks.length === 0 ? (
                      <div className="px-2 py-3 text-[11px] text-[var(--ink-muted)]">
                        No playbooks available
                      </div>
                    ) : (
                      playbooks.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onSelect={() => applyPlaybook(p)}
                          className="flex flex-col items-start gap-0.5 rounded-[4px] px-2 py-2 text-[12px] text-[var(--ink-secondary)] focus:bg-[var(--canvas-elevated)] focus:text-[var(--ink-primary)]"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-[10px] text-[var(--ink-muted)]">
                            {p.criteria}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Message composer */}
              <div className="mb-3">
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  <Mail className="size-3" />
                  Message
                </label>
                <Textarea
                  id="member-composer-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Write a personal message to ${member.name.split(" ")[0]}…`}
                  className="min-h-[120px] resize-y rounded-[6px] border-[var(--hairline-strong)] bg-[var(--canvas)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--recovery-green)] focus-visible:ring-[var(--recovery-green)]/20"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                  <span>{message.length} characters</span>
                  <span>Quiet hours: 20:00–08:00</span>
                </div>
              </div>

              {/* Send button */}
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="h-9 w-full rounded-[6px] bg-[var(--ink-primary)] text-[12px] font-medium text-white hover:bg-[var(--ink-primary)]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 size-3.5" />
                    Send message
                  </>
                )}
              </Button>

              <Separator className="my-4" />

              {/* Recent messages */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                    <Inbox className="size-3" />
                    Recent messages
                  </span>
                  <Badge variant="outline" className="rounded-[3px] text-[9px]">
                    {recentMessages.length}
                  </Badge>
                </div>
                {recentMessages.length === 0 ? (
                  <div className="rounded-[6px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-3 py-4 text-center">
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      No messages sent yet.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {recentMessages.map((m, i) => {
                      const msgStatus = MSG_STATUS_META[m.status];
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                          className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-[10px]">
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  msgStatus.dot,
                                )}
                              />
                              <span
                                className={cn("font-medium", msgStatus.color)}
                              >
                                {msgStatus.label}
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-[9px] tabular-nums text-[var(--ink-muted)]">
                              {m.date}
                            </span>
                          </div>
                          <p className="mt-1 text-[11.5px] leading-snug text-[var(--ink-secondary)]">
                            {m.preview}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Engagement trend mini-card */}
            <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-[var(--ink-secondary)]" />
                  <h2 className="font-serif text-[15px] text-[var(--ink-primary)]">
                    Engagement Trend
                  </h2>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-serif text-[22px] font-semibold leading-none tabular-nums text-[var(--ink-primary)]">
                    {member.progress}%
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
                    8-week rolling
                  </p>
                </div>
                <SparklineMini
                  data={engagementSparkline}
                  width={120}
                  height={40}
                  color={
                    member.progress >= 60
                      ? "var(--recovery-green)"
                      : member.progress >= 30
                      ? "var(--warning)"
                      : "var(--critical)"
                  }
                />
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-[14px] font-semibold tabular-nums text-[var(--recovery-green)]">
                    {Math.max(0, Math.round(member.progress / 10))}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.04em] text-[var(--ink-muted)]">
                    Lessons
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[14px] font-semibold tabular-nums text-[var(--info)]">
                    {Math.max(1, Math.round(member.progress / 8))}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.04em] text-[var(--ink-muted)]">
                    Streak days
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[14px] font-semibold tabular-nums text-[var(--ink-secondary)]">
                    {Math.max(0, 29 - Math.round(member.progress / 4))}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.04em] text-[var(--ink-muted)]">
                    Remaining
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
