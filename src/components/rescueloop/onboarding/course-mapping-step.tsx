"use client";

// Course mapping step for the onboarding wizard.
// Shows real provider results with stable IDs, member counts when trustworthy,
// duplicate prevention, previous mapping preservation on provider failure,
// and explicit confirmation before remapping.
// Includes a zero-course state component.

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  BookOpen,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Users,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import type {
  WhopCourseOption,
  WhopProductOption,
} from "@/lib/whop/onboarding-data";
import type { OnboardingState } from "@/lib/onboarding/onboarding-state";

// ─── Props ──────────────────────────────────────────────────────

interface ExistingMapping {
  productId: string;
  courseId: string;
  activationDelayDays: number;
  productName: string;
  courseName: string;
  memberCount?: number;
}

interface CourseMappingStepProps {
  companyId: string;
  organizationId: string;
  onboardingState: OnboardingState;
  courses: WhopCourseOption[];
  products: WhopProductOption[];
  existingMappings: ExistingMapping[];
  whopUnavailable: boolean;
  onMappingComplete: (mapping: {
    courseId: string;
    productId: string;
    courseName: string;
    activationDelayDays: number;
  }) => void;
  onRefresh: () => void;
  onRunDiagnostics: () => void;
}

// ─── Zero-Course State Component ────────────────────────────────

function ZeroCourseState({
  whopUnavailable,
  onRefresh,
  onRunDiagnostics,
}: {
  whopUnavailable: boolean;
  onRefresh: () => void;
  onRunDiagnostics: () => void;
}) {
  return (
    <Card className="border-[var(--warning-light)] bg-[var(--warning-light)]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-lg text-[var(--warning)]">
          <AlertTriangle className="size-4" />
          No courses found
        </CardTitle>
        <CardDescription>
          RescueLoop couldn&apos;t find any courses to map. This is usually fixable
          in a few minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Likely causes */}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[var(--ink-primary)]">
            Likely causes:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-[13px] text-[var(--ink-secondary)]">
            <li>
              <strong>Permissions</strong> — Your Whop API key may not have access
              to course data.
            </li>
            <li>
              <strong>API key issue</strong> — The key might be invalid or expired.
            </li>
            <li>
              <strong>No published courses</strong> — You may not have published any
              courses in Whop yet.
            </li>
          </ul>
        </div>

        {/* Required permissions */}
        <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--ink-secondary)]" />
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-medium text-[var(--ink-primary)]">
                Required permissions
              </p>
              <p className="font-mono text-[11px] text-[var(--ink-secondary)]">
                courses:read, companies:read, experiences:read
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onRefresh}
          >
            <RefreshCw className="size-3.5" />
            Refresh courses
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onRunDiagnostics}
          >
            <HelpCircle className="size-3.5" />
            Run diagnostic test
          </Button>
        </div>

        {/* Support path */}
        <p className="text-[12px] text-[var(--ink-muted)]">
          Still stuck?{" "}
          <a
            href="mailto:support@rescueloop.com"
            className="underline underline-offset-2 hover:text-[var(--ink-primary)]"
          >
            Contact support
          </a>{" "}
          or{" "}
          <a
            href="https://docs.rescueloop.com/onboarding"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[var(--ink-primary)]"
          >
            read the setup guide
            <ExternalLink className="size-3" />
          </a>
          .
        </p>

        {/* Reassurance */}
        <Alert className="border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30">
          <Info className="size-4 text-[var(--recovery-green)]" />
          <AlertTitle className="text-[13px] text-[var(--recovery-green)]">
            No data has been changed
          </AlertTitle>
          <AlertDescription className="text-[12px] text-[var(--ink-secondary)]">
            No messages have been sent and no student records were modified.
            You can safely retry or leave and come back.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ─── Main Course Mapping Step ───────────────────────────────────

