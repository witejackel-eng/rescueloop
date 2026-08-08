"use client";

// Value page client — fetches from the Value Ledger API and renders
// the full attribution waterfall, ledger table, evidence timeline,
// ROI panel, and methodology explanation.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ChevronDown,
  DollarSign,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { AttributionWaterfall } from "@/components/rescueloop/value/attribution-waterfall";
import { EvidenceTimeline } from "@/components/rescueloop/value/evidence-timeline";
import { LedgerTable } from "@/components/rescueloop/value/ledger-table";
import { RoiPanel } from "@/components/rescueloop/value/roi-panel";
import { formatCurrency } from "@/lib/format";
import type { AttributionLevel, ValueEvent as ValueType } from "@/lib/types";

// ─── API response types ────────────────────────────────────────

interface ApiEvidence {
  id: string;
  evidenceType: string;
  evidenceRef: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

interface ApiValueEvent {
  id: string;
  event: string;
  attributionLevel: string;
  amountCents: number;
  currency: string;
  formula: string | null;
  policyVersion: string;
  excluded: boolean;
  disputed: boolean;
  disputeReason: string | null;
  disputedAt: string | null;
  excludedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentEventId: string | null;
  member: { id: string; name: string | null } | null;
  course: { id: string; name: string } | null;
  intervention: {
    id: string;
    trigger: string;
    state: string;
    sentAt: string | null;
    deliveredAt: string | null;
  } | null;
  evidence: ApiEvidence[];
}

interface ApiMethodology {
  policyVersion: string;
  windowDays: number;
  levels: {
    level: string;
    label: string;
    shortLabel: string;
    monetizable: boolean;
    claimsCausation: boolean;
    description: string;
    methodology: string;
  }[];
  keyRules: string[];
  disclaimer: string;
}

interface ValueApiResponse {
  ok: boolean;
  data: ApiValueEvent[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  summary: {
    confirmedCents: number;
    associatedCents: number;
    estimatedCents: number;
    disputedCount: number;
    excludedCount: number;
  };
  methodology: ApiMethodology;
}

// ─── Convert API data to component types ───────────────────────

function apiToValueEvent(api: ApiValueEvent): ValueType {
  return {
    id: api.id,
    event: api.event,
    studentId: api.member?.id ?? "",
    studentName: api.member?.name ?? "Unknown",
    intervention: api.intervention?.trigger ?? "Intervention",
    evidence: api.formula ?? "No evidence",
    attributionLevel: mapAttributionLevel(api.attributionLevel),
    monetaryValue: api.amountCents / 100,
    date: api.createdAt,
  };
}

function mapAttributionLevel(level: string): AttributionLevel {
  if (level === "confirmed") return "confirmed";
  if (level === "strongly_associated") return "strongly_associated";
  if (level === "estimated") return "estimated";
  if (level === "observed") return "observed";
  return "estimated"; // fallback
}

// ─── Component ─────────────────────────────────────────────────

interface ValuePageClientProps {
  companyId: string;
}

export function ValuePageClient({ companyId }: ValuePageClientProps) {
  const [data, setData] = useState<ValueApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [disputeDialog, setDisputeDialog] = useState<{
    eventId: string;
    action: "dispute" | "exclude" | "restore";
    eventLabel: string;
  } | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Fetch value data on mount
  const fetchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/dashboard/${companyId}/value?pageSize=100`);
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed to fetch value data (${res.status})`);
        }
        const json: ValueApiResponse = await res.json();
        if (cancelled) return;
        setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load value data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Expose a retry function
    fetchRef.current = () => {
      load();
    };

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const fetchData = useCallback(() => {
    fetchRef.current?.();
  }, []);

  // Convert to component format
  const valueEvents = useMemo(
    () => (data?.data ?? []).map(apiToValueEvent),
    [data],
  );

  const selectedEvent = useMemo(
    () => valueEvents.find((e) => e.id === selectedEventId) ?? null,
    [valueEvents, selectedEventId],
  );

