"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Users,
  TrendingDown,
  Lightbulb,
  X,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  pattern: string;
  description: string;
  affectedStudents: number;
  matchScore: number;
  suggestedPlaybook: string;
  trigger: string;
  estimatedImpact: string;
  status: "pending" | "applying" | "applied" | "dismissed";
}

const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    pattern: "Lesson 7 friction → 14-day inactivity",
    description:
      "5 students stalled at Lesson 7 (Client Onboarding Setup) with no activity for 14+ days. Pattern matches the 'Mid-Course Rescue' playbook criteria.",
    affectedStudents: 5,
    matchScore: 92,
    suggestedPlaybook: "Mid-course stall",
    trigger: "Lesson 7 · 14d inactive · 24% stall rate",
    estimatedImpact: "~$395/mo recovered",
    status: "pending",
  },
  {
    id: "r2",
    pattern: "Never started + 3-day trial ending",
    description:
      "3 trial members haven't started Lesson 1 and their trial ends in 3 days. The 'Never Started' playbook can re-engage before conversion window closes.",
    affectedStudents: 3,
    matchScore: 87,
    suggestedPlaybook: "Never started",
    trigger: "Trial ending · 0% progress · 3 days left",
    estimatedImpact: "~$237/mo at risk",
    status: "pending",
  },
  {
    id: "r3",
    pattern: "Renewal in 7d + last lesson incomplete",
    description:
      "4 members have renewals within 7 days but haven't completed their current lesson. The 'Renewal Review' playbook can prompt completion before renewal.",
    affectedStudents: 4,
    matchScore: 81,
    suggestedPlaybook: "Renewal review",
    trigger: "Renewal ≤7d · 60% progress · last lesson incomplete",
    estimatedImpact: "~$316/mo retention",
    status: "pending",
  },
];

export function PlaybookRecommender() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(INITIAL_RECOMMENDATIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function applyRecommendation(id: string) {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "applying" } : r)),
    );
    // Simulate async playbook application
    setTimeout(() => {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "applied" } : r)),
      );
      const rec = recommendations.find((r) => r.id === id);
      if (rec) {
        toast.success("Playbook activated", {
          description: `"${rec.suggestedPlaybook}" applied to ${rec.affectedStudents} students.`,
        });
      }
    }, 1500);
  }

  function dismissRecommendation(id: string) {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "dismissed" } : r)),
    );
    toast.info("Recommendation dismissed", {
      description: "We won't show this pattern again for 7 days.",
    });
  }

  const activeRecs = recommendations.filter((r) => r.status !== "dismissed");
  const appliedCount = recommendations.filter((r) => r.status === "applied").length;
  const totalStudents = activeRecs.reduce((sum, r) => sum + r.affectedStudents, 0);

  return (
    <Card className="relative overflow-hidden rounded-[10px] border border-[var(--info)]/20 bg-gradient-to-br from-[var(--info)]/[0.04] to-transparent">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--hairline)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--info)]/10 ring-1 ring-[var(--info)]/20">
            <Sparkles className="size-5 text-[var(--info)]" />
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-serif text-[16px] text-[var(--ink-primary)]">
              AI Playbook Recommendations
              <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--info)]/30 text-[var(--info)] bg-[var(--info)]/5">
                BETA
              </Badge>
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              {activeRecs.length === 0
                ? "All recommendations actioned."
                : `${activeRecs.length} pattern${activeRecs.length === 1 ? "" : "s"} detected · ${totalStudents} students affected`}
            </p>
          </div>
        </div>
        {appliedCount > 0 && (
          <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)] bg-[var(--recovery-green)]/5">
            <CheckCircle2 className="mr-1 size-2.5" />
            {appliedCount} applied
          </Badge>
        )}
      </div>

      {/* Recommendations list */}
      <div className="divide-y divide-[var(--hairline-subtle)]">
        <AnimatePresence mode="popLayout">
          {activeRecs.map((rec, i) => (
            <motion.div
              key={rec.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="group px-5 py-3"
            >
              <div className="flex items-start gap-3">
                {/* Match score badge */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-[6px] font-mono text-[11px] font-semibold tabular-nums",
                      rec.matchScore >= 90
                        ? "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]"
                        : rec.matchScore >= 80
                          ? "bg-[var(--info)]/10 text-[var(--info)]"
                          : "bg-[var(--warning)]/10 text-[var(--warning)]",
                    )}
                  >
                    {rec.matchScore}
                  </div>
                  <span className="text-[8px] uppercase tracking-wide text-[var(--ink-muted)]">match</span>
                </div>

                <div className="min-w-0 flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                        {rec.pattern}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink-secondary)]">
                        {rec.description}
                      </p>
                    </div>
                    {rec.status === "applied" && (
                      <Badge variant="outline" className="shrink-0 rounded-[3px] text-[9px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)] bg-[var(--recovery-green)]/5">
                        <CheckCircle2 className="mr-1 size-2.5" />
                        Applied
                      </Badge>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-[3px] text-[9px]">
                      <Users className="mr-1 size-2.5 text-[var(--ink-muted)]" />
                      {rec.affectedStudents} students
                    </Badge>
                    <Badge variant="outline" className="rounded-[3px] text-[9px]">
                      <TrendingDown className="mr-1 size-2.5 text-[var(--warning)]" />
                      {rec.estimatedImpact}
                    </Badge>
                    <Badge variant="outline" className="rounded-[3px] text-[9px]">
                      <BookOpen className="mr-1 size-2.5 text-[var(--info)]" />
                      {rec.suggestedPlaybook}
                    </Badge>
                  </div>

                  {/* Expandable details */}
                  {expandedId === rec.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                          Trigger criteria
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-[var(--ink-secondary)]">
                          {rec.trigger}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Buttons */}
                  {rec.status === "pending" && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => applyRecommendation(rec.id)}
                        className="h-7 rounded-[6px] bg-[var(--ink-primary)] px-3 text-[11px] text-white hover:bg-[var(--ink-primary)]/90"
                      >
                        Apply to {rec.affectedStudents} students
                        <ArrowRight className="ml-1 size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                        className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-secondary)]"
                      >
                        <Lightbulb className="mr-1 size-3" />
                        {expandedId === rec.id ? "Hide details" : "Why this?"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissRecommendation(rec.id)}
                        className="ml-auto h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                        aria-label="Dismiss recommendation"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}

                  {rec.status === "applying" && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--ink-secondary)]">
                      <Loader2 className="size-3 animate-spin text-[var(--info)]" />
                      Activating playbook and queuing drafts…
                    </div>
                  )}

                  {rec.status === "applied" && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--recovery-green)]">
                      <CheckCircle2 className="size-3" />
                      Drafts queued. Review them in the Rescue Queue.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--hairline)] px-5 py-3 text-[10px] text-[var(--ink-muted)]">
        <span>
          Pattern detection runs every 6 hours · Last scan: 2 hours ago
        </span>
        <span className="font-mono">v1.0 · demo</span>
      </div>
    </Card>
  );
}
