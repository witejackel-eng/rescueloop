"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  Eye,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";

export interface ThresholdPreview {
  candidateCount: number;
  totalMembers: number;
  percentage: number;
  samples: Array<{
    name: string;
    email: string;
    inactivityDays: number;
    courseName: string;
  }>;
}

interface ThresholdStepProps {
  /** Currently selected threshold in days. */
  value: number;
  /** Called when the user changes the threshold. */
  onChange: (days: number) => void;
  /** Fetch preview data for a given threshold. */
  onPreview: (days: number) => Promise<ThresholdPreview>;
  /** Advance to next step. */
  onNext: () => void;
  /** Go back to previous step. */
  onBack: () => void;
}

export function ThresholdStep({
  value,
  onChange,
  onPreview,
  onNext,
  onBack,
}: ThresholdStepProps) {
  const [preview, setPreview] = useState<ThresholdPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await onPreview(value);
      setPreview(data);
      setShowPreview(true);
    } finally {
      setLoading(false);
    }
  }, [value, onPreview]);

  const handleSliderChange = (vals: number[]) => {
    onChange(vals[0]);
    setShowPreview(false);
    setPreview(null);
  };

  const cooldownDays = Math.max(value, 14);
  const quietHoursLabel = "20:00–08:00";

  return (
    <div className="flex flex-col gap-6">
      {/* Main threshold card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Clock className="size-4 text-[var(--recovery-green)]" />
            Inactivity threshold
            <Badge
              variant="secondary"
              className="ml-1 bg-[var(--recovery-light)] text-[var(--recovery-green)] border border-[var(--recovery-green)]/20 text-[11px]"
            >
              Hypothesis
            </Badge>
          </CardTitle>
          <CardDescription>
            Members inactive for this many days become recovery candidates. This
            is your initial hypothesis — you can adjust it later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Slider */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-[13px] font-medium text-[var(--ink-primary)]">
                Days of inactivity
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={value}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= 90) {
                      onChange(v);
                      setShowPreview(false);
                      setPreview(null);
                    }
                  }}
                  className="w-16 text-center font-mono text-[13px]"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">days</span>
              </div>
            </div>
            <Slider
              value={[value]}
              onValueChange={handleSliderChange}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-[var(--ink-muted)]">
              <span>1 day (aggressive)</span>
              <span>30 days (conservative)</span>
            </div>
          </div>

          {/* Default suggestion */}
          {value === 7 && (
            <div className="flex items-start gap-2.5 rounded-md border border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/40 p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                  Suggested — based on common course patterns
                </p>
                <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                  7 days catches members who likely intended to continue but
                  lost momentum. Most courses see meaningful drop-off after
                  one week of inactivity.
                </p>
              </div>
            </div>
          )}

          {/* Safety implications */}
          <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-4">
            <p className="mb-2 text-[13px] font-medium text-[var(--ink-primary)]">
              Safety implications at {value} days
            </p>
            <div className="grid gap-3 text-[12px] text-[var(--ink-secondary)] sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--recovery-green)]" />
                <span>
                  Cooldown: <strong className="font-mono">{cooldownDays}d</strong> between
                  messages per member
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--recovery-green)]" />
                <span>
                  Quiet hours: <strong className="font-mono">{quietHoursLabel}</strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--recovery-green)]" />
                <span>
                  Max <strong className="font-mono">2</strong> messages per member per month
                </span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--warning)]" />
                <span>
                  Lower thresholds may include members who are still
                  considering
                </span>
              </div>
            </div>
          </div>

          {/* Preview button */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? (
              <>Loading preview…</>
            ) : (
              <>
                <Eye className="size-4" />
                Preview candidates at {value} days
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview results */}
      {showPreview && preview && (
        <Card className="border-[var(--recovery-green)]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-[var(--recovery-green)]" />
              Candidate preview
            </CardTitle>
            <CardDescription>
              At {value} days of inactivity, these members would be flagged as
              recovery candidates.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface)] p-3">
                <span className="font-mono text-2xl font-semibold text-[var(--ink-primary)]">
                  {preview.candidateCount}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">Candidates</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface)] p-3">
                <span className="font-mono text-2xl font-semibold text-[var(--ink-primary)]">
                  {preview.percentage.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">Of total members</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface)] p-3">
                <span className="font-mono text-2xl font-semibold text-[var(--ink-primary)]">
                  {preview.totalMembers}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">Total members</span>
              </div>
            </div>

            {/* Sample candidates */}
            {preview.samples.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-medium text-[var(--ink-secondary)]">
                  Sample candidates
                </p>
                <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--hairline)]">
                  {preview.samples.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-b border-[var(--hairline)] px-3 py-2 last:border-b-0"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--canvas-elevated)]">
                        <span className="text-[11px] font-semibold text-[var(--ink-secondary)]">
                          {s.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                          {s.name}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                          {s.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[12px] text-[var(--ink-secondary)]">
                          {s.inactivityDays}d inactive
                        </p>
                        <p className="text-[11px] text-[var(--ink-muted)]">
                          {s.courseName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 rounded-md border border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/40 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
              <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                <span className="font-medium text-[var(--ink-primary)]">
                  Nothing has been sent.
                </span>{" "}
                Previewing never generates or sends a message. Candidates will
                appear in your Rescue Queue for review.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continue with {value}-day threshold
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
