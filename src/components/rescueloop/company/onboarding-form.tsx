"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { InlineWarningCallout } from "@/components/rescueloop/company/state-cards";
import {
  BookOpen,
  CreditCard,
  Radio,
  Clock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import type {
  WhopCourseOption,
  WhopProductOption,
  WhopExperienceOption,
} from "@/lib/whop/onboarding-data";

interface ExistingMapping {
  productId: string;
  courseId: string;
  activationDelayDays: number;
  productName: string;
  courseName: string;
}

interface OnboardingFormProps {
  companyId: string;
  courses: WhopCourseOption[];
  products: WhopProductOption[];
  experiences: WhopExperienceOption[];
  existingMappings: ExistingMapping[];
  whopUnavailable: boolean;
}

export function OnboardingForm({
  companyId,
  courses,
  products,
  experiences,
  existingMappings,
  whopUnavailable,
}: OnboardingFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Selections
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>("");

  // Manual-entry fallbacks (shown when Whop returns no courses/products)
  const [manualCourseName, setManualCourseName] = useState("");
  const [manualCourseId, setManualCourseId] = useState("");
  const [manualProductName, setManualProductName] = useState("");
  const [manualProductId, setManualProductId] = useState("");
  const [manualLessonCount, setManualLessonCount] = useState("29");

  // Safety config
  const [activationDelayDays, setActivationDelayDays] = useState("7");
  const [cooldownDays, setCooldownDays] = useState("14");
  const [maxMessages, setMaxMessages] = useState("2");
  const [quietStart, setQuietStart] = useState("20:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  const usingManualCourse = courses.length === 0;
  const usingManualProduct = products.length === 0;

  const alreadyMapped = existingMappings.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Resolve the final values
    const whopCourseId = usingManualCourse ? manualCourseId.trim() : selectedCourseId;
    const courseName = usingManualCourse
      ? manualCourseName.trim()
      : courses.find((c) => c.id === selectedCourseId)?.title ?? "";
    const lessonCount = usingManualCourse
      ? parseInt(manualLessonCount || "0", 10)
      : courses.find((c) => c.id === selectedCourseId)?.lessonCount ?? 0;

    const whopProductId = usingManualProduct
      ? manualProductId.trim()
      : selectedProductId;
    const productName = usingManualProduct
      ? manualProductName.trim()
      : products.find((p) => p.id === selectedProductId)?.title ?? "";

    const externalExperienceId = selectedExperienceId || null;

    if (!whopCourseId || !courseName || !whopProductId || !productName) {
      toast.error("Please select a course and a product before continuing.");
      return;
    }

    const activationDelay = parseInt(activationDelayDays, 10);
    const cooldown = parseInt(cooldownDays, 10);
    const maxMsg = parseInt(maxMessages, 10);

    if (
      Number.isNaN(activationDelay) ||
      Number.isNaN(cooldown) ||
      Number.isNaN(maxMsg)
    ) {
      toast.error("Safety fields must be whole numbers.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/onboarding`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            whopProductId,
            productName,
            whopCourseId,
            courseName,
            externalExperienceId,
            lessonCount,
            activationDelayDays: activationDelay,
            cooldownDays: cooldown,
            maxMessagesPerStudent: maxMsg,
            quietHoursStart: quietStart,
            quietHoursEnd: quietEnd,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Onboarding failed.");
        return;
      }

      toast.success("Activation Rescue campaign created.");
      router.refresh();
    } catch (error) {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {whopUnavailable && (
        <InlineWarningCallout message="Whop API credentials aren't configured. You can still complete onboarding by entering your course and product IDs manually below." />
      )}

      {alreadyMapped && (
        <InlineWarningCallout message={`${existingMappings.length} confirmed product→course mapping${existingMappings.length === 1 ? "" : "s"} already exist${existingMappings.length === 1 ? "s" : ""}. Submitting again will update the activation delay for the same pair.`} />
      )}

      {/* ─── Course + product mapping ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <BookOpen className="size-4 text-[var(--recovery-green)]" />
            Course &amp; product mapping
          </CardTitle>
          <CardDescription>
            Select one Whop course and the paid product that grants access to
            it. RescueLoop will only contact members who purchased this
            product.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Course */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-select" className="text-[13px]">
              Whop course
            </Label>
            {usingManualCourse ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_140px_100px]">
                <Input
                  placeholder="Course name (e.g. Creator Growth Accelerator)"
                  value={manualCourseName}
                  onChange={(e) => setManualCourseName(e.target.value)}
                />
                <Input
                  placeholder="Whop course ID"
                  value={manualCourseId}
                  onChange={(e) => setManualCourseId(e.target.value)}
                  className="font-mono text-[12px]"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Lessons"
                  value={manualLessonCount}
                  onChange={(e) => setManualLessonCount(e.target.value)}
                  className="font-mono text-[12px]"
                />
              </div>
            ) : (
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger id="course-select">
                  <SelectValue placeholder="Select a course…" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span>{c.title}</span>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                          {c.lessonCount} lessons
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Product */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-select" className="text-[13px]">
              Paid product
            </Label>
            {usingManualProduct ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
                <Input
                  placeholder="Product name (e.g. Growth Membership)"
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
                <SelectTrigger id="product-select">
                  <SelectValue placeholder="Select a product…" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <CreditCard className="size-3.5 text-[var(--ink-muted)]" />
                        <span>{p.title}</span>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                          {p.id}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Experience (optional, used for notification delivery) */}
          {experiences.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="experience-select" className="text-[13px]">
                Experience{" "}
                <span className="text-[var(--ink-muted)]">
                  (for notification delivery)
                </span>
              </Label>
              <Select
                value={selectedExperienceId}
                onValueChange={setSelectedExperienceId}
              >
                <SelectTrigger id="experience-select">
                  <SelectValue placeholder="Select an experience…" />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center gap-2">
                        <span>{e.name}</span>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                          {e.id}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Safety configuration ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
            Safety configuration
          </CardTitle>
          <CardDescription>
            Defaults match the private pilot policy. Tighten if your members
            prefer fewer touches.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConfigField
              label="Activation delay"
              hint="days after purchase"
              value={activationDelayDays}
              onChange={setActivationDelayDays}
              icon={Clock}
            />
            <ConfigField
              label="Cooldown"
              hint="days between messages"
              value={cooldownDays}
              onChange={setCooldownDays}
              icon={Clock}
            />
            <ConfigField
              label="Max messages"
              hint="per member, per month"
              value={maxMessages}
              onChange={setMaxMessages}
              icon={Radio}
            />
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] text-[var(--ink-secondary)]">
                Quiet hours
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="font-mono text-[12px]"
                />
                <span className="text-[12px] text-[var(--ink-muted)]">→</span>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="font-mono text-[12px]"
                />
              </div>
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                no sends in this window
              </p>
            </div>
          </div>

          {/* Manual approval — always on */}
          <div className="flex items-start gap-3 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--recovery-light)]">
              <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="manual-approval"
                  className="text-[13px] font-medium"
                >
                  Manual approval required
                </Label>
                <Switch id="manual-approval" checked disabled />
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">
                Every intervention is reviewed by you before it&rsquo;s sent.
                This is mandatory during the private pilot.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary + submit ─────────────────────────────────── */}
      <Card className="border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/30">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                Ready to create your Activation Rescue campaign
              </p>
              <p className="font-mono text-[12px] text-[var(--ink-secondary)]">
                {activationDelayDays}d delay · {cooldownDays}d cooldown ·{" "}
                {maxMessages} max msgs · quiet {quietStart}–{quietEnd}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Confirm &amp; create campaign
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function ConfigField({
  label,
  hint,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  icon: typeof Clock;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1.5 text-[12px] text-[var(--ink-secondary)]">
        <Icon className="size-3" />
        {label}
      </Label>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-[13px]"
      />
      <p className="font-mono text-[11px] text-[var(--ink-muted)]">{hint}</p>
    </div>
  );
}
