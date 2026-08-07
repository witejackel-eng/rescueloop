"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  Moon,
  MessageSquare,
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Pencil,
  Eye,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";

export default function PlaybooksPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  const playbooks = bundle?.playbooks ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Playbooks</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Intervention rules that determine when and how students are contacted
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-[3px] text-[10px]">
            {loading ? "…" : `${playbooks.filter((p) => p.enabled).length} of ${playbooks.length} active`}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
            aria-label="Refresh playbooks"
          >
            <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertTriangle className="size-4" />
            <span>Failed to load playbooks: {error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Summary stats */}
      {!loading && playbooks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--recovery-green)]/10">
                  <BookOpen className="size-4 text-[var(--recovery-green)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">{playbooks.length}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Total playbooks</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--info)]/10">
                  <CheckCircle2 className="size-4 text-[var(--info)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">
                    {playbooks.filter((p) => p.enabled).length}
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Active</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--warning)]/10">
                  <Users className="size-4 text-[var(--warning)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">
                    {playbooks.reduce((sum, p) => sum + p.studentsDetected, 0)}
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Students detected</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--ink-secondary)]/10">
                  <Zap className="size-4 text-[var(--ink-secondary)]" />
                </div>
                <div>
                  <p className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">
                    {playbooks.filter((p) => p.approvalBehavior === "automatic").length}
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Auto-approved</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Playbook cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {playbooks.map((p, i) => {
              const isExpanded = expandedIdx === i;
              const approvalColor =
                p.approvalBehavior === "automatic"
                  ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                  : "border-[var(--info)]/30 text-[var(--info)]";

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card className="group overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]">
                    <div className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-9 items-center justify-center rounded-[7px]",
                              p.enabled
                                ? "bg-[var(--recovery-green)]/10"
                                : "bg-[var(--ink-muted)]/10"
                            )}
                          >
                            <BookOpen
                              className={cn(
                                "size-4",
                                p.enabled ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]"
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-[15px] font-medium text-[var(--ink-primary)]">{p.name}</h2>
                              {!p.enabled && (
                                <Badge variant="outline" className="rounded-[3px] text-[9px] border-[var(--ink-muted)]/30 text-[var(--ink-muted)]">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{p.criteria}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn("rounded-[3px] text-[10px] capitalize", approvalColor)}>
                            {p.approvalBehavior}
                          </Badge>
                          <Switch checked={p.enabled} onCheckedChange={(checked) => {
                            toast.success(`${p.name} playbook ${checked ? "enabled" : "disabled"}`, {
                              description: checked ? "Students matching criteria will be detected" : "Detection paused for this playbook",
                            });
                          }} />
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <Clock className="size-3.5 text-[var(--ink-muted)]" />
                          <div>
                            <span className="text-[10px] text-[var(--ink-muted)]">Cooldown</span>
                            <p className="text-[12px] text-[var(--ink-primary)]">{p.cooldown}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Moon className="size-3.5 text-[var(--ink-muted)]" />
                          <div>
                            <span className="text-[10px] text-[var(--ink-muted)]">Quiet hours</span>
                            <p className="text-[12px] text-[var(--ink-primary)]">{p.quietHours}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-3.5 text-[var(--ink-muted)]" />
                          <div>
                            <span className="text-[10px] text-[var(--ink-muted)]">Approval</span>
                            <p className="text-[12px] text-[var(--ink-primary)] capitalize">{p.approvalBehavior}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="size-3.5 text-[var(--ink-muted)]" />
                          <div>
                            <span className="text-[10px] text-[var(--ink-muted)]">Detected</span>
                            <p className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                              {p.studentsDetected} students
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedIdx(isExpanded ? null : i)}
                        className="mt-3 flex items-center gap-1 text-[11px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-secondary)]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronRight className="size-3" />
                        )}
                        {isExpanded ? "Hide details" : "View message template"}
                      </button>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[var(--hairline)] bg-[var(--canvas)]/50 px-5 py-4">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                              Message template
                            </span>
                            <div className="mt-2 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] p-3 text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                              {p.messageTemplate}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-7 rounded-[5px] px-2 text-[11px] text-[var(--ink-secondary)]">
                                <Pencil className="mr-1 size-3" /> Edit template
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 rounded-[5px] px-2 text-[11px] text-[var(--ink-secondary)]">
                                <Eye className="mr-1 size-3" /> Preview
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Methodology note */}
      {!loading && (
        <Card className="rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] p-4">
          <div className="flex items-start gap-2.5">
            <Shield className="mt-0.5 size-3.5 shrink-0 text-[var(--ink-muted)]" />
            <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
              Playbooks define <em>when</em> students qualify for outreach, not <em>what</em> message they receive.
              Messages are always creator-reviewed before sending. Automatic approval sends a draft for creator review first, then auto-approves after the quiet period if no edits are made.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
