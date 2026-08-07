"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Activity,
  Users,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Link2,
  Mail,
  BookOpen,
  AlertTriangle,
  Sparkles,
  PartyPopper,
  ChevronRight,
  Wifi,
  Target,
  TrendingDown,
  DollarSign,
  MessageSquareHeart,
  GraduationCap,
  Phone,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  RescueLoopLogo,
} from "@/components/brand/logo";
import { SetupWizard, type WizardStep } from "@/components/shared/setup-wizard";

/* ── Local storage key ──────────────────────────────────────────── */
const STORAGE_KEY = "rescueloop-onboarding";

/* ── Types ──────────────────────────────────────────────────────── */

interface SyncToggle {
  label: string;
  icon: LucideIcon;
  enabled: boolean;
}

interface Thresholds {
  inactivityDays: number;
  riskScore: number;
  engagementDrop: number;
  monthlyValue: number;
}

interface PlaybookTemplate {
  id: string;
  name: string;
  icon: LucideIcon;
  urgency: "low" | "medium" | "high";
  description: string;
  previewMessage: string;
}

interface OnboardingState {
  currentStep: number;
  whopConnected: boolean;
  syncToggles: SyncToggle[];
  thresholds: Thresholds;
  selectedPlaybooks: string[];
  launched: boolean;
}

/* ── Default state ──────────────────────────────────────────────── */

const DEFAULT_SYNC_TOGGLES: SyncToggle[] = [
  { label: "Memberships", icon: Users, enabled: true },
  { label: "Course Progress", icon: BookOpen, enabled: true },
  { label: "Payment History", icon: DollarSign, enabled: true },
];

const DEFAULT_THRESHOLDS: Thresholds = {
  inactivityDays: 14,
  riskScore: 60,
  engagementDrop: 30,
  monthlyValue: 50,
};

const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    id: "gentle-checkin",
    name: "Gentle Check-In",
    icon: MessageSquareHeart,
    urgency: "low",
    description:
      "A warm, friendly message to members who haven't engaged recently. Low pressure, high empathy.",
    previewMessage:
      "Hey {{name}}! 👋 We noticed you haven't been around lately — everything okay? We'd love to see you back.",
  },
  {
    id: "progress-nudge",
    name: "Progress Nudge",
    icon: GraduationCap,
    urgency: "medium",
    description:
      "Course-specific encouragement for members who've stalled. Highlights their progress and next steps.",
    previewMessage:
      "{{name}}, you're {{progress}}% through {{course}}! You were doing great — pick up where you left off? 🎯",
  },
  {
    id: "at-risk-intervention",
    name: "At-Risk Intervention",
    icon: Phone,
    urgency: "high",
    description:
      "Direct outreach for high-value members at risk of churning. Personal, urgent, and action-oriented.",
    previewMessage:
      "{{name}}, we've noticed some changes in your engagement and want to make sure you're getting full value. Can we help?",
  },
];

const DEFAULT_STATE: OnboardingState = {
  currentStep: 0,
  whopConnected: false,
  syncToggles: DEFAULT_SYNC_TOGGLES,
  thresholds: DEFAULT_THRESHOLDS,
  selectedPlaybooks: ["gentle-checkin", "progress-nudge", "at-risk-intervention"],
  launched: false,
};

/* ── Helpers ────────────────────────────────────────────────────── */

function loadState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_STATE;
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const URGENCY_COLORS = {
  low: {
    bg: "bg-[var(--recovery-light)]",
    text: "text-[var(--recovery-green)]",
    border: "border-[var(--recovery-green)]/20",
  },
  medium: {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    border: "border-[var(--warning)]/20",
  },
  high: {
    bg: "bg-[var(--critical-light)]",
    text: "text-[var(--critical)]",
    border: "border-[var(--critical)]/20",
  },
};

/* ── Confetti particles ─────────────────────────────────────────── */