export function CourseMappingStep({
  companyId,
  courses,
  products,
  existingMappings,
  whopUnavailable,
  onMappingComplete,
  onRefresh,
  onRunDiagnostics,
}: CourseMappingStepProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [activationDelay, setActivationDelay] = useState("7");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRemapConfirm, setShowRemapConfirm] = useState(false);

  const usingManualCourse = courses.length === 0 && !whopUnavailable;
  const usingManualProduct = products.length === 0;

  // Manual fallback fields
  const [manualCourseName, setManualCourseName] = useState("");
  const [manualCourseId, setManualCourseId] = useState("");
  const [manualProductName, setManualProductName] = useState("");
  const [manualProductId, setManualProductId] = useState("");

  // Check for duplicate mapping
  const isDuplicate = existingMappings.some(
    (m) => m.courseId === selectedCourseId && m.productId === selectedProductId,
  );

  // Check if any mapping already exists for the selected course or product
  const existingForCourse = existingMappings.find(
    (m) => m.courseId === selectedCourseId,
  );
  const existingForProduct = existingMappings.find(
    (m) => m.productId === selectedProductId,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const courseId = usingManualCourse ? manualCourseId.trim() : selectedCourseId;
      const productId = usingManualProduct ? manualProductId.trim() : selectedProductId;
      const courseName = usingManualCourse
        ? manualCourseName.trim()
        : courses.find((c) => c.id === selectedCourseId)?.title ?? "";

      if (!courseId || !productId || !courseName) {
        toast.error("Please select both a course and a product.");
        return;
      }

      const delay = parseInt(activationDelay, 10);
      if (Number.isNaN(delay) || delay < 1) {
        toast.error("Activation delay must be at least 1 day.");
        return;
      }

      // If remapping an existing pair, require explicit confirmation
      if (existingMappings.length > 0 && !showRemapConfirm && !confirming) {
        setShowRemapConfirm(true);
        return;
      }

      setSubmitting(true);
      try {
        onMappingComplete({
          courseId,
          productId,
          courseName,
          activationDelayDays: delay,
        });
      } catch {
        toast.error("Failed to save mapping. Your previous settings are preserved.");
      } finally {
        setSubmitting(false);
        setShowRemapConfirm(false);
        setConfirming(false);
      }
    },
    [
      usingManualCourse,
      usingManualProduct,
      manualCourseId,
      manualProductId,
      manualCourseName,
      selectedCourseId,
      selectedProductId,
      courses,
      activationDelay,
      existingMappings,
      showRemapConfirm,
      confirming,
      onMappingComplete,
    ],
  );

  // Zero-course state
  if (courses.length === 0 && !whopUnavailable) {
    return <ZeroCourseState whopUnavailable={whopUnavailable} onRefresh={onRefresh} onRunDiagnostics={onRunDiagnostics} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Whop unavailable warning */}
      {whopUnavailable && (
        <Alert className="border-[var(--warning-light)] bg-[var(--warning-light)]/30">
          <AlertTriangle className="size-4 text-[var(--warning)]" />
          <AlertTitle className="text-[13px]">Whop API unavailable</AlertTitle>
          <AlertDescription className="text-[12px]">
            Whop credentials aren&apos;t configured. You can still complete setup by
            entering your course and product IDs manually.
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicate prevention warning */}
      {isDuplicate && (
        <Alert className="border-[var(--warning-light)] bg-[var(--warning-light)]/30">
          <AlertTriangle className="size-4 text-[var(--warning)]" />
          <AlertTitle className="text-[13px]">Duplicate mapping</AlertTitle>
          <AlertDescription className="text-[12px]">
            This course and product are already mapped. Submitting again will update
            the activation delay.
          </AlertDescription>
        </Alert>
      )}

      {/* Existing mapping conflict warnings */}
      {existingForCourse && !isDuplicate && (
        <Alert className="border-[var(--info-accent)]/30 bg-[var(--info-accent)]/5">
          <Info className="size-4" />
          <AlertTitle className="text-[13px]">Course already mapped</AlertTitle>
          <AlertDescription className="text-[12px]">
            This course is currently mapped to &ldquo;{existingForCourse.productName}&rdquo;.
            Selecting a different product will remap it.
          </AlertDescription>
        </Alert>
      )}

      {existingForProduct && !isDuplicate && (
        <Alert className="border-[var(--info-accent)]/30 bg-[var(--info-accent)]/5">
          <Info className="size-4" />
          <AlertTitle className="text-[13px]">Product already mapped</AlertTitle>
          <AlertDescription className="text-[12px]">
            This product is currently mapped to &ldquo;{existingForProduct.courseName}&rdquo;.
            Selecting a different course will remap it.
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Course selection ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <BookOpen className="size-4 text-[var(--recovery-green)]" />
              Course
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[var(--ink-muted)]"
              onClick={onRefresh}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Select the Whop course whose students you want to rescue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {usingManualCourse ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <Input
                placeholder="Course name"
                value={manualCourseName}
                onChange={(e) => setManualCourseName(e.target.value)}
              />
              <Input
                placeholder="Whop course ID"
                value={manualCourseId}
                onChange={(e) => setManualCourseId(e.target.value)}
                className="font-mono text-[12px]"
              />
            </div>
          ) : (
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course…" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span>{c.title}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {c.lessonCount} lessons
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* ─── Product selection ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <CreditCard className="size-4 text-[var(--recovery-green)]" />
            Paid product
          </CardTitle>
          <CardDescription>
            Select the Whop product that grants access to this course.
            Only members with this product will be contacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {usingManualProduct ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <Input
                placeholder="Product name"
                value={manualProductName}
                onChange={(e) => setManualProductName(e.target.value)}
              />
              <Input
                placeholder="Whop product ID"
                value={manualProductId}
                onChange={(e) => setManualProductId(e.target.value)}
                className="font-mono text-[12px]"
              />
            </div>
          ) : (
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product…" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <CreditCard className="size-3 text-[var(--ink-muted)]" />
                      <span>{p.title}</span>
                      {p.exists && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          synced
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* ─── Existing mappings table ───────────────────────────── */}
      {existingMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
              Existing mappings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {existingMappings.map((m, i) => (
                <div
                  key={`${m.productId}-${m.courseId}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-[var(--hairline)] p-2.5 text-[13px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[var(--ink-primary)]">
                      {m.productName}
                    </span>
                    <span className="text-[var(--ink-muted)]">→</span>
                    <span className="text-[var(--ink-secondary)]">
                      {m.courseName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.memberCount !== undefined && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--ink-muted)]">
                        <Users className="size-3" />
                        {m.memberCount}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      {m.activationDelayDays}d delay
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Activation delay ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
            Activation delay
          </CardTitle>
          <CardDescription>
            How many days after purchase before RescueLoop starts checking progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-[200px] flex-col gap-1.5">
            <Label className="text-[12px] text-[var(--ink-secondary)]">
              Days after purchase
            </Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={activationDelay}
              onChange={(e) => setActivationDelay(e.target.value)}
              className="font-mono text-[13px]"
            />
            <p className="font-mono text-[11px] text-[var(--ink-muted)]">
              Default: 7 days (private pilot policy)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Remap confirmation ────────────────────────────────── */}
      {showRemapConfirm && (
        <Alert className="border-[var(--warning)]/40 bg-[var(--warning-light)]/30">
          <AlertTriangle className="size-4 text-[var(--warning)]" />
          <AlertTitle className="text-[13px]">Confirm remapping</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 text-[12px]">
            <p>
              You already have {existingMappings.length} mapping
              {existingMappings.length === 1 ? "" : "s"}. Submitting will update the
              configuration. Previous mapping data is preserved.
            </p>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="gap-1.5"
                onClick={() => setConfirming(true)}
              >
                <CheckCircle2 className="size-3.5" />
                Confirm &amp; save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRemapConfirm(false);
                  setConfirming(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Submit ────────────────────────────────────────────── */}
      {!showRemapConfirm && (
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save course mapping
              <CheckCircle2 className="size-4" />
            </>
          )}
        </Button>
      )}
    </form>
  );
}

// Re-export ZeroCourseState for standalone use
export { ZeroCourseState };