  // Dispute/exclude/restore handler
  const handleDisputeAction = useCallback(
    async (action: "dispute" | "exclude" | "restore", eventId: string, reason: string) => {
      try {
        setDisputeSubmitting(true);
        const res = await fetch(
          `/api/dashboard/${companyId}/value/${eventId}/dispute`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, reason }),
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed to ${action} value event`);
        }
        toast.success(
          action === "dispute"
            ? "Value event disputed"
            : action === "exclude"
              ? "Value event excluded from calculations"
              : "Value event restored",
        );
        setDisputeDialog(null);
        setDisputeReason("");
        fetchData(); // Refresh data
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
      } finally {
        setDisputeSubmitting(false);
      }
    },
    [companyId, fetchData],
  );

  // ─── Loading state ─────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="flex animate-pulse flex-col gap-3">
                <div className="h-4 w-48 bg-[var(--hairline-subtle)]" />
                <div className="h-8 w-32 bg-[var(--hairline-subtle)]" />
                <div className="h-3 w-64 bg-[var(--hairline-subtle)]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="size-8 text-[var(--critical)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            Unable to load value data
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 size-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, methodology } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary tiles ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile
          label="Confirmed"
          value={summary.confirmedCents}
          icon={ShieldCheck}
          iconClass="text-[var(--recovery-green)]"
          evidenceClass="confirmed"
        />
        <SummaryTile
          label="Strongly associated"
          value={summary.associatedCents}
          icon={Scale}
          iconClass="text-[var(--info)]"
          evidenceClass="strongly_associated"
        />
        <SummaryTile
          label="Estimated opportunity"
          value={summary.estimatedCents}
          icon={DollarSign}
          iconClass="text-[var(--warning)]"
          evidenceClass="estimated"
        />
        <SummaryTile
          label="Disputed / Excluded"
          value={null}
          icon={X}
          iconClass="text-[var(--ink-muted)]"
          evidenceClass={null}
          extra={`${summary.disputedCount} disputed · ${summary.excludedCount} excluded`}
        />
      </div>

      {/* ── Attribution Waterfall ──────────────────────────────────── */}
      {valueEvents.length > 0 && (
        <AttributionWaterfall events={valueEvents} />
      )}

      {/* ── ROI Panel ──────────────────────────────────────────────── */}
      <RoiPanel />

      {/* ── Ledger + Evidence Timeline split ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LedgerTable
            events={valueEvents}
            selectedId={selectedEventId}
            onSelect={setSelectedEventId}
          />
        </div>
        <div className="lg:col-span-2">
          <EvidenceTimeline event={selectedEvent} />
        </div>
      </div>

      {/* ── Dispute actions for selected event ─────────────────────── */}
      {selectedEventId && (
        <DisputeActions
          event={data.data.find((e) => e.id === selectedEventId) ?? null}
          onDispute={(action, eventId) =>
            setDisputeDialog({
              eventId,
              action,
              eventLabel: data.data.find((e) => e.id === eventId)?.event ?? "Value event",
            })
          }
        />
      )}

      {/* ── Methodology panel ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <button
            type="button"
            onClick={() => setMethodologyOpen((o) => !o)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Info className="size-4 text-[var(--ink-secondary)]" />
              <CardTitle className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
                Attribution Methodology
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                v{methodology.policyVersion}
              </Badge>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-[var(--ink-muted)] transition-transform",
                methodologyOpen && "rotate-180",
              )}
            />
          </button>
        </CardHeader>
        {methodologyOpen && (
          <CardContent className="flex flex-col gap-4 pt-0">
            {/* Key rules */}
            <div>
              <p className="mb-2 text-[12px] font-semibold text-[var(--ink-primary)]">
                Key Rules
              </p>
              <ul className="flex flex-col gap-1.5">
                {methodology.keyRules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12px] text-[var(--ink-secondary)]"
                  >
                    <span className="mt-1 size-1.5 shrink-0 bg-[var(--ink-muted)]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Level definitions */}
            <div className="flex flex-col gap-3">
              {methodology.levels.map((level) => (
                <div
                  key={level.level}
                  className="border-l-2 border-[var(--hairline)] pl-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[var(--ink-primary)]">
                      {level.label}
                    </span>
                    {level.monetizable && (
                      <Badge className="bg-[var(--recovery-light)] text-[10px] text-[var(--recovery-green)]">
                        Monetizable
                      </Badge>
                    )}
                    {!level.claimsCausation && (
                      <Badge variant="outline" className="text-[10px] text-[var(--ink-muted)]">
                        No causal claim
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                    {level.methodology}
                  </p>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="border-t border-[var(--hairline)] pt-3">
              <p className="text-[11px] leading-relaxed text-[var(--ink-primary)]">
                <span className="font-semibold">Disclaimer:</span>{" "}
                {methodology.disclaimer}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Dispute Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={disputeDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDisputeDialog(null);
            setDisputeReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {disputeDialog?.action === "dispute" && "Dispute value event"}
              {disputeDialog?.action === "exclude" && "Exclude from calculations"}
              {disputeDialog?.action === "restore" && "Restore value event"}
            </DialogTitle>
            <DialogDescription>
              {disputeDialog?.action === "dispute" &&
                `Flag "${disputeDialog?.eventLabel}" as disputed. It will remain visible but marked.`}
              {disputeDialog?.action === "exclude" &&
                `Exclude "${disputeDialog?.eventLabel}" from all value calculations. This is audited and versioned.`}
              {disputeDialog?.action === "restore" &&
                `Restore "${disputeDialog?.eventLabel}" — remove dispute/exclusion status.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for this action (required)..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisputeDialog(null);
                setDisputeReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (disputeDialog && disputeReason.trim()) {
                  handleDisputeAction(
                    disputeDialog.action,
                    disputeDialog.eventId,
                    disputeReason.trim(),
                  );
                }
              }}
              disabled={!disputeReason.trim() || disputeSubmitting}
            >
              {disputeSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Summary Tile ──────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  icon: Icon,
  iconClass,
  evidenceClass,
  extra,
}: {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  evidenceClass: string | null;
  extra?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", iconClass)} />
          <span className="text-[11px] text-[var(--ink-muted)]">{label}</span>
        </div>
        {value !== null ? (
          <p className="font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
            {formatCurrency(value / 100)}
          </p>
        ) : (
          <p className="text-[13px] text-[var(--ink-secondary)]">{extra}</p>
        )}
        {evidenceClass && value !== null && (
          <p className="text-[10px] text-[var(--ink-muted)]">
            Evidence class: {evidenceClass}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dispute Actions ───────────────────────────────────────────

function DisputeActions({
  event,
  onDispute,
}: {
  event: ApiValueEvent | null;
  onDispute: (action: "dispute" | "exclude" | "restore", eventId: string) => void;
}) {
  if (!event) return null;

  return (
    <div className="flex items-center gap-2">
      {!event.disputed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDispute("dispute", event.id)}
          className="text-[11px]"
        >
          <AlertTriangle className="mr-1.5 size-3" />
          Dispute
        </Button>
      )}
      {!event.excluded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDispute("exclude", event.id)}
          className="text-[11px]"
        >
          <EyeOff className="mr-1.5 size-3" />
          Exclude
        </Button>
      )}
      {(event.disputed || event.excluded) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDispute("restore", event.id)}
          className="text-[11px]"
        >
          <Eye className="mr-1.5 size-3" />
          Restore
        </Button>
      )}
      {event.disputed && event.disputeReason && (
        <span className="text-[11px] text-[var(--ink-muted)]">
          Disputed: {event.disputeReason}
        </span>
      )}
    </div>
  );
}
