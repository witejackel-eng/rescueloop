"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface AppToast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  createdAt: number;
}

// ── Icon + color maps ──────────────────────────────────────────

const TOAST_ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_ICON_COLORS: Record<ToastType, string> = {
  success: "text-[var(--recovery-green)]",
  error: "text-[var(--critical)]",
  warning: "text-[var(--warning)]",
  info: "text-[var(--info)]",
};

const TOAST_BORDER_COLORS: Record<ToastType, string> = {
  success: "border-l-[var(--recovery-green)]",
  error: "border-l-[var(--critical)]",
  warning: "border-l-[var(--warning)]",
  info: "border-l-[var(--info)]",
};

// ── Global state ───────────────────────────────────────────────

let toastList: AppToast[] = [];
let toastListeners: Array<() => void> = [];

function emitChange() {
  toastListeners.forEach((l) => l());
}

let idCounter = 0;
function genId(): string {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${idCounter}`;
}

// ── Public API: show toasts ────────────────────────────────────

const DEFAULT_DURATION = 5000;

export function showToast(
  type: ToastType,
  title: string,
  options?: {
    description?: string;
    action?: ToastAction;
    duration?: number;
  },
) {
  const id = genId();
  const newToast: AppToast = {
    id,
    type,
    title,
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? DEFAULT_DURATION,
    createdAt: Date.now(),
  };
  toastList = [newToast, ...toastList].slice(0, 5); // max 5 stacked
  emitChange();

  // Auto-dismiss
  setTimeout(() => {
    dismissToast(id);
  }, newToast.duration);

  return id;
}

export function showSuccess(title: string, description?: string, action?: ToastAction) {
  return showToast("success", title, { description, action });
}

export function showError(title: string, description?: string, action?: ToastAction) {
  return showToast("error", title, { description, action });
}

export function showWarning(title: string, description?: string, action?: ToastAction) {
  return showToast("warning", title, { description, action });
}

export function showInfo(title: string, description?: string, action?: ToastAction) {
  return showToast("info", title, { description, action });
}

export function dismissToast(id: string) {
  toastList = toastList.filter((t) => t.id !== id);
  emitChange();
}

export function dismissAllToasts() {
  toastList = [];
  emitChange();
}

// ── Animation variants ─────────────────────────────────────────

const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.2 },
  },
};

// ── Single toast component ─────────────────────────────────────

function ToastItem({ toast: t }: { toast: AppToast }) {
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(t.createdAt);
  const Icon = TOAST_ICONS[t.type];

  // Progress bar countdown
  useEffect(() => {
    startTimeRef.current = Date.now();
    const duration = t.duration ?? DEFAULT_DURATION;
    const interval = 50; // update every 50ms
    const id = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(id);
      }
    }, interval);
    return () => clearInterval(id);
  }, [t.duration, t.id]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "relative flex items-start gap-3 rounded-lg border border-[var(--hairline)] border-l-[3px] bg-[var(--surface)] shadow-lg p-4 min-w-[280px] max-w-[420px]",
        TOAST_BORDER_COLORS[t.type],
      )}
    >
      {/* Icon */}
      <span className={cn("shrink-0 mt-0.5", TOAST_ICON_COLORS[t.type])}>
        <Icon className="size-4" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--ink-primary)] leading-snug">
          {t.title}
        </p>
        {t.description && (
          <p className="mt-1 text-[12px] text-[var(--ink-secondary)] leading-snug">
            {t.description}
          </p>
        )}
        {t.action && (
          <button
            onClick={t.action.onClick}
            className="mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--recovery-green)] bg-[var(--recovery-green)]/10 hover:bg-[var(--recovery-green)]/20 transition-colors"
          >
            {t.action.label}
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => dismissToast(t.id)}
        className="shrink-0 rounded-md p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)] transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-3" />
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden"
        aria-hidden
      >
        <div
          className={cn(
            "h-full transition-all duration-100 ease-linear",
            t.type === "success" && "bg-[var(--recovery-green)]",
            t.type === "error" && "bg-[var(--critical)]",
            t.type === "warning" && "bg-[var(--warning)]",
            t.type === "info" && "bg-[var(--info)]",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// ── Provider component ─────────────────────────────────────────

export function ToastProvider() {
  const [toasts, setToasts] = useState<AppToast[]>(toastList);

  useEffect(() => {
    const listener = () => setToasts([...toastList]);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div
      className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