function ConfettiBurst() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.2 + Math.random() * 1.2,
    size: 4 + Math.random() * 6,
    color: [
      "var(--recovery-green)",
      "var(--info)",
      "var(--warning)",
      "#E8D5B7",
      "#6BC5A0",
      "#A78BFA",
    ][i % 6],
    rotation: Math.random() * 360,
  }));

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "0%", x: `${p.x}%`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: `${60 + Math.random() * 40}%`,
            x: `${p.x + (Math.random() - 0.5) * 30}%`,
            opacity: 0,
            rotate: p.rotation + 360,
            scale: 0.3,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute top-0"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 1: Welcome
   ════════════════════════════════════════════════════════════════ */

function StepWelcome() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      {/* Brand */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <RescueLoopLogo markSize={44} className="justify-center" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif text-[32px] leading-tight text-[var(--ink-primary)] sm:text-[38px]"
      >
        Welcome to RescueLoop
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ink-secondary)]"
      >
        Automatically detect at-risk members, trigger personalized outreach, and
        recover revenue before it&apos;s lost. Let&apos;s set up your workspace.
      </motion.p>

      {/* Visual illustration using icons */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 grid grid-cols-3 gap-4 w-full max-w-lg"
      >
        {[
          {
            icon: Shield,
            title: "Detect",
            desc: "Spot disengagement early",
            color: "var(--recovery-green)",
          },
          {
            icon: Zap,
            title: "Rescue",
            desc: "Trigger smart playbooks",
            color: "var(--warning)",
          },
          {
            icon: TrendingDown,
            title: "Recover",
            desc: "Save revenue & retention",
            color: "var(--info)",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.5 + i * 0.1,
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Card variant="elevated" interactive className="items-center py-5 gap-3">
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <div
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)`,
                  }}
                >
                  <item.icon className="size-5" style={{ color: item.color }} />
                </div>
                <span className="font-serif text-[14px] font-semibold text-[var(--ink-primary)]">
                  {item.title}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {item.desc}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="mt-8 flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)]"
      >
        <span>Press</span>
        <kbd className="rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-[10px]">
          Enter
        </kbd>
        <span>or click Next to begin</span>
        <ArrowRight className="size-3" />
      </motion.p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 2: Connect Whop
   ════════════════════════════════════════════════════════════════ */

function StepConnectWhop({
  connected,
  onConnect,
  syncToggles,
  onToggleSync,
}: {
  connected: boolean;
  onConnect: () => void;
  syncToggles: SyncToggle[];
  onToggleSync: (index: number) => void;
}) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = useCallback(() => {
    if (connected || connecting) return;
    setConnecting(true);
    setTimeout(() => {
      onConnect();
      setConnecting(false);
    }, 2000);
  }, [connected, connecting, onConnect]);

  return (
    <div className="flex flex-col items-center py-8">
      {/* Heading */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--hairline)] mb-5">
        <Link2 className="size-6 text-[var(--recovery-green)]" />
      </div>

      <h2 className="font-serif text-[24px] text-[var(--ink-primary)] text-center">
        Connect your Whop account
      </h2>
      <p className="mt-2 max-w-md text-center text-[14px] text-[var(--ink-secondary)]">
        Linking Whop lets RescueLoop sync your memberships, course progress, and
        payment data — powering real-time rescue signals.
      </p>

      {/* Connect button / success state */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {connected ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2 rounded-xl border border-[var(--recovery-green)]/20 bg-[var(--recovery-light)] px-5 py-3"
            >
              <CheckCircle2 className="size-5 text-[var(--recovery-green)]" />
              <span className="text-[14px] font-medium text-[var(--recovery-green)]">
                Whop connected successfully
              </span>
            </motion.div>
          ) : (
            <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="rounded-[10px] bg-[var(--ink-primary)] px-8 py-3 text-[14px] font-medium text-white hover:bg-[var(--ink-primary)]/90"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 size-4" />
                    Connect Whop
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sync toggles */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 w-full max-w-sm"
      >
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] text-center">
          Data to sync
        </p>
        <Card
          variant="outline"
          className="gap-0 py-0 divide-y divide-[var(--hairline)]"
        >
          {syncToggles.map((toggle, i) => {
            const Icon = toggle.icon;
            return (
              <div
                key={toggle.label}
                className="flex items-center justify-between px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-[var(--ink-secondary)]" />
                  <span className="text-[13px] text-[var(--ink-primary)]">
                    {toggle.label}
                  </span>
                </div>
                <Switch
                  checked={toggle.enabled}
                  onCheckedChange={() => onToggleSync(i)}
                  aria-label={`Toggle ${toggle.label} sync`}
                />
              </div>
            );
          })}
        </Card>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 3: Configure Rescue Thresholds
   ════════════════════════════════════════════════════════════════ */

function computeFlaggedCount(t: Thresholds): number {
  const base = 247;
  const inactivityFactor = Math.max(0, 1 - (t.inactivityDays - 3) / 57);
  const riskFactor = Math.max(0, 1 - (t.riskScore - 10) / 90);
  const engFactor = Math.max(0, 1 - (t.engagementDrop - 5) / 75);
  const valFactor = Math.max(0, 1 - t.monthlyValue / 500);
  const raw =
    base * 0.35 * inactivityFactor +
    base * 0.25 * riskFactor +
    base * 0.2 * engFactor +
    base * 0.15 * valFactor;
  return Math.max(1, Math.round(raw));
}

function StepThresholds({
  thresholds,
  onChange,
}: {
  thresholds: Thresholds;
  onChange: (key: keyof Thresholds, value: number) => void;
}) {
  const flaggedCount = computeFlaggedCount(thresholds);

  const sliders: {
    key: keyof Thresholds;
    label: string;
    icon: LucideIcon;
    description: string;
    min: number;
    max: number;
    step: number;
    unit: string;
  }[] = [
    {
      key: "inactivityDays",
      label: "Inactivity Threshold",
      icon: Activity,
      description: "Days without engagement before flagging",
      min: 3,
      max: 60,
      step: 1,
      unit: "days",
    },
    {
      key: "riskScore",
      label: "Risk Score Threshold",
      icon: Target,
      description: "Minimum risk score to flag a member",
      min: 10,
      max: 100,
      step: 5,
      unit: "",
    },
    {
      key: "engagementDrop",
      label: "Engagement Drop",
      icon: TrendingDown,
      description: "Minimum % decrease to trigger rescue",
      min: 5,
      max: 80,
      step: 5,
      unit: "%",
    },
    {
      key: "monthlyValue",
      label: "Monthly Value Threshold",
      icon: DollarSign,
      description: "Minimum monthly value ($) to include in rescue",
      min: 0,
      max: 500,
      step: 10,
      unit: "$",
    },
  ];

  return (
    <div className="flex flex-col py-6 gap-6">
      {/* Heading */}
      <div className="text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--hairline)] mx-auto mb-4">
          <Target className="size-5 text-[var(--recovery-green)]" />
        </div>
        <h2 className="font-serif text-[24px] text-[var(--ink-primary)]">
          Set your rescue thresholds
        </h2>
        <p className="mt-2 text-[14px] text-[var(--ink-secondary)]">
          These determine which members get flagged for rescue. You can adjust
          anytime.
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-5 max-w-lg mx-auto w-full">
        {sliders.map((s) => {
          const Icon = s.icon;
          const value = thresholds[s.key];
          return (
            <Card key={s.key} variant="outline" className="gap-3 py-4">
              <CardContent className="px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-[var(--ink-secondary)]" />
                    <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                      {s.label}
                    </span>
                  </div>
                  <span className="font-mono text-[14px] font-semibold text-[var(--recovery-green)]">
                    {s.unit === "$"
                      ? `$${value}`
                      : `${value}${s.unit ? ` ${s.unit}` : ""}`}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] mb-3">
                  {s.description}
                </p>
                <Slider
                  value={[value]}
                  onValueChange={([v]) => onChange(s.key, v)}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  className="[&>[data-slot=slider-track]]:h-2 [&>[data-slot=slider-track]]:rounded-full [&>[data-slot=slider-range]]:rounded-full [&>[data-slot=slider-range]]:bg-[var(--recovery-green)] [&>[data-slot=slider-thumb]]:size-5 [&>[data-slot=slider-thumb]]:border-[var(--recovery-green)] [&>[data-slot=slider-thumb]]:shadow-md"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[var(--ink-muted)]">
                    {s.unit === "$"
                      ? `$${s.min}`
                      : `${s.min}${s.unit ? ` ${s.unit}` : ""}`}
                  </span>
                  <span className="text-[10px] text-[var(--ink-muted)]">
                    {s.unit === "$"
                      ? `$${s.max}`
                      : `${s.max}${s.unit ? ` ${s.unit}` : ""}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="max-w-lg mx-auto w-full"
      >
        <Card variant="elevated" className="items-center py-4 gap-2">
          <CardContent className="flex items-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--recovery-light)]">
              <Users className="size-4 text-[var(--recovery-green)]" />
            </div>
            <div className="text-left">
              <span className="font-mono text-[18px] font-bold text-[var(--recovery-green)]">
                {flaggedCount}
              </span>
              <span className="text-[13px] text-[var(--ink-secondary)] ml-1.5">
                members would be flagged with these settings
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 4: Setup Playbooks
   ════════════════════════════════════════════════════════════════ */

function StepPlaybooks({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col py-6 gap-6">
      {/* Heading */}
      <div className="text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--hairline)] mx-auto mb-4">
          <BookOpen className="size-5 text-[var(--recovery-green)]" />
        </div>
        <h2 className="font-serif text-[24px] text-[var(--ink-primary)]">
          Create your first playbooks
        </h2>
        <p className="mt-2 text-[14px] text-[var(--ink-secondary)]">
          Playbooks are automated rescue workflows. Choose templates to get
          started — you can customize them later.
        </p>
      </div>

      {/* Template cards */}
      <div className="space-y-4 max-w-lg mx-auto w-full">
        {PLAYBOOK_TEMPLATES.map((template, i) => {
          const isSelected = selected.includes(template.id);
          const Icon = template.icon;
          const urgencyStyle = URGENCY_COLORS[template.urgency];

          return (
            <motion.div
              key={template.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.1 + i * 0.08,
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <button
                type="button"
                onClick={() => onToggle(template.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all duration-200",
                  "bg-[var(--surface)] hover:bg-[var(--surface-hover)]",
                  isSelected
                    ? "border-[var(--recovery-green)] shadow-[0_0_0_1px_var(--recovery-green)]"
                    : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon + checkmark */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg transition-colors",
                        isSelected
                          ? "bg-[var(--recovery-light)]"
                          : "bg-[var(--canvas-elevated)]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 transition-colors",
                          isSelected
                            ? "text-[var(--recovery-green)]"
                            : "text-[var(--ink-secondary)]",
                        )}
                      />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--recovery-green)]"
                      >
                        <Check className="size-2.5 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-[var(--ink-primary)]">
                        {template.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-[3px] text-[9px] uppercase tracking-[0.04em]",
                          urgencyStyle.text,
                          urgencyStyle.border,
                        )}
                      >
                        {template.urgency}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-[var(--ink-secondary)] mb-2">
                      {template.description}
                    </p>
                    {/* Preview message */}
                    <div className="rounded-lg bg-[var(--canvas-elevated)] border border-[var(--hairline)] p-2.5">
                      <p className="text-[11px] text-[var(--ink-muted)] italic leading-relaxed">
                        &ldquo;{template.previewMessage}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[12px] text-[var(--critical)]"
        >
          Please select at least one playbook to continue.
        </motion.p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 5: Review & Launch
   ════════════════════════════════════════════════════════════════ */

function StepReview({
  whopConnected,
  syncToggles,
  thresholds,
  selectedPlaybooks,
  launched,
  onLaunch,
}: {
  whopConnected: boolean;
  syncToggles: SyncToggle[];
  thresholds: Thresholds;
  selectedPlaybooks: string[];
  launched: boolean;
  onLaunch: () => void;
}) {
  const router = useRouter();
  const params = useParams<{ companyId: string }>();

  if (launched) {
    return (
      <div className="flex flex-col items-center py-12 text-center relative">
        <ConfettiBurst />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="flex size-20 items-center justify-center rounded-full bg-[var(--recovery-light)]">
            <PartyPopper className="size-9 text-[var(--recovery-green)]" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="font-serif text-[28px] text-[var(--ink-primary)]"
        >
          You&apos;re all set! 🎉
        </motion.h2>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-2 max-w-sm text-[14px] text-[var(--ink-secondary)]"
        >
          RescueLoop is now monitoring your members and ready to rescue at the
          first sign of disengagement.
        </motion.p>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-8"
        >
          <Button
            onClick={() => router.push(`/dashboard/${params.companyId}`)}
            className="rounded-[10px] bg-[var(--recovery-green)] px-8 py-3 text-[14px] font-medium text-white hover:bg-[var(--recovery-green)]/90"
          >
            Go to Dashboard
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-6 gap-6">
      {/* Heading */}
      <div className="text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--canvas-elevated)] border border-[var(--hairline)] mx-auto mb-4">
          <Sparkles className="size-5 text-[var(--recovery-green)]" />
        </div>
        <h2 className="font-serif text-[24px] text-[var(--ink-primary)]">
          Review your setup
        </h2>
        <p className="mt-2 text-[14px] text-[var(--ink-secondary)]">
          Here&apos;s a summary of your configuration. Click Launch to start
          rescuing members.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-4 max-w-lg mx-auto w-full">
        {/* Whop connection */}
        <Card variant="outline" className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-[14px]">
              <Wifi className="size-4 text-[var(--recovery-green)]" />
              Whop Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              {whopConnected ? (
                <>
                  <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
                  <span className="text-[13px] text-[var(--recovery-green)]">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <Circle className="size-4 text-[var(--ink-muted)]" />
                  <span className="text-[13px] text-[var(--ink-muted)]">
                    Not connected
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {syncToggles
                .filter((t) => t.enabled)
                .map((t) => (
                  <Badge
                    key={t.label}
                    variant="secondary"
                    className="rounded-[3px] text-[10px]"
                  >
                    {t.label}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card variant="outline" className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-[14px]">
              <Target className="size-4 text-[var(--recovery-green)]" />
              Rescue Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[var(--canvas-elevated)] p-2.5">
                <span className="text-[10px] text-[var(--ink-muted)]">
                  Inactivity
                </span>
                <p className="font-mono text-[14px] font-semibold text-[var(--ink-primary)]">
                  {thresholds.inactivityDays} days
                </p>
              </div>
              <div className="rounded-lg bg-[var(--canvas-elevated)] p-2.5">
                <span className="text-[10px] text-[var(--ink-muted)]">
                  Risk Score
                </span>
                <p className="font-mono text-[14px] font-semibold text-[var(--ink-primary)]">
                  {thresholds.riskScore}+
                </p>
              </div>
              <div className="rounded-lg bg-[var(--canvas-elevated)] p-2.5">
                <span className="text-[10px] text-[var(--ink-muted)]">
                  Engagement Drop
                </span>
                <p className="font-mono text-[14px] font-semibold text-[var(--ink-primary)]">
                  {thresholds.engagementDrop}%+
                </p>
              </div>
              <div className="rounded-lg bg-[var(--canvas-elevated)] p-2.5">
                <span className="text-[10px] text-[var(--ink-muted)]">
                  Monthly Value
                </span>
                <p className="font-mono text-[14px] font-semibold text-[var(--ink-primary)]">
                  ${thresholds.monthlyValue}+
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playbooks */}
        <Card variant="outline" className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-[14px]">
              <BookOpen className="size-4 text-[var(--recovery-green)]" />
              Selected Playbooks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="space-y-2">
              {PLAYBOOK_TEMPLATES.filter((t) =>
                selectedPlaybooks.includes(t.id),
              ).map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.id} className="flex items-center gap-2.5">
                    <Icon className="size-4 text-[var(--ink-secondary)]" />
                    <span className="text-[13px] text-[var(--ink-primary)]">
                      {t.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-auto rounded-[3px] text-[9px] uppercase tracking-[0.04em]",
                        URGENCY_COLORS[t.urgency].text,
                        URGENCY_COLORS[t.urgency].border,
                      )}
                    >
                      {t.urgency}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Launch button */}
        <div className="pt-2">
          <Button
            onClick={onLaunch}
            className="w-full rounded-[10px] bg-[var(--recovery-green)] py-3 text-[14px] font-medium text-white hover:bg-[var(--recovery-green)]/90"
          >
            <Sparkles className="mr-2 size-4" />
            Launch RescueLoop
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE: Onboarding Wizard
   ════════════════════════════════════════════════════════════════ */

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams<{ companyId: string }>();

  /* ── State (persisted to localStorage) ──────────────────────── */
  const [state, setState] = useState<OnboardingState>(() => loadState());
  const [direction, setDirection] = useState<1 | -1>(1);

  // Persist to localStorage on change (only on client)
  useEffect(() => {
    saveState(state);
  }, [state]);

  /* ── Callbacks ──────────────────────────────────────────────── */
  const handleStepChange = useCallback(
    (step: number) => {
      setDirection(step > state.currentStep ? 1 : -1);
      setState((prev) => ({ ...prev, currentStep: step }));
    },
    [state.currentStep],
  );

  const handleWhopConnect = useCallback(() => {
    setState((prev) => ({ ...prev, whopConnected: true }));
  }, []);

  const handleToggleSync = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      syncToggles: prev.syncToggles.map((t, i) =>
        i === index ? { ...t, enabled: !t.enabled } : t,
      ),
    }));
  }, []);

  const handleThresholdChange = useCallback(
    (key: keyof Thresholds, value: number) => {
      setState((prev) => ({
        ...prev,
        thresholds: { ...prev.thresholds, [key]: value },
      }));
    },
    [],
  );

  const handleTogglePlaybook = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedPlaybooks: prev.selectedPlaybooks.includes(id)
        ? prev.selectedPlaybooks.filter((p) => p !== id)
        : [...prev.selectedPlaybooks, id],
    }));
  }, []);

  const handleLaunch = useCallback(() => {
    setState((prev) => ({ ...prev, launched: true }));
    // Clear onboarding from localStorage after launch
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const handleComplete = useCallback(() => {
    // Navigate to dashboard after completion
    router.push(`/dashboard/${params.companyId}`);
  }, [router, params.companyId]);

  /* ── Step validation ────────────────────────────────────────── */
  const canAdvance =
    state.currentStep === 0
      ? true
      : state.currentStep === 1
        ? true // can proceed without connecting (but recommended)
        : state.currentStep === 3
          ? state.selectedPlaybooks.length > 0
          : true;

  const isLastStep = state.currentStep === 4 && state.launched;

  /* ── Steps ──────────────────────────────────────────────────── */
  const steps: WizardStep[] = [
    {
      id: "welcome",
      label: "Welcome",
      content: <StepWelcome />,
    },
    {
      id: "connect-whop",
      label: "Connect Whop",
      content: (
        <StepConnectWhop
          connected={state.whopConnected}
          onConnect={handleWhopConnect}
          syncToggles={state.syncToggles}
          onToggleSync={handleToggleSync}
        />
      ),
    },
    {
      id: "thresholds",
      label: "Rescue Thresholds",
      content: (
        <StepThresholds
          thresholds={state.thresholds}
          onChange={handleThresholdChange}
        />
      ),
    },
    {
      id: "playbooks",
      label: "Playbooks",
      content: (
        <StepPlaybooks
          selected={state.selectedPlaybooks}
          onToggle={handleTogglePlaybook}
        />
      ),
    },
    {
      id: "review",
      label: "Review & Launch",
      content: (
        <StepReview
          whopConnected={state.whopConnected}
          syncToggles={state.syncToggles}
          thresholds={state.thresholds}
          selectedPlaybooks={state.selectedPlaybooks}
          launched={state.launched}
          onLaunch={handleLaunch}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card variant="elevated" className="overflow-hidden py-0 gap-0">
        <SetupWizard
          steps={steps}
          currentStep={state.currentStep}
          direction={direction}
          onStepChange={handleStepChange}
          onComplete={handleComplete}
          canAdvance={canAdvance}
          isLastStep={isLastStep}
          finishLabel="Launch RescueLoop"
        />
      </Card>
    </div>
  );
}
